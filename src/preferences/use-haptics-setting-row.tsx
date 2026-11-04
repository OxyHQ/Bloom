import { Platform } from 'react-native';

import { useMessages } from '../locale/messages';
import type { SettingsRowData } from '../settings-modal/types';
import { Switch } from '../switch';
import { useBloomPreferences } from './context';
import { PREFERENCES_MESSAGES } from './messages';

/**
 * The ready-made haptics row, for a `SettingsGeneralPage` section (or
 * `SettingsRow`). The app places it; Bloom owns its state, persistence and
 * text. A `Switch` and nothing heavier: it links no `Select`.
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
