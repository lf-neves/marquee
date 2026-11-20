'use client';

import { Bookmark } from 'lucide-react';
import { type Route } from 'next';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '#/lib/utils';
import { WatchlistCount } from '../watchlist/watchlist-button';
import { useWatchlistEnabled } from '../watchlist/watchlist-provider';

const linkClass =
  'inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-fg-muted hover:text-fg aria-[current=page]:bg-surface-2 aria-[current=page]:text-fg';

function isCurrent(pathname: string | null, href: string) {
  if (!pathname) return false;
  return href === '/' ? pathname === '/' : pathname.startsWith(href);
}

/** Marks the current section; the Suspense fallback renders the same links before it is known. */
export function NavLinks() {
  return <NavLinksView pathname={usePathname()} />;
}

export function NavLinksView({ pathname }: { pathname: string | null }) {
  const watchlist = useWatchlistEnabled();
  const items: { href: Route; label: string; className?: string }[] = [
    { href: '/', label: 'Discover', className: 'max-md:hidden' },
    { href: '/trending', label: 'Trending' },
  ];
  return (
    <nav aria-label="Main" className="flex items-center gap-1">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          aria-current={isCurrent(pathname, item.href) ? 'page' : undefined}
          className={cn(linkClass, item.className)}
        >
          {item.label}
        </Link>
      ))}
      {watchlist ? (
        <Link
          href="/watchlist"
          aria-current={isCurrent(pathname, '/watchlist') ? 'page' : undefined}
          className={linkClass}
        >
          <Bookmark className="size-4" aria-hidden />
          <span className="max-md:sr-only">Watchlist</span>
          <WatchlistCount />
        </Link>
      ) : null}
    </nav>
  );
}
