import { type Route } from 'next';

/** `Dune: Part Two` → `dune-part-two`. Slugs are cosmetic; the id alone resolves the movie. */
export function slugify(title: string): string {
  return title
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

export const movieSegment = (movie: { id: number; title: string }) => {
  const slug = slugify(movie.title);
  return slug ? `${movie.id}-${slug}` : String(movie.id);
};

/** Reads the id from `693134-dune-part-two`; null for anything else. */
export function parseMovieSegment(segment: string): number | null {
  const match = /^(\d{1,9})(?:-[a-z0-9-]*)?$/.exec(segment);
  return match ? Number(match[1]) : null;
}

export const paths = {
  home: () => '/' as Route,
  trending: (window: 'day' | 'week' = 'day') =>
    (window === 'day' ? '/trending' : '/trending?window=week') as Route,
  watchlist: () => '/watchlist' as Route,
  movie: (movie: { id: number; title: string }) => `/movie/${movieSegment(movie)}` as Route,
  similar: (movie: { id: number; title: string }) =>
    `/movie/${movieSegment(movie)}/similar` as Route,
};
