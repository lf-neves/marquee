import { type MovieDetails, type WatchOptions, type WatchProvider } from '@marquee/tmdb/types';
import { ExternalLink, Play, Ticket } from 'lucide-react';
import Image from 'next/image';
import { regionText } from '#/lib/format';
import { getMovie } from '#/server/catalog';
import { getRegion } from '#/server/region';
import { Button } from '../ui/button';

// Request-time parts of the movie page: they depend on the viewer's country, so they stream into
// the prerendered page inside <Suspense>.

const recentReleaseDays = 120;

function isRecent(movie: MovieDetails) {
  if (!movie.releaseDate) return false;
  const age = Date.now() - Date.parse(`${movie.releaseDate}T00:00:00Z`);
  return age >= 0 && age < recentReleaseDays * 86_400_000;
}

function primaryOption(options: WatchOptions | undefined) {
  if (!options) return null;
  if (options.stream[0])
    return { verb: 'Stream on', providers: options.stream, action: 'Watch on' };
  if (options.free[0]) return { verb: 'Free on', providers: options.free, action: 'Watch on' };
  if (options.rent[0]) return { verb: 'Rent on', providers: options.rent, action: 'Rent on' };
  if (options.buy[0]) return { verb: 'Buy on', providers: options.buy, action: 'Buy on' };
  return null;
}

function ProviderChip({ provider }: { provider: WatchProvider }) {
  return (
    <li className="inline-flex items-center gap-[7px] rounded-lg border border-screen-line bg-white/6 py-[3px] pr-2.5 pl-[3px] text-[13px] font-medium">
      {provider.logoPath ? (
        <Image
          src={`/logo${provider.logoPath}`}
          alt=""
          width={22}
          height={22}
          className="size-[22px] rounded-[5px]"
        />
      ) : (
        <i
          aria-hidden
          className="grid size-[22px] place-items-center rounded-[5px] bg-screen-3 text-[10px] font-bold not-italic"
        >
          {provider.name.slice(0, 2)}
        </i>
      )}
      {provider.name}
    </li>
  );
}

export async function WhereToWatch({ movieId }: { movieId: number }) {
  const [movie, region] = await Promise.all([getMovie(movieId), getRegion()]);
  if (!movie) return null;
  const options = movie.watch[region];
  const primary = primaryOption(options);
  const country = regionText(region);

  if (!primary) {
    return (
      <p className="flex flex-wrap items-center gap-2.5 font-mono text-[12.5px] text-screen-muted">
        <span className="inline-flex items-center gap-[7px] rounded-lg border border-screen-line bg-white/6 px-2.5 py-1 font-sans text-[13px] font-medium text-screen-fg">
          <Ticket className="size-4" aria-hidden />
          {isRecent(movie) ? 'In theaters now' : `Not streaming in ${country} yet`}
        </span>
      </p>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-2">
      <span className="font-mono text-[12.5px] text-screen-muted">{primary.verb}</span>
      <ul className="flex flex-wrap gap-2" aria-label={`${primary.verb} in ${country}`}>
        {primary.providers.slice(0, 4).map((provider) => (
          <ProviderChip key={provider.id} provider={provider} />
        ))}
      </ul>
      <span className="font-mono text-[11px] text-screen-muted/80">
        {country} · data from JustWatch
      </span>
    </div>
  );
}

export async function WatchNowButton({ movieId }: { movieId: number }) {
  const [movie, region] = await Promise.all([getMovie(movieId), getRegion()]);
  const options = movie?.watch[region];
  const primary = primaryOption(options);
  const provider = primary?.providers[0];
  if (!options?.link || !primary || !provider) return null;
  return (
    <Button asChild>
      <a href={options.link} target="_blank" rel="noopener noreferrer">
        <Play aria-hidden />
        {primary.action} {provider.name}
        <ExternalLink className="opacity-70" aria-hidden />
      </a>
    </Button>
  );
}

export function WhereToWatchSkeleton() {
  return <div aria-hidden className="h-[30px] w-[280px] rounded-lg bg-white/6" />;
}
