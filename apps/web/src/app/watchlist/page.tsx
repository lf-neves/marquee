import { type Metadata } from 'next';
import { Suspense } from 'react';
import { SavedMovies } from '#/components/watchlist/saved-movies';
import { WatchlistSeed } from '#/components/watchlist/watchlist-seed';

export const metadata: Metadata = { title: 'Watchlist' };

export default function WatchlistPage() {
  return (
    <section className="wrap pt-11 pb-16">
      <h1 className="font-display text-[44px] leading-[0.92] font-extrabold tracking-[0.02em] uppercase">
        Watchlist
      </h1>
      {/* The fallback renders from the browser's cache, so a visit from the home page is instant. */}
      <Suspense fallback={<SavedMovies />}>
        <WatchlistSeed withList>
          <SavedMovies />
        </WatchlistSeed>
      </Suspense>
    </section>
  );
}
