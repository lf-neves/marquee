import 'server-only';
import { type WatchlistStore } from '@marquee/api';
import { type Database, createDatabase, listWatchlist, toggleWatchlist } from '@marquee/db';
import { env } from './env';

// One client per server instance; dev reloads reuse it instead of opening new pools.
const globalForDatabase = globalThis as unknown as { marqueeDatabase?: Database };

function database(): Database | null {
  if (!env.databaseUrl) return null;
  globalForDatabase.marqueeDatabase ??= createDatabase(env.databaseUrl);
  return globalForDatabase.marqueeDatabase;
}

export function watchlistStore(): WatchlistStore | null {
  const db = database();
  if (!db) return null;
  return {
    list: (viewerId) => listWatchlist(db, viewerId),
    toggle: (input) => toggleWatchlist(db, input),
  };
}
