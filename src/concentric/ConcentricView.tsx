import { forwardRef, memo, type ComponentRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { useDirectionProps } from '../hooks/use-is-rtl';
import { ConcentricProvider } from './ConcentricProvider';
import { useConcentricGeometry } from './use-concentric-geometry';
import { cornersStyle } from './geometry';
import type { ConcentricViewProps } from './types';
import type { MemoRefComponent } from '../styles/native-refs';

const ConcentricViewComponent = forwardRef<ComponentRef<typeof View>, ConcentricViewProps>(
  function ConcentricViewComponent({ radius, reset, style, children, ...props }, ref) {
    const inline = StyleSheet.flatten(style);
    const direction = useDirectionProps();
    const geometry = useConcentricGeometry({ radius, reset, style: inline ?? undefined });
    return (
      <View
        {...direction}
        {...props}
        ref={ref}
        style={[
          inline,
          radius === 'concentric'
            ? geometry.radiusStyle
            : radius !== undefined
              ? cornersStyle(geometry.context.corners)
              : null,
          geometry.variables,
        ]}
      >
        <ConcentricProvider value={geometry.context}>{children}</ConcentricProvider>
      </View>
    );
  },
);
export const ConcentricView: MemoRefComponent<ConcentricViewProps> = memo(ConcentricViewComponent);
