'use client';

import { X } from 'lucide-react';
import { Dialog as DialogPrimitive } from 'radix-ui';
import { type ComponentProps } from 'react';
import { cn } from '#/lib/utils';

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;
export const DialogTitle = DialogPrimitive.Title;
export const DialogDescription = DialogPrimitive.Description;

export function DialogContent({
  className,
  children,
  closeLabel = 'Close',
  ...props
}: ComponentProps<typeof DialogPrimitive.Content> & { closeLabel?: string }) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-scrim backdrop-blur-[3px] data-[state=open]:animate-[fade-in_.18s_ease-out]" />
      <DialogPrimitive.Content
        className={cn(
          'fixed top-1/2 left-1/2 z-50 max-h-[calc(100dvh-48px)] w-[min(520px,calc(100vw-32px))] -translate-x-1/2 -translate-y-1/2 overflow-auto rounded-2xl border border-line bg-surface text-fg shadow-lift outline-none data-[state=open]:animate-[pop_.2s_ease-out]',
          className,
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close
          aria-label={closeLabel}
          className="absolute top-4 right-4 grid size-9 place-items-center rounded-[10px] border border-line bg-surface text-fg hover:border-line-strong"
        >
          <X className="size-[18px]" aria-hidden />
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}
