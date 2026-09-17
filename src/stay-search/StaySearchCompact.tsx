import React, { memo, useEffect, useMemo } from 'react';
import { Pressable, View } from 'react-native';

import { Button } from '../button';
import { resolveButtonRamps } from '../button/shared';
import { useInteractionState } from '../hooks/use-interaction-state';
import { RiEqualizer3Line } from '../icons/remix/RiEqualizer3Line';
import { RiSearchLine } from '../icons/remix/RiSearchLine';
import { adoptStyleSheet } from '../styles/adopt-style-sheet';
import { borderRadius } from '../styles/tokens';
import type { WebCssStyle } from '../styles/web-view-style';
import { webDataSet } from '../styles/web-data';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { STAY_SEARCH_COMPACT_HEIGHT } from './constants';
import { useStaySearchPalette } from './palette';
import type { StaySearchCompactProps } from './types';

/**
 * The narrow-screen search trigger: a full-width pill (56 tall, hairline, the
 * bar's soft shadow) with a search glyph, a bold title over a secondary summary
 * line, and an optional round filter button at the right end. Pressing the pill
 * opens the app's search flow (usually a `Dialog` of `StaySearchStep`s); hover
 * and press are a fill change only.
 *
 * The pill's pressable area and the filter button are SIBLINGS, never nested,
 * so each is its own named control.
 */

const STYLE_ID = 'bloom-stay-search-compact-web-css';
const CSS = `
[data-bloom-stay-compact] {
  outline: none;
}
[data-bloom-stay-compact]:focus-visible {
  box-shadow: inset 0 0 0 2px var(--bloom-stay-compact-ring, currentColor);
}
`;

function StaySearchCompactComponent({
  onPress,
  title = 'Where to?',
  summary,
  onFilterPress,
  filterLabel = 'Filters',
  filterIcon = RiEqualizer3Line,
  accessibilityLabel,
  style,
  testID,
}: StaySearchCompactProps) {
  const theme = useTheme();
  const palette = useStaySearchPalette();
  const { accent } = useMemo(() => resolveButtonRamps(theme), [theme]);
  const hover = useInteractionState();
  const press = useInteractionState();

  useEffect(() => {
    adoptStyleSheet(STYLE_ID, CSS);
  }, []);

  const pill: WebCssStyle = {
    height: STAY_SEARCH_COMPACT_HEIGHT,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: press.state || hover.state ? palette.segmentHover : palette.barSurface,
    boxShadow: palette.barShadow,
    flexDirection: 'row',
    alignItems: 'center',
  };
  const hit: WebCssStyle = {
    flex: 1,
    minWidth: 0,
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingLeft: 20,
    paddingRight: onFilterPress ? 8 : 20,
    borderRadius: borderRadius.full,
    '--bloom-stay-compact-ring': accent[500],
  };

  return (
    <View style={[pill, style]}>
      <Pressable
        {...webDataSet({ bloomStayCompact: '' })}
        onPress={onPress}
        onHoverIn={hover.onIn}
        onHoverOut={hover.onOut}
        onPressIn={press.onIn}
        onPressOut={press.onOut}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? (summary ? `${title}, ${summary}` : title)}
        testID={testID}
        style={hit}
      >
        <RiSearchLine width={20} height={20} fill={palette.text} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text variant="body-semibold" numberOfLines={1} style={{ color: palette.text }}>
            {title}
          </Text>
          {summary ? (
            <Text variant="caption-1-regular" numberOfLines={1} style={{ color: palette.textSecondary }}>
              {summary}
            </Text>
          ) : null}
        </View>
      </Pressable>
      {onFilterPress ? (
        <Button
          variant="secondary"
          size="medium"
          iconOnly
          icon={filterIcon}
          onPress={onFilterPress}
          accessibilityLabel={filterLabel}
          testID={testID ? `${testID}-filter` : undefined}
          style={{ marginRight: 9, flexShrink: 0 }}
        />
      ) : null}
    </View>
  );
}

export const StaySearchCompact = memo(StaySearchCompactComponent);
StaySearchCompact.displayName = 'StaySearchCompact';
