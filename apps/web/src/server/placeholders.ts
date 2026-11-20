import 'server-only';
import { type MovieDetails, type MovieSummary } from '@marquee/tmdb/types';
import { tmdbImageUrl } from '@marquee/tmdb/images';
import { cacheLife } from 'next/cache';
import sharp from 'sharp';
import { type BlurPlaceholders } from '#/lib/movie-card';

// Blur-up placeholders: a ~16px WebP of each image, inlined as a data URL so the preview paints
// with the HTML, before any JavaScript. Built from TMDB's smallest size and cached for good, since
// an image path never changes content.

const sourceWidth = { poster: 92, backdrop: 300 } as const;

async function blurDataUrl(path: string, kind: keyof typeof sourceWidth): Promise<string> {
  'use cache';
  cacheLife('max');
  // Throws instead of returning a fallback: a thrown error is not cached, a cached null would stick.
  const response = await fetch(tmdbImageUrl(path, kind, sourceWidth[kind]));
  if (!response.ok) throw new Error(`TMDB image ${path} responded ${response.status}`);
  const tiny = await sharp(Buffer.from(await response.arrayBuffer()))
    .resize(16)
    .webp({ quality: 40 })
    .toBuffer();
  return `data:image/webp;base64,${tiny.toString('base64')}`;
}

async function safeBlur(path: string | null, kind: keyof typeof sourceWidth) {
  if (!path) return null;
  try {
    return await blurDataUrl(path, kind);
  } catch {
    return null;
  }
}

async function placeholdersFor(movie: MovieSummary): Promise<BlurPlaceholders> {
  const [poster, backdrop] = await Promise.all([
    safeBlur(movie.posterPath, 'poster'),
    safeBlur(movie.backdropPath, 'backdrop'),
  ]);
  return { poster, backdrop };
}

export async function withBlur<Movie extends MovieSummary | MovieDetails>(
  movie: Movie,
): Promise<Movie & { blur: BlurPlaceholders }> {
  return { ...movie, blur: await placeholdersFor(movie) };
}

export const withBlurAll = <Movie extends MovieSummary>(movies: Movie[]) =>
  Promise.all(movies.map(withBlur));
