import { useRef } from 'react';
import { View } from 'react-native';
import { Button } from '../button';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { AnimatedCheck } from './index';
import type { AnimatedCheckRef } from './types';

const meta: Meta<typeof AnimatedCheck> = {
  id: 'base-animated-check',
  title: 'Components/Feedback/Animated Check',
  component: AnimatedCheck,
  argTypes: {
    size: { control: { type: 'range', min: 16, max: 128, step: 4 } },
    color: { control: 'color' },
  },
};

export default meta;

type Story = StoryObj<typeof AnimatedCheck>;

export const Playable: Story = {
  args: { size: 64 },
  render: (args) => {
    function Demo() {
      const ref = useRef<AnimatedCheckRef>(null);
      return (
        <View style={{ gap: 16, alignItems: 'center' }}>
          <AnimatedCheck ref={ref} {...args} />
          <Button onPress={() => ref.current?.play()}>Play</Button>
        </View>
      );
    }
    return <Demo />;
  },
};
