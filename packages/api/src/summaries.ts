import { type MovieDetails, type MovieSummary } from '@marquee/tmdb/types';

/** Trims cached details down to a list item before it crosses the network. */
export const toSummary = (movie: MovieDetails): MovieSummary => ({
  id: movie.id,
  title: movie.title,
  overview: movie.overview,
  releaseDate: movie.releaseDate,
  year: movie.year,
  posterPath: movie.posterPath,
  backdropPath: movie.backdropPath,
  score: movie.score,
  voteCount: movie.voteCount,
  genreIds: movie.genreIds,
  originalLanguage: movie.originalLanguage,
});
