import React, { useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Stepper } from './Stepper';
import { StepperRow } from './StepperRow';
import { Text } from '../typography';
import { useTheme } from '../theme/use-theme';

const meta: Meta = {
  title: 'Base/Stepper',
};

export default meta;

type Story = StoryObj;

/**
 * Both sizes at rest, at the lower bound, at the upper bound, disabled, and
 * with a formatted value. Click the buttons or Tab onto a value and use the
 * arrow keys; the row does not shift between 9 and 10.
 */
export const Matrix: Story = {
  render: function StepperMatrix() {
    const theme = useTheme();
    const [a, setA] = useState(2);
    const [b, setB] = useState(9);
    const [c, setC] = useState(4);
    return (
      <View style={{ gap: 20, padding: 16, backgroundColor: theme.colors.background }}>
        {(['medium', 'small'] as const).map((size) => (
          <View key={size} style={{ gap: 12 }}>
            <Text variant="caption-1-medium" style={{ color: theme.colors.textSecondary }}>
              {size}
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 24 }}>
              <Stepper size={size} value={a} onValueChange={setA} max={10} accessibilityLabel="Rooms" />
              <Stepper size={size} value={0} onValueChange={() => {}} accessibilityLabel="At minimum" />
              <Stepper size={size} value={b} onValueChange={setB} max={16} accessibilityLabel="Beds" />
              <Stepper size={size} value={3} onValueChange={() => {}} disabled accessibilityLabel="Locked" />
              <Stepper
                size={size}
                value={c}
                onValueChange={setC}
                max={8}
                formatValue={(n) => (n === 8 ? '8+' : String(n))}
                accessibilityLabel="Bathrooms"
              />
            </View>
          </View>
        ))}
      </View>
    );
  },
};

/** A guest picker: rows with a title, a description and a hairline between them. */
export const GuestPicker: Story = {
  render: function StepperGuestPicker() {
    const theme = useTheme();
    const [adults, setAdults] = useState(2);
    const [children, setChildren] = useState(0);
    const [infants, setInfants] = useState(0);
    const [pets, setPets] = useState(0);
    return (
      <View style={{ padding: 16, backgroundColor: theme.colors.background }}>
        <View style={{ width: 360, paddingLeft: 24, paddingRight: 24, borderRadius: 16, backgroundColor: theme.colors.card }}>
          <StepperRow title="Adults" description="Ages 13 or above" value={adults} onValueChange={setAdults} min={1} max={16} divider />
          <StepperRow title="Children" description="Ages 2 – 12" value={children} onValueChange={setChildren} max={15} divider />
          <StepperRow title="Infants" description="Under 2" value={infants} onValueChange={setInfants} max={5} divider />
          <StepperRow title="Pets" description="Bringing a service animal?" value={pets} onValueChange={setPets} max={5} />
        </View>
      </View>
    );
  },
};

/** Filter rows at `small`, narrow (280) and wide (560). */
export const NarrowAndWide: Story = {
  render: function StepperWidths() {
    const theme = useTheme();
    const [bedrooms, setBedrooms] = useState(0);
    const [beds, setBeds] = useState(1);
    return (
      <View style={{ gap: 24, padding: 16, backgroundColor: theme.colors.background }}>
        {[280, 560].map((width) => (
          <View key={width} style={{ width }}>
            <StepperRow
              size="small"
              title="Bedrooms"
              value={bedrooms}
              onValueChange={setBedrooms}
              max={8}
              formatValue={(n) => (n === 0 ? 'Any' : String(n))}
              divider
            />
            <StepperRow size="small" title="Beds" value={beds} onValueChange={setBeds} min={1} max={16} />
          </View>
        ))}
      </View>
    );
  },
};
