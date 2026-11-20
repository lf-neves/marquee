import 'server-only';
import { type Catalog, toSummary } from '@marquee/api';
import { type DiscoverFilters, isTmdbNotFound } from '@marquee/tmdb/client';
import { type MovieDetails, type MovieSummary, type TrendingWindow } from '@marquee/tmdb/types';
import { cacheLife, cacheTag } from 'next/cache';
import { type BlurPlaceholders } from '#/lib/movie-card';
import { withBlur, withBlurAll } from './placeholders';
import { tmdb } from './tmdb';

// Every TMDB read goes through these cached functions. Next.js keys each entry by its arguments, so
// pages, tRPC procedures and the Ask tools all share one cache, and prerendering bakes the results
// into each route's static shell.

export async function getTrending(window: TrendingWindow, page = 1) {
  'use cache';
  cacheLife('catalog');
  cacheTag('trending', `trending:${window}`);
  const result = await tmdb().trending(window, page);
  return { ...result, results: await withBlurAll(result.results) };
}

export async function getMovie(
  id: number,
): Promise<(MovieDetails & { blur: BlurPlaceholders }) | null> {
  'use cache';
  cacheLife('catalog');
  cacheTag(`movie:${id}`);
  try {
    return await withBlur(await tmdb().movie(id));
  } catch (error) {
    if (isTmdbNotFound(error)) return null;
    throw error;
  }
}

export async function getMovieSummary(id: number): Promise<MovieSummary | null> {
  const movie = await getMovie(id);
  return movie ? toSummary(movie) : null;
}

/** TMDB recommendations, falling back to "similar" for titles too new to have any. */
export async function getRecommendations(id: number): Promise<MovieSummary[]> {
  'use cache';
  cacheLife('catalog');
  cacheTag(`movie:${id}`);
  const recommended = await tmdb().recommendations(id);
  const movies =
    recommended.results.length > 0 ? recommended.results : (await tmdb().similar(id)).results;
  return withBlurAll(movies);
}

export async function searchMovies(query: string): Promise<MovieSummary[]> {
  'use cache';
  cacheLife('hours');
  return (await tmdb().search(query)).results;
}

export async function discoverMovies(filters: DiscoverFilters) {
  'use cache';
  cacheLife('catalog');
  cacheTag('discover');
  const result = await tmdb().discover(filters);
  return { ...result, results: await withBlurAll(result.results) };
}

export async function getTopRated() {
  'use cache';
  cacheLife('days');
  return withBlurAll((await tmdb().topRated()).results);
}

export async function getNowPlaying(region: string) {
  'use cache';
  cacheLife('catalog');
  return withBlurAll((await tmdb().nowPlaying(region)).results);
}

export const catalog: Catalog = {
  trending: getTrending,
  movie: getMovie,
  recommendations: getRecommendations,
  search: searchMovies,
  discover: discoverMovies,
};
