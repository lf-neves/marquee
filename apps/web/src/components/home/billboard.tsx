'use client';

import { type Route } from 'next';
import Link from 'next/link';
import { ViewTransition, startTransition, useState } from 'react';
import { runtimeText } from '#/lib/format';
import { ScoreText } from '../movie/score';
import { TmdbImage } from '../movie/tmdb-image';
import { TrailerDialog } from '../movie/trailer-dialog';
import { Button } from '../ui/button';
import { WatchlistButton } from '../watchlist/watchlist-button';

export type BillboardMovie = {
  id: number;
  title: string;
  href: Route;
  overview: string;
  year: number | null;
  runtime: number | null;
  certification: string | null;
  genres: string[];
  score: number;
  voteCount: number;
  backdropPath: string | null;
  trailer: { youtubeKey: string; name: string } | null;
};

/** Today's top five on TMDB. The picker crossfades between them through a React view transition. */
export function Billboard({ movies }: { movies: BillboardMovie[] }) {
  const [index, setIndex] = useState(0);
  const movie = movies[index] ?? movies[0];
  if (!movie) return null;

  return (
    <section aria-label="Billboard" className="screen-band">
      <ViewTransition key={movie.id} enter="fade-in" exit="fade-out" default="none">
        <div className="absolute inset-0 -z-2 md:left-[28%] max-md:h-[300px]">
          <TmdbImage
            path={movie.backdropPath}
            kind="backdrop"
            alt=""
            sizes="(max-width: 719px) 100vw, 72vw"
            preload={index === 0}
          />
        </div>
      </ViewTransition>
      <div className="wrap grid min-h-[max(480px,72dvh)] content-end gap-[18px] pt-16 pb-6 max-md:min-h-0 max-md:gap-3.5 max-md:pt-[190px] max-md:pb-5">
        <p className="eyebrow">#{index + 1} trending today</p>
        <h1 className="max-w-[11ch] font-display text-[clamp(48px,7vw,92px)] leading-[0.86] font-extrabold tracking-[0.01em] uppercase">
          {movie.title}
        </h1>
        <p className="meta">
          {movie.year ? <span>{movie.year}</span> : null}
          {movie.certification ? (
            <span className="rounded border border-current px-1.5 text-[11.5px] leading-[1.4] opacity-90">
              {movie.certification}
            </span>
          ) : null}
          {movie.runtime ? <span>{runtimeText(movie.runtime)}</span> : null}
          {movie.genres.length > 0 ? <span>{movie.genres.slice(0, 3).join(', ')}</span> : null}
          <ScoreText score={movie.score} voteCount={movie.voteCount} />
        </p>
        <p className="line-clamp-3 max-w-[56ch] text-base text-screen-muted max-md:text-[15px]">
          {movie.overview}
        </p>
        <div className="flex flex-wrap items-center gap-2.5">
          <Button asChild>
            <Link href={movie.href}>View details</Link>
          </Button>
          {movie.trailer ? <TrailerDialog title={movie.title} trailer={movie.trailer} /> : null}
          <WatchlistButton movie={movie} variant="screen" />
        </div>
        <div
          role="group"
          aria-label="Top five trending today"
          className="mt-3.5 flex gap-1 overflow-x-auto border-t border-screen-line pt-3.5 [scrollbar-width:none]"
        >
          {movies.map((candidate, candidateIndex) => (
            <button
              key={candidate.id}
              type="button"
              aria-pressed={candidateIndex === index}
              onClick={() => startTransition(() => setIndex(candidateIndex))}
              className="group/pick flex shrink-0 items-baseline gap-2 rounded-lg py-1.5 pr-3 pl-2 text-[13px] whitespace-nowrap text-screen-muted hover:text-screen-fg aria-pressed:bg-white/8 aria-pressed:text-screen-fg"
            >
              <span className="font-display text-[22px] leading-none font-extrabold text-screen-fg opacity-45 group-aria-pressed/pick:text-accent group-aria-pressed/pick:opacity-100">
                {candidateIndex + 1}
              </span>
              <span>{candidate.title}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
