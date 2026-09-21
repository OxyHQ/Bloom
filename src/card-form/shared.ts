/**
 * Everything this family knows how to do to a string, as pure functions.
 *
 * It is a SHORT list on purpose. `docs/card-form.mdx` says it loudly and so
 * does this file: Bloom is an input surface. It does not validate a live
 * primary account number beyond its length and its check digit, it ships no
 * table of schemes and no ranges, it never stores a value, never logs one and
 * never opens a connection. The app's own payment SDK owns the value; what is
 * here is grouping, a caret rule and two arithmetic checks a caller can run
 * before it hands that SDK anything.
 *
 * Pure, so `CardForm.test.tsx` measures the caret rule and the check digit
 * without rendering anything.
 */
import type { CardScheme } from './types';

/** Four groups of four: what a caller gets when it names no scheme. */
export const DEFAULT_CARD_GROUPS: readonly number[] = [4, 4, 4, 4];

/** The accepted digit counts when a scheme names none. */
export const DEFAULT_CARD_LENGTHS: readonly number[] = [16];

/** The security code's digit count when a scheme names none. */
export const DEFAULT_SECURITY_CODE_LENGTH = 3;

/** Everything that is not a digit, gone. */
export function cardDigits(text: string): string {
  return text.replace(/\D/g, '');
}

/**
 * The digits, with a single space between each group.
 *
 * NO TRAILING SEPARATOR, ever, and that is the load-bearing property: a group
 * that ended in a space would need two backspaces to lose one digit, because
 * the first would delete a separator this function immediately puts back.
 * Digits beyond the last named group fall into one final run, so a longer
 * number than a scheme expected is still readable rather than jammed together.
 */
export function groupCardDigits(digits: string, groups: readonly number[] = DEFAULT_CARD_GROUPS): string {
  const out: string[] = [];
  let index = 0;
  for (const size of groups) {
    if (index >= digits.length) break;
    out.push(digits.slice(index, index + size));
    index += size;
  }
  if (index < digits.length) out.push(digits.slice(index));
  return out.join(' ');
}

/**
 * ONE EDIT OF A CARD NUMBER, AND THE CARET NEVER MOVES.
 *
 * Re-grouping a string that the user is editing in the MIDDLE of is what makes
 * a card field feel broken: the value changes ahead of the caret, the platform
 * puts the caret back at the end, and the next keystroke lands in the wrong
 * place. Both platforms do it, and no test of a controlled input can see it,
 * because the value is right and only the selection is wrong.
 *
 * So grouping is applied only to an edit at the END — typing on, or
 * backspacing off, the tail — which is the case where the caret belongs at the
 * end anyway. An edit anywhere else is handed back as the user typed it, minus
 * anything that is neither a digit nor a space, and `normaliseCardNumber`
 * re-groups it when the field is left.
 *
 * An edit that would push the number past `maxDigits` is refused outright:
 * returning a truncated value would move the caret too.
 */
export function applyCardNumberEdit(
  previous: string,
  next: string,
  groups: readonly number[] = DEFAULT_CARD_GROUPS,
  maxDigits = 19,
): string {
  const nextDigits = cardDigits(next);
  if (nextDigits.length > maxDigits) return previous;
  const previousDigits = cardDigits(previous);
  const atEnd =
    previousDigits.startsWith(nextDigits) || nextDigits.startsWith(previousDigits);
  if (atEnd) return groupCardDigits(nextDigits, groups);
  return next.replace(/[^\d ]/g, '');
}

/** The grouped form of whatever is in the box. Run this when the field is LEFT. */
export function normaliseCardNumber(
  text: string,
  groups: readonly number[] = DEFAULT_CARD_GROUPS,
): string {
  return groupCardDigits(cardDigits(text), groups);
}

/**
 * The Luhn check digit.
 *
 * This is arithmetic on a string, not a statement about whether a card exists,
 * has funds or will be accepted — only the processor can say any of that. It is
 * here so a caller can catch a typo before spending a network round trip on it.
 */
export function luhnCheck(digits: string): boolean {
  if (digits.length < 2 || /\D/.test(digits)) return false;
  let sum = 0;
  let double = false;
  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let value = digits.charCodeAt(i) - 48;
    if (double) {
      value *= 2;
      if (value > 9) value -= 9;
    }
    sum += value;
    double = !double;
  }
  return sum % 10 === 0;
}

/** The digit counts a scheme accepts, or the default. */
export function schemeLengths(scheme?: CardScheme): readonly number[] {
  return scheme?.lengths ?? DEFAULT_CARD_LENGTHS;
}

/** The grouping a scheme asks for, or the default. */
export function schemeGroups(scheme?: CardScheme): readonly number[] {
  return scheme?.groups ?? DEFAULT_CARD_GROUPS;
}

/** The security code's length for a scheme, or the default. */
export function schemeSecurityCodeLength(scheme?: CardScheme): number {
  return scheme?.securityCodeLength ?? DEFAULT_SECURITY_CODE_LENGTH;
}

/** The longest number a scheme accepts — what an edit is refused past. */
export function schemeMaxDigits(scheme?: CardScheme): number {
  return Math.max(...schemeLengths(scheme));
}

/**
 * Whether the digits typed so far are still inside one prefix.
 *
 * Compared over the SHORTER of the two, so a scheme is recognised from the
 * first digit rather than only once the whole prefix has been typed — which is
 * the point: the mark appears while the number is still being entered.
 */
function withinPrefix(digits: string, from: string, to: string): boolean {
  if (digits.length === 0) return false;
  const width = Math.min(digits.length, from.length);
  const head = digits.slice(0, width);
  return head >= from.slice(0, width) && head <= to.slice(0, width);
}

/**
 * The first scheme in the CALLER'S table whose prefixes the digits fall inside.
 *
 * **Bloom ships no table.** It knows no scheme names, no prefixes and no
 * ranges, and it never will: the names are trademarks, the ranges change, and a
 * library that shipped them would be answering a question that belongs to the
 * app's processor. `schemes` is the app's, in the app's order, and the first
 * match wins — so an app that wants a house scheme to beat a general one puts
 * it first.
 */
export function matchCardScheme(
  digits: string,
  schemes: readonly CardScheme[] = [],
): CardScheme | undefined {
  for (const scheme of schemes) {
    for (const prefix of scheme.prefixes ?? []) {
      const [from, to] = typeof prefix === 'string' ? [prefix, prefix] : prefix;
      if (withinPrefix(digits, from, to)) return scheme;
    }
  }
  return undefined;
}

/**
 * One edit of an expiry, under the same caret rule as the number: the slash is
 * inserted only while typing at the end, and never re-inserted behind a caret.
 */
export function applyCardExpiryEdit(previous: string, next: string): string {
  const nextDigits = cardDigits(next).slice(0, 4);
  const previousDigits = cardDigits(previous);
  const atEnd =
    previousDigits.startsWith(nextDigits) || nextDigits.startsWith(previousDigits);
  if (!atEnd) return next.replace(/[^\d/]/g, '');
  if (nextDigits.length <= 2) return nextDigits;
  return `${nextDigits.slice(0, 2)}/${nextDigits.slice(2)}`;
}

/**
 * The tidy form, for when the field is LEFT: a lone month of 2–9 gets its
 * leading zero, because nobody means September when they type "9" and then tab
 * away. A lone `1` is left alone — it is as likely to be the start of October.
 */
export function normaliseCardExpiry(text: string): string {
  const digits = cardDigits(text);
  if (digits.length === 1 && digits >= '2') return `0${digits}`;
  return applyCardExpiryEdit('', digits);
}

/**
 * Whether an expiry is WELL FORMED — four digits and a month between 01 and 12.
 *
 * It is not whether the card has expired. **This family never reads a clock**,
 * the same rule `price-breakdown` holds for money: the app knows what "now"
 * means for its own billing, and a component that decided it would be wrong for
 * every app in a different timezone.
 */
export function cardExpiryIsWellFormed(text: string): boolean {
  const digits = cardDigits(text);
  if (digits.length !== 4) return false;
  const month = Number(digits.slice(0, 2));
  return month >= 1 && month <= 12;
}

/**
 * Whether a number is a plausible one to SEND: an accepted length, and a
 * passing check digit. Nothing more — see the note at the top of this file.
 */
export function cardNumberIsWellFormed(text: string, scheme?: CardScheme): boolean {
  const digits = cardDigits(text);
  return schemeLengths(scheme).includes(digits.length) && luhnCheck(digits);
}

/** Whether the security code has the digit count its scheme asks for. */
export function cardSecurityCodeIsWellFormed(text: string, scheme?: CardScheme): boolean {
  return cardDigits(text).length === schemeSecurityCodeLength(scheme);
}
