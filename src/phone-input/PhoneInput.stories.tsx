import React, { useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { RiQuestionLine } from '../icons/remix';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { COUNTRIES, CountryFlag, PhoneInput, type Country } from './index';

const meta: Meta = {
  title: 'Base/Input/Phone',
};

export default meta;

type Story = StoryObj;

function Page({ children, width = 280 }: { children: React.ReactNode; width?: number }) {
  return (
    <View style={{ backgroundColor: useTheme().colors.background, padding: 40 }}>
      <View style={{ width, gap: 20 }}>{children}</View>
    </View>
  );
}

/** An empty field and a filled one. */
export const Basic: Story = {
  render: () => (
    <Page>
      <PhoneInput
        testID="phone-empty"
        label="Phone Number"
        required
        tooltip
        placeholder="(123) 000-0000"
        hint="This is a hint about this input."
        trailingIcon={RiQuestionLine}
      />
      <PhoneInput
        testID="phone-filled"
        label="Phone Number"
        required
        tooltip
        defaultValue="(415) 555-0132"
        hint="This is a hint about this input."
        trailingIcon={RiQuestionLine}
      />
    </Page>
  ),
};

/** `medium` (36) and `small` (32). */
export const Sizes: Story = {
  render: () => (
    <Page>
      <PhoneInput
        testID="phone-medium"
        label="Phone Number"
        placeholder="(123) 000-0000"
        trailingIcon={RiQuestionLine}
      />
      <PhoneInput
        testID="phone-small"
        size="small"
        label="Phone Number"
        placeholder="(123) 000-0000"
        trailingIcon={RiQuestionLine}
      />
    </Page>
  ),
};

/** Invalid and disabled repaint the field and hint; the select follows `disabled`. */
export const States: Story = {
  render: () => (
    <Page>
      <PhoneInput
        label="Phone Number"
        defaultValue="555"
        defaultCountry="GB"
        hint="Enter a valid phone number."
        isInvalid
        trailingIcon={RiQuestionLine}
      />
      <PhoneInput
        label="Phone Number"
        placeholder="(123) 000-0000"
        defaultCountry="ES"
        hint="This is a hint about this input."
        disabled
        trailingIcon={RiQuestionLine}
      />
    </Page>
  ),
};

/** Controlled: the caller owns both the country and the number. */
export const Controlled: Story = {
  render: function ControlledStory() {
    const [country, setCountry] = useState<Country>(COUNTRIES.find((c) => c.iso2 === 'JP')!);
    const [number, setNumber] = useState('');
    const color = useTheme().colors.text;
    return (
      <Page>
        <PhoneInput
          label="Phone Number"
          placeholder="90-1234-5678"
          country={country.iso2}
          onCountryChange={(_, next) => setCountry(next)}
          value={number}
          onChangeText={setNumber}
        />
        <Text variant="body-regular" style={{ color }}>
          {`+${country.dial} ${number}`}
        </Text>
      </Page>
    );
  },
};

/** Every vendored flag (`country-flag-icons` 3x2), at 18 × 12. */
export const Flags: Story = {
  render: function FlagsStory() {
    const color = useTheme().colors.text;
    return (
      <Page width={720}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {COUNTRIES.map((c) => (
            <View key={c.iso2} style={{ width: 64, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <CountryFlag iso2={c.iso2} accessibilityLabel={c.name} />
              <Text variant="caption-1-medium" style={{ color }}>
                {c.iso2}
              </Text>
            </View>
          ))}
        </View>
      </Page>
    );
  },
};
