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
 * THE SURFACE IS ALWAYS NEUTRAL — the notification card (`notification/
 * shared.ts`: card surface, border/button/default, text/primary, text/secondary),
 * for every variant, with `richColors` on or off. The variant only ever colours
 * the leading STATUS DISC (tinted background + glyph), and `richColors` only ever
 * widens the glyph colour to the border and title as well. Exactly like sonner.
 *
 * NOTHING HERE MAY REACH FOR A BRAND TOKEN. `success` / `error` / `warning` /
 * `info` are STATUS colours; `primarySubtle` is the BRAND pair; `negativeSubtle` aliases error.
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

import { resolveCloseButtonPaint } from '../button/shared';
import { resolveNotificationPaint } from '../notification/shared';
import type { NotificationStatus } from '../notification/types';
import { useTheme } from '../theme/use-theme';
import type { Theme } from '../theme/types';
import type { ToastVariant } from './types';

export type ToastColors = {
  surface: string;
  border: string;
  shadow: string;
  title: string;
  description: string;
  /** The leading glyph (or spinner). */
  icon: string;
  /** The 40px disc behind it. */
  iconBackground: string;
  closeButton: string;
};

/**
 * The variant's STATUS disc, or `undefined` for the variants that have none.
 * `loading` and an absent variant are deliberately in the second group: they carry
 * no status meaning, so `richColors` has nothing to make more prominent and both
 * stay fully neutral (`loading` still gets the neutral disc for its spinner).
 */
function statusOf(variant: ToastVariant | undefined): NotificationStatus | undefined {
  switch (variant) {
    case 'success':
      return 'success';
    case 'error':
      return 'error';
    case 'warning':
      return 'warning';
    case 'info':
      return 'information';
    case 'loading':
    case undefined:
      return undefined;
  }
}

/**
 * `richColors` widens the status colour from the disc alone to the border and
 * title as well. It does NOT tint the surface, and it does not touch the
 * description or close button — those stay neutral so the row still reads as a
 * toast rather than a status banner. Pure, so it can be walked over presets.
 */
export function resolveToastColors({
  variant,
  richColors,
  theme,
}: {
  variant: ToastVariant | undefined;
  richColors: boolean;
  theme: Theme;
}): ToastColors {
  const paint = resolveNotificationPaint(theme);
  const status = statusOf(variant);
  const disc = paint.status[status ?? 'neutral'];

  const neutral: ToastColors = {
    surface: paint.surface,
    border: paint.border,
    shadow: paint.shadow,
    title: paint.title,
    description: paint.description,
    icon: disc.foreground,
    iconBackground: disc.background,
    closeButton: resolveCloseButtonPaint(theme).foreground,
  };

  if (!richColors || status === undefined) {
    return neutral;
  }
  return { ...neutral, border: disc.foreground, title: disc.foreground };
}

export function useToastColors({
  variant,
  richColors,
}: {
  variant: ToastVariant | undefined;
  richColors: boolean;
}): ToastColors {
  const theme = useTheme();
  return useMemo(
    () => resolveToastColors({ variant, richColors, theme }),
    [variant, richColors, theme],
  );
}
