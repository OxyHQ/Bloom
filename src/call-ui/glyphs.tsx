import React from 'react';
import { View } from 'react-native';

import { RiPhoneFill } from '../icons/remix/RiPhoneFill';

/**
 * The hang-up handset: the phone glyph turned 135°.
 *
 * There is no "end call" icon in the set, and drawing one would put a second
 * handset outline in the package that has to be kept in step with the first.
 * A rotation is the same glyph, and it is the shape every phone has used for
 * "put it down" since phones had a cradle.
 *
 * The rotation goes on a WRAPPER rather than on the `<Svg>`'s own style: a
 * transform inside react-native-svg's style prop is applied by the native
 * renderer to the canvas, not the element, and the two forks do not agree
 * about the origin.
 */
export function CallEndGlyph({
  width = 24,
  height = 24,
  fill,
}: {
  width?: number;
  height?: number;
  fill?: string;
}) {
  return (
    <View
      style={{
        width,
        height,
        alignItems: 'center',
        justifyContent: 'center',
        transform: [{ rotate: '135deg' }],
      }}
    >
      <RiPhoneFill width={width} height={height} fill={fill} />
    </View>
  );
}
