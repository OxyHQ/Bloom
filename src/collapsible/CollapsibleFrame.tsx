import React, { useCallback, useLayoutEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  findNodeHandle,
  TextInput,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import { styled } from 'react-native-css';
import {
  CollapsibleVisibilityContext,
  useCollapsibleVisibility,
} from './context';
import type { CollapsibleFrameProps } from './frame-types';

function CollapsibleFrameComponent({
  open,
  hidden,
  progress,
  children,
  style,
  contentStyle,
  returnFocusRef,
  nativeID,
  testID,
  labelledBy,
  returnFocusId,
}: CollapsibleFrameProps) {
  const visible = useCollapsibleVisibility() && open;
  const panel = useRef<View>(null);
  const initiallyOpen = useRef(open).current;
  const focusWithin = useRef(false);
  const [height, setHeight] = useState(0);
  const measure = useCallback((event: LayoutChangeEvent) => {
    const next = event.nativeEvent.layout.height;
    if (next > 0) setHeight((old) => (Math.abs(old - next) > 0.5 ? next : old));
  }, []);
  const restore = useCallback(() => {
    const input = TextInput.State?.currentlyFocusedInput?.();
    // Native host nodes expose contains without importing a private renderer.
    const root = panel.current;
    const inputInside = Boolean(
      root &&
      input &&
      'contains' in root &&
      typeof root.contains === 'function' &&
      root.contains(input),
    );
    if (!focusWithin.current && !inputInside) return;
    focusWithin.current = false;
    if (inputInside) input?.blur();
    const target =
      returnFocusRef?.current ??
      (returnFocusId && root && 'ownerDocument' in root
        ? root.ownerDocument?.getElementById(returnFocusId)
        : null);
    if (target && 'focus' in target && typeof target.focus === 'function') {
      target.focus();
      const handle =
        'measureInWindow' in target
          ? findNodeHandle(target as unknown as React.Component)
          : null;
      if (handle != null) AccessibilityInfo.setAccessibilityFocus(handle);
    }
  }, [returnFocusRef, returnFocusId]);
  useLayoutEffect(() => {
    if (!visible) restore();
  }, [visible, restore]);
  const maxHeight = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, height],
  });
  return (
    <CollapsibleVisibilityContext.Provider value={visible}>
      <Animated.View
        ref={panel}
        nativeID={nativeID}
        testID={testID}
        {...{ 'aria-labelledby': labelledBy }}
        aria-hidden={!visible}
        accessibilityElementsHidden={!visible}
        importantForAccessibility={visible ? 'auto' : 'no-hide-descendants'}
        pointerEvents={visible ? 'auto' : 'none'}
        onFocus={() => {
          focusWithin.current = true;
          if (!visible) restore();
        }}
        onBlur={() => {
          focusWithin.current = false;
        }}
        style={[
          {
            overflow: 'hidden',
            opacity: progress,
            maxHeight:
              height === 0 && open && initiallyOpen ? undefined : maxHeight,
          },
          style,
        ]}
      >
        <View
          collapsable={false}
          onLayout={measure}
          style={[
            { flexShrink: 0 },
            contentStyle,
            hidden ? { display: 'none' } : undefined,
          ]}
        >
          {children}
        </View>
      </Animated.View>
    </CollapsibleVisibilityContext.Provider>
  );
}
export const CollapsibleFrame = styled(CollapsibleFrameComponent, {
  className: 'style',
  contentClassName: 'contentStyle',
});
