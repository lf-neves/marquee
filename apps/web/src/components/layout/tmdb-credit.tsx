import Image from 'next/image';
import { cn } from '#/lib/utils';

// TMDB's API terms (section 3) require its logo and this notice in the app's credits, with the logo
// less prominent than Marquee's own. The file is TMDB's approved "alt short" logo, served by TMDB.
const tmdbLogoUrl =
  'https://www.themoviedb.org/assets/v4/logos/v2/blue_short-8e7b30f73a4020692ccca9c88bafe5dcb6f8a62a4c6bc55cd9ba82bb2cd95f6c.svg';

export const tmdbNotice =
  'This website uses TMDB and the TMDB APIs but is not endorsed, certified, or otherwise approved by TMDB.';

/** TMDB and JustWatch credit, shown on the home page and in each movie's More info dialog. */
export function TmdbCredit({ className }: { className?: string }) {
  return (
    <div
      className={cn('grid gap-2 font-mono text-[11.5px] leading-relaxed text-fg-faint', className)}
    >
      <a
        href="https://www.themoviedb.org/"
        aria-label="The Movie Database (TMDB)"
        className="w-fit opacity-80 hover:opacity-100"
      >
        <Image src={tmdbLogoUrl} alt="" width={92} height={12} className="h-3 w-auto" unoptimized />
      </a>
      <p>
        {tmdbNotice} Streaming availability from{' '}
        <a
          href="https://www.justwatch.com/"
          className="underline underline-offset-2 hover:text-fg-muted"
        >
          JustWatch
        </a>
        .
      </p>
    </div>
  );
}
