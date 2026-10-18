import type { StyleProp, ViewStyle } from 'react-native';

import type { Props as SVGIconProps } from '../icons/shared';
import type { TextFieldSize } from '../text-field/shared';

/** One country or region in the phone-code list. */
export interface Country {
  /** Upper-case country or supported subdivision identifier (`US`, `ES-CT`). */
  iso2: string;
  /** Display name (`United States`, `Catalunya`). */
  name: string;
  /** First calling code, digits only (`1`, `44`, `1809`). */
  dial: string;
}

export interface CountryFlagProps {
  /** Country or supported subdivision identifier (`US`, `ES-CT`). Unknown codes render nothing. */
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
  /** Selected country or region identifier (controlled). */
  value?: string;
  /** Initial country or region identifier when uncontrolled. Default `US`. */
  defaultValue?: string;
  onValueChange?: (iso2: string, country: Country) => void;
  /** The choosable countries. Default: every listed country and region, by name. */
  countries?: readonly Country[];
  /** Accessible name of the trigger and the list (`Country code` in English). */
  label?: string;
  disabled?: boolean;
}

export interface PhoneInputProps {
  /** Visible label above the field; also the input's accessible name. */
  label?: string;
  /** The input's accessible name when there is no visible `label` (`Phone number` in English). */
  accessibilityLabel?: string;
  placeholder?: string;
  /** Caption under the field. */
  hint?: string;
  /** Append the required asterisk to the label. */
  required?: boolean;
  /** Show the info glyph after the label. */
  tooltip?: boolean;
  /** `md` 36 (default) or `sm` 32. */
  size?: TextFieldSize;
  invalid?: boolean;
  isInvalid?: boolean;
  disabled?: boolean;

  /** The number as typed, without the dial code (controlled). */
  value?: string;
  /** Initial number when uncontrolled. */
  defaultValue?: string;
  onValueChange?: (value: string) => void;

  /** Selected country or region identifier (controlled). */
  country?: string;
  /** Initial country or region identifier when uncontrolled. Default `US`. */
  defaultCountry?: string;
  onCountryChange?: (iso2: string, country: Country) => void;
  /** The choosable countries. Default: every listed country and region, by name. */
  countries?: readonly Country[];
  /** Accessible name of the country-code select (`Country code` in English). */
  countrySelectLabel?: string;

  /** A 20px icon after the input (`trailingIcon`). */
  trailingIcon?: React.ComponentType<SVGIconProps>;
  onFocus?: () => void;
  onBlur?: () => void;
  testID?: string;
  /** The outer column (label, field, hint). */
  style?: StyleProp<ViewStyle>;
}
