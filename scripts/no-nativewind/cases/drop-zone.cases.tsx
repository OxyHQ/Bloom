import { Text } from 'react-native';
import { DropZone } from '@bloom/drop-zone';
import type { Cases } from '../support/cases';

export const CASES: Cases = {
  'DropZone plain': () => (
    <DropZone accept={['files']} onDrop={() => {}} testID="zone">
      <Text>Drop here</Text>
    </DropZone>
  ),
  'DropZone styled': () => (
    <DropZone
      accept={['files']}
      disabled
      onDrop={() => {}}
      style={{ padding: 12, borderWidth: 1 }}
      testID="zone"
    >
      <Text>Drop here</Text>
    </DropZone>
  ),
};
