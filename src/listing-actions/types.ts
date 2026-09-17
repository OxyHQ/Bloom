import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

import type { BookingPriceProps } from '../booking/types';
import type { ButtonIconComponent } from '../button/types';

// ---------------------------------------------------------------------------
//  Shared
// ---------------------------------------------------------------------------

/** One label / value row of a card's key facts ("Deposit" — "€2,500"). */
export interface KeyFact {
  /** React key; defaults to `label`. */
  key?: string;
  label: string;
  value: string;
}

// ---------------------------------------------------------------------------
//  RentalActionCard
// ---------------------------------------------------------------------------

/** `reserved` and `rented` disable the actions and show the status message. */
export type RentalStatus = 'available' | 'reserved' | 'rented';

export interface RentalActionCardProps extends BookingPriceProps {
  /** Default `"month"`, drawn "/ month". */
  priceUnit?: string;
  /** Default `"/"`. */
  priceUnitPrefix?: string;
  /** Under the price: "Bills included", "Bills not included". */
  billsNote?: string;
  /** Deposit, Available from, Minimum stay, Contract type… as label / value rows. */
  facts?: readonly KeyFact[];
  /** Default `'available'`. */
  status?: RentalStatus;
  /** The status badge's text. Default "Reserved" / "Rented". */
  statusLabel?: string;
  /** The line replacing the note while not available. Default per status (`RENTAL_STATUS`). */
  statusMessage?: string;
  /** Default `"Request a viewing"`. */
  requestViewingLabel?: string;
  onRequestViewing?: () => void;
  /** Default `"Apply"`. */
  applyLabel?: string;
  /** Omit to draw no Apply button. */
  onApply?: () => void;
  /** Spinner in the primary button; presses are ignored. */
  loading?: boolean;
  /** The centred line under the buttons ("Usually responds within a day"). */
  note?: ReactNode;
  /** Below everything, e.g. a "Report this listing" link. */
  footer?: ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

// ---------------------------------------------------------------------------
//  SaleActionCard
// ---------------------------------------------------------------------------

export type SaleStatus = 'available' | 'reserved' | 'sold';

export interface SaleActionCardProps extends BookingPriceProps {
  /** Pre-formatted price per area ("€4,120 / m²"), under the price. */
  pricePerArea?: string;
  /** The mortgage teaser ("Est. €1,040/month"); a link with `onPressMortgage`. */
  mortgageEstimate?: string;
  /** Open your `MortgageCalculator` here. */
  onPressMortgage?: () => void;
  /** Key facts under the header (Bedrooms, Built, Energy rating…). */
  facts?: readonly KeyFact[];
  /** Default `'available'`. */
  status?: SaleStatus;
  /** Default "Reserved" / "Sold". */
  statusLabel?: string;
  /** Default per status (`SALE_STATUS`). */
  statusMessage?: string;
  /** Default `"Contact agent"`. */
  contactLabel?: string;
  onContact?: () => void;
  /** Default `"Request a visit"`. */
  requestVisitLabel?: string;
  /** Omit to draw no secondary button. */
  onRequestVisit?: () => void;
  /** Default `"Make an offer"`. */
  makeOfferLabel?: string;
  /** Draws the "Make an offer" link. */
  onMakeOffer?: () => void;
  loading?: boolean;
  note?: ReactNode;
  footer?: ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

// ---------------------------------------------------------------------------
//  ExchangeProposalCard
// ---------------------------------------------------------------------------

/** `swap` reciprocal, `host` a stay paid in guest points, `both` either. */
export type ExchangeMode = 'swap' | 'host' | 'both';

/** `auto` stacks the homes when the card is narrower than 360. */
export type ExchangeLayout = 'auto' | 'horizontal' | 'vertical';

export interface ExchangeHome {
  /** An absolute URL, or an id resolved through `ImageResolverProvider`. */
  image?: string;
  imageVariant?: string;
  /** "Stone house near the harbour". */
  title: string;
  /** "Porto Lindo". */
  location?: string;
  /** Pre-formatted size ("3 beds · 6 guests"). */
  details?: string;
}

export interface ExchangeProposalCardProps {
  yourHome: ExchangeHome;
  theirHome: ExchangeHome;
  /** Default `"Your home"`. */
  yourHomeLabel?: string;
  /** Default `"Their home"`. */
  theirHomeLabel?: string;
  /** Pre-formatted range ("Jul 4 – 18"); omit while unselected. */
  dates?: string;
  onPressDates?: () => void;
  /** Pre-formatted guests ("4 guests"). */
  guests?: string;
  onPressGuests?: () => void;
  /** Default `"Dates"`. */
  datesLabel?: string;
  /** Default `"Guests"`. */
  guestsLabel?: string;
  /** Default `"Add dates"`. */
  datesPlaceholder?: string;
  /** Default `"Add guests"`. */
  guestsPlaceholder?: string;
  /** The selected swap mode. Omit to draw no mode chips. */
  mode?: ExchangeMode;
  onModeChange?: (mode: ExchangeMode) => void;
  /** The modes offered, in order. Default all three. */
  modes?: readonly ExchangeMode[];
  /** Override chip texts. Default "Reciprocal swap", "Guest points", "Either". */
  modeLabels?: Partial<Record<ExchangeMode, string>>;
  /** Default `"Propose a swap"`. */
  proposeLabel?: string;
  onPropose?: () => void;
  proposeDisabled?: boolean;
  loading?: boolean;
  note?: ReactNode;
  footer?: ReactNode;
  /** Default `'auto'`. */
  layout?: ExchangeLayout;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

// ---------------------------------------------------------------------------
//  ViewingScheduler
// ---------------------------------------------------------------------------

export interface ViewingDay {
  /** The value handed to `onDayChange`. */
  value: string;
  /** "Mon". */
  weekday: string;
  /** "14". */
  day: string;
  /** Unavailable: drawn faded, not selectable. */
  disabled?: boolean;
  /** Spoken name. Default "Mon 14"; a disabled day also carries the disabled state. */
  accessibilityLabel?: string;
}

export interface ViewingSlot {
  value: string;
  /** "10:30". */
  label: string;
  disabled?: boolean;
  accessibilityLabel?: string;
}

export type ViewingMode = 'in-person' | 'video';

export interface ViewingSchedulerProps {
  /** Default `"Schedule a viewing"`; `null` draws no title. */
  title?: string | null;
  days: readonly ViewingDay[];
  day?: string | null;
  onDayChange?: (value: string) => void;
  /** The slots of the selected day. */
  slots: readonly ViewingSlot[];
  slot?: string | null;
  onSlotChange?: (value: string) => void;
  /** Shown instead of the grid when `slots` is empty. Default "No times left on this day". */
  emptySlotsLabel?: string;
  /** Omit to draw no in-person / video toggle. */
  mode?: ViewingMode;
  onModeChange?: (mode: ViewingMode) => void;
  /** Default "In person" / "Video call". */
  modeLabels?: Partial<Record<ViewingMode, string>>;
  /** Omit `onNoteChange` to draw no note field. */
  note?: string;
  onNoteChange?: (note: string) => void;
  /** Default `"Note for the landlord"`. */
  noteLabel?: string;
  notePlaceholder?: string;
  /** Default `"Day"`, `"Time"`. Names the groups. */
  dayLabel?: string;
  timeLabel?: string;
  /** Default `"Request viewing"`. */
  submitLabel?: string;
  onSubmit?: () => void;
  /** Default: disabled until a day and a slot are chosen. */
  submitDisabled?: boolean;
  loading?: boolean;
  footer?: ReactNode;
  /** Default 372 like every action card; `null` fills the column. */
  maxWidth?: number | null;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

// ---------------------------------------------------------------------------
//  MortgageCalculator
// ---------------------------------------------------------------------------

export interface MortgageInput {
  /** Property price. */
  price: number;
  /** Amount paid up front; clamped to `0…price`. */
  downPayment: number;
  /** Loan term in years. */
  years: number;
  /** Nominal annual interest rate in PERCENT (`3.5` is 3.5%). */
  annualRate: number;
}

export interface MortgageResult {
  /** `price − downPayment`. */
  loanAmount: number;
  /** Monthly repayment of an annuity loan (fixed instalment). */
  monthlyPayment: number;
  /** `years × 12`. */
  payments: number;
  /** Everything repaid on the loan: `monthlyPayment × payments`. */
  totalRepaid: number;
  /** `totalRepaid − loanAmount`. */
  totalInterest: number;
  /** Down payment plus everything repaid. */
  totalCost: number;
}

export interface MortgageCalculatorLabels {
  title: string;
  price: string;
  downPayment: string;
  /** Names the percent field and the slider. */
  downPaymentPercent: string;
  /** The percent field's visible label. */
  percent: string;
  term: string;
  years: string;
  rate: string;
  monthlyPayment: string;
  principal: string;
  interest: string;
  loanAmount: string;
  totalInterest: string;
  totalCost: string;
}

export interface MortgageCalculatorProps {
  price?: number;
  defaultPrice?: number;
  onPriceChange?: (price: number) => void;
  downPayment?: number;
  defaultDownPayment?: number;
  onDownPaymentChange?: (amount: number) => void;
  years?: number;
  defaultYears?: number;
  onYearsChange?: (years: number) => void;
  /** Percent (`3.5`). */
  annualRate?: number;
  defaultAnnualRate?: number;
  onAnnualRateChange?: (rate: number) => void;
  /** Term chips. Default 10, 15, 20, 25, 30. */
  termOptions?: readonly number[];
  /** Formats every amount. Default: rounded, grouped digits, no currency. */
  formatCurrency?: (value: number) => string;
  labels?: Partial<MortgageCalculatorLabels>;
  /** Under the result. Default "An estimate, not an offer…"; `null` hides it. */
  disclaimer?: ReactNode;
  /** `auto` puts the result beside the inputs from 640 wide. */
  layout?: 'auto' | 'stacked' | 'split';
  /** Default `null` (fills its column). */
  maxWidth?: number | null;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

// ---------------------------------------------------------------------------
//  ApplicationChecklist
// ---------------------------------------------------------------------------

export type ApplicationItemStatus = 'missing' | 'uploaded' | 'verified' | 'rejected';

export interface ApplicationItem {
  key: string;
  /** "Proof of identity". */
  title: string;
  /** "Passport or national ID, both sides". */
  description?: string;
  status: ApplicationItemStatus;
  /** Why it was rejected; shown in place of the description. */
  reason?: string;
  /** Default per status: Upload, View, View, Replace. `null` draws no button. */
  actionLabel?: string | null;
  /** Default `onItemAction`. */
  onAction?: () => void;
}

export interface ApplicationChecklistProps {
  /** Default `"Your application"`; `null` draws none. */
  title?: string | null;
  items: readonly ApplicationItem[];
  onItemAction?: (item: ApplicationItem) => void;
  /** Default "{done} of {total} ready". */
  formatProgress?: (done: number, total: number) => string;
  /** Override the status badge texts. */
  statusLabels?: Partial<Record<ApplicationItemStatus, string>>;
  footer?: ReactNode;
  /** Default 560; `null` fills the column. */
  maxWidth?: number | null;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

// ---------------------------------------------------------------------------
//  ActionBar
// ---------------------------------------------------------------------------

export interface ActionBarProps extends BookingPriceProps {
  /** Under the price ("Oct 12 – 17", "Available from Sep 1"). */
  subtitle?: string;
  /** Makes `subtitle` an underlined button. */
  onPressSubtitle?: () => void;
  primaryLabel: string;
  onPrimary?: () => void;
  primaryDisabled?: boolean;
  /** Spinner in the primary button. */
  loading?: boolean;
  /** An icon-only secondary button left of the primary one (save, share). */
  secondaryIcon?: ButtonIconComponent;
  /** The icon button's accessible name — required with `secondaryIcon`. */
  secondaryLabel?: string;
  onSecondary?: () => void;
  /**
   * Extra space under the content. Default: the safe-area bottom inset from
   * `react-native-safe-area-context` when a provider is mounted, else 0.
   */
  bottomInset?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
