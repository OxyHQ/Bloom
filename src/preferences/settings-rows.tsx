import { Platform } from 'react-native';

import { useMessages } from '../locale/messages';
import { SettingsSelect } from '../settings-modal/SettingsSelect';
import type { SettingsRowData } from '../settings-modal/types';
import { Switch } from '../switch';
import { useBloomPreferences } from './context';
import { PREFERENCES_MESSAGES } from './messages';
import type { VideoAutoplayPolicy } from './types';

/**
 * Ready-made settings rows for the preferences Bloom's components honour, for a
 * `SettingsGeneralPage` section (or `SettingsRow`). The app places them; Bloom
 * owns their state, persistence and text.
 */
export function useHapticsSettingRow(): SettingsRowData {
  const { messages } = useMessages(PREFERENCES_MESSAGES);
  const { preferences, setPreference } = useBloomPreferences();
  const unavailable = Platform.OS === 'web';
  return {
    key: 'bloom-haptics',
    label: messages.haptics,
    description: unavailable ? messages.hapticsUnavailable : messages.hapticsDescription,
    control: (
      <Switch
        checked={preferences.haptics}
        onCheckedChange={(enabled) => setPreference('haptics', enabled)}
        disabled={unavailable}
        accessibilityLabel={messages.haptics}
      />
    ),
  };
}

export function useVideoAutoplaySettingRow(): SettingsRowData {
  const { messages } = useMessages(PREFERENCES_MESSAGES);
  const { preferences, setPreference } = useBloomPreferences();
  return {
    key: 'bloom-video-autoplay',
    label: messages.videoAutoplay,
    description: messages.videoAutoplayDescription,
    control: (
      <SettingsSelect<VideoAutoplayPolicy>
        label={messages.videoAutoplay}
        value={preferences.videoAutoplay}
        onChange={(policy) => setPreference('videoAutoplay', policy)}
        items={[
          { value: 'always', label: messages.autoplayAlways },
          { value: 'wifi', label: messages.autoplayWifi },
          { value: 'never', label: messages.autoplayNever },
        ]}
      />
    ),
  };
}
