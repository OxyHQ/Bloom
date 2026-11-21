import { MapScaleBar } from '@oxy.so/bloom/map-attribution';
import { MapControls, MapLayerPicker } from '@oxy.so/bloom/map-controls';
import { LocationPuck } from '@oxy.so/bloom/location-puck';
import { LaneGuidance, NavigationBanner } from '@oxy.so/bloom/navigation-banner';
import { RiEarthLine, RiMap2Line } from '@oxy.so/bloom/icons';

import { ENUMS } from '../src/generated/spec.generated';
import * as L from '../src/index';
import { toElement } from '../src/render';
import type { ParityCase } from './support/cases';

const press = () => {};
const tilt = (_tilted: boolean) => {};
const SCALES = [
  { width: 72, label: '500 m' },
  { width: 66, label: '1000 ft' },
];
const LAYERS = [
  { id: 'standard', label: 'Standard', icon: RiMap2Line },
  { id: 'satellite', label: 'Satellite', icon: RiEarthLine },
];
const LANES = [
  { directions: ['left' as const] },
  {
    directions: ['straight' as const, 'right' as const],
    allowed: true,
    preferred: 'right' as const,
  },
];
const HANDLERS = {
  onLocate: press,
  following: true,
  heading: 40,
  onResetNorth: press,
  onZoomIn: press,
  onZoomOut: press,
  canZoomOut: false,
  onTiltChange: tilt,
  tilted: false,
};

const scale: ParityCase[] = [
  {
    name: 'MapScaleBar',
    language: () => toElement(L.MapScaleBar(SCALES.slice(0, 1))),
    bloom: () => <MapScaleBar scales={SCALES.slice(0, 1)} />,
  },
  ...ENUMS.mapAttributionStyle.map((variant) => ({
    name: `MapScaleBar ${variant}, two bars, named`,
    language: () =>
      toElement(L.MapScaleBar(SCALES, { scaleLabel: 'Escala' }).style(variant).label('Map scale')),
    bloom: () => (
      <MapScaleBar
        scales={SCALES}
        scaleLabel="Escala"
        variant={variant}
        accessibilityLabel="Map scale"
      />
    ),
  })),
];

const controls: ParityCase[] = [
  {
    name: 'MapControls locate only',
    language: () => toElement(L.MapControls({ onLocate: press })),
    bloom: () => <MapControls onLocate={press} />,
  },
  ...ENUMS.axis.flatMap((orientation) =>
    (['start', 'end'] as const).map((align) => ({
      name: `MapControls ${orientation}, ${align}`,
      language: () => toElement(L.MapControls(HANDLERS).axis(orientation).align(align)),
      bloom: () => <MapControls {...HANDLERS} orientation={orientation} align={align} />,
    })),
  ),
  {
    name: 'MapControls with a layer picker, words',
    language: () =>
      toElement(
        L.MapControls({
          ...HANDLERS,
          labels: { zoomIn: 'Closer' },
          islands: L.Embed(<MapLayerPicker layers={LAYERS} layerId="standard" />),
        }),
      ),
    bloom: () => (
      <MapControls {...HANDLERS} labels={{ zoomIn: 'Closer' }}>
        <MapLayerPicker layers={LAYERS} layerId="standard" />
      </MapControls>
    ),
  },
];

const puck: ParityCase[] = [
  ...ENUMS.locationPuckMode.flatMap((mode) =>
    (['located', 'stale'] as const).map((state) => ({
      name: `LocationPuck ${mode}, ${state}`,
      language: () =>
        toElement(L.LocationPuck({ state, heading: 120, headingAccuracy: 25 }).style(mode)),
      bloom: () => <LocationPuck state={state} mode={mode} heading={120} headingAccuracy={25} />,
    })),
  ),
  {
    name: 'LocationPuck with a halo, a cone length, no heading, named',
    language: () =>
      toElement(
        L.LocationPuck({ accuracyRadius: 40, coneLength: '4xl', headingUnknown: true }).label(
          'You are here',
        ),
      ),
    bloom: () => (
      <LocationPuck
        accuracyRadius={40}
        coneLength={40}
        headingUnknown
        accessibilityLabel="You are here"
      />
    ),
  },
  {
    name: 'LocationPuck cone length',
    language: () => toElement(L.LocationPuck({ heading: 90, coneLength: '4xl' })),
    bloom: () => <LocationPuck heading={90} coneLength={40} />,
  },
];

const banner: ParityCase[] = [
  {
    name: 'NavigationBanner',
    language: () =>
      toElement(L.NavigationBanner('right', 'Carrer del Roure', { distance: '400 m' })),
    bloom: () => (
      <NavigationBanner maneuver="right" instruction="Carrer del Roure" distance="400 m" />
    ),
  },
  ...(['off-route', 'rerouting'] as const).map((state) => ({
    name: `NavigationBanner ${state}`,
    language: () => toElement(L.NavigationBanner('left', 'Carrer de l’Om', { state })),
    bloom: () => <NavigationBanner maneuver="left" instruction="Carrer de l’Om" state={state} />,
  })),
  {
    name: 'NavigationBanner then, lanes, named',
    language: () =>
      toElement(
        L.NavigationBanner('slight-left', 'Ronda de Dalt', {
          distance: '1.2 km',
          thenManeuver: 'roundabout',
          then: 'Plaça Major',
          extras: L.Embed(<LaneGuidance lanes={LANES} />),
        }).label('Next turn'),
      ),
    bloom: () => (
      <NavigationBanner
        maneuver="slight-left"
        instruction="Ronda de Dalt"
        distance="1.2 km"
        thenManeuver="roundabout"
        then="Plaça Major"
        accessibilityLabel="Next turn"
      >
        <LaneGuidance lanes={LANES} />
      </NavigationBanner>
    ),
  },
];

export const MAP_CHROME_CASES: ParityCase[] = [...scale, ...controls, ...puck, ...banner];

/** A locating puck pulses on the UI thread: compared by Jest as it mounts, not in Chrome. */
export const MAP_CHROME_CASES_MOVING: ParityCase[] = ENUMS.locationPuckMode.map((mode) => ({
  name: `LocationPuck ${mode}, locating`,
  language: () => toElement(L.LocationPuck({ state: 'locating', heading: 30 }).style(mode)),
  bloom: () => <LocationPuck state="locating" mode={mode} heading={30} />,
}));
