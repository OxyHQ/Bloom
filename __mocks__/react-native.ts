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
    if (style !== undefined) elementProps.style = style;

    return React.createElement(name, elementProps, children as React.ReactNode);
  });
  Component.displayName = name;
  return Component;
};

export const View = createComponent('View');
export const Text = createComponent('Text');
export const Image = createComponent('Image');
export const Pressable = createComponent('Pressable');
export const TouchableOpacity = createComponent('TouchableOpacity');
export const TextInput = createComponent('TextInput');
export const Modal = createComponent('Modal');
export const ActivityIndicator = createComponent('ActivityIndicator');

export const PanResponder = {
  create: (config: Record<string, unknown>) => ({
    panHandlers: {},
    _config: config,
  }),
};
export const ScrollView = React.forwardRef((props: Record<string, unknown>, ref: unknown) => {
  return React.createElement('ScrollView', { ref, ...props }, props.children as React.ReactNode);
});

export const Animated = {
  View: createComponent('Animated.View'),
  Text: createComponent('Animated.Text'),
  ScrollView: React.forwardRef((props: Record<string, unknown>, ref: unknown) => {
    return React.createElement('Animated.ScrollView', { ref, ...props }, props.children as React.ReactNode);
  }),
  Value: class AnimatedValue {
    _value: number;
    constructor(val: number) { this._value = val; }
    setValue(val: number) { this._value = val; }
    interpolate(_config: Record<string, unknown>) {
      // Return a stand-in animated node; tests only assert structure, not
      // interpolated output.
      return new AnimatedValue(this._value);
    }
  },
  spring: (_val: unknown, _config: Record<string, unknown>) => ({
    start: (cb?: () => void) => cb?.(),
    stop: () => {},
  }),
  timing: (_val: unknown, _config: Record<string, unknown>) => ({
    start: (cb?: () => void) => cb?.(),
    stop: () => {},
  }),
  loop: (_animation: { start: (cb?: () => void) => void; stop?: () => void }) => ({
    start: (cb?: () => void) => cb?.(),
    stop: () => {},
  }),
  sequence: (_animations: unknown[]) => ({
    start: (cb?: () => void) => cb?.(),
    stop: () => {},
  }),
  multiply: (a: unknown, _b: unknown) => a,
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

export const useWindowDimensions = () => ({ ...dimensionValues.window, scale: 1, fontScale: 1 });

export const StyleSheet = {
  create: <T extends Record<string, unknown>>(styles: T): T => styles,
  absoluteFill: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
  absoluteFillObject: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
  flatten: (style: unknown) => style,
  hairlineWidth: 1,
};

type PlatformOS = 'ios' | 'android' | 'web' | 'windows' | 'macos';

export const Platform: {
  OS: PlatformOS;
  select: (obj: Record<string, unknown>) => unknown;
  Version: number;
} = {
  OS: 'ios',
  select: (obj: Record<string, unknown>) => {
    const os = Platform.OS;
    if (os in obj) return obj[os];
    if (os === 'web' && 'web' in obj) return obj.web;
    return obj.default ?? obj.native;
  },
  Version: 17,
};

export const useColorScheme = () => 'light' as const;

export const Appearance = {
  getColorScheme: () => 'light' as 'light' | 'dark' | null,
  setColorScheme: (_scheme: 'light' | 'dark' | 'system') => {},
  addChangeListener: (_listener: (preferences: { colorScheme: 'light' | 'dark' | null }) => void) => ({
    remove: jest.fn(),
  }),
};

export const AccessibilityInfo = {
  isReduceMotionEnabled: () => Promise.resolve(false),
  addEventListener: (_event: string, _handler: (value: boolean) => void) => ({
    remove: jest.fn(),
  }),
  announceForAccessibility: (_message: string) => {},
};
