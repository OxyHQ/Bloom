import { RiPhoneLine } from '@oxy.so/bloom/icons';
import { COUNTRIES, PhoneInput } from '@oxy.so/bloom/phone-input';

import { ENUMS } from '../src/generated/spec.generated';
import * as L from '../src/index';
import { toElement } from '../src/render';
import type { ParityCase } from './support/cases';

const set = () => {};
const EUROPE = COUNTRIES.filter((country) => ['ES', 'FR', 'DE', 'GB'].includes(country.iso2));

export const PHONE_INPUT_CASES: readonly ParityCase[] = [
  {
    name: 'a phone number, titled',
    language: () => toElement(L.PhoneInput(['', set], 'Phone')),
    bloom: () => <PhoneInput value="" onValueChange={set} label="Phone" />,
  },
  ...ENUMS.controlSize.map((size) => ({
    name: `a ${size} phone number, named`,
    language: () => toElement(L.PhoneInput(['612 345 678', set]).size(size).label('Mobile number')),
    bloom: () => (
      <PhoneInput
        value="612 345 678"
        onValueChange={set}
        size={size}
        accessibilityLabel="Mobile number"
      />
    ),
  })),
  {
    name: 'a country of its own among a few',
    language: () =>
      toElement(
        L.PhoneInput(['612 345 678', set], 'Phone')
          .country(['ES', set])
          .countries(EUROPE)
          .labels({ countrySelect: 'Prefijo' }),
      ),
    bloom: () => (
      <PhoneInput
        value="612 345 678"
        onValueChange={set}
        label="Phone"
        country="ES"
        onCountryChange={set}
        countries={EUROPE}
        countrySelectLabel="Prefijo"
      />
    ),
  },
  {
    name: 'required, with its info glyph, a caption, a placeholder and an icon',
    language: () =>
      toElement(
        L.PhoneInput(['', set], 'Phone')
          .required()
          .showsInfo()
          .description('We text a code to it.')
          .placeholder('555 0100')
          .trailingIcon(RiPhoneLine)
          .testID('phone'),
      ),
    bloom: () => (
      <PhoneInput
        value=""
        onValueChange={set}
        label="Phone"
        required
        tooltip
        hint="We text a code to it."
        placeholder="555 0100"
        trailingIcon={RiPhoneLine}
        testID="phone"
      />
    ),
  },
  {
    name: 'an invalid number with its caption',
    language: () =>
      toElement(L.PhoneInput(['12', set], 'Phone').invalid().description('Too short.')),
    bloom: () => (
      <PhoneInput value="12" onValueChange={set} label="Phone" invalid hint="Too short." />
    ),
  },
  {
    name: 'a disabled number in a box of its own',
    language: () => toElement(L.PhoneInput(['', set], 'Phone').disabled().padding('sm')),
    bloom: () => (
      <PhoneInput
        value=""
        onValueChange={set}
        label="Phone"
        disabled
        style={{ paddingTop: 8, paddingBottom: 8, paddingStart: 8, paddingEnd: 8 }}
      />
    ),
  },
];
