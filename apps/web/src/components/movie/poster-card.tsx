import { genreName } from '@marquee/tmdb/genres';
import { type MovieCard, summaryOf } from '#/lib/movie-card';
import { paths } from '#/lib/paths';
import { WatchlistButton } from '../watchlist/watchlist-button';
import { MorphSource, MovieLink } from './movie-link';
import { ScoreDot } from './score';
import { TmdbImage } from './tmdb-image';

const posterSizes = '(max-width: 519px) 46vw, 200px';

/** A 2:3 poster card for grids. `rank` shows the trending position. */
export function PosterCard({
  movie,
  rank,
  preload = false,
}: {
  movie: MovieCard;
  rank?: number;
  preload?: boolean;
}) {
  const genre = movie.genreIds[0] ? genreName(movie.genreIds[0]) : null;
  return (
    <article className="group relative min-w-0 [contain-intrinsic-size:auto_360px] [content-visibility:auto]">
      <MovieLink href={paths.movie(movie)} className="grid gap-2.5 rounded-card outline-none">
        <div className="relative aspect-[2/3] overflow-hidden rounded-card bg-surface-2 shadow-[0_1px_0_var(--line)] transition-[transform,box-shadow] duration-200 group-hover:-translate-y-1 group-hover:shadow-lift group-has-[a:focus-visible]:outline-2 group-has-[a:focus-visible]:outline-offset-3 group-has-[a:focus-visible]:outline-accent motion-reduce:transform-none">
          <MorphSource movieId={movie.id}>
            <div className="absolute inset-0">
              <TmdbImage
                path={movie.posterPath}
                kind="poster"
                alt=""
                sizes={posterSizes}
                preload={preload}
                blurDataUrl={movie.blur?.poster}
              />
            </div>
          </MorphSource>
          {rank ? (
            <span className="absolute top-2 left-2 rounded-md bg-screen/78 px-[7px] py-1 font-mono text-[11px] leading-none font-semibold text-screen-fg backdrop-blur-sm">
              #{rank}
            </span>
          ) : null}
          {movie.voteCount > 0 ? (
            <span className="absolute bottom-2 left-2 inline-flex items-center gap-1.5 rounded-full bg-screen/80 px-2 py-1 font-mono text-[11.5px] leading-none font-semibold text-screen-fg backdrop-blur-sm">
              <ScoreDot score={movie.score} />
              {movie.score}%
            </span>
          ) : null}
        </div>
        <div>
          <h3
            title={movie.title}
            className="line-clamp-2 text-[15px] leading-tight font-semibold break-words"
          >
            {movie.title}
          </h3>
          <p className="mt-0.5 font-mono text-[12.5px] text-fg-muted">
            {[movie.year, genre].filter(Boolean).join(' · ')}
          </p>
        </div>
      </MovieLink>
      <WatchlistButton movie={summaryOf(movie)} variant="icon" />
    </article>
  );
}

export function PosterCardSkeleton() {
  return (
    <div aria-hidden className="grid gap-2.5">
      <div className="skeleton aspect-[2/3] rounded-card" />
      <div className="skeleton h-3 w-4/5 rounded" />
      <div className="skeleton h-3 w-1/2 rounded" />
    </div>
  );
}
