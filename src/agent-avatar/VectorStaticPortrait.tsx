import { useEffect, useId } from 'react';
import Svg, { ClipPath, Defs, Path } from 'react-native-svg';
import { StyledView } from '../styles/styled-primitives';
import type { AgentAvatarProps } from './types';
import type { VectorFrame } from './vector-types';

type Props = Pick<AgentAvatarProps, 'size' | 'style' | 'className' | 'testID' | 'onReady' | 'accessibilityLabel' | 'label'> & { frame?: VectorFrame; bodyColor?: string };
/** Offline projected portrait: no asset fetch, animation clock or runtime canvas. */
export function VectorStaticPortrait({ frame, size = 64, bodyColor, onReady, ...props }: Props) {
  const prefix = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  useEffect(() => { if (frame) onReady?.(); }, [frame, onReady]);
  return <StyledView className={props.className} style={[{ width: size, height: size }, props.style]} testID={props.testID} accessible accessibilityRole="image" accessibilityLabel={props.accessibilityLabel ?? props.label}>
    {frame ? <Svg width="100%" height="100%" viewBox={frame.viewBox} accessible={false}>
      <Defs>{frame.paths.filter(path => path.clip !== undefined).map(path => <ClipPath key={path.id} id={`${prefix}-${path.id}`} clipPathUnits="userSpaceOnUse"><Path d={path.clip} /></ClipPath>)}</Defs>
      {frame.paths.map(path => <Path key={path.id} d={path.d} fill={bodyColor ?? path.fill} opacity={path.opacity} fillOpacity={path.fillOpacity} fillRule="nonzero" stroke={path.stroke} strokeWidth={path.stroke ? 1.5 : undefined} clipPath={path.clip !== undefined ? `url(#${prefix}-${path.id})` : undefined} />)}
    </Svg> : null}
  </StyledView>;
}
