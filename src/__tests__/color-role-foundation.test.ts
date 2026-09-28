/** @jest-environment node */
import { resolveBloomColors } from '../appearance/colors';
import { resolveButtonPalette } from '../button/shared';
import { relativeLuminance } from '../styles/color-contrast';
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
      for (const state of [button.rest, button.hover, button.active]) {
        expect(state.foreground).toBe(tokens[`--${role}-foreground`]);
        expect(state.surface).toBe(true);
        expect(state.gradient).toBeNull();
        expect(state.border).toBe('rgba(0, 0, 0, 0)');
      }
      // Hover lightens and press darkens the paired fill; compare painted color,
      // not CSS spelling, to catch accidentally frozen interaction states.
      expect(relativeLuminance(button.hover.background)).toBeGreaterThan(relativeLuminance(button.active.background)!);
      expect(button.disabled.surface).toBe(true);
      expect(button.disabled.foreground).toBe(theme.colors.textTertiary);
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

it('keeps accent as the default paired role with shared Surface optics', () => {
  const theme = buildTheme('oxy', 'light');
  expect(resolveButtonPalette('solid', theme).rest).toMatchObject({ background: theme.colors.primary, foreground: theme.colors.primaryForeground, gradient: null, surface: true });
  expect(resolveBloomColors(theme.colors, 'accent', 'solid').background).toBe(theme.colors.primary);
});
