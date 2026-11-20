import { type RawMovieDetails, type RawMovieListItem, type RawRegionProviders } from './schemas';
import {
  type MovieDetails,
  type MovieSummary,
  type Page,
  type Trailer,
  type WatchOptions,
  type WatchProvider,
} from './types';

/** TMDB refuses pages above 500 even when `total_pages` is larger. */
export const maxTmdbPage = 500;

export function toMovieSummary(raw: RawMovieListItem): MovieSummary {
  const releaseDate = raw.release_date || null;
  return {
    id: raw.id,
    title: raw.title,
    overview: raw.overview,
    releaseDate,
    year: releaseDate ? Number(releaseDate.slice(0, 4)) || null : null,
    posterPath: raw.poster_path,
    backdropPath: raw.backdrop_path,
    score: Math.round(raw.vote_average * 10),
    voteCount: raw.vote_count,
    genreIds: raw.genre_ids,
    originalLanguage: raw.original_language,
  };
}

/** Adult titles and entries with no artwork at all never render well in a poster grid. */
export const isListable = (raw: RawMovieListItem) =>
  !raw.adult && (raw.poster_path !== null || raw.backdrop_path !== null);

export function toPage<Raw, Item>(
  raw: { page: number; results: Raw[]; total_pages: number; total_results: number },
  map: (items: Raw[]) => Item[],
): Page<Item> {
  const lastPage = Math.min(raw.total_pages, maxTmdbPage);
  return {
    page: raw.page,
    results: map(raw.results),
    totalPages: lastPage,
    totalResults: raw.total_results,
    nextPage: raw.page < lastPage ? raw.page + 1 : null,
  };
}

const byPriority = (providers: RawRegionProviders['flatrate']): WatchProvider[] =>
  (providers ?? [])
    .toSorted((left, right) => left.display_priority - right.display_priority)
    .map((provider) => ({
      id: provider.provider_id,
      name: provider.provider_name,
      logoPath: provider.logo_path,
    }));

function toWatchOptions(region: string, raw: RawRegionProviders): WatchOptions {
  return {
    region,
    link: raw.link ?? null,
    stream: byPriority(raw.flatrate),
    free: byPriority([...(raw.free ?? []), ...(raw.ads ?? [])]),
    rent: byPriority(raw.rent),
    buy: byPriority(raw.buy),
  };
}

// Theatrical (3) and digital (4) releases carry the rating people recognize; premieres often have none.
const certificationTypeOrder = [3, 4, 5, 2, 1, 6];

function toCertifications(raw: RawMovieDetails['release_dates']): Record<string, string> {
  const certifications: Record<string, string> = {};
  for (const country of raw?.results ?? []) {
    const rated = country.release_dates
      .filter((release) => release.certification.trim() !== '')
      .toSorted(
        (left, right) =>
          certificationTypeOrder.indexOf(left.type) - certificationTypeOrder.indexOf(right.type),
      );
    const first = rated[0];
    if (first) certifications[country.iso_3166_1] = first.certification.trim();
  }
  return certifications;
}

function toTrailer(raw: RawMovieDetails['videos']): Trailer | null {
  const trailers = (raw?.results ?? [])
    .filter((video) => video.site === 'YouTube' && video.type === 'Trailer')
    .toSorted(
      (left, right) =>
        Number(right.official) - Number(left.official) ||
        right.published_at.localeCompare(left.published_at),
    );
  const best = trailers[0];
  return best ? { youtubeKey: best.key, name: best.name } : null;
}

export function toMovieDetails(raw: RawMovieDetails): MovieDetails {
  const summary = toMovieSummary({ ...raw, genre_ids: raw.genres.map((genre) => genre.id) });
  const watch: Record<string, WatchOptions> = {};
  for (const [region, options] of Object.entries(raw['watch/providers']?.results ?? {})) {
    watch[region] = toWatchOptions(region, options);
  }
  return {
    ...summary,
    tagline: raw.tagline?.trim() || null,
    runtime: raw.runtime || null,
    genres: raw.genres,
    budget: raw.budget > 0 ? raw.budget : null,
    revenue: raw.revenue > 0 ? raw.revenue : null,
    status: raw.status,
    imdbId: raw.imdb_id,
    director: raw.credits?.crew.find((member) => member.job === 'Director')?.name ?? null,
    certifications: toCertifications(raw.release_dates),
    trailer: toTrailer(raw.videos),
    watch,
  };
}
