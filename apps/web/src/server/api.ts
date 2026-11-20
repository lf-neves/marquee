import 'server-only';
import { type ApiContext, createCaller } from '@marquee/api';
import { catalog } from './catalog';
import { watchlistStore } from './database';
import { getRegion } from './region';
import { viewerSession } from './viewer';

export async function createApiContext(): Promise<ApiContext> {
  return {
    catalog,
    region: await getRegion(),
    watchlist: watchlistStore(),
    viewer: viewerSession,
  };
}

/** Calls tRPC procedures in-process, for Server Components and the Ask route. */
export async function serverApi() {
  return createCaller(await createApiContext());
}
