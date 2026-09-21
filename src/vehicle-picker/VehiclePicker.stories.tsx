import React, { useContext, useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { BudgetPicker } from '../home-search';
import { BloomThemeContext, BloomThemeProvider } from '../theme/BloomThemeProvider';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { VEHICLE_OPTIONS } from './constants';
import { VehiclePicker } from './VehiclePicker';
import type { VehicleKind, VehicleOption } from './types';

const meta: Meta = {
  title: 'Blocks/Freight/VehiclePicker',
  parameters: { layout: 'fullscreen' },
};

export default meta;

type Story = StoryObj;

// ---------------------------------------------------------------------------
//  Demo data — invented prices on the built-in vehicles.
// ---------------------------------------------------------------------------

const PRICED: readonly VehicleOption<VehicleKind>[] = VEHICLE_OPTIONS.map((option) => ({
  ...option,
  priceFrom: {
    bike: '€6.40',
    car: '€11.90',
    van: '€28.00',
    boxTruck: '€74.00',
    refrigerated: '€39.50',
  }[option.value],
}));

/** A 60 kg load: the two smallest bodies cannot take it, and both say so. */
const FOR_A_SOFA: readonly VehicleOption<VehicleKind>[] = PRICED.map((option) =>
  option.value === 'bike' || option.value === 'car'
    ? {
        ...option,
        disabled: true,
        unavailableReason:
          option.value === 'bike'
            ? 'The load is 60 kg and a cargo bike takes 25.'
            : 'The sofa is 190 cm long and will not go through a car door.',
      }
    : option,
);

function Page({ children, maxWidth = 560 }: { children: React.ReactNode; maxWidth?: number }) {
  const theme = useTheme();
  return (
    <View style={{ backgroundColor: theme.colors.background, padding: 20, gap: 16 }}>
      <View style={{ width: '100%', maxWidth, gap: 16 }}>{children}</View>
    </View>
  );
}

function Caption({ children }: { children: string }) {
  const theme = useTheme();
  return (
    <Text variant="caption-1-medium" style={{ color: theme.colors.textSecondary }}>
      {children}
    </Text>
  );
}

/** The same block in both modes — every colour here flips. */
function BothModes({ children }: { children: React.ReactNode }) {
  const preset = useContext(BloomThemeContext)?.colorPreset;
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
      <BloomThemeProvider mode="light" colorPreset={preset}>
        <View style={{ flexGrow: 1, flexShrink: 1, flexBasis: 420, minWidth: 0, maxWidth: 560 }}>
          <Page>{children}</Page>
        </View>
      </BloomThemeProvider>
      <BloomThemeProvider mode="dark" colorPreset={preset}>
        <View style={{ flexGrow: 1, flexShrink: 1, flexBasis: 420, minWidth: 0, maxWidth: 560 }}>
          <Page>{children}</Page>
        </View>
      </BloomThemeProvider>
    </View>
  );
}

function Picker({
  options = PRICED,
  initial = null,
  ...rest
}: {
  options?: readonly VehicleOption<VehicleKind>[];
  initial?: VehicleKind | null;
  title?: string;
  description?: string;
  disabled?: boolean;
}) {
  const [value, setValue] = useState<VehicleKind | null>(initial);
  return (
    <VehiclePicker
      value={value}
      onValueChange={setValue}
      options={options}
      testID="vehicle"
      {...rest}
    />
  );
}

/** The whole ladder, nothing chosen, every price visible at rest. */
export const Default: Story = {
  render: () => (
    <Page>
      <Picker title="Which vehicle?" description="Pick the smallest one that can take the load." />
    </Page>
  ),
};

/** One chosen: the accent border, the filled icon tile and the radio dot. */
export const Chosen: Story = {
  render: () => (
    <Page>
      <Picker initial="van" title="Which vehicle?" />
    </Page>
  ),
};

/**
 * A 60 kg sofa. Two bodies are out, each saying WHY rather than just greying
 * out — the row a requester wanted is the row that has to explain itself.
 */
export const BlockedByTheLoad: Story = {
  render: () => (
    <Page>
      <Picker
        options={FOR_A_SOFA}
        initial="van"
        title="Which vehicle?"
        description="Two of these cannot take a 60 kg sofa."
      />
    </Page>
  ),
};

/** No prices at all: the built-in options, which carry none. */
export const WithoutPrices: Story = {
  render: () => (
    <Page>
      <Picker options={VEHICLE_OPTIONS} />
    </Page>
  ),
};

/** The whole picker disabled — a job that has already been booked. */
export const Disabled: Story = {
  render: () => (
    <Page>
      <Picker initial="boxTruck" disabled title="Which vehicle?" />
    </Page>
  ),
};

/** Phone width: every card drops to its compact inset, nothing overflows. */
export const Narrow: Story = {
  render: () => (
    <Page maxWidth={358}>
      <Picker options={FOR_A_SOFA} initial="refrigerated" title="Which vehicle?" />
    </Page>
  ),
};

/** Long copy in every slot, at phone width. */
export const LongText: Story = {
  render: () => (
    <Page maxWidth={358}>
      <Picker
        options={[
          {
            value: 'van',
            label: 'Long-wheelbase high-roof panel van with a tail lift',
            capacity:
              'Up to 800 kg · 240 × 150 × 140 cm · a driver who will carry it up to a third floor',
            fits: [
              'A three-seat sofa',
              'A double mattress and its base',
              'Fourteen removal boxes',
              'A washing machine',
            ],
            priceFrom: '€28.00',
          },
        ]}
        initial="van"
        title="Which vehicle should we send for this job?"
        description="Every vehicle below is one a carrier near the pick-up has available this week."
      />
    </Page>
  ),
};

/** Both modes in one shot. */
export const Modes: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <BothModes>
      <Picker options={FOR_A_SOFA} initial="van" title="Which vehicle?" />
    </BothModes>
  ),
};

/**
 * Beside the reference this family was drawn to match: `home-search`'s
 * `BudgetPicker` — a heading at `body-semibold` over a `body-2-regular` line,
 * then the control, then the detail. Same register, one question apart.
 */
export const BesideTheReference: Story = {
  render: function BesideTheReferenceStory() {
    const [budget, setBudget] = useState<[number | null, number | null]>([null, 1200]);
    return (
      <Page maxWidth={560}>
        <View style={{ width: '100%', gap: 16 }}>
          <Caption>Bloom reference — home-search / BudgetPicker</Caption>
          <BudgetPicker
            value={budget}
            onValueChange={setBudget}
            formatAmount={(amount) => `€${amount.toLocaleString('en-GB')}`}
          />
          <Caption>This family — vehicle-picker / VehiclePicker</Caption>
          <Picker
            initial="van"
            title="Which vehicle?"
            description="Pick the smallest one that can take the load."
          />
        </View>
      </Page>
    );
  },
};
