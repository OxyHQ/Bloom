import {
  AvatarAnchor as BloomAvatarAnchor,
  AvatarFlightLayer as BloomAvatarFlightLayer,
  type AvatarFlights,
} from '@oxy.so/bloom/avatar-flight';

import { Node, type Child, type ViewModifiers, type ViewNode } from '../node';
import type { ControlRenderer } from './draw';

/**
 * Avatars that fly from one place on the screen to another (Bloom
 * `avatar-flight`). Its views are nodes; its flights (`useAvatarFlights()`,
 * `useAvatarJoin()`, `launch`, `cancel`, `centeredLanding`) are used as they
 * are inside a `view()`, by anchor key.
 */
export type AvatarFlightKind = 'avatarAnchor' | 'avatarFlightLayer';

/** Bloom `AvatarAnchor`: a place avatars leave and land, by key. */
export type AvatarAnchorView = ViewModifiers<AvatarAnchorView>;
/** Bloom `AvatarFlightLayer`: where `flights` fly. */
export type AvatarFlightLayerView = ViewNode;

/** Bloom `AvatarAnchor` around `children`: anchor `key` of `flights` (from `useAvatarFlights()`). */
export function AvatarAnchor(
  flights: AvatarFlights,
  key: string,
  ...children: Child[]
): AvatarAnchorView {
  return new Node('avatarAnchor', { flights, anchor: key }, children);
}
/** Bloom `AvatarFlightLayer`: draws `flights` while any is in the air. */
export function AvatarFlightLayer(flights: AvatarFlights): AvatarFlightLayerView {
  return new Node('avatarFlightLayer', { flights }, []);
}

export const AVATAR_FLIGHTS: Record<AvatarFlightKind, ControlRenderer> = {
  avatarAnchor: (d) => {
    const props = d.props();
    Object.assign(props, d.node.props as { flights: AvatarFlights; anchor: string });
    return d.component(BloomAvatarAnchor, props, ...d.children(d.node.children));
  },
  avatarFlightLayer: (d) => {
    const props = d.props();
    props.flights = (d.node.props as { flights: AvatarFlights }).flights;
    return d.component(BloomAvatarFlightLayer, props);
  },
};
