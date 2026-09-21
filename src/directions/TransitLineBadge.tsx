import React, { memo, useMemo } from 'react';
import { Platform, View } from 'react-native';

import { Badge } from '../badge';
import { useTheme } from '../theme/use-theme';
import { describeTransitLine, resolveTransitLineColors } from './shared';
import type { TransitLineBadgeProps } from './types';

const IS_WEB = Platform.OS === 'web';

/**
 * A transit line's own badge — "L4", "N12", "S1".
 *
 * It is Bloom's `Badge` on the label rung, with two colours overridden and
 * nothing else: the geometry, the radius, the type step and the truncation stay
 * the badge's. That is the same construction `listing-card`'s status pill uses,
 * and for the same reason — an operator's line colour is DATA the app owns, and
 * only the fill and the label may come from outside the palette.
 *
 * The label colour is MEASURED, not derived: `readableOn` picks whichever end
 * of the theme's own reading pair clears more contrast against the operator's
 * fill, in both modes. A line with no colour is the plain neutral badge, which
 * is the right answer for an operator that publishes none rather than an
 * invented tint.
 *
 * It reads as ONE element, like `Rating`: the pill shows two characters and
 * says a sentence ("Line L4, towards Pla del Bosc"). `Badge` takes no name of
 * its own, so the name sits on the wrapper — `role="img"` on web, where a plain
 * `div` carrying an `aria-label` is not announced at all.
 */
function TransitLineBadgeComponent({ line, size = 'label-small', style, testID }: TransitLineBadgeProps) {
  const theme = useTheme();
  const colors = useMemo(
    () => (line.color ? resolveTransitLineColors(theme, line.color) : null),
    [theme, line.color],
  );

  return (
    <View
      accessible
      accessibilityLabel={describeTransitLine(line)}
      {...(IS_WEB ? { role: 'img' as const } : null)}
      style={style}
      testID={testID}
    >
      <Badge
        content={line.name}
        variant={colors ? 'solid' : 'subtle'}
        color="default"
        size={size}
        style={colors ? { backgroundColor: colors.background } : undefined}
        textStyle={colors ? { color: colors.foreground } : undefined}
      />
    </View>
  );
}

export const TransitLineBadge = memo(TransitLineBadgeComponent);
TransitLineBadge.displayName = 'TransitLineBadge';
