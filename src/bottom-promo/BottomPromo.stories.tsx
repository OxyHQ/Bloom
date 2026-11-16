import { useState } from 'react';
import { View } from 'react-native';
import { Button } from '../button';
import { Text } from '../typography';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { BottomPromo } from './index';

const meta: Meta<typeof BottomPromo> = {
  id: 'blocks-bottom-promo',
  title: 'Composition/Layout/Bottom Promo',
  component: BottomPromo,
  args: {
    title: 'Don’t miss what’s happening',
    description: 'People on Mention are the first to know.',
    actionLabel: 'Sign In',
  },
  render: function PromoDemo(args) {
    const [signedIn, setSignedIn] = useState(false);
    return signedIn ? (
      <View style={{ gap: 12 }}>
        <Text>Signed in to the demo.</Text>
        <Button onPress={() => setSignedIn(false)}>Sign out</Button>
      </View>
    ) : (
      <BottomPromo {...args} onAction={() => setSignedIn(true)} />
    );
  },
};
export default meta;
type Story = StoryObj<typeof BottomPromo>;

export const Default: Story = {};

export const WithoutDescription: Story = {
  args: { description: undefined },
};
