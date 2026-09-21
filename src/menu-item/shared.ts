/**
 * Everything `menu-item` decides WITHOUT rendering: what a group's rule says,
 * what one press does to a selection, and the sentence a screen reader hears
 * for a row. Pure, so `MenuItem.test.tsx` asserts each one directly.
 */
import { surfaceFillOn, surfaceTextOn, hairlineOn, type SurfaceTextPaint } from '../styles/surface-levels';
import { resolveAccentColors } from '../theme/accent-colors';
import type { Theme } from '../theme/types';
import { MENU_ITEM_DIET_LABELS, MENU_ITEM_SPICE_MAX } from './constants';
import type { MenuItemDiet, MenuItemOption, MenuItemOptionGroup, MenuItemRowProps } from './types';

export interface MenuItemPaint extends SurfaceTextPaint {
  /** Behind a photo that has not loaded, and behind a dish that has none. */
  thumb: string;
  /** Laid over a sold-out dish's photo. The surface itself, so the photo fades INTO the row. */
  wash: string;
  /** The flames. The error tone's subtle FOREGROUND — the member sized to read as a mark on a surface. */
  spice: string;
  /**
   * The glyph inside a plant-based diet pill. `Chip` renders `startIcon` AS
   * GIVEN, so the colour has to arrive painted — and it is the same subtle
   * success foreground the pill's own label is, read from the one recipe rather
   * than picked to match by eye.
   */
  diet: string;
  /** The rule above a group, and between two groups. */
  rule: string;
}

export function resolveMenuItemPaint(theme: Theme, surface: string): MenuItemPaint {
  return {
    ...surfaceTextOn(theme, surface),
    thumb: surfaceFillOn(theme, surface),
    wash: surface,
    spice: resolveAccentColors(theme.colors, 'error', 'subtle').foreground,
    diet: resolveAccentColors(theme.colors, 'success', 'subtle').foreground,
    rule: hairlineOn(theme, surface),
  };
}

// ---------------------------------------------------------------------------
//  Rows
// ---------------------------------------------------------------------------

/** The diets actually drawn: de-duplicated, in the order given. */
export function uniqueDiets(diets: ReadonlyArray<MenuItemDiet> | undefined): MenuItemDiet[] {
  return diets ? Array.from(new Set(diets)) : [];
}

/** `0` for no flames; anything else clamped into `1..3`. */
export function spiceLevel(spice: number | undefined): number {
  if (!spice || spice <= 0) return 0;
  return Math.min(Math.round(spice), MENU_ITEM_SPICE_MAX);
}

/** "Spicy 2 of 3" — the flames in words, since a glyph run announces nothing. */
export function describeSpice(level: number, label = 'Spicy'): string {
  return `${label} ${level} of ${MENU_ITEM_SPICE_MAX}`;
}

/**
 * The row as one sentence, in the order it is read on screen. The description
 * is NOT in it: it is clamped on screen and would be read in full here, which
 * turns a scannable list into a recipe book.
 */
export function composeMenuItemName(
  props: Pick<
    MenuItemRowProps,
    | 'name'
    | 'diets'
    | 'dietLabels'
    | 'spice'
    | 'spiceLabel'
    | 'price'
    | 'originalPrice'
    | 'quantity'
    | 'unavailable'
    | 'unavailableLabel'
  >,
): string {
  const parts: string[] = [props.name];
  for (const diet of uniqueDiets(props.diets)) {
    parts.push(props.dietLabels?.[diet] ?? MENU_ITEM_DIET_LABELS[diet]);
  }
  const heat = spiceLevel(props.spice);
  if (heat > 0) parts.push(describeSpice(heat, props.spiceLabel));
  if (props.originalPrice) parts.push(`${props.price}, originally ${props.originalPrice}`);
  else parts.push(props.price);
  if (props.quantity && props.quantity > 0) parts.push(`${props.quantity} in basket`);
  if (props.unavailable) parts.push(props.unavailableLabel ?? 'Sold out');
  return parts.join(', ');
}

// ---------------------------------------------------------------------------
//  Option groups
// ---------------------------------------------------------------------------

export interface MenuItemOptionRule {
  /** The fewest that must be chosen. */
  min: number;
  /** The most that may be chosen. */
  max: number;
  /** More than one may be chosen, so the group is a set of checkboxes rather than a radio set. */
  multiple: boolean;
  /** Something must be chosen. */
  required: boolean;
}

/** A group's rule, with the defaults filled in: `max` 1, `min` 0. */
export function optionGroupRule(group: Pick<MenuItemOptionGroup, 'min' | 'max'>): MenuItemOptionRule {
  const max = Math.max(1, group.max ?? 1);
  const min = Math.min(Math.max(0, group.min ?? 0), max);
  return { min, max, multiple: max > 1, required: min >= 1 };
}

/**
 * The rule in words — "Choose 1", "Up to 3", "Choose 2 to 4", "Optional".
 *
 * English, and overridable per group with `ruleLabel`. The one case worth
 * naming is `max: 1, min: 0`: "Up to 1" is not a sentence anybody says, so a
 * single optional choice reads as "Optional".
 */
export function describeOptionRule(group: Pick<MenuItemOptionGroup, 'min' | 'max' | 'ruleLabel'>): string {
  if (group.ruleLabel != null) return group.ruleLabel;
  const { min, max } = optionGroupRule(group);
  if (min === max) return `Choose ${max}`;
  if (min === 0) return max === 1 ? 'Optional' : `Up to ${max}`;
  return `Choose ${min} to ${max}`;
}

/**
 * What one press does to a group's selection.
 *
 * A single-choice group REPLACES; a multi-choice group toggles. At the cap, an
 * option that is not already chosen is refused — the caller draws it disabled,
 * so this branch is the backstop rather than the user's experience. Refusing
 * beats evicting the earliest choice: a reader who presses a fourth extra and
 * watches the first one vanish has been told nothing about the rule.
 */
export function toggleOptionSelection(
  current: ReadonlyArray<string> | undefined,
  optionId: string,
  rule: Pick<MenuItemOptionRule, 'multiple' | 'max'>,
): string[] {
  const chosen = current ?? [];
  if (!rule.multiple) return [optionId];
  if (chosen.includes(optionId)) return chosen.filter((id) => id !== optionId);
  if (chosen.length >= rule.max) return [...chosen];
  return [...chosen, optionId];
}

/** Whether an option can still be pressed: its own `disabled`, or the group at its cap. */
export function optionDisabled(
  option: Pick<MenuItemOption, 'id' | 'disabled'>,
  current: ReadonlyArray<string> | undefined,
  rule: Pick<MenuItemOptionRule, 'multiple' | 'max'>,
): boolean {
  if (option.disabled === true) return true;
  if (!rule.multiple) return false;
  const chosen = current ?? [];
  return chosen.length >= rule.max && !chosen.includes(option.id);
}

/**
 * The option's second line: its description and its price, joined.
 *
 * ONE text column, because that is what the grouped-choice contract has:
 * `RadioGroup`/`Checkbox` draw a label and a description and nothing else, and
 * a right-aligned price column would mean hand-rolling `role="radiogroup"` over
 * Bloom's own rows — the debt `docs/composition.mdx` names and keeps a list of.
 */
export function optionSubtitle(option: Pick<MenuItemOption, 'description' | 'price'>): string | undefined {
  if (option.description && option.price) return `${option.description} · ${option.price}`;
  return option.description ?? option.price ?? undefined;
}
