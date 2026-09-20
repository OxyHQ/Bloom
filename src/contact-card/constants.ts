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
 * The channel target, in both densities. 44 rather than the 36 a glyph needs,
 * because it is the smallest target a finger hits reliably and a contact row is
 * a list of them.
 */
export const CONTACT_CHANNEL_SIZE = 44;

/** Avatar diameter per density. */
export const CONTACT_AVATAR_SIZE = { comfortable: 48, compact: 36 } as const;
