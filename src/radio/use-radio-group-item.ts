import { useCallback, useContext, type KeyboardEvent } from 'react';
import { Platform, type View } from 'react-native';
import { useChoiceSpaceKey } from '../hooks/use-choice-space-key';
import { RadioGroupContext } from './context';

/** One host owns both Space activation and its group's roving keyboard focus. */
export function useRadioGroupItem(value: string, disabled: boolean, activate: () => void) {
  const group = useContext(RadioGroupContext);
  const space = useChoiceSpaceKey(disabled, activate);
  const ref = useCallback((node: View | null) => group?.register(value, node), [group, value]);
  if (Platform.OS !== 'web') return { ref };
  return {
    ...space,
    ...(group
      ? { ref, tabIndex: !disabled && group.tabValue === value ? (0 as const) : (-1 as const) }
      : {}),
    onKeyDown(event: KeyboardEvent<HTMLElement>) {
      space.onKeyDown?.(event);
      if (!disabled && !event.defaultPrevented) group?.onKeyDown(value, event);
    },
  };
}
