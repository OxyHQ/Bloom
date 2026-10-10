import React, { useState } from 'react';
import { TextInput, View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Collapsible } from './index';
import { RadioGroup } from '../radio';
import { Button } from '../button';
import { Text } from '../typography';
import {
  Select,
  SelectContent,
  SelectIcon,
  SelectItem,
  SelectItemText,
  SelectTrigger,
  SelectValue,
} from '../select';

export default {
  title: 'Base/Collapsible',
  component: Collapsible,
} satisfies Meta<typeof Collapsible>;
type Story = StoryObj<typeof Collapsible>;
const intervals = [
  { value: 'week', label: 'Every week' },
  { value: 'month', label: 'Every month' },
];
function Composed() {
  const [plan, setPlan] = useState('once');
  const [interval, setInterval] = useState('month');
  const [tall, setTall] = useState(false);
  return (
    <View style={{ width: 460, maxWidth: '100%', gap: 16 }}>
      <RadioGroup
        label="Delivery plan"
        value={plan}
        onValueChange={setPlan}
        optionStyle={{ flexDirection: 'row-reverse', minHeight: 48 }}
        options={[
          {
            value: 'once',
            accessibilityLabel: 'One delivery',
            labelContent: <Text>One delivery</Text>,
          },
          {
            value: 'repeat',
            accessibilityLabel: 'Repeat delivery',
            labelContent: <Text>Repeat delivery</Text>,
          },
          { value: 'unavailable', label: 'Unavailable plan', disabled: true },
        ]}
        renderOption={(option, control, state) => (
          <View style={{ gap: 8 }}>
            {control}
            {option.value === 'repeat' && (
              <Collapsible
                open={state.checked}
                returnFocusRef={state.controlRef}
                testID="plan-body"
                className="w-full"
                contentClassName="gap-space-12 p-space-12"
              >
                <TextInput
                  accessibilityLabel="Delivery note"
                  placeholder="Delivery note"
                />
                <Select value={interval} onValueChange={setInterval}>
                  <SelectTrigger label="Delivery frequency">
                    <SelectValue />
                    <SelectIcon />
                  </SelectTrigger>
                  <SelectContent
                    label="Delivery frequency"
                    items={intervals}
                    renderItem={(item) => (
                      <SelectItem value={item.value} label={item.label}>
                        <SelectItemText>{item.label}</SelectItemText>
                      </SelectItem>
                    )}
                  />
                </Select>
                <Button onPress={() => setTall((value) => !value)}>
                  Resize content
                </Button>
                <View
                  testID="natural-content"
                  style={{ height: tall ? 1200 : 220 }}
                >
                  <Text>Delivery details</Text>
                </View>
              </Collapsible>
            )}
          </View>
        )}
      />
      <Button testID="close-plan" onPress={() => setPlan('once')}>
        Close details
      </Button>
      <Button testID="outside">Outside action</Button>
      <Text testID="selected-plan">{plan}</Text>
    </View>
  );
}
export const ComposedOptions: Story = {
  render: () => <Composed />,
  parameters: { bloomScroll: 'document' },
};
