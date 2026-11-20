import { ImageResponse } from 'next/og';
import { loadDisplayFont, ogColors } from './og-fonts';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default async function AppleIcon() {
  const fonts = await loadDisplayFont('M');

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: ogColors.background,
      }}
    >
      <div
        style={{
          width: 128,
          height: 128,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: `8px dashed ${ogColors.amber}`,
          borderRadius: 32,
          color: ogColors.amber,
          fontFamily: fonts.length > 0 ? 'Big Shoulders Display' : 'sans-serif',
          fontWeight: 800,
          fontSize: 104,
          lineHeight: 1,
        }}
      >
        M
      </div>
    </div>,
    { ...size, fonts },
  );
}
