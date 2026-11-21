import {
  ActivityHeatmap as BloomActivityHeatmap,
  type ActivityHeatmapDay,
} from '@oxy.so/bloom/activity-heatmap';

import { Node, type ViewModifiers } from '../node';
import { resolveSpace, type ColorToken, type SpaceToken } from '../tokens';
import type { ControlRenderer } from './draw';

/** A calendar grid coloured by count (Bloom `activity-heatmap`). */
export type ActivityHeatmapKind = 'activityHeatmap';

/** Wording of your own for its axes (Bloom speaks them in the locale). */
export interface ActivityHeatmapLabels {
  readonly months?: string[];
  readonly weekdays?: string[];
}

/** Bloom `ActivityHeatmap`: a day a cell, its count a step of the accent. */
export interface ActivityHeatmapView extends ViewModifiers<ActivityHeatmapView> {
  /** How many days back from the end (a year by default). */
  days(value: number): ActivityHeatmapView;
  /** The last day (`YYYY-MM-DD`; today by default). */
  endDate(value: string): ActivityHeatmapView;
  /** The counts each step starts at. */
  levels(value: number[]): ActivityHeatmapView;
  /** A day with no count. */
  emptyTint(value: ColorToken): ActivityHeatmapView;
  /** A cell's edge. */
  cellSize(value: SpaceToken): ActivityHeatmapView;
  /** The gap between cells. */
  spacing(value: SpaceToken): ActivityHeatmapView;
  /** The first row: `0` Sunday (default) or `1` Monday. */
  weekStart(value: 0 | 1): ActivityHeatmapView;
  labels(value: ActivityHeatmapLabels): ActivityHeatmapView;
  /** What pressing a day does. */
  onPressDay(value: (day: ActivityHeatmapDay) => void): ActivityHeatmapView;
}

/** Bloom `ActivityHeatmap`: its days (`{ date, count }`). */
export function ActivityHeatmap(data: ActivityHeatmapDay[]): ActivityHeatmapView {
  return new Node('activityHeatmap', { data }, []);
}

const space = (token: SpaceToken | undefined) =>
  token === undefined ? undefined : resolveSpace(token);

export const ACTIVITY_HEATMAPS: Record<ActivityHeatmapKind, ControlRenderer> = {
  activityHeatmap: (d) => {
    const props = d.props();
    const labels = d.own('labels')?.value as ActivityHeatmapLabels | undefined;
    Object.assign(props, {
      data: (d.node.props as { data: ActivityHeatmapDay[] }).data,
      numDays: d.own('days')?.value,
      endDate: d.own('endDate')?.value,
      levels: d.own('levels')?.value,
      cellSize: space(d.own('cellSize')?.value),
      gap: space(d.own('spacing')?.value),
      weekStartsOn: d.own('weekStart')?.value,
      monthLabels: labels?.months,
      weekdayLabels: labels?.weekdays,
      onPressDay: d.own('onPressDay')?.value,
    });
    return d.painted(BloomActivityHeatmap, props, { emptyColor: d.own('emptyTint')?.value });
  },
};
