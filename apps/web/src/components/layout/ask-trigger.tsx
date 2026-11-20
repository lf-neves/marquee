'use client';

import { Sparkles } from 'lucide-react';
import { useAsk } from '#/ask/ask-provider';

export function AskTrigger() {
  const { open } = useAsk();
  return (
    <button
      type="button"
      onClick={() => open()}
      aria-label="Ask Marquee"
      aria-keyshortcuts="Meta+K Control+K"
      className="flex h-[46px] w-[min(560px,44vw)] items-center gap-2.5 rounded-full border border-line bg-surface pr-2.5 pl-4 text-left text-fg-muted shadow-[0_1px_2px_rgb(0_0_0/0.08),0_6px_18px_-10px_rgb(0_0_0/0.35)] hover:border-line-strong max-md:size-10 max-md:justify-center max-md:rounded-[10px] max-md:p-0 max-md:shadow-none"
    >
      <Sparkles className="size-[18px] shrink-0 text-accent-ink" aria-hidden />
      <span className="flex-1 truncate text-sm max-md:hidden">
        Ask for a movie… “something funny under 2 hours”
      </span>
      <kbd className="rounded-[5px] border border-b-2 border-line bg-surface-2 px-1.5 py-[3px] font-mono text-[11px] leading-none font-medium text-fg-muted max-md:hidden">
        ⌘K
      </kbd>
    </button>
  );
}
