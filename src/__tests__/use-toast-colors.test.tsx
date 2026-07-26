import React from 'react';
import { renderHook } from '@testing-library/react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { buildTheme } from '../theme/build-theme';
import { useToastColors } from '../toast/use-toast-colors';
import type { ToastVariant } from '../toast/types';

const MODE = 'light';
const PRESET = 'oxy';
const tokens = buildTheme(PRESET, MODE).colors;

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
        expect({ variant, surface: colors.surface }).toEqual({
          variant,
          surface: baseline.surface,
        });
        expect({ variant, border: colors.border }).toEqual({
          variant,
          border: baseline.border,
        });
        expect({ variant, title: colors.title }).toEqual({
          variant,
          title: baseline.title,
        });
        expect({ variant, description: colors.description }).toEqual({
          variant,
          description: baseline.description,
        });
        expect({ variant, closeButton: colors.closeButton }).toEqual({
          variant,
          closeButton: baseline.closeButton,
        });
      }
    });

    it('uses the theme surface roles, never a brand *Subtle tint', () => {
      const colors = colorsFor('success');
      expect(colors.surface).toBe(tokens.backgroundSecondary);
      expect(colors.border).toBe(tokens.border);
      expect(colors.title).toBe(tokens.text);
      expect(colors.description).toBe(tokens.textSecondary);
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
          const { action, ...flat } = colorsFor(variant, rich);
          const emitted = [...Object.values(flat), ...Object.values(action)];
          expect({
            variant,
            rich,
            brandLeaks: emitted.filter((value) => brand.includes(value)),
          }).toEqual({ variant, rich, brandLeaks: [] });
        }
      }
    });

    it.each<[ToastVariant | undefined, keyof typeof tokens]>([
      ['success', 'success'],
      ['error', 'error'],
      ['warning', 'warning'],
      ['info', 'info'],
      ['loading', 'textSecondary'],
      [undefined, 'textSecondary'],
    ])('tints only the icon: %s -> colors.%s', (variant, token) => {
      expect(colorsFor(variant).icon).toBe(tokens[token]);
    });

    it('keeps the action button neutral for every variant', () => {
      const baseline = colorsFor(undefined).action;
      expect(baseline.background).toBe(tokens.backgroundTertiary);
      expect(baseline.pressedBackground).toBe(tokens.contrast50);

      for (const variant of ALL) {
        expect({ variant, action: colorsFor(variant).action }).toEqual({
          variant,
          action: baseline,
        });
      }
    });
  });

  describe('with richColors', () => {
    /** The four variants that carry a status colour. */
    const STATUS: Array<[ToastVariant, keyof typeof tokens]> = [
      ['success', 'success'],
      ['error', 'error'],
      ['warning', 'warning'],
      ['info', 'info'],
    ];

    it('never tints the surface — that is the whole point of the prop', () => {
      for (const variant of ALL) {
        expect({ variant, surface: colorsFor(variant, true).surface }).toEqual({
          variant,
          surface: tokens.backgroundSecondary,
        });
      }
    });

    it.each(STATUS)(
      'lifts border, title and icon to the status colour: %s',
      (variant, token) => {
        const colors = colorsFor(variant, true);
        expect(colors.border).toBe(tokens[token]);
        expect(colors.title).toBe(tokens[token]);
        expect(colors.icon).toBe(tokens[token]);
      },
    );

    it.each(STATUS)(
      'never reaches for a brand token, so the %s icon keeps its hue with the prop on',
      (variant) => {
        expect(colorsFor(variant, true).icon).toBe(colorsFor(variant).icon);
      },
    );

    it.each(STATUS)(
      'leaves description, close button and actions neutral: %s',
      (variant) => {
        const rich = colorsFor(variant, true);
        const plain = colorsFor(variant);
        expect(rich.description).toBe(plain.description);
        expect(rich.closeButton).toBe(plain.closeButton);
        expect(rich.cancelText).toBe(plain.cancelText);
        expect(rich.action).toEqual(plain.action);
      },
    );

    it('leaves a variant-less and a loading toast completely untouched', () => {
      expect(colorsFor(undefined, true)).toEqual(colorsFor(undefined));
      expect(colorsFor('loading', true)).toEqual(colorsFor('loading'));
    });

    it('is still visibly different from the default for every status variant', () => {
      for (const [variant] of STATUS) {
        const rich = colorsFor(variant, true);
        const plain = colorsFor(variant);
        expect({ variant, changed: rich.border !== plain.border }).toEqual({
          variant,
          changed: true,
        });
        expect({ variant, changed: rich.title !== plain.title }).toEqual({
          variant,
          changed: true,
        });
      }
    });
  });
});
