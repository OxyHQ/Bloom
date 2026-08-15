import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { RadioIndicator } from './index';
import { Text } from '../typography';
import { Card } from '../card';

const meta: Meta<typeof RadioIndicator> = {
  title: 'Forms/RadioIndicator',
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
  render: function CardsStory() {
    const [value, setValue] = useState('standard');
    const options = [
      { value: 'standard', title: 'Standard', detail: 'Arrives in 3–5 days' },
      { value: 'express', title: 'Express', detail: 'Next working day' },
    ];
    return (
      <View style={{ gap: 12, width: 360 }}>
        {options.map((o) => (
          <Pressable
            key={o.value}
            onPress={() => setValue(o.value)}
            accessibilityRole="radio"
            aria-checked={value === o.value}
            accessibilityLabel={o.title}
          >
            <Card
              variant="outlined"
              radius="radius-16"
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                padding: 16,
              }}
            >
              <RadioIndicator selected={value === o.value} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '600' }}>{o.title}</Text>
                <Text>{o.detail}</Text>
              </View>
            </Card>
          </Pressable>
        ))}
      </View>
    );
  },
};
