import { formatRelativeTime } from '../locale/format-relative-time';

const NOW = Date.UTC(2026, 10, 11, 12);
const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

describe('formatRelativeTime', () => {
  it('reads past and future in the largest unit, rounded', () => {
    const ago = (ms: number, locale = 'en') => formatRelativeTime(NOW - ms, locale, { now: NOW });
    expect(ago(10_000)).toBe('now');
    expect(ago(3 * MIN)).toBe('3 minutes ago');
    expect(ago(5 * HOUR)).toBe('5 hours ago');
    expect(ago(DAY)).toBe('yesterday');
    expect(ago(3 * DAY, 'es')).toBe('hace 3 días');
    expect(formatRelativeTime(new Date(NOW + 2 * DAY), 'en', { now: NOW })).toBe('in 2 days');
  });

  it('takes a style and never throws on a bad input', () => {
    expect(formatRelativeTime(NOW - 3 * MIN, 'en', { now: NOW, style: 'short' })).toBe(
      '3 min. ago',
    );
    expect(formatRelativeTime(Number.NaN, 'en')).toBe('');
    expect(formatRelativeTime(NOW - 2 * HOUR, 'not a locale', { now: NOW })).toBe('2 hours ago');
  });
});
