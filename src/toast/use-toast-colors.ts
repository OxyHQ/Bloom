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
 * An ABSENT variant is a first-class case: a plain `toast('Saved')` renders the
 * neutral surface. It must never fall back to `info`.
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
 * Bloom's token set has `*Subtle` / `*SubtleForeground` pairs for the primary and
 * negative roles only, so `success` and `error` get a tinted surface while
 * `warning` / `info` / `loading` keep the neutral surface and tint only the icon.
 * `richColors` additionally lifts the border and title of those variants to the
 * variant colour — it never invents a surface token that does not exist.
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

  const neutral: ToastColors = {
    surface: colors.backgroundSecondary,
    border: colors.border,
    title: colors.text,
    description: colors.textSecondary,
    icon: colors.textSecondary,
    closeButton: colors.textSecondary,
    action: neutralAction,
    cancelText: colors.textSecondary,
  };

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
      return {
        ...neutral,
        icon: colors.warning,
        border: richColors ? colors.warning : neutral.border,
        title: richColors ? colors.warning : neutral.title,
      };
    case 'info':
      return {
        ...neutral,
        icon: colors.info,
        border: richColors ? colors.info : neutral.border,
        title: richColors ? colors.info : neutral.title,
      };
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
