import { type z } from 'zod';
import { isListable, toMovieDetails, toMovieSummary, toPage } from './normalize';
import { rawMovieDetails, rawMovieListItem, rawPaged } from './schemas';
import { type MovieDetails, type MovieSummary, type Page, type TrendingWindow } from './types';

export const tmdbApiBase = 'https://api.themoviedb.org/3';

export class TmdbError extends Error {
  readonly status: number | null;
  readonly path: string;

  constructor({
    message,
    status,
    path,
    cause,
  }: {
    message: string;
    status: number | null;
    path: string;
    cause?: unknown;
  }) {
    super(message, { cause });
    this.name = 'TmdbError';
    this.status = status;
    this.path = path;
  }
}

export const isTmdbNotFound = (error: unknown) =>
  error instanceof TmdbError && error.status === 404;

export type TmdbClientOptions = {
  /** TMDB API Read Access Token (v4 auth). */
  token: string;
  fetch?: typeof fetch;
  baseUrl?: string;
  language?: string;
  timeoutMs?: number;
};

export type DiscoverSort =
  | 'popularity.desc'
  | 'vote_average.desc'
  | 'primary_release_date.desc'
  | 'revenue.desc';

export type DiscoverFilters = {
  /** Every listed genre must match. */
  genreIds?: number[];
  /** At least one listed genre must match. */
  anyGenreIds?: number[];
  withoutGenreIds?: number[];
  minRuntime?: number;
  maxRuntime?: number;
  /** ISO dates, inclusive. */
  releasedFrom?: string;
  releasedTo?: string;
  originalLanguage?: string;
  /** User score floor, 0–100. */
  minScore?: number;
  minVotes?: number;
  /** Streaming providers (flatrate) in `region`. */
  providerIds?: number[];
  region?: string;
  sortBy?: DiscoverSort;
  page?: number;
};

type QueryValue = string | number | boolean | undefined;

const pagedMovies = rawPaged(rawMovieListItem);

const toMoviePage = (raw: z.infer<typeof pagedMovies>): Page<MovieSummary> =>
  toPage(raw, (items) => items.filter(isListable).map(toMovieSummary));

const sleep = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));

export function createTmdbClient({
  token,
  fetch: fetchImplementation = fetch,
  baseUrl = tmdbApiBase,
  language = 'en-US',
  timeoutMs = 8000,
}: TmdbClientOptions) {
  async function get<Schema extends z.ZodType>(
    path: string,
    query: Record<string, QueryValue>,
    schema: Schema,
  ): Promise<z.infer<Schema>> {
    const url = new URL(`${baseUrl}${path}`);
    url.searchParams.set('language', language);
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== '') url.searchParams.set(key, String(value));
    }

    // One retry for rate limiting and transient upstream failures; anything else surfaces at once.
    for (let attempt = 0; ; attempt += 1) {
      let response: Response;
      try {
        response = await fetchImplementation(url, {
          headers: { authorization: `Bearer ${token}`, accept: 'application/json' },
          signal: AbortSignal.timeout(timeoutMs),
        });
      } catch (cause) {
        if (attempt === 0) continue;
        throw new TmdbError({ message: `TMDB ${path} did not respond`, status: null, path, cause });
      }

      if ((response.status === 429 || response.status >= 500) && attempt === 0) {
        const retryAfterSeconds = Number(response.headers.get('retry-after'));
        await sleep(
          Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0
            ? Math.min(retryAfterSeconds * 1000, 2000)
            : 300,
        );
        continue;
      }
      if (!response.ok) {
        throw new TmdbError({
          message: `TMDB ${path} responded ${response.status}`,
          status: response.status,
          path,
        });
      }

      const parsed = schema.safeParse(await response.json());
      if (!parsed.success) {
        throw new TmdbError({
          message: `TMDB ${path} returned an unexpected shape`,
          status: response.status,
          path,
          cause: parsed.error,
        });
      }
      return parsed.data;
    }
  }

  const moviePage = async (path: string, query: Record<string, QueryValue> = {}) =>
    toMoviePage(await get(path, query, pagedMovies));

  return {
    trending: (window: TrendingWindow, page = 1) =>
      moviePage(`/trending/movie/${window}`, { page }),

    movie: async (id: number): Promise<MovieDetails> =>
      toMovieDetails(
        await get(
          `/movie/${id}`,
          { append_to_response: 'release_dates,videos,credits,watch/providers' },
          rawMovieDetails,
        ),
      ),

    recommendations: (id: number, page = 1) => moviePage(`/movie/${id}/recommendations`, { page }),

    similar: (id: number, page = 1) => moviePage(`/movie/${id}/similar`, { page }),

    search: (query: string, page = 1) =>
      moviePage('/search/movie', { query, page, include_adult: false }),

    nowPlaying: (region: string, page = 1) => moviePage('/movie/now_playing', { region, page }),

    topRated: (page = 1) => moviePage('/movie/top_rated', { page }),

    discover: ({
      genreIds,
      anyGenreIds,
      withoutGenreIds,
      minRuntime,
      maxRuntime,
      releasedFrom,
      releasedTo,
      originalLanguage,
      minScore,
      minVotes,
      providerIds,
      region,
      sortBy = 'popularity.desc',
      page = 1,
    }: DiscoverFilters = {}) =>
      moviePage('/discover/movie', {
        // TMDB reads a comma as AND and a pipe as OR.
        with_genres: genreIds?.length
          ? genreIds.join(',')
          : anyGenreIds?.length
            ? anyGenreIds.join('|')
            : undefined,
        without_genres: withoutGenreIds?.join(','),
        'with_runtime.gte': minRuntime,
        'with_runtime.lte': maxRuntime,
        'primary_release_date.gte': releasedFrom,
        'primary_release_date.lte': releasedTo,
        with_original_language: originalLanguage,
        'vote_average.gte': minScore === undefined ? undefined : minScore / 10,
        // Sorting by score alone surfaces obscure titles with three votes.
        'vote_count.gte': minVotes ?? (sortBy === 'vote_average.desc' ? 300 : 50),
        with_watch_providers: providerIds?.join('|'),
        with_watch_monetization_types: providerIds?.length ? 'flatrate' : undefined,
        watch_region: region,
        include_adult: false,
        include_video: false,
        sort_by: sortBy,
        page,
      }),
  };
}

export type TmdbClient = ReturnType<typeof createTmdbClient>;
