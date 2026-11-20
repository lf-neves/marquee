import { describe, expect, test } from 'vitest';
import { type AskEvent, askRequest, encodeAskEvent, readAskEvents } from './protocol';

async function* chunksOf(...chunks: string[]) {
  for (const chunk of chunks) yield chunk;
}

async function collect(chunks: AsyncIterable<string>) {
  const events: AskEvent[] = [];
  for await (const event of readAskEvents(chunks)) events.push(event);
  return events;
}

describe('readAskEvents', () => {
  test('joins lines split across chunks', async () => {
    const stream = [
      encodeAskEvent({ type: 'status', label: 'Searching…' }),
      encodeAskEvent({ type: 'text', delta: 'Here are ' }),
      encodeAskEvent({ type: 'text', delta: 'three picks.' }),
      encodeAskEvent({ type: 'done' }),
    ].join('');
    const cuts = [7, 30, 31, 70];
    const chunks = [0, ...cuts].map((start, index) => stream.slice(start, cuts[index]));

    expect(await collect(chunksOf(...chunks))).toEqual([
      { type: 'status', label: 'Searching…' },
      { type: 'text', delta: 'Here are ' },
      { type: 'text', delta: 'three picks.' },
      { type: 'done' },
    ]);
  });

  test('reads a final event without a trailing newline and skips malformed lines', async () => {
    const events = await collect(
      chunksOf(
        'not json\n',
        '{"type":"mystery"}\n',
        '{"type":"error","code":"busy","message":"Busy."}',
      ),
    );

    expect(events).toEqual([{ type: 'error', code: 'busy', message: 'Busy.' }]);
  });
});

describe('askRequest', () => {
  test('requires the last message to come from the viewer', () => {
    const result = askRequest.safeParse({
      messages: [
        { role: 'user', content: 'Something funny' },
        { role: 'assistant', content: 'Here you go.', shownIds: [346_698] },
      ],
    });

    expect(result.success).toBe(false);
  });

  test('rejects oversized messages and histories', () => {
    expect(
      askRequest.safeParse({ messages: [{ role: 'user', content: 'x'.repeat(601) }] }).success,
    ).toBe(false);
    const thirteen = Array.from({ length: 13 }, (_, index) => ({
      role: index % 2 === 0 ? ('user' as const) : ('assistant' as const),
      content: 'hi',
    }));
    expect(askRequest.safeParse({ messages: thirteen }).success).toBe(false);
  });
});
