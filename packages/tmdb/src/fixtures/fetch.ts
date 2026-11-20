import {
  type FixtureMovie,
  fixtureMovies,
  providers,
  trendingDayIds,
  trendingWeekIds,
} from './catalog';

const pageSize = 20;
const byId = new Map(fixtureMovies.map((movie) => [movie.id, movie]));

const listItem = (movie: FixtureMovie) => ({
  id: movie.id,
  title: movie.title,
  overview: movie.overview,
  poster_path: movie.poster,
  backdrop_path: movie.backdrop,
  release_date: movie.releaseDate,
  vote_average: movie.score,
  vote_count: movie.votes,
  genre_ids: movie.genreIds,
  original_language: movie.language,
  adult: false,
});

const regionProviders = (movie: FixtureMovie, region: string) => ({
  link: `https://www.themoviedb.org/movie/${movie.id}/watch?locale=${region}`,
  ...(movie.stream.length ? { flatrate: movie.stream.map((key) => providers[key]) } : {}),
  rent: movie.rent.map((key) => providers[key]),
  buy: movie.rent.map((key) => providers[key]),
});

const details = (movie: FixtureMovie) => {
  const { genre_ids: genreIds, ...rest } = listItem(movie);
  return {
    ...rest,
    genres: genreIds.map((id) => ({ id, name: genreLabel[id] ?? 'Other' })),
    tagline: movie.tagline,
    runtime: movie.runtime,
    budget: movie.budget,
    revenue: movie.revenue,
    status: 'Released',
    imdb_id: null,
    release_dates: {
      results: [
        { iso_3166_1: 'US', release_dates: [{ certification: movie.certification, type: 3 }] },
      ],
    },
    videos: {
      results: movie.trailer
        ? [
            {
              key: movie.trailer,
              name: 'Official Trailer',
              site: 'YouTube',
              type: 'Trailer',
              official: true,
              published_at: movie.releaseDate,
            },
          ]
        : [],
    },
    credits: { crew: [{ job: 'Director', name: movie.director }] },
    'watch/providers': {
      results: { US: regionProviders(movie, 'US'), BR: regionProviders(movie, 'BR') },
    },
  };
};

const genreLabel: Record<number, string> = {
  28: 'Action',
  12: 'Adventure',
  16: 'Animation',
  35: 'Comedy',
  80: 'Crime',
  99: 'Documentary',
  18: 'Drama',
  10_751: 'Family',
  14: 'Fantasy',
  36: 'History',
  27: 'Horror',
  10_402: 'Music',
  9648: 'Mystery',
  10_749: 'Romance',
  878: 'Science Fiction',
  53: 'Thriller',
  10_752: 'War',
  37: 'Western',
};

function paged(movies: FixtureMovie[], page: number) {
  const totalPages = Math.max(1, Math.ceil(movies.length / pageSize));
  return {
    page,
    results: movies.slice((page - 1) * pageSize, page * pageSize).map(listItem),
    total_pages: totalPages,
    total_results: movies.length,
  };
}

const byScore = (movies: FixtureMovie[]) =>
  movies.toSorted((left, right) => right.score - left.score || right.votes - left.votes);

const numbers = (value: string | null) =>
  value ? value.split(/[,|]/).map(Number).filter(Number.isFinite) : [];

function discover(params: URLSearchParams) {
  const genreList = params.get('with_genres') ?? '';
  const required = genreList.includes(',') || !genreList.includes('|') ? numbers(genreList) : [];
  const anyOf = genreList.includes('|') ? numbers(genreList) : [];
  const excluded = numbers(params.get('without_genres'));
  const minRuntime = Number(params.get('with_runtime.gte') ?? 0);
  const maxRuntime = Number(params.get('with_runtime.lte') ?? Infinity);
  const from = params.get('primary_release_date.gte') ?? '';
  const to = params.get('primary_release_date.lte') ?? '9999';
  const language = params.get('with_original_language');
  const minScore = Number(params.get('vote_average.gte') ?? 0);
  const providerIds = numbers(params.get('with_watch_providers'));

  const matches = fixtureMovies.filter(
    (movie) =>
      required.every((id) => movie.genreIds.includes(id)) &&
      (anyOf.length === 0 || anyOf.some((id) => movie.genreIds.includes(id))) &&
      !excluded.some((id) => movie.genreIds.includes(id)) &&
      movie.runtime >= minRuntime &&
      movie.runtime <= maxRuntime &&
      movie.releaseDate >= from &&
      movie.releaseDate <= to &&
      (!language || movie.language === language) &&
      movie.score >= minScore &&
      (providerIds.length === 0 ||
        movie.stream.some((key) => providerIds.includes(providers[key].provider_id))),
  );
  const sort = params.get('sort_by') ?? 'popularity.desc';
  if (sort === 'vote_average.desc') return byScore(matches);
  if (sort === 'primary_release_date.desc') {
    return matches.toSorted((left, right) => right.releaseDate.localeCompare(left.releaseDate));
  }
  if (sort === 'revenue.desc')
    return matches.toSorted((left, right) => right.revenue - left.revenue);
  return matches.toSorted(
    (left, right) => trendingDayIds.indexOf(left.id) - trendingDayIds.indexOf(right.id),
  );
}

function related(movie: FixtureMovie) {
  return byScore(
    fixtureMovies.filter(
      (other) => other.id !== movie.id && other.genreIds.some((id) => movie.genreIds.includes(id)),
    ),
  );
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

const notFound = () =>
  json(
    { success: false, status_code: 34, status_message: 'The resource could not be found.' },
    404,
  );

/**
 * A `fetch` that answers TMDB v3 requests from the fixture catalog. It understands the endpoints and
 * query parameters the client sends, so tests exercise the real parsing and normalization code.
 */
export function createFixtureFetch({ latencyMs = 0 }: { latencyMs?: number } = {}): typeof fetch {
  return async (input) => {
    if (latencyMs > 0) await new Promise((resolve) => setTimeout(resolve, latencyMs));
    const url = new URL(input instanceof Request ? input.url : String(input));
    const path = url.pathname.replace(/^\/3/, '');
    const page = Number(url.searchParams.get('page') ?? 1);
    const fromIds = (ids: number[]) => ids.flatMap((id) => byId.get(id) ?? []);

    if (path === '/trending/movie/day') return json(paged(fromIds(trendingDayIds), page));
    if (path === '/trending/movie/week') return json(paged(fromIds(trendingWeekIds), page));
    if (path === '/movie/top_rated') return json(paged(byScore(fixtureMovies), page));
    if (path === '/movie/now_playing') {
      return json(
        paged(
          fixtureMovies.filter((movie) => movie.releaseDate >= '2024-01-01'),
          page,
        ),
      );
    }
    if (path === '/discover/movie') return json(paged(discover(url.searchParams), page));
    if (path === '/search/movie') {
      const query = (url.searchParams.get('query') ?? '').toLowerCase().trim();
      const hits = fixtureMovies.filter((movie) => movie.title.toLowerCase().includes(query));
      return json(paged(query ? hits : [], page));
    }

    const match = /^\/movie\/(\d+)(\/recommendations|\/similar)?$/.exec(path);
    const movie = match ? byId.get(Number(match[1])) : undefined;
    if (!match || !movie) return notFound();
    if (match[2]) return json(paged(related(movie), page));
    return json(details(movie));
  };
}
