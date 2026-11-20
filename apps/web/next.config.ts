import path from 'node:path';
import { type NextConfig } from 'next';

// The repository keeps one .env at its root for every package. Variables already set (CI, Vercel)
// win, and build workers inherit what this loads.
try {
  process.loadEnvFile(path.resolve(process.cwd(), '../../.env'));
} catch {
  // No root .env: the environment provides everything.
}

const nextConfig: NextConfig = {
  // Partial prerendering: a static shell per route, with cached ('use cache') and request-time
  // parts streamed into it.
  cacheComponents: true,
  // Prefetch one reusable App Shell per route instead of one payload per visible link.
  partialPrefetching: true,
  reactCompiler: true,
  typedRoutes: true,
  transpilePackages: ['@marquee/api', '@marquee/db', '@marquee/tmdb'],
  // TMDB already serves resized JPEGs from its CDN; the loader picks the closest size there instead
  // of optimizing every poster a second time.
  images: { loader: 'custom', loaderFile: './src/lib/tmdb-image-loader.ts' },
  cacheLife: {
    // TMDB recomputes trending daily and edits movie records rarely.
    catalog: { stale: 300, revalidate: 3600, expire: 86_400 },
  },
  experimental: {
    // Lets the @next/playwright instant() helper inspect a production build in e2e tests only.
    exposeTestingApiInProductionBuild: process.env.EXPOSE_TESTING_API === '1',
  },
};

export default nextConfig;
