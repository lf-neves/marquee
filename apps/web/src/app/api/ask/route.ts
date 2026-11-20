import { type AskEvent, askRequest, encodeAskEvent } from '#/ask/protocol';
import { runAskAgent } from '#/server/ask/agent';
import { isClaudeUnavailable, toAskError } from '#/server/ask/errors';
import { runKeywordFallback } from '#/server/ask/fallback';
import { askRateLimiter, clientAddress } from '#/server/ask/rate-limit';
import { catalog } from '#/server/catalog';
import { askEnabled } from '#/server/env';
import { getRegion } from '#/server/region';

// A tool-using answer can take several model turns.
export const maxDuration = 60;

const ndjsonHeaders = {
  'content-type': 'application/x-ndjson; charset=utf-8',
  'cache-control': 'no-store',
  'x-accel-buffering': 'no',
};

const singleEvent = (event: AskEvent, status: number) =>
  new Response(encodeAskEvent(event), { status, headers: ndjsonHeaders });

export async function POST(request: Request): Promise<Response> {
  const limit = askRateLimiter.check(clientAddress(request.headers));
  if (!limit.allowed) {
    return singleEvent(
      {
        type: 'error',
        code: 'rate_limited',
        message: `You’ve asked a lot in a short time. Try again in ${Math.ceil(limit.retryAfterMs / 60_000)} min.`,
      },
      429,
    );
  }

  const body = askRequest.safeParse(await request.json().catch(() => null));
  if (!body.success) {
    return singleEvent(
      {
        type: 'error',
        code: 'bad_request',
        message: 'That message couldn’t be sent. Try rephrasing it.',
      },
      400,
    );
  }

  const region = await getRegion();
  const history = body.data.messages;
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let open = true;
      let answered = false;
      const emit = (event: AskEvent) => {
        if (!open) return;
        if (event.type === 'text' || event.type === 'picks') answered = true;
        try {
          controller.enqueue(encoder.encode(encodeAskEvent(event)));
        } catch {
          open = false;
        }
      };
      try {
        if (askEnabled) {
          await runAskAgent({ history, region, emit, signal: request.signal });
        } else {
          const text = history.at(-1)?.content ?? '';
          await runKeywordFallback({ text, catalog, region, emit });
        }
        emit({ type: 'done' });
      } catch (error) {
        const event = request.signal.aborted ? null : toAskError(error);
        // The viewer sees a friendly message; the cause goes to the server log.
        if (event) console.error('Ask Marquee failed', error);
        if (event && !answered && isClaudeUnavailable(error)) {
          // A billing or key problem should not leave the chat dead: answer with title search.
          const text = history.at(-1)?.content ?? '';
          await runKeywordFallback({ text, catalog, region, emit, why: 'unavailable' }).then(
            () => emit({ type: 'done' }),
            () => emit(event),
          );
        } else if (event) {
          emit(event);
        }
      } finally {
        if (open) controller.close();
        open = false;
      }
    },
  });

  return new Response(stream, { headers: ndjsonHeaders });
}
