import { type MovieSummary } from '@marquee/tmdb/types';

/** Inline blur-up previews (data URLs) for a movie's poster and backdrop, when they could be made. */
export type BlurPlaceholders = { poster?: string | null; backdrop?: string | null };

/** A movie as list UI receives it: the TMDB summary plus optional blur-up previews. */
export type MovieCard = MovieSummary & { blur?: BlurPlaceholders };

/** Drops presentation-only fields before a movie is handed to stateful client code. */
export const summaryOf = (movie: MovieSummary): MovieSummary => ({
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
