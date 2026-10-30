import type React from 'react';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
} from 'react-native-reanimated';

import { useDirectionProps } from '../hooks/use-is-rtl';
import type { Props as IconProps } from '../icons/shared';
import { RiCloseLine } from '../icons/remix/RiCloseLine';
import { RiExpandDiagonalSLine } from '../icons/remix/RiExpandDiagonalSLine';
import { RiSubtractLine } from '../icons/remix/RiSubtractLine';
import { useMessages } from '../locale/messages';
import { animateWithSpec, type MotionSpec } from '../motion/spec';
import { SurfacePaint } from '../surface/SurfacePaint';
import { useTheme } from '../theme/use-theme';
import {
  WINDOW_CONTROL_DISC,
  WINDOW_CONTROL_PRESSED_SCALE,
  WINDOW_CONTROL_SYMBOL,
  WINDOW_CONTROL_TARGET,
  WINDOW_CONTROLS_PLATE_PADDING,
} from './constants';
import { WINDOW_MESSAGES } from './messages';
import type { WindowControlsProps } from './types';
import { useWindow } from './use-window';

/** Pressing in shrinks the disc; letting go springs it back as the control acts. */
const PRESS_IN: MotionSpec = { duration: 100, easing: [0.25, 0.1, 0.25, 1] };
const RELEASE: MotionSpec = { response: 0.32, dampingRatio: 0.6 };

/** Built once, so the animated node's identity is stable across renders. */
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface ControlPaint {
  fill: string;
  symbol: string;
}

function WindowControl({
  label,
  icon: Icon,
  paint,
  offset,
  top,
  symbols,
  onPress,
  testID,
}: {
  label: string;
  icon: React.ComponentType<IconProps>;
  paint: ControlPaint;
  /** From the group's leading edge. */
  offset: number;
  top: number;
  symbols: boolean;
  onPress: () => void;
  testID?: string;
}) {
  const reducedMotion = useReducedMotion();
  const scale = useSharedValue(1);
  // `scale` in the deps: web without the worklets plugin does not track reads.
  const pressStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }), [scale]);
  return (
    <AnimatedPressable
      role="button"
      accessibilityLabel={label}
      onPress={onPress}
      onPressIn={() => {
        cancelAnimation(scale);
        animateWithSpec(scale, WINDOW_CONTROL_PRESSED_SCALE, PRESS_IN, reducedMotion);
      }}
      onPressOut={() => {
        cancelAnimation(scale);
        animateWithSpec(scale, 1, RELEASE, reducedMotion);
      }}
      testID={testID}
      style={[
        {
          position: 'absolute',
          top,
          insetInlineStart: offset,
          width: WINDOW_CONTROL_TARGET,
          height: WINDOW_CONTROL_TARGET,
          alignItems: 'center',
          justifyContent: 'center',
        },
        pressStyle,
      ]}
    >
      <View
        style={{
          width: WINDOW_CONTROL_DISC,
          height: WINDOW_CONTROL_DISC,
          borderRadius: WINDOW_CONTROL_DISC / 2,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <SurfacePaint
          fill={paint.fill}
          radius={WINDOW_CONTROL_DISC / 2}
          testID={testID ? `${testID}-paint` : undefined}
        />
        {/* The symbol is a sibling of the paint, never its ancestor, so its fade
            cannot become the material's backdrop root. */}
        <View
          aria-hidden
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          pointerEvents="none"
          testID={testID ? `${testID}-symbol` : undefined}
          style={{ opacity: symbols ? 1 : 0 }}
        >
          <Icon width={WINDOW_CONTROL_SYMBOL} height={WINDOW_CONTROL_SYMBOL} fill={paint.symbol} />
        </View>
      </View>
    </AnimatedPressable>
  );
}

/**
 * The window's controls (close, minimize, zoom): three bubbles of the surface
 * material where the platform says they are, `metrics.controls`, from the top
 * and the leading edge of the box it is mounted in, which must be the window's
 * own corner (`AppShell` and `SettingsLayout` mount it there). On the active
 * window they are tinted red, yellow and green; on an inactive one, neutral.
 * The pointer over the group shows their symbols; a press shrinks a bubble to
 * 88 % and springs it back as it acts.
 *
 * Draws nothing without the `window` capability, where the platform draws its
 * own controls (`controls: 'platform'`), and while the window is full screen.
 */
export function WindowControls({
  plate = false,
  closeLabel,
  minimizeLabel,
  zoomLabel,
  testID,
}: WindowControlsProps) {
  const appWindow = useWindow();
  const { messages } = useMessages(WINDOW_MESSAGES);
  const { colors } = useTheme();
  const dirProps = useDirectionProps();
  const [hovered, setHovered] = useState(false);
  if (appWindow?.controls !== 'bloom' || appWindow.fullscreen) return null;

  const { start, top, width, height } = appWindow.metrics.controls;
  // Three targets, the first at the group's leading edge and the last at its
  // end: the platform's width decides how far apart they are.
  const pitch = (width - WINDOW_CONTROL_TARGET) / 2;
  const targetTop = (height - WINDOW_CONTROL_TARGET) / 2;
  const neutral: ControlPaint = { fill: colors.backgroundTertiary, symbol: colors.textSecondary };
  const controls = [
    {
      key: 'close',
      label: closeLabel ?? messages.close,
      icon: RiCloseLine,
      paint: appWindow.active ? { fill: colors.error, symbol: colors.errorForeground } : neutral,
      onPress: appWindow.close,
    },
    {
      key: 'minimize',
      label: minimizeLabel ?? messages.minimize,
      icon: RiSubtractLine,
      paint: appWindow.active
        ? { fill: colors.warning, symbol: colors.warningForeground }
        : neutral,
      onPress: appWindow.minimize,
    },
    {
      key: 'zoom',
      label: zoomLabel ?? messages.zoom,
      icon: RiExpandDiagonalSLine,
      paint: appWindow.active
        ? { fill: colors.success, symbol: colors.successForeground }
        : neutral,
      onPress: appWindow.zoom,
    },
  ];
  const pad = plate ? WINDOW_CONTROLS_PLATE_PADDING : 0;
  const plateHeight = height + pad * 2;
  return (
    <View
      {...dirProps}
      pointerEvents="box-none"
      testID={testID}
      style={{
        position: 'absolute',
        top: top - pad,
        insetInlineStart: start - pad,
        width: width + pad * 2,
        height: plateHeight,
        borderRadius: plate ? plateHeight / 2 : undefined,
      }}
    >
      {plate ? <SurfacePaint fill={colors.card} radius={plateHeight / 2} /> : null}
      <View
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
        testID={testID ? `${testID}-group` : undefined}
        style={{ position: 'absolute', top: pad, insetInlineStart: pad, width, height }}
      >
        {controls.map((control, index) => (
          <WindowControl
            key={control.key}
            label={control.label}
            icon={control.icon}
            paint={control.paint}
            offset={pitch * index}
            top={targetTop}
            symbols={hovered}
            onPress={control.onPress}
            testID={testID ? `${testID}-${control.key}` : undefined}
          />
        ))}
      </View>
    </View>
  );
}
