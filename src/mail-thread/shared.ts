import { Platform } from 'react-native';

import type { MailThreadMessage, MailAddress, MailThreadStrings } from './types';

export const IS_WEB = Platform.OS === 'web';

// ---------------------------------------------------------------------------
//  Geometry
//
//  One table, so the collapsed and the expanded message keep the SAME outer
//  padding and the SAME leading column. A transition between two states that
//  each chose their own padding is the gap the expansion appears to leave.
// ---------------------------------------------------------------------------

/**
 * The width a message needs before its reply actions keep their words. Under
 * it the group is glyphs, named by `accessibilityLabel` — measured at 390,
 * where three labelled actions ran past the card's own edge.
 */
export const MAIL_REPLY_LABELS_FROM = 320;

/**
 * Whether a message this wide keeps the WORDS on its reply actions. `null` is
 * the frame before the first layout, and it keeps them: a group that started
 * as glyphs and grew labels flickers on every mount, where one that starts with
 * labels and drops them only ever does so on a narrow screen, once.
 */
export function replyLabelsFit(width: number | null): boolean {
  return width === null || width >= MAIL_REPLY_LABELS_FROM;
}

export const MAIL_THREAD_GEOMETRY = {
  /** The message's own horizontal padding. */
  paddingHorizontal: 16,
  /** The header row's vertical padding, identical in both states. */
  paddingVertical: 12,
  /** The avatar in the leading column. */
  avatar: 32,
  /** Avatar → text column. */
  gap: 12,
  /** The inline glyphs — paperclip, chevron. */
  glyph: 16,
  /** The star and the overflow trigger. A touch target, so 44. */
  action: 44,
  /** Radius of a message's own surface. */
  radius: 12,
} as const;

/**
 * How far the BODY is indented, so it starts under the sender's name rather
 * than under the avatar. Derived, never written twice.
 */
export const MAIL_BODY_INSET =
  MAIL_THREAD_GEOMETRY.paddingHorizontal +
  MAIL_THREAD_GEOMETRY.avatar +
  MAIL_THREAD_GEOMETRY.gap;

// ---------------------------------------------------------------------------
//  Strings
// ---------------------------------------------------------------------------

export const DEFAULT_MAIL_THREAD_STRINGS: MailThreadStrings = {
  to: 'To',
  cc: 'Cc',
  bcc: 'Bcc',
  reply: 'Reply',
  replyAll: 'Reply all',
  forward: 'Forward',
  more: 'More',
  moreAddresses: (count) => `${count} more`,
  earlierMessages: (count) => (count === 1 ? '1 earlier message' : `${count} earlier messages`),
  showTrimmed: 'Show trimmed content',
  hideTrimmed: 'Hide trimmed content',
  unread: 'Unread',
  starred: 'Starred',
  star: 'Star',
  attachments: 'Attachments',
  attachmentCount: (count) => (count === 1 ? '1 attachment' : `${count} attachments`),
  expand: 'Expand message',
  collapse: 'Collapse message',
};

export function mailThreadStrings(overrides?: Partial<MailThreadStrings>): MailThreadStrings {
  return overrides === undefined
    ? DEFAULT_MAIL_THREAD_STRINGS
    : { ...DEFAULT_MAIL_THREAD_STRINGS, ...overrides };
}

// ---------------------------------------------------------------------------
//  Pure logic
// ---------------------------------------------------------------------------

/** What a header line calls one person: their name, or the address itself. */
export function addressName(address: MailAddress): string {
  return address.name !== undefined && address.name.length > 0 ? address.name : address.address;
}

/**
 * The names an address line draws, and how many it swallowed.
 *
 * `max` counts NAMES, not chips — the "+N more" is a control beside them, so
 * three of five shows three names and a "+2". Pure.
 */
export function visibleAddresses(
  addresses: readonly MailAddress[],
  max: number,
): { shown: readonly MailAddress[]; overflow: number } {
  if (max <= 0 || addresses.length <= max) return { shown: addresses, overflow: 0 };
  return { shown: addresses.slice(0, max), overflow: addresses.length - max };
}

/** One entry of the stack a thread draws. */
export type MailThreadEntry =
  | { kind: 'message'; message: MailThreadMessage }
  | { kind: 'collapsed'; count: number; ids: readonly string[] };

/**
 * The stack, with the MIDDLE folded behind one "N earlier messages" button.
 *
 * The first message is the one that started the conversation and the last two
 * are what it is about now, so those three are always drawn; everything between
 * them folds. Below the threshold nothing folds at all — a button hiding one
 * message costs a press and saves a row.
 *
 * `collapseAfter` is the number of messages above which the fold appears, and
 * `0` disables it. Pure, and it never reorders: the entries come back in the
 * input's order, which is the order a thread is read in.
 */
export function collapseThread(
  messages: readonly MailThreadMessage[],
  collapseAfter: number,
): MailThreadEntry[] {
  const KEPT_HEAD = 1;
  const KEPT_TAIL = 2;
  if (collapseAfter <= 0 || messages.length <= Math.max(collapseAfter, KEPT_HEAD + KEPT_TAIL + 1)) {
    return messages.map((message) => ({ kind: 'message', message }));
  }
  const hidden = messages.slice(KEPT_HEAD, messages.length - KEPT_TAIL);
  return [
    { kind: 'message' as const, message: messages[0] as MailThreadMessage },
    { kind: 'collapsed' as const, count: hidden.length, ids: hidden.map((m) => m.id) },
    ...messages.slice(messages.length - KEPT_TAIL).map((message) => ({
      kind: 'message' as const,
      message,
    })),
  ];
}

/**
 * Which messages are open when the app has not said.
 *
 * The NEWEST, and only the newest. A thread that opened everything would make
 * the reader scroll past what they have already read to reach what they have
 * not; one that opened nothing would make every arrival a press. Pure.
 */
export function defaultExpandedIds(messages: readonly MailThreadMessage[]): string[] {
  const last = messages[messages.length - 1];
  return last === undefined ? [] : [last.id];
}

// ---------------------------------------------------------------------------
//  Web stylesheet — the focus ring the message headers and the toggles share.
// ---------------------------------------------------------------------------

export const MAIL_THREAD_STYLE_ID = 'bloom-mail-thread-web-css';

const FOCUSABLE = '[data-bloom-mail-thread-focusable]';

export const MAIL_THREAD_CSS = `
${FOCUSABLE} {
  outline: none;
  cursor: pointer;
  user-select: none;
}
${FOCUSABLE}:focus-visible {
  outline: 2px solid var(--bloom-mail-ring, currentColor);
  outline-offset: -2px;
}
`;
