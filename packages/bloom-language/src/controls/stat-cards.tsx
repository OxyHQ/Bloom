import {
  StatCard as BloomStatCard,
  StatCards as BloomStatCards,
  type StatCardsItem,
  type StatCardsProps,
} from '@oxy.so/bloom/stat-cards';

import { Node, type ViewModifiers } from '../node';
import type { StatCardsVariant } from '../tokens';
import type { ControlRenderer } from './draw';
import { product } from './product';

/** KPI stat cards: one, or a responsive grid of them. */
type StatCardsColumns = NonNullable<StatCardsProps['columns']>;

export type StatCardKind = 'statCard' | 'statCards';

/** Bloom `StatCard`: one KPI. */
export interface StatCardView extends ViewModifiers<StatCardView> {
  /** `plain` (default): icon, label, value and delta; `footer`: a display value over a band. */
  style(value: StatCardsVariant): StatCardView;
}
/** Bloom `StatCards`: KPI cards in a grid that answers the window's width. */
export interface StatCardsView extends ViewModifiers<StatCardsView> {
  style(value: StatCardsVariant): StatCardsView;
  /** Its columns at the widest breakpoint: 4 by default. */
  columns(value: StatCardsColumns): StatCardsView;
}

/** Bloom `StatCard` of `stat` (a `StatCardsItem`, as Bloom takes it). */
export function StatCard(stat: StatCardsItem): StatCardView {
  return new Node('statCard', { stat }, []);
}
/** Bloom `StatCards` of `stats`, in order (`stats.slice(0, n)` for the first n). */
export function StatCards(stats: readonly StatCardsItem[]): StatCardsView {
  return new Node('statCards', { stats }, []);
}

export const STAT_CARDS: Record<StatCardKind, ControlRenderer> = {
  statCard: product(BloomStatCard, { own: (d) => ({ variant: d.own('style')?.value }) }),
  statCards: product(BloomStatCards, {
    own: (d) => ({ variant: d.own('style')?.value, columns: d.own('columns')?.value }),
  }),
};
