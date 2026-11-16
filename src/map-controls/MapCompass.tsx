import { memo, useContext } from 'react';
import { View } from 'react-native';

import { Button } from '../button';
import { RiCompass3Line } from '../icons/remix/RiCompass3Line';
import type { BloomIconComponent } from '../icons/icon-component';
import { useMessages } from '../locale/messages';
import { MAP_CONTROLS_GEOMETRY } from './constants';
import { MapHeadingContext } from './context';
import { MAP_CONTROLS_MESSAGES } from './messages';
import type { MapCompassProps } from './types';

/** A standard lg icon Button whose needle follows the current map heading. */

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
  const { messages } = useMessages(MAP_CONTROLS_MESSAGES);
  const pointsNorth =
    Math.abs(((heading % 360) + 360) % 360) <= MAP_CONTROLS_GEOMETRY.northTolerance;
  if (hideAtNorth && pointsNorth) return null;

  const name = accessibilityLabel ?? messages.compass(Math.round(heading));

  return (
    <MapHeadingContext.Provider value={heading}>
      <View style={style} testID={testID}>
        <Button
          appearance="outline"
          tone="neutral"
          iconOnly
          leadingIcon={CompassNeedle}
          accessibilityLabel={name}
          onPress={onPress}
          disabled={disabled}
          size="lg"
          testID={testID ? `${testID}-button` : undefined}
        />
      </View>
    </MapHeadingContext.Provider>
  );
}

export const MapCompass = memo(MapCompassComponent);
MapCompass.displayName = 'MapCompass';
