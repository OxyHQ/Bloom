import React, { useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { SelectionCard } from './SelectionCard';
import { Field } from '../field';
import { Switch } from '../switch';
import { Text } from '../typography';
import { Questionnaire } from '../questionnaire';
import { VehiclePicker } from '../vehicle-picker';

const meta: Meta<typeof SelectionCard> = {
  id: 'selection-card',
  title: 'Components/Inputs/Selection Card',
  component: SelectionCard,
};
export default meta;
type Story = StoryObj<typeof SelectionCard>;

export const Default: Story = {
  render: () => {
    const [selected, setSelected] = useState(false);
    return (
      <View style={{ width: 440, maxWidth: '100%' }}>
        <SelectionCard
          selection="multiple"
          title="Offline access"
          description="Keep this collection available on your device."
          selected={selected}
          onPress={() => setSelected(!selected)}
        >
          {selected ? <Text>Choose which items to download from the collection.</Text> : null}
        </SelectionCard>
      </View>
    );
  },
};

/** One Field constraint reaches the generic card, a domain picker and custom answer controls. */
export const FieldComposition: Story = {
  render: () => {
    const [disabled, setDisabled] = useState(true);
    const [selected, setSelected] = useState(false);
    const [vehicle, setVehicle] = useState<string>('bike');
    return (
      <View style={{ width: 520, maxWidth: '100%', gap: 24 }}>
        <Field label="Disable fields">
          <Switch checked={disabled} onCheckedChange={setDisabled} />
        </Field>
        <Field
          label="Download preference"
          description="The Field owns this description."
          disabled={disabled}
        >
          <SelectionCard
            title="Offline access"
            selection="multiple"
            selected={selected}
            disabled={false}
            onPress={() => setSelected(!selected)}
          />
        </Field>
        <Field
          multiple
          label="Delivery vehicle"
          disabled={disabled}
          error="Choose an available vehicle."
        >
          <VehiclePicker
            value={vehicle}
            onValueChange={setVehicle}
            options={[
              { value: 'bike', label: 'Bicycle', capacity: 'Small deliveries' },
              { value: 'van', label: 'Van', capacity: 'Large deliveries' },
            ]}
          />
        </Field>
        <Field multiple label="Preferences" disabled={disabled}>
          <Questionnaire
            questions={[
              {
                id: 'updates',
                question: 'How should we keep you informed?',
                options: [
                  { value: 'mail', label: 'Email' },
                  { value: 'push', label: 'Notifications' },
                ],
                other: true,
              },
            ]}
          />
        </Field>
      </View>
    );
  },
};
