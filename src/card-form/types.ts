import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

import type { BloomIconComponent } from '../icons/icon-component';

/**
 * A card scheme, **as the app describes it**.
 *
 * Bloom ships no schemes: no names, no prefixes, no ranges, no artwork. The
 * names are trademarks, the ranges change without warning, and which ones an
 * app accepts is a fact about its processor rather than about its UI. So the
 * table is a prop, the app owns it, and a `CardForm` given none simply groups
 * in fours and accepts sixteen digits.
 */
export interface CardScheme {
  /** Stable key, reported through `onSchemeChange`. */
  id: string;
  /** The name, drawn as TEXT beside the neutral mark. Never as artwork. */
  name: string;
  /**
   * The digit prefixes this scheme claims. A plain string is one prefix; a
   * `[from, to]` pair is an inclusive range of equal-length prefixes.
   *
   * Matched against what has been typed SO FAR, over the shorter of the two, so
   * a scheme is recognised from the first digit.
   */
  prefixes?: readonly (string | readonly [string, string])[];
  /** The digit counts this scheme accepts. Default `[16]`. */
  lengths?: readonly number[];
  /** How the number is grouped as it is typed. Default `[4, 4, 4, 4]`. */
  groups?: readonly number[];
  /** How many digits the security code has. Default `3`. */
  securityCodeLength?: number;
  /** What this scheme CALLS the security code, if not "Security code". */
  securityCodeLabel?: string;
  /** The glyph on the mark. Default a card. */
  icon?: BloomIconComponent;
  /** Artwork the app has the rights to, drawn inside the mark's plate. */
  image?: ReactNode;
}

/** The six things a card form can ask for. */
export type CardFormFieldName =
  | 'number'
  | 'expiry'
  | 'securityCode'
  | 'name'
  | 'postcode'
  | 'country';

/**
 * What the boxes currently hold — **strings exactly as they are drawn**,
 * grouping and slash included.
 *
 * It is the display form rather than a cleaned one because the app never needs
 * the cleaned one from here: it hands the value to its own payment SDK, which
 * does its own cleaning, and a second "clean" copy in this object would be a
 * second place a full number lives.
 */
export interface CardFormValue {
  number: string;
  expiry: string;
  securityCode: string;
  name: string;
  postcode: string;
  country: string;
}

/** A message per box. A non-empty string puts that box in its invalid state. */
export type CardFormErrors = Partial<Record<CardFormFieldName, string>>;

/** The words above each box. Every one has a default. */
export type CardFormLabels = Partial<Record<CardFormFieldName, string>>;

/** Which boxes a form draws besides the three a card always needs. */
export interface CardFormFields {
  /** The name on the card. Default `true`. */
  name?: boolean;
  /** The billing postcode. Default `false` — ask for it only where it is asked. */
  postcode?: boolean;
  /** The billing country. Default `false`. Needs `countries`. */
  country?: boolean;
}

/** One option of the country picker. */
export interface CardFormCountryOption {
  /** The value reported back — an ISO code, or whatever the app keys on. */
  value: string;
  /** The words in the list. */
  label: string;
}

/** What every box in this family has in common. */
interface CardFormPartProps {
  /** The value, as it is drawn. Controlled: this family holds no state. */
  value?: string;
  onValueChange?: (value: string) => void;
  /** The words above the box. Omitted, the box draws none. */
  label?: string;
  /** Replaces the label as the ANNOUNCED name, and outranks a `Field`'s. */
  accessibilityLabel?: string;
  /** Shown under the box, in the error colour, and wired with `aria-describedby`. */
  error?: string;
  /** Paints the box invalid without a message. `error` implies it. */
  invalid?: boolean;
  /** Combined with an enclosing `Field`'s, never replaced. */
  disabled?: boolean;
  /** Combined with an enclosing `Field`'s. */
  required?: boolean;
  placeholder?: string;
  autoFocus?: boolean;
  /** An id the caller wired itself. Outranks the field's. */
  nativeID?: string;
  onFocus?: () => void;
  onBlur?: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export interface CardFormNumberProps extends CardFormPartProps {
  /** The schemes the app accepts, in its own order. Bloom ships none. */
  schemes?: readonly CardScheme[];
  /**
   * The scheme the caller has already resolved. Given, the box uses it for
   * grouping and length and does no matching of its own.
   */
  scheme?: CardScheme;
  /** Fires when the detected scheme changes, including to `undefined`. */
  onSchemeChange?: (scheme: CardScheme | undefined) => void;
  /**
   * A node at the end of the label row, ABOVE the box — where `CardForm` puts
   * the detected mark. Any node; `PaymentMethodMark` is the one Bloom draws.
   */
  mark?: ReactNode;
}

export interface CardFormExpiryProps extends CardFormPartProps {}

export interface CardFormSecurityCodeProps extends CardFormPartProps {
  /** How many digits to accept. Default 3. */
  length?: number;
  /**
   * Masks the digits as they are typed. Default `false`: the code is three or
   * four characters typed once, from a card the person is holding, and masking
   * it hides typos without hiding anything from anyone else.
   */
  secure?: boolean;
}

export interface CardFormNameProps extends CardFormPartProps {}

export interface CardFormPostcodeProps extends CardFormPartProps {}

export interface CardFormCountryProps extends Omit<CardFormPartProps, 'placeholder' | 'autoFocus'> {
  /** The countries to choose from, in the order they should be read. */
  countries: readonly CardFormCountryOption[];
  /** Drawn in the trigger while nothing is chosen. Default `"Select a country"`. */
  placeholder?: string;
}

export interface CardFormProps {
  /** Controlled value. */
  value?: Partial<CardFormValue>;
  /** Initial value when uncontrolled. */
  defaultValue?: Partial<CardFormValue>;
  /** Every change, with the whole value. */
  onValueChange?: (value: CardFormValue) => void;
  /** The schemes the app accepts. Without them the form groups in fours. */
  schemes?: readonly CardScheme[];
  /** Fires when the detected scheme changes. */
  onSchemeChange?: (scheme: CardScheme | undefined) => void;
  /** A message per box. */
  errors?: CardFormErrors;
  /** The words above each box. */
  labels?: CardFormLabels;
  /** Which of the optional boxes to draw. */
  fields?: CardFormFields;
  /** The countries for the country box. Required when `fields.country` is on. */
  countries?: readonly CardFormCountryOption[];
  /** Disables every box. Combined with an enclosing `Field`'s. */
  disabled?: boolean;
  /** Marks every box required. Combined with an enclosing `Field`'s. */
  required?: boolean;
  /** Focuses the number box on mount. */
  autoFocus?: boolean;
  /** Masks the security code. Default `false`. */
  secureSecurityCode?: boolean;
  /**
   * Names the form as a whole. The individual boxes name themselves from their
   * own labels.
   */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
