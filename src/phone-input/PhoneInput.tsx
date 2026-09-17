import React from 'react';
import { View } from 'react-native';

import { useControllableState } from '../hooks/use-controllable-state';
import {
  TextField,
  TextFieldHint,
  TextFieldIcon,
  TextFieldInput,
  TextFieldLabel,
} from '../text-field';
import { CountryCodeSelect } from './CountryCodeSelect';
import type { PhoneInputProps } from './types';

/**
 * A phone number field: `Input` with a country-code `Select` in its
 * leading addon — `label`, the field (`h-9 pl-1 pr-2`, `h-8 pl-1 pr-1.5` on
 * small) holding the select, the number and an optional trailing icon, and
 * `hint` below.
 *
 * `value` is the number as typed; the dial code is the selected country's
 * (`onCountryChange` hands over both the ISO code and the `Country`), so a
 * caller composes the E.164 string however its backend wants it.
 */
export function PhoneInput({
  label,
  accessibilityLabel,
  placeholder,
  hint,
  required,
  tooltip,
  size = 'medium',
  isInvalid,
  disabled,
  value,
  defaultValue = '',
  onChangeText,
  country,
  defaultCountry = 'US',
  onCountryChange,
  countries,
  countrySelectLabel,
  trailingIcon,
  onFocus,
  onBlur,
  testID,
  style,
}: PhoneInputProps) {
  const [text, setText] = useControllableState({
    value,
    defaultValue,
    onChange: onChangeText,
  });

  return (
    <View style={[{ width: '100%' }, style]} testID={testID}>
      {label ? (
        <TextFieldLabel required={required} tooltip={tooltip}>
          {label}
        </TextFieldLabel>
      ) : null}
      <TextField
        size={size}
        isInvalid={isInvalid}
        disabled={disabled}
        leadingAddon={
          <CountryCodeSelect
            value={country}
            defaultValue={defaultCountry}
            onValueChange={onCountryChange}
            countries={countries}
            label={countrySelectLabel}
            disabled={disabled}
          />
        }>
        <TextFieldInput
          label={accessibilityLabel ?? label ?? 'Phone number'}
          placeholder={placeholder ?? null}
          value={text}
          onChangeText={setText}
          isInvalid={isInvalid}
          keyboardType="phone-pad"
          autoComplete="tel"
          textContentType="telephoneNumber"
          onFocus={onFocus ? () => onFocus() : undefined}
          onBlur={onBlur ? () => onBlur() : undefined}
        />
        {trailingIcon ? <TextFieldIcon icon={trailingIcon} position="trailing" /> : null}
      </TextField>
      {hint ? <TextFieldHint isInvalid={isInvalid}>{hint}</TextFieldHint> : null}
    </View>
  );
}
