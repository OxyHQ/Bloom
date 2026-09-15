import React, { useState, type PropsWithChildren } from 'react';
import { ScrollView, Text, View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import * as Icons from '../icons';
import { useTheme } from '../theme/use-theme';
import { Rail } from './Rail';
import type { RailItem } from './types';

/**
 * The desktop sidebar navigation column — the vertical, non-animated sibling
 * of `TabBar`. Its `activeId`/`onSelect` shape is the same "consumer owns
 * routing, Rail owns rendering" split `bottom-nav`-style `TabBar` consumers
 * already use, just keyed by id instead of index.
 *
 * These stories render the WEB fork implicitly: `position: sticky` only ever
 * applies on web, so the demo viewport below is a real scrolling column tall
 * enough to show the rail staying pinned while the content beside it scrolls.
 */
const meta: Meta<typeof Rail> = {
  title: 'Components/Rail',
  component: Rail,
  parameters: { layout: 'fullscreen' },
};

export default meta;

type Story = StoryObj<typeof Rail>;

/** Height of the demo viewport — tall enough to prove the sticky pin. */
const SCREEN_HEIGHT = 480;
const ROWS = Array.from({ length: 24 }, (_, index) => index + 1);

function Screen({ children }: PropsWithChildren) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        height: SCREEN_HEIGHT,
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 12,
        overflow: 'hidden',
      }}
    >
      {children}
    </View>
  );
}

/** Tall filler content so the column beside the rail actually scrolls. */
function Feed() {
  const { colors } = useTheme();
  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      {ROWS.map((row) => (
        <View
          key={row}
          style={{
            padding: 16,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.backgroundSecondary,
          }}
        >
          <Text style={{ color: colors.text, fontSize: 15, fontWeight: '600' }}>Row {row}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

/**
 * Build a demo item set from Bloom's own icon set — the same `icon`/
 * `activeIcon` split `TabBarItem` uses, resolved once up front here (no
 * per-frame crossfade to drive) rather than tinted by `Rail` itself: a
 * consumer owns its own icon set and colors both states the way it wants,
 * exactly as `bottom-nav`'s `TabBar` items already do.
 */
function useDemoItems(): RailItem[] {
  const { colors } = useTheme();
  return [
    {
      id: 'home',
      label: 'Home',
      icon: <Icons.Home_Stroke2_Corner0_Rounded fill={colors.textSecondary} />,
      activeIcon: <Icons.Home_Filled_Corner0_Rounded fill={colors.primary} />,
    },
    {
      id: 'search',
      label: 'Search',
      icon: <Icons.MagnifyingGlass_Stroke2_Corner0_Rounded fill={colors.textSecondary} />,
      activeIcon: <Icons.MagnifyingGlass_Filled_Stroke2_Corner0_Rounded fill={colors.primary} />,
    },
    {
      id: 'inbox',
      label: 'Inbox',
      icon: <Icons.Message_Stroke2_Corner0_Rounded fill={colors.textSecondary} />,
      activeIcon: <Icons.Message_Stroke2_Corner0_Rounded_Filled fill={colors.primary} />,
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: <Icons.Person_Stroke2_Corner0_Rounded fill={colors.textSecondary} />,
      activeIcon: <Icons.Person_Filled_Corner2_Rounded fill={colors.primary} />,
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <Icons.SettingsGear2_Stroke2_Corner0_Rounded fill={colors.textSecondary} />,
      activeIcon: <Icons.SettingsGear2_Filled_Corner0_Rounded fill={colors.primary} />,
    },
  ];
}

function DefaultScreen() {
  const items = useDemoItems();
  const [activeId, setActiveId] = useState('home');
  return (
    <Screen>
      <Rail items={items} activeId={activeId} onSelect={setActiveId} />
      <Feed />
    </Screen>
  );
}

/** Five destinations, controlled selection, scrolling content beside it. */
export const Default: Story = {
  render: () => <DefaultScreen />,
};

/** No `activeId` names an item — every item renders in its inactive state. */
export const NoSelection: Story = {
  render: () => {
    const items = useDemoItems();
    return (
      <Screen>
        <Rail items={items} onSelect={() => {}} />
        <Feed />
      </Screen>
    );
  },
};

/** A narrower column via the `width` prop. */
export const CustomWidth: Story = {
  render: () => {
    const items = useDemoItems();
    const [activeId, setActiveId] = useState('home');
    return (
      <Screen>
        <Rail items={items} activeId={activeId} onSelect={setActiveId} width={64} />
        <Feed />
      </Screen>
    );
  },
};
