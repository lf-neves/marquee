import { TmdbCredit } from './tmdb-credit';

/** The home page's credits: TMDB's terms require its logo and notice in a credits area. */
export function Attribution() {
  return (
    <footer className="wrap pt-6 pb-16">
      <TmdbCredit className="mx-auto max-w-[60ch] justify-items-center text-center" />
    </footer>
  );
}
