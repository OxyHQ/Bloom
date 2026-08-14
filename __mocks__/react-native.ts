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

export const FlatList = React.forwardRef((props: Record<string, unknown>, ref: unknown) => {
  const data = Array.isArray(props.data) ? (props.data as unknown[]) : [];
  const renderItem = props.renderItem as
    | ((info: { item: unknown; index: number }) => React.ReactNode)
    | undefined;
  const keyExtractor = props.keyExtractor as
    | ((item: unknown, index: number) => string)
    | undefined;
  const renderSlot = (slot: unknown): React.ReactNode => {
    if (!slot) return null;
    if (React.isValidElement(slot)) return slot;
    if (typeof slot === 'function') return (slot as () => React.ReactNode)();
    return null;
  };
  const rows =
    data.length === 0
      ? renderSlot(props.ListEmptyComponent)
      : data.map((item, index) =>
          React.createElement(
            'FlatListItem',
            { key: keyExtractor ? keyExtractor(item, index) : String(index) },
            renderItem ? renderItem({ item, index }) : null,
          ),
        );
  return React.createElement(
    'FlatList',
    { ref, testID: props.testID },
    renderSlot(props.ListHeaderComponent),
    rows,
    renderSlot(props.ListFooterComponent),
  );
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

export const PixelRatio = {
  get: () => 1,
  getFontScale: () => 1,
  getPixelSizeForLayoutSize: (size: number) => size,
  roundToNearestPixel: (size: number) => size,
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

// `AppState` is consulted by the toast engine to pause/resume auto-close timers
// when the app (or browser tab) is backgrounded. `isAvailable` mirrors the real
// module's flag — the engine guards on it because RN-Web reports it false during
// prerender/SSR.
export const AppState: {
  currentState: 'active' | 'background' | 'inactive';
  isAvailable: boolean;
  addEventListener: (
    event: string,
    handler: (state: 'active' | 'background' | 'inactive') => void,
  ) => { remove: () => void };
} = {
  currentState: 'active',
  isAvailable: true,
  addEventListener: (
    _event: string,
    _handler: (state: 'active' | 'background' | 'inactive') => void,
  ) => ({
    remove: jest.fn(),
  }),
};

export const AccessibilityInfo = {
  isReduceMotionEnabled: () => Promise.resolve(false),
  addEventListener: (_event: string, _handler: (value: boolean) => void) => ({
    remove: jest.fn(),
  }),
  announceForAccessibility: (_message: string) => {},
  setAccessibilityFocus: jest.fn((_reactTag: number) => {}),
};

/**
 * Enough of `findNodeHandle` for the screen-reader focus hooks to run.
 *
 * Without it they threw the moment a timer advanced with a surface open — which
 * no suite did, so the whole path was unreachable and green.
 */
export const findNodeHandle = jest.fn((instance: unknown): number | null =>
  instance == null ? null : 1,
);

export const Linking = {
  openURL: jest.fn((_url: string) => Promise.resolve()),
  canOpenURL: jest.fn((_url: string) => Promise.resolve(true)),
  addEventListener: (_event: string, _handler: (event: { url: string }) => void) => ({
    remove: jest.fn(),
  }),
  getInitialURL: () => Promise.resolve(null),
};
