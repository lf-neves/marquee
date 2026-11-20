import 'server-only';
import Anthropic, { APIError } from '@anthropic-ai/sdk';
import { type AskEvent, type AskHistoryMessage } from '#/ask/protocol';
import { regionText } from '#/lib/format';
import { catalog, getMovieSummary } from '#/server/catalog';
import { env } from '#/server/env';
import { TruncatedToolInputError } from './errors';
import { buildAskMessages, shownIdsOf } from './history';
import { askSystemPrompt } from './system-prompt';
import { createAskTools, createPickAllowList } from './tools';

const model = 'claude-opus-5-5';
const maxIterations = 6;
const maxReissues = 2;

let client: Anthropic | undefined;

function anthropic(): Anthropic {
  if (!env.anthropicApiKey) throw new Error('ANTHROPIC_API_KEY is not set.');
  // The base URL is explicit so a shell-level ANTHROPIC_BASE_URL never reroutes production traffic.
  client ??= new Anthropic({ apiKey: env.anthropicApiKey, baseURL: 'https://api.anthropic.com' });
  return client;
}

/**
 * Answers one viewer message with Claude: the tool runner searches TMDB through the cached catalog,
 * `show_movies` streams the picks, and text deltas stream as they arrive.
 */
export async function runAskAgent({
  history,
  region,
  emit,
  signal,
}: {
  history: AskHistoryMessage[];
  region: string;
  emit: (event: AskEvent) => void;
  signal: AbortSignal;
}): Promise<void> {
  const shownIds = shownIdsOf(history);
  const summaries = await Promise.all(shownIds.map((id) => getMovieSummary(id)));
  const titles = new Map(
    summaries.flatMap((movie) => (movie ? [[movie.id, movie.title] as const] : [])),
  );
  const allowList = createPickAllowList(shownIds);

  const params = {
    model,
    max_tokens: 16_000,
    max_iterations: maxIterations,
    // Chat answers do well at low effort; it keeps replies quick and cheap.
    output_config: { effort: 'low' as const },
    // On a policy decline the API retries server-side on Anthropic's recommended fallback model.
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default' as const,
    // Tools and the frozen system prompt form a stable prefix; the top-level marker also caches the
    // growing conversation, so each tool-loop iteration rereads the previous one from cache.
    system: [
      {
        type: 'text' as const,
        text: askSystemPrompt,
        cache_control: { type: 'ephemeral' as const },
      },
    ],
    cache_control: { type: 'ephemeral' as const },
    tools: createAskTools({ catalog, region, allowList, emit }),
    messages: buildAskMessages({
      history,
      titles,
      context: {
        country: `${regionText(region)} (${region})`,
        today: new Date().toISOString().slice(0, 10),
      },
    }),
    // Each request sends the full history; the conversation lives in the browser, not on the server.
    thread: false as const,
  };

  let runner = anthropic().beta.messages.toolRunner({ ...params, stream: true }, { signal });

  for (let attempt = 0; ; attempt += 1) {
    try {
      for await (const messageStream of runner) {
        for await (const event of messageStream) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            emit({ type: 'text', delta: event.delta.text });
          }
        }
        const message = await messageStream.finalMessage();
        attempt = 0;
        // A truncated tool input can still pass schema validation, so never let it run.
        const hasToolUse = message.content.some((block) => block.type === 'tool_use');
        if (message.stop_reason === 'max_tokens' && hasToolUse) throw new TruncatedToolInputError();
        if (message.stop_reason === 'refusal') {
          emit({
            type: 'error',
            code: 'refused',
            message: 'I can’t help with that one. Try a mood, a genre or a movie you liked.',
          });
          return;
        }
      }
      return;
    } catch (error) {
      // Only unparseable tool JSON is worth re-issuing; API errors and truncation surface as is.
      if (
        error instanceof APIError ||
        error instanceof TruncatedToolInputError ||
        attempt >= maxReissues ||
        signal.aborted
      ) {
        throw error;
      }
      runner = anthropic().beta.messages.toolRunner({ ...runner.params, stream: true }, { signal });
    }
  }
}
