import { useMemo } from 'react';
import { View } from 'react-native';

import { useHaptics } from '../hooks/use-haptics';
import { formatCompactNumber } from '../locale/format-number';
import { useBloomLocale } from '../locale/context';
import { interactiveWebCss, useInteractiveWebCss } from '../styles/interactive-web-css';
import { useTheme } from '../theme/use-theme';
import { ENGAGEMENT_ACTION_SELECTOR } from './constants';
import { EngagementBarContext, type EngagementBarContextValue } from './context';
import { WASH_VAR, resolveEngagementPaint } from './paint';
import type { EngagementBarProps } from './types';

const STYLE_ID = 'bloom-engagement-action-web-css';

/**
 * Hover and focus for the web, in ONE adopted sheet for every action on the
 * page. The ring reads `--bloom-engagement-action-ring`, which the bar sets
 * inline. Hover is the same tint a press paints inline; an action's colours are
 * inline style, so the sheet re-declares none of them. A disabled action dims
 * inline (so native dims too), which is why the sheet's own opacity is off.
 */
const ENGAGEMENT_ACTION_CSS = interactiveWebCss({
  selector: ENGAGEMENT_ACTION_SELECTOR,
  varPrefix: 'bloom-engagement-action',
  reset: 'none',
  transition: 'background-color 150ms ease',
  hover: { declarations: `background-color: var(${WASH_VAR});` },
  disabled: { opacity: null },
  extraRules: `@media (prefers-reduced-motion: reduce) {
${ENGAGEMENT_ACTION_SELECTOR} { transition: none; }
}`,
});

/**
 * A post's action bar: a row of `EngagementAction`s with an optional trailing
 * group pushed to the far edge.
 *
 * The bar resolves paint, the count format and haptics ONCE and hands them to
 * its actions through one context, because a feed mounts one bar per row and
 * every per-action subscription is paid on every row of a fling.
 */
export function EngagementBar({
  children,
  trailing,
  formatCount,
  locale,
  haptics = true,
  style,
  testID,
}: EngagementBarProps) {
  const theme = useTheme();
  const impact = useHaptics();
  const resolvedLocale = useBloomLocale(locale);
  useInteractiveWebCss(STYLE_ID, ENGAGEMENT_ACTION_CSS);

  const value = useMemo<EngagementBarContextValue>(
    () => ({
      paint: resolveEngagementPaint(theme.colors),
      formatCount: formatCount ?? ((count) => formatCompactNumber(count, resolvedLocale)),
      haptic: haptics ? impact : () => undefined,
    }),
    [theme.colors, formatCount, resolvedLocale, haptics, impact],
  );

  return (
    <EngagementBarContext.Provider value={value}>
      <View style={[value.paint.bar, style]} testID={testID}>
        {children}
        {trailing ? <View style={TRAILING}>{trailing}</View> : null}
      </View>
    </EngagementBarContext.Provider>
  );
}

/** Fills what the leading actions leave and packs its own at the far edge, in either direction. */
const TRAILING = {
  flex: 1,
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'flex-end',
} as const;
