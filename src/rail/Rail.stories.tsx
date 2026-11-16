import { useArgs } from 'storybook/preview-api';
import { useState, type PropsWithChildren } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import * as Icons from '../icons';
import { useTheme } from '../theme/use-theme';
import { Rail } from './Rail';
import { List } from '../list';
import { ScrollArea } from '../layout';
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
  id: 'base-rail',
  title: 'Composition/Navigation/Rail',
  component: Rail,
  parameters: { layout: 'fullscreen' },
};

export default meta;

type Story = StoryObj<typeof Rail>;

/** Height of the demo viewport — tall enough to prove the sticky pin. */
const SCREEN_HEIGHT = 480;
const ROWS = Array.from({ length: 24 }, (_, index) => index + 1);

function Screen({ children }: PropsWithChildren) {
  return <View style={{ flexDirection: 'row', height: SCREEN_HEIGHT }}>{children}</View>;
}

function Feed() {
  return (
    <ScrollArea style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
      <List items={ROWS.map((row) => ({ id: String(row), title: `Row ${row}` }))} />
    </ScrollArea>
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
      icon: <Icons.RiHomeLine fill={colors.textSecondary} />,
      activeIcon: <Icons.RiHomeFill fill={colors.primary} />,
    },
    {
      id: 'search',
      label: 'Search',
      icon: <Icons.RiSearchLine fill={colors.textSecondary} />,
      activeIcon: <Icons.RiSearchFill fill={colors.primary} />,
    },
    {
      id: 'inbox',
      label: 'Inbox',
      icon: <Icons.RiChat3Line fill={colors.textSecondary} />,
      activeIcon: <Icons.RiChat3Fill fill={colors.primary} />,
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: <Icons.RiUserLine fill={colors.textSecondary} />,
      activeIcon: <Icons.RiUserFill fill={colors.primary} />,
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <Icons.RiSettings3Line fill={colors.textSecondary} />,
      activeIcon: <Icons.RiSettings3Fill fill={colors.primary} />,
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
  parameters: { controls: { disable: true } },
  render: () => <DefaultScreen />,
};

/** No `activeId` names an item — every item renders in its inactive state. */
export const NoSelection: Story = {
  parameters: { controls: { disable: true } },
  render: () => {
    const items = useDemoItems();
    const [activeId, setActiveId] = useState<string>();
    return (
      <Screen>
        <Rail items={items} activeId={activeId} onSelect={setActiveId} />
        <Feed />
      </Screen>
    );
  },
};

/** A narrower column via the `width` prop. */
export const CustomWidth: Story = {
  parameters: { controls: { disable: true } },
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

export const Playground: StoryObj<typeof Rail> = {
  args: {
    items: [
      { id: 'home', label: 'Home', icon: <Icons.RiHomeLine /> },
      { id: 'search', label: 'Search', icon: <Icons.RiSearchLine /> },
    ],
    activeId: 'home',
    width: 80,
  },
  parameters: { controls: { disable: false, include: ['activeId', 'width'] } },
  argTypes: {
    activeId: { control: 'select', options: ['home', 'search'] },
    width: { control: { type: 'range', min: 64, max: 120 } },
  },
  render: function Playground(args) {
    const [, updateArgs] = useArgs();
    return (
      <View style={{ width: 520, maxWidth: '100%' }}>
        <Screen>
          <Rail {...args} onSelect={(activeId) => updateArgs({ activeId })} />
          <Feed />
        </Screen>
      </View>
    );
  },
};
