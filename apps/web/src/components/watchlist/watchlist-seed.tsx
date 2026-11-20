import { HydrationBoundary } from '@tanstack/react-query';
import { type ReactNode } from 'react';
import { watchlistEnabled } from '#/server/env';
import { dehydratedWatchlist } from '#/server/watchlist-state';

/**
 * Seeds the browser's watchlist cache with the page, so counts and saved rows render with the
 * right data instead of loading after hydration. Render it inside <Suspense> whose fallback is the
 * same client UI: that fallback reads the cache and shows already-loaded data during client
 * navigations, while the seed streams in.
 */
export async function WatchlistSeed({
  withList = false,
  children,
}: {
  withList?: boolean;
  children?: ReactNode;
}) {
  if (!watchlistEnabled) return children;
  const state = await dehydratedWatchlist({ withList });
  return <HydrationBoundary state={state}>{children}</HydrationBoundary>;
}
