'use client';

import { TmdbCredit } from '../layout/tmdb-credit';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from '../ui/dialog';

export type MovieFacts = {
  title: string;
  tagline: string | null;
  /** The full overview; the movie page clamps it to three lines. */
  overview: string;
  facts: { label: string; value: string }[];
  genres: string[];
};

export function InfoDialog({ title, tagline, overview, facts, genres }: MovieFacts) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="link" size="sm" className="px-0 text-sm">
          More info
        </Button>
      </DialogTrigger>
      <DialogContent>
        <div className="border-b border-line px-[22px] pt-[18px] pb-3 pr-16">
          <p className="mb-1 font-mono text-xs tracking-[0.12em] text-fg-faint uppercase">
            More info
          </p>
          <DialogTitle className="font-display text-[30px] leading-[0.95] font-extrabold uppercase">
            {title}
          </DialogTitle>
          <DialogDescription className="sr-only">Facts about {title}</DialogDescription>
        </div>
        <div className="grid gap-[18px] px-[22px] pt-[18px] pb-[22px]">
          {tagline || overview ? (
            <div className="grid gap-2">
              {tagline ? <p className="text-fg-muted italic">{tagline}</p> : null}
              {overview ? <p className="text-[15px] leading-relaxed">{overview}</p> : null}
            </div>
          ) : null}
          <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-2.5 text-sm">
            {facts.map((fact) => (
              <div key={fact.label} className="contents">
                <dt className="text-fg-muted">{fact.label}</dt>
                <dd className="text-right font-mono text-[13px] tabular-nums">{fact.value}</dd>
              </div>
            ))}
          </dl>
          {genres.length > 0 ? (
            <ul className="flex flex-wrap gap-2" aria-label="Genres">
              {genres.map((genre) => (
                <li
                  key={genre}
                  className="rounded-full border border-line px-[11px] py-[5px] text-[13px]"
                >
                  {genre}
                </li>
              ))}
            </ul>
          ) : null}
          <TmdbCredit className="border-t border-line pt-4" />
        </div>
      </DialogContent>
    </Dialog>
  );
}
