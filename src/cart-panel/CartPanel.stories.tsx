import React, { useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Avatar } from '../avatar';
import { BottomSheet } from '../bottom-sheet';
import { Card, CardBody } from '../card';
import { OrderStatusBar, OrderStatusTimeline } from '../order-status';
import type { PriceLine } from '../price-breakdown';
import { Text } from '../typography';
import { CartPanel } from './CartPanel';
import type { CartLineEntry, CartTipOption } from './types';

const meta: Meta = {
  title: 'Blocks/Food/CartPanel',
  parameters: { layout: 'fullscreen' },
};

export default meta;

type Story = StoryObj;

// ---------------------------------------------------------------------------
//  Demo data — invented. Every amount is a string; nothing here adds up.
// ---------------------------------------------------------------------------

const photo = (seed: string) => `https://picsum.photos/seed/${seed}/160/160`;

const LINES: CartLineEntry[] = [
  {
    id: 'ember',
    name: 'Ember flatbread',
    options: ['Large', 'Extra smoked curd', 'Fermented chilli'],
    note: '“Cut into six, please.”',
    price: '€37.60',
    quantity: 2,
    photo: photo('ember-flatbread'),
  },
  {
    id: 'sorrel',
    name: 'Sorrel and white bean stew',
    options: ['Regular'],
    price: '€10.00',
    originalPrice: '€13.00',
    quantity: 1,
    photo: photo('sorrel-stew'),
  },
  {
    id: 'pickles',
    name: 'Harbour pickles',
    price: '€4.20',
    quantity: 1,
    photo: photo('harbour-pickles'),
    unavailable: true,
  },
];

const SUMMARY: PriceLine[] = [
  { id: 'subtotal', label: 'Subtotal', sublabel: '4 items', amount: '€51.80' },
  { id: 'delivery', label: 'Delivery', sublabel: '1.2 km', amount: '€1.90' },
  { id: 'service', label: 'Service fee', amount: '€1.30', tone: 'muted' },
  { id: 'promo', label: 'FIRSTBITE', amount: '−€5.00', tone: 'discount' },
  { id: 'tip', label: 'Courier tip', amount: '€2.00' },
];

const TIPS: CartTipOption[] = [
  { id: 'none', label: 'No tip' },
  { id: '1', label: '€1' },
  { id: '2', label: '€2' },
  { id: '5', label: '€5' },
];

function Page({ children }: { children: React.ReactNode }) {
  return <View style={{ width: '100%', padding: 16, gap: 32, maxWidth: 1000 }}>{children}</View>;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 12 }}>
      <Text variant="caption-1-semibold" style={{ opacity: 0.6 }}>
        {title}
      </Text>
      {children}
    </View>
  );
}

function useBasket() {
  const [lines, setLines] = useState<CartLineEntry[]>(LINES);
  const [tip, setTip] = useState<string | undefined>('2');
  const [code, setCode] = useState('');
  const [applied, setApplied] = useState<string | undefined>('FIRSTBITE');
  const [error, setError] = useState<string | null>(null);
  return {
    lines,
    onLineQuantityChange: (id: string, quantity: number) =>
      setLines((current) => current.map((l) => (l.id === id ? { ...l, quantity } : l))),
    onLineRemove: (id: string) => setLines((current) => current.filter((l) => l.id !== id)),
    tip: {
      options: TIPS,
      value: tip,
      onValueChange: setTip,
      label: 'Tip your courier',
      description: 'It goes to the courier, in full.',
    },
    promo: {
      value: code,
      onChangeText: (next: string) => {
        setCode(next);
        setError(null);
      },
      onApply: () => {
        if (code.trim() === '') return;
        setApplied(code.trim().toUpperCase());
        setCode('');
      },
      applied,
      onRemove: () => setApplied(undefined),
      error,
    },
  };
}

/** The desktop panel: inline, inside a card. */
export const Panel: Story = {
  render: function PanelStory() {
    const basket = useBasket();
    return (
      <Page>
        <Section title="Inline — a desktop sidebar">
          <View style={{ maxWidth: 420 }}>
            <Card variant="plain" radius="radius-16">
              <CardBody>
                <CartPanel
                  vendorName="Fig & Ember"
                  vendorPhoto={photo('fig-ember')}
                  vendorMeta="25–35 min · €1.90 delivery"
                  onPressVendor={() => undefined}
                  {...basket}
                  summary={{
                    lines: SUMMARY,
                    total: { label: 'Total', amount: '€52.00', note: 'Includes taxes' },
                  }}
                  onCheckout={() => undefined}
                  testID="cart"
                />
              </CardBody>
            </Card>
          </View>
        </Section>
      </Page>
    );
  },
};

/** Under the minimum: the warning, the bar, and a checkout that is blocked. */
export const UnderMinimum: Story = {
  render: function UnderMinimumStory() {
    const basket = useBasket();
    return (
      <Page>
        <Section title="Short of the minimum order">
          <View style={{ maxWidth: 420 }}>
            <Card variant="plain" radius="radius-16">
              <CardBody>
                <CartPanel
                  vendorName="Harbour Noodle Room"
                  vendorMeta="30–45 min · Free delivery"
                  {...basket}
                  lines={basket.lines.slice(0, 1)}
                  minimumOrder={{
                    message: '€4.50 more to reach the €14 minimum.',
                    progress: {
                      value: 9.5,
                      max: 14,
                      accessibilityLabel: 'Progress to the minimum order',
                      valueText: '€9.50 of €14',
                    },
                  }}
                  summary={{
                    lines: [{ id: 'subtotal', label: 'Subtotal', amount: '€9.50' }],
                    total: { label: 'Total', amount: '€9.50', state: 'estimated' },
                  }}
                  onCheckout={() => undefined}
                  checkoutDisabled
                  testID="cart-min"
                />
              </CardBody>
            </Card>
          </View>
        </Section>
      </Page>
    );
  },
};

/** Nothing in it yet. */
export const Empty: Story = {
  render: () => (
    <Page>
      <Section title="Empty">
        <View style={{ maxWidth: 420 }}>
          <Card variant="plain" radius="radius-16">
            <CardBody>
              <CartPanel
                vendorName="Fig & Ember"
                vendorPhoto={photo('fig-ember')}
                vendorMeta="25–35 min · €1.90 delivery"
                lines={[]}
                testID="cart-empty"
              />
            </CardBody>
          </Card>
        </View>
      </Section>
    </Page>
  ),
};

/** The same content on a phone: a `BottomSheet` holds it. */
export const InASheet: Story = {
  parameters: { viewport: { defaultViewport: 'mobile1' } },
  render: function InASheetStory() {
    const basket = useBasket();
    return (
      <View style={{ height: 760 }}>
        <BottomSheet open onDismiss={() => undefined}>
          <View style={{ padding: 16, paddingBottom: 32 }}>
            <CartPanel
              vendorName="Fig & Ember"
              vendorPhoto={photo('fig-ember')}
              vendorMeta="25–35 min · €1.90 delivery"
              density="compact"
              {...basket}
              summary={{
                lines: SUMMARY,
                total: { label: 'Total', amount: '€52.00' },
                collapsible: true,
              }}
              onCheckout={() => undefined}
              testID="cart-sheet"
            />
          </View>
        </BottomSheet>
      </View>
    );
  },
};

/**
 * After checkout, the order is `order-status`'s job — this family draws no
 * timeline of its own. The courier is an `Avatar` in a `Card`; the courier's
 * own card belongs to another family.
 */
export const AfterCheckout: Story = {
  render: () => (
    <Page>
      <Section title="The order, drawn by order-status">
        <View style={{ maxWidth: 420, gap: 16 }}>
          <OrderStatusBar
            status="On the way"
            eta="Arrives 20:10"
            detail="Two stops away"
            progress={{ value: 3, max: 4, accessibilityLabel: 'Order progress', valueText: '3 of 4 steps' }}
            testID="order-bar"
          />
          <Card variant="plain" radius="radius-16">
            <CardBody style={{ gap: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Avatar name="Runa Velt" size="lg" />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text variant="body-semibold">Runa Velt</Text>
                  <Text variant="body-2-regular" style={{ opacity: 0.7 }}>
                    Your courier · bicycle
                  </Text>
                </View>
              </View>
              <OrderStatusTimeline
                steps={[
                  { id: 'accepted', label: 'Order accepted', timestamp: '19:31', state: 'done' },
                  { id: 'cooking', label: 'Cooking', timestamp: '19:38', state: 'done' },
                  {
                    id: 'way',
                    label: 'On the way',
                    timestamp: '19:54',
                    note: 'Left Fig & Ember',
                    state: 'current',
                  },
                  { id: 'delivered', label: 'Delivered', state: 'upcoming' },
                ]}
                testID="order-timeline"
              />
            </CardBody>
          </Card>
        </View>
      </Section>
    </Page>
  ),
};
