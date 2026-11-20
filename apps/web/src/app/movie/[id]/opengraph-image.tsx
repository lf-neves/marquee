import { tmdbImageUrl } from '@marquee/tmdb/images';
import { ImageResponse } from 'next/og';
import { runtimeText, scoreTone } from '#/lib/format';
import { parseMovieSegment } from '#/lib/paths';
import { getMovie } from '#/server/catalog';
import { loadBackdrop, loadDisplayFont, loadUiFonts, ogColors } from '../../og-fonts';

export const alt = 'Movie details on Marquee';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const brandName = 'MARQUEE';
const fallbackTagline = 'Discover what to watch tonight';

const toneColors = { good: '#41d392', mid: '#f0b93b', bad: '#f06464' } as const;

// Long titles step down so they stay within three lines of the text column.
function titleFontSize(title: string): number {
  if (title.length <= 14) return 132;
  if (title.length <= 24) return 104;
  if (title.length <= 38) return 80;
  return 62;
}

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id: segment } = await params;
  const movieId = parseMovieSegment(segment);
  const movie = movieId === null ? null : await getMovie(movieId).catch(() => null);

  const title = (movie?.title ?? brandName).toUpperCase();
  const metaParts = movie
    ? [
        movie.year === null ? null : String(movie.year),
        movie.runtime ? runtimeText(movie.runtime) : null,
      ].filter((part): part is string => part !== null)
    : [];
  const hasScore = movie !== null && movie.voteCount > 0;
  const scoreLabel = movie ? `${movie.score}%` : '';
  const tagline = movie ? movie.tagline : fallbackTagline;

  const [backdrop, displayFonts, uiFonts] = await Promise.all([
    loadBackdrop(movie?.backdropPath ? tmdbImageUrl(movie.backdropPath, 'backdrop', 1280) : null),
    loadDisplayFont(`${title}${brandName}M`),
    loadUiFonts(`0123456789%·${metaParts.join('')}${tagline ?? ''}`),
  ]);
  const hasDisplayFont = displayFonts.length > 0;
  const hasUiFont = uiFonts.length > 0;
  const displayFamily = hasDisplayFont ? 'Big Shoulders Display' : 'sans-serif';
  const toneColor = movie ? toneColors[scoreTone(movie.score)] : ogColors.amber;

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        position: 'relative',
        background: ogColors.background,
        color: ogColors.text,
        fontFamily: hasUiFont ? 'Geist' : 'sans-serif',
      }}
    >
      {backdrop ? (
        // oxlint-disable-next-line next/no-img-element -- ImageResponse renders plain elements
        <img
          src={backdrop}
          alt=""
          width={1200}
          height={630}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: 1200,
            height: 630,
            objectFit: 'cover',
          }}
        />
      ) : null}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: 1200,
          height: 630,
          background: `linear-gradient(90deg, ${ogColors.background} 10%, rgba(6, 7, 10, 0.84) 50%, rgba(6, 7, 10, 0.3) 100%)`,
        }}
      />
      <div
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          width: '100%',
          height: '100%',
          padding: '64px 72px 56px',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', maxWidth: 940 }}>
          <div
            style={{
              fontFamily: displayFamily,
              fontWeight: 800,
              fontSize: titleFontSize(title),
              lineHeight: 0.95,
              letterSpacing: '0.01em',
            }}
          >
            {title}
          </div>
          {movie ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                marginTop: 28,
                fontSize: 34,
                fontWeight: 600,
              }}
            >
              {metaParts.map((part) => (
                <div key={part} style={{ display: 'flex', marginRight: 16 }}>
                  {`${part} ·`}
                </div>
              ))}
              {hasScore ? (
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <div
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: 9,
                      background: toneColor,
                      marginRight: 12,
                    }}
                  />
                  {scoreLabel}
                </div>
              ) : null}
            </div>
          ) : null}
          {tagline ? (
            <div
              style={{
                marginTop: 22,
                fontSize: 30,
                fontWeight: 400,
                fontStyle: 'italic',
                color: ogColors.muted,
                maxWidth: 820,
              }}
            >
              {tagline}
            </div>
          ) : null}
        </div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div
            style={{
              width: 44,
              height: 44,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: `3px dashed ${ogColors.amber}`,
              borderRadius: 11,
              color: ogColors.amber,
              fontFamily: displayFamily,
              fontWeight: 800,
              fontSize: 32,
              lineHeight: 1,
            }}
          >
            M
          </div>
          <div
            style={{
              marginLeft: 16,
              fontFamily: displayFamily,
              fontWeight: 800,
              fontSize: 34,
              letterSpacing: '0.08em',
            }}
          >
            {brandName}
          </div>
        </div>
      </div>
    </div>,
    { ...size, fonts: [...displayFonts, ...uiFonts] },
  );
}
