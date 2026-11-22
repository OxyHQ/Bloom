import {
  DocumentList as BloomDocumentList,
  type DocumentListProps,
  LeaseSummaryCard as BloomLeaseSummaryCard,
  type LeaseSummaryCardProps,
  MaintenanceRequestCard as BloomMaintenanceRequestCard,
  type MaintenanceRequestCardProps,
  RentPaymentList as BloomRentPaymentList,
  type RentPaymentListProps,
  type RentPayment,
  type TenancyDocument,
  TenancyTimeline as BloomTenancyTimeline,
  type TenancyTimelineEvent,
  type TenancyTimelineProps,
} from '@oxy.so/bloom/tenancy';

import { type Child, Node, type ViewModifiers } from '../node';
import type { ControlDensity, RentOutstandingTone, TenancyLayout } from '../tokens';
import type { ControlRenderer } from './draw';
import { product } from './product';

/** A tenancy: its lease, its rent, its repairs, its papers and its history. */
export type TenancyKind =
  | 'tenancyTimeline'
  | 'leaseSummaryCard'
  | 'rentPaymentList'
  | 'maintenanceRequestCard'
  | 'documentList';

type Drawn = 'style' | 'testID' | 'accessibilityLabel';

export type TenancyTimelineOptions = Omit<TenancyTimelineProps, Drawn | 'events' | 'density'>;
export type LeaseSummaryCardOptions = Omit<LeaseSummaryCardProps, Drawn | 'layout' | 'actions'> & {
  readonly actions?: Child;
};
export type RentPaymentListOptions = Omit<
  RentPaymentListProps,
  Drawn | 'payments' | 'layout' | 'outstandingTone'
>;
export type MaintenanceRequestCardOptions = Omit<MaintenanceRequestCardProps, Drawn | 'actions'> & {
  readonly actions?: Child;
};
export type DocumentListOptions = Omit<DocumentListProps, Drawn | 'documents' | 'layout'>;

/** Bloom `TenancyTimeline`: what happened in a tenancy and what comes next; `.label()` names it. */
export interface TenancyTimelineView extends ViewModifiers<TenancyTimelineView> {
  /** `default` (Bloom's comfortable rows) or `compact`. */
  density(value: ControlDensity): TenancyTimelineView;
}
/** Bloom `LeaseSummaryCard`: a lease at a glance. */
export interface LeaseSummaryCardView extends ViewModifiers<LeaseSummaryCardView> {
  /** `auto` (default: from its width), `wide` or `narrow`. */
  style(value: TenancyLayout): LeaseSummaryCardView;
}
/** Bloom `RentPaymentList`: the rent paid and owed, month by month. */
export interface RentPaymentListView extends ViewModifiers<RentPaymentListView> {
  style(value: TenancyLayout): RentPaymentListView;
  /** The outstanding amount's tone: `default`, or `error` when it is late. */
  tint(value: RentOutstandingTone): RentPaymentListView;
}
/** Bloom `MaintenanceRequestCard`: a repair request and where it stands. */
export type MaintenanceRequestCardView = ViewModifiers<MaintenanceRequestCardView>;
/** Bloom `DocumentList`: a tenancy's papers, to view, download or sign. */
export interface DocumentListView extends ViewModifiers<DocumentListView> {
  style(value: TenancyLayout): DocumentListView;
}

/** Bloom `TenancyTimeline` of `events`, in order. */
export function TenancyTimeline(
  events: readonly TenancyTimelineEvent[],
  options: TenancyTimelineOptions = {},
): TenancyTimelineView {
  return new Node('tenancyTimeline', { events, options }, []);
}
/** Bloom `LeaseSummaryCard` of the lease its options describe; `actions` is a language child. */
export function LeaseSummaryCard(options: LeaseSummaryCardOptions): LeaseSummaryCardView {
  return new Node('leaseSummaryCard', { options }, []);
}
/** Bloom `RentPaymentList` of `payments`, newest first as given. */
export function RentPaymentList(
  payments: readonly RentPayment[],
  options: RentPaymentListOptions = {},
): RentPaymentListView {
  return new Node('rentPaymentList', { payments, options }, []);
}
/** Bloom `MaintenanceRequestCard` of the request its options describe; `actions` is a language child. */
export function MaintenanceRequestCard(
  options: MaintenanceRequestCardOptions,
): MaintenanceRequestCardView {
  return new Node('maintenanceRequestCard', { options }, []);
}
/** Bloom `DocumentList` of `documents`. */
export function DocumentList(
  documents: readonly TenancyDocument[],
  options: DocumentListOptions = {},
): DocumentListView {
  return new Node('documentList', { documents, options }, []);
}

export const TENANCY: Record<TenancyKind, ControlRenderer> = {
  tenancyTimeline: product(BloomTenancyTimeline, {
    own: (d) => {
      const density = d.own('density')?.value;
      // Bloom names the language's default density `comfortable`.
      return { density: density === 'default' ? 'comfortable' : density };
    },
  }),
  leaseSummaryCard: product(BloomLeaseSummaryCard, {
    slots: ['actions'],
    own: (d) => ({ layout: d.own('style')?.value }),
  }),
  rentPaymentList: product(BloomRentPaymentList, {
    own: (d) => ({ layout: d.own('style')?.value, outstandingTone: d.own('tint')?.value }),
  }),
  maintenanceRequestCard: product(BloomMaintenanceRequestCard, { slots: ['actions'] }),
  documentList: product(BloomDocumentList, { own: (d) => ({ layout: d.own('style')?.value }) }),
};
