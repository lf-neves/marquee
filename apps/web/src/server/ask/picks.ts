import { type MovieDetails } from '@marquee/tmdb/types';
import { type AskPick, type AskWatch } from '#/ask/protocol';

const theatricalWindowDays = 75;

/** The single best way to watch a movie in the viewer's country, for the card's primary button. */
export function watchFor(movie: MovieDetails, region: string, today = new Date()): AskWatch | null {
  const options = movie.watch[region];
  const link = options?.link ?? null;
  const stream = options?.stream[0];
  if (stream) return { label: `Watch on ${stream.name}`, url: link };
  const free = options?.free[0];
  if (free) return { label: `Watch free on ${free.name}`, url: link };
  const rent = options?.rent[0];
  if (rent) return { label: `Rent on ${rent.name}`, url: link };
  const buy = options?.buy[0];
  if (buy) return { label: `Buy on ${buy.name}`, url: link };
  if (movie.releaseDate) {
    const ageInDays = (today.getTime() - Date.parse(`${movie.releaseDate}T00:00:00Z`)) / 86_400_000;
    if (ageInDays >= 0 && ageInDays <= theatricalWindowDays)
      return { label: 'In theaters', url: link };
  }
  return null;
}

export function toAskPick({
  movie,
  reason,
  region,
}: {
  movie: MovieDetails;
  reason: string;
  region: string;
}): AskPick {
  return {
    id: movie.id,
    title: movie.title,
    year: movie.year,
    runtime: movie.runtime,
    score: movie.score,
    genres: movie.genres.map((genre) => genre.name),
    overview: movie.overview,
    backdropPath: movie.backdropPath,
    posterPath: movie.posterPath,
    reason: reason.trim(),
    watch: watchFor(movie, region),
  };
}
