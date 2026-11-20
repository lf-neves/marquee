'use client';

import { ArrowUp, Sparkles } from 'lucide-react';
import { useAsk } from '#/ask/ask-provider';

const moods = [
  'Cozy and funny',
  'Something to make me think',
  'A good cry',
  'Adrenaline, under 2 hours',
];

export function EndAsk() {
  const { open } = useAsk();
  return (
    <section aria-labelledby="end-ask-title" className="pt-14 pb-6 text-center">
      <div className="wrap grid justify-items-center gap-3.5">
        <span className="grid size-11 place-items-center rounded-full bg-accent-soft text-accent-ink">
          <Sparkles className="size-5" aria-hidden />
        </span>
        <h2
          id="end-ask-title"
          className="mt-1 text-[clamp(26px,3.4vw,34px)] font-semibold tracking-[-0.02em]"
        >
          What&apos;s your mood today?
        </h2>
        <p className="max-w-[52ch] text-fg-muted">
          Didn&apos;t find it in the rows? Tell us in your own words and we&apos;ll help you find
          the movie.
        </p>
        <button
          type="button"
          onClick={() => open()}
          className="mt-1.5 flex min-h-[60px] w-[min(720px,100%)] cursor-text items-center gap-2.5 rounded-[30px] border border-line-strong bg-surface py-2.5 pr-2.5 pl-[22px] text-left text-base text-fg-faint shadow-[0_10px_30px_-16px_rgb(0_0_0/0.45)] hover:border-fg-faint"
        >
          <span className="min-w-0 flex-1">I want something light for a rainy night…</span>
          <span
            aria-hidden
            className="grid size-10 shrink-0 place-items-center rounded-full bg-fg text-bg"
          >
            <ArrowUp className="size-[18px]" />
          </span>
        </button>
        <ul className="flex max-w-[560px] flex-wrap justify-center gap-2" aria-label="Moods">
          {moods.map((mood) => (
            <li key={mood}>
              <button
                type="button"
                onClick={() => open(mood)}
                className="rounded-full border border-line bg-surface px-3.5 py-[9px] text-sm text-fg hover:border-line-strong hover:bg-surface-2"
              >
                {mood}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
