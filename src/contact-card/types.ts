import type { ReactNode } from 'react';
import type { ImageSourcePropType, StyleProp, ViewStyle } from 'react-native';

import type { BloomIconComponent } from '../icons/icon-component';
import type { AccentTone } from '../theme/accent-colors';

/**
 * WHO the card is about. It is data rather than a second component: a company
 * card is the same card with a logo instead of a photo, an industry instead of a
 * job title, and the people at it instead of the account it belongs to.
 */
export type ContactSubjectKind = 'person' | 'company';

/**
 * `comfortable` is the card — a cover band, a 72 mark, the figure, the tiles,
 * the chips, the people and the owner. `compact` is the ROW form for a list: no
 * surface and no cover (the list owns both), one line of identity, one meta
 * line, and the channel actions as glyphs beside them.
 */
export type ContactProfileDensity = 'comfortable' | 'compact';

/** The ways a sales team reaches a customer. Each is an ACTION, never a string of text. */
export type ContactChannelKind = 'email' | 'phone' | 'chat' | 'meeting' | 'video' | 'website';

export interface ContactChannel {
  kind: ContactChannelKind;
  /**
   * What the action's name ends with — "Email {this}". Defaults to the card's
   * `name`, which is the usual reading ("Call Nora Vance").
   */
  label?: string;
  onPress?: () => void;
  disabled?: boolean;
  /** Overrides the kind's glyph. The kind still decides the verb in the name. */
  icon?: BloomIconComponent;
  testID?: string;
}

/** Who on the team owns the relationship. */
export interface ContactOwner {
  name: string;
  /** A URL or an `ImageResolver` id. Without it the avatar draws initials. */
  avatar?: string;
  /** The word before the name. Default `"Owner"`. */
  label?: string;
}

/** One of the people at a company, or a colleague of a person. */
export interface ContactProfilePerson {
  id?: string;
  name: string;
  /** A URL or an `ImageResolver` id. */
  avatar?: string;
}

/**
 * One tile of the stat row: the pre-formatted figure over what it counts.
 *
 * `value` first and `label` under it, because the row is SCANNED for numbers —
 * the label is what you read once the number has stopped you.
 */
export interface ContactProfileStat {
  /** Pre-formatted ("12", "€248,000", "6 days ago"). The app owns the arithmetic. */
  value: string;
  /** What it counts ("Open deals", "Pipeline", "Last touch"). */
  label: string;
}

/**
 * The one figure the record is opened for, over the tiles: a quiet label, the
 * number at title size, and an optional tinted delta beside it.
 */
export interface ContactProfileHeadline {
  /** The quiet label over the figure ("Open pipeline"). */
  label: string;
  /** Pre-formatted ("€248,000"). */
  value: string;
  /** The pill beside it ("+2 deals this month"). No pill when omitted. */
  delta?: string;
  /** The delta's tone. Default `success`. */
  deltaTone?: AccentTone;
}

/** A short status word beside the name — "Customer", "Do not contact", "New". */
export interface ContactStatus {
  label: string;
  /** Default `default`, the neutral pill. */
  tone?: AccentTone;
}

export interface ContactProfileCardProps {
  /** Default `person`. */
  kind?: ContactSubjectKind;
  /** The person's name, or the company's. */
  name: string;
  /** A person's job title, or a company's industry. */
  role?: string;
  /** The account a person belongs to. Ignored when `kind` is `company`. */
  company?: string;
  /** Photo or logo: a URL or an `ImageResolver` id. Without it the avatar draws a monogram. */
  avatar?: string;
  /**
   * The image across the cover band. Without one the band is an accent wash in
   * `coverTone` — a record always has a cover, because the mark overlaps it and
   * a mark hanging off nothing is the one arrangement that reads as a mistake.
   * `compact` draws no band at all.
   */
  coverSource?: string | ImageSourcePropType | null;
  /** The wash behind the cover when there is no image. Default `primary`. */
  coverTone?: AccentTone;
  status?: ContactStatus;
  /** Reachable channels, drawn as glyph actions in the order given. */
  channels?: readonly ContactChannel[];
  owner?: ContactOwner;
  /**
   * The figure over the tiles. `comfortable` only.
   */
  headline?: ContactProfileHeadline;
  /**
   * The numbers a CRM record is read for — open deals, pipeline, last touch,
   * reply time. One row of tiles from {@link CONTACT_NARROW_WIDTH} up, two
   * columns below it. `comfortable` only.
   */
  stats?: readonly ContactProfileStat[];
  /**
   * Read-only attribute pills, in the chip row UNDER the tiles. The INPUT for
   * these is `tag-field`, a family of its own — this card never edits a tag.
   */
  tags?: readonly string[];
  /**
   * Pre-formatted ("Last contacted 6 days ago"). The app owns the arithmetic.
   * The first chip of the row on a card; a quiet third line in a row.
   */
  lastTouch?: string;
  /** Colours `lastTouch` through the accent pair. Omitted, it is quiet text. */
  lastTouchTone?: AccentTone;
  /**
   * Short unlabelled facts — "48 people", "Madrid", "Customer since 2024". They
   * join the chip row after the last touch. A fact with a LABEL is a `stats`
   * tile instead, and a number a record is read for belongs there.
   */
  facts?: readonly string[];
  /** The people at the company, or the colleagues of a person. `comfortable` only. */
  people?: readonly ContactProfilePerson[];
  /** The caption beside the facepile ("12 people"). */
  peopleLabel?: string;
  /** Real total, when `people` is a sample. Drives the `+N` chip. */
  peopleTotal?: number;
  /** Default `comfortable`. */
  density?: ContactProfileDensity;
  /**
   * Opens the record. It is bound to the IDENTITY BLOCK, not to the whole card —
   * see `docs/contact-card.mdx`; the channel actions sit outside it so nothing
   * nests a control inside a control.
   */
  onPress?: () => void;
  /** Trailing slot, outside the press target: a menu trigger, an assign button. */
  actions?: ReactNode;
  /** Names the press target. Defaults to the name, the role and the company. */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
