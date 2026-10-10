import { defineMessages, type MessageCatalog } from '../locale/messages';

/**
 * Every fixed string the cart panel draws or announces, in each Bloom
 * language. Prices and names arrive formatted. A caller's `*Label`,
 * `emptyTitle`, `emptyDescription` and `accessibilityLabel` still win.
 */
export interface CartPanelMessages {
  /** Names the panel. */
  basket: string;
  checkout: string;
  emptyTitle: string;
  emptyDescription: string;
  /** A line that cannot be ordered. */
  soldOut: string;
  /** Names a line's remove control, or an applied code's: "Remove Margherita". */
  removeItem: (name: string) => string;
  /** A discounted price in a line's name: "€9, originally €12". */
  originally: (price: string, original: string) => string;
  promoCode: string;
  apply: string;
  tip: string;
}

export const CART_PANEL_MESSAGES: MessageCatalog<CartPanelMessages> =
  defineMessages<CartPanelMessages>('CART_PANEL_MESSAGES', {
    basket: 'Basket',
    checkout: 'Go to checkout',
    emptyTitle: 'Your basket is empty',
    emptyDescription: 'Add something from the menu and it will show up here.',
    soldOut: 'Sold out',
    removeItem: (name) => `Remove ${name}`,
    originally: (price, original) => `${price}, originally ${original}`,
    promoCode: 'Promo code',
    apply: 'Apply',
    tip: 'Tip',
  });
