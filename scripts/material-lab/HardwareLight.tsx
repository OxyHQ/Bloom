import { processColor, requireNativeComponent, StyleSheet, type ViewProps } from 'react-native';
import Animated, { useAnimatedProps, type SharedValue } from 'react-native-reanimated';
import type { ComposerLoaderGeometry } from '../../src/composer-loader/shared';

type ProbeProps = ViewProps & {
  seconds?: number;
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
      speed={speed}
      reverse={reverse}
      boxWidth={width}
      boxHeight={height}
      radius={geometry.rx}
      perimeter={geometry.perimeter}
      palette={palette}
      strokes={geometry.strokes}
      style={[StyleSheet.absoluteFill, { opacity: intensity }]}
      pointerEvents="none"
      accessible={false}
      importantForAccessibility="no"
    />
  );
}
