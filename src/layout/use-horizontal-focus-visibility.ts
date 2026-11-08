import { useCallback, useMemo, useRef } from 'react';
import type { ComponentRef, Ref } from 'react';
import { Platform } from 'react-native';
import type { ScrollView } from 'react-native';
import { mergeRefs } from '../hooks/merge-refs';
import { observeHorizontalFocus } from './horizontal-focus-visibility';

type ScrollRef = ComponentRef<typeof ScrollView>;

/** Both published web and neutral ScrollArea paths share the actual viewport. */
export function useHorizontalFocusVisibility(ref: Ref<ScrollRef> | undefined, horizontal: boolean) {
  const cleanup = useRef<(() => void) | null>(null);
  const attach = useCallback(
    (instance: ScrollRef | null) => {
      cleanup.current?.();
      cleanup.current = null;
      if (!horizontal || Platform.OS !== 'web' || typeof HTMLElement === 'undefined') return;
      const handle = instance as unknown as {
        getScrollableNode?: () => unknown;
      } | null;
      const node = handle?.getScrollableNode?.() ?? instance;
      if (node instanceof HTMLElement) cleanup.current = observeHorizontalFocus(node);
    },
    [horizontal],
  );
  return useMemo(() => mergeRefs([ref, attach]), [ref, attach]);
}
