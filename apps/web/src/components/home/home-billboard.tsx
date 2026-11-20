import { getMovie, getTrending } from '#/server/catalog';
import { summaryOf } from '#/lib/movie-card';
import { paths } from '#/lib/paths';
import { Billboard, type BillboardMovie } from './billboard';

/** Cached at build and revalidated hourly, so the billboard ships inside the static shell. */
export async function HomeBillboard() {
  const trending = await getTrending('day');
  const top = trending.results.slice(0, 5);
  const details = await Promise.all(top.map((movie) => getMovie(movie.id)));
  const movies: BillboardMovie[] = top.map((movie, index) => {
    const detail = details[index];
    return {
      id: movie.id,
      title: movie.title,
      href: paths.movie(movie),
      overview: movie.overview,
      year: movie.year,
      runtime: detail?.runtime ?? null,
      certification: detail?.certifications.US ?? null,
      genres: detail?.genres.map((genre) => genre.name) ?? [],
      score: movie.score,
      voteCount: movie.voteCount,
      backdropPath: movie.backdropPath,
      blur: movie.blur.backdrop ?? null,
      summary: summaryOf(movie),
      trailer: detail?.trailer ?? null,
    };
  });
  return <Billboard movies={movies} />;
}
