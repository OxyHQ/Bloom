import type { StyleProp, ViewStyle } from 'react-native';

/**
 * Where a scheduled eviction stands.
 *
 *   scheduled   warning   a date is set and it has not happened
 *   postponed   info      the date moved; a new one may be set
 *   suspended   success   stopped, for now (a court, an agreement, the community)
 *   executed    neutral   it happened (a dark, solid badge)
 *   cancelled   neutral   withdrawn
 */
export type EvictionStatus = 'scheduled' | 'postponed' | 'suspended' | 'executed' | 'cancelled';

export interface EvictionReportCardProps {
  /**
   * The scheduled date, pre-formatted and prominent ("Tuesday, 23 September").
   * The app owns the locale.
   */
  date: string;
  /** Pre-formatted ("09:00"). */
  time?: string;
  /**
   * A relative line the app computes ("in 3 days", "Tomorrow", "2 weeks ago").
   * The card never reads the clock.
   */
  relativeLabel?: string;
  status: EvictionStatus;
  /** Overrides the status word. */
  statusLabel?: string;
  /**
   * A COARSE area — a neighbourhood and city ("Carabanchel, Madrid") or a
   * street without a number. PRIVACY: never pass an exact address. How precise
   * this is gets decided upstream, where the report is moderated; the card
   * draws whatever it is given and has no field for a door number on purpose.
   */
  area: string;
  /** Short free strings drawn as chips ("Family with minors", "Elderly person"). */
  household?: readonly string[];
  /** Clamped to `numberOfLines`. */
  description?: string;
  /** Default `3`; `0` never clamps. */
  numberOfLines?: number;
  /** Pre-formatted ("12 people will attend"). */
  attendeesLabel?: string;
  /** Pre-formatted ("3 organisations supporting"). */
  organisationsLabel?: string;
  /** Whether the viewer said they will attend. Draws the toggle with `onAttendingChange`. */
  attending?: boolean;
  onAttendingChange?: (attending: boolean) => void;
  /** Default `"I'll be there"`. Stays the toggle's name in both states; `aria-pressed` carries the state. */
  attendLabel?: string;
  onShare?: () => void;
  /** Default `"Share"`. */
  shareLabel?: string;
  onContactSupport?: () => void;
  /** Default `"Contact support group"`. */
  contactSupportLabel?: string;
  /**
   * Checked by the community (neighbours, a housing group) — NOT by an
   * authority. The label says so; keep it that way when translating.
   */
  verified?: boolean;
  /** Default `"Community verified"`. */
  verifiedLabel?: string;
  /** The heading level of the date on web. Default `3`. */
  headingLevel?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/** What a history entry records; picks its marker icon and tone. */
export type EvictionEventKind =
  | 'published'
  | 'date-set'
  | 'postponed'
  | 'suspended'
  | 'executed'
  | 'cancelled'
  | 'mobilisation'
  | 'update';

export interface EvictionEvent {
  id?: string;
  kind: EvictionEventKind;
  title: string;
  /** Pre-formatted ("14 Aug 2026"). */
  date?: string;
  /** Where the information came from ("Court notice", "Neighbourhood assembly"). */
  source?: string;
  description?: string;
  /** Draws a hollow marker (a date that has not arrived). */
  upcoming?: boolean;
}

export interface EvictionTimelineProps {
  events: readonly EvictionEvent[];
  /** Default `(source) => \`Source: ${source}\``. */
  formatSource?: (source: string) => string;
  /** Names the list. Default `"Case history"`. */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
