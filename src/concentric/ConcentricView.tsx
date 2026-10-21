import { forwardRef, memo, type ComponentRef, type ComponentType } from 'react';
import type { View } from 'react-native';
import { styled } from 'react-native-css';
import { StyledView } from '../styles/styled-primitives';
import { splitCompiledStyle } from '../styles/compiled-style';
import { useDirectionProps } from '../hooks/use-is-rtl';
import { ConcentricProvider } from './ConcentricProvider';
import { useConcentricGeometry } from './use-concentric-geometry';
import { cornersStyle } from './geometry';
import type { ConcentricViewProps } from './types';
import type { MemoRefComponent } from '../styles/native-refs';

const ConcentricViewComponent = forwardRef<ComponentRef<typeof View>, ConcentricViewProps>(
  function ConcentricViewComponent({ radius, reset, style, children, ...props }, ref) {
    const { classes, inline } = splitCompiledStyle(style);
    const direction = useDirectionProps();
    const geometry = useConcentricGeometry({ radius, reset, style: inline });
    return (
      <StyledView
        {...direction}
        {...props}
        ref={ref}
        style={[
          classes,
          inline,
          radius === 'concentric' || geometry.hasClassRadius
            ? geometry.radiusStyle
            : radius !== undefined
              ? cornersStyle(geometry.context.corners)
              : null,
          geometry.variables,
        ]}
      >
        <ConcentricProvider value={geometry.context} variables={geometry.nativeVariables}>
          {children}
        </ConcentricProvider>
      </StyledView>
    );
  },
);
const StyledConcentricView = styled(
  ConcentricViewComponent as ComponentType<Pick<ConcentricViewProps, 'className' | 'style'>>,
  { className: 'style' },
) as typeof ConcentricViewComponent;
export const ConcentricView: MemoRefComponent<ConcentricViewProps> = memo(StyledConcentricView);
ConcentricView.displayName = 'ConcentricView';
