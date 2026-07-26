/**
 * Replaces sonner-native v0.26.4's `src/icons.tsx` (MIT © Gunnar Torfi
 * Steinarsson — see the top-level NOTICE), which ships its own inline SVG paths
 * and imports `react-native-svg` directly. Bloom maps variants onto its own icon
 * set instead, so the toast picks up icon changes with the rest of the library.
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

import { CircleCheck_Stroke2_Corner0_Rounded as CircleCheckIcon } from '../icons/CircleCheck';
import { CircleInfo_Stroke2_Corner0_Rounded as CircleInfoIcon } from '../icons/CircleInfo';
import { CircleX_Stroke2_Corner0_Rounded as CircleXIcon } from '../icons/CircleX';
import { Warning_Stroke2_Corner0_Rounded as WarningIcon } from '../icons/Warning';
import type { ToastVariant } from './types';

const ICON_MAP: Record<
  Exclude<ToastVariant, 'loading'>,
  typeof CircleCheckIcon
> = {
  success: CircleCheckIcon,
  error: CircleXIcon,
  warning: WarningIcon,
  info: CircleInfoIcon,
};

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
  return <Icon fill={color} size="md" />;
}

ToastIcon.displayName = 'ToastIcon';
