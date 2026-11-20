import 'server-only';
import { type TmdbClient, createTmdbClient } from '@marquee/tmdb/client';
import { createFixtureFetch } from '@marquee/tmdb/fixtures';
import { env } from './env';

function createClient(): TmdbClient {
  if (env.tmdbFixtures) {
    return createTmdbClient({ token: 'fixtures', fetch: createFixtureFetch({ latencyMs: 40 }) });
  }
  if (!env.tmdbToken) {
    throw new Error(
      'TMDB_READ_TOKEN is not set. Add a TMDB API Read Access Token to .env, or set TMDB_FIXTURES=1 to run on recorded data.',
    );
  }
  return createTmdbClient({ token: env.tmdbToken });
}

let client: TmdbClient | undefined;

export const tmdb = (): TmdbClient => (client ??= createClient());
