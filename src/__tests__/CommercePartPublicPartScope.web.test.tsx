/** @jest-environment jsdom */
import { act } from 'react';
import { createRoot } from 'react-dom/client';
jest.mock('react-native', () => jest.requireActual('react-native-web'));
import { BloomScope } from '../appearance';
import { Button } from '../button';
import { CartLine, CartPanel, CartPromoField, CartTipPicker } from '../cart-panel';
import { CategoryBar } from '../category-bar';
import { CarrierQuoteCard, CarrierQuoteList } from '../carrier-quote';
import { RiHomeLine } from '../icons/remix/RiHomeLine';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { Text } from '../typography';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
const sizes = [
  [undefined, '36px'],
  ['xs', '24px'],
  ['sm', '32px'],
  ['md', '36px'],
  ['lg', '44px'],
] as const;
const quote = {
  id: 'offer',
  carrier: { id: 'carrier', name: 'Carrier' },
  price: '$10',
  priceValue: 10,
};

function mount(size: (typeof sizes)[number][0], children: React.ReactNode) {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root = createRoot(host);
  act(() =>
    root.render(
      <BloomThemeProvider fonts={false}>
        {size ? <BloomScope size={size}>{children}</BloomScope> : children}
      </BloomThemeProvider>,
    ),
  );
  return {
    host,
    cleanup() {
      act(() => root.unmount());
      host.remove();
    },
  };
}

function required(host: HTMLElement, testID: string) {
  const found = host.querySelector<HTMLElement>(`[data-testid="${testID}"]`);
  if (!found) throw new Error(`Missing element ${testID}`);
  return found.matches('button, input')
    ? found
    : (found.querySelector<HTMLElement>('button, input') ?? found);
}

it.each(sizes)('CarrierQuoteCard keeps built-in md actions at %s scope on web', (size) => {
  const mounted = mount(
    size,
    <CarrierQuoteCard quote={quote} onAccept={() => {}} testID="quote" />,
  );
  try {
    expect(getComputedStyle(required(mounted.host, 'quote-accept')).height).toBe('36px');
  } finally {
    mounted.cleanup();
  }
});

it.each(sizes)('CarrierQuoteCard delegates custom actions at %s scope on web', (size, height) => {
  const mounted = mount(
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
  );
  try {
    expect(getComputedStyle(required(mounted.host, 'quote-custom')).height).toBe(height);
  } finally {
    mounted.cleanup();
  }
});

it.each(sizes)(
  'CarrierQuoteList keeps sort xl and delegates empty action at %s scope on web',
  (size, height) => {
    const mounted = mount(size, <CarrierQuoteList quotes={[quote]} testID="quotes" />);
    try {
      expect(getComputedStyle(required(mounted.host, 'quotes-sort-price')).height).toBe('32px');
    } finally {
      mounted.cleanup();
    }
    const empty = mount(
      size,
      <CarrierQuoteList
        quotes={[]}
        emptyAction={
          <Button testID="quotes-empty-action">
            <Text>Edit</Text>
          </Button>
        }
      />,
    );
    try {
      expect(getComputedStyle(required(empty.host, 'quotes-empty-action')).height).toBe(height);
    } finally {
      empty.cleanup();
    }
  },
);

it.each(sizes)('CartLine keeps its explicit sm stepper at %s scope on web', (size) => {
  const mounted = mount(
    size,
    <CartLine name="Soup" price="$5" quantity={2} onQuantityChange={() => {}} testID="line" />,
  );
  try {
    expect(getComputedStyle(required(mounted.host, 'line-stepper-increment')).height).toBe('32px');
  } finally {
    mounted.cleanup();
  }
});

it.each(sizes)('CartPanel keeps checkout lg and line stepper sm at %s scope on web', (size) => {
  const mounted = mount(
    size,
    <CartPanel
      vendorName="Shop"
      lines={[{ id: 'soup', name: 'Soup', price: '$5', quantity: 2 }]}
      promo={{ value: 'SAVE', onChangeText: () => {}, onApply: () => {} }}
      onLineQuantityChange={() => {}}
      onCheckout={() => {}}
      testID="cart"
    />,
  );
  try {
    expect(getComputedStyle(required(mounted.host, 'cart-checkout')).height).toBe('44px');
    const inputHeights = { xs: '24px', sm: '28px', md: '32px', lg: '40px' };
    expect(getComputedStyle(required(mounted.host, 'cart-promo-input')).height).toBe(
      size ? inputHeights[size] : '32px',
    );
    expect(getComputedStyle(required(mounted.host, 'cart-promo-apply')).height).toBe('32px');
    expect(
      getComputedStyle(required(mounted.host, 'cart-line-soup-stepper-increment')).height,
    ).toBe('32px');
  } finally {
    mounted.cleanup();
  }
});

it.each(sizes)(
  'CartPromoField inherits input scale and keeps apply sm at %s scope on web',
  (size) => {
    const heights = { xs: '24px', sm: '28px', md: '32px', lg: '40px' };
    const mounted = mount(
      size,
      <CartPromoField value="SAVE" onChangeText={() => {}} onApply={() => {}} testID="promo" />,
    );
    try {
      const input = required(mounted.host, 'promo-input');
      expect(getComputedStyle(input).height).toBe(size ? heights[size] : '32px');
      expect(getComputedStyle(required(mounted.host, 'promo-apply')).height).toBe('32px');
    } finally {
      mounted.cleanup();
    }
  },
);

it.each(sizes)('CartTipPicker keeps its explicit lg choice geometry at %s scope on web', (size) => {
  const mounted = mount(
    size,
    <CartTipPicker
      options={[
        { id: 'none', label: 'No tip' },
        { id: 'two', label: '$2' },
      ]}
      onValueChange={() => {}}
      testID="tip"
    />,
  );
  try {
    expect(getComputedStyle(required(mounted.host, 'tip-options')).height).toBe('44px');
  } finally {
    mounted.cleanup();
  }
});

it.each(sizes)('CategoryBar delegates trailing controls at %s scope on web', (size, height) => {
  const mounted = mount(
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
  );
  try {
    expect(getComputedStyle(required(mounted.host, 'categories-trailing')).height).toBe(height);
  } finally {
    mounted.cleanup();
  }
});

it('commerce composition slots preserve nearest nested scope on web', () => {
  const mounted = mount(
    'xs',
    <BloomScope size="lg">
      <CarrierQuoteCard
        quote={quote}
        actions={
          <Button testID="nested-custom">
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
          <Button testID="nested-trailing">
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
    </BloomScope>,
  );
  try {
    expect(getComputedStyle(required(mounted.host, 'nested-custom')).height).toBe('44px');
    expect(getComputedStyle(required(mounted.host, 'nested-list')).height).toBe('44px');
    expect(getComputedStyle(required(mounted.host, 'nested-trailing')).height).toBe('44px');
    expect(getComputedStyle(required(mounted.host, 'nested-promo-input')).height).toBe('40px');
  } finally {
    mounted.cleanup();
  }
});
