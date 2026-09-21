import React, { memo, useMemo } from 'react';
import Svg, { Defs, Path, RadialGradient, Stop } from 'react-native-svg';

import { LOCATION_PUCK_CONE_STOPS } from './constants';
import { conePath } from './shared';

/**
 * The wedge that says which way you are facing: full at the dot, gone at its
 * far end, and as wide as the device is unsure.
 *
 *   geometry   a `2 * length` square whose centre is the dot, so the caller can
 *              rotate the whole box about that centre (see `conePath`)
 *   fill       a RADIAL gradient from the apex outward — the fade has to run
 *              along the cone's LENGTH, and a linear gradient fades along the
 *              box instead, which leaves the two edges of the wedge brighter
 *              than its middle at the same distance from the dot
 *
 * THE OPACITY IS NEVER IN THE COLOUR. `react-native-svg` parses `stopColor` for
 * its RGB and drops any alpha inside it, so a shared `rgba()` token paints
 * correctly on web and FULLY OPAQUE on native. Both stops take their opacity
 * through `stopOpacity`, the prop SVG defines for it, from
 * {@link LOCATION_PUCK_CONE_STOPS}.
 */

let coneIdCounter = 0;

interface HeadingConeProps {
  /** How far the wedge reaches from the dot, in pixels. */
  length: number;
  /** Half the wedge's width, in degrees. */
  halfAngle: number;
  /** The accent the cone is painted in — an OPAQUE colour, never one with alpha. */
  color: string;
  testID?: string;
}

function HeadingConeComponent({ length, halfAngle, color, testID }: HeadingConeProps) {
  // Per instance, for the reason `GlassSurface` gives: two cones in one
  // document would otherwise share a gradient id, and the survivor of an
  // unmount would reference one that is gone.
  const gradientId = useMemo(() => `bloom-heading-cone${coneIdCounter++}`, []);
  const r = Math.max(0, length);
  const size = r * 2;
  const d = conePath(length, halfAngle);

  return (
    <Svg width={size} height={size} testID={testID}>
      <Defs>
        {/*
          `gradientUnits="userSpaceOnUse"`, and that is the whole correctness of
          this file. The DEFAULT, `objectBoundingBox`, resolves `cx`/`cy`/`r`
          against the bounding box of the element that REFERENCES the gradient —
          the wedge, not the square — so `0.5, 0.5` lands at the centre of the
          wedge's own box, which is somewhere out along the cone and moves as
          the angle widens. Measured in a browser: the fade started partway down
          the cone and was brightest off to one side of it. In user space the
          centre is the apex and the radius is the cone's length, exactly, for
          every angle.
        */}
        <RadialGradient
          id={gradientId}
          gradientUnits="userSpaceOnUse"
          cx={r}
          cy={r}
          r={r}
        >
          <Stop
            offset={String(LOCATION_PUCK_CONE_STOPS.inner.offset)}
            stopColor={color}
            stopOpacity={LOCATION_PUCK_CONE_STOPS.inner.opacity}
          />
          <Stop
            offset={String(LOCATION_PUCK_CONE_STOPS.outer.offset)}
            stopColor={color}
            stopOpacity={LOCATION_PUCK_CONE_STOPS.outer.opacity}
          />
        </RadialGradient>
      </Defs>
      <Path d={d} fill={`url(#${gradientId})`} testID={testID ? `${testID}-wedge` : undefined} />
    </Svg>
  );
}

export const HeadingCone = memo(HeadingConeComponent);
HeadingCone.displayName = 'HeadingCone';
