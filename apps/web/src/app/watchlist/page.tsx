import { Bookmark } from 'lucide-react';
import { type Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { PosterCard, PosterCardSkeleton } from '#/components/movie/poster-card';
import { Button } from '#/components/ui/button';
import { watchlistEnabled } from '#/server/env';
import { getSavedMovies } from '#/server/watchlist';

export const metadata: Metadata = { title: 'Watchlist' };

export default function WatchlistPage() {
  return (
    <section className="wrap pt-11 pb-16">
      <h1 className="font-display text-[44px] leading-[0.92] font-extrabold tracking-[0.02em] uppercase">
        Watchlist
      </h1>
      <Suspense
        fallback={
          <div aria-busy className="poster-grid mt-[26px]">
            {Array.from({ length: 6 }, (_, index) => (
              <PosterCardSkeleton key={index} />
            ))}
          </div>
        }
      >
        <SavedMovies />
      </Suspense>
    </section>
  );
}

async function SavedMovies() {
  if (!watchlistEnabled) {
    return (
      <EmptyState
        title="The watchlist is switched off"
        body="This deployment has no database, so there is nowhere to keep saved movies."
      />
    );
  }

  const movies = await getSavedMovies();

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
