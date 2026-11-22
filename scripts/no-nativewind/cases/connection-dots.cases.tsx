import { View } from 'react-native';
import { ConnectionDots } from '@bloom/connection-dots';
import type { Cases } from '../support/cases';

export const CASES: Cases = {
  'ConnectionDots plain': () => <ConnectionDots />,
  'ConnectionDots loaded': () => (
    <ConnectionDots
      left={<View style={{ width: 10, height: 10 }} />}
      right={<View style={{ width: 12, height: 12 }} />}
      dotCount={5}
      dotSize={6}
      accessibilityLabel="Linking"
      style={{ padding: 4 }}
      reducedMotion
    />
  ),
};
