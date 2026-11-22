import {
  type DeliveryDay,
  DeliverySlotDays as BloomDeliverySlotDays,
  type DeliverySlotDaysProps,
  DeliverySlotOption as BloomDeliverySlotOption,
  type DeliverySlotOptionProps,
  DeliverySlotPicker as BloomDeliverySlotPicker,
  type DeliverySlotPickerProps,
  type DeliveryWindow,
} from '@oxy.so/bloom/delivery-slot';

import type { Binding } from '../binding';
import { type Child, Node, type ViewModifiers } from '../node';
import type { ColorToken } from '../tokens';
import type { ControlDraw, ControlRenderer } from './draw';
import { product } from './product';

/** When: the days, a window to choose, and the picker that holds them. */
export type DeliverySlotKind = 'deliverySlotDays' | 'deliverySlotOption' | 'deliverySlotPicker';

/** Bloom `DeliverySlotDays`'s data: none beyond its days and the day chosen. */
export type DeliverySlotDaysOptions = Omit<
  DeliverySlotDaysProps,
  | 'style'
  | 'testID'
  | 'accessibilityLabel'
  | 'days'
  | 'value'
  | 'onChange'
  | 'disabled'
  | 'fadeColor'
>;
/** Bloom `DeliverySlotOption`'s data (its detail, price, glyph and selection); its badge is a language child. */
export type DeliverySlotOptionOptions = Omit<
  DeliverySlotOptionProps,
  'style' | 'testID' | 'accessibilityLabel' | 'label' | 'disabled' | 'onPress' | 'badge'
> & { readonly badge?: Child };
/**
 * Bloom `DeliverySlotPicker`'s data (its words, the day chosen and its
 * handler, the ASAP option, tiers and loading rows); its empty block is a
 * language child.
 */
export type DeliverySlotPickerOptions = Omit<
  DeliverySlotPickerProps,
  | 'style'
  | 'testID'
  | 'days'
  | 'windows'
  | 'value'
  | 'onValueChange'
  | 'disabled'
  | 'loading'
  | 'fadeColor'
  | 'empty'
> & { readonly empty?: Child };

/** Bloom `DeliverySlotDays`; `.label()` names the strip. */
export interface DeliverySlotDaysView extends ViewModifiers<DeliverySlotDaysView> {
  disabled(value?: boolean): DeliverySlotDaysView;
  /** The colour its scrolling edges fade into (with none, Bloom's surface). */
  tint(value: ColorToken): DeliverySlotDaysView;
}
/** Bloom `DeliverySlotOption`; `.onPress()` is its own. */
export interface DeliverySlotOptionView extends ViewModifiers<DeliverySlotOptionView> {
  disabled(value?: boolean): DeliverySlotOptionView;
}
export interface DeliverySlotPickerView extends ViewModifiers<DeliverySlotPickerView> {
  disabled(value?: boolean): DeliverySlotPickerView;
  /** Placeholder rows while the windows load. */
  loading(value?: boolean): DeliverySlotPickerView;
  /** The colour the day strip's edges fade into. */
  tint(value: ColorToken): DeliverySlotPickerView;
}

/** Bloom `DeliverySlotDays`: the day its binding holds, one of `days`. */
export function DeliverySlotDays(
  day: Binding<string>,
  days: readonly DeliveryDay[],
  options: DeliverySlotDaysOptions = {},
): DeliverySlotDaysView {
  return new Node('deliverySlotDays', { binding: day, days, options }, []);
}
export function DeliverySlotOption(
  label: string,
  options: DeliverySlotOptionOptions = {},
): DeliverySlotOptionView {
  return new Node('deliverySlotOption', { label, options }, []);
}
/** Bloom `DeliverySlotPicker`: the window its binding holds, among the chosen day's `windows`. */
export function DeliverySlotPicker(
  window: Binding<string>,
  days: readonly DeliveryDay[],
  windows: readonly DeliveryWindow[],
  options: DeliverySlotPickerOptions = {},
): DeliverySlotPickerView {
  return new Node('deliverySlotPicker', { binding: window, days, windows, options }, []);
}

const fade = (d: ControlDraw) => ({ fadeColor: d.own('tint')?.value as ColorToken | undefined });

export const DELIVERY_SLOTS: Record<DeliverySlotKind, ControlRenderer> = {
  deliverySlotDays: product(BloomDeliverySlotDays, {
    binding: ['value', 'onChange'],
    own: (d) => ({ disabled: d.own('disabled')?.value }),
    colors: fade,
  }),
  deliverySlotOption: product(BloomDeliverySlotOption, {
    press: true,
    slots: ['badge'],
    own: (d) => ({ disabled: d.own('disabled')?.value }),
  }),
  deliverySlotPicker: product(BloomDeliverySlotPicker, {
    binding: ['value', 'onValueChange'],
    slots: ['empty'],
    own: (d) => ({ disabled: d.own('disabled')?.value, loading: d.own('loading')?.value }),
    colors: fade,
  }),
};
