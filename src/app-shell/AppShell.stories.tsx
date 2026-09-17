import React, { useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Breadcrumb, BreadcrumbItem } from '../breadcrumb';
import { Button } from '../button';
import { resolveButtonRamps } from '../button/shared';
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
  title: 'Blocks/App Shell',
  component: AppShell,
  parameters: { layout: 'fullscreen' },
};

/**
 * The shell owns the page: it spans the preview edge to edge (over the
 * decorator's 24px padding) and scrolls the document.
 */
const PAGE_FRAME = { alignSelf: 'stretch', marginTop: -24, marginBottom: -24, marginLeft: -24, marginRight: -24 } as const;

export default meta;

type Story = StoryObj<typeof AppShell>;

function Placeholder({ height }: { height: number }) {
  const theme = useTheme();
  const { neutral } = resolveButtonRamps(theme);
  return (
    <View
      style={{
        height,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: theme.isDark ? neutral[800] : neutral[200],
        backgroundColor: theme.isDark ? neutral[900] : neutral[100],
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
  return (
    <>
      <NotificationBell notifications={DEMO_NOTIFICATIONS} testID="bell" />
      <Button variant="secondary" size="medium" leadingIcon={RiFilter3Fill}>
        Filters
      </Button>
      <Button variant="primary" size="medium" leadingIcon={RiAddFill}>
        Create ticket
      </Button>
    </>
  );
}

function Shell({ drawer, rail = false }: { drawer: 'overlay' | 'reveal'; rail?: boolean }) {
  const [selected, setSelected] = useState('home');
  const [offer, setOffer] = useState(true);
  return (
    <View style={PAGE_FRAME}>
      <AppShell
        testID="shell"
        drawer={drawer}
        sidebar={{
          variant: rail ? 'rail' : 'panel',
          items: rail ? DEMO_RAIL_NAV : DEMO_NAV,
          secondaryItems: rail ? DEMO_RAIL_SECONDARY : DEMO_SECONDARY,
          selected,
          onNavigate: (item) => setSelected(item.key),
          account: DEMO_ACCOUNT,
          team: DEMO_TEAM,
        }}
        title="Welcome Maya"
        breadcrumb={<Trail />}
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
  render: () => <Shell drawer="overlay" />,
};

/** The dashboard template frame: below lg the page slides aside to reveal the rail. */
export const Reveal: Story = {
  render: () => <Shell drawer="reveal" />,
};

/** The navigation rail in flow from `sm`; below it the drawer opens the full panel. */
export const Rail: Story = {
  render: () => <Shell drawer="overlay" rail />,
};

export const Header: Story = {
  render: () => (
    <View style={{ width: 900 }}>
      <AppShellHeader testID="header" title="Welcome Maya" breadcrumb={<Trail />} actions={<Actions />} />
    </View>
  ),
};

export const Bell: Story = {
  render: () => (
    <View style={{ width: 900, height: 760, alignItems: 'flex-end' }}>
      <NotificationBell notifications={DEMO_NOTIFICATIONS} testID="bell" />
    </View>
  ),
};

export const ProOffer: Story = {
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
