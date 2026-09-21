/**
 * What `PlaceCard` paints, and the pure text it assembles.
 *
 * Every colour is read RELATIVE to the surface the card was dropped on
 * (`styles/surface-levels.ts`) — a result row sits on the page, on a sheet or
 * inside a `ContentPanel`, and the detail header sits in whichever of those the
 * app opened. Nothing here picks a ramp stop.
 */
import { formatRatingValue } from '../rating/Rating';
import {
  hairlineOn,
  surfaceFillOn,
  surfaceTextOn,
  type SurfaceTextPaint,
} from '../styles/surface-levels';
import { resolveAccentColors } from '../theme/accent-colors';
import type { Theme } from '../theme/types';
import { PLACE_OPEN_LABELS } from './constants';
import type { PlaceCardProps, PlaceOpenState } from './types';

export interface PlaceCardPaint extends SurfaceTextPaint {
  /** Behind a photo that has not loaded, and the detail cover with no photo. */
  photoPlaceholder: string;
  /** The detail card's edge. */
  border: string;
  /** A stat tile. */
  tile: string;
  /** The keyboard focus ring. */
  ring: string;
}

export function resolvePlaceCardPaint(theme: Theme, surface: string): PlaceCardPaint {
  return {
    ...surfaceTextOn(theme, surface),
    photoPlaceholder: surfaceFillOn(theme, surface),
    border: hairlineOn(theme, surface),
    tile: surfaceFillOn(theme, surface),
    ring: resolveAccentColors(theme.colors, 'primary', 'solid').background,
  };
}

/** The state word as drawn, or `null` when the app did not say. */
export function openLabelFor(
  state: PlaceOpenState | undefined,
  override?: string,
): string | null {
  if (state === undefined) return null;
  return override ?? PLACE_OPEN_LABELS[state];
}

/**
 * The whole card in one utterance, in reading order.
 *
 * It is composed rather than left to ARIA's contents algorithm because a row is
 * ONE press target: without a name the announcement is "Forner de la Plaça
 * Bakery €€ Open Open until twenty hundred one point four kilometres", with no
 * commas and the rating read as "star four point six paren three one eight".
 */
export function composePlaceName(props: PlaceCardProps): string {
  const parts: string[] = [props.name];
  if (typeof props.badge === 'string' && props.badge !== '') parts.push(props.badge);
  if (props.category) parts.push(props.category);
  if (props.rating !== undefined) {
    const rated = props.rating !== null && props.rating !== '';
    if (rated) {
      const count =
        props.reviewCount != null && props.reviewCount !== '' ? `, ${props.reviewCount} reviews` : '';
      parts.push(`Rated ${formatRatingValue(props.rating as number | string)} out of 5${count}`);
    } else {
      parts.push(props.newLabel ?? 'New');
    }
  }
  const open = openLabelFor(props.openState, props.openLabel);
  if (open) parts.push(open);
  if (props.hours) parts.push(props.hours);
  if (props.address) parts.push(props.address);
  for (const fact of props.facts ?? []) parts.push(fact.accessibilityLabel ?? fact.label);
  if (props.figure) parts.push(props.figureLabel ? `${props.figureLabel}, ${props.figure}` : props.figure);
  if (props.figureDetail) parts.push(props.figureDetail);
  for (const stat of props.stats ?? []) parts.push(`${stat.value} ${stat.label}`);
  return parts.join(', ');
}
