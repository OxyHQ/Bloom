import { StyleSheet, View } from 'react-native';
import { pointerEventsStyle } from '../styles/pointer-events';
import { useCanvasStore } from './context';
import type { CanvasBackgroundProps } from './types';

/** One persistent scene, separated from its sibling chrome and panel. */
export function CanvasBackground({ children, testID }: CanvasBackgroundProps) {
  useCanvasStore();
  return (
    <View testID={testID} style={[StyleSheet.absoluteFill, pointerEventsStyle('box-none')]}>
      {children}
    </View>
  );
}
