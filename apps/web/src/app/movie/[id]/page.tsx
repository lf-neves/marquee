import { ArrowRight, ChevronLeft } from 'lucide-react';
import { type Metadata } from 'next';
import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import { Suspense, ViewTransition } from 'react';
import { InfoDialog } from '#/components/movie/info-dialog';
import { ScoreText } from '#/components/movie/score';
import { TmdbImage } from '#/components/movie/tmdb-image';
import { TrailerDialog } from '#/components/movie/trailer-dialog';
import {
  WatchNowButton,
  WhereToWatch,
  WhereToWatchSkeleton,
} from '#/components/movie/watch-options';
import { WatchlistButton } from '#/components/watchlist/watchlist-button';
import { dateText, languageText, moneyText, runtimeText } from '#/lib/format';
import { summaryOf } from '#/lib/movie-card';
import { movieSegment, parseMovieSegment, paths } from '#/lib/paths';
import { movieArtTransitionName } from '#/lib/transitions';
import { getMovie, getTrending } from '#/server/catalog';

/** Today's top 20 are prerendered at build; any other movie renders on first visit, then caches. */
export async function generateStaticParams() {
  const trending = await getTrending('day');
  return trending.results.slice(0, 20).map((movie) => ({ id: movieSegment(movie) }));
}

async function movieFromParams(params: PageProps<'/movie/[id]'>['params']) {
  const { id: segment } = await params;
  const id = parseMovieSegment(segment);
  return { segment, movie: id === null ? null : await getMovie(id) };
}

export async function generateMetadata({ params }: PageProps<'/movie/[id]'>): Promise<Metadata> {
  const { movie } = await movieFromParams(params);
  if (!movie) return { title: 'Movie not found' };
  return {
    title: movie.year ? `${movie.title} (${movie.year})` : movie.title,
    description: movie.overview.slice(0, 200),
    alternates: { canonical: paths.movie(movie) },
  };
}

export default function MoviePage({ params }: PageProps<'/movie/[id]'>) {
  return (
    <Suspense fallback={<MovieHeroSkeleton />}>
      <MovieHero params={params} />
    </Suspense>
  );
}

async function MovieHero({ params }: Pick<PageProps<'/movie/[id]'>, 'params'>) {
  const { segment, movie } = await movieFromParams(params);
  if (!movie) notFound();
  if (segment !== movieSegment(movie)) permanentRedirect(paths.movie(movie));

  const certification = movie.certifications.US ?? null;
  const facts = [
    { label: 'Director', value: movie.director ?? '—' },
    { label: 'Release date', value: dateText(movie.releaseDate) },
    { label: 'Certification (US)', value: certification ?? '—' },
    { label: 'Runtime', value: runtimeText(movie.runtime) },
    { label: 'Original language', value: languageText(movie.originalLanguage) },
    { label: 'Budget', value: moneyText(movie.budget) },
    { label: 'Revenue', value: moneyText(movie.revenue) },
  ];

  return (
    <section className="screen-band">
      <ViewTransition name={movieArtTransitionName(movie.id)} share="morph" default="none">
        <div className="absolute inset-0 -z-2 opacity-80">
          <TmdbImage
            path={movie.backdropPath ?? movie.posterPath}
            kind="backdrop"
            alt=""
            sizes="100vw"
            preload
            blurDataUrl={movie.backdropPath ? movie.blur.backdrop : movie.blur.poster}
          />
        </div>
      </ViewTransition>
      <div className="wrap flex min-h-[calc(100dvh-64px)] flex-col justify-end gap-[18px] pt-7 pb-[52px]">
        <Link
          href={paths.home()}
          className="mb-auto inline-flex items-center gap-1.5 self-start rounded-lg py-1.5 pr-2.5 pl-1.5 text-sm font-medium text-screen-muted hover:bg-white/8 hover:text-screen-fg"
        >
          <ChevronLeft className="size-[18px]" aria-hidden />
          Back to Home
        </Link>
        <div className="grid max-w-[600px] gap-4">
          <h1 className="font-display text-[clamp(48px,7vw,92px)] leading-[0.86] font-extrabold uppercase">
            {movie.title}
          </h1>
          <p className="meta">
            <ScoreText score={movie.score} voteCount={movie.voteCount} />
            {movie.year ? <span>{movie.year}</span> : null}
            {certification ? (
              <span className="rounded border border-current px-1.5 text-[11.5px] leading-[1.4] opacity-90">
                {certification}
              </span>
            ) : null}
            {movie.runtime ? <span>{runtimeText(movie.runtime)}</span> : null}
            {movie.genres.length > 0 ? (
              <span>
                {movie.genres
                  .slice(0, 3)
                  .map((genre) => genre.name)
                  .join(', ')}
              </span>
            ) : null}
          </p>
          <Suspense fallback={<WhereToWatchSkeleton />}>
            <WhereToWatch movieId={movie.id} />
          </Suspense>
          <p className="line-clamp-3 text-base leading-relaxed text-screen-fg/92">
            {movie.overview}
          </p>
          <div className="flex flex-wrap items-center gap-2.5">
            <Suspense fallback={null}>
              <WatchNowButton movieId={movie.id} />
            </Suspense>
            {movie.trailer ? <TrailerDialog title={movie.title} trailer={movie.trailer} /> : null}
            <WatchlistButton movie={summaryOf(movie)} variant="screen" />
          </div>
          <div className="flex flex-wrap items-center gap-[18px]">
            <InfoDialog
              title={movie.title}
              tagline={movie.tagline}
              overview={movie.overview}
              facts={facts}
              genres={movie.genres.map((genre) => genre.name)}
            />
            <Link
              href={paths.similar(movie)}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-screen-fg underline decoration-screen-line underline-offset-4 hover:decoration-current"
            >
              More like this
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function MovieHeroSkeleton() {
  return (
    <section aria-busy className="screen-band">
      <div className="wrap flex min-h-[calc(100dvh-64px)] flex-col justify-end gap-4 pt-7 pb-[52px]">
        <div className="h-[86px] w-[min(540px,82%)] rounded-md bg-screen-2" />
        <div className="h-3.5 w-[280px] rounded-md bg-screen-2" />
        <div className="h-[58px] w-[min(480px,92%)] rounded-md bg-screen-2" />
        <div className="h-[42px] w-[300px] rounded-md bg-screen-2" />
      </div>
    </section>
  );
}
