import type { ComponentRef } from 'react';
import type { View } from 'react-native';

import type { AvatarRect } from './types';

/** A measurement is only trusted when it is finite and has a size: an unmounted node reports zeros. */
export function measureAvatar(
  node: ComponentRef<typeof View> | undefined,
): Promise<AvatarRect | null> {
  return new Promise((resolve) => {
    if (!node?.measureInWindow) {
      resolve(null);
      return;
    }
    let settled = false;
    const timeout = setTimeout(() => {
      if (!settled) {
        settled = true;
        resolve(null);
      }
    }, 120);
    node.measureInWindow((x, y, width, height) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      resolve(
        [x, y, width, height].every(Number.isFinite) && width > 0 && height > 0
          ? { x, y, width, height }
          : null,
      );
    });
  });
}

/** The box and size at `progress` (0…1) of a flight; `arc` bows it above the straight line. */
export function avatarFlightPoint(
  from: AvatarRect,
  to: AvatarRect,
  progress: number,
  arc: boolean,
) {
  'worklet';
  const t = arc ? progress * progress * (3 - 2 * progress) : progress;
  const distance = Math.hypot(to.x - from.x, to.y - from.y);
  const control = {
    x: from.x + (to.x - from.x) * 0.3,
    y: Math.min(from.y, to.y) - Math.min(110, distance * 0.22),
  };
  return {
    x: arc
      ? (1 - t) ** 2 * from.x + 2 * (1 - t) * t * control.x + t * t * to.x
      : from.x + (to.x - from.x) * t,
    y: arc
      ? (1 - t) ** 2 * from.y + 2 * (1 - t) * t * control.y + t * t * to.y
      : from.y + (to.y - from.y) * t,
    width: from.width + (to.width - from.width) * t,
    height: from.height + (to.height - from.height) * t,
  };
}

/** A landing that shrinks to a `size` square at the centre of the target: for an avatar that merges into another. */
export function centeredLanding(size: number) {
  return (target: AvatarRect): AvatarRect => ({
    x: target.x + (target.width - size) / 2,
    y: target.y + (target.height - size) / 2,
    width: size,
    height: size,
  });
}
