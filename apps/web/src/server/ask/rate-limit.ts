export type RateLimitRule = { limit: number; windowMs: number };

export type RateLimitResult = { allowed: true } | { allowed: false; retryAfterMs: number };

/**
 * Sliding-window limiter keyed by client. State lives in this server instance's memory, so on
 * serverless platforms each warm instance counts on its own and a cold start resets the count: it
 * slows down a single noisy client, and a shared store (Redis, Upstash) is what a hard cap needs.
 */
export function createRateLimiter(rules: RateLimitRule[], now: () => number = Date.now) {
  const longestWindow = Math.max(...rules.map((rule) => rule.windowMs));
  const hits = new Map<string, number[]>();

  function prune(time: number) {
    for (const [key, times] of hits) {
      if (times.every((hit) => time - hit >= longestWindow)) hits.delete(key);
    }
  }

  return {
    check(key: string): RateLimitResult {
      const time = now();
      if (hits.size > 5000) prune(time);
      const recent = (hits.get(key) ?? []).filter((hit) => time - hit < longestWindow);
      for (const rule of rules) {
        const inWindow = recent.filter((hit) => time - hit < rule.windowMs);
        const oldest = inWindow[0];
        if (inWindow.length >= rule.limit && oldest !== undefined) {
          hits.set(key, recent);
          return { allowed: false, retryAfterMs: rule.windowMs - (time - oldest) };
        }
      }
      recent.push(time);
      hits.set(key, recent);
      return { allowed: true };
    },
  };
}

export const askRateLimiter = createRateLimiter([
  { limit: 8, windowMs: 60_000 },
  { limit: 60, windowMs: 24 * 60 * 60_000 },
]);

/** The first address in `x-forwarded-for` is the client; Vercel and most proxies set it. */
export function clientAddress(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return forwarded || headers.get('x-real-ip')?.trim() || 'unknown';
}
