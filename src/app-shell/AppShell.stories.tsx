import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
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
import { AppShell, AppShellHeader, AppShellMenuButton, NotificationBell, ProOfferCard, useAppShell } from './index';
import { ScrollView, Text as RNText } from 'react-native';
import { Text } from '../typography';
import { Avatar } from '../avatar';
import {
  RiHome5Line,
  RiNotification3Line,
  RiQuillPenLine,
  RiSearchLine,
  RiUserLine,
} from '../icons/remix';

const meta: Meta<typeof AppShell> = {
  title: 'Blocks/App Shell',
  component: AppShell,
  parameters: { layout: 'fullscreen' },
};

/**
 * The shell owns the page, so the harness hands it the whole preview:
 * `parameters: { bleed: true }` (see `.storybook/preview.tsx`). No negative
 * margin, no per-story CSS — the shell fills what it is given, which is the
 * property every variant below has to hold anyway.
 */
const PAGE = { layout: 'fullscreen', bleed: true } as const;

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
  );
}

/** The starter frame: rail in flow at lg+, an overlay drawer below. */
export const Default: Story = {
  parameters: PAGE,
  render: () => <Shell drawer="overlay" />,
};

/** The dashboard template frame: below lg the page slides aside to reveal the rail. */
export const Reveal: Story = {
  parameters: PAGE,
  render: () => <Shell drawer="reveal" />,
};

/** The navigation rail in flow from `sm`; below it the drawer opens the full panel. */
export const Rail: Story = {
  parameters: PAGE,
  render: () => <Shell drawer="overlay" rail />,
};

function DemoSidebar() {
  return {
    items: DEMO_NAV,
    secondaryItems: DEMO_SECONDARY,
    selected: 'home',
    account: DEMO_ACCOUNT,
    team: DEMO_TEAM,
  };
}

function AsidePanel() {
  const theme = useTheme();
  const { neutral } = resolveButtonRamps(theme);
  return (
    <View
      style={{
        flex: 1,
        gap: 12,
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: theme.isDark ? neutral[800] : neutral[200],
        backgroundColor: theme.isDark ? neutral[900] : neutral[100],
      }}
    >
      <Text variant="headline-semibold" style={{ color: theme.colors.text }}>
        Activity
      </Text>
      {Array.from({ length: 24 }, (_, i) => (
        <Text key={i} variant="body-regular" style={{ color: theme.colors.text }}>
          Maya updated ticket #{120 + i}
        </Text>
      ))}
    </View>
  );
}

/**
 * `aside`: a second column on the right from `xl` (1280), pinned like the rail
 * and scrolling its own overflow; below it, stacked under the content.
 */
export const WithAside: Story = {
  name: 'With aside',
  parameters: PAGE,
  render: () => (
    <AppShell testID="shell" sidebar={DemoSidebar()} title="Tickets" breadcrumb={<Trail />} aside={<AsidePanel />}>
      <Placeholder height={280} />
      <Placeholder height={420} />
      <Placeholder height={420} />
    </AppShell>
  ),
};

/** The page's own header: `AppShellMenuButton` keeps the drawer reachable below `lg`. */
function CustomHeader() {
  const theme = useTheme();
  const shell = useAppShell();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 36 }}>
      <AppShellMenuButton testID="menu" />
      <Text variant="body-medium" style={{ color: theme.colors.text }}>
        {shell.drawerAvailable ? 'Narrow: the button opens the drawer' : 'Wide: the rail is in flow, no button'}
      </Text>
    </View>
  );
}

/** No `title`: a custom header with `AppShellMenuButton` (or `useAppShell().openDrawer`). */
export const NoTitle: Story = {
  name: 'No title',
  parameters: PAGE,
  render: () => (
    <AppShell testID="shell" sidebar={DemoSidebar()} header={<CustomHeader />}>
      <Placeholder height={420} />
      <Placeholder height={420} />
    </AppShell>
  ),
};

/**
 * `scroll="fixed"`: one screen, nothing scrolls — the header stays and the page
 * fills the rest, owning its own scrolling (here a message list).
 */
export const Fixed: Story = {
  parameters: PAGE,
  render: function Render() {
    const theme = useTheme();
    const { neutral } = resolveButtonRamps(theme);
    return (
        <AppShell testID="shell" scroll="fixed" sidebar={DemoSidebar()} title="Chat">
          <View
            style={{
              flex: 1,
              minHeight: 0,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: theme.isDark ? neutral[800] : neutral[200],
              overflow: 'hidden',
            }}
          >
            <ScrollView testID="messages" style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 8 }}>
              {Array.from({ length: 60 }, (_, i) => (
                <RNText key={i} style={{ color: theme.colors.text }}>
                  Message {i + 1}
                </RNText>
              ))}
            </ScrollView>
            <View style={{ height: 56, borderTopWidth: 1, borderColor: theme.isDark ? neutral[800] : neutral[200], justifyContent: 'center', paddingLeft: 16 }}>
              <Text variant="body-regular" style={{ color: theme.colors.text }}>Composer stays put</Text>
            </View>
          </View>
        </AppShell>
    );
  },
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

// ---------------------------------------------------------------------------
//  Variants
// ---------------------------------------------------------------------------

/** A demo post. Invented people, invented places. */
function Post({ index }: { index: number }) {
  const theme = useTheme();
  const { neutral } = resolveButtonRamps(theme);
  const people = ['Ines Marqués', 'Tobias Rehn', 'Alma Vetrova', 'Dario Pike', 'Nuria Baixas'];
  const lines = [
    'Walked the long way home past the harbour. The cranes were still moving at ten.',
    'Three weeks of rain and the courtyard finally smells like the garden it used to be.',
    'Found a stall selling nothing but citrus. Bought more than I can carry.',
    'The tram to Vellamar is running again — twelve minutes, end to end.',
    'Repainted the shutters. Second coat tomorrow, if the wind drops.',
  ];
  return (
    <View
      style={{
        gap: 10,
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: theme.isDark ? neutral[800] : neutral[200],
        backgroundColor: theme.isDark ? neutral[900] : neutral[100],
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Avatar name={people[index % people.length]} size="sm" />
        <Text variant="body-2-medium" style={{ color: theme.colors.text }}>
          {people[index % people.length]}
        </Text>
        <Text variant="caption-1-regular" style={{ color: theme.colors.textSecondary }}>
          {index + 1}h
        </Text>
      </View>
      <Text variant="body-regular" style={{ color: theme.colors.text }}>
        {lines[index % lines.length]}
      </Text>
      <View style={{ flexDirection: 'row' }}>
        <Button variant="ghost" size="xs" testID={`reply-${index}`}>
          Reply
        </Button>
      </View>
    </View>
  );
}

function Feed({ count = 12 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <Post key={i} index={i} />
      ))}
    </>
  );
}

/** A side column: whatever the app puts next to the feed. */
function SideColumn({ title }: { title: string }) {
  const theme = useTheme();
  const { neutral } = resolveButtonRamps(theme);
  return (
    <View
      style={{
        gap: 10,
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: theme.isDark ? neutral[800] : neutral[200],
        backgroundColor: theme.isDark ? neutral[900] : neutral[100],
      }}
    >
      <Text variant="headline-semibold" style={{ color: theme.colors.text }}>
        {title}
      </Text>
      {['Vellamar', 'Old Harbour', 'Citrus market', 'Tram line 4', 'Courtyard gardens'].map((t) => (
        <Text key={t} variant="body-regular" style={{ color: theme.colors.textSecondary }}>
          {t}
        </Text>
      ))}
      <View style={{ flexDirection: 'row' }}>
        <Button variant="ghost" size="xs" testID="side-more">
          See all
        </Button>
      </View>
    </View>
  );
}

/**
 * `variant="feed"`: nav on the left, the routed content centred in a 600px
 * reading column, the side column beside it from `xl` — and the pair centred in
 * what the nav leaves.
 */
export const FeedVariant: Story = {
  name: 'Feed',
  parameters: PAGE,
  render: () => (
    <AppShell
      testID="shell"
      variant="feed"
      sidebar={DemoSidebar()}
      title="Home"
      aside={<SideColumn title="Around you" />}
    >
      <Feed />
    </AppShell>
  ),
};

/**
 * The same shape with `panel`: the reading column is a `ContentPanel`, so the
 * page background reads as a gutter around a framed surface.
 *
 * The DOCUMENT scrolls here — address bar, anchor links, scroll restoration —
 * and the panel still occupies the window from top to bottom: its frame is a
 * screen-tall sticky rectangle pinned at the shell's own gutter, so the edge
 * holds the screen while the content moves inside it. Measured at 1280 × 900:
 * `top: 16, height: 868` at scrollY 0, 1, 200, 600 and 846.
 */
export const FeedPanel: Story = {
  name: 'Feed in a panel',
  parameters: PAGE,
  render: () => (
    <AppShell
      testID="shell"
      variant="feed"
      panel
      sidebar={DemoSidebar()}
      title="Home"
      aside={<SideColumn title="Around you" />}
    >
      <Feed />
    </AppShell>
  ),
};

/**
 * The same feed with `scroll="fixed"`: the shell is bounded to one screen, so
 * the panel IS that box — no viewport maths, nothing to line up — the header is
 * pinned inside it and only the routed content scrolls. The document never
 * moves at all.
 *
 * Both this and `Feed in a panel` above fill the window; what differs is what
 * scrolls. A feed that wants the phone address bar to collapse and real anchor
 * links takes the document; a workspace whose regions each keep their own
 * position takes this one.
 */
export const FeedPanelFixed: Story = {
  name: 'Feed in a full-height panel',
  parameters: PAGE,
  render: () => (
    <AppShell
      testID="shell"
      variant="feed"
      panel
      scroll="fixed"
      sidebar={DemoSidebar()}
      title="Home"
      aside={<SideColumn title="Around you" />}
    >
      <Feed count={16} />
    </AppShell>
  ),
};

/**
 * The phone case, first class: a `topBar`, a `bottomBar` with the safe-area
 * inset and a `floatingAction` above it. Nothing here is positioned by the
 * story — the shell places all three and the content reserves their measured
 * height.
 */
export const PhoneChrome: Story = {
  name: 'Phone chrome',
  parameters: PAGE,
  render: function Render() {
    const theme = useTheme();
    const { neutral } = resolveButtonRamps(theme);
    const line = theme.isDark ? neutral[800] : neutral[200];
    return (
      <AppShell
        testID="shell"
        variant="feed"
        sidebar={DemoSidebar()}
        aside={<SideColumn title="Around you" />}
        topBar={
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              height: 56,
              paddingLeft: 12,
              paddingRight: 12,
              borderBottomWidth: 1,
              borderColor: line,
              backgroundColor: theme.colors.card,
            }}
          >
            <AppShellMenuButton testID="menu" />
            <Text variant="headline-semibold" style={{ color: theme.colors.text }}>
              Home
            </Text>
          </View>
        }
        bottomBar={
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-around',
              alignItems: 'center',
              height: 56,
              borderTopWidth: 1,
              borderColor: line,
              backgroundColor: theme.colors.card,
            }}
            testID="tabs"
          >
            {[RiHome5Line, RiSearchLine, RiNotification3Line, RiUserLine].map((Icon, i) => (
              <Button
                key={i}
                variant="ghost"
                size="medium"
                iconOnly
                leadingIcon={Icon}
                accessibilityLabel={['Home', 'Search', 'Notifications', 'You'][i]}
              />
            ))}
          </View>
        }
        floatingAction={
          <Button variant="primary" size="large" iconOnly leadingIcon={RiQuillPenLine} accessibilityLabel="Compose" testID="compose" />
        }
      >
        <Feed count={8} />
      </AppShell>
    );
  },
};

/**
 * `variant="split"`: a list pane, a detail pane and an info pane, each with its
 * own scroll, divided by a draggable separator. Below `splitFrom` exactly one
 * pane renders — the one `pane` names.
 */
export const Split: Story = {
  parameters: PAGE,
  render: function Render() {
    const theme = useTheme();
    const [selected, setSelected] = useState(0);
    return (
      <AppShell
        testID="shell"
        variant="split"
        sidebar={{ ...DemoSidebar(), variant: 'rail' as const, items: DEMO_RAIL_NAV, secondaryItems: DEMO_RAIL_SECONDARY }}
        title="Inbox"
        pane="list"
        list={
          <View style={{ padding: 12, gap: 6 }}>
            {Array.from({ length: 24 }, (_, i) => (
              <Pressable
                key={i}
                onPress={() => setSelected(i)}
                style={{
                  padding: 12,
                  borderRadius: 12,
                  backgroundColor: selected === i ? theme.colors.primaryLight : 'transparent',
                }}
                testID={`row-${i}`}
              >
                <Text variant="body-2-medium" style={{ color: theme.colors.text }}>
                  Thread {i + 1}
                </Text>
                <Text variant="caption-1-regular" numberOfLines={1} style={{ color: theme.colors.textSecondary }}>
                  The tram to Vellamar is running again — twelve minutes, end to end.
                </Text>
              </Pressable>
            ))}
          </View>
        }
        info={
          <View style={{ padding: 16, gap: 8 }}>
            <Text variant="headline-semibold" style={{ color: theme.colors.text }}>
              Details
            </Text>
            {['Opened 4 times', 'Two attachments', 'Shared with 3 people'].map((t) => (
              <Text key={t} variant="body-regular" style={{ color: theme.colors.textSecondary }}>
                {t}
              </Text>
            ))}
          </View>
        }
      >
        <View style={{ padding: 20, gap: 12 }}>
          <Text variant="title-2-medium" style={{ color: theme.colors.text }}>
            Thread {selected + 1}
          </Text>
          {Array.from({ length: 18 }, (_, i) => (
            <Text key={i} variant="body-regular" style={{ color: theme.colors.text }}>
              Paragraph {i + 1}. Walked the long way home past the harbour; the cranes were still moving at ten.
            </Text>
          ))}
        </View>
      </AppShell>
    );
  },
};

/**
 * `variant="focus"`: one centred column and no navigation — sign-in,
 * onboarding, a reader. The header and the bar slots still work.
 */
export const Focus: Story = {
  parameters: PAGE,
  render: function Render() {
    const theme = useTheme();
    return (
      <AppShell
        testID="shell"
        variant="focus"
        contentWidth={480}
        title="Create your account"
        bottomBar={
          // The shell pins the bar; what goes in it is the page's business —
          // here the CTA is held to the same 480 column the content uses.
          <View style={{ padding: 16, alignItems: 'center', backgroundColor: theme.colors.card }}>
            <View style={{ width: '100%', maxWidth: 480 }}>
              <Button variant="primary" size="large">
                Continue
              </Button>
            </View>
          </View>
        }
        bottomBarVisibility="always"
      >
        <Placeholder height={120} />
        <Placeholder height={120} />
        <Placeholder height={240} />
      </AppShell>
    );
  },
};

/**
 * The same engine, three apps. The shell's LAYOUT (`variant`) and the nav's
 * IDENTITY (`sidebar.surface`, `sidebar.size`) are separate axes, and it is
 * the pair that makes an app look like itself:
 *
 * - a social reader — `feed` with a `plain`, `large` nav: destinations at
 *   arm's length, no panel edge, the page background running behind them
 * - a workspace — `dashboard` with a `docked`, `small` nav: a column flush to
 *   the window, one hairline, rows tuned for a long list
 * - the product dashboard — `dashboard` with the floating `card`, unchanged
 *
 * Read them side by side at the same width: nothing here is a one-off style,
 * and no app has to re-implement the shell to stop looking like the last one.
 */
export const Identities: Story = {
  name: 'Three identities',
  parameters: PAGE,
  render: () => (
    <View style={{ flexDirection: 'row', height: 720 }}>
      <View style={{ flex: 1, minWidth: 0 }}>
        <AppShell
          testID="shell-social"
          variant="feed"
          scroll="container"
          sidebar={{ ...DemoSidebar(), surface: 'plain', size: 'large', showSearch: false, showThemeToggle: false }}
          navFrom={0}
          title="Home"
        >
          <Feed count={4} />
        </AppShell>
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <AppShell
          testID="shell-workspace"
          scroll="container"
          sidebar={{ ...DemoSidebar(), surface: 'docked', size: 'small', showSearch: false }}
          navFrom={0}
          title="Reports"
        >
          <Placeholder height={240} />
          <Placeholder height={240} />
        </AppShell>
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <AppShell
          testID="shell-product"
          scroll="container"
          sidebar={{ ...DemoSidebar(), showSearch: false }}
          navFrom={0}
          title="Overview"
        >
          <Placeholder height={240} />
          <Placeholder height={240} />
        </AppShell>
      </View>
    </View>
  ),
};

/** A stand-in for whatever owns a canvas: a map, a board, an editor surface. */
function CanvasSurface() {
  const theme = useTheme();
  const { neutral } = resolveButtonRamps(theme);
  return (
    <View style={{ flex: 1, backgroundColor: theme.isDark ? neutral[900] : neutral[200] }}>
      {/* The grid is the stand-in's own drawing, not shell chrome. */}
      <View style={{ flex: 1, flexDirection: 'row', flexWrap: 'wrap', opacity: 0.5 }}>
        {Array.from({ length: 240 }, (_, i) => (
          <View
            key={i}
            style={{
              width: 120,
              height: 120,
              borderRightWidth: 1,
              borderBottomWidth: 1,
              borderColor: theme.isDark ? neutral[800] : neutral[300],
            }}
          />
        ))}
      </View>
    </View>
  );
}

/**
 * `variant="canvas"`: the content is the SCREEN — edge to edge, no reading
 * column, no max width, no padding, exactly one viewport tall. The nav keeps
 * its own gutter (it is still a card), the aside keeps its inset, and the
 * `floatingAction` floats over the canvas. A map, a board, an editor.
 *
 * Nothing in this story positions anything: the shell places the regions and
 * the canvas takes what is left.
 */
export const Canvas: Story = {
  parameters: PAGE,
  render: () => (
    <AppShell
      testID="shell"
      variant="canvas"
      sidebar={{ ...DemoSidebar(), surface: 'docked', showSearch: false }}
      aside={<SideColumn title="In view" />}
      asideFrom="md"
      floatingAction={
        <Button variant="primary" size="large" leadingIcon={RiAddFill} onPress={() => {}}>
          Add a pin
        </Button>
      }
    >
      <CanvasSurface />
    </AppShell>
  ),
};
