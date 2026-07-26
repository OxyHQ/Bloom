/**
 * Replaces sonner-native v0.26.4's `src/use-colors.ts` + `src/use-default-styles.ts`
 * (MIT © Gunnar Torfi Steinarsson — see the top-level NOTICE) and absorbs the
 * colour logic from Bloom's previous `Toast.tsx`.
 *
 * Upstream ships two hardcoded light/dark palettes and picks between them from
 * `useColorScheme()`. Bloom has exactly one source of colour — `useTheme()` from
 * `BloomThemeProvider` — so the palettes are gone and `ToasterProps.theme` /
 * `invert` are documented no-ops (light/dark and per-subtree recolouring are
 * `BloomThemeProvider` / `BloomColorScope` concerns).
 *
 * SURFACES ARE NEUTRAL; ONLY THE ICON CARRIES THE VARIANT. Every variant renders
 * the same `backgroundSecondary` surface with the same `border`, `text` and
 * `textSecondary` roles — exactly like sonner. A tinted surface is what the
 * opt-in `richColors` prop is for, and nothing else should reach for a `*Subtle`
 * token.
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
 * The variant NEVER tints the surface by default — only the leading icon. That is
 * how sonner, sonner-native and every comparable library behave, and it is what
 * `richColors` exists to opt out of: a plain `toast.success('Saved')` must read as
 * a normal toast with a green check, not as a full brand-coloured card.
 *
 * `success` / `error` / `warning` / `info` are first-class theme tokens
 * (`ThemeColors`), so the icon uses them directly. Reaching for
 * `primarySubtle` / `negativeSubtle` here is what made success render brand
 * purple instead of green.
 */
function variantIconColor(
  variant: ToastVariant | undefined,
  colors: ThemeColors,
): string {
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
      return colors.textSecondary;
  }
}

/**
 * `richColors` is the opt-in tinted treatment. Bloom's token set has
 * `*Subtle` / `*SubtleForeground` pairs for the primary and negative roles only,
 * so `success` and `error` get a tinted surface while `warning` / `info` can only
 * lift their border and title to the variant colour — this never invents a
 * surface token that does not exist.
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
  const neutralAction: ToastActionColors = {
    background: colors.backgroundTertiary,
    text: colors.textSecondary,
    pressedBackground: colors.contrast50,
    pressedText: colors.text,
  };

  // The default for EVERY variant. Only `icon` differs, so the action button
  // cannot pick up a brand-tinted pressed state on a neutral card either.
  const neutral: ToastColors = {
    surface: colors.backgroundSecondary,
    border: colors.border,
    title: colors.text,
    description: colors.textSecondary,
    icon: variantIconColor(variant, colors),
    closeButton: colors.textSecondary,
    action: neutralAction,
    cancelText: colors.textSecondary,
  };

  if (!richColors) {
    return neutral;
  }

  switch (variant) {
    case 'success':
      return {
        surface: colors.primarySubtle,
        border: colors.primary,
        title: colors.primarySubtleForeground,
        description: colors.primarySubtleForeground,
        icon: colors.primarySubtleForeground,
        closeButton: colors.primarySubtleForeground,
        action: {
          background: colors.primarySubtle,
          text: colors.primarySubtleForeground,
          pressedBackground: colors.primaryLight,
          pressedText: colors.primaryDark,
        },
        cancelText: colors.primarySubtleForeground,
      };
    case 'error':
      return {
        surface: colors.negativeSubtle,
        border: colors.negative,
        title: colors.negativeSubtleForeground,
        description: colors.negativeSubtleForeground,
        icon: colors.negativeSubtleForeground,
        closeButton: colors.negativeSubtleForeground,
        action: {
          background: colors.negativeSubtle,
          text: colors.negativeSubtleForeground,
          pressedBackground: colors.negative,
          pressedText: colors.negativeForeground,
        },
        cancelText: colors.negativeSubtleForeground,
      };
    case 'warning':
      return { ...neutral, border: colors.warning, title: colors.warning };
    case 'info':
      return { ...neutral, border: colors.info, title: colors.info };
    case 'loading':
    case undefined:
      return neutral;
  }
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
