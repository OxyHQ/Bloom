import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { AvatarSnapshotObserver } from '../agent-avatar/context';
import type { AvatarFlights } from './use-avatar-flights';

export interface AvatarAnchorProps {
  flights: AvatarFlights;
  /** The key the avatar is known by: `from` or `to` of a flight. */
  anchor: string;
  /** The avatar: an `AgentAvatar`, or anything that wraps one. */
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}

/**
 * A box around an avatar that takes part in flights. It is the anchor (`flights.anchor`), hands the
 * avatar's picture to a flight leaving it (`flights.snapshot`) and hides itself while an avatar is
 * in the air to or from it, since the layer draws that one. For an avatar that is a component of
 * Bloom's with its own `avatarRef` / `avatarHidden` (`AgentReplyIdentity`, `AgentProfile`), use
 * those with `flights.anchor` and `flights.isLanding` instead.
 */
export function AvatarAnchor({ flights, anchor, children, style }: AvatarAnchorProps) {
  const hidden = flights.isLeaving(anchor) || flights.isLanding(anchor);
  return (
    <View
      ref={flights.anchor(anchor)}
      collapsable={false}
      style={[style, hidden ? { opacity: 0 } : null]}
    >
      <AvatarSnapshotObserver.Provider value={flights.snapshot(anchor)}>
        {children}
      </AvatarSnapshotObserver.Provider>
    </View>
  );
}
