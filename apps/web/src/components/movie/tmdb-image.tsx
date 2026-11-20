'use client';

import { tmdbImageUrl } from '@marquee/tmdb/images';
import Image from 'next/image';
import { useLayoutEffect, useRef, useState } from 'react';
import { cn } from '#/lib/utils';

type TmdbImageProps = {
  path: string | null;
  /** `tile` is a backdrop always served at TMDB's 300px size: row tiles trade retina sharpness for bytes. */
  kind: 'poster' | 'backdrop' | 'tile';
  alt: string;
  /** The `sizes` attribute; it decides which TMDB size the browser downloads. */
  sizes: string;
  /** A tiny inline preview (data URL) painted, blurred, until the real image is ready. */
  blurDataUrl?: string | null;
  /** Preload only the image that is the page's largest contentful paint. */
  preload?: boolean;
  className?: string;
};

/**
 * TMDB artwork that fills its positioned parent. It sits on a blurred inline preview and fades in
 * once fully loaded. Images that have not started painting when the page hydrates wait hidden for
 * their load event; images already painting before hydration stay visible, so nothing flashes.
 */
export function TmdbImage({
  path,
  kind,
  alt,
  sizes,
  blurDataUrl,
  preload = false,
  className,
}: TmdbImageProps) {
  const image = useRef<HTMLImageElement>(null);
  const [phase, setPhase] = useState<'server' | 'waiting' | 'loaded'>('server');

  useLayoutEffect(() => {
    const element = image.current;
    if (element && !element.complete && element.naturalWidth === 0) setPhase('waiting');
  }, []);

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
    <>
      {blurDataUrl ? (
        <span
          aria-hidden
          className="absolute inset-0 scale-110 bg-cover bg-center blur-xl"
          style={{ backgroundImage: `url(${blurDataUrl})` }}
        />
      ) : null}
      <Image
        ref={image}
        // Tiles always use TMDB's 300px file, so they skip the srcset and carry one URL.
        src={kind === 'tile' ? tmdbImageUrl(path, 'backdrop', 300) : `/${kind}${path}`}
        unoptimized={kind === 'tile'}
        alt={alt}
        fill
        sizes={sizes}
        preload={preload}
        fetchPriority={preload ? 'high' : undefined}
        onLoad={() => setPhase('loaded')}
        className={cn(
          'object-cover transition-opacity duration-500 ease-out motion-reduce:transition-none',
          phase === 'waiting' ? 'opacity-0' : 'opacity-100',
          className,
        )}
      />
    </>
  );
}
