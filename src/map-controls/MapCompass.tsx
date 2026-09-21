import React, { memo, useContext } from 'react';
import { View } from 'react-native';

import { ButtonGroupItem } from '../button-group';
import { GlassIsland } from '../glass';
import { RiCompass3Line } from '../icons/remix/RiCompass3Line';
import type { BloomIconComponent } from '../icons/icon-component';
import { MAP_CONTROL_BOX, MAP_CONTROLS_GEOMETRY } from './constants';
import { MapHeadingContext } from './context';
import type { MapCompassProps } from './types';

/**
 * The compass that floats over a map: a needle that keeps pointing at north
 * while the map turns under it, and a press that puts the map back.
 *
 *   island   `GlassIsland` — one translucent capsule over content Bloom does
 *            not own. It mounts the `ControlSurface` the item inside reads, so
 *            the button paints flush with no `variant` written on it.
 *   control  `ButtonGroupItem`, the island-aware control, at the 44 map rung.
 *   needle   `RiCompass3Line` turned by MINUS the heading. The map rotates
 *            clockwise by `heading`; the needle rotates back by the same amount
 *            and so stays pointing north, which is the only thing a compass is
 *            for.
 *
 * IT HIDES ITSELF AT NORTH by default. A compass on a map that is already
 * pointing north is a control whose press changes nothing, and a reader has to
 * press it to find that out.
 */

/**
 * The needle, at module scope so its identity never changes — see
 * `context.ts` for why the heading arrives through a context rather than
 * through a component built per frame.
 */
const CompassNeedle: BloomIconComponent = ({ width, height, fill }) => {
  const heading = useContext(MapHeadingContext);
  return (
    <View style={{ transform: [{ rotate: `${-heading}deg` }] }}>
      <RiCompass3Line width={width} height={height} fill={fill} />
    </View>
  );
};
CompassNeedle.displayName = 'CompassNeedle';

function MapCompassComponent({
  heading,
  onPress,
  hideAtNorth = true,
  disabled = false,
  accessibilityLabel,
  style,
  testID,
}: MapCompassProps) {
  const pointsNorth = Math.abs(((heading % 360) + 360) % 360) <= MAP_CONTROLS_GEOMETRY.northTolerance;
  if (hideAtNorth && pointsNorth) return null;

  const name = accessibilityLabel ?? `Facing ${Math.round(heading)} degrees. Reset to north`;

  return (
    <MapHeadingContext.Provider value={heading}>
      <GlassIsland style={style} testID={testID}>
        <ButtonGroupItem
          iconOnly
          leadingIcon={CompassNeedle}
          accessibilityLabel={name}
          onPress={onPress}
          disabled={disabled}
          style={MAP_CONTROL_BOX}
          testID={testID ? `${testID}-button` : undefined}
        />
      </GlassIsland>
    </MapHeadingContext.Provider>
  );
}

export const MapCompass = memo(MapCompassComponent);
MapCompass.displayName = 'MapCompass';
