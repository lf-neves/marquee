import { X } from 'lucide-react';
import { type Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { MovieTile } from '#/components/movie/movie-tile';
import { Button } from '#/components/ui/button';
import { parseMovieSegment, paths } from '#/lib/paths';
import { getMovie, getRecommendations } from '#/server/catalog';

export async function generateMetadata({
  params,
}: PageProps<'/movie/[id]/similar'>): Promise<Metadata> {
  const id = parseMovieSegment((await params).id);
  const movie = id === null ? null : await getMovie(id);
  return { title: movie ? `More like ${movie.title}` : 'Movie not found' };
}

export default function SimilarPage({ params }: PageProps<'/movie/[id]/similar'>) {
  return (
    <section className="wrap pt-9 pb-16">
      <Suspense fallback={<div aria-busy className="skeleton h-[420px] rounded-card" />}>
        <SimilarMovies params={params} />
      </Suspense>
    </section>
  );
}

async function SimilarMovies({ params }: Pick<PageProps<'/movie/[id]/similar'>, 'params'>) {
  const id = parseMovieSegment((await params).id);
  const movie = id === null ? null : await getMovie(id);
  if (!movie) notFound();
  const similar = await getRecommendations(movie.id);
  return (
    <>
      <div className="mb-[22px] flex flex-wrap items-end justify-between gap-3.5">
        <div>
          <p className="mb-1.5 font-mono text-xs tracking-[0.12em] text-fg-faint uppercase">
            Filtered
          </p>
          <h1 className="font-display text-[clamp(34px,5vw,52px)] leading-[0.92] font-extrabold uppercase">
            More like {movie.title}
          </h1>
          <p className="mt-1.5 text-fg-muted">
            {movie.genres.map((genre) => genre.name).join(' · ')}
          </p>
        </div>
        <Button variant="ghost" asChild>
          <Link href={paths.home()}>
            <X aria-hidden />
            Clear filter
          </Link>
        </Button>
      </div>
      {similar.length > 0 ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-x-3 gap-y-4">
          {similar.map((recommendation) => (
            <MovieTile key={recommendation.id} movie={recommendation} />
          ))}
        </div>
      ) : (
        <p className="rounded-card border border-dashed border-line-strong px-5 py-14 text-center text-fg-muted">
          TMDB has no recommendations for this movie yet.
        </p>
      )}
    </>
  );
}
