'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { type ReactNode, useRef } from 'react';

/** Scroll-snapped row with previous and next buttons for pointer users; touch users swipe. */
export function RowScroller({ label, children }: { label: string; children: ReactNode }) {
  const track = useRef<HTMLDivElement>(null);
  const scroll = (direction: 1 | -1) => {
    const element = track.current;
    if (!element) return;
    element.scrollBy({ left: direction * element.clientWidth * 0.85, behavior: 'smooth' });
  };
  const buttonClass =
    'absolute top-2 bottom-3.5 z-20 hidden w-[30px] place-items-center bg-bg/70 text-fg opacity-0 transition-opacity group-hover/row:opacity-100 focus-visible:opacity-100 [@media(hover:hover)]:grid';
  return (
    <div className="group/row relative">
      <button
        type="button"
        className={`${buttonClass} left-0`}
        onClick={() => scroll(-1)}
        aria-label={`Scroll ${label} left`}
      >
        <ChevronLeft className="size-[18px]" aria-hidden />
      </button>
      <div ref={track} className="row-track">
        {children}
      </div>
      <button
        type="button"
        className={`${buttonClass} right-0`}
        onClick={() => scroll(1)}
        aria-label={`Scroll ${label} right`}
      >
        <ChevronRight className="size-[18px]" aria-hidden />
      </button>
    </div>
  );
}
