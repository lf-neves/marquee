export const YOUTUBE_PLAYER_ORIGIN = 'https://www.youtube-nocookie.com';

/** Hosts the embedded player fetches its scripts, thumbnails and ad-measurement frames from. */
export const YOUTUBE_PRECONNECT_ORIGINS = [
  YOUTUBE_PLAYER_ORIGIN,
  'https://www.youtube.com',
  'https://i.ytimg.com',
  'https://www.google.com',
  'https://static.doubleclick.net',
] as const;

/** `playerState` value the IFrame API reports while the video plays. */
export const YOUTUBE_STATE_PLAYING = 1;

type PlayerCommand = 'playVideo' | 'pauseVideo';

export function buildPlayerUrl({
  youtubeKey,
  origin,
  autoplay,
}: {
  youtubeKey: string;
  origin: string;
  autoplay: boolean;
}): string {
  const parameters = new URLSearchParams({
    enablejsapi: '1',
    rel: '0',
    playsinline: '1',
    autoplay: autoplay ? '1' : '0',
    origin,
  });
  return `${YOUTUBE_PLAYER_ORIGIN}/embed/${encodeURIComponent(youtubeKey)}?${parameters}`;
}

export function buildThumbnailUrl(youtubeKey: string): string {
  return `https://i.ytimg.com/vi/${encodeURIComponent(youtubeKey)}/hqdefault.jpg`;
}

function postToPlayer(iframe: HTMLIFrameElement, message: Record<string, unknown>): void {
  // The target origin pins delivery to the YouTube document, so a navigated frame never receives it.
  iframe.contentWindow?.postMessage(JSON.stringify(message), YOUTUBE_PLAYER_ORIGIN);
}

export function sendPlayerCommand(iframe: HTMLIFrameElement, func: PlayerCommand): void {
  postToPlayer(iframe, { event: 'command', func, args: [] });
}

/** The player only emits `onReady` and `infoDelivery` once a listener has announced itself. */
export function sendListeningHandshake(iframe: HTMLIFrameElement, id: number): void {
  postToPlayer(iframe, { event: 'listening', id, channel: 'widget' });
}

export type PlayerMessage = { playerState: number | null };

/** Returns null for anything that is not a player status message. */
export function parsePlayerMessage(data: unknown): PlayerMessage | null {
  if (typeof data !== 'string') return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(data);
  } catch {
    return null;
  }
  if (typeof parsed !== 'object' || parsed === null) return null;
  const { event, info } = parsed as { event?: unknown; info?: unknown };
  if (event !== 'onReady' && event !== 'infoDelivery' && event !== 'initialDelivery') return null;
  const playerState =
    typeof info === 'object' &&
    info !== null &&
    typeof (info as { playerState?: unknown }).playerState === 'number'
      ? (info as { playerState: number }).playerState
      : null;
  return { playerState };
}
