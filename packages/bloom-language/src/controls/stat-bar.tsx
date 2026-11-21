import type { ReactNode } from 'react';
import {
  Meter as BloomMeter,
  MeterRing as BloomMeterRing,
  StatBar as BloomStatBar,
} from '@oxy.so/bloom/stat-bar';
import type { MeterReveal } from '@oxy.so/bloom/stat-bar';

import { DURATION } from '../generated/spec.generated';
import { Node, type Child, type Progress, type ViewModifiers } from '../node';
import {
  resolveCorner,
  resolveSpace,
  type ColorName,
  type ColorToken,
  type CornerName,
  type DurationName,
  type MeterCap,
  type SpaceToken,
} from '../tokens';
import type { ControlDraw, ControlRenderer } from './draw';

/** Meters and progress bars: Bloom's one determinate bar and ring, and the labelled bar built on it. */
export type StatBarKind = 'meter' | 'meterRing' | 'statBar';

export interface MeterProps {
  readonly value: number;
  readonly total: number | undefined;
  /** What it is to assistive technology: a measurement (`meter`) or a task's progress (`progressbar`). */
  readonly role: 'meter' | 'progressbar';
}
export type StatBarProps =
  | {
      readonly variant: 'progress';
      readonly label: string;
      readonly value: number;
      readonly max: number;
    }
  | {
      readonly variant: 'split';
      readonly label: string;
      readonly percent: number;
      readonly leftValue: string;
      readonly rightValue: string;
    };

/** What a bar and a ring share. */
interface MeterModifiers<Self> {
  /** The reading a screen reader says (`4 of 5`); the share of the track in the locale by default. */
  valueText(value: string): Self;
  /** The amount is not known yet: a segment sweeps (a quarter of the ring turns) and it reports no value. */
  indeterminate(value?: boolean): Self;
  /** A bar or ring with no role, hidden from assistive technology: the drawing inside a control that names itself. */
  decorative(): Self;
  /** The filled part's colour role (the accent by default). */
  tint(value: ColorName): Self;
  /** The rail behind the fill (neutral by default). */
  trackTint(value: ColorToken): Self;
  /** The bar's height, or the ring's stroke. */
  thickness(value: SpaceToken): Self;
  /** Web: how long the fill eases to a new value (native snaps); none by default. */
  fillDuration(value: DurationName): Self;
}
/** Bloom `Meter`: a determinate bar the width of its parent, unless framed. */
export interface MeterView extends ViewModifiers<MeterView>, MeterModifiers<MeterView> {
  /** The track's and the fill's corner; half the thickness (a capsule) by default. */
  barCorner(value: Exclude<CornerName, 'concentric'>): MeterView;
  /** The fill's entrance, which never changes the accessible measurement. */
  reveal(value: MeterReveal): MeterView;
}
/** Bloom `MeterRing`: the same measurement as a ring. */
export interface MeterRingView extends ViewModifiers<MeterRingView>, MeterModifiers<MeterRingView> {
  /** The outer diameter (56 by default); the stroke is drawn inside it. */
  size(value: SpaceToken): MeterRingView;
  /** A disc under the whole ring: the scrim that lets it read over a photo. */
  backdrop(value: ColorToken): MeterRingView;
  /** The arc's end: `round` (default) or `butt`. */
  cap(value: MeterCap): MeterRingView;
  /** What is centred in it (a score, a glyph), hidden from assistive technology. */
  content(value: Child): MeterRingView;
  /** The ring stops what it measures: a stop square in its centre, the ring pressable, named `label`. */
  onStop(action: () => void, label: string): MeterRingView;
  /** A decorative ring's drawn share, 0 to 1, followed on the UI thread. */
  progress(value: Progress | undefined): MeterRingView;
}
/** Bloom `StatBar`: a labelled bar, with a range or a split under it. */
export interface StatBarView extends ViewModifiers<StatBarView> {
  /** The filled side's colour role (the accent by default). */
  tint(value: ColorName): StatBarView;
  /** The empty side's (neutral by default). */
  trackTint(value: ColorToken): StatBarView;
  /** The bar's height (6 by default). */
  thickness(value: SpaceToken): StatBarView;
  /** What sits at the end of the label row (a trophy). */
  trailing(value: Child): StatBarView;
  /** The labels under a progress bar's ends (its range). */
  rangeLabels(min: string | undefined, max?: string): StatBarView;
}

function meter(role: MeterProps['role'], kind: 'meter' | 'meterRing') {
  return (value: number, total?: number) =>
    new Node(kind, { value, total, role } satisfies MeterProps, []);
}
/** Bloom `Meter`: a measurement within a known range (a score, a charge): `value` of `total` (1 by default). */
export const Meter = meter('meter', 'meter') as (value: number, total?: number) => MeterView;
/** Bloom `Meter` as a progress bar: how far a task has got (an upload, steps done). */
export const ProgressBar = meter('progressbar', 'meter') as (
  value: number,
  total?: number,
) => MeterView;
/** Bloom `MeterRing`: a measurement as a ring. */
export const MeterRing = meter('meter', 'meterRing') as (
  value: number,
  total?: number,
) => MeterRingView;
/** Bloom `MeterRing` as a progress ring (a download). */
export const ProgressRing = meter('progressbar', 'meterRing') as (
  value: number,
  total?: number,
) => MeterRingView;

/** Bloom `StatBar`: `label` over a bar filled `value` of `max`. */
export function StatBar(label: string, value: number, max: number): StatBarView {
  return new Node('statBar', { variant: 'progress', label, value, max } satisfies StatBarProps, []);
}
/** Bloom `StatBar`'s split: `percent` (0 to 100) filled from the leading side, its two values under the ends. */
export function SplitBar(
  label: string,
  percent: number,
  leftValue: string,
  rightValue: string,
): StatBarView {
  return new Node(
    'statBar',
    { variant: 'split', label, percent, leftValue, rightValue } satisfies StatBarProps,
    [],
  );
}

const space = (token: SpaceToken | undefined) =>
  token === undefined ? undefined : resolveSpace(token);

/** What a bar and a ring share, as Bloom's props. */
function measured(d: ControlDraw): Record<string, unknown> {
  const { value, total, role } = d.node.props as MeterProps;
  const props = d.props();
  const duration = d.own('fillDuration')?.value;
  Object.assign(props, {
    value,
    max: total,
    transitionMs: duration === undefined ? undefined : DURATION[duration],
    indeterminate: d.own('indeterminate')?.value,
  });
  if (d.own('decorative') !== undefined) {
    props.decorative = true;
    delete props.accessibilityLabel;
  } else {
    props.valueText = d.own('valueText')?.value;
    if (role === 'progressbar') props.role = role;
  }
  return props;
}

function colors(d: ControlDraw): Record<string, ColorToken | undefined> {
  return { fill: d.own('tint')?.value as ColorToken | undefined, track: d.own('trackTint')?.value };
}

export const STAT_BARS: Record<StatBarKind, ControlRenderer> = {
  meter: (d) => {
    const props = measured(d);
    props.height = space(d.own('thickness')?.value);
    const corner = d.own('barCorner')?.value;
    props.radius = corner === undefined ? undefined : resolveCorner(corner);
    props.reveal = d.own('reveal')?.value;
    return d.painted(BloomMeter, props, colors(d));
  },
  meterRing: (d) => {
    const props = measured(d);
    props.size = space(d.own('size')?.value as SpaceToken | undefined);
    props.thickness = space(d.own('thickness')?.value);
    props.cap = d.own('cap')?.value;
    const stop = d.own('onStop');
    if (stop !== undefined) [props.onStop, props.stopLabel] = stop.value;
    if (props.decorative) props.progress = d.own('progress')?.value;
    const content = d.own('content')?.value;
    const children: ReactNode[] = content === undefined ? [] : [d.render(content)];
    return d.painted(
      BloomMeterRing,
      props,
      { ...colors(d), backdrop: d.own('backdrop')?.value },
      ...children,
    );
  },
  statBar: (d) => {
    const own = d.node.props as StatBarProps;
    const props = d.props();
    Object.assign(props, own);
    if (own.variant === 'progress') {
      delete props.variant;
      const range = d.own('rangeLabels')?.value;
      if (range !== undefined) {
        props.minLabel = range[0];
        props.maxLabel = range[1];
      }
    }
    props.height = space(d.own('thickness')?.value);
    const trailing = d.own('trailing')?.value;
    if (trailing !== undefined) props.icon = d.render(trailing[0]);
    return d.painted(BloomStatBar, props, {
      fillColor: d.own('tint')?.value as ColorToken | undefined,
      trackColor: d.own('trackTint')?.value,
    });
  },
};
