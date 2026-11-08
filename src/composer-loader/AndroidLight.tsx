import { useMemo, useState, type ReactNode } from 'react';
import {
  Platform,
  processColor,
  requireNativeComponent,
  StyleSheet,
  UIManager,
  type ViewProps,
} from 'react-native';
import Animated, { useAnimatedProps, type SharedValue } from 'react-native-reanimated';
import type { ComposerLoaderGeometry } from './shared';

type NativeLightProps = ViewProps & {
  seconds?: number;
  speed: number;
  reverse: boolean;
  boxWidth: number;
  boxHeight: number;
  radius: number;
  perimeter: number;
  palette: number[];
  strokes: ComposerLoaderGeometry['strokes'];
  onUnsupported: () => void;
};

// A JS-only update (including Expo Go) must remain usable without rebuilding
// the host binary. The versioned name is the native prop/event contract.
function resolveNativeLight() {
  if (Platform.OS !== 'android' || Number(Platform.Version) < 31) return null;
  try {
    if (!UIManager.getViewManagerConfig('BloomComposerLightV1')) return null;
    return Animated.createAnimatedComponent(
      requireNativeComponent<NativeLightProps>('BloomComposerLightV1'),
    );
  } catch {
    return null;
  }
}
const NativeLight = resolveNativeLight();

/** Internal paint adapter. Its fallback shares the owner's geometry and clock. */
export function AndroidLight({
  geometry,
  time,
  speed,
  reverse,
  colors,
  intensity,
  width,
  height,
  children,
}: {
  geometry: ComposerLoaderGeometry;
  time: SharedValue<number>;
  speed: number;
  reverse: boolean;
  colors: string[];
  intensity: number;
  width: number;
  height: number;
  children: ReactNode;
}) {
  const [unsupported, setUnsupported] = useState(false);
  const animatedProps = useAnimatedProps(() => ({ seconds: time.value }), [time]);
  const palette = useMemo(() => {
    const values = colors.map(processColor);
    return values.every((value): value is number => typeof value === 'number') ? values : null;
  }, [colors]);
  // Native PathMeasure draws one dash per lap. Keep the existing SVG semantics
  // for unusual public inputs instead of silently clamping their geometry.
  const supportedGeometry =
    Number.isFinite(geometry.perimeter) &&
    geometry.perimeter > 0 &&
    Number.isFinite(geometry.rx) &&
    geometry.rx >= 0 &&
    Number.isFinite(speed) &&
    geometry.strokes.every(
      (stroke) =>
        Number.isFinite(stroke.phase) &&
        Number.isFinite(stroke.opacity) &&
        Number.isFinite(stroke.strokeWidth) &&
        stroke.strokeWidth >= 0 &&
        Number.isFinite(stroke.blur) &&
        stroke.blur >= 0 &&
        stroke.dash > 0 &&
        stroke.dash <= 100,
    );
  if (!NativeLight || unsupported || !palette || !supportedGeometry) return children;
  return (
    <NativeLight
      animatedProps={animatedProps}
      speed={speed}
      reverse={reverse}
      boxWidth={width}
      boxHeight={height}
      radius={geometry.rx}
      perimeter={geometry.perimeter}
      palette={palette}
      strokes={geometry.strokes}
      onUnsupported={() => setUnsupported(true)}
      style={[StyleSheet.absoluteFill, { opacity: intensity }]}
      pointerEvents="none"
      accessible={false}
      importantForAccessibility="no"
    />
  );
}
