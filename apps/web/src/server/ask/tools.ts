import { betaZodTool } from '@anthropic-ai/sdk/helpers/beta/zod';
import { type Catalog } from '@marquee/api';
import { type DiscoverInput, discoverInput, toDiscoverFilters } from '@marquee/api/discover';
import { genreNames, movieGenres } from '@marquee/tmdb/genres';
import { type MovieSummary } from '@marquee/tmdb/types';
import { z } from 'zod';
import { type AskEvent } from '#/ask/protocol';
import { toAskPick } from './picks';

const resultLimit = 12;
const overviewLimit = 180;

/** What the model sees for each candidate: enough to choose, small enough to keep turns cheap. */
export function compactMovie(movie: MovieSummary) {
  const overview =
    movie.overview.length > overviewLimit
      ? `${movie.overview.slice(0, overviewLimit).trimEnd()}…`
      : movie.overview;
  return {
    id: movie.id,
    title: movie.title,
    year: movie.year,
    score: movie.score,
    genres: genreNames(movie.genreIds),
    overview,
  };
}

const runtimePhrase = (minutes: number) =>
  minutes % 60 === 0 ? `${minutes / 60} hours` : `${minutes} minutes`;

/** "Searching TMDB for comedies under 2 hours…" from the model's filters. */
export function describeDiscover(input: DiscoverInput): string {
  const genres = [...(input.genres ?? []), ...(input.anyGenres ?? [])].map((key) =>
    movieGenres[key].name.toLowerCase(),
  );
  const parts = [genres.length ? genres.join(' or ') : 'movies'];
  if (input.maxRuntime) parts.push(`under ${runtimePhrase(input.maxRuntime)}`);
  if (input.releasedFrom && input.releasedTo)
    parts.push(`from ${input.releasedFrom}–${input.releasedTo}`);
  else if (input.releasedFrom) parts.push(`since ${input.releasedFrom}`);
  else if (input.releasedTo) parts.push(`before ${input.releasedTo}`);
  if (input.streamingOn?.length) parts.push('on your services');
  return `Searching TMDB for ${parts.join(' ')}…`;
}

/**
 * The movies a conversation may show: ids returned by a tool during this request, plus ids its
 * earlier turns already showed. `show_movies` rejects anything else, so a pick can never be a title
 * the model made up.
 */
export function createPickAllowList(initialIds: Iterable<number> = []) {
  const ids = new Set(initialIds);
  return {
    add: (movies: MovieSummary[]) => {
      for (const movie of movies) ids.add(movie.id);
    },
    has: (id: number) => ids.has(id),
  };
}

export type PickAllowList = ReturnType<typeof createPickAllowList>;

export function createAskTools({
  catalog,
  region,
  allowList,
  emit,
}: {
  catalog: Catalog;
  region: string;
  allowList: PickAllowList;
  emit: (event: AskEvent) => void;
}) {
  const answer = (movies: MovieSummary[]) => {
    const top = movies.slice(0, resultLimit);
    allowList.add(top);
    return JSON.stringify({ count: top.length, movies: top.map(compactMovie) });
  };

  // Tool order is fixed: the tool list is part of the cached prompt prefix.
  return [
    betaZodTool({
      name: 'discover_movies',
      description:
        'Browse TMDB by genre, runtime, release years, original language, minimum score and streaming service. Use it for moods and open-ended requests. Streaming filters apply to the viewer’s country.',
      inputSchema: discoverInput,
      eager_input_streaming: true,
      run: async (input) => {
        emit({ type: 'status', label: describeDiscover(input) });
        const page = await catalog.discover(toDiscoverFilters(input, region));
        return answer(page.results);
      },
    }),
    betaZodTool({
      name: 'search_movies',
      description:
        'Find movies by title. Use it when the viewer names a movie, including to get the id before similar_movies.',
      inputSchema: z.object({
        query: z.string().trim().min(1).max(100).describe('A movie title.'),
      }),
      eager_input_streaming: true,
      run: async ({ query }) => {
        emit({ type: 'status', label: `Looking up “${query}” on TMDB…` });
        return answer(await catalog.search(query));
      },
    }),
    betaZodTool({
      name: 'similar_movies',
      description:
        'Movies TMDB recommends to people who liked the given movie. Takes a TMDB id from an earlier result.',
      inputSchema: z.object({ movieId: z.number().int().positive() }),
      eager_input_streaming: true,
      run: async ({ movieId }) => {
        emit({ type: 'status', label: 'Finding movies people watch next…' });
        return answer(await catalog.recommendations(movieId));
      },
    }),
    betaZodTool({
      name: 'trending_movies',
      description: 'What people are watching on TMDB today or this week.',
      inputSchema: z.object({ window: z.enum(['day', 'week']).default('day') }),
      eager_input_streaming: true,
      run: async ({ window }) => {
        emit({
          type: 'status',
          label: `Checking what’s trending ${window === 'day' ? 'today' : 'this week'}…`,
        });
        return answer((await catalog.trending(window, 1)).results);
      },
    }),
    betaZodTool({
      name: 'show_movies',
      description:
        'Show your picks to the viewer as cards with artwork, runtime, score and where to watch. Call it once per answer with your best picks, using only ids from tool results in this conversation.',
      inputSchema: z.object({
        picks: z
          .array(
            z.object({
              id: z.number().int().positive(),
              reason: z
                .string()
                .trim()
                .min(1)
                .max(140)
                .describe('Why this fits the request, in about 12 words.'),
            }),
          )
          .min(1)
          .max(4),
      }),
      eager_input_streaming: true,
      run: async ({ picks }) => {
        const unknown = picks.filter((pick) => !allowList.has(pick.id)).map((pick) => pick.id);
        if (unknown.length) {
          throw new Error(
            `Unknown ids: ${unknown.join(', ')}. Pick only ids returned by a tool in this conversation.`,
          );
        }
        const unique = picks.filter(
          (pick, index) => picks.findIndex((other) => other.id === pick.id) === index,
        );
        const details = await Promise.all(unique.map((pick) => catalog.movie(pick.id)));
        const movies = unique.flatMap((pick, index) => {
          const movie = details[index];
          return movie ? [toAskPick({ movie, reason: pick.reason, region })] : [];
        });
        if (movies.length === 0)
          throw new Error('None of those movies could be loaded. Pick others.');
        emit({ type: 'picks', movies });
        return `Shown to the viewer: ${movies.map((movie) => movie.title).join(', ')}. Now reply in one or two short sentences.`;
      },
    }),
  ];
}
