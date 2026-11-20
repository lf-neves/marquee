import { describe, expect, test } from 'vitest';
import { type AskAssistantTurn, type AskTurn, toAskHistory } from './use-ask-stream';

const user = (id: string, text: string): AskTurn => ({ id, role: 'user', text });

const answer = (id: string, overrides: Partial<AskAssistantTurn> = {}): AskAssistantTurn => ({
  id,
  role: 'assistant',
  text: 'Here are three picks.',
  picks: [],
  status: null,
  state: 'done',
  error: null,
  ...overrides,
});

const pick = (id: number) => ({
  id,
  title: `Movie ${id}`,
  year: 2020,
  runtime: 100,
  score: 70,
  genres: [],
  overview: '',
  backdropPath: null,
  posterPath: null,
  reason: 'Fits.',
  watch: null,
});

describe('toAskHistory', () => {
  test('sends shown ids with completed answers', () => {
    const history = toAskHistory([
      user('1', 'Something funny'),
      answer('2', { picks: [pick(1), pick(2)] }),
      user('3', 'Shorter'),
    ]);

    expect(history).toEqual([
      { role: 'user', content: 'Something funny' },
      { role: 'assistant', content: 'Here are three picks.', shownIds: [1, 2] },
      { role: 'user', content: 'Shorter' },
    ]);
  });

  test('leaves out failed and empty answers but keeps their questions', () => {
    const history = toAskHistory([
      user('1', 'First'),
      answer('2', { state: 'error', error: { message: 'Busy.', code: 'busy' } }),
      user('3', 'Second'),
      answer('4', { text: '   ' }),
      user('5', 'Third'),
    ]);

    expect(history.map((message) => message.content)).toEqual(['First', 'Second', 'Third']);
  });

  test('keeps the newest twelve messages and always starts with the viewer', () => {
    const turns: AskTurn[] = [];
    for (let index = 0; index < 8; index += 1) {
      turns.push(
        user(`u${index}`, `question ${index}`),
        answer(`a${index}`, { text: `answer ${index}` }),
      );
    }
    turns.push(user('last', 'final question'));

    const history = toAskHistory(turns);

    expect(history.length).toBeLessThanOrEqual(12);
    expect(history[0]?.role).toBe('user');
    expect(history.at(-1)).toEqual({ role: 'user', content: 'final question' });
  });
});
