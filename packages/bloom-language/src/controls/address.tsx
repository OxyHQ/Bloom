import {
  AddressList as BloomAddressList,
  type AddressListProps,
  type AddressListSection,
  AddressRow as BloomAddressRow,
  type AddressRowProps,
} from '@oxy.so/bloom/address';
import type { BloomSize } from '@oxy.so/bloom/appearance';

import { type Child, Node, type ViewModifiers } from '../node';
import type { ChoiceListStyle, ControlDensity } from '../tokens';
import type { ControlDraw, ControlRenderer } from './draw';
import { product, rowDensity } from './product';

/** An address as a row, and a list of them to read or to choose one from. */
export type AddressesKind = 'addressRow' | 'addressList';

type Drawn = 'style' | 'testID' | 'accessibilityLabel' | 'size' | 'density';
type RowSlots = 'leading' | 'badge' | 'action';

/**
 * Bloom `AddressRow`'s data (its subtitle, kind, glyph, meta, selection and
 * role); its leading media, badge and action are language children
 * (`leading: null` draws no media, as Bloom's does).
 */
export type AddressRowOptions = Omit<
  AddressRowProps,
  Drawn | RowSlots | 'title' | 'disabled' | 'onPress'
> & { readonly [K in RowSlots]?: Child };
/** Bloom `AddressList`'s data (its selection and words); its empty block is a language child. */
export type AddressListOptions = Omit<
  AddressListProps,
  Drawn | 'sections' | 'variant' | 'loading' | 'empty'
> & { readonly empty?: Child };

/** Bloom `AddressRow`; `.onPress()` is its own. */
export interface AddressRowView extends ViewModifiers<AddressRowView> {
  size(value: BloomSize): AddressRowView;
  /** `default` (comfortable) or `compact`. */
  density(value: ControlDensity): AddressRowView;
  disabled(value?: boolean): AddressRowView;
}
export interface AddressListView extends ViewModifiers<AddressListView> {
  size(value: BloomSize): AddressListView;
  /** `list` (default), read; or `picker`, one chosen. */
  style(value: ChoiceListStyle): AddressListView;
  density(value: ControlDensity): AddressListView;
  /** Placeholder rows instead of the sections. */
  loading(value?: boolean): AddressListView;
}

export function AddressRow(title: string, options: AddressRowOptions = {}): AddressRowView {
  return new Node('addressRow', { title, options }, []);
}
export function AddressList(
  sections: readonly AddressListSection[],
  options: AddressListOptions = {},
): AddressListView {
  return new Node('addressList', { sections, options }, []);
}

const sized = (d: ControlDraw) => ({ size: d.own('size')?.value, density: rowDensity(d) });

export const ADDRESSES: Record<AddressesKind, ControlRenderer> = {
  addressRow: product(BloomAddressRow, {
    press: true,
    slots: ['leading', 'badge', 'action'],
    own: (d) => ({ ...sized(d), disabled: d.own('disabled')?.value }),
  }),
  addressList: product(BloomAddressList, {
    slots: ['empty'],
    own: (d) => ({
      ...sized(d),
      variant: d.own('style')?.value,
      loading: d.own('loading')?.value,
    }),
  }),
};
