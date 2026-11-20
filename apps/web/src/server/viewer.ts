import 'server-only';
import { type ViewerSession } from '@marquee/api';
import { cookies } from 'next/headers';

const cookieName = 'marquee_viewer';
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const oneYearInSeconds = 60 * 60 * 24 * 365;

/** The anonymous viewer id, or null before the first save. Reading cookies makes the caller dynamic. */
export async function readViewerId(): Promise<string | null> {
  const value = (await cookies()).get(cookieName)?.value;
  return value && uuidPattern.test(value) ? value : null;
}

/** Issues the cookie on first use. Only callable where cookies can be set: route handlers, actions. */
async function getOrCreateViewerId(): Promise<string> {
  const existing = await readViewerId();
  if (existing) return existing;
  const id = crypto.randomUUID();
  (await cookies()).set(cookieName, id, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: oneYearInSeconds,
    path: '/',
  });
  return id;
}

export const viewerSession: ViewerSession = { get: readViewerId, getOrCreate: getOrCreateViewerId };
