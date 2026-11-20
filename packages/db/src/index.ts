import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './generated/prisma/client';

export type Database = PrismaClient;

export function createDatabase(connectionString: string): Database {
  return new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
}

/** Movie ids a viewer saved, newest first. */
export async function listWatchlist(database: Database, viewerId: string): Promise<number[]> {
  const items = await database.watchlistItem.findMany({
    where: { viewerId },
    orderBy: { addedAt: 'desc' },
    select: { movieId: true },
  });
  return items.map((item) => item.movieId);
}

/**
 * Saves or removes a movie. Setting the state the row is already in does nothing, so repeated or
 * concurrent requests (a double click, an Undo racing the original save) cannot fail or flip it.
 */
export async function setWatchlistItem(
  database: Database,
  { viewerId, movieId, saved }: { viewerId: string; movieId: number; saved: boolean },
): Promise<void> {
  if (!saved) {
    await database.watchlistItem.deleteMany({ where: { viewerId, movieId } });
    return;
  }
  // INSERT … ON CONFLICT DO NOTHING: an upsert can still race on the unique key and throw P2002.
  await database.watchlistItem.createMany({
    data: [{ viewerId, movieId }],
    skipDuplicates: true,
  });
}
