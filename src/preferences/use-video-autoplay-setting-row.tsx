import { useMessages } from '../locale/messages';
import { SettingsSelect } from '../settings-modal/SettingsSelect';
import type { SettingsRowData } from '../settings-modal/types';
import { useBloomPreferences } from './context';
import { PREFERENCES_MESSAGES } from './messages';
import type { VideoAutoplayPolicy } from './types';

/**
 * The ready-made video-autoplay row (always / Wi-Fi only / never), for a
 * `SettingsGeneralPage` section (or `SettingsRow`). The app places it; Bloom
 * owns its state, persistence and text.
 */
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
