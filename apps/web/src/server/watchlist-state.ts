import 'server-only';
import { appRouter } from '@marquee/api';
import { type DehydratedState, dehydrate } from '@tanstack/react-query';
import { createTRPCOptionsProxy } from '@trpc/tanstack-react-query';
import { makeQueryClient } from '#/trpc/query-client';
import { createApiContext } from './api';

/**
 * The viewer's saved ids, and optionally the saved movies, as React Query state for
 * <HydrationBoundary>. Reads the viewer cookie, so callers sit inside <Suspense>.
 */
export async function dehydratedWatchlist({
  withList,
}: {
  withList: boolean;
}): Promise<DehydratedState> {
  const queryClient = makeQueryClient();
  const trpc = createTRPCOptionsProxy({ router: appRouter, ctx: createApiContext, queryClient });
  await Promise.all([
    queryClient.prefetchQuery(trpc.watchlist.ids.queryOptions()),
    withList ? queryClient.prefetchQuery(trpc.watchlist.list.queryOptions()) : null,
  ]);
  return dehydrate(queryClient);
}
