import { buildTheme } from '../theme/build-theme';
import { THEME_GRADIENTS } from '../theme/gradients';

describe('theme gradients', () => {
  it('are exposed on the built theme', () => {
    const theme = buildTheme('teal', 'light');
    expect(theme.gradients).toBe(THEME_GRADIENTS);
    expect(Object.keys(theme.gradients).length).toBeGreaterThan(0);
  });

  it('every gradient has ordered [offset, color] stops', () => {
    for (const [name, gradient] of Object.entries(THEME_GRADIENTS)) {
      expect(name).toBeTruthy();
      expect(Array.isArray(gradient.values)).toBe(true);
      expect(gradient.values.length).toBeGreaterThanOrEqual(2);

      for (const [offset, color] of gradient.values) {
        expect(typeof offset).toBe('number');
        expect(offset).toBeGreaterThanOrEqual(0);
        expect(offset).toBeLessThanOrEqual(1);
        expect(color).toMatch(/^#[0-9a-f]{6}$/i);
      }
    }
  });

  it('are identical across light and dark mode (theme-agnostic)', () => {
    expect(buildTheme('teal', 'dark').gradients).toBe(
      buildTheme('teal', 'light').gradients,
    );
  });
});
