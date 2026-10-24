import { useReducedMotion } from 'react-native-reanimated';
import { MOTION_RECIPES } from '../motion/recipes';
import { useControllableState } from '../hooks/use-controllable-state';
import { useBloomAppearance } from '../appearance';
import { resolveBloomColors } from '../appearance/colors';
import React, { memo, useCallback, useEffect, useRef } from 'react';
import { Pressable, Animated, StyleSheet } from 'react-native';
import { SurfacePaint } from '../surface/SurfacePaint';
import { IS_WEB } from '../styles/platform';

import { useTheme } from '../theme/use-theme';
import { useSurfaceFill } from '../styles/surface-levels';
import { resolveSwitchOffPaint } from './paint';
import { animation, hitSlop } from '../styles/tokens';
import { bloomShadowStyle } from '../design-tokens/shadows';
import { useAccessibleNameWarning } from '../hooks/use-accessible-name-warning';
import { useIsRtl } from '../hooks/use-is-rtl';
import { useFieldMembership } from '../field/membership';
import type { SwitchProps } from './types';
import type { MemoRefComponent } from '../styles/native-refs';

const TRACK = {
  xs: { w: 30, h: 18 },
  sm: { w: 36, h: 22 },
  md: { w: 44, h: 26 },
  lg: { w: 52, h: 30 },
} as const;
const THUMB = { xs: 14, sm: 18, md: 22, lg: 26 } as const;
const PADDING = 2;
/** The web track's fill change, matched to the thumb's gentle spring. */
const TRACK_TRANSITION = 'background-color 300ms ease';
const SQUEEZE_RATIO = 0.75; // thumb height shrinks to 75% when pressed

const SwitchComponent = React.forwardRef<React.ElementRef<typeof Pressable>, SwitchProps>(
  (props, ref) => {
    const {
      checked: checkedProp,
      defaultChecked = false,
      onCheckedChange,
      disabled,
      style,
      size: sizeProp,
      tone: toneProp,
      accessibilityLabel,
      nativeID,
      testID,
    } = props;
    const [checked, setChecked] = useControllableState({
      value: checkedProp ?? false,
      controlled: Object.prototype.hasOwnProperty.call(props, 'checked'),
      defaultValue: defaultChecked,
      onChange: onCheckedChange,
    });
    const theme = useTheme();
    const reducedMotion = useReducedMotion();
    const rtl = useIsRtl();
    const { size, tone } = useBloomAppearance(
      { size: sizeProp, tone: toneProp },
      { size: 'md', tone: 'accent' },
    );
    const paint = resolveBloomColors(theme.colors, tone, 'solid');
    const surface = useSurfaceFill();
    const off = resolveSwitchOffPaint({
      surface,
      text: theme.colors.text,
      isDark: theme.isDark,
    });
    const field = useFieldMembership({ accessibilityLabel, disabled, nativeID });
    const isDisabled = field.disabled;
    useAccessibleNameWarning('Switch', field.accessibilityLabel);
    const anim = useRef(new Animated.Value(checked ? 1 : 0)).current;
    const pressAnim = useRef(new Animated.Value(0)).current;

    // Animated values notify mounted subscribers. Synchronize only after commit,
    // never while React is rendering a controlled update (or an abandoned render).
    useEffect(() => {
      if (reducedMotion) {
        anim.stopAnimation();
        anim.setValue(checked ? 1 : 0);
        return;
      }
      const transition = Animated.spring(anim, {
        toValue: checked ? 1 : 0,
        useNativeDriver: false,
        ...animation.spring.gentle,
      });
      transition.start();
      return () => transition.stop();
    }, [anim, checked, reducedMotion]);

    const handlePress = useCallback(() => {
      if (isDisabled) return;
      setChecked(!checked);
    }, [isDisabled, checked, setChecked]);

    const onPressIn = useCallback(() => {
      if (isDisabled) return;
      Animated.timing(pressAnim, {
        toValue: 1,
        useNativeDriver: false,
        duration: reducedMotion ? 0 : MOTION_RECIPES.press.duration,
      }).start();
    }, [isDisabled, pressAnim, reducedMotion]);

    const onPressOut = useCallback(() => {
      Animated.timing(pressAnim, {
        toValue: 0,
        useNativeDriver: false,
        duration: reducedMotion ? 0 : MOTION_RECIPES.press.duration,
      }).start();
    }, [pressAnim, reducedMotion]);

    const track = TRACK[size];
    const thumb = THUMB[size];
    const travel = track.w - thumb - PADDING * 2;

    const trackBg = anim.interpolate({
      inputRange: [0, 1],
      outputRange: [off.track, paint.background],
    });

    // `alignItems: 'flex-start'` parks the thumb at the inline start, which is
    // the RIGHT edge in RTL, while a `translateX` stays physical: the travel
    // has to point back across the track.
    const toward = rtl ? -1 : 1;
    const thumbX = anim.interpolate({
      inputRange: [0, 1],
      outputRange: [toward * PADDING, toward * (PADDING + travel)],
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
        hitSlop={hitSlop.md}
        testID={testID}
      >
        <Animated.View
          style={{
            width: track.w,
            height: track.h,
            borderRadius: track.h / 2,
            backgroundColor: IS_WEB ? 'transparent' : trackBg,
            justifyContent: 'center',
            alignItems: 'flex-start',
          }}
        >
          {/* The track is the shared surface material. Web paints its fill and
              transitions it; native keeps the animated fill on the track and
              paints only the sheen and rim, since a native paint cannot animate
              its fill. The thumb stays a plain raised knob: at its size the edge
              light reads as noise. */}
          <SurfacePaint
            fill={IS_WEB ? (checked ? paint.background : off.track) : undefined}
            radius={track.h / 2}
            composite
            transition={reducedMotion ? undefined : TRACK_TRANSITION}
          />
          <Animated.View
            style={[
              styles.thumb,
              {
                backgroundColor: anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [off.thumb, paint.foreground],
                }),
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
  },
);

SwitchComponent.displayName = 'Switch';

export const Switch: MemoRefComponent<SwitchProps, React.ComponentRef<typeof Pressable>> = memo(
  SwitchComponent,
);

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
