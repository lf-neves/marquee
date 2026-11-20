import { type inferRouterOutputs } from '@trpc/server';
import { moviesRouter } from './routers/movies';
import { watchlistRouter } from './routers/watchlist';
import { createCallerFactory, createRouter } from './trpc';

export const appRouter = createRouter({
  movies: moviesRouter,
  watchlist: watchlistRouter,
});

export type AppRouter = typeof appRouter;
export type RouterOutputs = inferRouterOutputs<AppRouter>;

export const createCaller = createCallerFactory(appRouter);

export { type ApiContext, type Catalog, type ViewerSession, type WatchlistStore } from './context';
export { toSummary } from './summaries';
