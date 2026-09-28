import { useComposerButton } from './context';
import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { RiArrowUpLine } from '../icons/remix/RiArrowUpLine';
import { RiMic2Line } from '../icons/remix/RiMic2Line';
import { RiStopFill } from '../icons/remix/RiStopFill';
import type { WebCssStyle } from '../styles/web-view-style';
import { CONTROL_SIZE, type ComposerPalette } from './shared';
import { IS_WEB } from './web-hooks';

const EASE_OUT = Easing.bezier(0, 0, 0.2, 1);
const EASE_IN_OUT = Easing.bezier(0.42, 0, 0.58, 1);

/** Staggered clocks and heights so the bars read as live audio, not a loop. */
const MIC_BARS = [
  { height: 8, duration: 900, delay: -400 },
  { height: 15, duration: 700, delay: -150 },
  { height: 11, duration: 1050, delay: -600 },
  { height: 14, duration: 800, delay: -300 },
] as const;

/** One equalizer bar: CSS keyframes on web, a reanimated loop on native. */
function MicBar({ bar, color }: { bar: (typeof MIC_BARS)[number]; color: string }) {
  const reducedMotion = useReducedMotion();
  const scale = useSharedValue(0.7);
  useEffect(() => {
    if (IS_WEB) return;
    if (reducedMotion) {
      scale.value = 0.7;
      return;
    }
    const half = bar.duration / 2;
    scale.value = 0.4;
    scale.value = withRepeat(
      withSequence(
        withTiming(1, { duration: half, easing: EASE_IN_OUT }),
        withTiming(0.4, { duration: half, easing: EASE_IN_OUT }),
      ),
      -1,
    );
    return () => cancelAnimation(scale);
  }, [bar.duration, reducedMotion, scale]);
  const nativeStyle = useAnimatedStyle(() => ({ transform: [{ scaleY: scale.value }] }), [scale]);

  const base = { width: 2.5, height: bar.height, borderRadius: 9999, backgroundColor: color };
  if (IS_WEB) {
    // The keyframes live in the family sheet; each bar runs its own clock.
    const web: WebCssStyle = reducedMotion
      ? { ...base, transform: [{ scaleY: 0.7 }] }
      : { ...base, animation: `bloom-composer-mic-bars ${bar.duration}ms ease-in-out ${bar.delay}ms infinite` };
    return <View style={web} />;
  }
  return <Animated.View style={[base, nativeStyle]} />;
}

/** A layer that blurs/scales out to 0.8 as it leaves and back in as it arrives (280ms ease-out). */
function SwapLayer({ shown, children }: { shown: boolean; children: React.ReactNode }) {
  const reducedMotion = useReducedMotion();
  const progress = useSharedValue(shown ? 1 : 0);
  useEffect(() => {
    progress.value = reducedMotion ? (shown ? 1 : 0) : withTiming(shown ? 1 : 0, { duration: 280, easing: EASE_OUT });
  }, [shown, reducedMotion, progress]);
  const style = useAnimatedStyle(
    () => ({
      opacity: progress.value,
      transform: [{ scale: 0.8 + 0.2 * progress.value }],
      ...(IS_WEB ? { filter: progress.value >= 1 ? 'none' : `blur(${3 * (1 - progress.value)}px)` } : null),
    }),
    [progress],
  );
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
        style,
      ]}>
      {children}
    </Animated.View>
  );
}

/**
 * Voice input: a 36px shared Button surface with
 * a mic that crossfades to four dancing accent-500 bars (2.5 wide, 2.5
 * apart) while listening.
 */
export function MicButton({
  listening,
  onToggle,
  label,
  palette,
}: {
  listening: boolean;
  onToggle: () => void;
  label: string;
  palette: Pick<ComposerPalette, 'accent500' | 'iconPrimary'>;
}) {
  const Button = useComposerButton();
  return (
    <Button
      appearance="solid" tone="neutral" size="md" iconOnly
      accessibilityLabel={label} pressed={listening} onPress={onToggle}
      style={{ width: CONTROL_SIZE, height: CONTROL_SIZE, flexShrink: 0, paddingLeft: 0, paddingRight: 0 }}>
      <SwapLayer shown={listening}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2.5 }}>
          {MIC_BARS.map((bar, index) => (
            <MicBar key={index} bar={bar} color={palette.accent500} />
          ))}
        </View>
      </SwapLayer>
      <SwapLayer shown={!listening}>
        <RiMic2Line width={20} height={20} fill={palette.iconPrimary} />
      </SwapLayer>
    </Button>
  );
}

/** Send delegates its material, state colours and accessible disabled behavior to Button. */
export function SendButton({ disabled, onPress, label }: {
  disabled: boolean; onPress: () => void; label: string;
}) {
  const Button = useComposerButton();
  return <Button appearance="solid" tone="action" size="md" iconOnly icon={RiArrowUpLine} iconSize={20}
    disabled={disabled} onPress={onPress} accessibilityLabel={label}
    style={{ width: CONTROL_SIZE, height: CONTROL_SIZE, flexShrink: 0, paddingLeft: 0, paddingRight: 0 }} />;
}

/** Cancellation stays enabled while the composer's draft/send controls are disabled. */
export function StopButton({ onPress, label }: {
  onPress?: () => void; label: string;
}) {
  const Button = useComposerButton();
  return <Button appearance="solid" tone="action" size="md" iconOnly icon={RiStopFill} iconSize={20}
    onPress={onPress} accessibilityLabel={label}
    style={{ width: CONTROL_SIZE, height: CONTROL_SIZE, flexShrink: 0, paddingLeft: 0, paddingRight: 0 }} />;
}
