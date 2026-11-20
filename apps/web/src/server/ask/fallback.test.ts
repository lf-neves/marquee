import { describe, expect, test } from 'vitest';
import { type AskEvent } from '#/ask/protocol';
import { fallbackQuery, runKeywordFallback } from './fallback';
import { createFixtureCatalog } from './fixture-catalog';

async function run(text: string, why?: 'off' | 'unavailable') {
  const events: AskEvent[] = [];
  await runKeywordFallback({
    text,
    catalog: createFixtureCatalog(),
    region: 'US',
    emit: (event) => events.push(event),
    why,
  });
  return events;
}

describe('runKeywordFallback', () => {
  test('answers with title matches and says the AI is off', async () => {
    const events = await run('More like Dune.');

    const text = events.find((event) => event.type === 'text');
    expect(text).toMatchObject({ delta: expect.stringContaining('switched off') });
    expect(events.find((event) => event.type === 'picks')).toMatchObject({
      movies: [{ title: 'Dune: Part Two', reason: 'Title match for “Dune”.' }, { title: 'Dune' }],
    });
  });

  test('says the AI is unavailable when Claude refused the request', async () => {
    const events = await run('Parasite', 'unavailable');

    expect(events.find((event) => event.type === 'text')).toMatchObject({
      delta: expect.stringContaining('unavailable right now'),
    });
    expect(events.find((event) => event.type === 'picks')).toMatchObject({
      movies: [{ title: 'Parasite' }],
    });
  });

  test('falls back to today’s trending movies when no title matches', async () => {
    const events = await run('something cozy for a rainy night');

    expect(events.find((event) => event.type === 'text')).toMatchObject({
      delta: expect.stringContaining('trending today'),
    });
    const picks = events.find((event) => event.type === 'picks');
    expect(picks?.type === 'picks' && picks.movies).toHaveLength(3);
  });
});

test('fallbackQuery keeps the title from a request', () => {
  expect(fallbackQuery('Movies like “Interstellar”!')).toBe('Interstellar');
  expect(fallbackQuery('Parasite')).toBe('Parasite');
});
