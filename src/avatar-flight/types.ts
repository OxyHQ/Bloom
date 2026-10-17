import type { ComponentRef } from 'react';
import type { View } from 'react-native';

import type { AvatarCharacter } from '../agent-avatar';

/** An avatar's box in WINDOW coordinates, as `measureInWindow` reports it. */
export interface AvatarRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** One avatar's journey from an anchor to another. */
export interface AvatarFlightSpec {
  /** Names this journey. Unique within one `launch`; a flight is over when its `key` arrives. */
  key: string;
  /** Who flies: drawn from this character when the source offered no snapshot. */
  character: AvatarCharacter;
  /** The anchor it leaves (`flights.anchor(from)` on the source avatar). */
  from: string;
  /** The anchor it lands on. Measured again every frame until it settles, so it may mount after `launch`. */
  to: string;
  /** The box it lands in, derived from the target's measured box. Default: the box itself. */
  landing?: (target: AvatarRect) => AvatarRect;
  /** `'arc'` bows above the straight line and eases; `'straight'` follows the easing alone. Default `'arc'`. */
  path?: 'arc' | 'straight';
  /** Default 800. */
  duration?: number;
  /** Default 0. Stagger several flights with it. */
  delay?: number;
  /** `'out'` decelerates into the target, `'linear'` does not. Default `'linear'`. */
  ease?: 'out' | 'linear';
  /** The avatar fades out over the last of the journey: it merges into something instead of landing. */
  merge?: boolean;
}

/** A flight under way: its spec, where it left from and the picture taken as it left. */
export interface ActiveAvatarFlight {
  spec: AvatarFlightSpec;
  from: AvatarRect;
  snapshot?: Readonly<{ uri: string }>;
}

/** What the layer reads from the controller; not for callers. */
export interface AvatarFlightLayerState {
  flights: ReadonlyArray<ActiveAvatarFlight>;
  arrived: ReadonlyArray<string>;
  node: (anchor: string) => ComponentRef<typeof View> | undefined;
  arrive: (key: string) => void;
  finish: () => void;
}

/** Where joining avatars fly: out of each one's own anchor, into one shared target. */
export interface AvatarJoinRoute<T> {
  /** The anchor an avatar leaves — the reply it is writing, the slot it was waiting in. */
  from: (agent: T) => string;
  /** The anchor they all join: the profile, the header. */
  to: string;
  /** Who flies. */
  character: (agent: T) => AvatarCharacter;
}

/** Somebody who is part of the group, and whether they are arriving now or were already there. */
export interface AvatarJoinArrival<T> {
  agent: T;
  /** Arriving now: it flies in. Otherwise it was there when the screen opened, and simply is. */
  live: boolean;
}
