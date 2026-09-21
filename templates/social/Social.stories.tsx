import React, { useState } from 'react';
import { View, useWindowDimensions } from 'react-native';
import { fn } from 'storybook/test';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { AppShell } from '../../src/app-shell/index.web';
import { PageHeader } from '../../src/page-header';
import { Text } from '../../src/typography';
import { useTheme } from '../../src/theme/use-theme';
import { RiHome5Line } from '../../src/icons/remix/RiHome5Line';
import { RiBookmarkLine } from '../../src/icons/remix/RiBookmarkLine';
import { RiUserLine } from '../../src/icons/remix/RiUserLine';
import { RiSearchLine } from '../../src/icons/remix/RiSearchLine';
import { RiNotification3Line } from '../../src/icons/remix/RiNotification3Line';
import { RiBroadcastLine } from '../../src/icons/remix/RiBroadcastLine';
import { RiChat4Line } from '../../src/icons/remix/RiChat4Line';
import { RiHashtag } from '../../src/icons/remix/RiHashtag';
import { RiListUnordered } from '../../src/icons/remix/RiListUnordered';
import { RiVideoLine } from '../../src/icons/remix/RiVideoLine';
import { RiSettings3Line } from '../../src/icons/remix/RiSettings3Line';
import { RiQuillPenLine } from '../../src/icons/remix/RiQuillPenLine';

const destinations = [
  { value: 'home', label: 'Home', icon: <RiHome5Line /> },
  { value: 'profile', label: 'Profile', icon: <RiUserLine /> },
  { value: 'explore', label: 'Explore', icon: <RiSearchLine /> },
  { value: 'notifications', label: 'Notifications', icon: <RiNotification3Line /> },
  { value: 'live-rooms', label: 'Live rooms', icon: <RiBroadcastLine /> },
  { value: 'channels', label: 'Channels', icon: <RiChat4Line /> },
  { value: 'saved', label: 'Saved', icon: <RiBookmarkLine /> },
  { value: 'feeds', label: 'Feeds', icon: <RiHashtag /> },
  { value: 'lists', label: 'Lists', icon: <RiListUnordered /> },
  { value: 'videos', label: 'Videos', icon: <RiVideoLine /> },
  { value: 'settings', label: 'Settings', icon: <RiSettings3Line /> },
];

/** Neutral space markers, not a loading request or a post component. */
function Placeholder({ compact = false }: { compact?: boolean }) {
  const { colors } = useTheme();
  return <View accessible={false} aria-hidden style={{ height: compact ? 104 : 260, borderRadius: 16, backgroundColor: colors.backgroundSecondary }} />;
}

function SocialLayout({ showRightColumn = true, centerWidth = 620, rightColumnWidth = 350, framedContent = true, tallContext = false, gutter = 8, revealTitle = true, onNewPost }: {
  showRightColumn?: boolean; centerWidth?: number; rightColumnWidth?: number; framedContent?: boolean; tallContext?: boolean; gutter?: number; revealTitle?: boolean; onNewPost: () => void;
}) {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const compact = width < 700;
  const [selected, setSelected] = useState('home');
  const [headingHeight, setHeadingHeight] = useState(0);
  const subtitle = 'Espacio reservado para el contenido.';
  const title = destinations.find(item => item.value === selected)?.label ?? 'Home';
  return (
    <AppShell
      testID="social"
      variant="feed"
      scroll="document"
      navigationAlign="content"
      navigationGap={0}
      asideGap={0}
      navigation={compact ? destinations.filter(item => ['home', 'explore', 'notifications', 'saved', 'profile'].includes(item.value)) : destinations}
      primaryAction={compact ? { accessibilityLabel: 'New post', icon: <RiQuillPenLine />, onPress: onNewPost } : undefined}
      value={selected}
      onValueChange={setSelected}
      navFrom={700}
      navExpandedFrom={1100}
      sidebar={{ primaryAction: { label: 'New post', icon: RiQuillPenLine, onPress: onNewPost }, surface: 'plain', size: 'md', style: { justifyContent: 'center' }, searchShortcut: false, logo: { wordmark: 'Social', accessibilityLabel: 'Social home', onPress: () => setSelected('home') } }}
      contentWidth={centerWidth}
      gutter={gutter}
      panel={framedContent}
      header={<PageHeader testID="social-header" title={title} subtitle={subtitle} titleReveal={revealTitle ? "onScroll" : "always"} titleRevealOffset={gutter + headingHeight} presentation="floating" />}
      asideFrom={1180}
      asideWidth={rightColumnWidth}
      asideCollapse="hidden"
      aside={showRightColumn ? <View role="complementary" accessibilityLabel="Context column" style={{ paddingTop: 16, paddingBottom: 12, paddingLeft: 14, paddingRight: 14 }}>
        <View style={{ gap: 8, marginBottom: 16 }}>
          <Text variant="headline-semibold">Contexto</Text>
          <Placeholder compact />
        </View>
        <View style={{ marginBottom: 16 }}><Placeholder compact /></View>
        <View style={{ gap: 8, marginBottom: 16 }}>
          <Text variant="headline-semibold">Información adicional</Text>
          <Placeholder compact />
        </View>
        {tallContext && Array.from({ length: 7 }, (_, index) => <View key={index} style={{ marginBottom: 16 }}><Placeholder compact /></View>)}
        <Text variant="caption-1-medium" style={{ color: colors.textSecondary }}>Final del contexto.</Text>
      </View> : undefined}
    >
      <View testID="social-main" role="main" accessibilityLabel={`${title} layout`} style={{ gap: 32 }}>
        <View testID="social-heading" onLayout={event => setHeadingHeight(event.nativeEvent.layout.height)} style={{ gap: 8, paddingLeft: Math.max(0, 24 - gutter), paddingRight: Math.max(0, 24 - gutter) }}>
          <Text variant="title-2-semibold" role="heading" aria-level={1}>{title}</Text>
          <Text style={{ color: colors.textSecondary }}>{subtitle}</Text>
        </View>
        {Array.from({ length: 5 }, (_, index) => <Placeholder key={index} />)}
        <Text style={{ color: colors.textSecondary }}>Final del contenido.</Text>
      </View>
    </AppShell>
  );
}

const meta = {
  title: 'Templates/Social', component: SocialLayout,
  parameters: { layout: 'fullscreen', bloomScroll: 'document' },
  args: { revealTitle: true, onNewPost: fn(), showRightColumn: true, centerWidth: 620, rightColumnWidth: 350, framedContent: true, tallContext: false, gutter: 8 },
  argTypes: {
    revealTitle: { control: 'boolean', description: 'Reveal the header title and subtitle after the content heading scrolls underneath it.' },
    onNewPost: { control: false, description: 'Primary sidebar action; opens the app composer. Logged in this layout-only story.' },
    gutter: { control: { type: 'range', min: 8, max: 40, step: 4 }, description: 'Shared gutter for the panel frame, mask and sticky header.' },
    framedContent: { control: 'boolean', description: 'Wrap the reading column in Bloom’s tonal ContentPanel.' },
    showRightColumn: { control: 'boolean', description: 'Show the contextual column from 1180px.' },
    rightColumnWidth: { control: { type: 'range', min: 280, max: 400, step: 10 }, description: 'Width reserved for widgets beside the reading column.' },
    centerWidth: { control: { type: 'range', min: 480, max: 650, step: 10 }, description: 'Maximum reading width; contracts on smaller screens.' },
    tallContext: { control: 'boolean', description: 'Verify a context column taller than the viewport still uses document scroll.' },
  },
} satisfies Meta<typeof SocialLayout>;
export default meta;
type Story = StoryObj<typeof meta>;
export const LightOlive: Story = { globals: { theme: 'light', colorPreset: 'olive' } };
export const DarkOlive: Story = { globals: { theme: 'dark', colorPreset: 'olive' } };
export const Copper: Story = { globals: { theme: 'dark', colorPreset: 'copper-field' } };
export const OpenColumns: Story = { globals: { theme: 'light', colorPreset: 'olive' }, args: { framedContent: false } };
export const TallContext: Story = { globals: { theme: 'light', colorPreset: 'olive' }, args: { tallContext: true } };
