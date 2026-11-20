'use client';

import { AlertTriangle } from 'lucide-react';
import { useEffect } from 'react';
import { Button } from '#/components/ui/button';

export default function ErrorPage({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="wrap py-20">
      <div
        role="alert"
        className="grid justify-items-center gap-2.5 rounded-card border border-dashed border-line-strong px-5 py-14 text-center text-fg-muted"
      >
        <span className="grid size-12 place-items-center rounded-xl bg-surface-2">
          <AlertTriangle className="size-[22px]" aria-hidden />
        </span>
        <h1 className="text-lg font-semibold text-fg">TMDB didn’t respond in time</h1>
        <p className="max-w-[46ch]">
          The movie service is slow or unreachable right now. Try again in a moment.
        </p>
        <Button variant="ghost" className="mt-2" onClick={() => retry()}>
          Try again
        </Button>
      </div>
    </section>
  );
}
