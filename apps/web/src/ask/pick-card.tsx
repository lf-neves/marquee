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
    <article className="grid grid-cols-[168px_minmax(0,1fr)] gap-3.5 rounded-[14px] border border-line bg-surface p-2.5 max-[719px]:grid-cols-[110px_minmax(0,1fr)]">
      <Link
        href={href}
        onClick={onNavigate}
        aria-label={pick.title}
        className="relative block aspect-video self-start overflow-hidden rounded-[9px] bg-screen"
      >
        {art ? (
          <Image
            src={art}
            alt=""
            fill
            sizes="(max-width: 719px) 110px, 168px"
            className="object-cover"
          />
        ) : null}
      </Link>
      <div className="grid min-w-0 content-start gap-[3px]">
        <h3 className="text-[15.5px] leading-tight font-semibold">
          {pick.title}
          {pick.year ? <span className="font-normal text-fg-faint"> ({pick.year})</span> : null}
        </h3>
        <p className="flex flex-wrap items-center gap-x-2 font-mono text-xs text-fg-muted">
          {meta.length ? <span>{meta.join(' · ')}</span> : null}
          <span className="inline-flex items-center gap-1.5">
            <i
              className={cn('size-[7px] rounded-full', toneDot[scoreTone(pick.score)])}
              aria-hidden
            />
            {pick.score}%
          </span>
        </p>
        <p className="text-[13.5px] text-fg">{pick.reason}</p>
        <p className="line-clamp-2 text-[13.5px] text-fg-muted max-[719px]:hidden">
          {pick.overview}
        </p>
        <div className="mt-1.5 flex flex-wrap gap-2">
          {pick.watch?.url ? (
            <a href={pick.watch.url} target="_blank" rel="noopener" className={askButton.primary}>
              {pick.watch.label === 'In theaters' ? (
                <Ticket className="size-4" />
              ) : (
                <Play className="size-4" />
              )}
              {pick.watch.label}
            </a>
          ) : pick.watch ? (
            <span className={cn(askButton.ghost, 'cursor-default')}>
              <Ticket className="size-4" />
              {pick.watch.label}
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
