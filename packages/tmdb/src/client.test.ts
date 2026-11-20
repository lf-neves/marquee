import { describe, expect, test, vi } from 'vitest';
import { TmdbError, createTmdbClient, isTmdbNotFound } from './client';
import { createFixtureFetch } from './fixtures/fetch';
import { tmdbImageUrl, tmdbSize } from './images';

const fixtureClient = () => createTmdbClient({ token: 'test', fetch: createFixtureFetch() });

describe('trending', () => {
  test('normalizes scores to percentages and reports the next page', async () => {
    const page = await fixtureClient().trending('day');

    expect(page.page).toBe(1);
    expect(page.results).toHaveLength(20);
    expect(page.nextPage).toBe(2);
    expect(page.results[0]).toMatchObject({
      id: 693_134,
      title: 'Dune: Part Two',
      score: 81,
      year: 2024,
      releaseDate: '2024-02-27',
    });
  });

  test('stops paging on the last page', async () => {
    const page = await fixtureClient().trending('day', 2);

    expect(page.results.length).toBeGreaterThan(0);
    expect(page.nextPage).toBeNull();
  });

  test('day and week windows return different orders', async () => {
    const client = fixtureClient();
    const [day, week] = await Promise.all([client.trending('day'), client.trending('week')]);

    expect(day.results.map((movie) => movie.id)).not.toEqual(week.results.map((movie) => movie.id));
  });
});

describe('movie details', () => {
  test('extracts director, certification, trailer and watch options per region', async () => {
    const movie = await fixtureClient().movie(872_585);

    expect(movie).toMatchObject({
      title: 'Oppenheimer',
      runtime: 181,
      director: 'Christopher Nolan',
      certifications: { US: 'R' },
      trailer: { youtubeKey: 'uYPbbksJxIg' },
      genres: [
        { id: 18, name: 'Drama' },
        { id: 36, name: 'History' },
      ],
    });
    expect(movie.watch.US?.stream.map((provider) => provider.name)).toEqual(['Peacock Premium']);
    expect(movie.watch.BR?.rent.length).toBeGreaterThan(0);
  });

  test('reports unknown money as null instead of zero', async () => {
    const movie = await fixtureClient().movie(372_058);

    expect(movie.budget).toBeNull();
    expect(movie.revenue).toBe(382_000_000);
    expect(movie.tagline).toBeNull();
  });

  test('throws a not-found error for unknown ids', async () => {
    const error = await fixtureClient()
      .movie(1)
      .catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(TmdbError);
    expect(isTmdbNotFound(error)).toBe(true);
  });
});

describe('discover', () => {
  test('applies genre, runtime and exclusion filters', async () => {
    const page = await fixtureClient().discover({
      anyGenreIds: [35],
      withoutGenreIds: [27],
      maxRuntime: 120,
    });

    expect(page.results.length).toBeGreaterThan(0);
    for (const movie of page.results) expect(movie.genreIds).toContain(35);
  });

  test('sends TMDB query parameters with AND and OR genre syntax', async () => {
    const fetchSpy = vi.fn<typeof fetch>(createFixtureFetch());
    const client = createTmdbClient({ token: 'secret', fetch: fetchSpy });

    await client.discover({ genreIds: [878, 12], maxRuntime: 120, sortBy: 'vote_average.desc' });
    await client.discover({ anyGenreIds: [35, 18], providerIds: [8, 9], region: 'BR' });

    const [first, second] = fetchSpy.mock.calls.map(([input]) => new URL(String(input)));
    expect(first?.searchParams.get('with_genres')).toBe('878,12');
    expect(first?.searchParams.get('with_runtime.lte')).toBe('120');
    expect(first?.searchParams.get('vote_count.gte')).toBe('300');
    expect(second?.searchParams.get('with_genres')).toBe('35|18');
    expect(second?.searchParams.get('with_watch_providers')).toBe('8|9');
    expect(second?.searchParams.get('watch_region')).toBe('BR');
    expect(fetchSpy.mock.calls[0]?.[1]?.headers).toMatchObject({ authorization: 'Bearer secret' });
  });
});

describe('transport', () => {
  test('retries once after a rate limit', async () => {
    const fixtures = createFixtureFetch();
    const fetchSpy = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(new Response('', { status: 429, headers: { 'retry-after': '0' } }))
      .mockImplementation(fixtures);

    const page = await createTmdbClient({ token: 't', fetch: fetchSpy }).trending('week');

    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(page.results.length).toBeGreaterThan(0);
  });

  test('rejects a payload that does not match the schema', async () => {
    const client = createTmdbClient({
      token: 't',
      fetch: async () => Response.json({ page: 'one', results: 'none' }),
    });

    await expect(client.trending('day')).rejects.toThrow('unexpected shape');
  });

  test('drops adult titles and entries without any artwork', async () => {
    const item = { id: 1, title: 'Visible', poster_path: '/a.jpg' };
    const client = createTmdbClient({
      token: 't',
      fetch: async () =>
        Response.json({
          page: 1,
          total_pages: 900,
          total_results: 18_000,
          results: [item, { id: 2, title: 'No art' }, { ...item, id: 3, adult: true }],
        }),
    });

    const page = await client.trending('day');

    expect(page.results.map((movie) => movie.id)).toEqual([1]);
    expect(page.totalPages).toBe(500);
  });
});

describe('images', () => {
  test('picks the smallest TMDB size that covers the requested width, never the original file', () => {
    expect(tmdbSize('poster', 300)).toBe('w342');
    expect(tmdbSize('poster', 2000)).toBe('w780');
    expect(tmdbSize('backdrop', 2560)).toBe('w1280');
    expect(tmdbSize('backdrop', 1000)).toBe('w1280');
    expect(tmdbImageUrl('/x.jpg', 'poster', 150)).toBe('https://image.tmdb.org/t/p/w154/x.jpg');
  });
});
