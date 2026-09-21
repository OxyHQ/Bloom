import React, { useState, type ReactNode } from 'react';
import { View, useWindowDimensions } from 'react-native';

import { SocialLogo, SocialFeed, SocialWidgets } from './SocialContent';
import { Dialog, useDialogControl } from '../../src/dialog/index.web';
import { TextFieldInput } from '../../src/text-field';
import { ButtonGroup, ButtonGroupItem } from '../../src/button-group';
import { BottomBar } from '../../src/bottom-bar/index.web';
import { useScreen } from '../../src/screen';
import type { BottomBarProps } from '../../src/bottom-bar/types';
import { Fab } from '../../src/fab/index.web';
import { AppShell, AppShellMenuButton } from '../../src/app-shell/index.web';
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

function SocialBottomBar(props: BottomBarProps) {
  const { collapseProgress } = useScreen();
  return <BottomBar {...props} minimizeProgress={collapseProgress} />;
}

/** Neutral space markers, not a loading request or a post component. */
function Placeholder({ compact = false }: { compact?: boolean }) {
  const { colors } = useTheme();
  return <View accessible={false} aria-hidden style={{ height: compact ? 104 : 260, borderRadius: 16, backgroundColor: colors.backgroundSecondary }} />;
}

export function SocialTemplate({ showRightColumn = true, centerWidth = 620, rightColumnWidth = 350, framedContent = true, tallContext = false, gutter = 8, authenticated = true, headerActions, onNewPost }: {
  showRightColumn?: boolean; centerWidth?: number; rightColumnWidth?: number; framedContent?: boolean; tallContext?: boolean; gutter?: number; authenticated?: boolean; headerActions?: ReactNode; onNewPost?: () => void;
}) {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const compact = width < 700;
  const [selected, setSelected] = useState('home');
  const compose = useDialogControl();
  const [draft, setDraft] = useState('');
  const newPost = () => { onNewPost?.(); compose.open(); };
  const visibleDestinations = authenticated ? destinations : destinations.filter(item => item.value !== 'profile');
  const title = destinations.find(item => item.value === selected)?.label ?? 'Home';
  return (
    <>
    <AppShell
      testID="social"
      variant="feed"
      drawer="reveal"
      scroll="document"
      navigationAlign="content"
      navigationGap={0}
      asideGap={0}
      navigation={visibleDestinations}
      bottomBar={compact ? <SocialBottomBar
        testID="social-navigation-bottom"
        items={visibleDestinations.filter(item => ['home', 'explore', 'notifications', 'saved', 'profile'].includes(item.value)).map(item => ({ name: item.value, label: item.label, icon: item.icon }))}
        value={selected} onValueChange={setSelected}
        action={<Fab accessibilityLabel="New post" icon={<RiQuillPenLine />} onPress={newPost} />}
      /> : undefined}
      value={selected}
      onValueChange={setSelected}
      navFrom={700}
      navExpandedFrom={1100}
      sidebar={{ primaryAction: { label: 'New post', icon: RiQuillPenLine, onPress: newPost }, surface: 'plain', size: 'md', style: { justifyContent: 'center' }, searchShortcut: false, logo: { icon: <SocialLogo />, accessibilityLabel: 'Mention home', onPress: () => setSelected('home') } }}
      contentWidth={centerWidth}
      gutter={gutter}
      panel={framedContent}
      header={<PageHeader testID="social-header" leading={<AppShellMenuButton testID="social-menu" />} title={<SocialLogo size={28} />} titleAlign="center" presentation="floating" actions={<ButtonGroup accessibilityLabel="Page actions">{headerActions}<ButtonGroupItem iconOnly leadingIcon={RiSearchLine} accessibilityLabel="Explore" onPress={() => setSelected('explore')} /><ButtonGroupItem iconOnly leadingIcon={RiNotification3Line} accessibilityLabel="Notifications" onPress={() => setSelected('notifications')} /></ButtonGroup>} />}
      asideFrom={1180}
      asideWidth={rightColumnWidth}
      asideCollapse="hidden"
      aside={showRightColumn ? <View role="complementary" accessibilityLabel="Context column" style={{ paddingTop: 16, paddingBottom: 12, paddingLeft: 14, paddingRight: 14 }}>
        <SocialWidgets authenticated={authenticated} />
        {tallContext && Array.from({ length: 7 }, (_, index) => <View key={index} style={{ marginBottom: 16 }}><Placeholder compact /></View>)}
        <Text variant="caption-1-medium" style={{ color: colors.textSecondary }}>End of context.</Text>
      </View> : undefined}
    >
      <View testID="social-main" role="main" accessibilityLabel={`${title} layout`} style={{ gap: 0 }}>
        <SocialFeed authenticated={authenticated} onCompose={newPost} />
        <Text style={{ color: colors.textSecondary, padding: 24 }}>End of feed.</Text>
      </View>
    </AppShell>
    <Dialog control={compose} title={authenticated ? 'New post' : 'Sign in'} description={authenticated ? 'Try the composer. This demo keeps your draft locally.' : 'Sign in to join the conversation.'} actions={[{ label: 'Done' }]}>
      {authenticated && <TextFieldInput label="Your post" value={draft} onValueChange={setDraft} multiline />}
    </Dialog>
    </>
  );
}

