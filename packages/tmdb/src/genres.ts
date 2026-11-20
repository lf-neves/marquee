import { type Genre } from './types';

/**
 * TMDB's movie genre list. The ids are stable, so the app ships them instead of calling
 * `/genre/movie/list` on every render.
 */
export const movieGenres = {
  action: { id: 28, name: 'Action' },
  adventure: { id: 12, name: 'Adventure' },
  animation: { id: 16, name: 'Animation' },
  comedy: { id: 35, name: 'Comedy' },
  crime: { id: 80, name: 'Crime' },
  documentary: { id: 99, name: 'Documentary' },
  drama: { id: 18, name: 'Drama' },
  family: { id: 10_751, name: 'Family' },
  fantasy: { id: 14, name: 'Fantasy' },
  history: { id: 36, name: 'History' },
  horror: { id: 27, name: 'Horror' },
  music: { id: 10_402, name: 'Music' },
  mystery: { id: 9648, name: 'Mystery' },
  romance: { id: 10_749, name: 'Romance' },
  scienceFiction: { id: 878, name: 'Science Fiction' },
  tvMovie: { id: 10_770, name: 'TV Movie' },
  thriller: { id: 53, name: 'Thriller' },
  war: { id: 10_752, name: 'War' },
  western: { id: 37, name: 'Western' },
} as const satisfies Record<string, Genre>;

export type GenreKey = keyof typeof movieGenres;

const genreNameById = new Map<number, string>(
  Object.values(movieGenres).map((genre) => [genre.id, genre.name]),
);

export const genreName = (id: number): string | null => genreNameById.get(id) ?? null;

export const genreNames = (ids: readonly number[]): string[] =>
  ids.flatMap((id) => {
    const name = genreNameById.get(id);
    return name ? [name] : [];
  });

export const genreKeys = Object.keys(movieGenres) as GenreKey[];
