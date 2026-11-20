import { SpeedInsights } from '@vercel/speed-insights/next';
import { type Metadata, type Viewport } from 'next';
import { Big_Shoulders, Geist, Geist_Mono } from 'next/font/google';
import { type ReactNode } from 'react';
import { AskProvider } from '#/ask/ask-provider';
import { SiteHeader } from '#/components/layout/site-header';
import { Toaster } from '#/components/ui/sonner';
import { WatchlistProvider } from '#/components/watchlist/watchlist-provider';
import { askEnabled, watchlistEnabled } from '#/server/env';
import { TRPCReactProvider } from '#/trpc/react';
import './globals.css';

// Big Shoulders' optical-size axis switches to its condensed display cut at headline sizes.
const display = Big_Shoulders({
  subsets: ['latin'],
  weight: 'variable',
  axes: ['opsz'],
  variable: '--font-big-shoulders',
  // Next.js has no metric overrides for this family; the CSS stack names close condensed fallbacks.
  adjustFontFallback: false,
});
const sans = Geist({ subsets: ['latin'], variable: '--font-geist' });
const mono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono' });

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : 'http://localhost:3000');

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: 'Marquee · What the world is watching today', template: '%s · Marquee' },
  description:
    'Trending movies from TMDB, where to stream them in your country, and a chat that finds the right one for tonight.',
  openGraph: { siteName: 'Marquee', type: 'website' },
  twitter: { card: 'summary_large_image' },
};

export const viewport: Viewport = {
  colorScheme: 'dark light',
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#0b0d12' },
    { media: '(prefers-color-scheme: light)', color: '#f1f2f5' },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable} ${mono.variable}`}>
      <body>
        <a
          href="#main"
          className="absolute -left-[9999px] z-50 rounded-lg bg-surface px-3 py-2 focus:top-4 focus:left-4"
        >
          Skip to content
        </a>
        <TRPCReactProvider>
          <WatchlistProvider enabled={watchlistEnabled}>
            <AskProvider enabled={askEnabled}>
              <SiteHeader />
              <main id="main" tabIndex={-1} className="min-h-[calc(100dvh-64px)] outline-none">
                {children}
              </main>
              <Toaster />
            </AskProvider>
          </WatchlistProvider>
        </TRPCReactProvider>
        <SpeedInsights />
      </body>
    </html>
  );
}
