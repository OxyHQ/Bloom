import { centeredLanding } from './geometry';
import type { AvatarFlightSpec, AvatarJoinRoute } from './types';

/** A joining avatar's journey: long enough to read as arriving, not as a jump. */
export const AVATAR_JOIN_DURATION = 950;
/** Several joining together leave one after another, this far apart. */
export const AVATAR_JOIN_STAGGER = 120;
/** The square a joining avatar shrinks into at the centre of the target, as it merges. */
export const AVATAR_JOIN_LANDING_SIZE = 14;

/**
 * The flights of avatars JOINING something — a group's profile, a header — rather than landing on
 * a place of their own: each leaves its `from` anchor, shrinks into the centre of `to` and merges
 * into it, staggered when several leave at once.
 */
export function avatarJoinFlights<T extends { id: string }>(
  agents: readonly T[],
  route: AvatarJoinRoute<T>,
): AvatarFlightSpec[] {
  return agents.map((agent, index) => ({
    key: `join:${agent.id}`,
    character: route.character(agent),
    from: route.from(agent),
    to: route.to,
    landing: centeredLanding(AVATAR_JOIN_LANDING_SIZE),
    duration: AVATAR_JOIN_DURATION,
    delay: index * AVATAR_JOIN_STAGGER,
    merge: true,
  }));
}
