'use client';

import { ArrowUp, Square, Sparkles, X } from 'lucide-react';
import { type FormEvent, type KeyboardEvent, useEffect, useRef, useState } from 'react';
import { cn } from '#/lib/utils';
import { AskPickCard } from './pick-card';
import { maxAskMessageLength } from './protocol';
import { askButton } from './styles';
import { type AskAssistantTurn, type useAskConversation } from './use-ask-stream';

type Conversation = ReturnType<typeof useAskConversation>;

const starters = [
  'Something funny under 2 hours',
  'A true story to watch with my dad',
  'Movies like Interstellar',
  'A tense thriller, nothing scary',
];

// With the AI off, Ask Marquee answers with title search, so title starters show what works.
const titleStarters = ['Dune', 'Spider-Man', 'Parasite', 'Inception'];

const followUps = ['Something else', 'Shorter'];

function BotAvatar() {
  return (
    <span
      className="grid size-[30px] shrink-0 place-items-center rounded-full bg-accent-soft text-accent-ink"
      aria-hidden
    >
      <Sparkles className="size-4" />
    </span>
  );
}

function AssistantMessage({
  turn,
  isLast,
  onNavigate,
  onFollowUp,
  onRetry,
}: {
  turn: AskAssistantTurn;
  isLast: boolean;
  onNavigate: () => void;
  onFollowUp: (text: string) => void;
  onRetry: () => void;
}) {
  const streaming = turn.state === 'streaming';
  const waiting = streaming && !turn.text && turn.picks.length === 0;
  const empty = turn.state === 'done' && !turn.text.trim() && turn.picks.length === 0;

  return (
    <div className="flex gap-3">
      <BotAvatar />
      <div className="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)] gap-3 pt-1">
        {waiting ? (
          <div className="flex items-center gap-3 pt-1.5 text-sm text-fg-muted">
            <span className="flex gap-[5px]" aria-hidden>
              <i className="typing-dot size-[7px] rounded-full bg-fg-faint" />
              <i className="typing-dot size-[7px] rounded-full bg-fg-faint" />
              <i className="typing-dot size-[7px] rounded-full bg-fg-faint" />
            </span>
            {turn.status ? <span>{turn.status}</span> : null}
          </div>
        ) : null}
        {turn.text ? (
          <p className="break-words whitespace-pre-wrap">
            {turn.text}
            {streaming ? (
              <span
                className="ml-0.5 inline-block h-[1.05em] w-[2px] translate-y-[3px] animate-pulse bg-fg"
                aria-hidden
              />
            ) : null}
          </p>
        ) : null}
        {turn.picks.map((pick) => (
          <AskPickCard key={pick.id} pick={pick} onNavigate={onNavigate} />
        ))}
        {streaming && turn.status && !waiting ? (
          <p className="font-mono text-xs text-fg-faint">{turn.status}</p>
        ) : null}
        {empty ? (
          <p className="text-fg-muted">
            I couldn’t find anything for that. Try another mood, or a movie you liked.
          </p>
        ) : null}
        {turn.state === 'error' && turn.error ? (
          <div
            role="alert"
            className="flex flex-wrap items-center gap-3 rounded-[12px] border border-line bg-surface-2 px-3.5 py-3 text-sm"
          >
            <span className="min-w-0 flex-1 break-words">{turn.error.message}</span>
            {turn.error.code !== 'refused' ? (
              <button type="button" className={askButton.ghost} onClick={onRetry}>
                Try again
              </button>
            ) : null}
          </div>
        ) : null}
        {isLast && turn.state === 'done' && turn.picks.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {followUps.map((text) => (
              <button
                key={text}
                type="button"
                className={cn(askButton.chip, 'px-3 py-1.5 text-[13px]')}
                onClick={() => onFollowUp(text)}
              >
                {text}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

/** The announcement for assistive tech: only finished answers, never every streamed token. */
function announcementFor(turn: AskAssistantTurn | undefined): string {
  if (!turn) return '';
  if (turn.state === 'error') return turn.error?.message ?? '';
  if (turn.state !== 'done') return '';
  const picks = turn.picks.length ? ` ${turn.picks.map((pick) => pick.title).join(', ')}.` : '';
  return `${turn.text.trim()}${picks}`;
}

export function AskPanel({
  conversation,
  enabled,
  onClose,
}: {
  conversation: Conversation;
  enabled: boolean;
  onClose: () => void;
}) {
  const { turns, busy, send, retry, stop, reset } = conversation;
  const [draft, setDraft] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);

  // Runs each time the panel becomes visible again: <Activity> remounts effects, not state.
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  // Follows streamed content while the viewer is at the bottom; scrolling up pauses it.
  useEffect(() => {
    const log = logRef.current;
    if (log && stickToBottom.current) log.scrollTop = log.scrollHeight;
  });

  function resizeComposer() {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`;
  }

  function submit(text: string) {
    if (!text.trim() || busy) return;
    stickToBottom.current = true;
    send(text);
    setDraft('');
    requestAnimationFrame(resizeComposer);
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    submit(draft);
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      submit(draft);
    }
  }

  function startOver() {
    reset();
    setDraft('');
    textareaRef.current?.focus();
  }

  const lastTurn = turns.at(-1);
  const lastAnswer = lastTurn?.role === 'assistant' ? lastTurn : undefined;

  return (
    <div className="flex h-full max-h-dvh min-h-0 min-w-0 flex-col">
      <header className="flex items-center justify-between gap-2.5 border-b border-line pt-[max(12px,env(safe-area-inset-top,0px))] pr-3.5 pb-3 pl-5 max-[719px]:pl-4">
        <h2 className="font-semibold">Ask Marquee</h2>
        <div className="flex gap-2">
          <button
            type="button"
            className={askButton.ghost}
            onClick={startOver}
            disabled={turns.length === 0}
          >
            New chat
          </button>
          <button type="button" className={askButton.icon} onClick={onClose} aria-label="Close">
            <X className="size-[18px]" />
          </button>
        </div>
      </header>

      <div
        ref={logRef}
        onScroll={(event) => {
          const log = event.currentTarget;
          stickToBottom.current = log.scrollHeight - log.scrollTop - log.clientHeight < 80;
        }}
        className="grid min-h-0 min-w-0 flex-1 content-start gap-[22px] overflow-x-hidden overflow-y-auto overscroll-contain px-6 pt-6 pb-2 max-[719px]:px-4 max-[719px]:pt-[18px]"
      >
        {turns.length === 0 ? (
          <div className="grid justify-items-center gap-[18px] pt-[12dvh] text-center">
            <span
              className="grid size-11 place-items-center rounded-full bg-accent-soft text-accent-ink"
              aria-hidden
            >
              <Sparkles className="size-5" />
            </span>
            <h3 className="text-[28px] max-[519px]:text-2xl font-semibold tracking-[-0.02em]">
              What do you feel like watching?
            </h3>
            <div className="flex max-w-[560px] flex-wrap justify-center gap-2">
              {(enabled ? starters : titleStarters).map((text) => (
                <button
                  key={text}
                  type="button"
                  className={askButton.chip}
                  onClick={() => submit(text)}
                >
                  {text}
                </button>
              ))}
            </div>
          </div>
        ) : (
          turns.map((turn) =>
            turn.role === 'user' ? (
              <div key={turn.id} className="flex justify-end">
                <p className="max-w-[75%] min-w-0 rounded-[20px] bg-surface-2 px-4 py-2.5 break-words whitespace-pre-wrap max-[519px]:max-w-[88%]">
                  {turn.text}
                </p>
              </div>
            ) : (
              <AssistantMessage
                key={turn.id}
                turn={turn}
                isLast={turn === lastTurn}
                onNavigate={onClose}
                onFollowUp={submit}
                onRetry={retry}
              />
            ),
          )
        )}
      </div>

      <div aria-live="polite" className="sr-only">
        {announcementFor(lastAnswer)}
      </div>

      <div className="px-5 pt-2.5 pb-3.5 max-[719px]:px-3 max-[719px]:pb-[calc(12px+env(safe-area-inset-bottom,0px))]">
        <form
          onSubmit={onSubmit}
          className="flex items-end gap-2 rounded-[26px] border border-line-strong bg-surface py-2 pr-2 pl-[18px] shadow-[0_8px_24px_-14px_rgb(0_0_0/0.4)] focus-within:border-fg-faint"
        >
          <textarea
            ref={textareaRef}
            value={draft}
            rows={1}
            maxLength={maxAskMessageLength}
            onChange={(event) => {
              setDraft(event.target.value);
              resizeComposer();
            }}
            onKeyDown={onKeyDown}
            placeholder={enabled ? 'Describe what you want to watch…' : 'Search a movie title…'}
            aria-label="Message Marquee"
            className="max-h-40 min-h-[38px] flex-1 resize-none bg-transparent py-[9px] text-base leading-[1.4] text-fg outline-none placeholder:text-fg-faint"
          />
          {busy ? (
            <button
              type="button"
              onClick={stop}
              aria-label="Stop answering"
              className="grid size-[38px] shrink-0 place-items-center rounded-full bg-fg text-bg"
            >
              <Square className="size-3.5 fill-current" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!draft.trim()}
              aria-label="Send"
              className="grid size-[38px] shrink-0 place-items-center rounded-full bg-fg text-bg disabled:opacity-40"
            >
              <ArrowUp className="size-[18px]" />
            </button>
          )}
        </form>
        <p className="mt-2 text-center text-xs text-fg-faint">
          {enabled
            ? 'Marquee suggests movies with Claude and shows where to watch them. Data from TMDB and JustWatch.'
            : 'Ask Marquee’s AI is off on this deployment, so it answers with title search. Data from TMDB and JustWatch.'}
        </p>
      </div>
    </div>
  );
}
