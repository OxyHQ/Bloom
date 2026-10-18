import React, { memo } from 'react';
import { View } from 'react-native';

import { Button } from '../button';
import { RiEqualizer3Line } from '../icons/remix/RiEqualizer3Line';
import { RiSearchLine } from '../icons/remix/RiSearchLine';
import { borderRadius } from '../styles/tokens';
import type { WebCssStyle } from '../styles/web-view-style';
import { Text } from '../typography';
import { useMessages } from '../locale/messages';
import { STAY_SEARCH_COMPACT_HEIGHT } from './constants';
import { STAY_SEARCH_MESSAGES } from './messages';
import { useStaySearchPalette } from './palette';
import type { StaySearchCompactProps } from './types';

/**
 * The narrow-screen search trigger: a full-width pill (56 tall, hairline, the
 * bar's soft shadow) with a search glyph, a bold title over a secondary summary
 * line, and an optional round filter button at the right end. Pressing the pill
 * opens the app's search flow (usually a `Dialog` of `StaySearchStep`s), using
 * Bloom's Button interaction.
 *
 * The pill's pressable area and the filter button are SIBLINGS, never nested,
 * so each is its own named control.
 */

function StaySearchCompactComponent({
  onPress,
  title: titleProp,
  summary,
  onFilterPress,
  filterLabel: filterLabelProp,
  filterIcon = RiEqualizer3Line,
  accessibilityLabel,
  style,
  testID,
}: StaySearchCompactProps) {
  const { messages } = useMessages(STAY_SEARCH_MESSAGES);
  const title = titleProp ?? messages.whereTo;
  const filterLabel = filterLabelProp ?? messages.filters;
  const palette = useStaySearchPalette();
  const pill: WebCssStyle = {
    height: STAY_SEARCH_COMPACT_HEIGHT,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.barSurface,
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
    height: 'auto',
    justifyContent: 'flex-start',
  };

  return (
    <View style={[pill, style]}>
      <Button
        appearance="plain"
        tone="neutral"
        material="flat"
        onPress={onPress}
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
            <Text
              variant="caption-1-regular"
              numberOfLines={1}
              style={{ color: palette.textSecondary }}
            >
              {summary}
            </Text>
          ) : null}
        </View>
      </Button>
      {onFilterPress ? (
        <Button
          size="md"
          iconOnly
          icon={filterIcon}
          onPress={onFilterPress}
          accessibilityLabel={filterLabel}
          testID={testID ? `${testID}-filter` : undefined}
          style={{ marginRight: 9, flexShrink: 0 }}
          tone="neutral"
          appearance="outline"
        />
      ) : null}
    </View>
  );
}

export const StaySearchCompact = memo(StaySearchCompactComponent);
StaySearchCompact.displayName = 'StaySearchCompact';
