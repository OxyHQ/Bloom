import { RADIUS } from '../design-tokens/scales';
import { RiCalendarScheduleLine } from '../icons/remix/RiCalendarScheduleLine';
import { RiChat3Line } from '../icons/remix/RiChat3Line';
import { RiGlobalLine } from '../icons/remix/RiGlobalLine';
import { RiMailLine } from '../icons/remix/RiMailLine';
import { RiPhoneLine } from '../icons/remix/RiPhoneLine';
import { RiVideoOnLine } from '../icons/remix/RiVideoOnLine';
import type { BloomIconComponent } from '../icons/icon-component';
import type { ContactChannelKind } from './types';

/**
 * The glyph, the ACTION word and the VERB of each channel.
 *
 * `action` is what the button is LABELLED with on a card wide enough to carry a
 * label — one word, an imperative, the way every other Bloom action reads.
 * `verb` is what the button is NAMED with, and it is a table rather than a prop
 * because the same control loses its label on a narrow card: the accessible
 * name has to survive that, and building it here means a caller cannot ship an
 * unnamed glyph by forgetting a prop. The verb ends where the subject begins,
 * so `${verb} ${label}` reads as a sentence for every kind, including the two
 * that need a preposition.
 */
export const CONTACT_CHANNEL: Record<
  ContactChannelKind,
  { icon: BloomIconComponent; action: string; verb: string }
> = {
  email: { icon: RiMailLine, action: 'Email', verb: 'Email' },
  phone: { icon: RiPhoneLine, action: 'Call', verb: 'Call' },
  chat: { icon: RiChat3Line, action: 'Message', verb: 'Message' },
  meeting: { icon: RiCalendarScheduleLine, action: 'Meet', verb: 'Schedule a meeting with' },
  video: { icon: RiVideoOnLine, action: 'Video', verb: 'Start a video call with' },
  website: { icon: RiGlobalLine, action: 'Website', verb: 'Open the website of' },
};

/** The card's inset, and the row's minimum height at `compact`. */
export const CONTACT_PROFILE_PADDING = 16;
export const CONTACT_ROW_MIN_HEIGHT = 64;

/**
 * The cover band across the top of the comfortable card, and how far the mark
 * hangs below it.
 *
 * The overlap is HALF the mark, which is the only value that needs no judgement
 * — the disc sits exactly on the band's edge. Nothing here is a negative
 * margin: the band is absolutely positioned over the top of the card and the
 * content simply starts `COVER_HEIGHT - OVERLAP` down, so the mark is the first
 * thing in normal flow and everything under it stacks without an offset.
 */
export const CONTACT_COVER_HEIGHT = 96;
export const CONTACT_AVATAR_OVERLAP = 36;
export const CONTACT_CONTENT_TOP = CONTACT_COVER_HEIGHT - CONTACT_AVATAR_OVERLAP;

/** The leading mark: 72 on the card (it overlaps the cover), 36 in a row. */
export const CONTACT_AVATAR_SIZE = { comfortable: 72, compact: 36 } as const;

/** The owner's mark in the attribution line. */
export const CONTACT_OWNER_AVATAR_SIZE = 20;

/**
 * The drawn size of a channel control: `Button size="small"`, labelled where
 * there is room and `iconOnly` where there is not.
 */
export const CONTACT_CHANNEL_SIZE = 32;

/**
 * What it is HIT at. 32 is the size a card wants and 44 is the size a thumb
 * needs, and a `hitSlop` is how both are true at once — a contact list is a
 * column of these.
 */
export const CONTACT_CHANNEL_HIT = { top: 6, bottom: 6, left: 6, right: 6 } as const;

/**
 * Under this OWN width (not the window's), the card drops its action labels to
 * glyphs and stacks the stat tiles two by two.
 *
 * 480 is where four tiles stop being readable: at 480 the content column is 448
 * and a tile is 106 wide, which carries "Last touch" and "€248,000"; a step
 * narrower truncates both. The action labels go at the same point rather than
 * at a second threshold — a card that is too narrow for four tiles is too
 * narrow for three labelled buttons beside a 72 mark.
 */
export const CONTACT_NARROW_WIDTH = 480;

/** A stat tile: value over label, on the next fill up from the card. */
export const CONTACT_TILE_RADIUS = RADIUS['radius-12'];
export const CONTACT_TILE_PADDING = 12;
