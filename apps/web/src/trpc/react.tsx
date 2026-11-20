'use client';

import { type AppRouter } from '@marquee/api';
import { type QueryClient, QueryClientProvider, isServer } from '@tanstack/react-query';
import { createTRPCClient, httpBatchLink } from '@trpc/client';
import { createTRPCContext } from '@trpc/tanstack-react-query';
import { type ReactNode, useState } from 'react';
import { makeQueryClient } from './query-client';

export const { TRPCProvider, useTRPC } = createTRPCContext<AppRouter>();

let browserQueryClient: QueryClient | undefined;

// The server needs a fresh client per request; the browser keeps one for the whole session.
function getQueryClient(): QueryClient {
  if (isServer) return makeQueryClient();
  browserQueryClient ??= makeQueryClient();
  return browserQueryClient;
}

export function TRPCReactProvider({ children }: { children: ReactNode }) {
  const queryClient = getQueryClient();
  const [trpcClient] = useState(() =>
    createTRPCClient<AppRouter>({ links: [httpBatchLink({ url: '/api/trpc' })] }),
  );
  return (
    <QueryClientProvider client={queryClient}>
      <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
        {children}
      </TRPCProvider>
    </QueryClientProvider>
  );
}
