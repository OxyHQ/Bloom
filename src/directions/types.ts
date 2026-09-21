import type { StyleProp, ViewStyle } from 'react-native';

import type { AddressDensity } from '../address';
import type { RouteStop } from '../route-stops';

/** How you are getting there. Chooses the mode glyph and the default figure label. */
export type DirectionsMode = 'drive' | 'transit' | 'walk' | 'cycle';

/**
 * What the traveller does at a step. Data, not sixteen components: it chooses
 * the glyph ({@link DIRECTIONS_MANEUVER_ICON}) and the word the step is
 * announced with, and nothing else.
 *
 * The four transit members are here rather than in a second vocabulary because
 * a transit route's steps are interleaved with walking ones — "walk 4 min",
 * "board the L4", "8 stops", "get off at Plaça de les Bruixes" — and a second
 * type would have to be merged back together at every call site.
 */
export type DirectionsManeuver =
  | 'depart'
  | 'straight'
  | 'slight-left'
  | 'left'
  | 'sharp-left'
  | 'slight-right'
  | 'right'
  | 'sharp-right'
  | 'uturn'
  | 'roundabout'
  | 'merge'
  | 'arrive'
  | 'board'
  | 'alight'
  | 'transfer'
  | 'walk';

/** How the road is moving. Chooses the tone of the traffic badge. */
export type DirectionsTraffic = 'light' | 'moderate' | 'heavy';

/** One transit line, as its operator names and colours it. */
export interface TransitLine {
  /** The short name drawn on the badge ("L4", "N12", "S1"). Never truncated. */
  name: string;
  /**
   * The operator's own colour for the line. The badge picks its label from the
   * two ends of the theme's own reading pair by MEASURING contrast against this
   * — it never derives a colour from it. Without a colour the badge is Bloom's
   * neutral pill.
   */
  color?: string;
  /** Where the line is heading ("towards Pla del Bosc"). Announced, not drawn. */
  headsign?: string;
  /** The announced name, when "L4" is not a word. Default `` `Line ${name}` ``. */
  accessibilityLabel?: string;
}

export interface TransitLineBadgeProps {
  line: TransitLine;
  /** Default `label-small`. */
  size?: 'label-small' | 'label-medium';
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/** One way of getting there. */
export interface DirectionsRoute {
  /** Identifies the route to `onSelectRoute`, and keys the row. */
  id: string;
  /** The FIGURE — "24 min". Pre-formatted and short. */
  duration: string;
  /** "8.2 km". */
  distance?: string;
  /** Pre-formatted ("Arrives 18:42"). */
  arrival?: string;
  /** The road or the line the route is known by ("Via Ronda del Nord"). */
  via?: string;
  /** How the road is moving. Draws a badge beside the figure and on the row. */
  traffic?: DirectionsTraffic;
  /** Replaces the English traffic word ("Light traffic", …). */
  trafficLabel?: string;
  /** A word for what makes this route worth offering ("Fewest transfers"). */
  note?: string;
  /** The lines a transit route rides, drawn as badges in order. */
  lines?: readonly TransitLine[];
}

/** Every word `DirectionsSummary` speaks, in one prop. */
export interface DirectionsSummaryLabels {
  /** The quiet label over the figure. Default: the mode's word ("Drive", "Transit", …). */
  figure?: string;
  /** Above the alternates. Default `"Other routes"`. */
  alternates?: string;
  /** The primary action. Default `"Start"`. */
  start?: string;
  /** Names the mode switcher. Default `"Travel mode"`. */
  modes?: string;
  /** Replaces the English mode words. */
  mode?: Partial<Record<DirectionsMode, string>>;
  /** Replaces the English traffic words. */
  traffic?: Partial<Record<DirectionsTraffic, string>>;
}

export interface DirectionsSummaryProps {
  /**
   * Every route offered, chosen one included. ONE list rather than a `route`
   * plus an `alternates`: the chosen route moves as the reader picks, and two
   * props would need the app to keep them consistent at every press.
   */
  routes: readonly DirectionsRoute[];
  /** The chosen route's id. Defaults to the first. */
  selectedRouteId?: string;
  onSelectRoute?: (id: string) => void;
  /**
   * The origin and destination, drawn by `RouteStops` above everything else.
   * Omitted, the summary draws no header — an app whose screen already shows
   * the stops does not get a second copy.
   */
  stops?: readonly RouteStop[];
  onPressStop?: (id: string) => void;
  /** Draws `RouteStops`' swap control. Offered only for exactly two stops. */
  onSwapStops?: () => void;
  /** The mode switcher's segments, in order. Empty or omitted hides it. */
  modes?: readonly DirectionsMode[];
  /** The chosen mode. Also chooses the default figure label and the row glyph. */
  mode?: DirectionsMode;
  onModeChange?: (mode: DirectionsMode) => void;
  /** Draws the primary action under the figure. */
  onStart?: () => void;
  labels?: DirectionsSummaryLabels;
  /** Names the block. Default `"Directions"`. */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  /** Parts get `<testID>-stops`, `-modes`, `-figure`, `-start`, `-alternates`. */
  testID?: string;
}

/** One instruction on the way. */
export interface DirectionsStep {
  /** Identifies the step to `onPressStep`, and keys the row. */
  id: string;
  /** What to do — "Turn right onto Carrer del Roure". */
  instruction: string;
  /** The rest of it — "Continue for 400 m", "8 stops". */
  detail?: string;
  /** Default `straight`. */
  maneuver?: DirectionsManeuver;
  /** The distance to this maneuver, pre-formatted ("400 m"). Drawn tabular. */
  distance?: string;
  /** A line badge after the instruction — a step that boards or changes line. */
  line?: TransitLine;
  /** The announced name, overriding the one assembled from the row's parts. */
  accessibilityLabel?: string;
}

/** One continuous stretch in one mode — a walk, a ride, a drive between stops. */
export interface DirectionsLeg {
  /** Identifies the leg. Defaults to its index. */
  id?: string;
  /** The header line ("Walk to Plaça de les Bruixes"). No title draws no header. */
  title?: string;
  /** The trailing reading on the header ("6 min · 450 m"). */
  meta?: string;
  /** Chooses the header glyph. Default `drive`. */
  mode?: DirectionsMode;
  /** The line this leg rides, drawn on the header. */
  line?: TransitLine;
  steps: readonly DirectionsStep[];
}

export interface DirectionsStepsProps {
  legs: readonly DirectionsLeg[];
  /**
   * The step the traveller is on. It is marked on screen AND named in the
   * row's announcement — a wash says nothing to a screen reader.
   */
  currentStepId?: string;
  /** Makes each step pressable — an app pans its map to the maneuver. */
  onPressStep?: (stepId: string) => void;
  /** Default `comfortable`. */
  density?: AddressDensity;
  /** The word added to the current step's name. Default `"Current step"`. */
  currentLabel?: string;
  /** Names the list. Default `"Directions"`. */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  /** Parts get `<testID>-leg-<n>`, `-leg-<n>-step-<m>`. */
  testID?: string;
}
