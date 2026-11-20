import { describe, expect, test } from 'vitest';
import { type AskEvent } from '#/ask/protocol';
import { createFixtureCatalog } from './fixture-catalog';
import { createAskTools, createPickAllowList, describeDiscover } from './tools';

function setup(initialIds: number[] = []) {
  const events: AskEvent[] = [];
  const tools = createAskTools({
    catalog: createFixtureCatalog(),
    region: 'US',
    allowList: createPickAllowList(initialIds),
    emit: (event) => events.push(event),
  });
  const tool = (name: string) => {
    const found = tools.find((candidate) => candidate.name === name);
    if (!found) throw new Error(`No tool ${name}`);
    // The tools take different inputs; tests call each with its own shape.
    return found as unknown as { run: (input: unknown) => Promise<unknown> };
  };
  return { events, tool };
}

describe('show_movies', () => {
  test('rejects ids no tool returned in this conversation', async () => {
    const { events, tool } = setup();

    await expect(
      tool('show_movies').run({ picks: [{ id: 693_134, reason: 'Epic desert sequel.' }] }),
    ).rejects.toThrow('Unknown ids: 693134');
    expect(events).toEqual([]);
  });

  test('shows movies a search returned, with where to watch for the region', async () => {
    const { events, tool } = setup();

    const results = JSON.parse(String(await tool('search_movies').run({ query: 'dune' })));
    expect(results.movies.map((movie: { title: string }) => movie.title)).toEqual([
      'Dune: Part Two',
      'Dune',
    ]);

    const reply = await tool('show_movies').run({
      picks: [{ id: 693_134, reason: 'The sequel, bigger and better.' }],
    });

    expect(reply).toContain('Dune: Part Two');
    const picks = events.find((event) => event.type === 'picks');
    expect(picks).toMatchObject({
      type: 'picks',
      movies: [
        {
          id: 693_134,
          runtime: 166,
          reason: 'The sequel, bigger and better.',
          watch: { label: 'Watch on Max', url: expect.stringContaining('/movie/693134/watch') },
        },
      ],
    });
    expect(events[0]).toEqual({ type: 'status', label: 'Looking up “dune” on TMDB…' });
  });

  test('accepts ids shown on earlier turns', async () => {
    const { events, tool } = setup([27_205]);

    await tool('show_movies').run({ picks: [{ id: 27_205, reason: 'Dream heist.' }] });

    expect(events.at(-1)).toMatchObject({ type: 'picks', movies: [{ title: 'Inception' }] });
  });
});

test('describeDiscover turns filters into a status line', () => {
  expect(describeDiscover({ anyGenres: ['comedy'], maxRuntime: 120 })).toBe(
    'Searching TMDB for comedy under 2 hours…',
  );
  expect(
    describeDiscover({ genres: ['scienceFiction'], releasedFrom: 1990, releasedTo: 1999 }),
  ).toBe('Searching TMDB for science fiction from 1990–1999…');
});
