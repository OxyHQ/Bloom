import React, { useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { RecentHiresCard } from './index';
import type { RecentHire } from './types';

const meta: Meta<typeof RecentHiresCard> = {
  title: 'Blocks/Recent Hires Card',
  component: RecentHiresCard,
};

export default meta;

type Story = StoryObj<typeof RecentHiresCard>;

const photo = (id: string) => `https://images.unsplash.com/${id}?w=96&h=96&fit=crop&crop=faces`;

/** Demo people. */
const HIRES: RecentHire[] = [
  { name: 'Livia Saris', joined: 'Joined today', role: 'Backend Engineer', avatar: photo('photo-1544005313-94ddf0286df2') },
  { name: 'Jaydon Aminoff', joined: '2 days ago', role: 'UI Designer', avatar: photo('photo-1506794778202-cad84cf45f1d') },
  { name: 'Maria Lubin', joined: '5 days ago', role: 'User Researcher', avatar: photo('photo-1534528741775-53994a69daeb') },
  { name: 'Ann Press', joined: 'A week ago', role: 'DevOps Engineer', avatar: photo('photo-1517841905240-472988babdf9') },
];

const MORE: RecentHire[] = [
  { name: 'Zaire Torff', joined: '2 weeks ago', role: 'Account Executive', avatarColor: 'blue' },
  { name: 'Gretchen Septimus', joined: '2 weeks ago', role: 'Product Designer', avatarColor: 'neutral' },
  { name: 'Omar Vetrovs', joined: '3 weeks ago', role: 'Support Specialist', avatarColor: 'lime' },
  { name: 'Talan Calzoni', joined: 'A month ago', role: 'Growth Marketer', avatarColor: 'pink' },
];

const Frame = ({ children, width = 480 }: { children: React.ReactNode; width?: number }) => (
  <View style={{ padding: 40, gap: 24, width: width + 80 }}>{children}</View>
);

/** The dashboard card: count, team switcher, four people, Previous / Next. */
export const Default: Story = {
  render: () => (
    <Frame>
      <RecentHiresCard testID="hires" count={56} teamLabel="Design team" hires={HIRES} />
    </Frame>
  ),
};

/** Paging through two sets; initials avatars where there is no photo, and the ends disable their button. */
export const Paging: Story = {
  render: function Paging() {
    const [page, setPage] = useState(0);
    return (
      <Frame>
        <RecentHiresCard
          count={56}
          teamLabel="Design team"
          hires={page === 0 ? HIRES : MORE}
          previousDisabled={page === 0}
          nextDisabled={page === 1}
          onPreviousPress={() => setPage(0)}
          onNextPress={() => setPage(1)}
        />
      </Frame>
    );
  },
};

/** The HR grid's narrower column, and a phone-width card. */
export const Widths: Story = {
  render: () => (
    <View style={{ padding: 40, gap: 24 }}>
      <View style={{ width: 362 }}>
        <RecentHiresCard count={56} teamLabel="Design team" hires={HIRES} />
      </View>
      <View style={{ width: 342 }}>
        <RecentHiresCard count="1,204" hires={MORE.slice(0, 3)} height="auto" />
      </View>
    </View>
  ),
};
