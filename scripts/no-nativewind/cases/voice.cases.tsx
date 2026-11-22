import { View } from 'react-native';
import { AudioWaveVisualizer, VoiceControls, VoiceOverlay } from '@bloom/voice';
import { PortalOutlet, PortalProvider } from '@bloom/portal';
import type { Cases } from '../support/cases';

const noop = () => {};

export const CASES: Cases = {
  'AudioWaveVisualizer plain': () => <AudioWaveVisualizer levels={[0.2, 0.5, 0.9]} />,
  'AudioWaveVisualizer loaded': () => (
    <AudioWaveVisualizer
      levels={[0.2, 0.5, 0.9]}
      bars={5}
      size="lg"
      tone="danger"
      active={false}
      style={{ margin: 4 }}
      testID="wave"
    />
  ),
  'VoiceControls plain': () => <VoiceControls />,
  'VoiceControls loaded': () => (
    <VoiceControls
      state="listening"
      muted
      onMutedChange={noop}
      paused={false}
      onPausedChange={noop}
      onEnd={noop}
      onTypeInstead={noop}
      size="md"
      leading={<View style={{ width: 4, height: 4 }} />}
      style={{ padding: 2 }}
      testID="controls"
    />
  ),
  'VoiceOverlay open': () => (
    <PortalProvider>
      <VoiceOverlay open state="speaking" levels={[0.3, 0.6]} onEnd={noop} testID="overlay" />
      <PortalOutlet />
    </PortalProvider>
  ),
};
