import {
  type CarrierQuote,
  CarrierQuoteCard as BloomCarrierQuoteCard,
  type CarrierQuoteCardProps,
  CarrierQuoteList as BloomCarrierQuoteList,
  type CarrierQuoteListProps,
} from '@oxy.so/bloom/carrier-quote';
import {
  EarningsBreakdown as BloomEarningsBreakdown,
  type EarningsBreakdownProps,
  type EarningsPayout,
  EarningsPayoutRow as BloomEarningsPayoutRow,
  type EarningsPayoutRowProps,
  type EarningsPeriod,
  EarningsSummary as BloomEarningsSummary,
  type EarningsSummaryProps,
} from '@oxy.so/bloom/earnings';
import {
  JobBoard as BloomJobBoard,
  type JobBoardProps,
  JobCard as BloomJobCard,
  type JobCardProps,
  type JobOffer,
} from '@oxy.so/bloom/job-board';
import type { PriceLine } from '@oxy.so/bloom/price-breakdown';
import {
  ProofOfDelivery as BloomProofOfDelivery,
  type ProofOfDeliveryProps,
  SignaturePad as BloomSignaturePad,
  type SignaturePadProps,
} from '@oxy.so/bloom/proof-of-delivery';
import type { RouteStopsProps } from '@oxy.so/bloom/route-stops';
import {
  type ShipmentLoad,
  ShipmentLoadPicker as BloomShipmentLoadPicker,
  type ShipmentLoadPickerProps,
  ShipmentOptionsList as BloomShipmentOptionsList,
  type ShipmentOptionsListProps,
  ShipmentRequestForm as BloomShipmentRequestForm,
  type ShipmentRequestFormProps,
} from '@oxy.so/bloom/shipment-request';
import {
  type VehicleKind,
  VehiclePicker as BloomVehiclePicker,
  type VehiclePickerProps,
} from '@oxy.so/bloom/vehicle-picker';

import type { Binding } from '../binding';
import { type Child, Node, type ViewModifiers } from '../node';
import type { ColorToken, ControlDensity, SpaceToken } from '../tokens';
import type { ControlDraw, ControlRenderer } from './draw';
import { product, rowDensity } from './product';

/** Logistics: carriers' quotes, a courier's earnings and jobs, proof at the door, a shipment. */
export type LogisticsKind =
  | 'carrierQuoteCard'
  | 'carrierQuoteList'
  | 'earningsSummary'
  | 'earningsBreakdown'
  | 'earningsPayoutRow'
  | 'jobCard'
  | 'jobBoard'
  | 'signaturePad'
  | 'proofOfDelivery'
  | 'vehiclePicker'
  | 'shipmentLoadPicker'
  | 'shipmentOptionsList'
  | 'shipmentRequestForm';

type Drawn = 'style' | 'testID' | 'accessibilityLabel';

/** Bloom `CarrierQuoteCard`'s data; its `actions` are language children. */
export type CarrierQuoteCardOptions = Omit<
  CarrierQuoteCardProps,
  Drawn | 'quote' | 'density' | 'disabled' | 'actions'
> & { readonly actions?: Child };
/** Bloom `CarrierQuoteList`'s data; its `emptyAction` is a language child. */
export type CarrierQuoteListOptions = Omit<
  CarrierQuoteListProps,
  Drawn | 'quotes' | 'density' | 'loading' | 'emptyAction'
> & { readonly emptyAction?: Child };
/** Bloom `EarningsSummary`'s data; its `payoutAction` a child, its chart's height a space token. */
export type EarningsSummaryOptions = Omit<
  EarningsSummaryProps,
  Drawn | 'periods' | 'payoutAction' | 'chartHeight'
> & { readonly payoutAction?: Child; readonly chartHeight?: SpaceToken };
export type EarningsBreakdownOptions = Omit<EarningsBreakdownProps, Drawn | 'lines'>;
/** Bloom `EarningsPayoutRow`'s data; its `action` is a language child. */
export type EarningsPayoutRowOptions = Omit<
  EarningsPayoutRowProps,
  Drawn | 'payout' | 'onPress' | 'action'
> & { readonly action?: Child };
/** Bloom `JobCard`'s data; its `actions` are language children. */
export type JobCardOptions = Omit<
  JobCardProps,
  Drawn | 'job' | 'density' | 'disabled' | 'actions'
> & { readonly actions?: Child };
/** Bloom `JobBoard`'s data; its `emptyAction` is a language child. */
export type JobBoardOptions = Omit<
  JobBoardProps,
  Drawn | 'jobs' | 'density' | 'loading' | 'emptyAction'
> & { readonly emptyAction?: Child };
/** Bloom `SignaturePad`'s data (its value, controlled or not); its height a space token. */
export type SignaturePadOptions = Omit<SignaturePadProps, Drawn | 'ink' | 'disabled' | 'height'> & {
  readonly height?: SpaceToken;
};
/** Bloom `ProofOfDelivery`'s data; its `actions` a child, the signature's height a space token. */
export type ProofOfDeliveryOptions = Omit<
  ProofOfDeliveryProps,
  Drawn | 'submitting' | 'disabled' | 'actions' | 'signatureHeight'
> & { readonly actions?: Child; readonly signatureHeight?: SpaceToken };
export type VehiclePickerOptions<T extends string = VehicleKind> = Omit<
  VehiclePickerProps<T>,
  Drawn | 'value' | 'onValueChange' | 'disabled'
>;
export type ShipmentLoadPickerOptions = Omit<
  ShipmentLoadPickerProps,
  'style' | 'testID' | 'value' | 'onValueChange' | 'disabled'
>;
export type ShipmentOptionsListOptions = Omit<
  ShipmentOptionsListProps,
  'style' | 'testID' | 'disabled'
>;
/** Bloom `ShipmentRequestForm`'s data; its `footer` is a language child. */
export type ShipmentRequestFormOptions = Omit<
  ShipmentRequestFormProps,
  Drawn | 'route' | 'load' | 'onLoadChange' | 'disabled' | 'footer'
> & { readonly footer?: Child };

export interface CarrierQuoteCardView extends ViewModifiers<CarrierQuoteCardView> {
  /** `default` (Bloom's comfortable) or `compact`. */
  density(value: ControlDensity): CarrierQuoteCardView;
  disabled(value?: boolean): CarrierQuoteCardView;
}
export interface CarrierQuoteListView extends ViewModifiers<CarrierQuoteListView> {
  density(value: ControlDensity): CarrierQuoteListView;
  /** Skeleton cards while the quotes load. */
  loading(value?: boolean): CarrierQuoteListView;
}
export type EarningsSummaryView = ViewModifiers<EarningsSummaryView>;
export type EarningsBreakdownView = ViewModifiers<EarningsBreakdownView>;
/** Bloom `EarningsPayoutRow`; `.onPress()` is its own. */
export type EarningsPayoutRowView = ViewModifiers<EarningsPayoutRowView>;
export interface JobCardView extends ViewModifiers<JobCardView> {
  density(value: ControlDensity): JobCardView;
  disabled(value?: boolean): JobCardView;
}
export interface JobBoardView extends ViewModifiers<JobBoardView> {
  density(value: ControlDensity): JobBoardView;
  loading(value?: boolean): JobBoardView;
}
export interface SignaturePadView extends ViewModifiers<SignaturePadView> {
  /** The ink's colour role (Bloom's pad text colour with none). */
  tint(value: ColorToken): SignaturePadView;
  disabled(value?: boolean): SignaturePadView;
}
export interface ProofOfDeliveryView extends ViewModifiers<ProofOfDeliveryView> {
  /** Submitting: the proofs are on their way. */
  loading(value?: boolean): ProofOfDeliveryView;
  disabled(value?: boolean): ProofOfDeliveryView;
}
export interface VehiclePickerView extends ViewModifiers<VehiclePickerView> {
  disabled(value?: boolean): VehiclePickerView;
}
export interface ShipmentLoadPickerView extends ViewModifiers<ShipmentLoadPickerView> {
  disabled(value?: boolean): ShipmentLoadPickerView;
}
export interface ShipmentOptionsListView extends ViewModifiers<ShipmentOptionsListView> {
  disabled(value?: boolean): ShipmentOptionsListView;
}
export interface ShipmentRequestFormView extends ViewModifiers<ShipmentRequestFormView> {
  disabled(value?: boolean): ShipmentRequestFormView;
}

export function CarrierQuoteCard(
  quote: CarrierQuote,
  options: CarrierQuoteCardOptions = {},
): CarrierQuoteCardView {
  return new Node('carrierQuoteCard', { quote, options }, []);
}
export function CarrierQuoteList(
  quotes: readonly CarrierQuote[],
  options: CarrierQuoteListOptions = {},
): CarrierQuoteListView {
  return new Node('carrierQuoteList', { quotes, options }, []);
}
export function EarningsSummary(
  periods: readonly EarningsPeriod[],
  options: EarningsSummaryOptions = {},
): EarningsSummaryView {
  return new Node('earningsSummary', { periods, options }, []);
}
export function EarningsBreakdown(
  lines: readonly PriceLine[],
  options: EarningsBreakdownOptions = {},
): EarningsBreakdownView {
  return new Node('earningsBreakdown', { lines, options }, []);
}
export function EarningsPayoutRow(
  payout: EarningsPayout,
  options: EarningsPayoutRowOptions = {},
): EarningsPayoutRowView {
  return new Node('earningsPayoutRow', { payout, options }, []);
}
export function JobCard(job: JobOffer, options: JobCardOptions = {}): JobCardView {
  return new Node('jobCard', { job, options }, []);
}
export function JobBoard(jobs: readonly JobOffer[], options: JobBoardOptions = {}): JobBoardView {
  return new Node('jobBoard', { jobs, options }, []);
}
export function SignaturePad(options: SignaturePadOptions = {}): SignaturePadView {
  return new Node('signaturePad', { options }, []);
}
export function ProofOfDelivery(options: ProofOfDeliveryOptions = {}): ProofOfDeliveryView {
  return new Node('proofOfDelivery', { options }, []);
}
/** Bloom `VehiclePicker`: the vehicle its binding holds (`null` before one is chosen). */
export function VehiclePicker<T extends string = VehicleKind>(
  vehicle: Binding<T | null>,
  options: VehiclePickerOptions<T> = {},
): VehiclePickerView {
  return new Node('vehiclePicker', { binding: vehicle, options }, []);
}
/** Bloom `ShipmentLoadPicker`: the load its binding holds. */
export function ShipmentLoadPicker(
  load: Binding<ShipmentLoad>,
  options: ShipmentLoadPickerOptions = {},
): ShipmentLoadPickerView {
  return new Node('shipmentLoadPicker', { binding: load, options }, []);
}
export function ShipmentOptionsList(
  options: ShipmentOptionsListOptions = {},
): ShipmentOptionsListView {
  return new Node('shipmentOptionsList', { options }, []);
}
/** Bloom `ShipmentRequestForm`: the job's `route`, and the load its binding holds. */
export function ShipmentRequestForm(
  route: RouteStopsProps,
  load: Binding<ShipmentLoad>,
  options: ShipmentRequestFormOptions = {},
): ShipmentRequestFormView {
  return new Node('shipmentRequestForm', { route, binding: load, options }, []);
}

const disabled = (d: ControlDraw) => ({ disabled: d.own('disabled')?.value });

export const LOGISTICS: Record<LogisticsKind, ControlRenderer> = {
  carrierQuoteCard: product(BloomCarrierQuoteCard, {
    slots: ['actions'],
    own: (d) => ({ density: rowDensity(d), ...disabled(d) }),
  }),
  carrierQuoteList: product(BloomCarrierQuoteList, {
    slots: ['emptyAction'],
    own: (d) => ({ density: rowDensity(d), loading: d.own('loading')?.value }),
  }),
  earningsSummary: product(BloomEarningsSummary, {
    slots: ['payoutAction'],
    lengths: ['chartHeight'],
  }),
  earningsBreakdown: product(BloomEarningsBreakdown),
  earningsPayoutRow: product(BloomEarningsPayoutRow, { press: true, slots: ['action'] }),
  jobCard: product(BloomJobCard, {
    slots: ['actions'],
    own: (d) => ({ density: rowDensity(d), ...disabled(d) }),
  }),
  jobBoard: product(BloomJobBoard, {
    slots: ['emptyAction'],
    own: (d) => ({ density: rowDensity(d), loading: d.own('loading')?.value }),
  }),
  signaturePad: product(BloomSignaturePad, {
    lengths: ['height'],
    own: disabled,
    colors: (d) => ({ ink: d.own('tint')?.value as ColorToken | undefined }),
  }),
  proofOfDelivery: product(BloomProofOfDelivery, {
    slots: ['actions'],
    lengths: ['signatureHeight'],
    own: (d) => ({ submitting: d.own('loading')?.value, ...disabled(d) }),
  }),
  vehiclePicker: product(BloomVehiclePicker, {
    binding: ['value', 'onValueChange'],
    own: disabled,
  }),
  shipmentLoadPicker: product(BloomShipmentLoadPicker, {
    binding: ['value', 'onValueChange'],
    own: disabled,
  }),
  shipmentOptionsList: product(BloomShipmentOptionsList, { own: disabled }),
  shipmentRequestForm: product(BloomShipmentRequestForm, {
    binding: ['load', 'onLoadChange'],
    slots: ['footer'],
    own: disabled,
  }),
};
