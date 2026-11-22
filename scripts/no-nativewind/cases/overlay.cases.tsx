import { Text } from 'react-native';
import { Backdrop, OverlayRoot } from '@bloom/overlay';
import type { Cases } from '../support/cases';

export const CASES: Cases = {
  'OverlayRoot stacked': () => (
    <OverlayRoot>
      <Text>Panel</Text>
    </OverlayRoot>
  ),
  'OverlayRoot pinned, modal, styled': () => (
    <OverlayRoot zIndex={500} modal style={{ padding: 4 }} testID="root">
      <Backdrop onPress={() => {}} />
      <Text>Panel</Text>
    </OverlayRoot>
  ),
};
