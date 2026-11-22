import { Text } from 'react-native';
import { Chip } from '@bloom/chip';
import type { Cases } from '../support/cases';

export const CASES: Cases = {
  'Chip plain': () => <Chip>Tag</Chip>,
  'Chip pressable selected, sizes': () => (
    <>
      <Chip size="sm" selected onPress={() => {}}>
        Small
      </Chip>
      <Chip size="lg" variant="outline" onPress={() => {}}>
        Large
      </Chip>
    </>
  ),
  'Chip closable, disabled': () => (
    <Chip onPress={() => {}} onClose={() => {}} disabled leading={<Text>i</Text>}>
      Remove me
    </Chip>
  ),
  'Chip styled': () => (
    <Chip
      style={{ backgroundColor: '#eef0f1', paddingHorizontal: 7 }}
      textStyle={{ color: '#123' }}
    >
      Custom
    </Chip>
  ),
};
