import { useState } from 'react';
import { runOnJS, useAnimatedReaction } from 'react-native-reanimated';

import { useMinimizeState } from '../tab-bar/context';

export function useFabMinimized(enabled: boolean): boolean {
  const { target } = useMinimizeState();
  const [isMinimized, setIsMinimized] = useState(enabled && target.value === 1);

  useAnimatedReaction(
    () => enabled && target.value === 1,
    (next, previous) => {
      if (next !== previous) runOnJS(setIsMinimized)(next);
    },
    [enabled, target],
  );

  return isMinimized;
}
