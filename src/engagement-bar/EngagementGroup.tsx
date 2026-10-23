import { useContext } from 'react';
import { View } from 'react-native';

import { EngagementBarContext } from './context';
import type { EngagementGroupProps } from './types';

/**
 * Adjacent actions that read as ONE control — an up/down vote with its score —
 * on a single pill: a hairline border over the neutral tint. The actions inside
 * keep their own press wash, which the pill's radius contains.
 */
export function EngagementGroup({ children, style, testID }: EngagementGroupProps) {
  const bar = useContext(EngagementBarContext);
  if (!bar) throw new Error('EngagementGroup must be rendered inside an EngagementBar.');
  return (
    <View style={[bar.paint.group, style]} testID={testID}>
      {children}
    </View>
  );
}
