'use client';

import { Activity, createContext, use, useEffect, useEffectEvent, useRef, useState } from 'react';
import { AskPanel } from './ask-panel';
import { useAskConversation } from './use-ask-stream';

type AskContextValue = { open: (prompt?: string) => void };

const AskContext = createContext<AskContextValue | null>(null);

const isTypingTarget = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));

/**
 * Owns Ask Marquee: the conversation, the dialog and its shortcuts. The panel sits in <Activity>, so
 * closing the dialog hides it without losing the conversation, the scroll position or a draft.
 */
export function AskProvider({
  children,
  enabled,
}: {
  children: React.ReactNode;
  enabled: boolean;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const conversation = useAskConversation();

  function open(prompt?: string) {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
    setIsOpen(true);
    if (prompt?.trim()) conversation.send(prompt);
  }

  function close() {
    dialogRef.current?.close();
  }

  const onShortcut = useEffectEvent((event: globalThis.KeyboardEvent) => {
    const modifier = event.metaKey || event.ctrlKey;
    if (modifier && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      if (dialogRef.current?.open) close();
      else open();
      return;
    }
    if (event.key === '/' && !modifier && !event.altKey && !isTypingTarget(event.target)) {
      event.preventDefault();
      open();
    }
  });

  useEffect(() => {
    const listener = (event: globalThis.KeyboardEvent) => onShortcut(event);
    window.addEventListener('keydown', listener);
    return () => window.removeEventListener('keydown', listener);
  }, []);

  return (
    <AskContext value={{ open }}>
      {children}
      <dialog
        ref={dialogRef}
        aria-label="Ask Marquee"
        onClose={() => setIsOpen(false)}
        onClick={(event) => {
          // A click on the dialog element itself lands on the backdrop.
          if (event.target === event.currentTarget) close();
        }}
        className="ask-dialog h-[min(780px,calc(100dvh-48px))] w-[min(780px,calc(100vw-32px))] overflow-hidden rounded-[18px] shadow-lift max-[719px]:m-0 max-[719px]:h-dvh max-[719px]:w-screen max-[719px]:rounded-none max-[719px]:border-0"
      >
        <Activity mode={isOpen ? 'visible' : 'hidden'}>
          <AskPanel conversation={conversation} enabled={enabled} onClose={close} />
        </Activity>
      </dialog>
    </AskContext>
  );
}

export function useAsk(): AskContextValue {
  const context = use(AskContext);
  if (!context) throw new Error('useAsk must be used inside <AskProvider>.');
  return context;
}
