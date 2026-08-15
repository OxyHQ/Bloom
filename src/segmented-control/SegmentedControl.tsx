import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Platform,
  Pressable,
  type PressableProps,
  type StyleProp,
  Text,
  type TextStyle,
  View,
  type ViewStyle,
} from 'react-native';
import Animated, { Easing, LinearTransition } from 'react-native-reanimated';

import { useTheme } from '../theme/use-theme';
import { bloomShadowStyle } from '../design-tokens/shadows';
import { useInteractionState } from '../hooks/use-interaction-state';
import { atoms as a, platform } from '../styles';

const InternalContext = createContext<{
  type: 'tabs' | 'radio';
  size: 'small' | 'large';
  selectedValue: string;
  selectedPosition: { width: number; x: number } | null;
  onSelectValue: (
    value: string,
    position: { width: number; x: number } | null,
  ) => void;
  updatePosition: (position: { width: number; x: number }) => void;
} | null>(null);

/**
 * Segmented control component.
 *
 * @example
 * ```tsx
 * <SegmentedControl label="Example" type="radio" value={value} onChange={setValue}>
 *   <SegmentedControlItem value="one">
 *     <SegmentedControlItemText>One</SegmentedControlItemText>
 *   </SegmentedControlItem>
 *   <SegmentedControlItem value="two">
 *     <SegmentedControlItemText>Two</SegmentedControlItemText>
 *   </SegmentedControlItem>
 * </SegmentedControl>
 * ```
 */
export function SegmentedControl<T extends string>({
  label,
  type = 'radio',
  size = 'large',
  value,
  onChange,
  children,
  style,
  accessibilityHint,
}: {
  label: string;
  type: 'tabs' | 'radio';
  size?: 'small' | 'large';
  value: T;
  onChange: (value: T) => void;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  accessibilityHint?: string;
}) {
  const theme = useTheme();
  const [selectedPosition, setSelectedPosition] = useState<{
    width: number;
    x: number;
  } | null>(null);

  const contextValue = useMemo(() => {
    return {
      type,
      size,
      selectedValue: value,
      selectedPosition,
      onSelectValue: (
        val: string,
        position: { width: number; x: number } | null,
      ) => {
        onChange(val as T);
        if (position) setSelectedPosition(position);
      },
      updatePosition: (position: { width: number; x: number }) => {
        setSelectedPosition(currPos => {
          if (
            currPos &&
            currPos.width === position.width &&
            currPos.x === position.x
          ) {
            return currPos;
          }
          return position;
        });
      },
    };
  }, [value, selectedPosition, setSelectedPosition, onChange, type, size]);

  // Height of the wrapping pill matches the active item height (item
  // `minHeight` + 4px outer `p_xs` padding on both sides). Locking the
  // outer View to this exact height keeps the control as a tight inline
  // pill on every platform — without it, a parent column flex context
  // (the default on a `<View>`) would let the Root stretch vertically
  // and the items inside would inherit that stretched height, blowing
  // the control up into a giant block on native.
  const itemMinHeight = size === 'large' ? 40 : 32;
  const pillHeight = itemMinHeight + 8;

  return (
    <View
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint ?? ''}
      style={[
        a.w_full,
        a.relative,
        a.flex_row,
        a.align_center,
        { backgroundColor: theme.colors.contrast50 },
        { borderRadius: 14, height: pillHeight },
        a.p_xs,
        style,
      ]}
      role={type === 'tabs' ? 'tablist' : 'radiogroup'}>
      {selectedPosition !== null && (
        <Slider x={selectedPosition.x} width={selectedPosition.width} />
      )}
      <InternalContext.Provider value={contextValue}>
        {children}
      </InternalContext.Provider>
    </View>
  );
}

const InternalItemContext = createContext<{
  active: boolean;
} | null>(null);

export function SegmentedControlItem({
  value,
  style,
  children,
  onPress: onPressProp,
  accessibilityLabel,
  accessibilityHint,
  testID,
  disabled,
}: {
  value: string;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  testID?: string;
  disabled?: PressableProps['disabled'];
}) {
  const [position, setPosition] = useState<{ x: number; width: number } | null>(
    null,
  );
  // Drive press-opacity via state, not Pressable's function-form `style`:
  // NativeWind v4's css-interop swallows the function form, which would drop
  // the segment's base layout styles (flex_1, padding, minHeight, radius).
  const { state: pressed, onIn: onPressIn, onOut: onPressOut } =
    useInteractionState();

  const ctx = useContext(InternalContext);
  if (!ctx) {
    throw new Error(
      'SegmentedControlItem must be used within a SegmentedControl',
    );
  }

  const active = ctx.selectedValue === value;

  const needsUpdate =
    active &&
    position &&
    (ctx.selectedPosition?.x !== position.x ||
      ctx.selectedPosition?.width !== position.width);

  // Use a ref to avoid re-running the layout effect when updatePosition changes
  const updatePositionRef = useRef(ctx.updatePosition);
  updatePositionRef.current = ctx.updatePosition;

  const positionRef = useRef(position);
  positionRef.current = position;

  useLayoutEffect(() => {
    if (needsUpdate && positionRef.current) {
      updatePositionRef.current(positionRef.current);
    }
  }, [needsUpdate]);

  const onPress = useCallback(() => {
    ctx.onSelectValue(value, position);
    onPressProp?.();
  }, [ctx, value, position, onPressProp]);

  // We render the segment as a flat `Pressable` (not Bloom's `Button`)
  // for two reasons:
  //   1. Layout: we need the touch target to participate directly in the
  //      Root's row flex layout so `flex: 1` distributes the items
  //      evenly on every platform. Bloom Button wraps its Pressable in
  //      an Animated.View that doesn't forward layout-affecting styles,
  //      which would collapse the segment to its natural text width.
  //   2. Semantics: the Root carries `role="tablist"`/`"radiogroup"` and
  //      each item carries `role="tab"`/`"radio"`. Bloom Button always
  //      adds `accessibilityRole="button"` — that overrides the correct
  //      a11y role for tablist children.
  const itemRole = ctx.type === 'tabs' ? 'tab' : 'radio';
  const itemMinHeight = ctx.size === 'large' ? 40 : 32;

  return (
    <View
      style={[a.flex_1, a.flex_row, a.align_stretch]}
      onLayout={evt => {
        const measuredPosition = {
          x: evt.nativeEvent.layout.x,
          width: evt.nativeEvent.layout.width,
        };
        if (!ctx.selectedPosition && active) {
          ctx.onSelectValue(value, measuredPosition);
        }
        setPosition(measuredPosition);
      }}>
      <Pressable
        onPress={onPress}
        onPressIn={disabled ? undefined : onPressIn}
        onPressOut={disabled ? undefined : onPressOut}
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        // The active state has to be spelled as an `aria-*` prop, because
        // react-native-web never reads `accessibilityState` (React Native folds
        // these back into it, so native is unaffected) — and WHICH prop depends
        // on the role: ARIA gives `tab` a selected state and `radio` a checked
        // one, so a single spelling would be invalid for one of the two modes.
        {...(itemRole === 'tab'
          ? { 'aria-selected': active }
          : { 'aria-checked': active })}
        role={itemRole}
        disabled={disabled}
        testID={testID}
        style={[
          a.flex_1,
          a.flex_row,
          a.align_center,
          a.justify_center,
          a.bg_transparent,
          a.px_sm,
          a.py_xs,
          { minHeight: itemMinHeight, borderRadius: 10 },
          pressed && !disabled && { opacity: 0.7 },
          style,
        ]}>
        <InternalItemContext.Provider value={{ active }}>
          {children}
        </InternalItemContext.Provider>
      </Pressable>
    </View>
  );
}

export function SegmentedControlItemText({
  style,
  children,
  ...props
}: { children: React.ReactNode; style?: StyleProp<TextStyle> } & Omit<
  React.ComponentProps<typeof Text>,
  'style' | 'children'
>) {
  const theme = useTheme();
  const ctx = useContext(InternalItemContext);
  if (!ctx) {
    throw new Error(
      'SegmentedControlItemText must be used within a SegmentedControlItem',
    );
  }

  return (
    <Text
      {...props}
      style={[
        a.text_center,
        a.text_md,
        a.font_medium,
        a.px_xs,
        ctx.active
          ? { color: theme.colors.text }
          : { color: theme.colors.textTertiary },
        style,
      ]}>
      {children}
    </Text>
  );
}

function Slider({ x, width }: { x: number; width: number }) {
  const theme = useTheme();

  const nativeLayout =
    Platform.OS !== 'web'
      ? LinearTransition.easing(Easing.out(Easing.exp))
      : undefined;

  return (
    <Animated.View
      layout={nativeLayout}
      style={[
        a.absolute,
        { backgroundColor: theme.colors.background },
        {
          top: 4,
          bottom: 4,
          left: 0,
          width,
          borderRadius: 10,
        },
        // `shadow-s` — the subtle-raise role, already platform-forked. This was
        // the package's ONLY hardcoded shadow colour ('#000') and its own
        // three-way platform split.
        bloomShadowStyle('s'),
        platform({
          native: { left: x },
          web: { transform: [{ translateX: x }] },
        }),
      ]}
    />
  );
}
