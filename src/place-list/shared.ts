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
import { PLACE_LIST_MESSAGES, type PlaceListMessages } from './messages';
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

/**
 * `"12 places"`, and `"1 place"` for the one that would otherwise read wrong —
 * in English. The card counts in the app's locale (`PLACE_LIST_MESSAGES`).
 */
export function placeListCountLabel(count: number): string {
  return PLACE_LIST_MESSAGES.en.places(count);
}

/** `"Shared with 3"`, in English; the card says it in the app's locale. */
export function placeListSharedWithLabel(count: number): string {
  return PLACE_LIST_MESSAGES.en.sharedWith(count);
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
export function composePlaceListName(
  props: PlaceListCardProps,
  messages: PlaceListMessages = PLACE_LIST_MESSAGES.en,
): string {
  const parts: string[] = [props.name];
  if (props.count != null) parts.push((props.countLabel ?? messages.places)(props.count));
  const people = props.collaborators?.length ?? 0;
  if (people > 0) parts.push((props.sharedWithLabel ?? messages.sharedWith)(people));
  parts.push(props.visibilityLabel ?? messages.visibility[props.visibility ?? 'private']);
  return parts.join(', ');
}

/**
 * Every word `PlaceList` speaks, in English, before the caller overrides any
 * of them. The list itself speaks `PLACE_LIST_MESSAGES` in the app's locale.
 */
export const DEFAULT_PLACE_LIST_LABELS: PlaceListLabels = PLACE_LIST_MESSAGES.en.labels;

/** A place's name, for the controls that talk about it. */
export function placeNameOf(entry: PlaceListPlace): string {
  return entry.place.name;
}
