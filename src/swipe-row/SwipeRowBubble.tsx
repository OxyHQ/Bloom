import { useCallback } from 'react';
import { Pressable } from 'react-native';
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';
import { Text } from '../typography';
import { bubbleGeometry } from './bubble-geometry';
import type { SwipeRowAction } from './types';

/** Presentation only; SwipeRow owns gesture arbitration, settling and action dispatch. */
export function SwipeRowBubble({
  action,
  side,
  index,
  count,
  primary,
  actionWidth,
  translateX,
  rowWidth,
  background,
  foreground,
  onPress,
  open,
  testID,
}: {
  action: SwipeRowAction;
  side: 'left' | 'right';
  index: number;
  count: number;
  primary: number;
  actionWidth: number;
  translateX: SharedValue<number>;
  rowWidth: SharedValue<number>;
  background: string;
  foreground: string;
  onPress: () => void;
  open: boolean;
  testID?: string;
}) {
  const sign = side === 'left' ? 1 : -1;
  const geometry = useCallback(() => {
    'worklet';
    return bubbleGeometry(
      Math.max(0, sign * translateX.value),
      count * actionWidth,
      rowWidth.value,
      count,
      index,
      primary,
    );
  }, [actionWidth, count, index, primary, rowWidth, sign, translateX]);
  const style = useAnimatedStyle(() => {
    const shape = geometry();
    return {
      width: shape.width,
      marginLeft: index === 0 ? shape.gap : 0,
      marginRight: shape.gap,
      transform: [{ scaleY: shape.scaleY }],
    };
  }, [geometry, index, translateX, rowWidth]);
  const labelStyle = useAnimatedStyle(() => {
    const width = Math.max(0, Math.min(96, geometry().width - 64));
    return { width, opacity: Math.min(1, width / 32) };
  }, [geometry, translateX, rowWidth]);
  const Icon = action.icon;
  return (
    <Animated.View
      style={[
        {
          alignSelf: 'stretch',
          marginVertical: 4,
          borderRadius: 999,
          overflow: 'hidden',
          backgroundColor: background,
        },
        style,
      ]}
    >
      <Pressable
        role="button"
        accessibilityLabel={action.label}
        focusable={open}
        tabIndex={open ? 0 : -1}
        onPress={onPress}
        style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}
        testID={testID}
      >
        <Icon width={20} height={20} fill={foreground} />
        <Animated.View style={[{ overflow: 'hidden' }, labelStyle]}>
          <Text
            numberOfLines={1}
            variant="caption-1-medium"
            style={{ color: foreground, paddingLeft: 6 }}
          >
            {action.label}
          </Text>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}
