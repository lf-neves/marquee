import { describe, expect, test } from 'vitest';
import { clientAddress, createRateLimiter } from './rate-limit';

describe('createRateLimiter', () => {
  test('allows up to the limit inside the window, then reopens as hits age out', () => {
    let now = 0;
    const limiter = createRateLimiter([{ limit: 3, windowMs: 60_000 }], () => now);

    expect(limiter.check('a').allowed).toBe(true);
    now = 10_000;
    expect(limiter.check('a').allowed).toBe(true);
    expect(limiter.check('a').allowed).toBe(true);
    const blocked = limiter.check('a');
    expect(blocked).toEqual({ allowed: false, retryAfterMs: 50_000 });
    expect(limiter.check('b').allowed).toBe(true);

    now = 60_000;
    expect(limiter.check('a').allowed).toBe(true);
  });

  test('applies the strictest of several windows', () => {
    let now = 0;
    const limiter = createRateLimiter(
      [
        { limit: 2, windowMs: 1000 },
        { limit: 3, windowMs: 10_000 },
      ],
      () => now,
    );

    limiter.check('a');
    limiter.check('a');
    now = 1500;
    expect(limiter.check('a').allowed).toBe(true);
    now = 3000;
    expect(limiter.check('a')).toEqual({ allowed: false, retryAfterMs: 7000 });
  });
});

test('clientAddress reads the first forwarded address', () => {
  expect(clientAddress(new Headers({ 'x-forwarded-for': '203.0.113.7, 10.0.0.1' }))).toBe(
    '203.0.113.7',
  );
  expect(clientAddress(new Headers())).toBe('unknown');
});
