import { appRouter } from '@marquee/api';
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { createApiContext } from '#/server/api';

const handler = (request: Request) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req: request,
    router: appRouter,
    createContext: createApiContext,
    onError: ({ error, path }) => {
      if (error.code === 'INTERNAL_SERVER_ERROR') {
        console.error(`tRPC ${path ?? 'unknown'} failed`, error.cause ?? error);
      }
    },
  });

export { handler as GET, handler as POST };
