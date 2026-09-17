import type { StyleProp, ViewStyle } from 'react-native';

import type { Props as SVGIconProps } from '../icons/shared';
import type { TextFieldSize } from '../text-field/shared';

/** One entry of the vendored country list. */
export interface Country {
  /** ISO 3166-1 alpha-2, upper case (`US`). */
  iso2: string;
  /** English short name (`United States`). */
  name: string;
  /** First calling code, digits only (`1`, `44`, `1809`). */
  dial: string;
}

export interface CountryFlagProps {
  /** ISO 3166-1 alpha-2. An unknown code renders nothing. */
  iso2: string;
  /** Width in px; the flag is 3:2, so height is two thirds of it. Default `18` (`w-[18px] h-3`). */
  size?: number;
  /**
   * Name the flag for assistive tech. Omitted (the default) the flag is
   * DECORATIVE and hidden — right wherever the country name or dial code is
   * written beside it.
   */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

export interface CountryCodeSelectProps {
  /** Selected ISO code (controlled). */
  value?: string;
  /** Initial ISO code when uncontrolled. Default `US`. */
  defaultValue?: string;
  onValueChange?: (iso2: string, country: Country) => void;
  /** The choosable countries. Default: every vendored country, by name. */
  countries?: readonly Country[];
  /** Accessible name of the trigger and the list. Default `Country code`. */
  label?: string;
  disabled?: boolean;
}

export interface PhoneInputProps {
  /** Visible label above the field; also the input's accessible name. */
  label?: string;
  /** The input's accessible name when there is no visible `label`. Default `Phone number`. */
  accessibilityLabel?: string;
  placeholder?: string;
  /** Caption under the field. */
  hint?: string;
  /** Append the required asterisk to the label. */
  required?: boolean;
  /** Show the info glyph after the label. */
  tooltip?: boolean;
  /** `medium` 36 (default) or `small` 32. */
  size?: TextFieldSize;
  isInvalid?: boolean;
  disabled?: boolean;

  /** The number as typed, without the dial code (controlled). */
  value?: string;
  /** Initial number when uncontrolled. */
  defaultValue?: string;
  onChangeText?: (value: string) => void;

  /** Selected ISO code (controlled). */
  country?: string;
  /** Initial ISO code when uncontrolled. Default `US`. */
  defaultCountry?: string;
  onCountryChange?: (iso2: string, country: Country) => void;
  /** The choosable countries. Default: every vendored country, by name. */
  countries?: readonly Country[];
  /** Accessible name of the country-code select. Default `Country code`. */
  countrySelectLabel?: string;

  /** A 20px icon after the input (`trailingIcon`). */
  trailingIcon?: React.ComponentType<SVGIconProps>;
  onFocus?: () => void;
  onBlur?: () => void;
  testID?: string;
  /** The outer column (label, field, hint). */
  style?: StyleProp<ViewStyle>;
}
