import { type BetaMessageParam } from '@anthropic-ai/sdk/resources/beta/messages/messages';
import { type AskHistoryMessage } from '#/ask/protocol';

/**
 * Turns the dialog's history into Claude messages. Assistant turns carry a `[Shown: …]` suffix
 * naming the movies their cards showed, so "shorter" or "more like the second one" can be resolved.
 * The text for a turn never changes between requests, which keeps the prefix cacheable.
 */
export function buildAskMessages({
  history,
  titles,
  context,
}: {
  history: AskHistoryMessage[];
  /** Titles for every id in `shownIds`; unknown ids are listed by id alone. */
  titles: ReadonlyMap<number, string>;
  context: { country: string; today: string };
}): BetaMessageParam[] {
  const messages: BetaMessageParam[] = history.map((message) => {
    if (message.role === 'user') return { role: 'user', content: message.content };
    const shown = (message.shownIds ?? []).map((id) => {
      const title = titles.get(id);
      return title ? `${title} (${id})` : `#${id}`;
    });
    const suffix = shown.length ? `\n\n[Shown: ${shown.join(', ')}]` : '';
    return { role: 'assistant', content: `${message.content}${suffix}` };
  });
  // Request-specific facts go after the latest user message, outside the cached system prompt.
  messages.push({
    role: 'system',
    content: `Viewer's country: ${context.country}. Today's date: ${context.today}.`,
  });
  return messages;
}

/** Every movie id the conversation has already shown, oldest first, without repeats. */
export const shownIdsOf = (history: AskHistoryMessage[]) => [
  ...new Set(history.flatMap((message) => message.shownIds ?? [])),
];
