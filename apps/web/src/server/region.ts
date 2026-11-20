import 'server-only';
import { headers } from 'next/headers';

/**
 * The viewer's country, for watch providers and certifications. Vercel's edge sets the geo header;
 * elsewhere the browser's language region (pt-BR → BR) is the best available hint.
 */
export async function getRegion(): Promise<string> {
  const requestHeaders = await headers();
  const geo = requestHeaders.get('x-vercel-ip-country')?.toUpperCase();
  if (geo && /^[A-Z]{2}$/.test(geo)) return geo;
  const language = requestHeaders.get('accept-language') ?? '';
  const region = /^[a-z]{2,3}-([A-Z]{2})\b/i.exec(language)?.[1]?.toUpperCase();
  return region ?? 'US';
}
