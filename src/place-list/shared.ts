/**
 * What `place-list` paints, and the pure text it assembles.
 *
 * The colours are read off the surface the card or the list was dropped on
 * (`styles/surface-levels.ts`) — a saved list is shown on a page, in a sheet
 * and inside a panel, and nothing here picks a ramp stop.
 */
import {
  hairlineOn,
  surfaceFillOn,
  surfaceTextOn,
  type SurfaceTextPaint,
} from '../styles/surface-levels';
import { resolveAccentColors } from '../theme/accent-colors';
import type { Theme } from '../theme/types';
import { PLACE_LIST_VISIBILITY_LABELS } from './constants';
import type { PlaceListCardProps, PlaceListLabels, PlaceListPlace } from './types';

export interface PlaceListPaint extends SurfaceTextPaint {
  /** Behind a cover photo that has not loaded, and the empty strip. */
  tile: string;
  /** A rule between two entries. */
  hairline: string;
  /** The keyboard focus ring. */
  ring: string;
}

export function resolvePlaceListPaint(theme: Theme, surface: string): PlaceListPaint {
  return {
    ...surfaceTextOn(theme, surface),
    tile: surfaceFillOn(theme, surface),
    hairline: hairlineOn(theme, surface),
    ring: resolveAccentColors(theme.colors, 'primary', 'solid').background,
  };
}

/** `"12 places"`, and `"1 place"` for the one that would otherwise read wrong. */
export function placeListCountLabel(count: number): string {
  return count === 1 ? '1 place' : `${count} places`;
}

/** `"Shared with 3"`. */
export function placeListSharedWithLabel(count: number): string {
  return `Shared with ${count}`;
}

/**
 * The card in one utterance, in reading order: the name, how much is in it,
 * who it is shared with, and whether anyone else can see it.
 *
 * Composed rather than left to ARIA's contents algorithm for the same reason
 * `PlaceCard` composes its row: the card is ONE press target, and without a
 * name it is announced as "Want to go 12 places Shared with 3 Shared" in one
 * run with no commas.
 */
export function composePlaceListName(props: PlaceListCardProps): string {
  const parts: string[] = [props.name];
  if (props.count != null) parts.push((props.countLabel ?? placeListCountLabel)(props.count));
  const people = props.collaborators?.length ?? 0;
  if (people > 0) parts.push((props.sharedWithLabel ?? placeListSharedWithLabel)(people));
  parts.push(props.visibilityLabel ?? PLACE_LIST_VISIBILITY_LABELS[props.visibility ?? 'private']);
  return parts.join(', ');
}

/** Every word `PlaceList` speaks, before the caller overrides any of them. */
export const DEFAULT_PLACE_LIST_LABELS: PlaceListLabels = {
  moveEarlier: (position) => `Move to position ${position - 1}`,
  moveLater: (position) => `Move to position ${position + 1}`,
  remove: (name) => `Remove ${name} from the list`,
  moved: (name, position, total) => `${name} moved to position ${position} of ${total}`,
  note: 'Note',
};

/** A place's name, for the controls that talk about it. */
export function placeNameOf(entry: PlaceListPlace): string {
  return entry.place.name;
}
