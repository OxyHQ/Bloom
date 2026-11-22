// Bloom components as apps write them, each one a rule of the codemod's (src/components.ts).
import { Admonition } from '@oxy.so/bloom/admonition';
import { Avatar } from '@oxy.so/bloom/avatar';
import { AvatarGroup, type AvatarGroupItem } from '@oxy.so/bloom/avatar-group';
import { Badge } from '@oxy.so/bloom/badge';
import { Button } from '@oxy.so/bloom/button';
import { Card } from '@oxy.so/bloom/card';
import { ChatEmptyState } from '@oxy.so/bloom/chat-screen';
import { Checkbox } from '@oxy.so/bloom/checkbox';
import { Chip } from '@oxy.so/bloom/chip';
import { Divider } from '@oxy.so/bloom/divider';
import { EngagementAction } from '@oxy.so/bloom/engagement-bar';
import { Field } from '@oxy.so/bloom/field';
import { ResponsiveGrid } from '@oxy.so/bloom/grid';
import { GroupedSection, GroupedSectionItem } from '@oxy.so/bloom/grouped-section';
import { RiCloseLine } from '@oxy.so/bloom/icons/RiCloseLine';
import { RiHeart3Fill } from '@oxy.so/bloom/icons/RiHeart3Fill';
import { RiHeart3Line } from '@oxy.so/bloom/icons/RiHeart3Line';
import { RiMailLine } from '@oxy.so/bloom/icons/RiMailLine';
import { RiSmartphoneLine } from '@oxy.so/bloom/icons/RiSmartphoneLine';
import { RiStarLine } from '@oxy.so/bloom/icons/RiStarLine';
import { IconCircle } from '@oxy.so/bloom/icon-circle';
import { Item } from '@oxy.so/bloom/item';
import { List, type ListEntry } from '@oxy.so/bloom/list';
import { Loading, SpinnerIcon } from '@oxy.so/bloom/loading';
import { PageHeader } from '@oxy.so/bloom/page-header';
import { ScreenScrollView } from '@oxy.so/bloom/screen';
import { Slider } from '@oxy.so/bloom/slider';
import { Search } from '@oxy.so/bloom/search';
import {
  SegmentedControl,
  SegmentedControlItem,
  SegmentedControlItemText,
} from '@oxy.so/bloom/segmented-control';
import { SettingsSection, SettingsValueField } from '@oxy.so/bloom/settings-modal';
import { SettingsSelect } from '@oxy.so/bloom/settings-modal/select';
import { Switch } from '@oxy.so/bloom/switch';
import { Tabs, TabsTrigger } from '@oxy.so/bloom/tabs';
import { TextField, TextFieldIcon, TextFieldInput } from '@oxy.so/bloom/text-field';
import { Textarea } from '@oxy.so/bloom/textarea';
import { useTheme } from '@oxy.so/bloom/theme';
import { Muted } from '@oxy.so/bloom/typography';
import { RefreshControl, StyleSheet, View } from 'react-native';

declare const t: (key: string) => string;

export function Notifications({
  on,
  setOn,
  open,
}: {
  on: boolean;
  setOn: (on: boolean) => void;
  open: () => void;
}) {
  return (
    <SettingsSection
      label={t('settings.notifications')}
      description={t('settings.notificationsHint')}
    >
      <GroupedSection title={t('settings.push')} footer={t('settings.pushFooter')} variant="filled">
        <GroupedSectionItem
          title={t('settings.likes')}
          description={t('settings.likesHint')}
          rightElement={<Switch checked={on} onCheckedChange={setOn} />}
        />
        <GroupedSectionItem title="Language" value="English" onPress={open} />
        <GroupedSectionItem
          title={t('settings.quality')}
          description={t('settings.qualityHint')}
          descriptionLines={0}
          wrapControl
          rightElement={<SpinnerIcon size={20} />}
        />
        <GroupedSectionItem
          title={t('settings.signOut')}
          destructive
          showChevron={false}
          onPress={open}
        />
        <GroupedSectionItem title={t('settings.address')} titleNumberOfLines={0} disabled />
      </GroupedSection>
    </SettingsSection>
  );
}

export function Devices() {
  return (
    <SettingsSection>
      <Card appearance="outline" radius="radius-16" border="thin" elevation="none">
        <SettingsValueField icon={RiSmartphoneLine}>Pixel 9</SettingsValueField>
      </Card>
    </SettingsSection>
  );
}

export function Profile({
  name,
  setName,
  save,
}: {
  name: string;
  setName: (name: string) => void;
  save: () => void;
}) {
  return (
    <ScreenScrollView keyboardShouldPersistTaps="handled">
      {/* The profile's own fields */}
      <View className="gap-4 p-4">
        <TextFieldInput
          label={t('profile.name')}
          value={name}
          onChangeText={setName}
          placeholder={t('profile.namePlaceholder')}
          maxLength={50}
          autoCapitalize="words"
          autoCorrect={false}
          returnKeyType="done"
          onSubmitEditing={save}
        />
      </View>
    </ScreenScrollView>
  );
}

export function NoChats({ start }: { start: () => void }) {
  return (
    <ChatEmptyState
      title={t('chats.empty')}
      description={t('chats.emptyHint')}
      action={<Button onPress={start}>{t('chats.start')}</Button>}
    />
  );
}

export function People({
  people,
  query,
  setQuery,
  open,
  more,
}: {
  people: { id: string; name: string; handle: string; avatar: string; variant: string }[];
  query: string;
  setQuery: (query: string) => void;
  open: (id: string) => void;
  more: () => void;
}) {
  return (
    <ScreenScrollView onEndReached={more} onEndReachedThreshold={0.5}>
      <Search
        label={t('people.search')}
        value={query}
        onChangeText={setQuery}
        autoCorrect={false}
      />
      <Muted numberOfLines={2}>{t('people.hint')}</Muted>
      <Divider spacing={12} />
      {people.map((person) => (
        <Item
          key={person.id}
          title={person.name}
          subtitle={person.handle}
          leading={<Avatar source={person.avatar} variant={person.variant} size={36} />}
          trailing={<Badge content={t('people.new')} variant="subtle" size="sm" />}
          onPress={() => open(person.id)}
        />
      ))}
      <Loading size="sm" variant="inline" />
    </ScreenScrollView>
  );
}

export function About({
  bio,
  setBio,
  agreed,
  setAgreed,
}: {
  bio: string;
  setBio: (bio: string) => void;
  agreed: boolean;
  setAgreed: (agreed: boolean) => void;
}) {
  return (
    <ResponsiveGrid maxColumns={2} gap={16} testID="about">
      <Field label={t('about.bio')} description={t('about.bioHint')}>
        <Checkbox checked={agreed} onCheckedChange={setAgreed} label={t('about.agree')} />
      </Field>
      <Textarea
        value={bio}
        onChangeText={setBio}
        placeholder={t('about.placeholder')}
        rows={4}
        autoResize
        maxRows={8}
        showCount
        maxLength={500}
      />
      <IconCircle icon={RiStarLine} size="lg" />
    </ResponsiveGrid>
  );
}

export function Filters({
  topic,
  chosen,
  choose,
  liked,
  likes,
  like,
}: {
  topic: string;
  chosen: boolean;
  choose: () => void;
  liked: boolean;
  likes: number;
  like: () => void;
}) {
  return (
    <View className="flex-row items-center gap-2">
      <Chip size="xl" appearance="subtle" selected={chosen} onPress={choose}>
        {topic}
      </Chip>
      <Chip leadingIcon={RiHeart3Line} trailingIcon={RiCloseLine} disabled>
        Liked
      </Chip>
      <EngagementAction
        icon={RiHeart3Line}
        activeIcon={RiHeart3Fill}
        accessibilityLabel={t('post.like')}
        onPress={like}
        active={liked}
        count={likes}
        tone="error"
        popOnActivate
      />
    </View>
  );
}

export function Email({ email, setEmail }: { email: string; setEmail: (email: string) => void }) {
  return (
    <TextField size="lg" disabled>
      <TextFieldIcon icon={RiMailLine} />
      <TextFieldInput
        label={t('account.email')}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
      />
    </TextField>
  );
}

export function Glyphs() {
  const theme = useTheme();
  const { colors } = useTheme();
  return (
    <View className="flex-row gap-2" accessibilityRole="header">
      <RiHeart3Line width={20} height={20} fill={theme.colors.textSecondary} />
      <RiMailLine width={16} height={16} fill={colors.primary} />
      <RiStarLine fill={theme.colors.error} />
    </View>
  );
}

export function Styled({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.row}>
      <View style={{ flexGrow: 1, gap: 12 }}>{children}</View>
      <View style={[styles.badge, { marginLeft: 8 }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 },
  badge: { width: 24, height: 24 },
});

export function Speed({
  speed,
  setSpeed,
  save,
}: {
  speed: number;
  setSpeed: (speed: number) => void;
  save: (speed: number) => void;
}) {
  return (
    <Slider
      value={speed}
      onValueChange={setSpeed}
      label={t('player.speed')}
      min={0.5}
      max={2}
      step={0.25}
      formatValue={(value) => `${value}×`}
      onSlidingComplete={save}
    />
  );
}

export function Notice() {
  return <Admonition type="info">{t('post.privateMentions')}</Admonition>;
}

export function Header({ back }: { back: () => void }) {
  return (
    <PageHeader
      title={t('settings.title')}
      backLabel={t('common.back')}
      onBack={back}
      titleAlign="center"
      safeArea={false}
      actions={<Button onPress={back}>{t('common.done')}</Button>}
    />
  );
}

export function TopHeader() {
  return <PageHeader title={t('home.title')} onBack={null} presentation="floating" />;
}

export function Inbox({
  refreshing,
  refresh,
  children,
}: {
  refreshing: boolean;
  refresh: () => void;
  children: React.ReactNode;
}) {
  const theme = useTheme();
  return (
    <ScreenScrollView
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={refresh}
          tintColor={theme.colors.primary}
          colors={[theme.colors.primary]}
        />
      }
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40, gap: 12 }}
    >
      {children}
    </ScreenScrollView>
  );
}

export function FeedTabs({
  tab,
  setTab,
  tabs,
}: {
  tab: string;
  setTab: (tab: string) => void;
  tabs: { id: string; label: string; count?: number }[];
}) {
  return (
    <Tabs value={tab} onValueChange={setTab} variant="underline">
      {tabs.map((item: { id: string; label: string; count?: number }) => (
        <TabsTrigger key={item.id} value={item.id} label={item.label} count={item.count} />
      ))}
    </Tabs>
  );
}

export function ProfileTabs({ tab, setTab }: { tab: string; setTab: (tab: string) => void }) {
  return (
    <Tabs value={tab} onValueChange={setTab} fullWidth label={t('profile.sections')}>
      <TabsTrigger value="posts" label={t('profile.posts')} leadingIcon={RiStarLine} />
      {/* Likes are private. */}
      <TabsTrigger value="likes" label={t('profile.likes')} leadingIcon={RiHeart3Line} iconOnly />
    </Tabs>
  );
}

export function Range({
  range,
  setRange,
  ranges,
}: {
  range: string;
  setRange: (range: string) => void;
  ranges: { value: string; label: string }[];
}) {
  return (
    <View className="gap-2">
      <SegmentedControl
        label={t('stats.range')}
        type="radio"
        size="sm"
        value={range}
        onChange={setRange}
      >
        <SegmentedControlItem value="24h">
          <SegmentedControlItemText>{t('stats.day')}</SegmentedControlItemText>
        </SegmentedControlItem>
        <SegmentedControlItem value="7d" disabled={ranges.length === 0}>
          <SegmentedControlItemText>{t('stats.week')}</SegmentedControlItemText>
        </SegmentedControlItem>
      </SegmentedControl>
      <SegmentedControl type="tabs" variant="plain" value={range} onValueChange={setRange}>
        {ranges.map((item) => (
          <SegmentedControlItem key={item.value} value={item.value}>
            <SegmentedControlItemText>{item.label}</SegmentedControlItemText>
          </SegmentedControlItem>
        ))}
      </SegmentedControl>
    </View>
  );
}

export function Cadence({
  cadence,
  setCadence,
}: {
  cadence: string;
  setCadence: (c: string) => void;
}) {
  return (
    <Field label={t('plus.cadence')}>
      <SegmentedControl type="radio" value={cadence} onValueChange={setCadence}>
        <SegmentedControlItem value="month">
          <SegmentedControlItemText>{t('plus.month')}</SegmentedControlItemText>
        </SegmentedControlItem>
        <SegmentedControlItem value="year">
          <SegmentedControlItemText>{t('plus.year')}</SegmentedControlItemText>
        </SegmentedControlItem>
      </SegmentedControl>
    </Field>
  );
}

export function Autoplay({ mode, setMode }: { mode: string; setMode: (mode: string) => void }) {
  return (
    <SettingsSelect
      label={t('settings.autoplay')}
      value={mode}
      onChange={setMode}
      items={[
        { value: 'always', label: t('settings.always') },
        { value: 'never', label: t('settings.never') },
      ]}
    />
  );
}

export function Members({ members, total }: { members: AvatarGroupItem[]; total: number }) {
  return (
    <AvatarGroup
      items={members}
      layout="conversation"
      size={32}
      max={3}
      total={total}
      showInitials
    />
  );
}

export function Contacts({ rows, loading }: { rows: ListEntry[]; loading: boolean }) {
  return (
    <View className="gap-2">
      <List
        items={rows}
        separator="line"
        header={<Muted>{t('people.title')}</Muted>}
        empty={<Muted>{t('people.none')}</Muted>}
        testID="people"
      />
      <List items={rows} loading={loading} loadingCount={2} />
    </View>
  );
}
