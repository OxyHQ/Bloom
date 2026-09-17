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

const colorsFor = (
  variant: ToastVariant | undefined,
  richColors = false,
) =>
  renderHook(() => useToastColors({ variant, richColors }), { wrapper }).result
    .current;

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
  describe('by default (richColors off)', () => {
    it('paints an identical neutral surface for every variant', () => {
      const baseline = colorsFor(undefined);

      for (const variant of ALL) {
        const colors = colorsFor(variant);
        for (const key of ['surface', 'border', 'shadow', 'title', 'description', 'closeButton'] as const) {
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

    it('never emits a brand token anywhere, for any variant or prop value', () => {
      const brand = [
        tokens.primarySubtle,
        tokens.primarySubtleForeground,
        tokens.negativeSubtle,
        tokens.negativeSubtleForeground,
        tokens.negative,
        tokens.primary,
      ];
      for (const variant of ALL) {
        for (const rich of [false, true]) {
          const emitted = Object.values(colorsFor(variant, rich));
          expect({
            variant,
            rich,
            brandLeaks: emitted.filter((value) => brand.includes(value)),
          }).toEqual({ variant, rich, brandLeaks: [] });
        }
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

  describe('with richColors', () => {
    /** The four variants that carry a status colour. */
    const STATUS: ToastVariant[] = ['success', 'error', 'warning', 'info'];

    it('never tints the surface — that is the whole point of the prop', () => {
      for (const variant of ALL) {
        expect({ variant, surface: colorsFor(variant, true).surface }).toEqual({
          variant,
          surface: card.surface,
        });
      }
    });

    it.each(STATUS)('lifts border and title to the status glyph colour: %s', (variant) => {
      const colors = colorsFor(variant, true);
      expect(colors.border).toBe(colors.icon);
      expect(colors.title).toBe(colors.icon);
    });

    it.each(STATUS)('keeps the disc identical with the prop on: %s', (variant) => {
      expect(colorsFor(variant, true).icon).toBe(colorsFor(variant).icon);
      expect(colorsFor(variant, true).iconBackground).toBe(colorsFor(variant).iconBackground);
    });

    it.each(STATUS)('leaves description and close button neutral: %s', (variant) => {
      const rich = colorsFor(variant, true);
      const plain = colorsFor(variant);
      expect(rich.description).toBe(plain.description);
      expect(rich.closeButton).toBe(plain.closeButton);
    });

    it('leaves a variant-less and a loading toast completely untouched', () => {
      expect(colorsFor(undefined, true)).toEqual(colorsFor(undefined));
      expect(colorsFor('loading', true)).toEqual(colorsFor('loading'));
    });

    it('is still visibly different from the default for every status variant', () => {
      for (const variant of STATUS) {
        const rich = colorsFor(variant, true);
        const plain = colorsFor(variant);
        expect({ variant, changed: rich.border !== plain.border && rich.title !== plain.title }).toEqual({
          variant,
          changed: true,
        });
      }
    });
  });
});
