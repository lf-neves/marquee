import { type ImageKind } from '@marquee/tmdb/images';
import Image from 'next/image';
import { cn } from '#/lib/utils';

type TmdbImageProps = {
  path: string | null;
  kind: Exclude<ImageKind, 'logo'>;
  alt: string;
  /** The `sizes` attribute; it decides which TMDB size the browser downloads. */
  sizes: string;
  /** Preload only the image that is the page's largest contentful paint. */
  preload?: boolean;
  className?: string;
};

/** TMDB artwork that fills its positioned parent, with a title card when TMDB has no image. */
export function TmdbImage({ path, kind, alt, sizes, preload = false, className }: TmdbImageProps) {
  if (!path) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={cn(
          'absolute inset-0 grid place-items-center bg-gradient-to-br from-screen-3 to-screen p-4 text-center font-display text-2xl font-extrabold text-screen-muted uppercase',
          className,
        )}
      >
        {alt}
      </div>
    );
  }
  return (
    <Image
      src={`/${kind}${path}`}
      alt={alt}
      fill
      sizes={sizes}
      preload={preload}
      fetchPriority={preload ? 'high' : undefined}
      className={cn('object-cover', className)}
    />
  );
}
