import React, { memo } from 'react';
import { View } from 'react-native';

import { ButtonGroupItem } from '../button-group';
import { GlassIsland } from '../glass';
import { RiAddLine } from '../icons/remix/RiAddLine';
import { RiBox3Line } from '../icons/remix/RiBox3Line';
import { RiFocus3Line } from '../icons/remix/RiFocus3Line';
import { RiSubtractLine } from '../icons/remix/RiSubtractLine';
import { MAP_CONTROL_BOX, MAP_CONTROLS_GEOMETRY } from './constants';
import { MapCompass } from './MapCompass';
import type { MapControlsProps } from './types';

/**
 * The chrome that floats over a map — locate, compass, zoom, tilt — as a
 * column of translucent capsules.
 *
 *   island   every group is a `GlassIsland`: rung 1 of the surface ladder at
 *            the chrome alpha, with the material's own hairline and shadow.
 *            One capsule per GROUP, so the column reads as separate controls
 *            rather than as one bar — which is exactly what the island was
 *            written for.
 *   control  `ButtonGroupItem` at 44 square. It is Bloom's island-aware
 *            control: it reads the `material` the island publishes through
 *            `ControlSurface` and paints flush, with no `variant` written on
 *            it, and it carries a toggle's `aria-pressed` and native selected
 *            state in one prop.
 *   zoom     ONE island, two items, laid out in a column. The island's `style`
 *            is where that is said; nothing else about it changes.
 *   stack    44 controls, 8 apart, hugging whichever edge `align` names.
 *
 * WHY NOT `FrostedIconButton`: it is one of the three glass materials Bloom
 * grew independently, and `glass/` exists so there is not a fourth. Two glass
 * recipes side by side in one stack is the drift the island was written to
 * end, so the whole stack is one material. A single frosted button over a
 * photograph is still the right control where there is no island.
 *
 * WHAT THIS DOES NOT DO: it never touches a map. Every control is a callback,
 * every state is a prop, and there is no engine, no projection and no tile
 * here — the app owns the map and tells the chrome what it is doing.
 *
 * The `MapLayerPicker` is not a prop: it is an island of its own, placed in
 * `children`, so an app can put it above the stack, below it, or somewhere
 * else entirely without this component growing a placement vocabulary.
 */
function MapControlsComponent({
  onLocate,
  following,
  heading,
  onResetNorth,
  hideCompassAtNorth = true,
  onZoomIn,
  onZoomOut,
  canZoomIn = true,
  canZoomOut = true,
  onTiltChange,
  tilted,
  children,
  align = 'end',
  labels,
  style,
  testID,
}: MapControlsProps) {
  const id = (part: string) => (testID ? `${testID}-${part}` : undefined);
  const zoomLabel = labels?.zoom ?? 'Zoom';
  const zoomable = onZoomIn !== undefined && onZoomOut !== undefined;

  return (
    <View
      role="group"
      accessibilityLabel={labels?.group ?? 'Map controls'}
      testID={testID}
      style={[
        {
          alignItems: align === 'start' ? 'flex-start' : 'flex-end',
          gap: MAP_CONTROLS_GEOMETRY.gap,
        },
        style,
      ]}
    >
      {onLocate ? (
        <GlassIsland testID={id('locate-island')}>
          <ButtonGroupItem
            iconOnly
            leadingIcon={RiFocus3Line}
            selected={following}
            accessibilityLabel={
              following ? (labels?.following ?? 'Stop following my location') : (labels?.locate ?? 'Show my location')
            }
            onPress={onLocate}
            style={MAP_CONTROL_BOX}
            testID={id('locate')}
          />
        </GlassIsland>
      ) : null}

      {onResetNorth && heading !== undefined ? (
        <MapCompass
          heading={heading}
          onPress={onResetNorth}
          hideAtNorth={hideCompassAtNorth}
          testID={id('compass')}
        />
      ) : null}

      {zoomable ? (
        <GlassIsland
          role="group"
          accessibilityLabel={zoomLabel}
          style={{ flexDirection: 'column' }}
          testID={id('zoom')}
        >
          <ButtonGroupItem
            iconOnly
            leadingIcon={RiAddLine}
            accessibilityLabel={labels?.zoomIn ?? 'Zoom in'}
            onPress={onZoomIn}
            disabled={!canZoomIn}
            style={MAP_CONTROL_BOX}
            testID={id('zoom-in')}
          />
          <ButtonGroupItem
            iconOnly
            leadingIcon={RiSubtractLine}
            accessibilityLabel={labels?.zoomOut ?? 'Zoom out'}
            onPress={onZoomOut}
            disabled={!canZoomOut}
            style={MAP_CONTROL_BOX}
            testID={id('zoom-out')}
          />
        </GlassIsland>
      ) : null}

      {onTiltChange ? (
        <GlassIsland testID={id('tilt-island')}>
          <ButtonGroupItem
            iconOnly
            leadingIcon={RiBox3Line}
            selected={tilted ?? false}
            accessibilityLabel={
              tilted ? (labels?.tiltOff ?? 'Flatten the map') : (labels?.tilt ?? 'Tilt the map')
            }
            onPress={() => onTiltChange(!tilted)}
            style={MAP_CONTROL_BOX}
            testID={id('tilt')}
          />
        </GlassIsland>
      ) : null}

      {children}
    </View>
  );
}

export const MapControls = memo(MapControlsComponent);
MapControls.displayName = 'MapControls';
