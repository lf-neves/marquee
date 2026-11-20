'use client';

import { useEffect, useRef, useState } from 'react';
import {
  type AskErrorCode,
  type AskEvent,
  type AskHistoryMessage,
  type AskPick,
  maxAskMessageLength,
  maxAskMessages,
  readAskEvents,
  textChunks,
} from './protocol';

export type AskUserTurn = { id: string; role: 'user'; text: string };

export type AskAssistantTurn = {
  id: string;
  role: 'assistant';
  text: string;
  picks: AskPick[];
  /** What the assistant is doing while tools run, for example "Searching TMDB for comedies…". */
  status: string | null;
  state: 'streaming' | 'done' | 'error';
  error: { message: string; code: AskErrorCode } | null;
};

export type AskTurn = AskUserTurn | AskAssistantTurn;

const offlineError = {
  message: 'Couldn’t reach Ask Marquee. Check your connection and try again.',
  code: 'failed' as const,
};

/**
 * The history the server sees: viewer messages plus completed answers, newest last. Failed answers
 * are left out; their questions stay, so a retry can ask again.
 */
export function toAskHistory(turns: AskTurn[]): AskHistoryMessage[] {
  const history = turns.flatMap((turn): AskHistoryMessage[] => {
    if (turn.role === 'user')
      return [{ role: 'user', content: turn.text.slice(0, maxAskMessageLength) }];
    if (turn.state !== 'done' || (!turn.text.trim() && turn.picks.length === 0)) return [];
    const content = (turn.text.trim() || 'Here are a few picks.').slice(0, maxAskMessageLength);
    const shownIds = turn.picks.map((pick) => pick.id);
    return [{ role: 'assistant', content, ...(shownIds.length ? { shownIds } : {}) }];
  });
  const recent = history.slice(-maxAskMessages);
  const firstUser = recent.findIndex((message) => message.role === 'user');
  return firstUser === -1 ? [] : recent.slice(firstUser);
}

function applyEvent(turn: AskAssistantTurn, event: AskEvent): AskAssistantTurn {
  switch (event.type) {
    case 'status':
      return { ...turn, status: event.label };
    case 'text':
      return { ...turn, text: turn.text + event.delta, status: null };
    case 'picks':
      return { ...turn, picks: [...turn.picks, ...event.movies], status: null };
    case 'done':
      return { ...turn, state: 'done', status: null };
    case 'error':
      return {
        ...turn,
        state: 'error',
        status: null,
        error: { message: event.message, code: event.code },
      };
  }
}

let turnCounter = 0;
const nextTurnId = () => `turn-${(turnCounter += 1)}`;

/** Conversation state for Ask Marquee and the streaming request behind each answer. */
export function useAskConversation() {
  const [turns, setTurns] = useState<AskTurn[]>([]);
  const controllerRef = useRef<AbortController | null>(null);
  const last = turns.at(-1);
  const busy = last?.role === 'assistant' && last.state === 'streaming';

  useEffect(() => () => controllerRef.current?.abort(), []);

  const updateAnswer = (id: string, update: (turn: AskAssistantTurn) => AskAssistantTurn) =>
    setTurns((current) =>
      current.map((turn) => (turn.id === id && turn.role === 'assistant' ? update(turn) : turn)),
    );

  async function stream(answerId: string, history: AskHistoryMessage[], signal: AbortSignal) {
    try {
      const response = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ messages: history }),
        signal,
      });
      if (!response.body) throw new Error('Empty response.');
      const chunks = textChunks(response.body.pipeThrough(new TextDecoderStream()));
      for await (const event of readAskEvents(chunks)) {
        updateAnswer(answerId, (turn) => applyEvent(turn, event));
      }
      updateAnswer(answerId, (turn) =>
        turn.state === 'streaming' ? { ...turn, state: 'done', status: null } : turn,
      );
    } catch {
      if (signal.aborted) return;
      updateAnswer(answerId, (turn) => ({
        ...turn,
        state: 'error',
        status: null,
        error: offlineError,
      }));
    }
  }

  function send(text: string, base: AskTurn[] = turns) {
    const message = text.trim().slice(0, maxAskMessageLength);
    if (!message) return;
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    const question: AskUserTurn = { id: nextTurnId(), role: 'user', text: message };
    const answer: AskAssistantTurn = {
      id: nextTurnId(),
      role: 'assistant',
      text: '',
      picks: [],
      status: null,
      state: 'streaming',
      error: null,
    };
    const settled = base.map((turn) =>
      turn.role === 'assistant' && turn.state === 'streaming'
        ? { ...turn, state: 'done' as const }
        : turn,
    );
    const history = toAskHistory([...settled, question]);
    setTurns([...settled, question, answer]);
    void stream(answer.id, history, controller.signal);
  }

  /** Asks the last failed question again. */
  function retry() {
    const failedIndex = turns.findLastIndex(
      (turn) => turn.role === 'assistant' && turn.state === 'error',
    );
    const question = turns[failedIndex - 1];
    if (failedIndex < 1 || question?.role !== 'user') return;
    send(question.text, turns.slice(0, failedIndex - 1));
  }

  function stop() {
    controllerRef.current?.abort();
    setTurns((current) =>
      current.map((turn) =>
        turn.role === 'assistant' && turn.state === 'streaming'
          ? { ...turn, state: 'done', status: null }
          : turn,
      ),
    );
  }

  function reset() {
    controllerRef.current?.abort();
    controllerRef.current = null;
    setTurns([]);
  }

  return { turns, busy, send, retry, stop, reset };
}
