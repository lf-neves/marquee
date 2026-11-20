import { type Catalog } from '@marquee/api';
import { createTmdbClient, isTmdbNotFound } from '@marquee/tmdb/client';
import { createFixtureFetch } from '@marquee/tmdb/fixtures';

/** The recorded TMDB catalog behind the `Catalog` interface, for Ask tests. */
export function createFixtureCatalog(): Catalog {
  const tmdb = createTmdbClient({ token: 'test', fetch: createFixtureFetch() });
  return {
    trending: tmdb.trending,
    movie: (id) =>
      tmdb
        .movie(id)
        .catch((error: unknown) => (isTmdbNotFound(error) ? null : Promise.reject(error))),
    recommendations: async (id) => (await tmdb.recommendations(id)).results,
    search: async (query) => (await tmdb.search(query)).results,
    discover: tmdb.discover,
  };
}
