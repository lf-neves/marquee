'use client';

import { type MovieSummary } from '@marquee/tmdb/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { type ReactNode, createContext, use } from 'react';
import { toast } from 'sonner';
import { useTRPC } from '#/trpc/react';

const WatchlistEnabled = createContext(false);

export function WatchlistProvider({
  enabled,
  children,
}: {
  enabled: boolean;
  children: ReactNode;
}) {
  return <WatchlistEnabled value={enabled}>{children}</WatchlistEnabled>;
}

export const useWatchlistEnabled = () => use(WatchlistEnabled);

/**
 * Saved movie ids, shared by every save button and the header count through the query cache.
 * `undefined` until known: the server seeds it with the page, so a count never shows a false 0.
 */
export function useWatchlistIdsQuery(): number[] | undefined {
  const trpc = useTRPC();
  const enabled = useWatchlistEnabled();
  return useQuery({ ...trpc.watchlist.ids.queryOptions(), enabled }).data;
}

export const useWatchlistIds = (): number[] => useWatchlistIdsQuery() ?? [];

/** Saved movies, newest first; My List and the watchlist page render from this one cache entry. */
export function useSavedMovies(): MovieSummary[] | undefined {
  const trpc = useTRPC();
  const enabled = useWatchlistEnabled();
  return useQuery({ ...trpc.watchlist.list.queryOptions(), enabled }).data;
}

const toastId = (movieId: number) => `watchlist-${movieId}`;

/**
 * Saves or removes a movie. The ids and the saved list change in the cache at once, so the button,
 * the header count, My List and the watchlist page all update before the server answers; a failure
 * rolls both back. The callbacks live on the mutation, so they still run if the button unmounts,
 * for example when its card leaves the watchlist page.
 */
export function useWatchlistToggle(movie: MovieSummary) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const saved = useWatchlistIds().includes(movie.id);
  const idsKey = trpc.watchlist.ids.queryKey();
  const listKey = trpc.watchlist.list.queryKey();

  const mutation = useMutation(
    trpc.watchlist.set.mutationOptions({
      onMutate: async ({ saved: nextSaved }) => {
        await queryClient.cancelQueries({ queryKey: trpc.watchlist.pathKey() });
        const previous = {
          ids: queryClient.getQueryData(idsKey),
          list: queryClient.getQueryData(listKey),
        };
        queryClient.setQueryData(idsKey, (ids = []) => {
          const others = ids.filter((id) => id !== movie.id);
          return nextSaved ? [movie.id, ...others] : others;
        });
        queryClient.setQueryData(listKey, (list) => {
          if (!list) return list;
          const others = list.filter((item) => item.id !== movie.id);
          return nextSaved ? [movie, ...others] : others;
        });
        return previous;
      },
      onError: (_error, _input, previous) => {
        queryClient.setQueryData(idsKey, previous?.ids);
        queryClient.setQueryData(listKey, previous?.list);
        // Replaces the optimistic toast for the same movie.
        toast('Couldn’t update your watchlist. Try again.', { id: toastId(movie.id) });
      },
      onSettled: () => queryClient.invalidateQueries({ queryKey: trpc.watchlist.pathKey() }),
    }),
  );

  const setSaved = (nextSaved: boolean) => mutation.mutate({ movieId: movie.id, saved: nextSaved });

  const toggle = () => {
    const nextSaved = !saved;
    setSaved(nextSaved);
    toast(
      nextSaved
        ? `Added “${movie.title}” to your watchlist.`
        : `Removed “${movie.title}” from your watchlist.`,
      {
        id: toastId(movie.id),
        action: { label: 'Undo', onClick: () => setSaved(!nextSaved) },
      },
    );
  };

  return { saved, toggle };
}
