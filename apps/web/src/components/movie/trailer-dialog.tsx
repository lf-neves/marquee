'use client';

import { Play } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from '../ui/dialog';

type TrailerDialogProps = {
  title: string;
  trailer: { youtubeKey: string; name: string };
  variant?: 'screen' | 'ghost' | 'primary';
};

/** The YouTube player loads only once the dialog opens, so pages never pay for it up front. */
export function TrailerDialog({ title, trailer, variant = 'screen' }: TrailerDialogProps) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant}>
          <Play aria-hidden />
          Trailer
        </Button>
      </DialogTrigger>
      <DialogContent
        closeLabel="Close trailer"
        className="w-[min(960px,calc(100vw-32px))] border-0 bg-screen text-screen-fg"
      >
        <div className="px-5 pt-4 pb-3.5 pr-16">
          <p className="eyebrow">Trailer</p>
          <DialogTitle className="mt-1 font-display text-[28px] leading-none font-extrabold uppercase">
            {title}
          </DialogTitle>
          <DialogDescription className="sr-only">{trailer.name}</DialogDescription>
        </div>
        <div className="relative aspect-video bg-screen-2">
          {open ? (
            // The player is cross-origin (youtube-nocookie.com), so allow-same-origin keeps YouTube's own
            // origin and cannot lift the sandbox for our pages; the player needs scripts and its origin.
            <iframe
              className="absolute inset-0 size-full"
              src={`https://www.youtube-nocookie.com/embed/${trailer.youtubeKey}?autoplay=1&rel=0`}
              title={`${title}: ${trailer.name}`}
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
              // oxlint-disable-next-line react/iframe-missing-sandbox
              sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
            />
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
