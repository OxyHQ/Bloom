import { useContext } from 'react';
import { LightDiagnosticLayerContext, LightClockDiagnosticsContext } from './hardware-diagnostics';
import { processColor, requireNativeComponent, StyleSheet, type ViewProps } from 'react-native';
import Animated, { useAnimatedProps, type SharedValue } from 'react-native-reanimated';
import type { ComposerLoaderGeometry } from '../../src/composer-loader/shared';

type ProbeProps = ViewProps & {
  seconds?: number;
  diagnostics: boolean;
  speed: number;
  reverse: boolean;
  boxWidth: number;
  boxHeight: number;
  radius: number;
  perimeter: number;
  palette: number[];
  strokes: ComposerLoaderGeometry['strokes'];
};
const NativeLight = requireNativeComponent<ProbeProps>('BloomLightProbe');
const AnimatedLight = Animated.createAnimatedComponent(NativeLight);

export function HardwareLight({
  geometry,
  time,
  speed,
  reverse,
  colors,
  intensity,
  width,
  height,
}: {
  geometry: ComposerLoaderGeometry;
  time: SharedValue<number>;
  speed: number;
  reverse: boolean;
  colors: string[];
  intensity: number;
  width: number;
  height: number;
}) {
  const diagnostics = useContext(LightClockDiagnosticsContext);
  const layer = useContext(LightDiagnosticLayerContext);
  const strokes =
    layer === 'all'
      ? geometry.strokes
      : geometry.strokes.filter((stroke) => stroke.key.startsWith(`${layer}-`));
  const props = useAnimatedProps(() => ({ seconds: time.value }), [time]);
  const palette = colors.map((color) => {
    const result = processColor(color);
    if (typeof result !== 'number')
      throw new Error('Hardware probe requires resolved numeric native colors');
    return result;
  });
  return (
    <AnimatedLight
      animatedProps={props}
      diagnostics={diagnostics}
      speed={speed}
      reverse={reverse}
      boxWidth={width}
      boxHeight={height}
      radius={geometry.rx}
      perimeter={geometry.perimeter}
      palette={palette}
      strokes={strokes}
      style={[StyleSheet.absoluteFill, { opacity: intensity }]}
      pointerEvents="none"
      accessible={false}
      importantForAccessibility="no"
    />
  );
}
