import { normalizeBloomSize } from '../appearance/legacy';
import { useBloomAppearance } from '../appearance';
import { resolveBloomColors } from '../appearance/colors';
import React, { memo, useCallback, useRef } from 'react';
import { Pressable, Animated, StyleSheet } from 'react-native';

import { useTheme } from '../theme/use-theme';
import { animation } from '../styles/tokens';
import { bloomShadowStyle } from '../design-tokens/shadows';
import { useAccessibleNameWarning } from '../hooks/use-accessible-name-warning';
import { useFieldMembership } from '../field/membership';
import type { SwitchProps } from './types';

const TRACK = { xs: { w: 30, h: 18 }, sm: { w: 36, h: 22 }, md: { w: 44, h: 26 }, lg: { w: 52, h: 30 } } as const;
const THUMB = { xs: 14, sm: 18, md: 22, lg: 26 } as const;
const PADDING = 2;
const SQUEEZE_RATIO = 0.75; // thumb height shrinks to 75% when pressed

const SwitchComponent = React.forwardRef<React.ElementRef<typeof Pressable>, SwitchProps>(
  ({ checked: checkedProp, value, onCheckedChange: onCheckedChangeProp, onValueChange, disabled, style, size: sizeProp, tone: toneProp, accessibilityLabel, nativeID, testID }, ref) => {
    const checked = checkedProp ?? value ?? false;
    const onCheckedChange = onCheckedChangeProp ?? onValueChange;
    const theme = useTheme();
    const {size, tone} = useBloomAppearance({size: normalizeBloomSize(sizeProp), tone: toneProp}, {size: 'md', tone: 'accent'});
    const paint = resolveBloomColors(theme.colors, tone, 'solid');
    const field = useFieldMembership({ accessibilityLabel, disabled, nativeID });
    const isDisabled = field.disabled;
    useAccessibleNameWarning('Switch', field.accessibilityLabel);
    const anim = useRef(new Animated.Value(checked ? 1 : 0)).current;
    const pressAnim = useRef(new Animated.Value(0)).current;

    // Track last checked to detect external changes and animate accordingly.
    // This avoids useEffect while still handling controlled checked changes.
    const prevValueRef = useRef(checked);
    if (prevValueRef.current !== checked) {
      prevValueRef.current = checked;
      Animated.spring(anim, {
        toValue: checked ? 1 : 0,
        useNativeDriver: false,
        ...animation.spring.gentle,
      }).start();
    }

    const handlePress = useCallback(() => {
      if (isDisabled) return;
      onCheckedChange?.(!checked);
    }, [isDisabled, checked, onCheckedChange]);

    const onPressIn = useCallback(() => {
      if (isDisabled) return;
      Animated.spring(pressAnim, {
        toValue: 1,
        useNativeDriver: false,
        ...animation.spring.snappy,
      }).start();
    }, [isDisabled, pressAnim]);

    const onPressOut = useCallback(() => {
      Animated.spring(pressAnim, {
        toValue: 0,
        useNativeDriver: false,
        ...animation.spring.gentle,
      }).start();
    }, [pressAnim]);

    const track = TRACK[size];
    const thumb = THUMB[size];
    const travel = track.w - thumb - PADDING * 2;

    const trackBg = anim.interpolate({
      inputRange: [0, 1],
      outputRange: [theme.colors.border, paint.background],
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
        aria-checked={checked}
        // The NAME. A switch renders a track and a thumb, so there is no text
        // for the name to be computed from and no sibling caption either
        // platform will adopt — without this the control announces "switch, on"
        // and nothing more. One spelling covers both: react-native-web's
        // `createDOMProps` emits `aria-label` from it, React Native reads it
        // directly. That is NOT the rule for `accessibilityState` two lines up,
        // which reaches native alone; the state and the name differ here.
        accessibilityLabel={field.accessibilityLabel}
        nativeID={field.nativeID}
        aria-describedby={field.describedBy}
        aria-invalid={field.invalid || undefined}
        // The disabled state has to travel on this prop, not on `aria-disabled`:
        // react-native-web's `Pressable` appends its own `aria-disabled` from
        // `disabled` AFTER spreading the caller's props, so a caller-supplied
        // one is overwritten. `handlePress` already no-ops when disabled, so
        // this only adds what was missing — the announced state, and skipping
        // the control in the tab order.
        disabled={isDisabled}
        onPress={handlePress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        style={[isDisabled && styles.disabled, style]}
        hitSlop={HIT_SLOP}
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
            style={[
              styles.thumb,
              {
                backgroundColor: anim.interpolate({ inputRange: [0, 1], outputRange: [theme.colors.text, paint.foreground] }),
                width: thumb,
                height: thumbHeight,
                borderRadius: thumbRadius,
                transform: [{ translateX: thumbX }],
              },
            ]}
          />
        </Animated.View>
      </Pressable>
    );
  }
);

SwitchComponent.displayName = 'Switch';

export const Switch = memo(SwitchComponent);

const HIT_SLOP = { top: 8, bottom: 8, left: 8, right: 8 } as const;

const styles = StyleSheet.create({
  disabled: {
    opacity: 0.4,
  },
  thumb: {
    // Subtle raise (`shadow-s`) — `boxShadow` on web (RN-Web deprecated `shadow*`),
    // RN elevation/shadow on native.
    ...bloomShadowStyle('s'),
  },
});
