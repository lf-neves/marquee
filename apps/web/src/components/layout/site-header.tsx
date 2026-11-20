import Link from 'next/link';
import { Suspense } from 'react';
import { AskTrigger } from './ask-trigger';
import { NavLinks, NavLinksView } from './nav-links';

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/85 backdrop-blur-[14px] backdrop-saturate-[1.4]">
      <div className="wrap flex h-16 items-center gap-5 max-md:gap-2">
        <Link
          href="/"
          aria-label="Marquee home"
          className="inline-flex items-center gap-2.5 text-fg"
        >
          <span
            aria-hidden
            className="grid size-[30px] place-items-center rounded-lg border-2 border-dotted border-accent font-display text-lg leading-none font-extrabold text-accent"
          >
            M
          </span>
          <span className="font-display text-2xl leading-none font-extrabold tracking-[0.08em] uppercase max-sm:hidden">
            Marquee
          </span>
        </Link>
        <Suspense fallback={<NavLinksView pathname={null} />}>
          <NavLinks />
        </Suspense>
        <div className="ml-auto flex items-center gap-2.5">
          <AskTrigger />
        </div>
      </div>
    </header>
  );
}
