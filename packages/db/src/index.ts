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

/** Saves the movie, or removes it when already saved. Resolves to whether it is saved afterwards. */
export async function toggleWatchlist(
  database: Database,
  { viewerId, movieId }: { viewerId: string; movieId: number },
): Promise<boolean> {
  const { count } = await database.watchlistItem.deleteMany({ where: { viewerId, movieId } });
  if (count > 0) return false;
  // INSERT … ON CONFLICT DO NOTHING: a concurrent toggle that saved the same movie first is not an
  // error (an upsert can still race on the unique key and throw P2002).
  await database.watchlistItem.createMany({
    data: [{ viewerId, movieId }],
    skipDuplicates: true,
  });
  return true;
}
