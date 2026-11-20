import path from 'node:path';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { createDatabase, listWatchlist, toggleWatchlist, type Database } from './index';

// The repository keeps one .env at its root, loaded the same way as prisma.config.ts.
if (!process.env.DATABASE_URL) {
  try {
    process.loadEnvFile(path.resolve(import.meta.dirname, '../../../.env'));
  } catch {
    // No .env file: DATABASE_URL must come from the process environment.
  }
}

// Every test uses a fresh random viewer, so runs never collide and no cleanup is needed.
const newViewer = () => crypto.randomUUID();
const sleep = (milliseconds: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, milliseconds));

describe('watchlist', () => {
  let database: Database;

  beforeAll(() => {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) throw new Error('DATABASE_URL is not set');
    database = createDatabase(connectionString);
  });

  afterAll(async () => {
    await database.$disconnect();
  });

  test('toggling saves a movie and toggling again removes it', async () => {
    const viewerId = newViewer();

    expect(await toggleWatchlist(database, { viewerId, movieId: 603 })).toBe(true);
    expect(await listWatchlist(database, viewerId)).toEqual([603]);

    expect(await toggleWatchlist(database, { viewerId, movieId: 603 })).toBe(false);
    expect(await listWatchlist(database, viewerId)).toEqual([]);
  });

  test('lists the newest saved movie first', async () => {
    const viewerId = newViewer();

    // Timestamps have millisecond precision, so spacing the saves keeps the order unambiguous.
    for (const movieId of [11, 22, 33]) {
      await toggleWatchlist(database, { viewerId, movieId });
      await sleep(10);
    }

    expect(await listWatchlist(database, viewerId)).toEqual([33, 22, 11]);
  });

  test('keeps viewers isolated from each other', async () => {
    const first = newViewer();
    const second = newViewer();

    await toggleWatchlist(database, { viewerId: first, movieId: 603 });
    await toggleWatchlist(database, { viewerId: second, movieId: 604 });
    expect(await listWatchlist(database, first)).toEqual([603]);
    expect(await listWatchlist(database, second)).toEqual([604]);

    // Removing a movie for one viewer leaves the same movie saved for the other.
    await sleep(10);
    await toggleWatchlist(database, { viewerId: second, movieId: 603 });
    await toggleWatchlist(database, { viewerId: first, movieId: 603 });
    expect(await listWatchlist(database, first)).toEqual([]);
    expect(await listWatchlist(database, second)).toEqual([603, 604]);
  });

  test('concurrent toggles of the same movie never throw', async () => {
    const viewerId = newViewer();

    const results = await Promise.allSettled([
      toggleWatchlist(database, { viewerId, movieId: 603 }),
      toggleWatchlist(database, { viewerId, movieId: 603 }),
    ]);

    expect(results.map((result) => result.status)).toEqual(['fulfilled', 'fulfilled']);
    // However the two interleave, the row exists at most once.
    expect((await listWatchlist(database, viewerId)).length).toBeLessThanOrEqual(1);
  });
});
