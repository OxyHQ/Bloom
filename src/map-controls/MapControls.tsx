import { memo } from 'react';
import { View } from 'react-native';

import { Button } from '../button';
import { RiAddLine } from '../icons/remix/RiAddLine';
import { RiBox3Line } from '../icons/remix/RiBox3Line';
import { RiFocus3Line } from '../icons/remix/RiFocus3Line';
import { RiSubtractLine } from '../icons/remix/RiSubtractLine';
import { useMessages } from '../locale/messages';
import { MAP_CONTROLS_GEOMETRY } from './constants';
import { MapCompass } from './MapCompass';
import { MAP_CONTROLS_MESSAGES } from './messages';
import type { MapControlsProps } from './types';

/** Map chrome composed from Button and Button.Group; applications own map state and callbacks. */
function MapControlsComponent({
  orientation = 'vertical',
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
  const { messages } = useMessages(MAP_CONTROLS_MESSAGES);
  const id = (part: string) => (testID ? `${testID}-${part}` : undefined);
  const zoomLabel = labels?.zoom ?? messages.zoom;
  const zoomable = onZoomIn !== undefined && onZoomOut !== undefined;

  return (
    <View
      collapsable={false}
      role="group"
      accessibilityLabel={labels?.group ?? messages.group}
      testID={testID}
      style={[
        {
          flexDirection: orientation === 'horizontal' ? 'row' : 'column',
          alignItems:
            orientation === 'horizontal' ? 'center' : align === 'start' ? 'flex-start' : 'flex-end',
          gap: MAP_CONTROLS_GEOMETRY.gap,
        },
        style,
      ]}
    >
      {onLocate ? (
        <Button
          appearance="outline"
          tone="neutral"
          iconOnly
          leadingIcon={RiFocus3Line}
          pressed={following}
          accessibilityLabel={
            following
              ? (labels?.following ?? messages.following)
              : (labels?.locate ?? messages.locate)
          }
          onPress={onLocate}
          size="lg"
          testID={id('locate')}
        />
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
        <Button.Group
          orientation={orientation}
          size="lg"
          dividers={false}
          accessibilityLabel={zoomLabel}
          testID={id('zoom')}
        >
          <Button
            appearance="outline"
            tone="neutral"
            iconOnly
            leadingIcon={RiAddLine}
            accessibilityLabel={labels?.zoomIn ?? messages.zoomIn}
            onPress={onZoomIn}
            disabled={!canZoomIn}
            size="lg"
            testID={id('zoom-in')}
          />
          <Button
            appearance="outline"
            tone="neutral"
            iconOnly
            leadingIcon={RiSubtractLine}
            accessibilityLabel={labels?.zoomOut ?? messages.zoomOut}
            onPress={onZoomOut}
            disabled={!canZoomOut}
            size="lg"
            testID={id('zoom-out')}
          />
        </Button.Group>
      ) : null}

      {onTiltChange ? (
        <Button
          appearance="outline"
          tone="neutral"
          iconOnly
          leadingIcon={RiBox3Line}
          pressed={tilted ?? false}
          accessibilityLabel={
            tilted ? (labels?.tiltOff ?? messages.tiltOff) : (labels?.tilt ?? messages.tilt)
          }
          onPress={() => onTiltChange(!tilted)}
          size="lg"
          testID={id('tilt')}
        />
      ) : null}

      {children}
    </View>
  );
}

export const MapControls = memo(MapControlsComponent);
MapControls.displayName = 'MapControls';
