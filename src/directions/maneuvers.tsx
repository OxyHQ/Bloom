import React from 'react';
import { View } from 'react-native';

import { RiArrowGoBackLine } from '../icons/remix/RiArrowGoBackLine';
import { RiArrowLeftDownLine } from '../icons/remix/RiArrowLeftDownLine';
import { RiArrowRightDownLine } from '../icons/remix/RiArrowRightDownLine';
import { RiArrowRightUpLine } from '../icons/remix/RiArrowRightUpLine';
import { RiArrowUpLine } from '../icons/remix/RiArrowUpLine';
import { RiCornerUpLeftLine } from '../icons/remix/RiCornerUpLeftLine';
import { RiExchangeLine } from '../icons/remix/RiExchangeLine';
import { RiFlagLine } from '../icons/remix/RiFlagLine';
import { RiGitMergeLine } from '../icons/remix/RiGitMergeLine';
import { RiLoginBoxLine } from '../icons/remix/RiLoginBoxLine';
import { RiLogoutBoxRLine } from '../icons/remix/RiLogoutBoxRLine';
import { RiLoopRightLine } from '../icons/remix/RiLoopRightLine';
import { RiMapPin2Line } from '../icons/remix/RiMapPin2Line';
import { RiWalkLine } from '../icons/remix/RiWalkLine';
import type { BloomIconComponent } from '../icons/icon-component';
import type { DirectionsManeuver } from './types';

/**
 * The glyph each maneuver draws.
 *
 * TWO OF THEM ARE THE MIRROR OF ANOTHER, and that is the honest way to draw
 * them. A maneuver set is symmetric — a right turn IS a left turn seen from the
 * other side — and Bloom's icon set carries one side of each pair
 * (`RiCornerUpLeftLine`, `RiArrowRightUpLine`). Mirroring the existing glyph
 * keeps the stroke weight, the arrowhead and the corner radius identical to its
 * partner; picking a different glyph that happens to point the right way does
 * not, and the two then read as coming from two sets.
 *
 * `mirror()` wraps the icon in a `scaleX: -1` view. That is a transform of the
 * WHOLE glyph about its own centre — it moves nothing, needs no offset, and the
 * wrapped component keeps `BloomIconComponent`'s three props, so it is handed
 * to `AddressRow`'s `icon` exactly like any other.
 *
 * Each mirrored component is built ONCE at module scope. Built inside a render
 * it would be a new component type every frame, and React would unmount and
 * remount the glyph on each one.
 */
function mirror(Icon: BloomIconComponent): BloomIconComponent {
  const Mirrored: BloomIconComponent = ({ width, height, fill }) => (
    <View style={{ transform: [{ scaleX: -1 }] }}>
      <Icon width={width} height={height} fill={fill} />
    </View>
  );
  Mirrored.displayName = `Mirrored(${Icon.displayName ?? Icon.name ?? 'Icon'})`;
  return Mirrored;
}

const RiCornerUpRight = mirror(RiCornerUpLeftLine);
const RiArrowLeftUp = mirror(RiArrowRightUpLine);

export const DIRECTIONS_MANEUVER_ICON: Readonly<Record<DirectionsManeuver, BloomIconComponent>> = {
  depart: RiMapPin2Line,
  straight: RiArrowUpLine,
  'slight-left': RiArrowLeftUp,
  left: RiCornerUpLeftLine,
  'sharp-left': RiArrowLeftDownLine,
  'slight-right': RiArrowRightUpLine,
  right: RiCornerUpRight,
  'sharp-right': RiArrowRightDownLine,
  uturn: RiArrowGoBackLine,
  roundabout: RiLoopRightLine,
  merge: RiGitMergeLine,
  arrive: RiFlagLine,
  board: RiLoginBoxLine,
  alight: RiLogoutBoxRLine,
  transfer: RiExchangeLine,
  walk: RiWalkLine,
};
