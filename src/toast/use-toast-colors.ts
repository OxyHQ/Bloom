/**
 * Replaces sonner-native v0.26.4's `src/use-colors.ts` + `src/use-default-styles.ts`
 * (MIT © Gunnar Torfi Steinarsson) and absorbs the
 * colour logic from Bloom's previous `Toast.tsx`.
 *
 * Upstream ships two hardcoded light/dark palettes and picks between them from
 * `useColorScheme()`. Bloom has exactly one source of colour — `useTheme()` from
 * `BloomThemeProvider` — so the palettes are gone and `ToasterProps.theme` /
 * `invert` are documented no-ops (light/dark and per-subtree recolouring are
 * `BloomThemeProvider` / `BloomColorScope` concerns).
 *
 * THE SURFACE IS ALWAYS NEUTRAL — `backgroundSecondary` with the `border`, `text`
 * and `textSecondary` roles, for every variant, with `richColors` on or off. The
 * variant only ever colours the leading ICON, and `richColors` only ever widens
 * that to the border and title as well. Exactly like sonner.
 *
 * NOTHING HERE MAY REACH FOR A BRAND TOKEN. `success` / `error` / `warning` /
 * `info` are STATUS colours; `primarySubtle` / `negativeSubtle` are BRAND pairs.
 * Mixing the families is what made `toast.success('Saved')` render as a
 * brand-purple card, and what made a success icon flip from green to purple when
 * `richColors` was switched on. `richColors` means "show the status colour more
 * prominently", never "switch to the brand palette".
 *
 * That family now EXISTS — `successSubtle` / `errorSubtle` / `warningSubtle` /
 * `infoSubtle`, each with its legible `*SubtleForeground` — so a tinted status
 * surface is finally expressible without faking one from a brand pair or a
 * derived alpha. The toast still does not take it: the neutral surface is the
 * sonner behaviour Bloom deliberately matches, and `richColors` means "show the
 * status colour more prominently", never "tint the card". Anything that DOES want
 * a tinted status surface (a status pill, chip or badge) reads the pair.
 *
 * An ABSENT variant is a first-class case: a plain `toast('Saved')` renders the
 * neutral surface with no variant icon at all. It must never fall back to `info`.
 */
import { useMemo } from 'react';

import { useTheme } from '../theme/use-theme';
import type { ThemeColors } from '../theme/types';
import type { ToastVariant } from './types';

export type ToastActionColors = {
  background: string;
  text: string;
  pressedBackground: string;
  pressedText: string;
};

export type ToastColors = {
  surface: string;
  border: string;
  title: string;
  description: string;
  icon: string;
  closeButton: string;
  action: ToastActionColors;
  cancelText: string;
};

/**
 * The variant's STATUS colour, or `undefined` for the variants that have none.
 * `loading` and an absent variant are deliberately in the second group: they carry
 * no status meaning, so `richColors` has nothing to make more prominent and both
 * stay fully neutral.
 */
function statusColor(
  variant: ToastVariant | undefined,
  colors: ThemeColors,
): string | undefined {
  switch (variant) {
    case 'success':
      return colors.success;
    case 'error':
      return colors.error;
    case 'warning':
      return colors.warning;
    case 'info':
      return colors.info;
    case 'loading':
    case undefined:
      return undefined;
  }
}

/**
 * `richColors` widens the status colour from the icon alone to the border and
 * title as well. It does NOT tint the surface, and it does not touch the
 * description, close button or action colours — those stay neutral so the row
 * still reads as a toast rather than a status banner.
 */
function resolveColors({
  variant,
  richColors,
  colors,
}: {
  variant: ToastVariant | undefined;
  richColors: boolean;
  colors: ThemeColors;
}): ToastColors {
  const status = statusColor(variant, colors);

  // The whole surface, for EVERY variant and both values of `richColors`. Because
  // the action colours live here, they can never pick up a variant tint either.
  const neutral: ToastColors = {
    surface: colors.backgroundSecondary,
    border: colors.border,
    title: colors.text,
    description: colors.textSecondary,
    icon: status ?? colors.textSecondary,
    closeButton: colors.textSecondary,
    action: {
      background: colors.backgroundTertiary,
      text: colors.textSecondary,
      pressedBackground: colors.contrast50,
      pressedText: colors.text,
    },
    cancelText: colors.textSecondary,
  };

  if (!richColors || status === undefined) {
    return neutral;
  }
  return { ...neutral, border: status, title: status };
}

export function useToastColors({
  variant,
  richColors,
}: {
  variant: ToastVariant | undefined;
  richColors: boolean;
}): ToastColors {
  const { colors } = useTheme();
  return useMemo(
    () => resolveColors({ variant, richColors, colors }),
    [variant, richColors, colors],
  );
}
