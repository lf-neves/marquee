import { type MovieSummary } from '@marquee/tmdb/types';
import { type Route } from 'next';
import Link from 'next/link';
import { useId } from 'react';
import { MovieTile } from './movie-tile';
import { RowScroller } from './row-scroller';

type MovieRowProps = {
  title: string;
  movies: MovieSummary[];
  /** A short reason the row exists, shown next to the title. */
  why?: string;
  seeAll?: { href: Route; label?: string };
};

export function MovieRow({ title, movies, why, seeAll }: MovieRowProps) {
  const headingId = useId();
  if (movies.length === 0) return null;
  return (
    <section aria-labelledby={headingId}>
      <div className="wrap mb-2.5 flex flex-wrap items-baseline gap-x-3.5 gap-y-1">
        <h2 id={headingId} className="text-xl font-semibold tracking-[-0.01em]">
          {title}
        </h2>
        {why ? <span className="font-mono text-[12.5px] text-fg-faint">{why}</span> : null}
        {seeAll ? (
          <Link
            href={seeAll.href}
            className="ml-auto text-sm font-medium text-fg-muted underline-offset-4 hover:text-fg hover:underline"
          >
            {seeAll.label ?? 'See all'}
          </Link>
        ) : null}
      </div>
      <RowScroller label={title}>
        {movies.map((movie) => (
          <MovieTile key={movie.id} movie={movie} />
        ))}
      </RowScroller>
    </section>
  );
}

export function MovieRowSkeleton({ title }: { title: string }) {
  return (
    <section aria-hidden>
      <div className="wrap mb-2.5">
        <h2 className="text-xl font-semibold tracking-[-0.01em] text-fg-faint">{title}</h2>
      </div>
      <div className="row-track">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="skeleton aspect-video rounded-lg" />
        ))}
      </div>
    </section>
  );
}
