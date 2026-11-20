export function runtimeText(minutes: number | null): string {
  if (!minutes) return '—';
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest}m`;
  return rest === 0 ? `${hours}h` : `${hours}h ${rest}m`;
}

const usd = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  notation: 'compact',
  minimumFractionDigits: 0,
  maximumFractionDigits: 1,
});

export const moneyText = (amount: number | null) => (amount ? usd.format(amount) : '—');

const longDate = new Intl.DateTimeFormat('en-US', { dateStyle: 'long', timeZone: 'UTC' });

export const dateText = (isoDate: string | null) =>
  isoDate ? longDate.format(new Date(`${isoDate}T00:00:00Z`)) : '—';

export type ScoreTone = 'good' | 'mid' | 'bad';

export const scoreTone = (score: number): ScoreTone =>
  score >= 70 ? 'good' : score >= 50 ? 'mid' : 'bad';

const languageNames = new Intl.DisplayNames(['en'], { type: 'language' });

export function languageText(code: string): string {
  try {
    return languageNames.of(code) ?? code;
  } catch {
    return code;
  }
}

const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });

export function regionText(code: string): string {
  try {
    return regionNames.of(code) ?? code;
  } catch {
    return code;
  }
}
