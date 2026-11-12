import { render } from '@testing-library/react-native';
import { View } from 'react-native';
import { BloomScope } from '../appearance';
import { Button } from '../button';
import { CartLine, CartPanel, CartPromoField, CartTipPicker } from '../cart-panel';
import { CategoryBar } from '../category-bar';
import { CarrierQuoteCard, CarrierQuoteList } from '../carrier-quote';
import { RiHomeLine } from '../icons/remix/RiHomeLine';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { Text } from '../typography';
import { resolvedStyle } from './support/rendered-style';

const sizes = [
  [undefined, 36],
  ['xs', 24],
  ['sm', 32],
  ['md', 36],
  ['lg', 44],
] as const;

function provider(size: (typeof sizes)[number][0], children: React.ReactNode) {
  return (
    <BloomThemeProvider fonts={false}>
      {size ? <BloomScope size={size}>{children}</BloomScope> : children}
    </BloomThemeProvider>
  );
}

const quote = {
  id: 'offer',
  carrier: { id: 'carrier', name: 'Carrier' },
  price: '$10',
  priceValue: 10,
};

it.each(sizes)('CarrierQuoteCard keeps built-in md actions at %s scope', (size) => {
  const tree = render(
    provider(size, <CarrierQuoteCard quote={quote} onAccept={() => {}} testID="quote" />),
  );
  expect(resolvedStyle(tree.getByTestId('quote-accept').props.style).height).toBe(36);
});

it.each(sizes)('CarrierQuoteCard delegates caller actions at %s scope', (size, height) => {
  const tree = render(
    provider(
      size,
      <CarrierQuoteCard
        quote={quote}
        testID="quote"
        actions={
          <Button testID="quote-custom">
            <Text>Custom</Text>
          </Button>
        }
      />,
    ),
  );
  expect(resolvedStyle(tree.getByTestId('quote-custom').props.style).height).toBe(height);
});

it.each(sizes)(
  'CarrierQuoteList keeps its sort pill xl and delegates its empty action at %s scope',
  (size, height) => {
    const tree = render(provider(size, <CarrierQuoteList quotes={[quote]} testID="quotes" />));
    expect(resolvedStyle(tree.getByTestId('quotes-sort-price').props.style).height).toBe(32);
    const empty = render(
      provider(
        size,
        <CarrierQuoteList
          quotes={[]}
          testID="empty-quotes"
          emptyAction={
            <Button testID="quotes-empty-action">
              <Text>Edit</Text>
            </Button>
          }
        />,
      ),
    );
    expect(resolvedStyle(empty.getByTestId('quotes-empty-action').props.style).height).toBe(height);
  },
);

it.each(sizes)('CartLine keeps its explicit sm stepper at %s scope', (size, height) => {
  const line = (
    <CartLine name="Soup" price="$5" quantity={2} onQuantityChange={() => {}} testID="line" />
  );
  const tree = render(provider(size, line));
  expect(resolvedStyle(tree.getByTestId('line-stepper-increment').props.style).height).toBe(32);
  expect(height).toBeGreaterThan(0);
});

it('CartLine stepper follows the nearest nested scope through a wrapper', () => {
  const tree = render(
    <BloomThemeProvider fonts={false}>
      <BloomScope size="xs">
        <View>
          <CartLine name="Soup" price="$5" quantity={2} onQuantityChange={() => {}} testID="line" />
        </View>
      </BloomScope>
    </BloomThemeProvider>,
  );
  expect(resolvedStyle(tree.getByTestId('line-stepper-increment').props.style).height).toBe(32);
});

it('commerce caller controls inherit the nearest nested scope through wrappers', () => {
  const tree = render(
    <BloomThemeProvider fonts={false}>
      <BloomScope size="xs">
        <View>
          <BloomScope size="lg">
            <CarrierQuoteCard
              quote={quote}
              actions={
                <Button testID="nested-quote">
                  <Text>Custom</Text>
                </Button>
              }
            />
            <CarrierQuoteList
              quotes={[]}
              emptyAction={
                <Button testID="nested-list">
                  <Text>Edit</Text>
                </Button>
              }
            />
            <CategoryBar
              items={[{ key: 'home', label: 'Home', icon: RiHomeLine }]}
              accessibilityLabel="Categories"
              trailing={
                <Button testID="nested-category">
                  <Text>Filter</Text>
                </Button>
              }
            />
            <CartPromoField
              value="SAVE"
              onChangeText={() => {}}
              onApply={() => {}}
              testID="nested-promo"
            />
          </BloomScope>
        </View>
      </BloomScope>
    </BloomThemeProvider>,
  );
  for (const id of ['nested-quote', 'nested-list', 'nested-category']) {
    expect(resolvedStyle(tree.getByTestId(id).props.style).height).toBe(44);
  }
  expect(resolvedStyle(tree.getByTestId('nested-promo-input').props.style).height).toBe(40);
});

it.each(sizes)('CartPanel checkout remains lg while its line stepper follows %s scope', (size) => {
  const panel = (
    <CartPanel
      vendorName="Shop"
      lines={[{ id: 'soup', name: 'Soup', price: '$5', quantity: 2 }]}
      promo={{ value: 'SAVE', onChangeText: () => {}, onApply: () => {} }}
      onLineQuantityChange={() => {}}
      onCheckout={() => {}}
      testID="cart"
    />
  );
  const tree = render(provider(size, panel));
  expect(resolvedStyle(tree.getByTestId('cart-checkout').props.style).height).toBe(44);
  expect(resolvedStyle(tree.getByTestId('cart-promo-input').props.style).height).toBe(
    inputHeightFor(size),
  );
  expect(resolvedStyle(tree.getByTestId('cart-promo-apply').props.style).height).toBe(32);
  expect(
    resolvedStyle(tree.getByTestId('cart-line-soup-stepper-increment').props.style).height,
  ).toBe(32);
});

it.each(sizes)('CartPromoField inherits input scope and keeps apply sm at %s scope', (size) => {
  const tree = render(
    provider(
      size,
      <CartPromoField value="SAVE" onChangeText={() => {}} onApply={() => {}} testID="promo" />,
    ),
  );
  expect(resolvedStyle(tree.getByTestId('promo-input').props.style).height).toBe(
    inputHeightFor(size),
  );
  expect(resolvedStyle(tree.getByTestId('promo-apply').props.style).height).toBe(32);
});

it.each(sizes)('CartTipPicker keeps its explicit lg choice geometry at %s scope', (size) => {
  const tree = render(
    provider(
      size,
      <CartTipPicker
        options={[
          { id: 'none', label: 'No tip' },
          { id: 'two', label: '$2' },
        ]}
        onValueChange={() => {}}
        testID="tip"
      />,
    ),
  );
  expect(resolvedStyle(tree.getByTestId('tip-options').props.style).height).toBe(44);
});

it.each(sizes)(
  'CategoryBar delegates trailing controls and keeps its arrows sm at %s scope',
  (size, height) => {
    const tree = render(
      provider(
        size,
        <CategoryBar
          items={[{ key: 'home', label: 'Home', icon: RiHomeLine }]}
          accessibilityLabel="Categories"
          trailing={
            <Button testID="categories-trailing">
              <Text>Filter</Text>
            </Button>
          }
          testID="categories"
        />,
      ),
    );
    expect(resolvedStyle(tree.getByTestId('categories-trailing').props.style).height).toBe(height);
  },
);

function inputHeightFor(size: (typeof sizes)[number][0]) {
  if (size === 'xs') return 24;
  if (size === 'sm') return 28;
  if (size === 'lg') return 40;
  return 32;
}
