import React from 'react';
import { renderHook } from '@testing-library/react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { buildTheme } from '../theme/build-theme';
import { useToastColors } from '../toast/use-toast-colors';
import type { ToastVariant } from '../toast/types';
import { resolveNotificationPaint } from '../notification/shared';

const MODE = 'light';
const PRESET = 'oxy';
const theme = buildTheme(PRESET, MODE);
const tokens = theme.colors;
const card = resolveNotificationPaint(theme);

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <BloomThemeProvider mode={MODE} colorPreset={PRESET}>
    {children}
  </BloomThemeProvider>
);

const colorsFor = (variant: ToastVariant | undefined) =>
  renderHook(() => useToastColors({ variant }), { wrapper }).result.current;

/** Every variant plus the absent one — the full key space of the resolver. */
const ALL: Array<ToastVariant | undefined> = [
  undefined,
  'success',
  'error',
  'warning',
  'info',
  'loading',
];

describe('useToastColors', () => {
  describe('surface and status disc', () => {
    it('paints an identical neutral surface for every variant', () => {
      const baseline = colorsFor(undefined);

      for (const variant of ALL) {
        const colors = colorsFor(variant);
        for (const key of [
          'surface',
          'border',
          'shadow',
          'title',
          'description',
          'closeButton',
        ] as const) {
          expect({ variant, key, value: colors[key] }).toEqual({
            variant,
            key,
            value: baseline[key],
          });
        }
      }
    });

    it('uses the notification card, never a brand *Subtle tint', () => {
      const colors = colorsFor('success');
      expect(colors.surface).toBe(card.surface);
      expect(colors.border).toBe(card.border);
      expect(colors.title).toBe(tokens.text);
      expect(colors.description).toBe(card.description);
      expect(colors.shadow).toBe(card.shadow);
      expect(colors.surface).not.toBe(tokens.primarySubtle);
    });

    it('never emits a primary brand token, for any variant or prop value', () => {
      const brand = [
        tokens.primarySubtle,
        tokens.primarySubtleForeground,
        // negative* aliases the semantic error pair; equal colors there are
        // correct for error toasts, not evidence of a brand leak.
        tokens.primary,
      ];
      for (const variant of ALL) {
        const emitted = Object.values(colorsFor(variant));
        expect({
          variant,
          brandLeaks: emitted.filter((value) => brand.includes(value)),
        }).toEqual({ variant, brandLeaks: [] });
      }
    });

    it.each<[ToastVariant | undefined, keyof typeof card.status]>([
      ['success', 'success'],
      ['error', 'error'],
      ['warning', 'warning'],
      ['info', 'information'],
      ['loading', 'neutral'],
      [undefined, 'neutral'],
    ])('tints only the status disc: %s -> %s', (variant, status) => {
      const colors = colorsFor(variant);
      expect(colors.icon).toBe(card.status[status].foreground);
      expect(colors.iconBackground).toBe(card.status[status].background);
    });

    it('gives every status variant a disc of its own hue', () => {
      const discs = (['success', 'error', 'warning', 'info'] as const).map(
        (variant) => colorsFor(variant).iconBackground,
      );
      expect(new Set(discs).size).toBe(4);
    });
  });
});
