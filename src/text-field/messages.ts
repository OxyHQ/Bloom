import { defineMessages, type MessageCatalog } from '../locale/messages';

/**
 * Every fixed string the text-field family draws or announces, in each Bloom
 * language. A caller's `revealLabels` still wins over the reveal pair.
 */
export interface TextFieldMessages {
  /** The reveal button's name while the value is hidden. */
  showPassword: string;
  /** The reveal button's name while the value is shown. */
  hidePassword: string;
  /** The name of `TextFieldLabel`'s `required` asterisk. */
  required: string;
}

export const TEXT_FIELD_MESSAGES: MessageCatalog<TextFieldMessages> =
  defineMessages<TextFieldMessages>('TEXT_FIELD_MESSAGES', {
    showPassword: 'Show password',
    hidePassword: 'Hide password',
    required: 'required',
  });
