/**
 * What `ContactProfileCard` paints, and the two pure helpers the card and its tests
 * both read.
 *
 * The paint is RELATIVE: every colour is computed from the fill the card's
 * content actually lands on (`styles/surface-levels.ts`), because the same
 * component is a `Card` at comfortable density and a bare row on whatever a list
 * is painted at compact — two different parents, one component. A ramp stop
 * picked here would be right for one of them and invisible on the other.
 */
import { interactiveWebCss } from '../styles/interactive-web-css';
import { hairlineOn, surfaceFillOn, surfaceTextOn } from '../styles/surface-levels';
import type { Theme } from '../theme/types';
import type { ContactProfileCardProps } from './types';

export interface ContactPaint {
  /** The fill the content lands on — a card's, or the ambient one at compact. */
  surface: string;
  /** The rule between the identity block and the footer. */
  hairline: string;
  /** The wash a channel action takes under a pointer. */
  channelHover: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  ring: string;
}

export function resolveContactPaint(theme: Theme, surface: string): ContactPaint {
  const text = surfaceTextOn(theme, surface);
  return {
    surface,
    hairline: hairlineOn(theme, surface),
    channelHover: surfaceFillOn(theme, surface),
    text: text.text,
    textSecondary: text.textSecondary,
    textTertiary: text.textTertiary,
    ring: theme.colors.primary,
  };
}

/**
 * The meta line under the name: a person reads "Head of Ops · Northwind", a
 * company reads its industry alone — a company has no company.
 */
export function contactMetaLine(
  props: Pick<ContactProfileCardProps, 'kind' | 'role' | 'company'>,
): string {
  const parts = [props.role, props.kind === 'company' ? undefined : props.company];
  return parts.filter((part): part is string => typeof part === 'string' && part !== '').join(' · ');
}

/** Joins the non-empty parts of an accessible name. */
export function joinContactName(
  parts: ReadonlyArray<string | false | null | undefined>,
  separator = ', ',
): string {
  return parts.filter((part): part is string => typeof part === 'string' && part !== '').join(separator);
}

// ---------------------------------------------------------------------------
//  Keyboard focus on web
//
//  The identity block is a react-native-web `Pressable`: focusable, with the
//  outline reset, so without a `:focus-visible` rule a keyboard user tabs
//  through an invisible stop. Inline styles carry no pseudo-classes, so the rule
//  lives in an adopted sheet hanging off a `dataSet` attribute, and the ring
//  colour is a per-instance custom property because it is a resolved token.
// ---------------------------------------------------------------------------

export const CONTACT_STYLE_ID = 'bloom-contact-card-web-css';

export const CONTACT_WEB_CSS = interactiveWebCss({
  selector: '[data-bloom-contact-subject]',
  varPrefix: 'bloom-contact',
  reset: 'none',
  transition: 'background-color 150ms ease',
});
