'use client';

import { Play, X } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { createPortal, preconnect } from 'react-dom';
import { Button } from '../ui/button';
import {
  YOUTUBE_PLAYER_ORIGIN,
  YOUTUBE_PRECONNECT_ORIGINS,
  YOUTUBE_STATE_PLAYING,
  buildPlayerUrl,
  buildThumbnailUrl,
  parsePlayerMessage,
  sendListeningHandshake,
  sendPlayerCommand,
} from './youtube-player';

type TrailerDialogProps = {
  title: string;
  trailer: { youtubeKey: string; name: string };
  variant?: 'screen' | 'ghost' | 'primary';
};

/** How long the thumbnail covers the player after load when no playback signal arrives. */
const THUMBNAIL_FALLBACK_MS = 1500;
const PLAY_RETRY_INTERVAL_MS = 400;
const PLAY_RETRY_LIMIT = 10;

let nextPlayerId = 0;

/**
 * The player iframe is mounted on the first sign of intent (hover, focus, touch) so its scripts boot
 * before the click. It then stays mounted for the life of the component: moving or remounting an
 * iframe reloads it. That rules out Radix's forceMount here, because a force-mounted modal content
 * aria-hides the rest of the page and locks scrolling even while closed. A native modal `<dialog>`
 * stays in the DOM, is `display: none` (hidden, unfocusable, no pointer events) while closed, and
 * only becomes modal on `showModal()`.
 */
export function TrailerDialog({ title, trailer, variant = 'screen' }: TrailerDialogProps) {
  const [open, setOpen] = useState(false);
  const [playerSrc, setPlayerSrc] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [playbackStarted, setPlaybackStarted] = useState(false);
  const [fallbackElapsed, setFallbackElapsed] = useState(false);
  const [playerId] = useState(() => {
    nextPlayerId += 1;
    return nextPlayerId;
  });
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const warmedUpRef = useRef(false);
  const playerReadyRef = useRef(false);
  const playerStateRef = useRef<number | null>(null);
  const hasPlayer = playerSrc !== null;

  function warmUp() {
    if (warmedUpRef.current) return;
    warmedUpRef.current = true;
    for (const origin of YOUTUBE_PRECONNECT_ORIGINS) preconnect(origin);
    setPlayerSrc(
      (current) =>
        current ??
        buildPlayerUrl({
          youtubeKey: trailer.youtubeKey,
          origin: window.location.origin,
          autoplay: false,
        }),
    );
  }

  function openTrailer() {
    // Without a prior warm-up the iframe is born now, so the URL itself asks for autoplay.
    setPlayerSrc(
      (current) =>
        current ??
        buildPlayerUrl({
          youtubeKey: trailer.youtubeKey,
          origin: window.location.origin,
          autoplay: true,
        }),
    );
    warmedUpRef.current = true;
    setOpen(true);
  }

  // The native dialog's modal state follows `open`; Escape closes it natively and `onClose` syncs back.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!hasPlayer || !dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open, hasPlayer]);

  // A native modal dialog does not lock page scroll by itself.
  useEffect(() => {
    if (!open) return;
    const root = document.documentElement;
    const previousOverflow = root.style.overflow;
    root.style.overflow = 'hidden';
    return () => {
      root.style.overflow = previousOverflow;
    };
  }, [open]);

  // Player status arrives as postMessage events; only the player's own origin and frame are trusted.
  useEffect(() => {
    if (!hasPlayer) return;
    function handleMessage(event: MessageEvent) {
      const iframe = iframeRef.current;
      if (event.origin !== YOUTUBE_PLAYER_ORIGIN) return;
      if (!iframe || event.source !== iframe.contentWindow) return;
      const message = parsePlayerMessage(event.data);
      if (!message) return;
      if (!playerReadyRef.current) {
        playerReadyRef.current = true;
        // A close that raced ahead of readiness could not pause the player, so settle it now.
        sendPlayerCommand(iframe, open ? 'playVideo' : 'pauseVideo');
      }
      if (message.playerState !== null) {
        playerStateRef.current = message.playerState;
        if (message.playerState === YOUTUBE_STATE_PLAYING) setPlaybackStarted(true);
      }
    }
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [hasPlayer, open]);

  // Opening starts playback; the player may still be booting, so the command is retried a bounded
  // number of times. Closing pauses and keeps the iframe so reopening resumes instantly.
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!loaded || !iframe) return;
    if (!open) {
      sendPlayerCommand(iframe, 'pauseVideo');
      playerStateRef.current = null;
      return;
    }
    let attempts = 0;
    function attempt() {
      if (!iframe) return;
      if (playerStateRef.current === YOUTUBE_STATE_PLAYING || attempts >= PLAY_RETRY_LIMIT) {
        window.clearInterval(interval);
        return;
      }
      attempts += 1;
      sendListeningHandshake(iframe, playerId);
      sendPlayerCommand(iframe, 'playVideo');
    }
    const interval = window.setInterval(attempt, PLAY_RETRY_INTERVAL_MS);
    attempt();
    return () => window.clearInterval(interval);
  }, [open, loaded, playerId]);

  // Without a playback signal the thumbnail still gives way once the player has had time to paint.
  useEffect(() => {
    if (!open || !loaded || fallbackElapsed) return;
    const timer = window.setTimeout(() => setFallbackElapsed(true), THUMBNAIL_FALLBACK_MS);
    return () => window.clearTimeout(timer);
  }, [open, loaded, fallbackElapsed]);

  const thumbnailHidden = playbackStarted || fallbackElapsed;

  return (
    <>
      <Button
        variant={variant}
        aria-haspopup="dialog"
        onClick={openTrailer}
        onPointerEnter={warmUp}
        onFocus={warmUp}
        onTouchStart={warmUp}
      >
        <Play aria-hidden />
        Trailer
      </Button>
      {hasPlayer
        ? createPortal(
            <dialog
              ref={dialogRef}
              aria-labelledby={titleId}
              aria-describedby={descriptionId}
              onClose={() => setOpen(false)}
              onClick={(event) => {
                // Portaled events still bubble through React ancestors, such as a clickable card.
                event.stopPropagation();
                if (event.target === event.currentTarget) setOpen(false);
              }}
              className="m-auto max-h-[calc(100dvh-48px)] w-[min(960px,calc(100vw-32px))] max-w-none overflow-auto rounded-2xl border-0 bg-screen p-0 text-screen-fg shadow-lift outline-none open:animate-[pop_.2s_ease-out] motion-reduce:animate-none backdrop:bg-scrim backdrop:backdrop-blur-[3px] backdrop:animate-[fade-in_.18s_ease-out] motion-reduce:backdrop:animate-none"
            >
              <div className="px-5 pt-4 pb-3.5 pr-16">
                <p className="eyebrow">Trailer</p>
                <h2
                  id={titleId}
                  className="mt-1 font-display text-[28px] leading-none font-extrabold uppercase"
                >
                  {title}
                </h2>
                <p id={descriptionId} className="sr-only">
                  {trailer.name}
                </p>
              </div>
              <button
                type="button"
                aria-label="Close trailer"
                onClick={() => setOpen(false)}
                className="absolute top-4 right-4 grid size-9 place-items-center rounded-[10px] border border-line bg-surface text-fg hover:border-line-strong"
              >
                <X className="size-[18px]" aria-hidden />
              </button>
              <div className="relative aspect-video bg-screen-2">
                {/* The player is cross-origin (youtube-nocookie.com), so allow-same-origin keeps YouTube's own
                    origin and cannot lift the sandbox for our pages; the player needs scripts and its origin. */}
                <iframe
                  ref={iframeRef}
                  className="absolute inset-0 size-full"
                  src={playerSrc}
                  title={`${title}: ${trailer.name}`}
                  allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                  allowFullScreen
                  onLoad={() => setLoaded(true)}
                  // oxlint-disable-next-line react/iframe-missing-sandbox
                  sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
                />
                {/* Painted over the booting player and click-through, so it hides the black frame
                    without ever intercepting the player's controls. */}
                {/* oxlint-disable-next-line nextjs/no-img-element */}
                <img
                  src={buildThumbnailUrl(trailer.youtubeKey)}
                  alt=""
                  aria-hidden
                  className={`pointer-events-none absolute inset-0 size-full object-cover transition-opacity duration-300 motion-reduce:transition-none ${thumbnailHidden ? 'opacity-0' : 'opacity-100'}`}
                />
              </div>
            </dialog>,
            document.body,
          )
        : null}
    </>
  );
}
