import { cacheLife } from 'next/cache';

// Fonts and artwork for generated images. ImageResponse cannot read web fonts, so each face is
// fetched from Google Fonts as a TTF limited to the glyphs the image prints. The cached functions
// throw on failure instead of returning a fallback: a thrown error is never cached, whereas a
// cached fallback would stick for the lifetime of the entry.

export type OgFont = {
  name: string;
  data: ArrayBuffer;
  style: 'normal';
  weight: 400 | 600 | 800;
};

const fontCssBase = 'https://fonts.googleapis.com/css2';

async function fetchFontData({
  family,
  weight,
  text,
}: {
  family: string;
  weight: number;
  text: string;
}): Promise<ArrayBuffer> {
  const cssUrl = `${fontCssBase}?family=${family}:wght@${weight}&text=${encodeURIComponent(text)}`;
  const css = await (await fetch(cssUrl)).text();
  const fontUrl = /src: url\((.+?)\) format\('(?:opentype|truetype)'\)/.exec(css)?.[1];
  if (!fontUrl) throw new Error(`No TTF source for ${family} ${weight}`);
  const response = await fetch(fontUrl);
  if (!response.ok) throw new Error(`Font download failed for ${family} ${weight}`);
  return response.arrayBuffer();
}

// Deduplicated glyphs keep the cache key and the download small.
const uniqueGlyphs = (text: string) => [...new Set(text)].toSorted().join('');

async function bigShouldersData(text: string) {
  'use cache';
  cacheLife('max');
  return fetchFontData({ family: 'Big+Shoulders', weight: 800, text });
}

async function geistData(weight: 400 | 600, text: string) {
  'use cache';
  cacheLife('max');
  return fetchFontData({ family: 'Geist', weight, text });
}

/** Big Shoulders Display 800 covering `text`; empty when the download fails. */
export async function loadDisplayFont(text: string): Promise<OgFont[]> {
  try {
    const data = await bigShouldersData(uniqueGlyphs(text));
    return [{ name: 'Big Shoulders Display', data, style: 'normal', weight: 800 }];
  } catch {
    return [];
  }
}

/** Geist 400 and 600 covering `text`; empty when the download fails. */
export async function loadUiFonts(text: string): Promise<OgFont[]> {
  try {
    const glyphs = uniqueGlyphs(text);
    const [regular, semibold] = await Promise.all([geistData(400, glyphs), geistData(600, glyphs)]);
    return [
      { name: 'Geist', data: regular, style: 'normal', weight: 400 },
      { name: 'Geist', data: semibold, style: 'normal', weight: 600 },
    ];
  } catch {
    return [];
  }
}

async function backdropData(url: string) {
  'use cache';
  cacheLife('days');
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Backdrop download failed: ${response.status}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  return `data:image/jpeg;base64,${bytes.toString('base64')}`;
}

/** A data URI for the image, or null so the card still renders without artwork. */
export async function loadBackdrop(url: string | null): Promise<string | null> {
  if (!url) return null;
  try {
    return await backdropData(url);
  } catch {
    return null;
  }
}

export const ogColors = {
  background: '#06070a',
  text: '#f5f3ee',
  muted: '#b8bcc7',
  amber: '#f2c14e',
} as const;
