import { buildTheme } from '../theme/build-theme';
import { contrastRatio } from '../styles/color-contrast';
import { resolveSwitchOffPaint } from '../switch/paint';

describe('Switch off track', () => {
  it.each([false, true])('clears 3:1 against its surface (dark=%s)', (isDark) => {
    const theme = buildTheme('teal', isDark ? 'dark' : 'light');
    const paint = resolveSwitchOffPaint({
      surface: theme.colors.background,
      text: theme.colors.text,
      isDark: theme.isDark,
    });
    expect(contrastRatio(paint.track, theme.colors.background)).toBeGreaterThanOrEqual(3);
    // It is a different, clearer step than the old hairline track.
    expect(paint.track).not.toBe(theme.colors.border);
    // and the thumb reads against the track.
    expect(contrastRatio(paint.thumb, paint.track)).toBeGreaterThanOrEqual(2);
  });
});
