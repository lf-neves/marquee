'use client';

import { type Route } from 'next';
import Link from 'next/link';
import { type ReactNode, ViewTransition, createContext, use, useEffect, useState } from 'react';
import { flushSync } from 'react-dom';
import { movieArtTransitionName } from '#/lib/transitions';

const MorphActive = createContext(false);

type MovieLinkProps = {
  href: Route;
  className?: string;
  'aria-label'?: string;
  children: ReactNode;
};

/**
 * A link to a movie that prefetches the movie's cached content once the pointer or focus shows
 * intent, and morphs its artwork into the movie page backdrop.
 *
 * Only the clicked link names its artwork, because a movie can appear in several rows of one page
 * and view-transition names must be unique.
 */
export function MovieLink({ href, className, children, ...rest }: MovieLinkProps) {
  const [intent, setIntent] = useState(false);
  const [morphing, setMorphing] = useState(false);

  useEffect(() => {
    if (!morphing) return;
    const timeout = setTimeout(() => setMorphing(false), 1500);
    return () => clearTimeout(timeout);
  }, [morphing]);

  return (
    <Link
      href={href}
      prefetch={intent ? true : 'auto'}
      onPointerEnter={() => setIntent(true)}
      onFocus={() => setIntent(true)}
      onClick={() => flushSync(() => setMorphing(true))}
      className={className}
      {...rest}
    >
      <MorphActive value={morphing}>{children}</MorphActive>
    </Link>
  );
}

/** Wraps the artwork inside a MovieLink; it joins the morph only for the link being followed. */
export function MorphSource({ movieId, children }: { movieId: number; children: ReactNode }) {
  const active = use(MorphActive);
  return (
    <ViewTransition
      name={active ? movieArtTransitionName(movieId) : undefined}
      share="morph"
      default="none"
    >
      {children}
    </ViewTransition>
  );
}
