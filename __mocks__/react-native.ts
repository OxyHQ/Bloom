import React from 'react';

const createComponent = (name: string) => {
  const Component = React.forwardRef((props: Record<string, unknown>, ref: unknown) => {
    const {
      children,
      testID,
      accessibilityLabel,
      accessibilityHint,
      accessibilityRole,
      accessibilityState,
      style,
      onPress,
      onPressIn,
      onPressOut,
      disabled,
      hitSlop,
      ...rest
    } = props;
    const elementProps: Record<string, unknown> = {
      ref,
      ...rest,
    };
    if (testID) elementProps.testID = testID;
    if (accessibilityLabel) elementProps.accessibilityLabel = accessibilityLabel;
    if (accessibilityHint) elementProps.accessibilityHint = accessibilityHint;
    if (accessibilityRole) elementProps.accessibilityRole = accessibilityRole;
    if (accessibilityState) elementProps.accessibilityState = accessibilityState;
    if (disabled != null) elementProps.disabled = disabled;
    if (onPress) elementProps.onPress = disabled ? undefined : onPress;

    return React.createElement(name, elementProps, children as React.ReactNode);
  });
  Component.displayName = name;
  return Component;
};

export const View = createComponent('View');
export const Text = createComponent('Text');
export const Pressable = createComponent('Pressable');
export const TouchableOpacity = createComponent('TouchableOpacity');
export const Modal = createComponent('Modal');
export const ScrollView = React.forwardRef((props: Record<string, unknown>, ref: unknown) => {
  return React.createElement('ScrollView', { ref, ...props }, props.children as React.ReactNode);
});

export const Animated = {
  View: createComponent('Animated.View'),
  ScrollView: React.forwardRef((props: Record<string, unknown>, ref: unknown) => {
    return React.createElement('Animated.ScrollView', { ref, ...props }, props.children as React.ReactNode);
  }),
  Value: class AnimatedValue {
    _value: number;
    constructor(val: number) { this._value = val; }
  },
  spring: (_val: unknown, _config: Record<string, unknown>) => ({
    start: (cb?: () => void) => cb?.(),
  }),
  timing: (_val: unknown, _config: Record<string, unknown>) => ({
    start: (cb?: () => void) => cb?.(),
  }),
  createAnimatedComponent: (comp: unknown) => comp,
};

const dimensionValues = {
  window: { width: 375, height: 812 },
  screen: { width: 375, height: 812 },
};

export const Dimensions = {
  get: (dim: 'window' | 'screen') => ({ ...dimensionValues[dim] }),
  addEventListener: (_event: string, handler: (event: { window: { width: number; height: number }; screen: { width: number; height: number } }) => void) => {
    return {
      remove: jest.fn(),
    };
  },
};

export const StyleSheet = {
  create: <T extends Record<string, unknown>>(styles: T): T => styles,
  absoluteFill: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
  absoluteFillObject: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
  flatten: (style: unknown) => style,
  hairlineWidth: 1,
};

export const Platform = {
  OS: 'ios' as const,
  select: (obj: Record<string, unknown>) => obj.ios ?? obj.default,
  Version: 17,
};

export const useColorScheme = () => 'light' as const;
