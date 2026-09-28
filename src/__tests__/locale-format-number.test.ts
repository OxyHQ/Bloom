import {
  formatClock,
  formatCompactCurrency,
  formatCompactNumber,
  formatCurrency,
  formatFileSize,
  formatInteger,
  formatNumber,
  formatPercent,
  formatSignedPercent,
} from '../locale/format-number';

// Node's ICU spaces French and Russian numbers with narrow/no-break spaces;
// compare on ordinary spaces so the assertions read.
const plain = (text: string) => text.replace(/[  ]/g, ' ').replace(/[‎‏]/g, '');

describe('formatNumber / formatInteger', () => {
  it('groups and marks decimals the locale\'s way', () => {
    expect(formatNumber(1234567.891, 'en')).toBe('1,234,567.891');
    expect(formatNumber(1234567.891, 'de')).toBe('1.234.567,891');
    expect(plain(formatNumber(1234567.891, 'fr'))).toBe('1 234 567,891');
    expect(formatInteger(1234567.8, 'hi')).toBe('12,34,568');
  });

  it('keeps Spanish four-digit numbers ungrouped, as Spanish does', () => {
    expect(formatInteger(1234, 'es')).toBe('1234');
    expect(formatInteger(12345, 'es')).toBe('12.345');
  });

  it('matches the old en-US output with no locale on an English runtime', () => {
    expect(formatNumber(48.8)).toBe('48.8');
    expect(formatInteger(12500)).toBe('12,500');
  });
});

describe('formatCompactNumber', () => {
  it('shortens thousands per locale and leaves small numbers whole', () => {
    expect(formatCompactNumber(12500, 'en')).toBe('12.5K');
    expect(formatCompactNumber(13000, 'en')).toBe('13K');
    expect(plain(formatCompactNumber(12500, 'es'))).toBe('12,5 mil');
    expect(formatCompactNumber(640, 'en')).toBe('640');
  });
});

describe('percentages', () => {
  it('places the sign and spacing per locale', () => {
    expect(formatPercent(0.25, 'en')).toBe('25%');
    expect(plain(formatPercent(0.25, 'fr'))).toBe('25 %');
    expect(formatPercent(0.25, 'tr')).toBe('%25');
  });

  it('always signs a change, except zero', () => {
    expect(formatSignedPercent(0.052, 'en')).toBe('+5.2%');
    expect(formatSignedPercent(-0.052, 'en')).toBe('-5.2%');
    expect(formatSignedPercent(0, 'en')).toBe('0.0%');
    expect(plain(formatSignedPercent(0.052, 'de'))).toBe('+5,2 %');
  });
});

describe('formatCurrency', () => {
  it('places the currency symbol the locale\'s way', () => {
    expect(formatCurrency(385000, 'EUR', 'en')).toBe('€385,000');
    expect(plain(formatCurrency(385000, 'EUR', 'es'))).toBe('385.000 €');
    expect(formatCurrency(1299.5, 'USD', 'en', 2)).toBe('$1,299.50');
  });

  it('shortens for an axis', () => {
    expect(formatCompactCurrency(385000, 'EUR', 'en')).toBe('€385K');
    expect(formatCompactCurrency(900, 'EUR', 'en')).toBe('€900');
  });

  it('falls back instead of throwing on a bad currency code', () => {
    expect(formatCurrency(10, 'not-a-code', 'en')).toBe('not-a-code 10');
  });
});

describe('formatFileSize', () => {
  it('uses the locale\'s decimal mark and unit symbols', () => {
    expect(formatFileSize(2.4 * 1024 ** 2, 'en')).toBe('2.4 MB');
    expect(formatFileSize(2.4 * 1024 ** 2, 'es')).toBe('2,4 MB');
    expect(formatFileSize(2.4 * 1024 ** 2, 'fr')).toBe('2,4 Mo');
    expect(formatFileSize(15 * 1024 ** 3, 'ru')).toBe('15 ГБ');
    expect(formatFileSize(300, 'en')).toBe('1 KB');
    expect(formatFileSize(0, 'en')).toBe('0 B');
  });
});

describe('formatClock', () => {
  it('is a clock in every locale', () => {
    expect(formatClock(83)).toBe('1:23');
    expect(formatClock(3723)).toBe('1:02:03');
    expect(formatClock(-4)).toBe('0:00');
    expect(formatClock(Number.NaN)).toBe('0:00');
  });
});
