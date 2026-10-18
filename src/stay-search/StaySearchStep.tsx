import React, { memo } from 'react';
import { View } from 'react-native';

import type { WebCssStyle } from '../styles/web-view-style';
import { Button } from '../button';
import { Text } from '../typography';
import { STAY_SEARCH_STEP_RADIUS } from './constants';
import { useStaySearchPalette } from './palette';
import type { StaySearchStepProps } from './types';

/**
 * One card of the narrow-screen search flow (Where / When / Who), one expanded
 * at a time — the app owns which.
 *
 * Collapsed: a 56-tall row, the label (body-medium, secondary) on the left and
 * the summary (body-semibold) on the right; a `button` with `aria-expanded`.
 * Expanded: the title (title-2-semibold, a header) over the children, 24 inset.
 * Both are the card surface with a hairline, radius 20; the expanded card
 * carries the bar's soft shadow.
 */

function StaySearchStepComponent({
  label,
  summary,
  title,
  expanded,
  onPress,
  children,
  style,
  testID,
}: StaySearchStepProps) {
  const palette = useStaySearchPalette();
  const card: WebCssStyle = {
    borderRadius: STAY_SEARCH_STEP_RADIUS,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.barSurface,
    boxShadow: expanded ? palette.barShadow : undefined,
  };

  if (expanded) {
    return (
      <View
        testID={testID}
        style={[
          card,
          { paddingTop: 24, paddingBottom: 24, paddingLeft: 24, paddingRight: 24, gap: 16 },
          style,
        ]}
      >
        <Text variant="title-2-semibold" role="heading" style={{ color: palette.text }}>
          {title ?? label}
        </Text>
        {children}
      </View>
    );
  }

  const row: WebCssStyle = {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingLeft: 20,
    paddingRight: 20,
    borderRadius: STAY_SEARCH_STEP_RADIUS - 1,
    height: 'auto',
    justifyContent: 'flex-start',
  };

  return (
    <View style={[card, style]}>
      <Button
        appearance="plain"
        tone="neutral"
        material="flat"
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={summary ? `${label}, ${summary}` : label}
        aria-expanded={false}
        testID={testID}
        style={row}
      >
        <Text variant="body-medium" numberOfLines={1} style={{ color: palette.textSecondary }}>
          {label}
        </Text>
        <Text
          variant="body-semibold"
          numberOfLines={1}
          style={{ flex: 1, minWidth: 0, textAlign: 'right', color: palette.text }}
        >
          {summary ?? ''}
        </Text>
      </Button>
    </View>
  );
}

export const StaySearchStep = memo(StaySearchStepComponent);
StaySearchStep.displayName = 'StaySearchStep';
