export type TrendingWindow = 'day' | 'week';

export type Genre = { id: number; name: string };

export type MovieSummary = {
  id: number;
  title: string;
  overview: string;
  /** ISO date, or null when TMDB has no release date yet. */
  releaseDate: string | null;
  year: number | null;
  posterPath: string | null;
  backdropPath: string | null;
  /** TMDB user score as a whole percentage, 0–100. */
  score: number;
  voteCount: number;
  genreIds: number[];
  originalLanguage: string;
};

export type WatchProvider = { id: number; name: string; logoPath: string | null };

/** Where a movie can be watched in one country. Data comes from JustWatch through TMDB. */
export type WatchOptions = {
  region: string;
  /** TMDB's watch page for the movie in this region; it links out to each provider. */
  link: string | null;
  stream: WatchProvider[];
  free: WatchProvider[];
  rent: WatchProvider[];
  buy: WatchProvider[];
};

export type Trailer = { youtubeKey: string; name: string };

export type MovieDetails = MovieSummary & {
  tagline: string | null;
  runtime: number | null;
  genres: Genre[];
  /** US dollars, or null when TMDB reports 0 (unknown). */
  budget: number | null;
  revenue: number | null;
  status: string;
  imdbId: string | null;
  director: string | null;
  /** Certification per country code, for example `{ US: 'PG-13', BR: '14' }`. */
  certifications: Record<string, string>;
  trailer: Trailer | null;
  /** Watch options per country code. Select one region before sending it to the client. */
  watch: Record<string, WatchOptions>;
};

export type Page<Item> = {
  page: number;
  results: Item[];
  totalPages: number;
  totalResults: number;
  /** The next page to request, or null at the end of what TMDB will serve. */
  nextPage: number | null;
};
