import { genreName } from '@marquee/tmdb/genres';
import { type MovieCard, summaryOf } from '#/lib/movie-card';
import { paths } from '#/lib/paths';
import { cn } from '#/lib/utils';
import { WatchlistButton } from '../watchlist/watchlist-button';
import { MorphSource, MovieLink } from './movie-link';
import { ScoreText } from './score';
import { TmdbImage } from './tmdb-image';

const tileSizes = '(max-width: 719px) 44vw, (min-width: 1600px) 16vw, 19vw';

// Long titles step down a size and stop at two lines, so they never run off the top of the tile.
const longTitleLength = 26;

/** A 16:9 backdrop tile for rows; the title is set in the display face over the artwork. */
export function MovieTile({ movie }: { movie: MovieCard }) {
  const genre = movie.genreIds[0] ? genreName(movie.genreIds[0]) : null;
  const longTitle = movie.title.length > longTitleLength;
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
              kind={movie.backdropPath ? 'tile' : 'poster'}
              alt=""
              sizes={tileSizes}
              blurDataUrl={movie.backdropPath ? movie.blur?.backdrop : movie.blur?.poster}
            />
          </div>
        </MorphSource>
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
        {/* A shrinkable column: without minmax(0,1fr) the meta line widens it past narrow tiles. */}
        <div className="absolute inset-x-2.5 bottom-2 grid grid-cols-[minmax(0,1fr)] gap-0.5">
          <strong
            title={movie.title}
            className={cn(
              'line-clamp-2 font-display leading-[0.95] font-extrabold tracking-[0.01em] break-words uppercase',
              longTitle ? 'text-[17px] max-md:text-[15px]' : 'text-[21px] max-md:text-lg',
            )}
          >
            {movie.title}
          </strong>
          <span className="flex min-w-0 items-center gap-1.5 font-mono text-[11.5px] text-screen-muted">
            <ScoreText score={movie.score} voteCount={movie.voteCount} />
            {movie.year ? <span>{movie.year}</span> : null}
            {genre ? <span className="min-w-0 truncate">{genre}</span> : null}
          </span>
        </div>
      </MovieLink>
      <WatchlistButton
        movie={summaryOf(movie)}
        variant="icon"
        className="top-2 right-2 size-[30px]"
      />
    </article>
  );
}
