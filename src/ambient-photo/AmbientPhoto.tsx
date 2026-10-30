import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { BloomImage } from '../image';
import { pointerEventsStyle } from '../styles/pointer-events';
import { DEFAULT_DRIFT_MS, DEFAULT_DRIFT_SCALE, DEFAULT_FADE_MS, RELEASE_SLACK_MS } from './shared';
import type { AmbientPhotoProps } from './types';

interface Layer {
  uri: string;
  key: number;
}

interface Layers {
  /** The `source` the layers were last adjusted for. */
  source: string | null;
  /** Ascending: a newer photo always has a larger key. */
  layers: Layer[];
  /** The key of the photo on screen, or `null` before the first has loaded. */
  shown: number | null;
  next: number;
}

/**
 * NATIVE {@link AmbientPhoto}: one layer per photo, each fading and drifting on
 * the UI thread. A new `source` joins as an invisible layer; it fades in only
 * once its image has loaded, over the photo on screen, which is unmounted (and
 * its image released) when the fade is over. At most two photos are held.
 */
export function AmbientPhoto({
  source,
  fadeMs = DEFAULT_FADE_MS,
  drift = true,
  driftMs = DEFAULT_DRIFT_MS,
  driftScale = DEFAULT_DRIFT_SCALE,
  onShown,
  style,
  testID,
}: AmbientPhotoProps) {
  const [state, setState] = useState<Layers>({ source: null, layers: [], shown: null, next: 0 });

  // A new photo joins during render, as the incoming layer. A photo that was
  // still loading is replaced by it: only the one on screen stays below.
  if (source && source !== state.source) {
    const kept = state.layers.filter((layer) => layer.key === state.shown);
    setState({
      source,
      layers: [...kept, { uri: source, key: state.next }],
      shown: state.shown,
      next: state.next + 1,
    });
  }

  // Once a fade is over, the photo it covered lets go of its image.
  useEffect(() => {
    if (state.shown === null) return;
    const shown = state.shown;
    const timer = setTimeout(() => {
      setState((current) => ({
        ...current,
        layers: current.layers.filter((layer) => layer.key >= shown),
      }));
    }, fadeMs + RELEASE_SLACK_MS);
    return () => clearTimeout(timer);
  }, [state.shown, fadeMs]);

  return (
    <View
      style={[styles.root, pointerEventsStyle('none'), style]}
      testID={testID}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {state.layers.map((layer) => (
        <AmbientLayer
          key={layer.key}
          uri={layer.uri}
          visible={layer.key === state.shown}
          fadeMs={fadeMs}
          drift={drift}
          driftMs={driftMs}
          driftScale={driftScale}
          onReady={() => {
            // Only the newest photo fades in; one replaced while it loaded never does.
            if (layer.key !== state.next - 1) return;
            setState((current) => ({ ...current, shown: layer.key }));
            onShown?.(layer.uri);
          }}
        />
      ))}
    </View>
  );
}

function AmbientLayer({
  uri,
  visible,
  fadeMs,
  drift,
  driftMs,
  driftScale,
  onReady,
}: {
  uri: string;
  visible: boolean;
  fadeMs: number;
  drift: boolean;
  driftMs: number;
  driftScale: number;
  onReady: () => void;
}) {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    opacity.value = withTiming(visible ? 1 : 0, {
      duration: fadeMs,
      easing: Easing.inOut(Easing.ease),
    });
    if (visible && drift) {
      scale.value = 1;
      scale.value = withTiming(driftScale, {
        duration: driftMs,
        easing: Easing.out(Easing.ease),
        reduceMotion: ReduceMotion.System,
      });
    }
  }, [visible, fadeMs, drift, driftMs, driftScale, opacity, scale]);

  const animated = useAnimatedStyle(
    () => ({
      opacity: opacity.value,
      transform: [{ scale: scale.value }],
    }),
    [opacity, scale],
  );

  return (
    <Animated.View style={[StyleSheet.absoluteFill, animated]}>
      <BloomImage
        source={{ uri }}
        contentFit="cover"
        style={StyleSheet.absoluteFill}
        onLoad={onReady}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, overflow: 'hidden' },
});
