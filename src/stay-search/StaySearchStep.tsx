import React, { memo, useEffect, useMemo } from 'react';
import { Pressable, View } from 'react-native';

import { resolveButtonRamps } from '../button/shared';
import { useInteractionState } from '../hooks/use-interaction-state';
import { adoptStyleSheet } from '../styles/adopt-style-sheet';
import type { WebCssStyle } from '../styles/web-view-style';
import { webDataSet } from '../styles/web-data';
import { useTheme } from '../theme/use-theme';
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

const STYLE_ID = 'bloom-stay-search-step-web-css';
const CSS = `
[data-bloom-stay-step] {
  outline: none;
}
[data-bloom-stay-step]:focus-visible {
  box-shadow: inset 0 0 0 2px var(--bloom-stay-step-ring, currentColor);
}
`;

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
  const theme = useTheme();
  const palette = useStaySearchPalette();
  const { accent } = useMemo(() => resolveButtonRamps(theme), [theme]);
  const hover = useInteractionState();

  useEffect(() => {
    adoptStyleSheet(STYLE_ID, CSS);
  }, []);

  const card: WebCssStyle = {
    borderRadius: STAY_SEARCH_STEP_RADIUS,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.barSurface,
    boxShadow: expanded ? palette.barShadow : undefined,
  };

  if (expanded) {
    return (
      <View testID={testID} style={[card, { paddingTop: 24, paddingBottom: 24, paddingLeft: 24, paddingRight: 24, gap: 16 }, style]}>
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
    backgroundColor: hover.state ? palette.segmentHover : 'transparent',
    '--bloom-stay-step-ring': accent[500],
  };

  return (
    <View style={[card, style]}>
      <Pressable
        {...webDataSet({ bloomStayStep: '' })}
        onPress={onPress}
        onHoverIn={hover.onIn}
        onHoverOut={hover.onOut}
        accessibilityRole="button"
        accessibilityLabel={summary ? `${label}, ${summary}` : label}
        accessibilityState={{ expanded: false }}
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
      </Pressable>
    </View>
  );
}

export const StaySearchStep = memo(StaySearchStepComponent);
StaySearchStep.displayName = 'StaySearchStep';
