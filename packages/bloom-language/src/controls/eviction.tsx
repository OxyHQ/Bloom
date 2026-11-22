import {
  type EvictionEvent,
  EvictionReportCard as BloomEvictionReportCard,
  type EvictionReportCardProps,
  EvictionTimeline as BloomEvictionTimeline,
  type EvictionTimelineProps,
} from '@oxy.so/bloom/eviction';

import type { Binding } from '../binding';
import { Node, type ViewModifiers } from '../node';
import type { ControlRenderer } from './draw';
import { product } from './product';

/** An eviction reported to a community: the report and what happened since. */
export type EvictionKind = 'evictionReportCard' | 'evictionTimeline';

type Drawn = 'style' | 'testID' | 'accessibilityLabel';

/**
 * Bloom `EvictionReportCard`'s data and handlers; whether one attends is a
 * binding (Bloom's `attending` and `onAttendingChange`).
 */
export type EvictionReportCardOptions = Omit<
  EvictionReportCardProps,
  Drawn | 'numberOfLines' | 'attending' | 'onAttendingChange'
> & { readonly attending?: Binding<boolean> };
export type EvictionTimelineOptions = Omit<EvictionTimelineProps, Drawn | 'events'>;

/** Bloom `EvictionReportCard`: an eviction's date, place, status and the people who stand with it. */
export interface EvictionReportCardView extends ViewModifiers<EvictionReportCardView> {
  /** The description's lines before it is cut. */
  lines(value: number): EvictionReportCardView;
}
/** Bloom `EvictionTimeline`: an eviction's events, in order; `.label()` names it. */
export type EvictionTimelineView = ViewModifiers<EvictionTimelineView>;

/** Bloom `EvictionReportCard` of the report its options describe. */
export function EvictionReportCard(options: EvictionReportCardOptions): EvictionReportCardView {
  const { attending, ...rest } = options;
  return new Node('evictionReportCard', { options: rest, binding: attending }, []);
}
/** Bloom `EvictionTimeline` of `events`. */
export function EvictionTimeline(
  events: readonly EvictionEvent[],
  options: EvictionTimelineOptions = {},
): EvictionTimelineView {
  return new Node('evictionTimeline', { events, options }, []);
}

export const EVICTION: Record<EvictionKind, ControlRenderer> = {
  evictionReportCard: product(BloomEvictionReportCard, {
    binding: ['attending', 'onAttendingChange'],
    own: (d) => ({ numberOfLines: d.own('lines')?.value }),
  }),
  evictionTimeline: product(BloomEvictionTimeline),
};
