import { formatBytes, formatDurationText } from '../locale/format-number';

const plain = (text: string) => text.replace(/[  ]/g, ' ');

describe('formatBytes', () => {
  it('keeps exact bytes, scales in 1024 steps and speaks the locale', () => {
    expect(formatBytes(0, 'en')).toBe('0 B');
    expect(formatBytes(512, 'en')).toBe('512 B');
    expect(formatBytes(1536, 'en')).toBe('1.5 KB');
    expect(formatBytes(2_400_000, 'en')).toBe('2.3 MB');
    expect(formatBytes(1024 ** 3 * 3, 'en')).toBe('3 GB');
    expect(plain(formatBytes(2_400_000, 'es'))).toBe('2,3 MB');
    expect(formatBytes(1024 ** 4 * 1.2, 'en')).toMatch(/^1\.2 ?TB$/);
    expect(formatBytes(-5, 'en')).toBe('0 B');
    expect(formatBytes(Number.NaN, 'en')).toBe('0 B');
  });
});

describe('formatDurationText', () => {
  it('reads the two largest units, in the locale', () => {
    expect(formatDurationText(0, 'en')).toBe('0s');
    expect(formatDurationText(45, 'en')).toBe('45s');
    expect(formatDurationText(65, 'en')).toBe('1m 5s');
    expect(formatDurationText(3725, 'en')).toBe('1h 2m');
    expect(formatDurationText(90_000, 'en')).toBe('1d 1h');
    expect(formatDurationText(3725, 'en', { style: 'long' })).toBe('1 hour 2 minutes');
    expect(formatDurationText(3725, 'en', { maxUnits: 3 })).toBe('1h 2m 5s');
    expect(formatDurationText(-1, 'en')).toBe('0s');
  });
});
