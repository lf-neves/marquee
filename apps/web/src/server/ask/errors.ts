import {
  APIConnectionError,
  APIError,
  APIUserAbortError,
  AuthenticationError,
  InternalServerError,
  PermissionDeniedError,
  RateLimitError,
} from '@anthropic-ai/sdk';
import { TmdbError } from '@marquee/tmdb/client';
import { type AskEvent } from '#/ask/protocol';

type AskErrorEvent = Extract<AskEvent, { type: 'error' }>;

/** Raised when a turn ran out of tokens in the middle of a tool call. */
export class TruncatedToolInputError extends Error {
  constructor() {
    super('A tool call was cut off by the token limit.');
    this.name = 'TruncatedToolInputError';
  }
}

/**
 * Maps a failure to an event the dialog can show. Messages are written for viewers; status codes,
 * keys and stack traces never leave the server. Returns null when the viewer cancelled.
 */
export function toAskError(error: unknown): AskErrorEvent | null {
  if (error instanceof APIUserAbortError) return null;
  if (error instanceof RateLimitError) {
    return {
      type: 'error',
      code: 'busy',
      message: 'Ask Marquee is busy right now. Try again in a minute.',
    };
  }
  if (error instanceof AuthenticationError || error instanceof PermissionDeniedError) {
    return {
      type: 'error',
      code: 'unavailable',
      message: 'Ask Marquee is not available right now.',
    };
  }
  if (error instanceof APIConnectionError || error instanceof InternalServerError) {
    return {
      type: 'error',
      code: 'busy',
      message: 'Claude didn’t respond in time. Try again in a moment.',
    };
  }
  if (error instanceof APIError || error instanceof TruncatedToolInputError) {
    return {
      type: 'error',
      code: 'failed',
      message: 'Ask Marquee couldn’t finish that answer. Try again.',
    };
  }
  if (error instanceof TmdbError) {
    return {
      type: 'error',
      code: 'unavailable',
      message: 'TMDB didn’t respond in time. Try again in a moment.',
    };
  }
  return { type: 'error', code: 'failed', message: 'Something went wrong. Try again.' };
}
