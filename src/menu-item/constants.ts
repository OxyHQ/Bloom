import type { MenuItemDensity, MenuItemDiet } from './types';

/** Every diet, in the order a dish lists them. */
export const MENU_ITEM_DIETS: readonly MenuItemDiet[] = [
  'vegetarian',
  'vegan',
  'gluten-free',
  'dairy-free',
  'halal',
  'kosher',
];

/** The English words. Apps in other languages pass `dietLabels`. */
export const MENU_ITEM_DIET_LABELS: Readonly<Record<MenuItemDiet, string>> = {
  vegetarian: 'Vegetarian',
  vegan: 'Vegan',
  'gluten-free': 'Gluten-free',
  'dairy-free': 'Dairy-free',
  halal: 'Halal',
  kosher: 'Kosher',
};

/**
 * The two diets that are about what the dish is MADE OF get a glyph; the other
 * four are certifications and preparations with no drawing, and inventing one
 * for them would be Bloom asserting a symbol an app's customers have to learn.
 */
export const MENU_ITEM_DIET_WITH_GLYPH: readonly MenuItemDiet[] = ['vegetarian', 'vegan'];

/** The hottest level the flames can say. */
export const MENU_ITEM_SPICE_MAX = 3;

export interface MenuItemGeometry {
  /** The square thumbnail's edge. */
  thumb: number;
  /** Its corner. */
  thumbRadius: number;
  /** The flame and the diet glyph. */
  glyph: number;
}

/**
 * 72 is the thumbnail that lets a two-line description sit beside it without
 * the row growing taller than the picture — the dish's photo and its words end
 * on the same line. 56 is the basket rung, where the words are one line.
 */
export const MENU_ITEM_GEOMETRY: Record<MenuItemDensity, MenuItemGeometry> = {
  comfortable: { thumb: 72, thumbRadius: 12, glyph: 14 },
  compact: { thumb: 56, thumbRadius: 10, glyph: 12 },
};

/**
 * How far a sold-out dish's photo is washed toward the page. The same 0.5
 * `listing-card` washes an unavailable home at, so a card and a row that both
 * mean "not this one" fade by the same amount.
 */
export const MENU_ITEM_WASH_OPACITY = 0.5;

/** Between two option groups, and between a group's rule and its controls. */
export const MENU_ITEM_GROUP_GAP = 24;
