// Bloom components as apps write them, each one a rule of the codemod's (src/components.ts).
import { Button } from '@oxy.so/bloom/button';
import { Card } from '@oxy.so/bloom/card';
import { ChatEmptyState } from '@oxy.so/bloom/chat-screen';
import { GroupedSection, GroupedSectionItem } from '@oxy.so/bloom/grouped-section';
import { RiSmartphoneLine } from '@oxy.so/bloom/icons/RiSmartphoneLine';
import { ScreenScrollView } from '@oxy.so/bloom/screen';
import { SettingsSection, SettingsValueField } from '@oxy.so/bloom/settings-modal';
import { Switch } from '@oxy.so/bloom/switch';
import { TextFieldInput } from '@oxy.so/bloom/text-field';
import { View } from 'react-native';

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
