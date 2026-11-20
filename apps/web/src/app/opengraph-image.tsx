import { tmdbImageUrl } from '@marquee/tmdb/images';
import { ImageResponse } from 'next/og';
import { getTrending } from '#/server/catalog';
import { loadBackdrop, loadDisplayFont, loadUiFonts, ogColors } from './og-fonts';

export const alt = 'Marquee: the most-watched movies trending today';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const headline = 'TRENDING TODAY';
const brandName = 'MARQUEE';

export default async function Image() {
  const trending = await getTrending('day');
  const [leader] = trending.results;
  const topThree = trending.results.slice(0, 3);

  const listText = topThree.map((movie, index) => `${index + 1}${movie.title}`).join('');
  const [backdrop, displayFonts, uiFonts] = await Promise.all([
    loadBackdrop(leader?.backdropPath ? tmdbImageUrl(leader.backdropPath, 'backdrop', 1280) : null),
    loadDisplayFont(`${headline}${brandName}M`),
    loadUiFonts(`0123456789.${listText}`),
  ]);
  const hasDisplayFont = displayFonts.length > 0;
  const hasUiFont = uiFonts.length > 0;

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
          background: `linear-gradient(90deg, ${ogColors.background} 8%, rgba(6, 7, 10, 0.82) 48%, rgba(6, 7, 10, 0.35) 100%)`,
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
          padding: '56px 72px',
        }}
      >
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
              fontFamily: hasDisplayFont ? 'Big Shoulders Display' : 'sans-serif',
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
              fontFamily: hasDisplayFont ? 'Big Shoulders Display' : 'sans-serif',
              fontWeight: 800,
              fontSize: 34,
              letterSpacing: '0.08em',
            }}
          >
            {brandName}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              fontFamily: hasDisplayFont ? 'Big Shoulders Display' : 'sans-serif',
              fontWeight: 800,
              fontSize: 176,
              lineHeight: 0.92,
              letterSpacing: '0.01em',
            }}
          >
            {headline}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', marginTop: 36 }}>
            {topThree.map((movie, index) => (
              <div
                key={movie.id}
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  fontSize: 34,
                  fontWeight: 600,
                  marginTop: index === 0 ? 0 : 10,
                }}
              >
                <div style={{ width: 52, color: ogColors.amber }}>{`${index + 1}.`}</div>
                <div style={{ maxWidth: 900, overflow: 'hidden', whiteSpace: 'nowrap' }}>
                  {movie.title}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>,
    { ...size, fonts: [...displayFonts, ...uiFonts] },
  );
}
