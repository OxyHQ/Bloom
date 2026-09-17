/**
 * Replaces sonner-native v0.26.4's `src/icons.tsx` (MIT © Gunnar Torfi
 * Steinarsson), which ships its own inline SVG paths
 * and imports `react-native-svg` directly. Bloom maps variants onto its own icon
 * set instead — the notification glyphs, drawn inside the card's 40px status
 * disc by `ToastContent`.
 *
 * The spinner is RN's `ActivityIndicator` rather than Bloom's `Loading`: the
 * `./loading` subpath is web-forked, so importing it from this universal file
 * would resolve to the native (Reanimated) build under bundlers that do not
 * apply `.web` extension resolution, and to the web build under those that do —
 * platform-dependent behaviour from one import. `ActivityIndicator` is universal
 * (react-native-web renders a CSS-animated SVG, so nothing depends on a
 * Reanimated mapper ticking on web) and a consumer who wants Bloom's spinner can
 * still pass `icons={{ loading: <Loading … /> }}` on the outlet.
 */
import { ActivityIndicator } from 'react-native';

import { NOTIFICATION_GEOMETRY } from '../notification/shared';
import { RiAlertFill } from '../icons/remix/RiAlertFill';
import { RiCheckboxCircleFill } from '../icons/remix/RiCheckboxCircleFill';
import { RiErrorWarningFill } from '../icons/remix/RiErrorWarningFill';
import { RiInformationFill } from '../icons/remix/RiInformationFill';
import type { ToastVariant } from './types';

/**
 * The notification status glyphs (Remix fill icons, 20px). `warning` has
 * no dedicated status glyph; it takes Remix's `alert-fill`.
 */
const ICON_MAP = {
  success: RiCheckboxCircleFill,
  error: RiErrorWarningFill,
  warning: RiAlertFill,
  info: RiInformationFill,
} as const satisfies Record<Exclude<ToastVariant, 'loading'>, unknown>;

export function ToastIcon({
  variant,
  color,
}: {
  variant: ToastVariant | undefined;
  color: string;
}) {
  // No variant means a neutral toast, which carries no icon of its own — a
  // caller who wants one passes `icon`.
  if (!variant) {
    return null;
  }

  if (variant === 'loading') {
    return <ActivityIndicator size="small" color={color} />;
  }

  const Icon = ICON_MAP[variant];
  return <Icon width={NOTIFICATION_GEOMETRY.icon} height={NOTIFICATION_GEOMETRY.icon} fill={color} />;
}

ToastIcon.displayName = 'ToastIcon';
