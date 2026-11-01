import { type ComponentRef, useCallback, useContext, type KeyboardEvent } from 'react';
import { Platform, type View } from 'react-native';
import { useChoiceSpaceKey } from '../hooks/use-choice-space-key';
import { RadioGroupContext } from './context';
import { mergeRefs } from '../hooks/merge-refs';

/** One host owns both Space activation and its group's roving keyboard focus. */
export function useRadioGroupItem(value: string, disabled: boolean, activate: () => void) {
  const group = useContext(RadioGroupContext);
  const space = useChoiceSpaceKey(disabled, activate);
  const ref = useCallback(
    (node: ComponentRef<typeof View> | null) => group?.register(value, node),
    [group, value],
  );
  if (Platform.OS !== 'web') {
    // A native host's keyboard: the group's one stop and its arrows.
    const roving = group?.rovingItem(value, disabled);
    if (!roving?.ref) return { ref };
    const merged: typeof ref = mergeRefs<ComponentRef<typeof View>>([ref, roving.ref]);
    return { ...roving, ref: merged };
  }
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
