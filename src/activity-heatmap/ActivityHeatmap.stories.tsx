import React from 'react';
import { View, ScrollView } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { ActivityHeatmap, bucketByDay } from './index';
import type { ActivityHeatmapDay } from './index';
import { BloomThemeProvider } from '../theme';

const END_DATE = '2026-06-30';

/** Deterministic pseudo-random sample so stories render stably. */
function sampleData(days: number, endKey: string): ActivityHeatmapDay[] {
  const [y, m, d] = endKey.split('-').map(Number);
  const end = Date.UTC(y ?? 2026, (m ?? 1) - 1, d ?? 1);
  const out: ActivityHeatmapDay[] = [];
  let seed = 42;
  for (let i = 0; i < days; i++) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    const roll = seed % 100;
    const count = roll < 45 ? 0 : roll < 70 ? 1 : roll < 85 ? 3 : roll < 95 ? 7 : 14;
    const ts = end - (days - 1 - i) * 86_400_000;
    const dt = new Date(ts);
    const key = `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}-${String(
      dt.getUTCDate(),
    ).padStart(2, '0')}`;
    if (count > 0) out.push({ date: key, count });
  }
  return out;
}

const DATA = sampleData(364, END_DATE);

const meta: Meta<typeof ActivityHeatmap> = {
  title: 'Data Display/ActivityHeatmap',
  component: ActivityHeatmap,
};

export default meta;

type Story = StoryObj<typeof ActivityHeatmap>;

export const Light: Story = {
  render: () => (
    <BloomThemeProvider mode="light">
      <View style={{ padding: 24 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <ActivityHeatmap
            data={DATA}
            endDate={END_DATE}
            weekdayLabels={['', 'Mon', '', 'Wed', '', 'Fri', '']}
          />
        </ScrollView>
      </View>
    </BloomThemeProvider>
  ),
};

export const Dark: Story = {
  render: () => (
    <BloomThemeProvider mode="dark">
      <View style={{ padding: 24, backgroundColor: '#000' }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <ActivityHeatmap
            data={DATA}
            endDate={END_DATE}
            weekdayLabels={['', 'Mon', '', 'Wed', '', 'Fri', '']}
          />
        </ScrollView>
      </View>
    </BloomThemeProvider>
  ),
};

export const CustomScale: Story = {
  render: () => (
    <BloomThemeProvider mode="dark">
      <View style={{ padding: 24, backgroundColor: '#000' }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <ActivityHeatmap
            data={DATA}
            endDate={END_DATE}
            numDays={140}
            cellSize={14}
            gap={4}
            colorScale={['#0E3B2E', '#146B4C', '#1FA971', '#38D896', '#7DF3BD']}
          />
        </ScrollView>
      </View>
    </BloomThemeProvider>
  ),
};

/** Demonstrates the `bucketByDay` helper grouping raw timestamps. */
export const FromRawEvents: Story = {
  render: () => {
    const events = DATA.flatMap((d) => Array.from({ length: d.count }, () => ({ at: d.date })));
    const bucketed = bucketByDay(events, (e) => e.at);
    return (
      <BloomThemeProvider mode="light">
        <View style={{ padding: 24 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <ActivityHeatmap data={bucketed} endDate={END_DATE} />
          </ScrollView>
        </View>
      </BloomThemeProvider>
    );
  },
};
