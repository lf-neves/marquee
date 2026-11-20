import { type DiscoverFilters } from '@marquee/tmdb/client';
import {
  type MovieDetails,
  type MovieSummary,
  type Page,
  type TrendingWindow,
} from '@marquee/tmdb/types';

/**
 * Read access to the movie catalog. The web app backs it with cached TMDB calls; tests back it with
 * the fixture client. Keeping it an interface leaves this package free of Next.js.
 */
export type Catalog = {
  trending: (window: TrendingWindow, page: number) => Promise<Page<MovieSummary>>;
  movie: (id: number) => Promise<MovieDetails | null>;
  recommendations: (id: number) => Promise<MovieSummary[]>;
  search: (query: string) => Promise<MovieSummary[]>;
  discover: (filters: DiscoverFilters) => Promise<Page<MovieSummary>>;
};

export type WatchlistStore = {
  list: (viewerId: string) => Promise<number[]>;
  set: (input: { viewerId: string; movieId: number; saved: boolean }) => Promise<void>;
};

/** The anonymous viewer behind a request. `getOrCreate` issues an id the first time one is needed. */
export type ViewerSession = {
  get: () => Promise<string | null>;
  getOrCreate: () => Promise<string>;
};

export type ApiContext = {
  catalog: Catalog;
  /** ISO 3166-1 country used for watch providers. */
  region: string;
  /** Null when no database is configured; watchlist procedures then refuse politely. */
  watchlist: WatchlistStore | null;
  viewer: ViewerSession;
};
