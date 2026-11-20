'use client';

import { Play, Ticket } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { runtimeText, scoreTone } from '#/lib/format';
import { paths } from '#/lib/paths';
import { cn } from '#/lib/utils';
import { type AskPick } from './protocol';
import { askButton } from './styles';

const toneDot = { good: 'bg-good', mid: 'bg-mid', bad: 'bg-bad' } as const;

export function AskPickCard({ pick, onNavigate }: { pick: AskPick; onNavigate: () => void }) {
  const href = paths.movie(pick);
  const art = pick.backdropPath
    ? `/backdrop${pick.backdropPath}`
    : pick.posterPath
      ? `/poster${pick.posterPath}`
      : null;
  const meta = [
    pick.runtime ? runtimeText(pick.runtime) : null,
    pick.genres.slice(0, 2).join(', ') || null,
  ].filter(Boolean);

  return (
    <article className="grid min-w-0 grid-cols-[168px_minmax(0,1fr)] gap-3.5 rounded-[14px] border border-line bg-surface p-2.5 max-[719px]:grid-cols-[110px_minmax(0,1fr)] max-[519px]:grid-cols-1 max-[519px]:gap-3">
      <Link
        href={href}
        onClick={onNavigate}
        aria-label={pick.title}
        className="relative block aspect-video w-full self-start overflow-hidden rounded-[9px] bg-screen"
      >
        {art ? (
          <Image
            src={art}
            alt=""
            fill
            sizes="(max-width: 519px) 100vw, (max-width: 719px) 110px, 168px"
            className="object-cover"
          />
        ) : null}
      </Link>
      <div className="grid min-w-0 content-start gap-[3px]">
        <h3 className="min-w-0 text-[15.5px] leading-tight font-semibold break-words">
          {pick.title}
          {pick.year ? <span className="font-normal text-fg-faint"> ({pick.year})</span> : null}
        </h3>
        <p className="flex min-w-0 flex-wrap items-center gap-x-2 font-mono text-xs text-fg-muted">
          {meta.length ? <span className="min-w-0 break-words">{meta.join(' · ')}</span> : null}
          <span className="inline-flex items-center gap-1.5">
            <i
              className={cn('size-[7px] rounded-full', toneDot[scoreTone(pick.score)])}
              aria-hidden
            />
            {pick.score}%
          </span>
        </p>
        <p className="min-w-0 text-[13.5px] break-words text-fg">{pick.reason}</p>
        <p className="line-clamp-2 min-w-0 text-[13.5px] break-words text-fg-muted max-[719px]:hidden">
          {pick.overview}
        </p>
        <div className="mt-1.5 flex min-w-0 flex-wrap gap-2">
          {pick.watch?.url ? (
            <a
              href={pick.watch.url}
              target="_blank"
              rel="noopener"
              className={cn(askButton.primary, 'max-w-full min-w-0')}
            >
              {pick.watch.label === 'In theaters' ? (
                <Ticket className="size-4 shrink-0" />
              ) : (
                <Play className="size-4 shrink-0" />
              )}
              <span className="min-w-0 truncate">{pick.watch.label}</span>
            </a>
          ) : pick.watch ? (
            <span className={cn(askButton.ghost, 'max-w-full min-w-0 cursor-default')}>
              <Ticket className="size-4 shrink-0" />
              <span className="min-w-0 truncate">{pick.watch.label}</span>
            </span>
          ) : null}
          <Link href={href} onClick={onNavigate} className={askButton.ghost}>
            Details
          </Link>
        </div>
      </div>
    </article>
  );
}
