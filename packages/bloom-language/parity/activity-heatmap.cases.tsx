import { ActivityHeatmap } from '@oxy.so/bloom/activity-heatmap';

import * as L from '../src/index';
import { toElement } from '../src/render';
import { type ParityCase, Themed } from './support/cases';

const press = () => {};
const DATA = [
  { date: '2026-11-02', count: 1 },
  { date: '2026-11-03', count: 4 },
  { date: '2026-11-10', count: 9 },
  { date: '2026-11-19', count: 2 },
];

export const ACTIVITY_HEATMAP_CASES: readonly ParityCase[] = [
  {
    name: 'a heatmap',
    language: () => toElement(L.ActivityHeatmap(DATA).endDate('2026-11-21')),
    bloom: () => <ActivityHeatmap data={DATA} endDate="2026-11-21" />,
  },
  {
    name: 'a heatmap of its own range, steps, cells and words, Monday first',
    language: () =>
      toElement(
        L.ActivityHeatmap(DATA)
          .endDate('2026-11-21')
          .days(56)
          .levels([1, 3, 6])
          .cellSize('10')
          .spacing('2xs')
          .weekStart(1)
          .labels({ weekdays: ['L', 'M', 'X', 'J', 'V', 'S', 'D'] })
          .onPressDay(press)
          .emptyTint('mutedFill')
          .testID('activity'),
      ),
    bloom: () => (
      <Themed>
        {(c) => (
          <ActivityHeatmap
            data={DATA}
            endDate="2026-11-21"
            numDays={56}
            levels={[1, 3, 6]}
            cellSize={10}
            gap={2}
            weekStartsOn={1}
            weekdayLabels={['L', 'M', 'X', 'J', 'V', 'S', 'D']}
            onPressDay={press}
            emptyColor={c.contrast50}
            testID="activity"
          />
        )}
      </Themed>
    ),
  },
];
