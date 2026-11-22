import { Text } from 'react-native';
import { WindowControls, WindowDragRegion } from '@bloom/window';
import type { Cases } from '../support/cases';

export const CASES: Cases = {
  'WindowDragRegion plain': () => (
    <WindowDragRegion testID="region">
      <Text>Title</Text>
    </WindowDragRegion>
  ),
  'WindowDragRegion styled, disabled': () => (
    <WindowDragRegion disabled style={{ flexDirection: 'row', height: 52 }} testID="region">
      <Text>Back</Text>
    </WindowDragRegion>
  ),
  WindowControls: () => <WindowControls />,
};
