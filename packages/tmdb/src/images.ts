// TMDB serves pre-sized JPEGs from its own CDN. Picking the closest size there is cheaper and faster
// than running every poster through a second image optimizer.

export const tmdbImageBase = 'https://image.tmdb.org/t/p';

export const posterWidths = [92, 154, 185, 342, 500, 780] as const;
export const backdropWidths = [300, 780, 1280] as const;
export const logoWidths = [45, 92, 154, 185, 300, 500] as const;

export type ImageKind = 'poster' | 'backdrop' | 'logo';

const widthsByKind: Record<ImageKind, readonly number[]> = {
  poster: posterWidths,
  backdrop: backdropWidths,
  logo: logoWidths,
};

/**
 * The smallest TMDB size at least as wide as requested, capped at the largest resized width.
 * `original` files run to several megabytes, too heavy for any screen this app renders.
 */
export function tmdbSize(kind: ImageKind, width: number): string {
  const widths = widthsByKind[kind];
  const match = widths.find((candidate) => candidate >= width) ?? widths.at(-1);
  return `w${match}`;
}

export function tmdbImageUrl(path: string, kind: ImageKind, width: number): string {
  return `${tmdbImageBase}/${tmdbSize(kind, width)}${path}`;
}
