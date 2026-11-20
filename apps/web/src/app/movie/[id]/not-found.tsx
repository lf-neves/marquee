import { Film } from 'lucide-react';
import Link from 'next/link';
import { Button } from '#/components/ui/button';

export default function MovieNotFound() {
  return (
    <section className="wrap py-20">
      <div className="grid justify-items-center gap-2.5 rounded-card border border-dashed border-line-strong px-5 py-14 text-center text-fg-muted">
        <span className="grid size-12 place-items-center rounded-xl bg-surface-2">
          <Film className="size-[22px]" aria-hidden />
        </span>
        <h1 className="text-lg font-semibold text-fg">This movie isn’t on TMDB</h1>
        <p className="max-w-[46ch]">
          The link may be mistyped, or TMDB removed the entry. Pick something from today’s trending
          list instead.
        </p>
        <Button asChild className="mt-2">
          <Link href="/trending">Browse trending</Link>
        </Button>
      </div>
    </section>
  );
}
