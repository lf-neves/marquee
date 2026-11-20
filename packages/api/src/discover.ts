import { type DiscoverFilters } from '@marquee/tmdb/client';
import { type GenreKey, genreKeys, movieGenres } from '@marquee/tmdb/genres';
import { z } from 'zod';

/** Streaming services people name in requests, mapped to TMDB provider ids (regional ids included). */
export const streamingServices = {
  netflix: [8],
  primeVideo: [9, 119],
  disneyPlus: [337],
  max: [1899],
  hulu: [15],
  appleTvPlus: [350],
  paramountPlus: [531],
  peacock: [386],
  globoplay: [307],
} as const satisfies Record<string, readonly number[]>;

const serviceKeys = Object.keys(streamingServices) as (keyof typeof streamingServices)[];
const genre = z.enum(genreKeys as [GenreKey, ...GenreKey[]]);

/**
 * Filters for browsing the catalog. The same schema validates the tRPC procedure and describes the
 * Ask Marquee tool to the model, so the two can never drift apart.
 */
export const discoverInput = z.object({
  genres: z.array(genre).max(3).optional().describe('Every listed genre must match.'),
  anyGenres: z.array(genre).max(5).optional().describe('At least one listed genre must match.'),
  excludeGenres: z.array(genre).max(5).optional().describe('None of these genres may match.'),
  maxRuntime: z.number().int().min(40).max(300).optional().describe('Longest runtime in minutes.'),
  minRuntime: z.number().int().min(0).max(300).optional().describe('Shortest runtime in minutes.'),
  releasedFrom: z.number().int().min(1900).max(2100).optional().describe('Earliest release year.'),
  releasedTo: z.number().int().min(1900).max(2100).optional().describe('Latest release year.'),
  originalLanguage: z
    .string()
    .regex(/^[a-z]{2}$/)
    .optional()
    .describe('ISO 639-1 code of the original language, for example "ko" or "pt".'),
  minScore: z.number().int().min(0).max(100).optional().describe('Lowest TMDB user score, 0-100.'),
  streamingOn: z
    .array(
      z.enum(
        serviceKeys as [keyof typeof streamingServices, ...(keyof typeof streamingServices)[]],
      ),
    )
    .max(5)
    .optional()
    .describe("Only movies included with one of these subscriptions in the viewer's country."),
  sortBy: z.enum(['popular', 'topRated', 'newest']).default('popular'),
  page: z.number().int().min(1).max(500).default(1),
});

export type DiscoverInput = z.input<typeof discoverInput>;

const genreIds = (keys: readonly GenreKey[] | undefined) => keys?.map((key) => movieGenres[key].id);

const sortMap = {
  popular: 'popularity.desc',
  topRated: 'vote_average.desc',
  newest: 'primary_release_date.desc',
} as const;

export function toDiscoverFilters(input: DiscoverInput, region: string): DiscoverFilters {
  const parsed = discoverInput.parse(input);
  const providerIds = parsed.streamingOn?.flatMap((key) => streamingServices[key]);
  return {
    genreIds: genreIds(parsed.genres),
    anyGenreIds: genreIds(parsed.anyGenres),
    withoutGenreIds: genreIds(parsed.excludeGenres),
    maxRuntime: parsed.maxRuntime,
    minRuntime: parsed.minRuntime,
    releasedFrom: parsed.releasedFrom ? `${parsed.releasedFrom}-01-01` : undefined,
    // Newest-first otherwise surfaces announced titles nobody can watch yet.
    releasedTo: parsed.releasedTo
      ? `${parsed.releasedTo}-12-31`
      : parsed.sortBy === 'newest'
        ? new Date().toISOString().slice(0, 10)
        : undefined,
    originalLanguage: parsed.originalLanguage,
    minScore: parsed.minScore,
    providerIds: providerIds?.length ? [...providerIds] : undefined,
    region: providerIds?.length ? region : undefined,
    sortBy: sortMap[parsed.sortBy],
    page: parsed.page,
  };
}
