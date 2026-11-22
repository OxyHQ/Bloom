import { Text } from 'react-native';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@bloom/hover-card';
import type { Cases } from '../support/cases';

export const CASES: Cases = {
  'HoverCard closed': () => (
    <HoverCard>
      <HoverCardTrigger testID="trigger">
        <Text>Ana</Text>
      </HoverCardTrigger>
      <HoverCardContent>
        <Text>Profile</Text>
      </HoverCardContent>
    </HoverCard>
  ),
  'HoverCard open, styled trigger': () => (
    <HoverCard defaultOpen>
      <HoverCardTrigger disabled style={{ padding: 4 }} testID="trigger">
        <Text>Ana</Text>
      </HoverCardTrigger>
      <HoverCardContent label="Ana" style={{ padding: 8 }}>
        <Text>Profile</Text>
      </HoverCardContent>
    </HoverCard>
  ),
};
