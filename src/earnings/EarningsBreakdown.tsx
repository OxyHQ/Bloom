import React, { memo, useMemo } from 'react';
import { View } from 'react-native';

import { PriceSummary } from '../price-breakdown';
import { useSurfaceFill } from '../styles/surface-levels';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { EARNINGS_LABELS } from './constants';
import { resolveEarningsPaint } from './shared';
import type { EarningsBreakdownProps } from './types';

/**
 * What the period's money came from, by kind.
 *
 * It is `price-breakdown`'s `PriceSummary` under a heading, and that is the
 * whole component. A courier's earnings are an ITEMISATION — jobs, tips,
 * bonuses, adjustments, each a label and an amount the app formatted — which is
 * the same object as a fare's itemisation seen from the other side. Writing a
 * second list of label-and-amount rows here would give Bloom two answers to one
 * question, and only one of them would know about `estimated`, `pending`, the
 * discount tone and the info popover.
 *
 *   heading  `body-semibold`, 8 over the list; omitted with `title={null}`
 *   lines    `PriceSummary`, which owns the rows, the rule and the total
 *
 * **NO TOTAL BY DEFAULT.** Inside `EarningsSummary` the figure above already IS
 * the total, and a second one under the list is the same number twice. Pass
 * `total` when the breakdown stands on its own.
 */
function EarningsBreakdownComponent({
  lines,
  total,
  title,
  collapsible = false,
  defaultExpanded = false,
  labels: labelOverrides,
  accessibilityLabel,
  style,
  testID,
}: EarningsBreakdownProps) {
  const theme = useTheme();
  const surface = useSurfaceFill();
  const paint = useMemo(() => resolveEarningsPaint(theme, surface), [theme, surface]);
  const labels = useMemo(() => ({ ...EARNINGS_LABELS, ...labelOverrides }), [labelOverrides]);
  const heading = title === undefined ? labels.breakdown : title;

  return (
    <View style={[{ gap: 8 }, style]} testID={testID}>
      {heading ? (
        <Text
          variant="body-semibold"
          role="heading"
          aria-level={3}
          style={{ color: paint.text }}
          testID={testID ? `${testID}-title` : undefined}
        >
          {heading}
        </Text>
      ) : null}
      <PriceSummary
        lines={lines}
        total={total}
        collapsible={collapsible}
        defaultExpanded={defaultExpanded}
        accessibilityLabel={accessibilityLabel ?? heading ?? labels.breakdown}
        testID={testID ? `${testID}-lines` : undefined}
      />
    </View>
  );
}

export const EarningsBreakdown = memo(EarningsBreakdownComponent);
EarningsBreakdown.displayName = 'EarningsBreakdown';
