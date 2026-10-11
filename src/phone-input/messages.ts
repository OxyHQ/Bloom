import { defineMessages, type MessageCatalog } from '../locale/messages';

/**
 * The phone input's names, in each Bloom language. Country names stay the
 * vendored English data (`countries.ts`); `label`, `accessibilityLabel` and
 * `countrySelectLabel` still win.
 */
export interface PhoneInputMessages {
  /** The number field's name when there is no visible label. */
  phoneNumber: string;
  /** The country-code select's name. */
  countryCode: string;
}

export const PHONE_INPUT_MESSAGES: MessageCatalog<PhoneInputMessages> =
  defineMessages<PhoneInputMessages>('PHONE_INPUT_MESSAGES', {
    phoneNumber: 'Phone number',
    countryCode: 'Country code',
  });
