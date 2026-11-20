import { type ImageKind, tmdbImageUrl } from '@marquee/tmdb/images';

/**
 * next/image loader for TMDB artwork. Components pass `/<kind>/<tmdb path>`, for example
 * `/poster/abc.jpg`; the loader maps the requested width to the nearest size TMDB serves.
 */
export default function tmdbImageLoader({ src, width }: { src: string; width: number }): string {
  const match = /^\/(poster|backdrop|logo)(\/.+)$/.exec(src);
  if (!match) return src;
  return tmdbImageUrl(match[2] as string, match[1] as ImageKind, width);
}
