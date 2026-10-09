import { useCallback, type Ref } from 'react';
import { Platform } from 'react-native';

/** RNW drops title on Pressable/View; bind the browser's own tooltip to its host. */
export function useBrowserTitle<T>(title: string | undefined, forwardedRef?: Ref<T>) {
  return useCallback((node: T | null): void => {
    if (typeof forwardedRef === 'function') forwardedRef(node);
    else if (forwardedRef) forwardedRef.current = node;
    if (Platform.OS !== 'web' || typeof HTMLElement === 'undefined' || !(node instanceof HTMLElement)) return;
    if (title === undefined) node.removeAttribute('title');
    else node.setAttribute('title', title);
  }, [title, forwardedRef]);
}
