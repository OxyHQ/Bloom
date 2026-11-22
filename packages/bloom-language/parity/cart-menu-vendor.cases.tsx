import { CartLine, CartPanel, CartPromoField, CartTipPicker } from '@oxy.so/bloom/cart-panel';
import { MenuItemOptions, MenuItemRow } from '@oxy.so/bloom/menu-item';
import { Text } from '@oxy.so/bloom/typography';
import { VendorCard } from '@oxy.so/bloom/vendor-card';

import { ENUMS } from '../src/generated/spec.generated';
import * as L from '../src/index';
import { toElement } from '../src/render';
import type { ParityCase } from './support/cases';

const press = () => {};
const set = () => {};
const quantity = (_quantity: number) => {};
const PHOTO = 'https://cdn.oxy.so/p.jpg';
const DENSITIES = ENUMS.density;
const bloomDensity = (density: string) => (density === 'compact' ? 'compact' : 'comfortable');

const LINES = [
  {
    id: 'a',
    name: 'Margherita',
    options: ['Large', 'Extra basil'],
    price: '€12.50',
    quantity: 2,
  },
  {
    id: 'b',
    name: 'Tiramisu',
    note: 'No cocoa',
    price: '€5.00',
    originalPrice: '€6.00',
    quantity: 1,
    unavailable: true,
  },
];
const TIPS = [
  { id: '0', label: 'None' },
  { id: '10', label: '10%' },
  { id: '15', label: '15%' },
];
const SUMMARY = {
  lines: [
    { label: 'Subtotal', amount: '€30.00' },
    { label: 'Delivery', amount: '€2.90' },
  ],
  total: { label: 'Total', amount: '€32.90' },
};
const GROUPS = [
  {
    id: 'size',
    title: 'Size',
    min: 1,
    max: 1,
    options: [
      { id: 's', label: 'Small' },
      { id: 'l', label: 'Large', price: '+€3.00' },
    ],
  },
  {
    id: 'extra',
    title: 'Extras',
    max: 2,
    options: [
      { id: 'basil', label: 'Basil', description: 'Fresh' },
      { id: 'olive', label: 'Olives', disabled: true },
    ],
    error: 'Choose up to two',
  },
];
const CHOSEN = { size: ['l'], extra: ['basil'] };

const cart: ParityCase[] = [
  ...DENSITIES.map((density) => ({
    name: `CartLine ${density}`,
    language: () =>
      toElement(
        L.CartLine('Margherita', {
          options: ['Large', 'Extra basil'],
          price: '€12.50',
          secondaryPrice: '≈ $13.60',
          quantity: 2,
          onQuantityChange: quantity,
          onRemove: press,
        })
          .density(density)
          .label('Margherita, two'),
      ),
    bloom: () => (
      <CartLine
        name="Margherita"
        options={['Large', 'Extra basil']}
        price="€12.50"
        secondaryPrice="≈ $13.60"
        quantity={2}
        onQuantityChange={quantity}
        onRemove={press}
        density={bloomDensity(density)}
        accessibilityLabel="Margherita, two"
      />
    ),
  })),
  {
    name: 'CartLine unavailable, a photo',
    language: () =>
      toElement(
        L.CartLine('Tiramisu', {
          price: '€5.00',
          quantity: 1,
          photo: PHOTO,
          unavailable: true,
          removeInStepper: true,
        }),
      ),
    bloom: () => (
      <CartLine
        name="Tiramisu"
        price="€5.00"
        quantity={1}
        photo={PHOTO}
        unavailable
        removeInStepper
      />
    ),
  },
  ...DENSITIES.map((density) => ({
    name: `CartPanel ${density}`,
    language: () =>
      toElement(
        L.CartPanel('Forno Rosso', LINES, {
          vendorMeta: '25–35 min',
          onPressVendor: press,
          onLineQuantityChange: set,
          onLineRemove: set,
          minimumOrder: {
            message: 'Add €5.00 to reach the minimum',
            progress: { value: 30, max: 35, accessibilityLabel: 'Minimum order' },
          },
          tip: { options: TIPS, value: '10', onValueChange: set, label: 'Tip' },
          promo: { value: '', onChangeText: set, onApply: press, label: 'Promo code' },
          summary: SUMMARY,
          onCheckout: press,
          checkoutLabel: 'Checkout',
        }).density(density),
      ),
    bloom: () => (
      <CartPanel
        vendorName="Forno Rosso"
        lines={LINES}
        vendorMeta="25–35 min"
        onPressVendor={press}
        onLineQuantityChange={set}
        onLineRemove={set}
        minimumOrder={{
          message: 'Add €5.00 to reach the minimum',
          progress: { value: 30, max: 35, accessibilityLabel: 'Minimum order' },
        }}
        tip={{ options: TIPS, value: '10', onValueChange: set, label: 'Tip' }}
        promo={{ value: '', onChangeText: set, onApply: press, label: 'Promo code' }}
        summary={SUMMARY}
        onCheckout={press}
        checkoutLabel="Checkout"
        density={bloomDensity(density)}
      />
    ),
  })),
  {
    name: 'CartPanel empty',
    language: () => toElement(L.CartPanel('Forno Rosso', [], { emptyTitle: 'Nothing yet' })),
    bloom: () => <CartPanel vendorName="Forno Rosso" lines={[]} emptyTitle="Nothing yet" />,
  },
  {
    name: 'CartPanel an empty block',
    language: () => toElement(L.CartPanel('Forno Rosso', [], { empty: L.Text('Browse the menu') })),
    bloom: () => (
      <CartPanel vendorName="Forno Rosso" lines={[]} empty={<Text>Browse the menu</Text>} />
    ),
  },
  {
    name: 'CartPromoField',
    language: () =>
      toElement(
        L.CartPromoField(['SUMMER', set], {
          onApply: press,
          placeholder: 'Code',
          error: 'This code has expired',
        }),
      ),
    bloom: () => (
      <CartPromoField
        value="SUMMER"
        onChangeText={set}
        onApply={press}
        placeholder="Code"
        error="This code has expired"
      />
    ),
  },
  {
    name: 'CartPromoField applied, disabled',
    language: () =>
      toElement(
        L.CartPromoField(['', set], {
          onApply: press,
          applied: 'SUMMER',
          onRemove: press,
        }).disabled(),
      ),
    bloom: () => (
      <CartPromoField
        value=""
        onChangeText={set}
        onApply={press}
        applied="SUMMER"
        onRemove={press}
        disabled
      />
    ),
  },
  {
    name: 'CartTipPicker',
    language: () =>
      toElement(
        L.CartTipPicker(['15', set], TIPS, {
          label: 'Tip',
          description: 'All of it goes to the rider',
        }),
      ),
    bloom: () => (
      <CartTipPicker
        options={TIPS}
        value="15"
        onValueChange={set}
        label="Tip"
        description="All of it goes to the rider"
      />
    ),
  },
  {
    name: 'CartTipPicker disabled',
    language: () => toElement(L.CartTipPicker(['0', set], TIPS).disabled()),
    bloom: () => <CartTipPicker options={TIPS} value="0" onValueChange={set} disabled />,
  },
];

const menu: ParityCase[] = [
  ...DENSITIES.map((density) => ({
    name: `MenuItemRow ${density}`,
    language: () =>
      toElement(
        L.MenuItemRow('Diavola', {
          description: 'Tomato, mozzarella, spicy salami and chilli oil',
          price: '€13.00',
          originalPrice: '€15.00',
          diets: ['gluten-free'],
          spice: 2,
          onAdd: press,
        })
          .density(density)
          .onPress(press),
      ),
    bloom: () => (
      <MenuItemRow
        name="Diavola"
        description="Tomato, mozzarella, spicy salami and chilli oil"
        price="€13.00"
        originalPrice="€15.00"
        diets={['gluten-free']}
        spice={2}
        onAdd={press}
        density={bloomDensity(density)}
        onPress={press}
      />
    ),
  })),
  {
    name: 'MenuItemRow in the basket, a photo',
    language: () =>
      toElement(
        L.MenuItemRow('Margherita', {
          price: '€11.00',
          photo: PHOTO,
          diets: ['vegetarian', 'vegan'],
          quantity: 2,
          onQuantityChange: quantity,
        }),
      ),
    bloom: () => (
      <MenuItemRow
        name="Margherita"
        price="€11.00"
        photo={PHOTO}
        diets={['vegetarian', 'vegan']}
        quantity={2}
        onQuantityChange={quantity}
      />
    ),
  },
  {
    name: 'MenuItemRow unavailable',
    language: () =>
      toElement(L.MenuItemRow('Calzone', { price: '€12.00', unavailable: true }).label('Calzone')),
    bloom: () => (
      <MenuItemRow name="Calzone" price="€12.00" unavailable accessibilityLabel="Calzone" />
    ),
  },
  {
    name: 'MenuItemOptions',
    language: () =>
      toElement(
        L.MenuItemOptions(GROUPS, {
          value: CHOSEN,
          onValueChange: set,
          quantity: 1,
          onQuantityChange: quantity,
          total: '€14.00',
          onSubmit: press,
          submitLabel: 'Add to basket',
          header: L.Text('Diavola'),
        }),
      ),
    bloom: () => (
      <MenuItemOptions
        groups={GROUPS}
        value={CHOSEN}
        onValueChange={set}
        quantity={1}
        onQuantityChange={quantity}
        total="€14.00"
        onSubmit={press}
        submitLabel="Add to basket"
        header={<Text>Diavola</Text>}
      />
    ),
  },
  {
    name: 'MenuItemOptions disabled',
    language: () =>
      toElement(L.MenuItemOptions(GROUPS, { value: {}, onValueChange: set }).disabled()),
    bloom: () => <MenuItemOptions groups={GROUPS} value={{}} onValueChange={set} disabled />,
  },
];

const vendors: ParityCase[] = [
  ...DENSITIES.map((density) => ({
    name: `VendorCard ${density}`,
    language: () =>
      toElement(
        L.VendorCard('Forno Rosso', {
          photo: PHOTO,
          cuisines: ['Pizza', 'Italian'],
          rating: 4.7,
          reviewCount: 320,
          deliveryTime: '25–35 min',
          deliveryFee: '€1.90',
          distance: '1.2 km',
          promo: '20% off',
          favorite: true,
          onFavoriteChange: set,
        })
          .density(density)
          .onPress(press),
      ),
    bloom: () => (
      <VendorCard
        name="Forno Rosso"
        photo={PHOTO}
        cuisines={['Pizza', 'Italian']}
        rating={4.7}
        reviewCount={320}
        deliveryTime="25–35 min"
        deliveryFee="€1.90"
        distance="1.2 km"
        promo="20% off"
        favorite
        onFavoriteChange={set}
        density={bloomDensity(density)}
        onPress={press}
      />
    ),
  })),
  {
    name: 'VendorCard closed, a promo tone',
    language: () =>
      toElement(
        L.VendorCard('Sushi Ko', {
          cuisines: ['Japanese'],
          availability: 'closed',
          opensAt: 'Opens at 18:00',
          promo: 'Free delivery',
          promoTone: 'success',
          newLabel: 'New',
        }),
      ),
    bloom: () => (
      <VendorCard
        name="Sushi Ko"
        cuisines={['Japanese']}
        availability="closed"
        opensAt="Opens at 18:00"
        promo="Free delivery"
        promoTone="success"
        newLabel="New"
      />
    ),
  },
  {
    name: 'VendorCard loading',
    language: () => toElement(L.VendorCard('Forno Rosso').loading()),
    bloom: () => <VendorCard name="Forno Rosso" loading />,
  },
];

export const CART_MENU_VENDOR_CASES: ParityCase[] = [...cart, ...menu, ...vendors];
