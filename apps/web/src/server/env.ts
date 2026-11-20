import 'server-only';

const value = (name: string) => {
  const raw = process.env[name]?.trim();
  return raw ? raw : undefined;
};

/** Server configuration. Blank variables count as unset, so `.env.example` can be copied as is. */
export const env = {
  tmdbToken: value('TMDB_READ_TOKEN'),
  tmdbFixtures: ['1', 'true'].includes(value('TMDB_FIXTURES') ?? ''),
  databaseUrl: value('DATABASE_URL'),
  anthropicApiKey: value('ANTHROPIC_API_KEY'),
};

export const watchlistEnabled = env.databaseUrl !== undefined;
export const askEnabled = env.anthropicApiKey !== undefined;
