import React, { useEffect, useMemo, useRef } from 'react';
import type { ViewStyle } from 'react-native';

import { StyledView } from '../styles/styled-primitives';
import { SQRT2, STEPS_PER_SEGMENT, VIEWBOX } from './morph/constants';
import { getMorphFrames, morphPathD } from './morph/frames';

interface SpinnerIconProps {
  size?: number;
  color?: string;
  className?: string;
  style?: ViewStyle;
}

/**
 * Material 3 morphing loader — a solid shape that turns into the next shape of
 * the loop while the whole thing slowly rotates.
 *
 * Web fork of `./SpinnerIcon`. The native variant blends frames on the UI thread
 * with `react-native-reanimated`, which can't ship to a web bundle (its worklets
 * Babel plugin has no web equivalent and importing it statically breaks the
 * bundler). This fork renders a plain `<svg>` and writes the same blended path
 * into its `d` attribute from a `requestAnimationFrame` loop, so React never
 * re-renders while it spins.
 */
const MORPH_MS = 650;
const ROTATION_MS = 5000;
const CANVAS_RATIO = SQRT2;
const CANVAS_VIEWBOX = VIEWBOX * CANVAS_RATIO;
const CANVAS_MIN = (VIEWBOX - CANVAS_VIEWBOX) / 2;

export const SpinnerIcon: React.FC<SpinnerIconProps> = ({
  color = 'currentColor',
  size = 26,
  className,
  style,
}) => {
  const boxRef = useRef<HTMLElement | null>(null);
  const pathRef = useRef<SVGPathElement | null>(null);

  useEffect(() => {
    const { flat, frameCount } = getMorphFrames();
    let rotation = 0;
    let phase = 0;
    // The clock starts at the first frame: its timestamp can precede an earlier
    // `performance.now()`, and a negative step would index before frame 0 (NaN path).
    let last: number | undefined;
    let raf = 0;
    const tick = (now: number) => {
      const dt = last === undefined ? 0 : now - last;
      last = now;
      rotation = (rotation + (dt * 360) / ROTATION_MS) % 360;
      phase = (phase + (dt * STEPS_PER_SEGMENT) / MORPH_MS) % frameCount;
      pathRef.current?.setAttribute('d', morphPathD(flat, frameCount, phase));
      if (boxRef.current) boxRef.current.style.transform = `rotate(${rotation}deg)`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const canvas = size * CANVAS_RATIO;
  // The first frame is in the markup, so server HTML and the first paint already
  // show the shape; the animation loop then keeps rewriting the same `d`.
  const initialD = useMemo(() => {
    const { flat, frameCount } = getMorphFrames();
    return morphPathD(flat, frameCount, 0);
  }, []);

  return (
    <StyledView
      ref={boxRef as React.Ref<never>}
      className={className}
      style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}
    >
      <svg
        viewBox={`${CANVAS_MIN} ${CANVAS_MIN} ${CANVAS_VIEWBOX} ${CANVAS_VIEWBOX}`}
        width={canvas}
        height={canvas}
        aria-hidden
        style={{ position: 'absolute', pointerEvents: 'none' }}
      >
        <path ref={pathRef} d={initialD} fill={color} />
      </svg>
    </StyledView>
  );
};

SpinnerIcon.displayName = 'SpinnerIcon';
