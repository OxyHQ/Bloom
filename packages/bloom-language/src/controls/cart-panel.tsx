import {
  CartLine as BloomCartLine,
  type CartLineEntry,
  type CartLineProps,
  CartPanel as BloomCartPanel,
  type CartPanelProps,
  CartPromoField as BloomCartPromoField,
  type CartPromoFieldProps,
  CartTipPicker as BloomCartTipPicker,
  type CartTipOption,
  type CartTipPickerProps,
} from '@oxy.so/bloom/cart-panel';

import type { Binding, Bound } from '../binding';
import { type Child, Node, type ViewModifiers } from '../node';
import type { Density } from '../tokens';
import type { ControlRenderer } from './draw';
import { product } from './product';

/** The basket: its lines, the tip and promo fields, and the panel that holds them. */
export type CartKind = 'cartLine' | 'cartPanel' | 'cartPromoField' | 'cartTipPicker';

type Drawn = 'style' | 'testID' | 'accessibilityLabel';

/** Bloom `CartLine`'s data (its price, quantity, options, photo and handlers). */
export type CartLineOptions = Omit<
  CartLineProps,
  Drawn | 'name' | 'density' | 'quantity' | 'onQuantityChange'
>;
/**
 * Bloom `CartPanel`'s data (the vendor's photo and meta, the line handlers,
 * the minimum order and summary, the checkout and its words); its empty block
 * is a language child. Its tip and promo rows are its `.tip()` and `.promo()`.
 */
export type CartPanelOptions = Omit<
  CartPanelProps,
  Drawn | 'vendorName' | 'lines' | 'density' | 'empty' | 'tip' | 'promo'
> & { readonly empty?: Child };
/** A cart panel's tip row's words and state, as Bloom's `tip` takes them, but its value and choices. */
export type CartPanelTipOptions = Omit<CartTipPickerProps, 'options' | 'value' | 'onValueChange'>;
/** A cart panel's promo row's handlers, code applied, words and error, as Bloom's `promo` takes them, but its text. */
export type CartPanelPromoOptions = Omit<CartPromoFieldProps, 'value' | 'onChangeText'>;
/** Bloom `CartPromoField`'s data (the apply and remove handlers, the code applied, its words and error). */
export type CartPromoFieldOptions = Omit<
  CartPromoFieldProps,
  Drawn | 'value' | 'onChangeText' | 'disabled'
>;
/** Bloom `CartTipPicker`'s words (its label and description). */
export type CartTipPickerOptions = Omit<
  CartTipPickerProps,
  Drawn | 'options' | 'value' | 'onValueChange' | 'disabled'
>;

export interface CartLineView extends ViewModifiers<CartLineView> {
  quantity(value: Bound<CartLineProps, 'quantity'>): CartLineView;
  /** `comfortable` or `compact`. */
  density(value: Density<'cartLine'>): CartLineView;
}
export interface CartPanelView extends ViewModifiers<CartPanelView> {
  density(value: Density<'cartPanel'>): CartPanelView;
  /**
   * The tip row: the tip its binding holds, one of `choices`, as a
   * `CartTipPicker` takes them. Without it no tip row is drawn.
   */
  tip(
    value: Binding<string>,
    choices: readonly CartTipOption[],
    options?: CartPanelTipOptions,
  ): CartPanelView;
  /**
   * The promo row: the code its binding holds, as a `CartPromoField` takes
   * them. Without it no promo row is drawn.
   */
  promo(value: Binding<string>, options: CartPanelPromoOptions): CartPanelView;
}
export interface CartPromoFieldView extends ViewModifiers<CartPromoFieldView> {
  disabled(value?: boolean): CartPromoFieldView;
}
export interface CartTipPickerView extends ViewModifiers<CartTipPickerView> {
  disabled(value?: boolean): CartTipPickerView;
}

export function CartLine(name: string, options: CartLineOptions): CartLineView {
  return new Node('cartLine', { name, options }, []);
}
export function CartPanel(
  vendorName: string,
  lines: readonly CartLineEntry[],
  options: CartPanelOptions = {},
): CartPanelView {
  return new Node('cartPanel', { vendorName, lines, options }, []);
}
/** Bloom `CartPromoField`, writing the code its binding holds. */
export function CartPromoField(
  code: Binding<string>,
  options: CartPromoFieldOptions,
): CartPromoFieldView {
  return new Node('cartPromoField', { binding: code, options }, []);
}
/** Bloom `CartTipPicker`: the tip its binding holds, one of `choices` (Bloom's `options`). */
export function CartTipPicker(
  tip: Binding<string>,
  choices: readonly CartTipOption[],
  options: CartTipPickerOptions = {},
): CartTipPickerView {
  return new Node('cartTipPicker', { binding: tip, options: { ...options, options: choices } }, []);
}

type CartPanelTip = readonly [Binding<string>, readonly CartTipOption[], CartPanelTipOptions?];
type CartPanelPromo = readonly [Binding<string>, CartPanelPromoOptions];

/** A cart panel's `.tip()` as Bloom's `tip`: its words, its choices, its binding as the value and its setter. */
function tipOf(tip: CartPanelTip | undefined): CartTipPickerProps | undefined {
  if (tip === undefined) return undefined;
  const [[value, set], options, words] = tip;
  return { ...words, options, value, onValueChange: set };
}
/** A cart panel's `.promo()` as Bloom's `promo`: its data, its binding as the text and its setter. */
function promoOf(promo: CartPanelPromo | undefined): CartPromoFieldProps | undefined {
  if (promo === undefined) return undefined;
  const [[value, set], options] = promo;
  return { ...options, value, onChangeText: set };
}

export const CARTS: Record<CartKind, ControlRenderer> = {
  cartLine: product(BloomCartLine, {
    bindings: { quantity: ['quantity', 'onQuantityChange'] },
    own: (d) => ({ density: d.own('density')?.value }),
  }),
  cartPanel: product(BloomCartPanel, {
    slots: ['empty'],
    own: (d) => ({
      density: d.own('density')?.value,
      tip: tipOf(d.own('tip')?.value as CartPanelTip | undefined),
      promo: promoOf(d.own('promo')?.value as CartPanelPromo | undefined),
    }),
  }),
  cartPromoField: product(BloomCartPromoField, {
    binding: ['value', 'onChangeText'],
    own: (d) => ({ disabled: d.own('disabled')?.value }),
  }),
  cartTipPicker: product(BloomCartTipPicker, {
    binding: ['value', 'onValueChange'],
    own: (d) => ({ disabled: d.own('disabled')?.value }),
  }),
};
