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

import type { Binding } from '../binding';
import { type Child, Node, type ViewModifiers } from '../node';
import type { ControlDensity } from '../tokens';
import type { ControlRenderer } from './draw';
import { product, rowDensity } from './product';

/** The basket: its lines, the tip and promo fields, and the panel that holds them. */
export type CartKind = 'cartLine' | 'cartPanel' | 'cartPromoField' | 'cartTipPicker';

type Drawn = 'style' | 'testID' | 'accessibilityLabel';

/** Bloom `CartLine`'s data (its price, quantity, options, photo and handlers). */
export type CartLineOptions = Omit<CartLineProps, Drawn | 'name' | 'density'>;
/**
 * Bloom `CartPanel`'s data (the vendor's photo and meta, the line handlers,
 * the minimum order, tip, promo and summary, the checkout and its words); its
 * empty block is a language child.
 */
export type CartPanelOptions = Omit<
  CartPanelProps,
  Drawn | 'vendorName' | 'lines' | 'density' | 'empty'
> & { readonly empty?: Child };
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
  /** `default` (comfortable) or `compact`. */
  density(value: ControlDensity): CartLineView;
}
export interface CartPanelView extends ViewModifiers<CartPanelView> {
  density(value: ControlDensity): CartPanelView;
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

export const CARTS: Record<CartKind, ControlRenderer> = {
  cartLine: product(BloomCartLine, { own: (d) => ({ density: rowDensity(d) }) }),
  cartPanel: product(BloomCartPanel, {
    slots: ['empty'],
    own: (d) => ({ density: rowDensity(d) }),
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
