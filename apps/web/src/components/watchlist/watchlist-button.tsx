'use client';

import { Bookmark } from 'lucide-react';
import { cn } from '#/lib/utils';
import { Button } from '../ui/button';
import { useWatchlistEnabled, useWatchlistIds, useWatchlistToggle } from './watchlist-provider';

type WatchlistButtonProps = {
  movie: { id: number; title: string };
  /** `icon` sits on artwork; `screen` and `ghost` are labelled buttons for dark bands and themed surfaces. */
  variant?: 'icon' | 'screen' | 'ghost';
  className?: string;
};

export function WatchlistButton({ movie, variant = 'screen', className }: WatchlistButtonProps) {
  const enabled = useWatchlistEnabled();
  const { saved, toggle } = useWatchlistToggle(movie);
  if (!enabled) return null;

  const onClick = () => toggle();

  if (variant === 'icon') {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={`${saved ? 'Remove' : 'Save'} ${movie.title} ${saved ? 'from' : 'to'} watchlist`}
        className={cn(
          'absolute top-2 right-2 z-10 grid size-[34px] place-items-center rounded-[9px] bg-screen/72 text-screen-fg backdrop-blur-md transition-opacity group-hover:opacity-100 focus-visible:opacity-100 [@media(hover:hover)]:opacity-0',
          saved && 'text-accent [@media(hover:hover)]:opacity-100',
          className,
        )}
      >
        <Bookmark className={cn('size-[17px]', saved && 'fill-current')} aria-hidden />
      </button>
    );
  }

  return (
    <Button
      variant={variant}
      onClick={onClick}
      aria-label={saved ? 'Remove from watchlist' : 'Save to watchlist'}
      className={cn(saved && (variant === 'screen' ? 'text-accent' : 'text-accent-ink'), className)}
    >
      <Bookmark className={cn(saved && 'fill-current')} aria-hidden />
      <span>{saved ? 'In watchlist' : 'Watchlist'}</span>
    </Button>
  );
}

export function WatchlistCount() {
  const enabled = useWatchlistEnabled();
  const count = useWatchlistIds().length;
  if (!enabled) return null;
  return (
    <span className="rounded-full bg-accent-soft px-1.5 py-[3px] font-mono text-[11px] leading-none text-accent-ink tabular-nums">
      {count}
    </span>
  );
}
