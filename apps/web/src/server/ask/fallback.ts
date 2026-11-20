import { type Catalog } from '@marquee/api';
import { type AskEvent } from '#/ask/protocol';
import { toAskPick } from './picks';

const pickCount = 3;

/** "More like Dune." → "Dune"; quotes and trailing punctuation never help a title search. */
export function fallbackQuery(text: string): string {
  const subject = /\blike\s+(.+)$/i.exec(text)?.[1] ?? text;
  return subject
    .replace(/[“”"']/g, '')
    .replace(/[.!?…]+$/, '')
    .trim()
    .slice(0, 100);
}

/**
 * Ask Marquee without a Claude key: a title search on the last message, or today's trending movies
 * when nothing matches. It keeps the dialog useful on deployments and test runs that have no key.
 */
export async function runKeywordFallback({
  text,
  catalog,
  region,
  emit,
  why = 'off',
}: {
  text: string;
  catalog: Catalog;
  region: string;
  emit: (event: AskEvent) => void;
  /** `off`: no Claude key is configured. `unavailable`: Claude refused the account's requests. */
  why?: 'off' | 'unavailable';
}): Promise<void> {
  const query = fallbackQuery(text);
  emit({
    type: 'status',
    label: query ? `Looking up “${query}” on TMDB…` : 'Checking what’s trending…',
  });

  const matches = query ? await catalog.search(query) : [];
  const usingSearch = matches.length > 0;
  const candidates = usingSearch ? matches : (await catalog.trending('day', 1)).results;
  const details = await Promise.all(
    candidates.slice(0, pickCount).map((movie) => catalog.movie(movie.id)),
  );
  const reason = usingSearch ? `Title match for “${query}”.` : 'Trending on TMDB today.';
  const movies = details.flatMap((movie) => (movie ? [toAskPick({ movie, reason, region })] : []));

  const intro =
    why === 'off'
      ? 'Ask Marquee’s AI is switched off on this deployment, so it answers with title search.'
      : 'Ask Marquee’s AI is unavailable right now, so it answers with title search.';
  emit({
    type: 'text',
    delta: usingSearch
      ? `${intro} Here are the titles that match “${query}”.`
      : `${intro} Nothing matched${query ? ` “${query}”` : ''}, so here is what’s trending today.`,
  });
  if (movies.length) emit({ type: 'picks', movies });
}
