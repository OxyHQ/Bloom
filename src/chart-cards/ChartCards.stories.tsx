import React, { useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Button } from '../button';
import { OrdersChartCard, RevenueChartCard } from './index';
import type { ChartCardPoint } from './types';

const meta: Meta<typeof RevenueChartCard> = {
  argTypes: {
    "title": { control: 'text' },
    "currentLabel": { control: 'text' },
    "previousLabel": { control: 'text' },
    "totalComparisonLabel": { control: 'text' },
    "pointComparisonLabel": { control: 'text' },
    "color": { control: 'text' },
    "activeColor": { control: 'text' },
    "previousColor": { control: 'text' },
    "activeIndex": { control: 'number' }
  },
  title: 'Charts/Revenue & Orders',
  component: RevenueChartCard,
};

export default meta;

type Story = StoryObj<typeof RevenueChartCard>;

/** Demo year — twelve months that add up to the stat cards' total revenue. */
const REVENUE: ChartCardPoint[] = [
  { label: 'Jan', current: 9840, previous: 8210 },
  { label: 'Feb', current: 10120, previous: 8460 },
  { label: 'Mar', current: 11380, previous: 9950 },
  { label: 'Apr', current: 10960, previous: 10240 },
  { label: 'May', current: 12210, previous: 10880 },
  { label: 'Jun', current: 12740, previous: 11020 },
  { label: 'Jul', current: 13980, previous: 11760 },
  { label: 'Aug', current: 13120, previous: 12030 },
  { label: 'Sep', current: 14210, previous: 12190 },
  { label: 'Oct', current: 14690, previous: 12480 },
  { label: 'Nov', current: 14360, previous: 12160 },
  { label: 'Dec', current: 14703.92, previous: 11924 },
];

/** Demo year — twelve months that add up to the stat cards' total orders. */
const ORDERS: ChartCardPoint[] = [
  { label: 'Jan', current: 1680, previous: 1510 },
  { label: 'Feb', current: 1740, previous: 1480 },
  { label: 'Mar', current: 1920, previous: 1650 },
  { label: 'Apr', current: 1850, previous: 1620 },
  { label: 'May', current: 2040, previous: 1710 },
  { label: 'Jun', current: 2110, previous: 1760 },
  { label: 'Jul', current: 2290, previous: 1840 },
  { label: 'Aug', current: 2180, previous: 1890 },
  { label: 'Sep', current: 2320, previous: 1930 },
  { label: 'Oct', current: 2410, previous: 1970 },
  { label: 'Nov', current: 2280, previous: 1810 },
  { label: 'Dec', current: 2342, previous: 1798 },
];

/** A year that fell short of the last one — the rose delta chip. */
const DECLINE: ChartCardPoint[] = REVENUE.map((p) => ({ label: p.label, current: p.previous, previous: p.current }));

/** Flat against last year — the neutral `0%` chip. */
const FLAT: ChartCardPoint[] = ORDERS.map((p) => ({ label: p.label, current: p.current, previous: p.current }));

const Frame = ({ children, width = 560 }: { children: React.ReactNode; width?: number }) => (
  <View style={{ maxWidth: '100%', gap: 24, width }}>{children}</View>
);

export const Revenue: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Frame>
      <RevenueChartCard testID="revenue" data={REVENUE} />
    </Frame>
  ),
};

export const Orders: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Frame>
      <OrdersChartCard testID="orders" data={ORDERS} />
    </Frame>
  ),
};

/** Both cards in a dashboard row layout: a row of `flex-1` cards. */
export const DashboardRow: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <View style={{ maxWidth: '100%', flexDirection: 'row', flexWrap: 'wrap', gap: 16, width: 1160 }}>
      <RevenueChartCard data={REVENUE} style={{ flex: 1 }} />
      <OrdersChartCard data={ORDERS} style={{ flex: 1 }} />
    </View>
  ),
};

/** July hovered: the headline swaps to the month, the cursor and active dot / band show. */
export const Hovered: Story = {
  args: { activeIndex: 6 },
  parameters: { controls: { include: ["activeIndex","title","currentLabel","previousLabel","totalComparisonLabel","pointComparisonLabel","color","activeColor","previousColor"] } },
  render: (args) => (
    <Frame>
      <RevenueChartCard {...args} testID="revenue" data={REVENUE}  />
      <OrdersChartCard testID="orders" data={ORDERS} activeIndex={6} />
    </Frame>
  ),
};

/** The three delta chips: rising (lime), falling (rose), flat (neutral). */
export const Deltas: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Frame>
      <RevenueChartCard data={REVENUE} />
      <RevenueChartCard data={DECLINE} title="Revenue (declining)" />
      <OrdersChartCard data={FLAT} title="Orders (flat)" />
    </Frame>
  ),
};

/** Below the `sm` breakpoint the legend drops under the headline; month labels thin out. */
export const Narrow: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Frame width={320}>
      <RevenueChartCard data={REVENUE} />
      <OrdersChartCard data={ORDERS} />
    </Frame>
  ),
};

/** Every label and formatter is a prop. */
export const CustomLabels: Story = {
  args: { title: "Ingresos", currentLabel: "Este año", previousLabel: "Año pasado", totalComparisonLabel: "el año pasado", pointComparisonLabel: "un año antes" },
  parameters: { controls: { include: ["title","currentLabel","previousLabel","totalComparisonLabel","pointComparisonLabel","color","activeColor","previousColor","activeIndex"] } },
  render: (args) => (
    <Frame>
      <RevenueChartCard {...args}
        data={REVENUE}





        getPointTitle={(point) => point.label.toUpperCase()}
        formatValue={(v) => `${Math.round(v).toLocaleString('es-ES')} €`}
        formatAxisValue={(v) => `${Math.round(v / 1000)}k €`}
      />
    </Frame>
  ),
};

/** Swapping the data morphs every point / bar to its new value over 450ms. */
export const LiveData: Story = {
  parameters: { controls: { disable: true } },
  render: function LiveData() {
    const [alt, setAlt] = useState(false);
    return (
      <Frame>
        <View style={{ flexDirection: 'row' }}>
          <Button size="sm" onPress={() => setAlt((v) => !v)} appearance="outline" tone="neutral">
            {alt ? 'Show this year' : 'Show a weaker year'}
          </Button>
        </View>
        <RevenueChartCard data={alt ? DECLINE : REVENUE} />
        <OrdersChartCard data={alt ? FLAT : ORDERS} />
      </Frame>
    );
  },
};
