'use client';

import { Bookmark } from 'lucide-react';
import Link from 'next/link';
import { PosterCard, PosterCardSkeleton } from '../movie/poster-card';
import { Button } from '../ui/button';
import { useSavedMovies, useWatchlistEnabled } from './watchlist-provider';

/**
 * The watchlist page body. It renders from the same cache entry as My List, so arriving from the
 * home page shows the movies at once, and removals update it before the server answers.
 */
export function SavedMovies() {
  const enabled = useWatchlistEnabled();
  const movies = useSavedMovies();

  if (!enabled) {
    return (
      <EmptyState
        title="The watchlist is switched off"
        body="This deployment has no database, so there is nowhere to keep saved movies."
      />
    );
  }
  if (!movies) {
    return (
      <div aria-busy className="poster-grid mt-[26px]">
        {Array.from({ length: 6 }, (_, index) => (
          <PosterCardSkeleton key={index} />
        ))}
      </div>
    );
  }
  if (movies.length === 0) {
    return (
      <EmptyState
        title="Your watchlist is empty"
        body="Save a movie with the bookmark on its poster. Saved movies stay with this browser."
      />
    );
  }
  return (
    <>
      <p className="mt-2 mb-[26px] text-sm text-fg-muted">
        {movies.length} {movies.length === 1 ? 'movie' : 'movies'} saved in this browser
      </p>
      <div className="poster-grid">
        {movies.map((movie) => (
          <PosterCard key={movie.id} movie={movie} />
        ))}
      </div>
    </>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="mt-[26px] grid justify-items-center gap-2.5 rounded-card border border-dashed border-line-strong px-5 py-14 text-center text-fg-muted">
      <span className="grid size-12 place-items-center rounded-xl bg-surface-2">
        <Bookmark className="size-[22px]" aria-hidden />
      </span>
      <h2 className="text-lg font-semibold text-fg">{title}</h2>
      <p className="max-w-[46ch]">{body}</p>
      <Button asChild className="mt-2">
        <Link href="/trending">Browse trending</Link>
      </Button>
    </div>
  );
}
