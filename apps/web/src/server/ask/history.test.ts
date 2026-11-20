import { expect, test } from 'vitest';
import { buildAskMessages, shownIdsOf } from './history';

test('assistant turns list the movies their cards showed, and context comes last', () => {
  const history = [
    { role: 'user' as const, content: 'Something funny under 2 hours' },
    {
      role: 'assistant' as const,
      content: 'Three light ones.',
      shownIds: [346_698, 1_022_789, 999],
    },
    { role: 'user' as const, content: 'More like the second one' },
  ];

  const messages = buildAskMessages({
    history,
    titles: new Map([
      [346_698, 'Barbie'],
      [1_022_789, 'Inside Out 2'],
    ]),
    context: { country: 'Brazil (BR)', today: '2026-11-20' },
  });

  expect(messages).toEqual([
    { role: 'user', content: 'Something funny under 2 hours' },
    {
      role: 'assistant',
      content: 'Three light ones.\n\n[Shown: Barbie (346698), Inside Out 2 (1022789), #999]',
    },
    { role: 'user', content: 'More like the second one' },
    { role: 'system', content: "Viewer's country: Brazil (BR). Today's date: 2026-11-20." },
  ]);
  expect(shownIdsOf(history)).toEqual([346_698, 1_022_789, 999]);
});
