import type { Meta, StoryObj } from '@storybook/react-vite';

import { SettingsGeneralPage } from '../settings-modal';
import {
  BloomPreferencesProvider,
  useHapticsSettingRow,
  useVideoAutoplaySettingRow,
} from './index';

/**
 * The ready-made rows on a settings page. Their state is Bloom's: change one and
 * every component below the provider (haptics, video, GIFs) follows it.
 */
function AccessibilityPage() {
  const haptics = useHapticsSettingRow();
  const autoplay = useVideoAutoplaySettingRow();
  return (
    <SettingsGeneralPage
      sections={[
        { key: 'interaction', label: 'Interaction', rows: [haptics] },
        { key: 'media', label: 'Media', rows: [autoplay] },
      ]}
    />
  );
}

const meta: Meta<typeof BloomPreferencesProvider> = {
  id: 'base-preferences',
  title: 'Components/Settings/Preferences',
  component: BloomPreferencesProvider,
  parameters: { controls: { disable: true } },
};

export default meta;

type Story = StoryObj<typeof BloomPreferencesProvider>;

export const SettingsRows: Story = {
  render: () => (
    <BloomPreferencesProvider>
      <AccessibilityPage />
    </BloomPreferencesProvider>
  ),
};
