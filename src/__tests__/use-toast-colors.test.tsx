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

    it('uses the theme surface roles, never a *Subtle tint', () => {
      const colors = colorsFor('success');
      expect(colors.surface).toBe(tokens.backgroundSecondary);
      expect(colors.border).toBe(tokens.border);
      expect(colors.title).toBe(tokens.text);
      expect(colors.description).toBe(tokens.textSecondary);
      expect(colors.surface).not.toBe(tokens.primarySubtle);
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
    it('tints the surface for success and error', () => {
      expect(colorsFor('success', true).surface).toBe(tokens.primarySubtle);
      expect(colorsFor('error', true).surface).toBe(tokens.negativeSubtle);
    });

    it('lifts only border and title for warning and info, which have no subtle pair', () => {
      const warning = colorsFor('warning', true);
      expect(warning.surface).toBe(tokens.backgroundSecondary);
      expect(warning.border).toBe(tokens.warning);
      expect(warning.title).toBe(tokens.warning);

      const info = colorsFor('info', true);
      expect(info.surface).toBe(tokens.backgroundSecondary);
      expect(info.border).toBe(tokens.info);
      expect(info.title).toBe(tokens.info);
    });

    it('leaves a variant-less and a loading toast untouched', () => {
      expect(colorsFor(undefined, true)).toEqual(colorsFor(undefined));
      expect(colorsFor('loading', true)).toEqual(colorsFor('loading'));
    });

    it('visibly differs from the default for success', () => {
      expect(colorsFor('success', true).surface).not.toBe(
        colorsFor('success').surface,
      );
    });
  });
});
