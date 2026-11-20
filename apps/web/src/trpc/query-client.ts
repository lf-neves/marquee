import { QueryClient, defaultShouldDehydrateQuery } from '@tanstack/react-query';

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      // Catalog data changes daily; refetching on every focus would only burn TMDB quota.
      queries: { staleTime: 5 * 60_000, refetchOnWindowFocus: false },
      dehydrate: {
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) || query.state.status === 'pending',
      },
    },
  });
}
