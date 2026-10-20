import React from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Avatar } from '../avatar';
import { Button } from '../button';
import { Text } from '../typography';
import { CoverHeader } from './index';

const meta: Meta<typeof CoverHeader> = {
  argTypes: {
    coverHeight: { control: 'number' },
    overlap: { control: 'number' },
  },
  id: 'base-cover-header',
  title: 'Composition/Layout/Cover Header',
  component: CoverHeader,
};

export default meta;

type Story = StoryObj<typeof CoverHeader>;

const COVER = 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200';
const AVATAR = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop';

function Profile(args: React.ComponentProps<typeof CoverHeader>) {
  return (
    <View style={{ maxWidth: 600 }}>
      <CoverHeader {...args} contentStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}>
        <View
          style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}
        >
          <Avatar size={90} source={AVATAR} initials="MC" />
          <Button size="sm" appearance="subtle" tone="neutral">
            Follow
          </Button>
        </View>
        <Text variant="title-2-medium" style={{ marginTop: 10 }}>
          Maya Collins
        </Text>
        <Text variant="body-medium">@maya</Text>
      </CoverHeader>
    </View>
  );
}

export const WithPhoto: Story = {
  args: { coverSource: COVER, coverHeight: 170, overlap: 45 },
  render: (args) => <Profile {...args} />,
};

export const WithoutPhoto: Story = {
  args: { coverHeight: 170, overlap: 45 },
  render: (args) => <Profile {...args} />,
};

function EditablePageCover() {
  const [position, setPosition] = React.useState({ x: 0.5, y: 0.5 });
  return (
    <CoverHeader
      coverSource={COVER}
      coverHeight={280}
      overlap={40}
      coverPosition={position}
      repositionable
      repositionAxes="vertical"
      onCoverPositionCommit={async (next) => {
        setPosition(next);
      }}
      testID="editable-cover"
      contentStyle={{ paddingHorizontal: 32 }}
    >
      <Avatar source={AVATAR} size={80} />
      <Text variant="title-2-medium">Team workspace</Text>
    </CoverHeader>
  );
}
export const EditablePage: Story = { render: () => <EditablePageCover /> };
