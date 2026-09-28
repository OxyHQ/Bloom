import { defineMessages, type MessageCatalog } from '../locale/messages';

/**
 * Every fixed string the map-controls family announces, in each Bloom
 * language. A caller's `labels`/`accessibilityLabel` still wins.
 */
export interface MapControlsMessages {
  /** Names `MapControls`' stack. */
  group: string;
  locate: string;
  following: string;
  zoomIn: string;
  zoomOut: string;
  /** Names the zoom pair. */
  zoom: string;
  tilt: string;
  tiltOff: string;
  /** Names `MapCompass`: "Facing 45 degrees. Reset to north". */
  compass: (degrees: number) => string;
  /** Names `MapLayerPicker`'s trigger. */
  layerTrigger: string;
  /** The heading over the map types. */
  layers: string;
  /** The heading over the overlays. */
  overlays: string;
}

export const MAP_CONTROLS_MESSAGES: MessageCatalog<MapControlsMessages> = defineMessages<MapControlsMessages>('MAP_CONTROLS_MESSAGES', {
  group: 'Map controls',
  locate: 'Show my location',
  following: 'Stop following my location',
  zoomIn: 'Zoom in',
  zoomOut: 'Zoom out',
  zoom: 'Zoom',
  tilt: 'Tilt the map',
  tiltOff: 'Flatten the map',
  compass: (degrees) => `Facing ${degrees} degrees. Reset to north`,
  layerTrigger: 'Map layers',
  layers: 'Map',
  overlays: 'Overlays',
});
