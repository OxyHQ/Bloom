import React, { useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { FollowButton } from './MediaActionBar';
import { ContactRow } from '../chat-people';
import { Text } from '../typography';
import { defaultAvatarSource } from '../avatar/default-avatar';
import type { FollowButtonProps } from './types';

function InteractiveButton(props: FollowButtonProps) {
  const [following, setFollowing] = useState(props.following);
  return <FollowButton {...props} following={following} onFollowChange={next => {
    setFollowing(next);
    props.onFollowChange(next);
  }} />;
}

const meta = {
  title: 'Controls/Follow Button', component: FollowButton,
  parameters: { layout: 'padded' },
  args: { following: false, onFollowChange: fn(), tone: 'support', iconOnly: false, disabled: false, size: 'small' },
  argTypes: {
    tone: { control: 'select', options: ['support', 'action', 'neutral', 'accent'] },
    following: { control: 'boolean' }, iconOnly: { control: 'boolean' }, disabled: { control: 'boolean' },
    size: { control: 'select', options: ['small', 'medium'] },
    label: { control: 'text' }, followingLabel: { control: 'text' },
    onFollowChange: { control: false }, style: { control: false }, color: { control: 'color' },
  },
  render: args => <InteractiveButton key={`${args.following}-${args.iconOnly}`} {...args} />,
} satisfies Meta<typeof FollowButton>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const IconOnly: Story = { args: { iconOnly: true } };
export const ColorComparison: Story = {
  globals: { colorPreset: 'olive' },
  parameters: { controls: { exclude: ['tone', 'iconOnly', 'following'] } },
  render: args => <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 32, padding: 16 }}>
    {(['support', 'action'] as const).map(tone => <View key={tone} style={{ width: 320, gap: 16 }}>
      <Text variant="headline-semibold">{tone === 'support' ? 'Secondary' : 'Tertiary · FAB color'}</Text>
      <ContactRow id={`${tone}-text`} name="David Revoy" subtitle="@davidrevoy" avatar={defaultAvatarSource}
        size="small" horizontalInset={0}
        trailingSlot={<InteractiveButton {...args} tone={tone} following={false} iconOnly={false} testID={`${tone}-follow`} />} />
      <ContactRow id={`${tone}-icon`} name="J L Westover" subtitle="@mrlovenstein" avatar={defaultAvatarSource}
        size="small" horizontalInset={0}
        trailingSlot={<InteractiveButton {...args} tone={tone} following={false} iconOnly testID={`${tone}-follow-icon`} />} />
    </View>)}
  </View>,
};

export const ColorComparisonDark: Story = {
  ...ColorComparison,
  globals: { theme: 'dark', colorPreset: 'olive' },
};
