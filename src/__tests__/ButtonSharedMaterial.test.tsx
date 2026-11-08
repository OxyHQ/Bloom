import React from 'react';
import { render } from '@testing-library/react-native';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { useTheme } from '../theme/use-theme';
import { resolveCanonicalButtonPalette } from '../button/shared';

describe.each(['light', 'dark'] as const)('%s shared Button material', (mode) => {
  it('keeps the standalone outline foreground in every state without painting a second material', () => {
    function Probe() {
      const theme = useTheme();
      const standalone = resolveCanonicalButtonPalette('outline', theme, 'neutral');
      const shared = resolveCanonicalButtonPalette(
        'outline',
        theme,
        'neutral',
        undefined,
        undefined,
        'shared',
      );
      for (const state of ['rest', 'hover', 'active', 'disabled'] as const) {
        expect(shared[state].foreground).toBe(standalone[state].foreground);
        expect(shared[state].surface).toBe(false);
        expect(shared[state].gradient).toBeNull();
      }
      expect(shared.rest.background).toBe('transparent');
      expect(shared.hover.background).not.toBe(shared.rest.background);
      expect(shared.active.background).not.toBe(shared.hover.background);
      expect(shared.shadow).toBe(false);
      expect(shared.borderWidth).toBe(0);
      expect(resolveCanonicalButtonPalette('plain', theme, 'neutral').rest.foreground).toBe(
        theme.colors.textSecondary,
      );
      return null;
    }
    render(
      <BloomThemeProvider mode={mode} colorPreset="teal" fonts={false}>
        <Probe />
      </BloomThemeProvider>,
    );
  });
  it('preserves explicit plain interaction pairs without changing transparent/default delegation', () => {
    function Probe() {
      const theme = useTheme();
      const pair = { background: 'rgba(143, 31, 92, 0.18)', foreground: 'rgb(72, 13, 47)' };
      for (const material of ['surface', 'flat', 'shared'] as const) {
        const explicit = resolveCanonicalButtonPalette(
          'plain',
          theme,
          'accent',
          pair,
          undefined,
          material,
        );
        expect(explicit.rest.background).toBe('transparent');
        for (const state of ['rest', 'hover', 'active'] as const) {
          expect(explicit[state].foreground).toBe(pair.foreground);
          expect(explicit[state].surface).toBe(false);
        }
        expect(explicit.hover.background).toBe(pair.background);
        expect(explicit.active.background).toBe(pair.background);
        const delegated = resolveCanonicalButtonPalette(
          'plain',
          theme,
          'neutral',
          undefined,
          undefined,
          material,
        );
        const transparent = resolveCanonicalButtonPalette(
          'plain',
          theme,
          'neutral',
          { background: 'transparent', foreground: pair.foreground },
          undefined,
          material,
        );
        expect(transparent.hover.background).toBe(delegated.hover.background);
        expect(transparent.active.background).toBe(delegated.active.background);
      }
      return null;
    }
    render(
      <BloomThemeProvider mode={mode} colorPreset="teal" fonts={false}>
        <Probe />
      </BloomThemeProvider>,
    );
  });
});
