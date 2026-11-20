import path from 'node:path';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { createDatabase, listWatchlist, setWatchlistItem, type Database } from './index';

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

  const save = (viewerId: string, movieId: number) =>
    setWatchlistItem(database, { viewerId, movieId, saved: true });
  const remove = (viewerId: string, movieId: number) =>
    setWatchlistItem(database, { viewerId, movieId, saved: false });

  test('saves a movie and removes it', async () => {
    const viewerId = newViewer();

    await save(viewerId, 603);
    expect(await listWatchlist(database, viewerId)).toEqual([603]);

    await remove(viewerId, 603);
    expect(await listWatchlist(database, viewerId)).toEqual([]);
  });

  test('saving or removing twice leaves the same state', async () => {
    const viewerId = newViewer();

    await save(viewerId, 603);
    await save(viewerId, 603);
    expect(await listWatchlist(database, viewerId)).toEqual([603]);

    await remove(viewerId, 603);
    await remove(viewerId, 603);
    expect(await listWatchlist(database, viewerId)).toEqual([]);
  });

  test('lists the newest saved movie first', async () => {
    const viewerId = newViewer();

    // Timestamps have millisecond precision, so spacing the saves keeps the order unambiguous.
    for (const movieId of [11, 22, 33]) {
      await save(viewerId, movieId);
      await sleep(10);
    }

    expect(await listWatchlist(database, viewerId)).toEqual([33, 22, 11]);
  });

  test('keeps viewers isolated from each other', async () => {
    const first = newViewer();
    const second = newViewer();

    await save(first, 603);
    await save(second, 604);
    await sleep(10);
    await save(second, 603);
    await remove(first, 603);

    expect(await listWatchlist(database, first)).toEqual([]);
    expect(await listWatchlist(database, second)).toEqual([603, 604]);
  });

  test('concurrent saves of the same movie never throw', async () => {
    const viewerId = newViewer();

    const results = await Promise.allSettled([save(viewerId, 603), save(viewerId, 603)]);

    expect(results.map((result) => result.status)).toEqual(['fulfilled', 'fulfilled']);
    expect(await listWatchlist(database, viewerId)).toEqual([603]);
  });
});
