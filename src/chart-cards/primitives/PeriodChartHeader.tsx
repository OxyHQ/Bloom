import React from 'react';
import { View, useWindowDimensions } from 'react-native';

import { SegmentedControl, SegmentedControlItem, SegmentedControlItemText } from '../../segmented-control';
import { BREAKPOINTS } from '../../styles/breakpoints';
import { ChartHeadline, type ChartHeadlineProps } from './ChartHeader';
import type { ChartRangeOption } from './use-chart-range';

export interface PeriodChartHeaderProps extends ChartHeadlineProps {
  /** The periods; no switcher when omitted or empty. */
  ranges?: readonly ChartRangeOption[];
  rangeId?: string;
  onRangeChange?: (id: string) => void;
  /** Names the switcher (`aria-label="Revenue period"`). */
  rangesLabel: string;
}

/**
 * The header of the dashboard line and earnings cards — a
 * `ChartHeadline` beside a Weekly / Monthly / Yearly `SegmentedControl`:
 *
 *   ≥ sm   one row, top-aligned, 2px apart; the headline takes the rest
 *   < sm   stacked 12px apart; `SegmentedControl` pins its
 *          thumb 4px inside the track, so the padding stays — the selected
 *          segment sits 4px right of the heading on phones
 *
 * testIDs: `-header`, `-range` on the control, `-range-<id>` per segment.
 */
export function PeriodChartHeader({
  ranges,
  rangeId,
  onRangeChange,
  rangesLabel,
  testID,
  ...headline
}: PeriodChartHeaderProps) {
  const { width } = useWindowDimensions();
  const wide = width >= BREAKPOINTS.sm;
  return (
    <View
      testID={testID ? `${testID}-header` : undefined}
      style={
        wide
          ? { width: '100%', flexDirection: 'row', alignItems: 'flex-start', gap: 2 }
          : { width: '100%', flexDirection: 'column', gap: 12 }
      }>
      <ChartHeadline {...headline} testID={testID} style={wide ? { flex: 1 } : { width: '100%' }} />
      {ranges && ranges.length > 0 ? (
        <View testID={testID ? `${testID}-range` : undefined}>
          <SegmentedControl
            label={rangesLabel}
            type="radio"
            value={rangeId ?? ranges[0]!.id}
            onValueChange={(id) => onRangeChange?.(id)}>
            {ranges.map((range) => (
              <SegmentedControlItem
                key={range.id}
                value={range.id}
                testID={testID ? `${testID}-range-${range.id}` : undefined}>
                <SegmentedControlItemText>{range.label}</SegmentedControlItemText>
              </SegmentedControlItem>
            ))}
          </SegmentedControl>
        </View>
      ) : null}
    </View>
  );
}
