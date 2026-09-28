import { Platform } from 'react-native';

import { MAIL_COMPOSE_MESSAGES } from './messages';
import type { MailComposeStrings, MailRecipient, MailRecipientSuggestion } from './types';

export const IS_WEB = Platform.OS === 'web';

// ---------------------------------------------------------------------------
//  Geometry
// ---------------------------------------------------------------------------

export const MAIL_COMPOSE_GEOMETRY = {
  /** The title bar of either variant. */
  barHeight: 48,
  /** One recipient/subject row's minimum height — a 40 chip plus its padding. */
  rowMinHeight: 48,
  paddingHorizontal: 16,
  /**
   * The "To" / "Cc" / "Bcc" / "Subject" gutter column. ONE width for all four,
   * so the chips and the subject sit on a single left margin — and wide enough
   * for the longest of the four words, which is "Subject" (measured: 36 clipped
   * it to "Su…").
   */
  labelWidth: 56,
  /** The docked panel's own surface radius. */
  radius: 14,
  /** The round bar and footer controls. Touch targets, so 44. */
  action: 44,
  actionGlyph: 20,
} as const;

// ---------------------------------------------------------------------------
//  Strings
// ---------------------------------------------------------------------------

/**
 * The English strings. Components speak the LOCALE's (`MAIL_COMPOSE_MESSAGES`,
 * through `BloomProvider locale`); this stays exported as the English set.
 */
export const DEFAULT_MAIL_COMPOSE_STRINGS: MailComposeStrings = MAIL_COMPOSE_MESSAGES.en;

/** `base` (the locale's strings, English by default) with the caller's overrides laid over it. */
export function mailComposeStrings(
  overrides?: Partial<MailComposeStrings>,
  base: MailComposeStrings = DEFAULT_MAIL_COMPOSE_STRINGS,
): MailComposeStrings {
  return overrides === undefined ? base : { ...base, ...overrides };
}

// ---------------------------------------------------------------------------
//  Pure logic
// ---------------------------------------------------------------------------

/** What a chip calls one recipient: their name, or the address itself. */
export function recipientName(recipient: MailRecipient | MailRecipientSuggestion): string {
  return recipient.name !== undefined && recipient.name.length > 0
    ? recipient.name
    : recipient.address;
}

/**
 * Whether the FIELD is invalid — its own flag, or any recipient's.
 *
 * It combines with `||` and never `??`, for the reason `useFieldMembership`
 * gives: invalidity RESTRICTS, so neither side can clear the other's. A field
 * told it is invalid stays invalid however good its recipients look, and a good
 * field holding one rejected address is not a good field. Pure.
 */
export function recipientsInvalid(
  recipients: readonly MailRecipient[],
  own: boolean | undefined,
): boolean {
  return own === true || recipients.some((recipient) => recipient.invalid === true);
}

/**
 * Whether the cc/bcc rows start open.
 *
 * A reply-all that hid its own copies would be a message going to people the
 * writer cannot see, so a non-empty cc or bcc forces them open regardless of
 * what the reveal last said. Pure.
 */
export function copiesOpen(
  visible: boolean | undefined,
  cc: readonly MailRecipient[] | undefined,
  bcc: readonly MailRecipient[] | undefined,
): boolean {
  if ((cc ?? []).length > 0 || (bcc ?? []).length > 0) return true;
  return visible === true;
}

// ---------------------------------------------------------------------------
//  Web stylesheet — the inline input's own reset, and the focus ring.
// ---------------------------------------------------------------------------

export const MAIL_COMPOSE_STYLE_ID = 'bloom-mail-compose-web-css';

const FOCUSABLE = '[data-bloom-mail-compose-focusable]';
const INPUT = '[data-bloom-mail-compose-input]';

export const MAIL_COMPOSE_CSS = `
${FOCUSABLE} {
  outline: none;
  cursor: pointer;
  user-select: none;
}
${FOCUSABLE}:focus-visible {
  outline: 2px solid var(--bloom-mail-ring, currentColor);
  outline-offset: -2px;
}
${INPUT} {
  outline: none;
}
`;
