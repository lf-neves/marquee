import 'server-only';
import { type MovieSummary } from '@marquee/tmdb/types';
import { getMovieSummary } from './catalog';
import { watchlistStore } from './database';
import { readViewerId } from './viewer';

/** The viewer's saved movies, newest first. Reads cookies, so callers sit inside <Suspense>. */
export async function getSavedMovies(limit = 60): Promise<MovieSummary[]> {
  const store = watchlistStore();
  const viewerId = await readViewerId();
  if (!store || !viewerId) return [];
  const ids = (await store.list(viewerId)).slice(0, limit);
  const movies = await Promise.all(ids.map(getMovieSummary));
  return movies.filter((movie): movie is MovieSummary => movie !== null);
}
