import { defineMessages, type MessageCatalog } from '../locale/messages';

/**
 * `InputOtp`'s names, in each Bloom language. `accessibilityLabel` (or the
 * enclosing `Field`'s label) still names the group.
 */
export interface InputOtpMessages {
  /** The group's name when nothing else names it. */
  oneTimeCode: string;
  /** One box of a numeric code: "Digit 2 of 6". */
  digitOf: (position: number, total: number) => string;
  /** One box of an alphanumeric code: "Character 2 of 6". */
  characterOf: (position: number, total: number) => string;
}

export const INPUT_OTP_MESSAGES: MessageCatalog<InputOtpMessages> =
  defineMessages<InputOtpMessages>('INPUT_OTP_MESSAGES', {
    oneTimeCode: 'One-time code',
    digitOf: (i, n) => `Digit ${i} of ${n}`,
    characterOf: (i, n) => `Character ${i} of ${n}`,
  });
