import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Platform, type StyleProp, Text, type TextStyle, View, type ViewStyle } from 'react-native';
import Animated, { Easing, LinearTransition } from 'react-native-reanimated';

import { useTheme } from '../theme/use-theme';
import { atoms as a, platform } from '../styles';
import { Button, type ButtonProps } from '../button';

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
 * <SegmentedControl.Root value={value} onChange={setValue}>
 *   <SegmentedControl.Item value="one">
 *     <SegmentedControl.ItemText value="one">
 *       One
 *     </SegmentedControl.ItemText>
 *   </SegmentedControl.Item>
 *   <SegmentedControl.Item value="two">
 *     <SegmentedControl.ItemText value="two">
 *       Two
 *     </SegmentedControl.ItemText>
 *   </SegmentedControl.Item>
 * </SegmentedControl.Root>
 * ```
 */
export function Root<T extends string>({
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

  return (
    <View
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint ?? ''}
      style={[
        a.w_full,
        a.flex_1,
        a.relative,
        a.flex_row,
        { backgroundColor: theme.colors.contrast50 },
        { borderRadius: 14 },
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

export function Item({
  value,
  style,
  children,
  onPress: onPressProp,
  ...props
}: { value: string; children: React.ReactNode } & Omit<ButtonProps, 'children'>) {
  const [position, setPosition] = useState<{ x: number; width: number } | null>(
    null,
  );

  const ctx = useContext(InternalContext);
  if (!ctx) {
    throw new Error(
      'SegmentedControl.Item must be used within a SegmentedControl.Root',
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

  return (
    <View
      style={[a.flex_1, a.flex_row]}
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
      <Button
        {...props}
        onPress={onPress}
        accessibilityLabel={props.accessibilityLabel}
        accessibilityHint={props.accessibilityHint}
        style={[
          a.flex_1,
          a.bg_transparent,
          a.px_sm,
          a.py_xs,
          { minHeight: ctx.size === 'large' ? 40 : 32, borderRadius: 10 },
          style,
        ]}>
        <InternalItemContext.Provider value={{ active }}>
          {children}
        </InternalItemContext.Provider>
      </Button>
    </View>
  );
}

export function ItemText({
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
      'SegmentedControl.ItemText must be used within a SegmentedControl.Item',
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
        platform({
          web: {
            boxShadow: '0px 2px 4px 0px #0000000D',
          },
          ios: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0x0d / 0xff,
            shadowRadius: 4,
          },
          android: { elevation: 0.25 },
        }),
        platform({
          native: { left: x },
          web: { transform: [{ translateX: x }] },
        }),
      ]}
    />
  );
}
