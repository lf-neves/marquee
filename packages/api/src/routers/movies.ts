import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { discoverInput, toDiscoverFilters } from '../discover';
import { createRouter, publicProcedure } from '../trpc';

const movieId = z.object({ id: z.number().int().positive() });

export const moviesRouter = createRouter({
  /** Infinite list: React Query passes the page to load as `cursor`. */
  trending: publicProcedure
    .input(
      z.object({
        window: z.enum(['day', 'week']),
        cursor: z.number().int().min(1).max(500).nullish(),
      }),
    )
    .query(({ ctx, input }) => ctx.catalog.trending(input.window, input.cursor ?? 1)),

  detail: publicProcedure.input(movieId).query(async ({ ctx, input }) => {
    const movie = await ctx.catalog.movie(input.id);
    if (!movie) throw new TRPCError({ code: 'NOT_FOUND', message: 'No such movie on TMDB.' });
    const { watch, ...rest } = movie;
    return { ...rest, watch: watch[ctx.region] ?? null };
  }),

  recommendations: publicProcedure
    .input(movieId)
    .query(({ ctx, input }) => ctx.catalog.recommendations(input.id)),

  search: publicProcedure
    .input(z.object({ query: z.string().trim().min(1).max(100) }))
    .query(({ ctx, input }) => ctx.catalog.search(input.query)),

  discover: publicProcedure
    .input(discoverInput)
    .query(({ ctx, input }) => ctx.catalog.discover(toDiscoverFilters(input, ctx.region))),
});
