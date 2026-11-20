import { initTRPC } from '@trpc/server';
import { type ApiContext } from './context';

const t = initTRPC.context<ApiContext>().create();

export const createRouter = t.router;
export const publicProcedure = t.procedure;
export const createCallerFactory = t.createCallerFactory;
