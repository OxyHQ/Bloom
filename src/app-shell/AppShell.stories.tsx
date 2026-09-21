import React, { useState } from 'react';
import { View, useWindowDimensions } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Breadcrumb, BreadcrumbItem } from '../breadcrumb';
import { Button } from '../button';
import { RiAddFill, RiFilter3Fill, RiHomeLine } from '../icons/remix';
import { DEMO_NOTIFICATIONS } from '../notification-center/NotificationCenter.stories';
import {
  DEMO_ACCOUNT,
  DEMO_NAV,
  DEMO_RAIL_NAV,
  DEMO_RAIL_SECONDARY,
  DEMO_SECONDARY,
  DEMO_TEAM,
} from '../sidebar/Sidebar.stories';
import { useTheme } from '../theme/use-theme';
import { AppShell, AppShellHeader, NotificationBell, ProOfferCard } from './index';

const meta: Meta<typeof AppShell> = {
  argTypes: {
    "active": { control: 'boolean' },
    "value": { control: 'text' },
    "navigationPlacement": { control: 'select', options: ["auto","bottom","rail","sidebar"] },
    "navigationMaterial": { control: 'select', options: ["solid","translucent"] },
    "bottomActionBehavior": { control: 'select', options: ["visible","hide"] },
    "scroll": { control: 'select', options: ["document","container","fixed","auto","external"] },
    "title": { control: 'text' },
    "navigationAlign": { control: 'select', options: ["edge", "content"] },
    "contentMaxWidth": { control: 'number' }
  },
  title: 'Blocks/App Shell',
  parameters: { layout: 'fullscreen' },
  component: AppShell,
};

export default meta;

type Story = StoryObj<typeof AppShell>;

function Placeholder({ height }: { height: number }) {
  const theme = useTheme();
  return (
    <View
      style={{
        height,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.backgroundSecondary,
      }}
    />
  );
}

/** The dashboard header trail: team, member, page. */
function Trail() {
  return (
    <Breadcrumb>
      <BreadcrumbItem href="#team">Design team</BreadcrumbItem>
      <BreadcrumbItem href="#member">Maya</BreadcrumbItem>
      <BreadcrumbItem current icon={RiHomeLine}>
        Home
      </BreadcrumbItem>
    </Breadcrumb>
  );
}

function Actions() {
  const compact = useWindowDimensions().width < 600;
  return (
    <>
      <NotificationBell notifications={DEMO_NOTIFICATIONS} testID="bell" />
      <Button size="md" icon={compact ? RiFilter3Fill : undefined} leadingIcon={compact ? undefined : RiFilter3Fill} accessibilityLabel="Filters" appearance="outline" tone="neutral">
        {compact ? undefined : 'Filters'}
      </Button>
      <Button size="md" icon={compact ? RiAddFill : undefined} leadingIcon={compact ? undefined : RiAddFill} accessibilityLabel="Create ticket" appearance="solid" tone="accent">
        {compact ? undefined : 'Create ticket'}
      </Button>
    </>
  );
}

function Shell({ rail = false, args }: { rail?: boolean; args?: React.ComponentProps<typeof AppShell> }) {
  const [selected, setSelected] = useState('home');
  const compact = useWindowDimensions().width < 600;
  const [collapsed, setCollapsed] = useState(true);
  const [offer, setOffer] = useState(true);
  return (
    <View style={{ width: '100%', height: 860 }}>
      <AppShell {...args}
        testID="shell"
        navigationPlacement={rail ? 'rail' : args?.navigationPlacement ?? 'auto'}
        sidebar={{
          variant: rail ? 'rail' : 'panel',
          collapsed: compact ? collapsed : undefined,
          onCollapsedChange: setCollapsed,
          items: rail ? DEMO_RAIL_NAV : DEMO_NAV,
          secondaryItems: rail ? DEMO_RAIL_SECONDARY : DEMO_SECONDARY,
          selected,
          onNavigate: (item) => setSelected(item.key),
          account: DEMO_ACCOUNT,
          team: DEMO_TEAM,
        }}
        title={args?.title ?? "Welcome Maya"}
        breadcrumb={compact ? undefined : <Trail />}
        actions={<Actions />}
        overlay={
          offer ? (
            <ProOfferCard
              title="Get lifetime access to Pro"
              description="8 full-page templates and 23 Pro components, 17 of them chart cards. One payment, updates for life, installed into this project as source."
              ctaLabel="Get Pro"
              onDismiss={() => setOffer(false)}
              testID="offer"
            />
          ) : null
        }
      >
        <View style={{ flexDirection: 'row', gap: 16 }}>
          <View style={{ flex: 1 }}>
            <Placeholder height={280} />
          </View>
          <View style={{ flex: 1 }}>
            <Placeholder height={280} />
          </View>
        </View>
        <Placeholder height={337} />
        <Placeholder height={420} />
      </AppShell>
    </View>
  );
}

/** The starter frame: rail in flow at lg+, an overlay drawer below. */
export const Default: Story = {
  args: { title: 'Welcome Maya' },
  parameters: { controls: { include: ['title', 'navigationPlacement'] } },
  render: (args) => <Shell args={args} />,
};

/** Full panel navigation at all widths, using the current placement API. */
export const Panel: Story = {
  args: { title: 'Welcome Maya', navigationPlacement: 'sidebar' },
  parameters: { controls: { include: ['title', 'navigationPlacement'] } },
  render: (args) => <Shell args={args} />,
};

/** The navigation rail in flow from `sm`; below it the drawer opens the full panel. */
export const Rail: Story = {
  parameters: { controls: { disable: true } },
  render: () => <Shell rail />,
};

export const Header: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <View style={{ maxWidth: '100%', width: 900 }}>
      <AppShellHeader testID="header" title="Welcome Maya" breadcrumb={<Trail />} actions={<Actions />} />
    </View>
  ),
};

export const Bell: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <View style={{ maxWidth: '100%', width: 900, height: 760, alignItems: 'flex-end' }}>
      <NotificationBell notifications={DEMO_NOTIFICATIONS} testID="bell" />
    </View>
  ),
};

export const ProOffer: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <ProOfferCard
      placement="inline"
      enterDelay={0}
      title="Get lifetime access to Pro"
      description="8 full-page templates and 23 Pro components, 17 of them chart cards. One payment, updates for life, installed into this project as source."
      ctaLabel="Get Pro"
      onDismiss={() => {}}
      testID="offer"
    />
  ),
};
