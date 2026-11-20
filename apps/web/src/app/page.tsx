import { Suspense } from 'react';
import { EndAsk } from '#/components/home/end-ask';
import { HomeBillboard } from '#/components/home/home-billboard';
import {
  BecauseYouSavedRow,
  GenreRows,
  NowPlayingRow,
  TopRatedRow,
  TrendingTodayRow,
} from '#/components/home/home-rows';
import { Attribution } from '#/components/layout/attribution';
import { MovieRowSkeleton } from '#/components/movie/movie-row';
import { MyListRow } from '#/components/watchlist/my-list-row';
import { WatchlistSeed } from '#/components/watchlist/watchlist-seed';

export default function HomePage() {
  return (
    <>
      <HomeBillboard />
      <div className="grid grid-cols-[minmax(0,1fr)] gap-[34px] pt-[30px] pb-2.5">
        {/* Seeded with the page on first load; afterwards it renders straight from the cache. */}
        <Suspense fallback={<MyListRow />}>
          <WatchlistSeed withList>
            <MyListRow />
          </WatchlistSeed>
        </Suspense>
        <TrendingTodayRow />
        <Suspense fallback={null}>
          <BecauseYouSavedRow />
        </Suspense>
        <Suspense fallback={<MovieRowSkeleton title="In theaters now" />}>
          <NowPlayingRow />
        </Suspense>
        <TopRatedRow />
        <GenreRows />
      </div>
      <EndAsk />
      <Attribution />
    </>
  );
}
