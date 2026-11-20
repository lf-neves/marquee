import { z } from 'zod';

// Raw TMDB v3 payloads. Only the fields the app reads are declared; zod strips the rest, which keeps
// cached entries and RSC payloads small.

const nullableString = z.string().nullable().catch(null);

export const rawMovieListItem = z.object({
  id: z.number().int(),
  title: z.string(),
  overview: z.string().catch(''),
  poster_path: nullableString.default(null),
  backdrop_path: nullableString.default(null),
  release_date: z.string().catch('').default(''),
  vote_average: z.number().catch(0).default(0),
  vote_count: z.number().int().catch(0).default(0),
  genre_ids: z.array(z.number().int()).catch([]).default([]),
  original_language: z.string().catch('en').default('en'),
  adult: z.boolean().catch(false).default(false),
});

export const rawPaged = <Item extends z.ZodType>(item: Item) =>
  z.object({
    page: z.number().int(),
    results: z.array(item),
    total_pages: z.number().int(),
    total_results: z.number().int(),
  });

const rawProvider = z.object({
  provider_id: z.number().int(),
  provider_name: z.string(),
  logo_path: nullableString.default(null),
  display_priority: z.number().catch(999).default(999),
});

const rawRegionProviders = z.object({
  link: z.string().optional(),
  flatrate: z.array(rawProvider).optional(),
  free: z.array(rawProvider).optional(),
  ads: z.array(rawProvider).optional(),
  rent: z.array(rawProvider).optional(),
  buy: z.array(rawProvider).optional(),
});

export const rawMovieDetails = rawMovieListItem.omit({ genre_ids: true }).extend({
  tagline: nullableString.default(null),
  runtime: z.number().int().nullable().catch(null).default(null),
  genres: z
    .array(z.object({ id: z.number().int(), name: z.string() }))
    .catch([])
    .default([]),
  budget: z.number().catch(0).default(0),
  revenue: z.number().catch(0).default(0),
  status: z.string().catch('Released').default('Released'),
  imdb_id: nullableString.default(null),
  release_dates: z
    .object({
      results: z.array(
        z.object({
          iso_3166_1: z.string(),
          release_dates: z.array(
            z.object({ certification: z.string().catch(''), type: z.number().int() }),
          ),
        }),
      ),
    })
    .optional(),
  videos: z
    .object({
      results: z.array(
        z.object({
          key: z.string(),
          name: z.string(),
          site: z.string(),
          type: z.string(),
          official: z.boolean().catch(false).default(false),
          published_at: z.string().catch('').default(''),
        }),
      ),
    })
    .optional(),
  credits: z
    .object({
      crew: z
        .array(z.object({ job: z.string(), name: z.string() }))
        .catch([])
        .default([]),
    })
    .optional(),
  'watch/providers': z.object({ results: z.record(z.string(), rawRegionProviders) }).optional(),
});

export type RawMovieListItem = z.infer<typeof rawMovieListItem>;
export type RawMovieDetails = z.infer<typeof rawMovieDetails>;
export type RawRegionProviders = z.infer<typeof rawRegionProviders>;
