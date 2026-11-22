import { Text } from 'react-native';
import { Screen, ScreenContent, ScreenScrollView } from '@bloom/screen';
import type { Cases } from '../support/cases';

export const CASES: Cases = {
  'Screen scroll content': () => (
    <Screen scroll="content" header={<Text>Header</Text>} headerHeight={56}>
      <ScreenScrollView testID="scroll" contentContainerStyle={{ gap: 16, padding: 16 }}>
        <ScreenContent>
          <Text>Row</Text>
        </ScreenContent>
      </ScreenScrollView>
    </Screen>
  ),
  'ScreenContent document, full': () => (
    <ScreenContent kind="document" width="full" style={{ gap: 8 }}>
      <Text>Body</Text>
    </ScreenContent>
  ),
};
