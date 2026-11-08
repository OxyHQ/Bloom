import { useCallback, useMemo, useRef } from 'react';
import type { ComponentRef, Ref } from 'react';
import { Platform } from 'react-native';
import type { ScrollView } from 'react-native';
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
  return useMemo(() => {
    if (!horizontal || Platform.OS !== 'web') return ref;
    let forwardedCleanup: (() => void) | undefined;
    // Keep a void return for cross-copy React type compatibility, but honor
    // React 19 callback cleanup when React detaches this forwarding ref.
    return (instance: ScrollRef | null): void => {
      attach(instance);
      if (forwardedCleanup) {
        forwardedCleanup();
        forwardedCleanup = undefined;
        if (instance === null) return;
      }
      if (typeof ref === 'function') {
        const cleanup = ref(instance);
        if (typeof cleanup === 'function') forwardedCleanup = cleanup;
      } else if (ref) ref.current = instance;
    };
  }, [ref, attach, horizontal]);
}
