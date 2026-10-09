import { useCallback, useContext, useLayoutEffect } from 'react';
import { Platform, type ScrollViewProps } from 'react-native';
import { ViewportContext } from './context';
import type { ViewportBindingOptions } from './types';

/** Compose with restoration/metrics callbacks; no React renders on scroll. */
export function useViewportBinding({ viewportRef, onScroll, onLayout, onContentSizeChange }: ViewportBindingOptions) {
  const scope = useContext(ViewportContext);
  if (Platform.OS !== 'web' && !scope) throw new Error('Bloom useViewportBinding requires ViewportProvider on native.');
  if (onScroll != null && typeof onScroll !== 'function') {
    throw new Error('Bloom useViewportBinding onScroll expects a plain RN callback; pass its returned onScroll through the observer slot of your animated binding.');
  }
  const notify = useCallback(() => {
    if (Platform.OS !== 'web') scope?.listeners.forEach((listener) => listener());
  }, [scope]);
  useLayoutEffect(() => {
    if (!scope || Platform.OS === 'web') return;
    if (scope.getNode) throw new Error('Each ViewportProvider supports one viewport binding. Nest another provider for a nested scroller.');
    const getNode = () => viewportRef.current;
    scope.getNode = getNode;
    notify();
    return () => { if (scope.getNode === getNode) scope.getNode = null; notify(); };
  }, [scope, viewportRef, notify]);
  const handleScroll = useCallback<NonNullable<ScrollViewProps['onScroll']>>((event) => {
    notify(); onScroll?.(event);
  }, [notify, onScroll]);
  const handleLayout = useCallback<NonNullable<ScrollViewProps['onLayout']>>((event) => {
    notify(); onLayout?.(event);
  }, [notify, onLayout]);
  const handleContentSizeChange = useCallback<NonNullable<ScrollViewProps['onContentSizeChange']>>((width, height) => {
    notify(); onContentSizeChange?.(width, height);
  }, [notify, onContentSizeChange]);
  return { onScroll: handleScroll, onLayout: handleLayout, onContentSizeChange: handleContentSizeChange, scrollEventThrottle: 16 };
}
