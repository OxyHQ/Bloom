import { useEffect, useRef, type ReactElement } from 'react';
import {
  AnimatedCheck as BloomAnimatedCheck,
  type AnimatedCheckRef,
} from '@oxy.so/bloom/animated-check';

import { Node, type ViewModifiers } from '../node';
import { resolveSpace, type ColorName, type SpaceToken } from '../tokens';
import type { ControlRenderer } from './draw';

/** A checkmark that draws itself: confirmation for something that just finished (Bloom `animated-check`). */
export type AnimatedCheckKind = 'animatedCheck';

/** Bloom `AnimatedCheck`: a ring and a check that draw on. */
export interface AnimatedCheckView extends ViewModifiers<AnimatedCheckView> {
  /** Its width and height (`2xl`, 24, by default). */
  size(value: SpaceToken): AnimatedCheckView;
  /** The stroke's colour (`success` by default). */
  tint(value: ColorName): AnimatedCheckView;
}

/**
 * Bloom `AnimatedCheck`: it draws itself as it appears, and again whenever
 * `trigger` changes (SwiftUI's effect `value:`).
 */
export function AnimatedCheck(trigger?: unknown): AnimatedCheckView {
  return new Node('animatedCheck', { trigger }, []);
}

interface PlayedCheckProps {
  readonly trigger: unknown;
  readonly size?: number;
  readonly color?: string;
}

/** Bloom's check, played as it mounts and when `trigger` changes: what an app does with its ref. */
function PlayedCheck({ trigger, size, color }: PlayedCheckProps): ReactElement {
  const check = useRef<AnimatedCheckRef>(null);
  useEffect(() => {
    check.current?.play();
  }, [trigger]);
  return <BloomAnimatedCheck ref={check} size={size} color={color} />;
}

export const ANIMATED_CHECKS: Record<AnimatedCheckKind, ControlRenderer> = {
  // Bloom's check takes no style: its box is a view around it.
  animatedCheck: (d) => {
    const size = d.own('size')?.value as SpaceToken | undefined;
    return d.around(
      d.painted(
        PlayedCheck,
        {
          key: d.key,
          trigger: (d.node.props as { trigger: unknown }).trigger,
          size: size === undefined ? undefined : resolveSpace(size),
        },
        { color: d.own('tint')?.value as ColorName | undefined },
      ),
    );
  },
};
