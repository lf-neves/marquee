'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
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

/** Saved movie ids, shared by every save button and the header count through the query cache. */
export function useWatchlistIds(): number[] {
  const trpc = useTRPC();
  const enabled = useWatchlistEnabled();
  const { data } = useQuery({ ...trpc.watchlist.ids.queryOptions(), enabled });
  return data ?? [];
}

export function useToggleWatchlist() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const router = useRouter();
  const idsKey = trpc.watchlist.ids.queryKey();

  return useMutation(
    trpc.watchlist.toggle.mutationOptions({
      // Flip the button at once; roll back if the server disagrees.
      onMutate: async ({ movieId }) => {
        await queryClient.cancelQueries({ queryKey: idsKey });
        const previous = queryClient.getQueryData(idsKey);
        queryClient.setQueryData(idsKey, (ids = []) =>
          ids.includes(movieId) ? ids.filter((id) => id !== movieId) : [movieId, ...ids],
        );
        return { previous };
      },
      onError: (_error, { movieId }, context) => {
        queryClient.setQueryData(idsKey, context?.previous);
        // Replaces the optimistic "Added…" toast for the same movie.
        toast('Couldn’t update your watchlist. Try again.', { id: watchlistToastId(movieId) });
      },
      onSettled: async () => {
        await queryClient.invalidateQueries({ queryKey: trpc.watchlist.pathKey() });
        // Server-rendered rows ("My List", "Because you saved…") read the same data.
        router.refresh();
      },
    }),
  );
}

const watchlistToastId = (movieId: number) => `watchlist-${movieId}`;

/**
 * Saves or removes a movie and confirms it with an Undo toast. The toast shows at once, like the
 * button, because the outcome is known before the server answers; a failure replaces it.
 */
export function useWatchlistToggle(movie: { id: number; title: string }) {
  const toggle = useToggleWatchlist();
  const saved = useWatchlistIds().includes(movie.id);

  const run = () => {
    toggle.mutate({ movieId: movie.id });
    toast(
      saved
        ? `Removed “${movie.title}” from your watchlist.`
        : `Added “${movie.title}” to your watchlist.`,
      {
        id: watchlistToastId(movie.id),
        action: { label: 'Undo', onClick: () => toggle.mutate({ movieId: movie.id }) },
      },
    );
  };

  return { saved, toggle: run };
}
