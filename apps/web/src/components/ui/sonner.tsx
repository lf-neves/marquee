'use client';

import { type CSSProperties } from 'react';
import { Toaster as Sonner, type ToasterProps } from 'sonner';

/**
 * shadcn's Toaster, styled like the prototype: an inverted bar at the bottom center. The light ring
 * keeps the dark bar visible over the dark screen bands when the page is in the light theme.
 */
export function Toaster(props: ToasterProps) {
  return (
    <Sonner
      position="bottom-center"
      style={{ '--width': 'min(420px, calc(100vw - 32px))' } as CSSProperties}
      offset={72}
      mobileOffset={{ bottom: 'calc(24px + env(safe-area-inset-bottom, 0px))' }}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            'flex w-full items-center gap-3.5 rounded-[10px] bg-fg py-2.5 pr-3 pl-4 text-sm font-medium text-bg shadow-lift ring-1 ring-white/20',
          title: 'flex-1',
          actionButton:
            'shrink-0 cursor-pointer p-1 font-semibold underline underline-offset-3 focus-visible:outline-bg',
        },
      }}
      {...props}
    />
  );
}
