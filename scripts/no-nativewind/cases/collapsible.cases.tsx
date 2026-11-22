import { Text } from 'react-native';
import { Collapsible } from '@bloom/collapsible';
import type { Cases } from '../support/cases';

export const CASES: Cases = {
  'Collapsible open': () => (
    <Collapsible open testID="c">
      <Text>Body</Text>
    </Collapsible>
  ),
  'Collapsible closed, styled': () => (
    <Collapsible open={false} style={{ width: '100%' }} contentStyle={{ gap: 12, padding: 12 }}>
      <Text>Body</Text>
    </Collapsible>
  ),
};
