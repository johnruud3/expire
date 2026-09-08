export function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

export function parseDateKey(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function shiftDateKey(value: string, days: number) {
  const next = parseDateKey(value);
  next.setDate(next.getDate() + days);
  return toDateKey(next);
}

export function dateKeyFromToday(days: number) {
  const next = new Date();
  next.setDate(next.getDate() + days);
  return toDateKey(next);
}

export function expandYear(year: string) {
  if (year.length === 2) {
    const short = Number(year);
    return String(2000 + short);
  }
  return year;
}

export function dateKeyFromParts(day: string, month: string, year: string) {
  const fullYear = expandYear(year);
  if (day.length === 0 || month.length === 0 || fullYear.length !== 4) return null;
  const padded = `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  return isValidDateKey(padded) ? padded : null;
}

export function isValidDateKey(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = parseDateKey(value);
  return toDateKey(parsed) === value;
}

export function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatSaleDay(value: string, locale: string, labels: { today: string; yesterday: string }) {
  const today = toDateKey(new Date());
  if (value === today) return labels.today;
  if (value === dateKeyFromToday(-1)) return labels.yesterday;
  return formatDateKey(value, locale);
}

export function formatDateKey(value: string, locale: string) {
  return parseDateKey(value).toLocaleDateString(locale === 'nb' ? 'nb-NO' : 'en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateBlock(value: string, locale: string) {
  const date = parseDateKey(value);
  const loc = locale === 'nb' ? 'nb-NO' : 'en-GB';
  return {
    day: String(date.getDate()),
    month: date.toLocaleDateString(loc, { month: 'short' }).replace('.', ''),
  };
}

export type Urgency = 'expired' | 'today' | 'week' | 'later';

export function itemUrgency(expiresOn: string | null, now = new Date()): Urgency {
  if (!expiresOn) return 'later';
  const expires = startOfDay(parseDateKey(expiresOn));
  const today = startOfDay(now);
  const weekEnd = today + 7 * 24 * 60 * 60 * 1000;
  if (expires < today) return 'expired';
  if (expires === today) return 'today';
  if (expires < weekEnd) return 'week';
  return 'later';
}
