import { type Metadata } from 'next';
import { Suspense } from 'react';
import { TrendingBrowser, TrendingSkeleton } from '#/components/trending/trending-browser';
import { getTrending } from '#/server/catalog';

export const metadata: Metadata = {
  title: 'Trending movies',
  description: 'The movies people are watching on TMDB today and this week.',
};

export default function TrendingPage({ searchParams }: PageProps<'/trending'>) {
  return (
    <section className="wrap pt-11 pb-16">
      <h1 className="font-display text-[44px] leading-[0.92] font-extrabold tracking-[0.02em] uppercase">
        Trending
      </h1>
      <Suspense fallback={<TrendingSkeleton />}>
        <TrendingContent searchParams={searchParams} />
      </Suspense>
    </section>
  );
}

async function TrendingContent({ searchParams }: Pick<PageProps<'/trending'>, 'searchParams'>) {
  const { window } = await searchParams;
  const [day, week] = await Promise.all([getTrending('day'), getTrending('week')]);
  return (
    <div className="mt-2">
      <TrendingBrowser
        initialWindow={window === 'week' ? 'week' : 'day'}
        firstPages={{ day, week }}
      />
    </div>
  );
}
