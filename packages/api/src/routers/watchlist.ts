import { type MovieSummary } from '@marquee/tmdb/types';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { type WatchlistStore } from '../context';
import { toSummary } from '../summaries';
import { createRouter, publicProcedure } from '../trpc';

const listLimit = 60;

function requireStore(store: WatchlistStore | null): WatchlistStore {
  if (!store) {
    throw new TRPCError({
      code: 'PRECONDITION_FAILED',
      message: 'The watchlist needs a database, and none is configured.',
    });
  }
  return store;
}

export const watchlistRouter = createRouter({
  ids: publicProcedure.query(async ({ ctx }) => {
    const viewerId = await ctx.viewer.get();
    if (!viewerId || !ctx.watchlist) return [];
    return ctx.watchlist.list(viewerId);
  }),

  list: publicProcedure.query(async ({ ctx }): Promise<MovieSummary[]> => {
    const viewerId = await ctx.viewer.get();
    if (!viewerId || !ctx.watchlist) return [];
    const ids = (await ctx.watchlist.list(viewerId)).slice(0, listLimit);
    const movies = await Promise.all(ids.map((id) => ctx.catalog.movie(id)));
    return movies.flatMap((movie) => (movie ? [toSummary(movie)] : []));
  }),

  toggle: publicProcedure
    .input(z.object({ movieId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const store = requireStore(ctx.watchlist);
      const viewerId = await ctx.viewer.getOrCreate();
      const saved = await store.toggle({ viewerId, movieId: input.movieId });
      return { movieId: input.movieId, saved };
    }),
});
