import { createTmdbClient, isTmdbNotFound } from '@marquee/tmdb/client';
import { createFixtureFetch } from '@marquee/tmdb/fixtures';
import { describe, expect, test } from 'vitest';
import { type ApiContext, type Catalog, type WatchlistStore, createCaller } from './index';

const tmdb = createTmdbClient({ token: 'test', fetch: createFixtureFetch() });

const catalog: Catalog = {
  trending: tmdb.trending,
  movie: (id) =>
    tmdb
      .movie(id)
      .catch((error: unknown) => (isTmdbNotFound(error) ? null : Promise.reject(error))),
  recommendations: async (id) => (await tmdb.recommendations(id)).results,
  search: async (query) => (await tmdb.search(query)).results,
  discover: tmdb.discover,
};

function memoryWatchlist(): WatchlistStore {
  const saved = new Map<string, number[]>();
  return {
    list: async (viewerId) => saved.get(viewerId) ?? [],
    set: async ({ viewerId, movieId, saved: shouldSave }) => {
      const ids = (saved.get(viewerId) ?? []).filter((id) => id !== movieId);
      saved.set(viewerId, shouldSave ? [movieId, ...ids] : ids);
    },
  };
}

function caller(overrides: Partial<ApiContext> = {}) {
  let viewerId: string | null = null;
  return createCaller({
    catalog,
    region: 'US',
    watchlist: memoryWatchlist(),
    viewer: {
      get: async () => viewerId,
      getOrCreate: async () => (viewerId ??= 'viewer-1'),
    },
    ...overrides,
  });
}

describe('movies', () => {
  test('trending pages through with a cursor', async () => {
    const api = caller();
    const first = await api.movies.trending({ window: 'day' });
    const second = await api.movies.trending({ window: 'day', cursor: first.nextPage });

    expect(first.nextPage).toBe(2);
    expect(second.page).toBe(2);
    expect(
      second.results.some((movie) => first.results.some((other) => other.id === movie.id)),
    ).toBe(false);
  });

  test('detail sends only the requested region’s watch options', async () => {
    const movie = await caller({ region: 'BR' }).movies.detail({ id: 693_134 });

    expect(movie.watch?.region).toBe('BR');
    expect(movie.watch?.stream[0]?.name).toBe('Max');
  });

  test('detail reports a missing movie as NOT_FOUND', async () => {
    await expect(caller().movies.detail({ id: 1 })).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  test('discover maps friendly filters to TMDB ones', async () => {
    const page = await caller().movies.discover({
      anyGenres: ['comedy'],
      excludeGenres: ['horror'],
      maxRuntime: 120,
    });

    expect(page.results.map((movie) => movie.title)).toContain('Barbie');
    expect(page.results.every((movie) => movie.genreIds.includes(35))).toBe(true);
  });

  test('discover rejects unknown genres', async () => {
    await expect(
      caller().movies.discover({ genres: ['telenovela' as 'comedy'] }),
    ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
  });
});

describe('watchlist', () => {
  test('is empty for a visitor who never saved anything', async () => {
    const api = caller();

    expect(await api.watchlist.ids()).toEqual([]);
    expect(await api.watchlist.list()).toEqual([]);
  });

  test('set saves, lists newest first, then removes', async () => {
    const api = caller();

    await api.watchlist.set({ movieId: 155, saved: true });
    expect(await api.watchlist.set({ movieId: 603, saved: true })).toEqual({
      movieId: 603,
      saved: true,
    });
    expect((await api.watchlist.list()).map((movie) => movie.title)).toEqual([
      'The Matrix',
      'The Dark Knight',
    ]);

    expect(await api.watchlist.set({ movieId: 155, saved: false })).toEqual({
      movieId: 155,
      saved: false,
    });
    expect(await api.watchlist.ids()).toEqual([603]);
  });

  test('set explains that the watchlist needs a database', async () => {
    await expect(
      caller({ watchlist: null }).watchlist.set({ movieId: 155, saved: true }),
    ).rejects.toMatchObject({ code: 'PRECONDITION_FAILED' });
  });
});
