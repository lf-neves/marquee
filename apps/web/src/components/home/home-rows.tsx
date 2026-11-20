import { type DiscoverInput, toDiscoverFilters } from '@marquee/api/discover';
import { regionText } from '#/lib/format';
import { paths } from '#/lib/paths';
import {
  discoverMovies,
  getNowPlaying,
  getRecommendations,
  getTopRated,
  getTrending,
} from '#/server/catalog';
import { getRegion } from '#/server/region';
import { getSavedMovies } from '#/server/watchlist';
import { MovieRow } from '../movie/movie-row';

// Cached rows render into the static shell. Rows that read cookies or headers are request-time and
// the page wraps them in <Suspense>.

export async function TrendingTodayRow() {
  const trending = await getTrending('day');
  return (
    <MovieRow
      title="Trending today"
      why="What people are watching on TMDB right now"
      movies={trending.results}
      seeAll={{ href: paths.trending() }}
    />
  );
}

export async function BecauseYouSavedRow() {
  const saved = await getSavedMovies(20);
  const latest = saved[0];
  if (!latest) return null;
  const savedIds = new Set(saved.map((movie) => movie.id));
  const recommendations = (await getRecommendations(latest.id)).filter(
    (movie) => !savedIds.has(movie.id),
  );
  return (
    <MovieRow
      title={`Because you saved ${latest.title}`}
      why="TMDB recommendations"
      movies={recommendations}
      seeAll={{ href: paths.similar(latest), label: 'More like it' }}
    />
  );
}

export async function NowPlayingRow() {
  const region = await getRegion();
  const movies = await getNowPlaying(region);
  return (
    <MovieRow title="In theaters now" why={`Showing in ${regionText(region)}`} movies={movies} />
  );
}

export async function TopRatedRow() {
  return (
    <MovieRow
      title="Top rated of all time"
      why="Highest TMDB user scores"
      movies={await getTopRated()}
    />
  );
}

const genreRows: { title: string; why: string; filters: DiscoverInput }[] = [
  {
    title: 'Feel-good comedies',
    why: 'Light, funny and well liked',
    filters: { anyGenres: ['comedy'], excludeGenres: ['horror', 'thriller'], minScore: 65 },
  },
  {
    title: 'Other worlds: sci-fi & fantasy',
    why: 'The best rated, by TMDB users',
    filters: { anyGenres: ['scienceFiction', 'fantasy'], sortBy: 'topRated' },
  },
  {
    title: 'Edge-of-your-seat thrillers',
    why: 'Popular this season',
    filters: { anyGenres: ['thriller', 'mystery'] },
  },
];

export async function GenreRows() {
  const pages = await Promise.all(
    genreRows.map((row) => discoverMovies(toDiscoverFilters(row.filters, 'US'))),
  );
  return genreRows.map((row, index) => (
    <MovieRow
      key={row.title}
      title={row.title}
      why={row.why}
      movies={pages[index]?.results ?? []}
    />
  ));
}
