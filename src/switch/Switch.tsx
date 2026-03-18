import React, { memo, useEffect, useRef } from 'react';
import { Pressable, Animated } from 'react-native';

import { useTheme } from '../theme/use-theme';
import { animation } from '../styles/tokens';
import type { SwitchProps } from './types';

const TRACK = { default: { w: 44, h: 26 }, sm: { w: 36, h: 22 } } as const;
const THUMB = { default: 22, sm: 18 } as const;
const PADDING = 2;
const SQUEEZE_RATIO = 0.75; // thumb height shrinks to 75% when pressed

const SwitchComponent = React.forwardRef<React.ElementRef<typeof Pressable>, SwitchProps>(
  ({ value, onValueChange, disabled, style, size = 'default', testID }, ref) => {
    const theme = useTheme();
    const anim = useRef(new Animated.Value(value ? 1 : 0)).current;
    const pressAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      Animated.spring(anim, {
        toValue: value ? 1 : 0,
        useNativeDriver: false,
        ...animation.spring.gentle,
      }).start();
    }, [value, anim]);

    const onPressIn = () => {
      if (disabled) return;
      Animated.spring(pressAnim, {
        toValue: 1,
        useNativeDriver: false,
        ...animation.spring.snappy,
      }).start();
    };

    const onPressOut = () => {
      Animated.spring(pressAnim, {
        toValue: 0,
        useNativeDriver: false,
        ...animation.spring.gentle,
      }).start();
    };

    const track = TRACK[size];
    const thumb = THUMB[size];
    const travel = track.w - thumb - PADDING * 2;

    const trackBg = anim.interpolate({
      inputRange: [0, 1],
      outputRange: [theme.colors.border, theme.colors.primary],
    });

    const thumbX = anim.interpolate({
      inputRange: [0, 1],
      outputRange: [PADDING, PADDING + travel],
    });

    const squeezedHeight = thumb * SQUEEZE_RATIO;

    const thumbHeight = pressAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [thumb, squeezedHeight],
    });

    const thumbRadius = pressAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [thumb / 2, squeezedHeight / 2],
    });

    return (
      <Pressable
        ref={ref}
        role="switch"
        aria-checked={value}
        accessibilityState={{ checked: value, disabled }}
        onPress={() => !disabled && onValueChange(!value)}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        style={[{ opacity: disabled ? 0.4 : 1 }, style]}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        testID={testID}
      >
        <Animated.View
          style={{
            width: track.w,
            height: track.h,
            borderRadius: track.h / 2,
            backgroundColor: trackBg,
            justifyContent: 'center',
            alignItems: 'flex-start',
          }}
        >
          <Animated.View
            style={{
              width: thumb,
              height: thumbHeight,
              borderRadius: thumbRadius,
              backgroundColor: '#fff',
              transform: [{ translateX: thumbX }],
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.15,
              shadowRadius: 3,
              elevation: 3,
            }}
          />
        </Animated.View>
      </Pressable>
    );
  }
);

SwitchComponent.displayName = 'Switch';

export const Switch = memo(SwitchComponent);
