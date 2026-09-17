import React, { memo, useCallback, useMemo, useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';

import { BarListCard } from '../chart-cards/BarListCard';
import { RadialChartCard } from '../chart-cards/RadialChartCard';
import { groupThousands } from '../chart-cards/primitives/format';
import type { AudienceBreakdownLabels, AudienceBreakdownProps } from './types';

/**
 * `AudienceBreakdown`: who is listening and where they came from, as four
 * chart cards laid out on the container's own width.
 *
 *   locations  `BarListCard` — Cities / Countries tabs, share of listeners
 *   age        `BarListCard` — one row per age group, share of listeners
 *   gender     `RadialChartCard` `stacked` — the half-gauge donut
 *   sources    `RadialChartCard` `stacked` — the half-gauge donut with a legend
 *
 * Two columns (16 apart) from 720px of its own width, one below. Every card
 * keeps its own hover, motion and accessible summary.
 */

export const AUDIENCE_BREAKDOWN_LABELS: AudienceBreakdownLabels = {
  locations: 'Top locations',
  cities: 'Cities',
  countries: 'Countries',
  age: 'Age',
  gender: 'Gender',
  sources: 'Listening sources',
  metric: 'Listeners',
};

const TWO_COLUMNS_FROM = 720;
const GAP = 16;


function AudienceBreakdownComponent({
  cities,
  countries,
  ages,
  genders,
  sources,
  range,
  format = groupThousands,
  labels: labelOverrides,
  style,
  testID,
}: AudienceBreakdownProps) {
  const labels = { ...AUDIENCE_BREAKDOWN_LABELS, ...labelOverrides };
  const [width, setWidth] = useState(0);
  const onLayout = useCallback((event: LayoutChangeEvent) => {
    const next = Math.round(event.nativeEvent.layout.width);
    setWidth((prev) => (prev === next ? prev : next));
  }, []);
  const twoColumns = width >= TWO_COLUMNS_FROM;
  // Equal shares in a row only: a zero basis in a column collapses an auto-height card.
  const cell = twoColumns ? styles.cell : undefined;

  const tabs = useMemo(
    () => [
      { id: 'cities', label: labels.cities, items: cities },
      { id: 'countries', label: labels.countries, items: countries },
    ],
    [labels.cities, labels.countries, cities, countries],
  );

  const locations = (
    <BarListCard
      tabs={tabs}
      metricLabel={labels.metric}
      format={format}
      style={cell}
      testID={testID ? `${testID}-locations` : undefined}
    />
  );
  const age = (
    <BarListCard
      title={labels.age}
      items={ages}
      metricLabel={labels.metric}
      format={format}
      limit={Math.max(5, ages.length)}
      style={cell}
      testID={testID ? `${testID}-age` : undefined}
    />
  );
  const gender = (
    <RadialChartCard
      variant="stacked"
      title={labels.gender}
      data={genders}
      range={range}
      format={format}
      style={cell}
      testID={testID ? `${testID}-gender` : undefined}
    />
  );
  const source = (
    <RadialChartCard
      variant="stacked"
      title={labels.sources}
      data={sources}
      range={range}
      format={format}
      style={cell}
      testID={testID ? `${testID}-sources` : undefined}
    />
  );

  return (
    <View testID={testID} onLayout={onLayout} style={[styles.root, style]}>
      {twoColumns ? (
        <>
          <View style={styles.row}>
            {locations}
            {source}
          </View>
          <View style={styles.row}>
            {age}
            {gender}
          </View>
        </>
      ) : (
        <>
          {locations}
          {source}
          {age}
          {gender}
        </>
      )}
    </View>
  );
}

export const AudienceBreakdown = memo(AudienceBreakdownComponent);
AudienceBreakdown.displayName = 'AudienceBreakdown';

const styles = StyleSheet.create({
  root: { width: '100%', gap: GAP },
  row: { flexDirection: 'row', alignItems: 'stretch', gap: GAP },
  cell: { flexGrow: 1, flexShrink: 1, flexBasis: 0, minWidth: 0 },
});
