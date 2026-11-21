import {
  MapScaleBar as BloomMapScaleBar,
  type MapScale,
  type MapScaleBarProps,
} from '@oxy.so/bloom/map-attribution';
import {
  MapControls as BloomMapControls,
  type MapControlsAlign,
  type MapControlsProps,
} from '@oxy.so/bloom/map-controls';
import {
  LocationPuck as BloomLocationPuck,
  type LocationPuckProps,
} from '@oxy.so/bloom/location-puck';
import {
  NavigationBanner as BloomNavigationBanner,
  type NavigationBannerProps,
} from '@oxy.so/bloom/navigation-banner';
import type { DirectionsManeuver } from '@oxy.so/bloom/directions';

import { type Child, Node, type ViewModifiers } from '../node';
import type { Axis, LocationPuckMode, MapAttributionStyle, SpaceToken } from '../tokens';
import type { ControlRenderer } from './draw';
import { product } from './product';

/** What a map draws over its tiles: the scale, the control stack, the reader's puck and the turn banner. */
export type MapChromeKind = 'mapScaleBar' | 'mapControls' | 'locationPuck' | 'navigationBanner';

type Drawn = 'style' | 'testID' | 'accessibilityLabel';

export type MapScaleBarOptions = Omit<MapScaleBarProps, Drawn | 'scales' | 'variant'>;
/**
 * Bloom `MapControls`' handlers, readings and words; `islands` are the
 * controls appended to the stack (a layer picker), language children.
 */
export type MapControlsOptions = Omit<
  MapControlsProps,
  Drawn | 'orientation' | 'align' | 'children'
> & { readonly islands?: Child };
/** Bloom `LocationPuck`'s fix and heading; its cone's reach is a space token. */
export type LocationPuckOptions = Omit<LocationPuckProps, Drawn | 'mode' | 'coneLength'> & {
  readonly coneLength?: SpaceToken;
};
/** Bloom `NavigationBanner`'s guidance; `extras` go under the maneuver row (lanes, a speed limit). */
export type NavigationBannerOptions = Omit<
  NavigationBannerProps,
  Drawn | 'maneuver' | 'instruction' | 'children'
> & { readonly extras?: Child };

export interface MapScaleBarView extends ViewModifiers<MapScaleBarView> {
  /** `island` (default): on its own material over the tiles; `inline`: the words alone. */
  style(value: MapAttributionStyle): MapScaleBarView;
}
export interface MapControlsView extends ViewModifiers<MapControlsView> {
  /** The groups in a column (`vertical`, default) or a row. */
  axis(value: Axis): MapControlsView;
  /** The edge the stack hugs: `end` (default) or `start`. */
  align(value: MapControlsAlign): MapControlsView;
}
export interface LocationPuckView extends ViewModifiers<LocationPuckView> {
  /** What the map does: `following` (default), `compass` or `navigating` (a chevron). */
  style(value: LocationPuckMode): LocationPuckView;
}
export type NavigationBannerView = ViewModifiers<NavigationBannerView>;

/** Bloom `MapScaleBar`: one bar, or a metric and an imperial one. */
export function MapScaleBar(
  scales: readonly MapScale[],
  options: MapScaleBarOptions = {},
): MapScaleBarView {
  return new Node('mapScaleBar', { scales, options }, []);
}
/** Bloom `MapControls`: locate, compass, zoom and tilt, each drawn when its handler is given. */
export function MapControls({ islands, ...options }: MapControlsOptions = {}): MapControlsView {
  return new Node('mapControls', { options }, islands === undefined ? [] : [islands]);
}
/** Bloom `LocationPuck`: where the reader is, and which way they face. */
export function LocationPuck(options: LocationPuckOptions = {}): LocationPuckView {
  return new Node('locationPuck', { options }, []);
}
/** Bloom `NavigationBanner`: the next `maneuver`, and the street it goes onto. */
export function NavigationBanner(
  maneuver: DirectionsManeuver,
  instruction: string,
  { extras, ...options }: NavigationBannerOptions = {},
): NavigationBannerView {
  return new Node(
    'navigationBanner',
    { maneuver, instruction, options },
    extras === undefined ? [] : [extras],
  );
}

export const MAP_CHROME: Record<MapChromeKind, ControlRenderer> = {
  mapScaleBar: product(BloomMapScaleBar, { own: (d) => ({ variant: d.own('style')?.value }) }),
  mapControls: product(BloomMapControls, {
    own: (d) => ({ orientation: d.own('axis')?.value, align: d.own('align')?.value }),
  }),
  locationPuck: product(BloomLocationPuck, {
    lengths: ['coneLength'],
    own: (d) => ({ mode: d.own('style')?.value }),
  }),
  navigationBanner: product(BloomNavigationBanner),
};
