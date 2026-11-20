'use client';

import { type MovieSummary, type Page, type TrendingWindow } from '@marquee/tmdb/types';
import { useInfiniteQuery } from '@tanstack/react-query';
import { AlertTriangle } from 'lucide-react';
import { startTransition, useEffect, useRef, useState } from 'react';
import { useTRPC } from '#/trpc/react';
import { PosterCard, PosterCardSkeleton } from '../movie/poster-card';
import { Button } from '../ui/button';

type TrendingBrowserProps = {
  initialWindow: TrendingWindow;
  /** Page 1 of both windows, rendered on the server from the shared cache. */
  firstPages: Record<TrendingWindow, Page<MovieSummary>>;
};

const windowLabels: Record<TrendingWindow, string> = {
  day: 'What people are watching on TMDB today',
  week: 'What people watched on TMDB this week',
};

export function TrendingBrowser({ initialWindow, firstPages }: TrendingBrowserProps) {
  const trpc = useTRPC();
  const [window, setWindow] = useState(initialWindow);
  const sentinel = useRef<HTMLDivElement>(null);

  const query = useInfiniteQuery(
    trpc.movies.trending.infiniteQueryOptions(
      { window },
      {
        getNextPageParam: (lastPage) => lastPage.nextPage,
        initialData: { pages: [firstPages[window]], pageParams: [1] },
        staleTime: 5 * 60_000,
      },
    ),
  );
  const { fetchNextPage, hasNextPage, isFetchingNextPage, isFetchNextPageError } = query;

  // TMDB's ranking shifts between requests, so a movie can appear on two pages; keep the first.
  const seen = new Set<number>();
  const movies = (query.data?.pages ?? []).flatMap((page) =>
    page.results.filter((movie) => (seen.has(movie.id) ? false : (seen.add(movie.id), true))),
  );

  useEffect(() => {
    const element = sentinel.current;
    if (!element || !hasNextPage || isFetchNextPageError) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting) && !isFetchingNextPage)
          void fetchNextPage();
      },
      { rootMargin: '600px 0px' },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage, isFetchNextPageError]);

  const choose = (next: TrendingWindow) => {
    startTransition(() => setWindow(next));
    // A shareable URL without a server round trip; Next.js syncs native history calls with its router.
    globalThis.history.replaceState(null, '', next === 'week' ? '?window=week' : '/trending');
  };

  return (
    <>
      <div className="mb-[26px] flex flex-wrap items-end justify-between gap-x-6 gap-y-3.5">
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-fg-muted">
          {windowLabels[window]}
          <span className="font-mono" aria-live="polite">
            · {movies.length} of {firstPages[window].totalResults.toLocaleString('en-US')}
          </span>
        </p>
        <div
          role="group"
          aria-label="Trending window"
          className="inline-flex rounded-[10px] border border-line bg-surface-2 p-[3px]"
        >
          {(['day', 'week'] as const).map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={window === option}
              onClick={() => choose(option)}
              className="rounded-[7px] px-3.5 py-[7px] text-[13.5px] font-medium text-fg-muted hover:text-fg aria-pressed:bg-surface aria-pressed:text-fg aria-pressed:shadow-[0_1px_2px_rgb(0_0_0/0.18),0_0_0_1px_var(--line)]"
            >
              {option === 'day' ? 'Today' : 'This week'}
            </button>
          ))}
        </div>
      </div>

      <div className="poster-grid">
        {movies.map((movie, index) => (
          <PosterCard key={movie.id} movie={movie} rank={index + 1} preload={index === 0} />
        ))}
        {isFetchingNextPage
          ? Array.from({ length: 6 }, (_, index) => <PosterCardSkeleton key={index} />)
          : null}
      </div>

      {isFetchNextPageError ? (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-center gap-2.5 pt-9 pb-2 font-mono text-[13px] text-fg-muted"
        >
          <AlertTriangle className="size-4" aria-hidden />
          Couldn’t load more movies.
          <Button variant="ghost" size="sm" onClick={() => void fetchNextPage()}>
            Try again
          </Button>
        </div>
      ) : hasNextPage ? (
        <div ref={sentinel} aria-hidden className="h-px" />
      ) : (
        <p className="pt-9 pb-2 text-center font-mono text-[13px] text-fg-faint">
          You’ve reached the end of the trending list.
        </p>
      )}
    </>
  );
}

export function TrendingSkeleton() {
  return (
    <div aria-busy className="poster-grid pt-[62px]">
      {Array.from({ length: 12 }, (_, index) => (
        <PosterCardSkeleton key={index} />
      ))}
    </div>
  );
}
