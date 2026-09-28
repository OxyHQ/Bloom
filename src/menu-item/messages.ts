import { defineMessages, type MessageCatalog } from '../locale/messages';
import type { MenuItemDiet } from './types';

/**
 * Every fixed string the menu-item family draws or announces, in each Bloom
 * language. Names and prices arrive formatted. A caller's `dietLabels`,
 * `spiceLabel`, `addLabel`, `unavailableLabel`, a group's `ruleLabel` and the
 * options' `*Label` props still win.
 */
export interface MenuItemMessages {
  diets: Record<MenuItemDiet, string>;
  /** The word the flames are announced with. */
  spicy: string;
  /** The flames in words: "Spicy 2 of 3". `label` is `spicy` or the caller's word. */
  spiceOf: (label: string, level: number, max: number) => string;
  /** A discounted price in the row's name: "€9, originally €12". */
  originally: (price: string, original: string) => string;
  /** How many are already in the basket, in the row's name. */
  inBasket: (count: number) => string;
  soldOut: string;
  /** Names the add control: "Add Margherita". */
  addItem: (name: string) => string;
  /** A group's rule in words. */
  choose: (count: number) => string;
  chooseRange: (min: number, max: number) => string;
  upTo: (count: number) => string;
  optional: string;
  quantity: string;
  addToBasket: string;
  /** Names the set of questions. */
  options: string;
}

export const MENU_ITEM_MESSAGES: MessageCatalog<MenuItemMessages> = defineMessages<MenuItemMessages>('MENU_ITEM_MESSAGES', {
  diets: { vegetarian: 'Vegetarian', vegan: 'Vegan', 'gluten-free': 'Gluten-free', 'dairy-free': 'Dairy-free', halal: 'Halal', kosher: 'Kosher' },
  spicy: 'Spicy',
  spiceOf: (label, level, max) => `${label} ${level} of ${max}`,
  originally: (price, original) => `${price}, originally ${original}`,
  inBasket: (n) => `${n} in basket`,
  soldOut: 'Sold out',
  addItem: (name) => `Add ${name}`,
  choose: (n) => `Choose ${n}`,
  chooseRange: (min, max) => `Choose ${min} to ${max}`,
  upTo: (n) => `Up to ${n}`,
  optional: 'Optional',
  quantity: 'Quantity',
  addToBasket: 'Add to basket',
  options: 'Options',
});
