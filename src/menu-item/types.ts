import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

/**
 * The dietary marks a dish can carry. A CLOSED list on purpose: each member
 * has a word Bloom draws and a spoken form a screen reader gets, and an open
 * `string[]` would be a row of untranslated, unannounced pills.
 *
 * An allergen is NOT one of these. "Contains nuts" is a legal statement about
 * a recipe, it belongs in the dish's own copy where it can be read in full, and
 * a pill that says it in two words is the wrong instrument for it.
 */
export type MenuItemDiet = 'vegetarian' | 'vegan' | 'gluten-free' | 'dairy-free' | 'halal' | 'kosher';

/** `comfortable` is the menu's own row; `compact` fits a basket or a sheet. */
export type MenuItemDensity = 'comfortable' | 'compact';

export interface MenuItemRowProps {
  /** The dish's name. One line, truncated. */
  name: string;
  /** What is in it. Clamped to two lines — the full text belongs on the dish's own screen. */
  description?: string;
  /** PRE-FORMATTED — "€12.50". Nothing here parses, converts or adds up a price. */
  price: string;
  /** PRE-FORMATTED price before a discount, struck through BEFORE `price`. */
  originalPrice?: string;
  /** An absolute URL, or an id the app's `ImageResolver` turns into one. */
  photo?: string;
  /** The `ImageResolver` rendition for a photo id. Ignored for URLs. */
  photoVariant?: string;
  /** Drawn as pills after the name, in the order given. Duplicates are drawn once. */
  diets?: ReadonlyArray<MenuItemDiet>;
  /** Replaces the English diet words ("Vegan", "Gluten-free", …). */
  dietLabels?: Partial<Record<MenuItemDiet, string>>;
  /**
   * How hot it is, `0`–`3`, drawn as that many flames. A LEVEL rather than a
   * pill: heat is a quantity, and a pill that says "Spicy" cannot tell a
   * reader whether one is enough.
   */
  spice?: number;
  /** The word the flames are announced with. Default `"Spicy"` (as "Spicy 2 of 3"). */
  spiceLabel?: string;
  /**
   * How many are already in the basket. Drawn ONCE: in the `Stepper` when
   * `onQuantityChange` is given (which is where you would change it), and as a
   * count over the thumbnail otherwise. Two spellings of one number is a
   * reader asking which of them is the real one.
   */
  quantity?: number;
  /** With a `quantity` above zero, the trailing control is a `Stepper` driving this. */
  onQuantityChange?: (quantity: number) => void;
  /** The add control. Drawn while nothing is in the basket yet. */
  onAdd?: () => void;
  /** Names the add control, which draws no text. Default `"Add <name>"`. */
  addLabel?: string;
  /** Sold out: the photo washes toward the page, the row dims and every control goes. */
  unavailable?: boolean;
  /** Default `"Sold out"`. */
  unavailableLabel?: string;
  /** Opens the dish — its options, its full description. */
  onPress?: () => void;
  /** Default `comfortable`. */
  density?: MenuItemDensity;
  /** Replaces the composed name ("Ember flatbread, Vegan, Spicy 2 of 3, €12.50, Sold out"). */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

// ---------------------------------------------------------------------------
//  MenuItemOptions
// ---------------------------------------------------------------------------

export interface MenuItemOption {
  /** Identifies the option inside its group. */
  id: string;
  /** What it is — "Large", "Extra cheese". */
  label: string;
  /** A second line under the label — "Serves two". */
  description?: string;
  /**
   * What it adds, PRE-FORMATTED and signed by the app — "+€1.50", "Free",
   * "−€0.50". It is drawn in the option's own text column, after the
   * description; see `docs/menu-item.mdx` for why it is not a right-aligned
   * column.
   */
  price?: string;
  disabled?: boolean;
}

export interface MenuItemOptionGroup {
  /** Identifies the group in `value` and in `onValueChange`. */
  id: string;
  /** The question — "Size", "Extras", "Sauce". */
  title: string;
  options: ReadonlyArray<MenuItemOption>;
  /**
   * The most that may be chosen. Default `1`, which makes the group a radio
   * set; anything above makes it a set of checkboxes.
   */
  max?: number;
  /** The fewest that must be chosen. Default `0`; `1` or more makes the group required. */
  min?: number;
  /** Replaces the derived rule line ("Choose 1", "Up to 3", "Choose 2 to 4", "Optional"). */
  ruleLabel?: string;
  /** An error under the group — "Choose a size". A non-empty string paints it invalid. */
  error?: string | null;
}

export interface MenuItemOptionsProps {
  /** The questions, in the order they are asked. */
  groups: ReadonlyArray<MenuItemOptionGroup>;
  /** The chosen option ids, per group id. Fully controlled — it keeps no state. */
  value: Readonly<Record<string, ReadonlyArray<string>>>;
  /** Called with the group and its next selection, already capped at the group's `max`. */
  onValueChange: (groupId: string, optionIds: ReadonlyArray<string>) => void;
  /** How many of the dish. Without `onQuantityChange` no quantity row is drawn. */
  quantity?: number;
  onQuantityChange?: (quantity: number) => void;
  /** The quantity row's title. Default `"Quantity"`. */
  quantityLabel?: string;
  /**
   * The running price, PRE-FORMATTED — "€16.40". The app recomputes it as the
   * choices change; this component never adds anything up.
   */
  total?: string;
  /** The footer button. Without it no footer is drawn. */
  onSubmit?: () => void;
  /** The footer button's label. Default `"Add to basket"`. */
  submitLabel?: string;
  /** Blocks the footer button — a required group with nothing chosen. */
  submitDisabled?: boolean;
  /** Disables every control, the footer included. */
  disabled?: boolean;
  /** A node above the groups — the dish's own photo, name and description. */
  header?: ReactNode;
  /** Names the set of questions. Default `"Options"`. */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
