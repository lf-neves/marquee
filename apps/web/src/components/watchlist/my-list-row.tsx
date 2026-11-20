'use client';

import { paths } from '#/lib/paths';
import { MovieRow } from '../movie/movie-row';
import { useSavedMovies } from './watchlist-provider';

/** The home page's My List row, rendered from the saved list in the cache so saves show instantly. */
export function MyListRow() {
  const movies = useSavedMovies();
  if (!movies?.length) return null;
  return <MovieRow title="My List" movies={movies} seeAll={{ href: paths.watchlist() }} />;
}
