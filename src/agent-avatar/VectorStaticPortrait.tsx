import { svgA11yProps } from '../styles/svg-a11y';
import { useSvgIdPrefix } from '../styles/svg-id';
import { Platform, type View } from 'react-native';
import { AvatarSnapshotObserver } from './context';
import { memo, useContext, useEffect, useRef, type ComponentRef } from 'react';
import Svg, { ClipPath, Defs, Path } from 'react-native-svg';
import { StyledView } from '../styles/styled-primitives';
import type { AgentAvatarProps } from './types';
import type { VectorFrame } from './vector-types';

type Props = Pick<
  AgentAvatarProps,
  'size' | 'style' | 'className' | 'testID' | 'onReady' | 'accessibilityLabel' | 'label'
> & { frame?: VectorFrame; bodyColor?: string };
/** Offline projected portrait: no asset fetch, animation clock or runtime canvas. */
function StaticPortrait({ frame, size = 64, bodyColor, onReady, ...props }: Props) {
  const host = useRef<ComponentRef<typeof View> | null>(null);
  const svg = useRef<Svg | null>(null);
  const observe = useContext(AvatarSnapshotObserver);
  useEffect(() => {
    observe?.(async () => {
      if (Platform.OS === 'web') {
        const element = (host.current as unknown as HTMLElement | null)?.querySelector('svg');
        return element
          ? {
              uri:
                'data:image/svg+xml;charset=utf-8,' +
                encodeURIComponent(new XMLSerializer().serializeToString(element)),
            }
          : null;
      }
      return svg.current
        ? new Promise((resolve) =>
            svg.current!.toDataURL((data) => resolve({ uri: 'data:image/png;base64,' + data })),
          )
        : null;
    });
    return () => observe?.(null);
  }, [observe]);
  const prefix = useSvgIdPrefix('bloom-vector');
  const ready = useRef(false);
  useEffect(() => {
    if (frame && !ready.current) {
      ready.current = true;
      onReady?.();
    }
  }, [frame, onReady]);
  return (
    <StyledView
      ref={host}
      {...(Platform.OS === 'web' ? { dataSet: { bloomVectorPortrait: '' } } : {})}
      className={props.className}
      style={[{ width: size, height: size }, props.style]}
      testID={props.testID}
      accessible={props.accessibilityLabel !== ''}
      accessibilityRole="image"
      accessibilityLabel={(props.accessibilityLabel ?? props.label) || undefined}
    >
      {frame ? (
        <Svg ref={svg} width="100%" height="100%" viewBox={frame.viewBox} {...svgA11yProps()}>
          <Defs>
            {frame.paths
              .filter((path) => path.clip !== undefined)
              .map((path) => (
                <ClipPath
                  key={path.id}
                  id={`${prefix}-${path.id}`}
                  {...{ clipPathUnits: 'userSpaceOnUse' }}
                >
                  <Path d={path.clip} />
                </ClipPath>
              ))}
          </Defs>
          {frame.paths.map((path) => (
            <Path
              key={path.id}
              d={path.d}
              fill={bodyColor ?? path.fill}
              opacity={path.opacity}
              fillOpacity={path.fillOpacity}
              fillRule="nonzero"
              stroke={path.stroke}
              strokeWidth={path.stroke ? (path.strokeWidth ?? 1.5) : undefined}
              clipPath={path.clip !== undefined ? `url(#${prefix}-${path.id})` : undefined}
            />
          ))}
        </Svg>
      ) : null}
    </StyledView>
  );
}

/** Geometry-only previews ignore recipe/animation props passed through shared callers. */
export const VectorStaticPortrait = memo(
  StaticPortrait,
  (a, b) =>
    a.frame === b.frame &&
    a.bodyColor === b.bodyColor &&
    a.size === b.size &&
    a.style === b.style &&
    a.className === b.className &&
    a.testID === b.testID &&
    a.onReady === b.onReady &&
    a.accessibilityLabel === b.accessibilityLabel &&
    a.label === b.label,
);
