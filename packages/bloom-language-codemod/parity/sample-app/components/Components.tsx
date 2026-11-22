// Bloom components as apps write them, each one a rule of the codemod's (src/components.ts).
import { Admonition } from '@oxy.so/bloom/admonition';
import { Avatar } from '@oxy.so/bloom/avatar';
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
import { Loading, SpinnerIcon } from '@oxy.so/bloom/loading';
import { PageHeader } from '@oxy.so/bloom/page-header';
import { ScreenScrollView } from '@oxy.so/bloom/screen';
import { Slider } from '@oxy.so/bloom/slider';
import { Search } from '@oxy.so/bloom/search';
import { SettingsSection, SettingsValueField } from '@oxy.so/bloom/settings-modal';
import { Switch } from '@oxy.so/bloom/switch';
import { TextField, TextFieldIcon, TextFieldInput } from '@oxy.so/bloom/text-field';
import { Textarea } from '@oxy.so/bloom/textarea';
import { useTheme } from '@oxy.so/bloom/theme';
import { Muted } from '@oxy.so/bloom/typography';
import { StyleSheet, View } from 'react-native';

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
