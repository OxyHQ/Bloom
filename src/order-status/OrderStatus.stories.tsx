import React from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Button, GlyphButton } from '../button';
import { Card, CardBody } from '../card';
import { RiCarLine, RiCloseCircleLine, RiPhoneLine, RiShoppingBag3Line } from '../icons';
import { Text } from '../typography';
import { OrderStatusBar } from './OrderStatusBar';
import { OrderStatusTimeline } from './OrderStatusTimeline';
import type { OrderStatusStep } from './types';

const meta: Meta = {
  title: 'Blocks/Commerce/OrderStatus',
  parameters: { layout: 'fullscreen' },
};

export default meta;

type Story = StoryObj;

const noop = () => undefined;

// ---------------------------------------------------------------------------
//  Demo data — three invented pipelines. Nothing here is about parcels or food
//  in the API: they are the same four props with different words.
// ---------------------------------------------------------------------------

const PARCEL: OrderStatusStep[] = [
  { id: 'a', label: 'Picked up', timestamp: 'Mon 09:12', state: 'done' },
  { id: 'b', label: 'In transit', timestamp: 'Mon 14:40', state: 'done', note: 'Left the sorting hub' },
  { id: 'c', label: 'Out for delivery', timestamp: 'Today 08:05', state: 'current' },
  { id: 'd', label: 'Delivered', state: 'upcoming' },
];

const KITCHEN: OrderStatusStep[] = [
  { id: 'a', label: 'Accepted', timestamp: '19:02', state: 'done' },
  { id: 'b', label: 'Cooking', timestamp: '19:06', state: 'current' },
  { id: 'c', label: 'On the way', state: 'upcoming' },
  { id: 'd', label: 'Delivered', state: 'upcoming' },
];

const STALLED: OrderStatusStep[] = [
  { id: 'a', label: 'Requested', timestamp: 'Tue 11:20', state: 'done' },
  { id: 'b', label: 'Carrier assigned', timestamp: 'Tue 11:44', state: 'done' },
  { id: 'c', label: 'Collection attempted', timestamp: 'Wed 09:30', state: 'failed', note: 'Nobody at the address. We will try again tomorrow morning.' },
  { id: 'd', label: 'Delivered', state: 'upcoming' },
];

const BOOKING: OrderStatusStep[] = [
  { id: 'a', label: 'Requested', timestamp: '12 Mar', state: 'done' },
  { id: 'b', label: 'Confirmed', timestamp: '12 Mar', state: 'done' },
  { id: 'c', label: 'Under way', state: 'current' },
  { id: 'd', label: 'Finished', state: 'upcoming' },
];

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

function Page({ children }: { children: React.ReactNode }) {
  return <View style={{ width: '100%', padding: 16, gap: 32, maxWidth: 760 }}>{children}</View>;
}

export const Timeline: Story = {
  render: () => (
    <Page>
      <Section title="Vertical — a parcel">
        <OrderStatusTimeline steps={PARCEL} accessibilityLabel="Delivery status" testID="parcel" />
      </Section>
      <Section title="Vertical — a kitchen order">
        <OrderStatusTimeline steps={KITCHEN} accessibilityLabel="Order status" />
      </Section>
      <Section title="Vertical — a booking, compact">
        <OrderStatusTimeline steps={BOOKING} density="compact" accessibilityLabel="Booking status" />
      </Section>
    </Page>
  ),
};

export const Horizontal: Story = {
  render: () => (
    <Page>
      <Section title="Horizontal — the wide header rail">
        <OrderStatusTimeline steps={PARCEL} orientation="horizontal" accessibilityLabel="Delivery status" />
      </Section>
      <Section title="Horizontal, compact">
        <OrderStatusTimeline steps={KITCHEN} orientation="horizontal" density="compact" accessibilityLabel="Order status" />
      </Section>
      <Section title="Horizontal, long labels">
        <OrderStatusTimeline
          orientation="horizontal"
          accessibilityLabel="Request status"
          steps={[
            { label: 'Request received and queued', timestamp: 'Mon', state: 'done' },
            { label: 'Carrier looking for a slot', timestamp: 'Tue', state: 'current' },
            { label: 'Collection window agreed', state: 'upcoming' },
            { label: 'Handed over to the recipient', state: 'upcoming' },
          ]}
        />
      </Section>
    </Page>
  ),
};

export const Failed: Story = {
  render: () => (
    <Page>
      <Section title="A pipeline that stopped">
        <OrderStatusTimeline steps={STALLED} accessibilityLabel="Collection status" />
      </Section>
      <Section title="The same, on the rail">
        <OrderStatusTimeline steps={STALLED} orientation="horizontal" accessibilityLabel="Collection status" />
      </Section>
    </Page>
  ),
};

export const WithGlyphs: Story = {
  render: () => (
    <Page>
      <Section title="A step can carry its own glyph">
        <OrderStatusTimeline
          accessibilityLabel="Order status"
          steps={[
            { label: 'Order placed', timestamp: '18:55', state: 'done', icon: RiShoppingBag3Line },
            { label: 'Courier on the way', timestamp: '19:20', state: 'current', icon: RiCarLine, tone: 'info' },
            { label: 'Cancelled by the shop', state: 'failed', icon: RiCloseCircleLine },
          ]}
        />
      </Section>
    </Page>
  ),
};

export const Bar: Story = {
  render: () => (
    <Page>
      <Section title="The live strip">
        <OrderStatusBar
          status="Out for delivery"
          eta="Arrives 14:35"
          detail="Four stops away"
          icon={RiCarLine}
          progress={{ value: 3, max: 4, accessibilityLabel: 'Delivery progress', valueText: '3 of 4 stops' }}
          action={<GlyphButton icon={RiPhoneLine} accessibilityLabel="Call the courier" onPress={noop} />}
          testID="bar"
        />
      </Section>
      <Section title="No progress, no ETA">
        <OrderStatusBar status="Waiting for the kitchen to accept" icon={RiShoppingBag3Line} tone="warning" />
      </Section>
      <Section title="Stalled">
        <OrderStatusBar
          status="Collection failed"
          detail="Nobody at the address. We will try again tomorrow."
          icon={RiCloseCircleLine}
          tone="error"
          action={<Button variant="secondary" size="small" onPress={noop}>Reschedule</Button>}
        />
      </Section>
      <Section title="Plain, inside a card that already paints">
        <Card>
          <CardBody>
            <OrderStatusBar
              variant="plain"
              status="On the way"
              eta="12 min"
              icon={RiCarLine}
              progress={{ value: 0.6, accessibilityLabel: 'Trip progress' }}
            />
          </CardBody>
        </Card>
      </Section>
      <Section title="Long status, narrow column">
        <View style={{ maxWidth: 320 }}>
          <OrderStatusBar
            status="Out for delivery with a different courier"
            eta="Arrives between 15:00 and 17:00"
            icon={RiCarLine}
            progress={{ value: 0.4, accessibilityLabel: 'Delivery progress' }}
          />
        </View>
      </Section>
    </Page>
  ),
};

export const Empty: Story = {
  render: () => (
    <Page>
      <Section title="No steps yet">
        <OrderStatusTimeline steps={[]} accessibilityLabel="Status" />
      </Section>
      <Section title="One step">
        <OrderStatusTimeline steps={[{ label: 'Requested', timestamp: 'Just now', state: 'current' }]} accessibilityLabel="Status" />
      </Section>
    </Page>
  ),
};
