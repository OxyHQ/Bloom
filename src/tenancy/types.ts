import type { ComponentType, ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

import type { AccentTone } from '../theme/accent-colors';
import type { BloomIconComponent } from '../icons/icon-component';

/**
 * An icon COMPONENT (`RiDropLine`, not `<RiDropLine />`). The part sizes and
 * colours it, so a caller cannot pass the wrong size or a colour that ignores
 * the theme.
 */
/** @deprecated Use `BloomIconComponent` from `@oxy.so/bloom/icons`; this is an alias of it. */
export type HousingIcon = BloomIconComponent;

/** A width-driven layout: `auto` measures the part's own width. */
export type TenancyLayout = 'auto' | 'wide' | 'narrow';

// ---------------------------------------------------------------------------
//  TenancyTimeline
// ---------------------------------------------------------------------------

/**
 * `complete` draws a filled marker, `current` a filled marker with a halo and
 * the title in semibold, `upcoming` a hollow marker and secondary text.
 */
export type TenancyTimelineEventState = 'complete' | 'current' | 'upcoming';

export interface TenancyTimelineEvent {
  /** Stable key. Defaults to the index. */
  id?: string;
  title: string;
  /** Pre-formatted ("12 Mar 2026", "Yesterday, 14:10"). */
  date?: string;
  /** Who did it, or where it came from ("Marta, landlord", "Source: tenants' union"). */
  actor?: string;
  /** A longer line under the meta line. */
  description?: string;
  /** Default `complete`. */
  state?: TenancyTimelineEventState;
  /** The marker colour for `complete` and `current`. Default `primary`. */
  tone?: AccentTone;
  /** Draws the icon inside a larger marker (comfortable density only). */
  icon?: HousingIcon;
}

export type TenancyTimelineDensity = 'comfortable' | 'compact';

export interface TenancyTimelineProps {
  events: readonly TenancyTimelineEvent[];
  /** `comfortable` (default) 24 markers, body text; `compact` 10 dots, body-2 text. */
  density?: TenancyTimelineDensity;
  /** Names the list. */
  accessibilityLabel?: string;
  /** Appended to a `current` / `upcoming` event's accessible name. Defaults `"In progress"`, `"Not yet"`. */
  stateLabels?: Partial<Record<Exclude<TenancyTimelineEventState, 'complete'>, string>>;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

// ---------------------------------------------------------------------------
//  LeaseSummaryCard
// ---------------------------------------------------------------------------

export interface LeaseParty {
  name: string;
  /** "Landlord", "Tenant", "Co-tenant". */
  role: string;
  /** A URL or an `ImageResolver` id. Without it the avatar draws initials. */
  avatar?: string;
}

/** The next payment: `upcoming` info, `due` warning, `overdue` error, `paid` success. */
export type LeasePaymentStatus = 'upcoming' | 'due' | 'overdue' | 'paid';

export interface LeaseNextPayment {
  /** Pre-formatted ("€1,150"). Defaults to the card's `rent`. */
  amount?: string;
  /** Pre-formatted ("1 October"). */
  date: string;
  status: LeasePaymentStatus;
  /**
   * The badge text, relative dates included ("Due in 5 days"). The app computes
   * it — the card never reads the clock. Defaults to the status word.
   */
  statusLabel?: string;
}

export interface LeaseSummaryCardProps {
  /** The address, the card's heading. */
  title: string;
  /** The unit line ("3rd floor, door B · 2 bedrooms"). */
  subtitle?: string;
  /** The heading level announced on web. Default `3`. */
  headingLevel?: number;
  parties?: readonly LeaseParty[];
  /** Pre-formatted ("1 Sep 2025"). */
  startDate: string;
  endDate: string;
  /** Default `"Lease period"`. */
  periodLabel?: string;
  /** Pre-formatted ("8 months left"). */
  remainingLabel?: string;
  /** Share of the lease ELAPSED, 0..1. Draws the progress bar when set. */
  progress?: number;
  /** Pre-formatted ("€1,150"). */
  rent: string;
  /** Default `"Monthly rent"`. */
  rentLabel?: string;
  deposit?: string;
  /** Default `"Deposit"`. */
  depositLabel?: string;
  nextPayment?: LeaseNextPayment;
  /** Default `"Next payment"`. */
  nextPaymentLabel?: string;
  /** Buttons under the card body. */
  actions?: ReactNode;
  /** `auto` (default) puts the figures in one row from 520 wide. */
  layout?: TenancyLayout;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

// ---------------------------------------------------------------------------
//  RentPaymentList
// ---------------------------------------------------------------------------

/** `paid` success, `pending` warning, `overdue` error, `partial` info. */
export type RentPaymentStatus = 'paid' | 'pending' | 'overdue' | 'partial';

export interface RentPayment {
  id: string;
  /** Pre-formatted ("March 2026"). */
  month: string;
  /** Pre-formatted ("1 Mar 2026"). */
  dueDate: string;
  /** Pre-formatted ("€1,150", "€600 of €1,150"). */
  amount: string;
  /** "Bank transfer", "Card ending 4417". */
  method?: string;
  status: RentPaymentStatus;
  /** Overrides the status word ("Paid 2 days late"). */
  statusLabel?: string;
  /** Draws the receipt download button. */
  onDownloadReceipt?: () => void;
}

export interface RentPaymentListProps {
  payments: readonly RentPayment[];
  /** A heading over the summary. */
  title?: string;
  /** Pre-formatted total ("€9,200"). */
  paidThisYear?: string;
  /** Default `"Paid this year"`. */
  paidThisYearLabel?: string;
  /** Pre-formatted ("€1,150"). */
  outstanding?: string;
  /** Default `"Outstanding"`. */
  outstandingLabel?: string;
  /** `error` paints the outstanding figure in the error text colour. Default `default`. */
  outstandingTone?: 'default' | 'error';
  /** Overrides the default status words. */
  statusLabels?: Partial<Record<RentPaymentStatus, string>>;
  /** The receipt button's accessible name. Default `` (p) => `Download receipt for ${p.month}` ``. */
  receiptLabel?: (payment: RentPayment) => string;
  /** The wide layout's column headings. */
  columnLabels?: Partial<Record<'month' | 'dueDate' | 'method' | 'amount' | 'status', string>>;
  /** Default `(date) => \`Due ${date}\``, the narrow layout's meta line. */
  formatDueDate?: (dueDate: string) => string;
  /** Drawn when `payments` is empty. Default `"No payments yet"`. */
  emptyLabel?: string;
  /** `auto` (default) draws columns from 640 wide. */
  layout?: TenancyLayout;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

// ---------------------------------------------------------------------------
//  MaintenanceRequestCard
// ---------------------------------------------------------------------------

export type MaintenanceCategory = 'plumbing' | 'electrical' | 'appliances' | 'heating' | 'other';
/** `low` neutral, `medium` info, `high` warning, `urgent` error. */
export type MaintenancePriority = 'low' | 'medium' | 'high' | 'urgent';
/** The request's progress, in order. */
export type MaintenanceStage = 'reported' | 'acknowledged' | 'scheduled' | 'resolved';

export interface MaintenanceStageEntry {
  /** Pre-formatted ("12 Mar", "Thu 14 Mar, 9:00–11:00"). */
  date?: string;
  /** "You", "Marta (landlord)", "Fontanería Ruiz". */
  actor?: string;
}

export interface MaintenancePhoto {
  /** A URL or an `ImageResolver` id. */
  source: string;
  alt?: string;
}

export interface MaintenanceRequestCardProps {
  title: string;
  category: MaintenanceCategory;
  /** Overrides the category word ("Plumbing"). */
  categoryLabel?: string;
  /** A reference shown beside the category ("#1042"). */
  reference?: string;
  description?: string;
  photos?: readonly MaintenancePhoto[];
  /** Makes each photo a button. */
  onPressPhoto?: (index: number) => void;
  priority?: MaintenancePriority;
  /** Overrides the priority chip text ("Urgent"). */
  priorityLabel?: string;
  /** The last stage REACHED. */
  stage: MaintenanceStage;
  /** Date and actor per reached (or planned) stage. */
  stages?: Partial<Record<MaintenanceStage, MaintenanceStageEntry>>;
  /** Overrides the stage words. */
  stageLabels?: Partial<Record<MaintenanceStage, string>>;
  /** Draws the timeline. Default `true`. */
  showTimeline?: boolean;
  commentCount?: number;
  /** Default `(n) => n === 1 ? '1 comment' : \`${n} comments\``. */
  commentsLabel?: (count: number) => string;
  /** Makes the comment count a button. */
  onPressComments?: () => void;
  actions?: ReactNode;
  /** Rendition forwarded to the `ImageResolver`. Default `"thumb"`. */
  photoVariant?: string;
  /** A photo's accessible name. Default `"<alt>, photo 1 of 3"`. */
  photoLabel?: (photo: MaintenancePhoto, position: number, total: number) => string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

// ---------------------------------------------------------------------------
//  DocumentList
// ---------------------------------------------------------------------------

export type TenancyDocumentType = 'pdf' | 'image' | 'document' | 'other';
/** `signed` success, `pending` warning, `expired` error. */
export type TenancyDocumentStatus = 'signed' | 'pending' | 'expired';

export interface TenancyDocument {
  id: string;
  name: string;
  /** Picks the file icon. Default `other`. */
  type?: TenancyDocumentType;
  /** Pre-formatted ("240 KB"). */
  size?: string;
  /** Pre-formatted ("Signed 2 Sep 2025"). */
  date?: string;
  status?: TenancyDocumentStatus;
  /** Overrides the status word ("Awaiting landlord"). */
  statusLabel?: string;
  onView?: () => void;
  onDownload?: () => void;
  /** Draws the Sign button — typically only while `pending`. */
  onSign?: () => void;
}

export interface DocumentListProps {
  documents: readonly TenancyDocument[];
  /** Overrides the default status words. */
  statusLabels?: Partial<Record<TenancyDocumentStatus, string>>;
  /** Default `"Sign"`. */
  signLabel?: string;
  /** Default `(d) => \`View ${d.name}\``. */
  viewLabel?: (document: TenancyDocument) => string;
  /** Default `(d) => \`Download ${d.name}\``. */
  downloadLabel?: (document: TenancyDocument) => string;
  /** Drawn when `documents` is empty. Default `"No documents"`. */
  emptyLabel?: string;
  /** `auto` (default) puts the status beside the name from 560 wide. */
  layout?: TenancyLayout;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
