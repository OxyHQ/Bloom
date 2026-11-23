import { Text } from 'react-native';
import { PressableScale } from '@bloom/pressable-scale';
import type { Cases } from '../support/cases';

export const CASES: Cases = {
  'PressableScale plain': () => (
    <PressableScale accessibilityLabel="Open">
      <Text>Open</Text>
    </PressableScale>
  ),
  'PressableScale styled': () => (
    <PressableScale targetScale={0.9} disabled style={{ flexDirection: 'row', padding: 12 }}>
      <Text>Row</Text>
    </PressableScale>
  ),
};
