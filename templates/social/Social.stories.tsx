import React, { useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Avatar } from '../../src/avatar';
import { Button } from '../../src/button';
import { resolveButtonRamps } from '../../src/button/shared';
import { Chip } from '../../src/chip';
import {
  RiAsterisk,
  RiBookmarkLine,
  RiGroupLine,
  RiHome5Line,
  RiMailLine,
  RiNotification3Line,
  RiSearchLine,
  RiUserLine,
} from '../../src/icons/remix';
import { TabBar, TabBarButton, TabBarMinimizeProvider } from '../../src/tab-bar';
import { Text } from '../../src/typography';
import type { SidebarNavItem } from '../../src/sidebar';
import { Search } from '../../src/search';
import { useTheme } from '../../src/theme/use-theme';
import { ASIDE_WIDTH, ComposeButton, SocialLayout } from './SocialLayout';

/**
 * The LAYOUT only. Every post, card and row here is a grey placeholder — the
 * social components are not built yet, and this story is about where the
 * regions sit and how they behave as the window changes.
 */
const meta: Meta = {
  title: 'Templates/Social',
  parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj;

const NAV: SidebarNavItem[] = [
  { key: 'home', label: 'Home', icon: RiHome5Line, href: '#home' },
  { key: 'explore', label: 'Explore', icon: RiSearchLine, href: '#explore' },
  { key: 'notifications', label: 'Notifications', icon: RiNotification3Line, href: '#notifications', badge: 12 },
  { key: 'messages', label: 'Messages', icon: RiMailLine, href: '#messages', badge: 3 },
  { key: 'bookmarks', label: 'Bookmarks', icon: RiBookmarkLine, href: '#bookmarks' },
  { key: 'communities', label: 'Communities', icon: RiGroupLine, href: '#communities' },
  { key: 'profile', label: 'Profile', icon: RiUserLine, href: '#profile' },
];

/** A neutral block standing in for a component that does not exist yet. */
function Placeholder({ height, label, radius = 16 }: { height: number; label?: string; radius?: number }) {
  const theme = useTheme();
  const { neutral } = resolveButtonRamps(theme);
  return (
    <View
      style={{
        height,
        borderRadius: radius,
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: theme.isDark ? neutral[700] : neutral[300],
        backgroundColor: theme.isDark ? neutral[900] : neutral[100],
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {label ? (
        <Text variant="body-2-regular" style={{ color: theme.isDark ? neutral[500] : neutral[500] }}>
          {label}
        </Text>
      ) : null}
    </View>
  );
}

/** The feed's sticky header: the two feeds, as a simple underline tab row. */
function FeedTabs({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const theme = useTheme();
  const { neutral } = resolveButtonRamps(theme);
  return (
    <View
      style={{
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderColor: theme.isDark ? neutral[800] : neutral[200],
      }}
    >
      {[
        { key: 'for-you', label: 'For you' },
        { key: 'following', label: 'Following' },
      ].map((tab) => {
        const selected = tab.key === value;
        return (
          <Button
            key={tab.key}
            variant="text"
            size="large"
            onPress={() => onChange(tab.key)}
            style={{ flex: 1, borderRadius: 0 }}
            textStyle={{ color: selected ? theme.colors.text : neutral[500] }}
          >
            {tab.label}
          </Button>
        );
      })}
    </View>
  );
}

function SideCard({ title, rows }: { title: string; rows: number }) {
  const theme = useTheme();
  const { neutral } = resolveButtonRamps(theme);
  return (
    <View
      style={{
        borderRadius: 16,
        borderWidth: 1,
        borderColor: theme.isDark ? neutral[800] : neutral[200],
        padding: 16,
        gap: 12,
      }}
    >
      <Text variant="headline-semibold" style={{ color: theme.colors.text }}>
        {title}
      </Text>
      {Array.from({ length: rows }, (_, i) => (
        <Placeholder key={i} height={48} radius={12} />
      ))}
      <Button variant="link" size="small" onPress={() => {}}>
        Show more
      </Button>
    </View>
  );
}

function Frame() {
  const [selected, setSelected] = useState('home');
  const [tab, setTab] = useState('for-you');
  return (
    <SocialLayout
      testID="social"
      items={NAV}
      selected={selected}
      onNavigate={(item) => setSelected(item.key)}
      sidebar={{
        logo: { icon: <RiAsterisk width={24} height={24} fill="#0a84ff" />, wordmark: 'Feed' },
        account: { name: 'Maya Collins', avatar: { initials: 'M' } },
        showSearch: false,
        showThemeToggle: false,
      }}
      account={{ name: 'Maya Collins' }}
      compose={<ComposeButton onPress={() => {}} collapsed />}
      tabBar={
        <TabBarMinimizeProvider>
          <TabBar activeIndex={0} onIndexChange={() => {}}>
            {[
              { name: 'home', label: 'Home', icon: <RiHome5Line /> },
              { name: 'explore', label: 'Explore', icon: <RiSearchLine /> },
              { name: 'notifications', label: 'Alerts', icon: <RiNotification3Line /> },
              { name: 'messages', label: 'Messages', icon: <RiMailLine /> },
            ].map((item, i) => (
              <TabBarButton key={item.name} item={item} index={i} />
            ))}
          </TabBar>
        </TabBarMinimizeProvider>
      }
      phoneAction={<Button variant="text" size="medium" iconOnly leadingIcon={RiSearchLine} accessibilityLabel="Search" onPress={() => {}} />}
      aside={
        <View style={{ gap: 16, paddingTop: 12, paddingBottom: 24 }}>
          <Search placeholder="Search" value="" onChangeText={() => {}} />
          <SideCard title="What's happening" rows={4} />
          <SideCard title="Who to follow" rows={3} />
        </View>
      }
    >
      <View>
        <FeedTabs value={tab} onChange={setTab} />
        <View style={{ padding: 16, gap: 16 }}>
        <Placeholder height={120} label="Composer" />
        {Array.from({ length: 8 }, (_, i) => (
          <Placeholder key={i} height={i % 3 === 0 ? 320 : 140} label={i % 3 === 0 ? 'Post with media' : 'Post'} />
        ))}
        </View>
      </View>
    </SocialLayout>
  );
}

/** Three columns from `xl`: navigation, the feed at 600, and the side column. */
export const Wide: Story = { render: () => <Frame /> };

/** Below `xl` the side column stacks under the feed; below `lg` the rail collapses. */
export const Medium: Story = { render: () => <Frame /> };

/** Below `md`: a top bar, the feed full width, the tab bar at the bottom. */
export const Phone: Story = { render: () => <Frame /> };

/** Between 500 and 990: the rail and the panel, with no side column. */
export const NoAside: Story = { name: 'No side column', render: () => <Frame /> };

/** The sidebar's compose button, which the app renders inside the rail. */
export const Compose: Story = {
  render: () => (
    <View style={{ padding: 24, gap: 16, width: 280 }}>
      <ComposeButton onPress={() => {}} />
      <ComposeButton collapsed onPress={() => {}} />
      <Chip size="medium">{`Side column: ${ASIDE_WIDTH}px`}</Chip>
    </View>
  ),
};
