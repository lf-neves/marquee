import { genreName } from '@marquee/tmdb/genres';
import { type MovieSummary } from '@marquee/tmdb/types';
import { paths } from '#/lib/paths';
import { WatchlistButton } from '../watchlist/watchlist-button';
import { MorphSource, MovieLink } from './movie-link';
import { ScoreText } from './score';
import { TmdbImage } from './tmdb-image';

const tileSizes = '(max-width: 719px) 44vw, (min-width: 1600px) 16vw, 19vw';

/** A 16:9 backdrop tile for rows; the title is set in the display face over the artwork. */
export function MovieTile({ movie }: { movie: MovieSummary }) {
  const genre = movie.genreIds[0] ? genreName(movie.genreIds[0]) : null;
  return (
    <article className="group relative min-w-0">
      <MovieLink
        href={paths.movie(movie)}
        className="relative block aspect-video overflow-hidden rounded-lg bg-screen text-screen-fg transition-[transform,box-shadow] duration-200 group-hover:z-10 group-hover:scale-[1.04] group-hover:shadow-lift focus-visible:scale-[1.04] motion-reduce:transform-none"
      >
        <MorphSource movieId={movie.id}>
          <div className="absolute inset-0">
            <TmdbImage
              path={movie.backdropPath ?? movie.posterPath}
              kind="backdrop"
              alt=""
              sizes={tileSizes}
            />
          </div>
        </MorphSource>
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
        <div className="absolute inset-x-2.5 bottom-2 grid gap-0.5">
          <strong className="font-display text-[21px] leading-[0.95] font-extrabold tracking-[0.01em] uppercase max-md:text-lg">
            {movie.title}
          </strong>
          <span className="flex items-center gap-1.5 font-mono text-[11.5px] text-screen-muted">
            <ScoreText score={movie.score} voteCount={movie.voteCount} />
            {movie.year ? <span>{movie.year}</span> : null}
            {genre ? <span className="truncate">{genre}</span> : null}
          </span>
        </div>
      </MovieLink>
      <WatchlistButton
        movie={{ id: movie.id, title: movie.title }}
        variant="icon"
        className="top-2 right-2 size-[30px]"
      />
    </article>
  );
}
