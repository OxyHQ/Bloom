import { RiCalendarScheduleLine } from '../icons/remix/RiCalendarScheduleLine';
import { RiChat3Line } from '../icons/remix/RiChat3Line';
import { RiGlobalLine } from '../icons/remix/RiGlobalLine';
import { RiMailLine } from '../icons/remix/RiMailLine';
import { RiPhoneLine } from '../icons/remix/RiPhoneLine';
import { RiVideoOnLine } from '../icons/remix/RiVideoOnLine';
import type { BloomIconComponent } from '../icons/icon-component';
import type { ContactChannelKind } from './types';

/**
 * The glyph and the VERB of each channel.
 *
 * The verb is the reason this is a table rather than a label prop: a glyph
 * action draws no text, so its accessible name is built here — "Email Nora
 * Vance", "Call Nora Vance" — and a caller cannot ship an unnamed one. The verb
 * ends where the subject begins, so `${verb} ${label}` reads as a sentence for
 * every kind, including the two that need a preposition.
 */
export const CONTACT_CHANNEL: Record<
  ContactChannelKind,
  { icon: BloomIconComponent; verb: string }
> = {
  email: { icon: RiMailLine, verb: 'Email' },
  phone: { icon: RiPhoneLine, verb: 'Call' },
  chat: { icon: RiChat3Line, verb: 'Message' },
  meeting: { icon: RiCalendarScheduleLine, verb: 'Schedule a meeting with' },
  video: { icon: RiVideoOnLine, verb: 'Start a video call with' },
  website: { icon: RiGlobalLine, verb: 'Open the website of' },
};

/** Card geometry. The row is 64 tall at compact, the card 16-padded at comfortable. */
export const CONTACT_PROFILE_PADDING = 16;
export const CONTACT_ROW_MIN_HEIGHT = 64;

/**
 * The drawn size of a channel control: `Button size="small" iconOnly`, the same
 * 32 square the reference card puts in its footer.
 */
export const CONTACT_CHANNEL_SIZE = 32;

/**
 * What it is HIT at. 32 is the size a card wants and 44 is the size a thumb
 * needs, and a `hitSlop` is how both are true at once — a contact list is a
 * column of these.
 */
export const CONTACT_CHANNEL_HIT = { top: 6, bottom: 6, left: 6, right: 6 } as const;

/**
 * The leading mark. 44 at comfortable is the reference card's tile; 36 is the
 * row's.
 */
export const CONTACT_AVATAR_SIZE = { comfortable: 44, compact: 36 } as const;
