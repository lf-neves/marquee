import { scoreTone } from '#/lib/format';
import { cn } from '#/lib/utils';

const dotColor = { good: 'bg-good', mid: 'bg-mid', bad: 'bg-bad' } as const;

export function ScoreDot({ score, className }: { score: number; className?: string }) {
  return (
    <i
      aria-hidden
      className={cn(
        'inline-block size-[7px] shrink-0 rounded-full',
        dotColor[scoreTone(score)],
        className,
      )}
    />
  );
}

/** "82%" with a colored dot; hidden for movies nobody has rated yet. */
export function ScoreText({ score, voteCount }: { score: number; voteCount: number }) {
  if (voteCount === 0) return null;
  return (
    <span className="inline-flex items-center gap-1.5" aria-label={`User score ${score} percent`}>
      <ScoreDot score={score} />
      {score}%
    </span>
  );
}
