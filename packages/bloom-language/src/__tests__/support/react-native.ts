import { createElement, type ReactElement, type ReactNode, useState } from 'react';

/** React Native as host names: what the renderer creates is asserted directly. */
export const View = 'View';
export const Text = 'Text';

type PressChildren = ReactNode | ((state: { pressed: boolean }) => ReactNode);
type Handler = ((event?: unknown) => void) | undefined;

/**
 * React Native's `Pressable` drawn as the host `name`. Its children may be a
 * function of whether it is pressed, as React Native's may: then it holds that
 * state, set by its press in and out, and draws the children for it. Otherwise
 * it is the host itself, its props as they were handed.
 */
export function usePressHost(
  name: string,
  { children, ...props }: { children?: PressChildren; [prop: string]: unknown },
): ReactElement {
  const [pressed, setPressed] = useState(false);
  if (typeof children !== 'function') return createElement(name, props, children);
  const onPressIn = (event?: unknown) => {
    setPressed(true);
    (props.onPressIn as Handler)?.(event);
  };
  const onPressOut = (event?: unknown) => {
    setPressed(false);
    (props.onPressOut as Handler)?.(event);
  };
  return createElement(name, { ...props, onPressIn, onPressOut }, children({ pressed }));
}

export function Pressable(props: { children?: PressChildren; [prop: string]: unknown }) {
  return usePressHost('Pressable', props);
}
export const RefreshControl = 'RefreshControl';
export const Platform = {
  OS: 'ios',
  select: <T>(spec: { ios?: T; default?: T }) => spec.ios ?? spec.default,
};
export const StyleSheet = {
  hairlineWidth: 0.5,
  create: <T>(styles: T) => styles,
  flatten: (style: unknown) => style,
};
export const useWindowDimensions = () => ({ width: 400, height: 800, scale: 1, fontScale: 1 });
/** The system's scheme; the lens menu reads it for its `auto` scheme. */
export const useColorScheme = () => 'light';
