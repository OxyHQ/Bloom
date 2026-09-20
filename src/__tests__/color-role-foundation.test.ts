/** @jest-environment node */
import { resolveBloomColors } from '../appearance/colors';
import { resolveButtonPalette } from '../button/shared';
import { buildTheme } from '../theme/build-theme';
import { buildThemeFromSeed } from '../theme/build-theme-from-seed';
import { APP_COLOR_NAMES } from '../theme/color-presets';
import { getResolvedTokens } from '../theme/token-registry';

const roles = [['support', 'secondary'], ['action', 'tertiary']] as const;

it('uses exact semantic paired fills for new button roles across every preset and mode', () => {
  for (const preset of APP_COLOR_NAMES) for (const mode of ['light', 'dark'] as const) {
    const theme = buildTheme(preset, mode);
    const tokens = getResolvedTokens(preset, mode);
    for (const [tone, role] of roles) {
      const button = resolveButtonPalette('solid', theme, tone);
      expect(button.rest.background).toBe(tokens[`--${role}`]);
      expect(button.rest.foreground).toBe(tokens[`--${role}-foreground`]);
      expect(button.rest.gradient).toBeNull();
      expect(button.hover).toEqual(button.rest);
      expect(button.active).toEqual(button.rest);
      expect(button.ring).toBe(tokens[`--${role}`]);
      const subtle = resolveBloomColors(theme.colors, tone, 'subtle');
      expect(subtle.background).toBe(tokens[`--${role}-subtle`]);
      expect(subtle.foreground).toBe(tokens[`--${role}-text`]);
      expect(resolveBloomColors(theme.colors, tone, 'outline').foreground).toBe(subtle.foreground);
      expect(resolveBloomColors(theme.colors, tone, 'plain').border).toBe('transparent');
    }
  }
});

it('seed themes expose the same support/action pairs to shared consumers', () => {
  for (const mode of ['light', 'dark'] as const) {
    const theme = buildThemeFromSeed('#315da8', mode);
    for (const [tone, role] of roles) {
      expect(resolveBloomColors(theme.colors, tone, 'solid')).toMatchObject({ background: theme.colors[role], foreground: theme.colors[`${role}Foreground`] });
      expect(resolveBloomColors(theme.colors, tone, 'subtle')).toMatchObject({ background: theme.colors[`${role}Subtle`], foreground: theme.colors[`${role}SubtleForeground`] });
    }
  }
});

it('keeps the existing accent gradient and default role unchanged', () => {
  const theme = buildTheme('oxy', 'light');
  expect(resolveButtonPalette('solid', theme).rest.gradient).not.toBeNull();
  expect(resolveBloomColors(theme.colors, 'accent', 'solid').background).toBe(theme.colors.primary);
});
