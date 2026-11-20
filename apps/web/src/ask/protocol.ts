import { z } from 'zod';

// The wire format between the Ask Marquee dialog and `POST /api/ask`. The server streams one JSON
// event per line (NDJSON); both sides validate against these schemas.

export const maxAskMessages = 12;
export const maxAskMessageLength = 600;

export const askHistoryMessage = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().trim().min(1).max(maxAskMessageLength),
  /** Movies shown on an assistant turn, so follow-ups can refer to them. */
  shownIds: z.array(z.number().int().positive()).max(8).optional(),
});

export const askRequest = z.object({
  messages: z
    .array(askHistoryMessage)
    .min(1)
    .max(maxAskMessages)
    .refine((messages) => messages.at(-1)?.role === 'user', {
      message: 'The last message must come from the viewer.',
    }),
});

export type AskHistoryMessage = z.infer<typeof askHistoryMessage>;
export type AskRequest = z.infer<typeof askRequest>;

export const askWatch = z.object({
  /** "Watch on Netflix", "Rent on Apple TV", "In theaters". */
  label: z.string(),
  /** TMDB's watch page for the viewer's country, which links out to each provider. */
  url: z.string().url().nullable(),
});

export const askPick = z.object({
  id: z.number().int(),
  title: z.string(),
  year: z.number().int().nullable(),
  runtime: z.number().int().nullable(),
  score: z.number().int(),
  genres: z.array(z.string()),
  overview: z.string(),
  backdropPath: z.string().nullable(),
  posterPath: z.string().nullable(),
  /** The model's one-line reason for this pick. */
  reason: z.string(),
  watch: askWatch.nullable(),
});

export type AskPick = z.infer<typeof askPick>;
export type AskWatch = z.infer<typeof askWatch>;

export const askErrorCode = z.enum([
  'bad_request',
  'rate_limited',
  'busy',
  'refused',
  'unavailable',
  'failed',
]);

export type AskErrorCode = z.infer<typeof askErrorCode>;

export const askEvent = z.discriminatedUnion('type', [
  z.object({ type: z.literal('status'), label: z.string() }),
  z.object({ type: z.literal('text'), delta: z.string() }),
  z.object({ type: z.literal('picks'), movies: z.array(askPick) }),
  z.object({ type: z.literal('done') }),
  z.object({ type: z.literal('error'), message: z.string(), code: askErrorCode }),
]);

export type AskEvent = z.infer<typeof askEvent>;

export const encodeAskEvent = (event: AskEvent) => `${JSON.stringify(event)}\n`;

/**
 * Splits a stream of text chunks into validated events. Chunks may end mid-line; the remainder is
 * held until the next chunk completes it. Lines that are not valid events are skipped.
 */
export async function* readAskEvents(chunks: AsyncIterable<string>): AsyncGenerator<AskEvent> {
  let buffer = '';
  for await (const chunk of chunks) {
    buffer += chunk;
    let newline = buffer.indexOf('\n');
    while (newline !== -1) {
      const event = parseAskLine(buffer.slice(0, newline));
      buffer = buffer.slice(newline + 1);
      if (event) yield event;
      newline = buffer.indexOf('\n');
    }
  }
  const last = parseAskLine(buffer);
  if (last) yield last;
}

/** Reads a text stream chunk by chunk; works where ReadableStream is not async-iterable yet. */
export async function* textChunks(stream: ReadableStream<string>): AsyncGenerator<string> {
  const reader = stream.getReader();
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) return;
      yield value;
    }
  } finally {
    reader.releaseLock();
  }
}

function parseAskLine(line: string): AskEvent | null {
  const trimmed = line.trim();
  if (!trimmed) return null;
  try {
    const parsed = askEvent.safeParse(JSON.parse(trimmed));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}
