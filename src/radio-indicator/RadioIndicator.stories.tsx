import { useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { RadioIndicator } from './index';
import { RadioGroup } from '../radio';

const meta: Meta<typeof RadioIndicator> = {
  id: 'base-radio-indicator',
  title: 'Components/Inputs/Radio Indicator',
  component: RadioIndicator,
};

export default meta;

type Story = StoryObj<typeof RadioIndicator>;

/**
 * `RadioIndicator` is the DOT ONLY — no press handling, no label, no role. It is
 * for surfaces that are already a control and just need the selection mark:
 * a menu item, a selectable card, a table row.
 *
 * If you are about to wrap it in a `Pressable` and add a label, you want `Radio`
 * or `RadioGroup` — they carry the role and the group semantics this one
 * deliberately does not.
 */
export const States: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <View style={{ flexDirection: 'row', gap: 24, alignItems: 'center' }}>
      <RadioIndicator selected={false} />
      <RadioIndicator selected />
      <RadioIndicator selected size={28} />
      <RadioIndicator selected selectedColor="tomato" />
      <RadioIndicator selected={false} borderColor="tomato" />
    </View>
  ),
};

/**
 * The case it exists for: a selectable card, where the card is the hit target
 * and the indicator only reports which one is chosen.
 */
export const SelectableCards: Story = {
  parameters: { controls: { disable: true } },
  render: function CardsStory() {
    const [value, setValue] = useState('standard');
    const options = [
      { value: 'standard', title: 'Standard', detail: 'Arrives in 3–5 days' },
      { value: 'express', title: 'Express', detail: 'Next working day' },
    ];
    return (
      <RadioGroup
        label="Delivery"
        variant="card"
        value={value}
        onValueChange={setValue}
        options={options.map((option) => ({
          value: option.value,
          label: option.title,
          description: option.detail,
        }))}
        style={{ width: 360, maxWidth: '100%' }}
      />
    );
  },
};

/** A single instance whose controls are applied directly to the rendered component. */
export const Playground: StoryObj<typeof RadioIndicator> = {
  args: { selected: true, size: 24 },
  parameters: {
    controls: { disable: false, include: ['selected', 'size', 'selectedColor', 'borderColor'] },
  },
  argTypes: {
    selected: { control: 'boolean' },
    size: { control: { type: 'range', min: 12, max: 40, step: 2 } },
    selectedColor: { control: 'text' },
    borderColor: { control: 'text' },
  },
  render: function Playground(args) {
    return (
      <View style={{ width: 440, maxWidth: '100%' }}>
        <RadioIndicator {...args} />
      </View>
    );
  },
};
