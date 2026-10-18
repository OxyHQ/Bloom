import React, { useState } from 'react';
import { ScrollView, View, useWindowDimensions } from 'react-native';
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
import { PageHeader } from '../page-header';
import { Screen, ScreenScrollView } from '../screen';
import { Text } from '../typography';
import { AiChatUserMessage } from '../ai-chat';
import {
  AppShell,
  AppShellHeader,
  AppShellPanel,
  AppShellPanels,
  useAppShellPanel,
  usePanelNavigation,
  NotificationBell,
  ProOfferCard,
} from './index';

const meta: Meta<typeof AppShell> = {
  argTypes: {
    active: { control: 'boolean' },
    value: { control: 'text' },
    navigationPlacement: { control: 'select', options: ['auto', 'bottom', 'rail', 'sidebar'] },
    bottomActionBehavior: { control: 'select', options: ['visible', 'hide'] },
    scroll: { control: 'select', options: ['document', 'container', 'fixed', 'auto', 'external'] },
    title: { control: 'text' },
    navigationAlign: { control: 'select', options: ['edge', 'content'] },
    contentMaxWidth: { control: 'number' },
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
      <Button
        size="md"
        icon={compact ? RiFilter3Fill : undefined}
        leadingIcon={compact ? undefined : RiFilter3Fill}
        accessibilityLabel="Filters"
        appearance="outline"
        tone="neutral"
      >
        {compact ? undefined : 'Filters'}
      </Button>
      <Button
        size="md"
        icon={compact ? RiAddFill : undefined}
        leadingIcon={compact ? undefined : RiAddFill}
        accessibilityLabel="Create ticket"
        appearance="solid"
        tone="accent"
      >
        {compact ? undefined : 'Create ticket'}
      </Button>
    </>
  );
}

function Shell({
  rail = false,
  args,
}: {
  rail?: boolean;
  args?: React.ComponentProps<typeof AppShell>;
}) {
  const [selected, setSelected] = useState('home');
  const compact = useWindowDimensions().width < 600;
  const [collapsed, setCollapsed] = useState(true);
  const [offer, setOffer] = useState(true);
  return (
    <View style={{ width: '100%', height: 860 }}>
      <AppShell
        {...args}
        testID="shell"
        navigationPlacement={rail ? 'rail' : (args?.navigationPlacement ?? 'auto')}
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
        title={args?.title ?? 'Welcome Maya'}
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
      <AppShellHeader
        testID="header"
        title="Welcome Maya"
        breadcrumb={<Trail />}
        actions={<Actions />}
      />
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

/** A map stand-in: fills its panel. */
function MapFill({ label }: { label: string }) {
  const theme = useTheme();
  return (
    <View
      style={{
        flex: 1,
        minHeight: 0,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.backgroundSecondary,
      }}
    >
      <Text>{label}</Text>
    </View>
  );
}

/** The Map / List switch a panel shows while it is drawn alone. */
function PanelToggle({ label, onPress }: { label: string; onPress: () => void }) {
  const { alone } = useAppShellPanel();
  if (!alone) return null;
  return (
    <View style={{ position: 'absolute', bottom: 24, left: 0, right: 0, alignItems: 'center' }}>
      <Button testID={`panels-toggle-${label.toLowerCase()}`} onPress={onPress}>
        {label}
      </Button>
    </View>
  );
}

/**
 * Two separate panels in a panel shell — results and a map — with the shell's
 * gutter around and between them, a divider that drags the results' width, and
 * ONE panel at a time once the group's own box is narrower than 900, switched
 * by the toggle each panel shows while it is alone. The page never scrolls.
 */
export const Panels: Story = {
  parameters: { controls: { disable: true }, layout: 'fullscreen', bloomScroll: 'document' },
  render: function Panels() {
    const [showMap, setShowMap] = useState(false);
    return (
      <AppShell
        testID="panels-shell"
        variant="feed"
        panels
        scroll="page"
        header={null}
        drawer="reveal"
        gutter={8}
        navigationGap={8}
        navigationAlign="content"
        contentWidth={1800}
        sidebar={{ items: DEMO_NAV, surface: 'plain' }}
      >
        <AppShellPanels testID="panels" collapseBelow={900} show={showMap ? 'map' : 'results'}>
          <AppShellPanel
            id="results"
            testID="panels-results"
            width={560}
            minWidth={360}
            maxWidth={900}
            resizable
          >
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 12 }}>
              {Array.from({ length: 30 }, (_, index) => (
                <Placeholder key={`result-${index + 1}`} height={88} />
              ))}
            </ScrollView>
            <PanelToggle label="Map" onPress={() => setShowMap(true)} />
          </AppShellPanel>
          <AppShellPanel id="map" testID="panels-map" minWidth={320}>
            <MapFill label="Map" />
            <PanelToggle label="List" onPress={() => setShowMap(false)} />
          </AppShellPanel>
        </AppShellPanels>
      </AppShell>
    );
  },
};

/**
 * A list, a message and its details on ONE surface (`joined`), with hairline
 * dividers; the details panel needs a 1100-wide group and leaves below it.
 */
export const JoinedPanels: Story = {
  parameters: { controls: { disable: true }, layout: 'fullscreen' },
  render: () => (
    <AppShell
      testID="joined-shell"
      panels
      scroll="fixed"
      header={null}
      contentMaxWidth="none"
      sidebar={{ items: DEMO_RAIL_NAV, variant: 'rail' }}
    >
      <AppShellPanels testID="joined" appearance="joined" collapseBelow={640} show="message">
        <AppShellPanel
          id="list"
          testID="joined-list"
          width={360}
          minWidth={280}
          maxWidth={520}
          resizable
          scroll="panel"
        >
          <View style={{ padding: 16, gap: 12 }}>
            {Array.from({ length: 20 }, (_, index) => (
              <Placeholder key={`thread-${index + 1}`} height={64} />
            ))}
          </View>
        </AppShellPanel>
        <AppShellPanel id="message" testID="joined-message" scroll="panel">
          <View style={{ padding: 16 }}>
            <Placeholder height={900} />
          </View>
        </AppShellPanel>
        <AppShellPanel id="info" testID="joined-info" width={320} hideBelow={1100}>
          <MapFill label="Details" />
        </AppShellPanel>
      </AppShellPanels>
    </AppShell>
  ),
};

export const IconOnlyRail: Story = {
  parameters: { bloomScroll: 'document' },
  render: () => (
    <AppShell
      testID="icon-rail-shell"
      scroll="document"
      header={null}
      gutter={8}
      navFrom={0}
      contentMaxWidth="none"
      sidebar={{
        variant: 'rail',
        railLabels: 'hidden',
        railSelection: 'icon',
        railWidth: 68,
        surface: 'plain',
        items: DEMO_RAIL_NAV,
        selected: 'home',
      }}
    >
      <AiChatUserMessage
        testID="wide-bubble"
        animate={false}
        bubbleStyle={(width) => ({
          maxWidth: width > 0 ? Math.max(0, width - 112) : '100%',
          marginInlineEnd: 0,
          borderRadius: 24,
          paddingLeft: 16,
          paddingRight: 16,
          paddingTop: 12,
          paddingBottom: 12,
        })}
      >
        A longer message demonstrates how the bubble wraps while leaving space at the start of its
        column. The navigation beside it owns its width and retains accessible destination names.
      </AiChatUserMessage>
      <Placeholder height={1200} />
    </AppShell>
  ),
};

/**
 * An aside made of widgets that render nothing when they have nothing to show
 * takes no column: the reading column centres alone until a widget appears.
 */
export const EmptyAside: Story = {
  parameters: { controls: { disable: true }, bloomScroll: 'document' },
  render: function EmptyAside() {
    const [shown, setShown] = useState(false);
    const theme = useTheme();
    const Widget = () =>
      shown ? (
        <View
          testID="empty-aside-widget"
          style={{ height: 240, borderRadius: 16, backgroundColor: theme.colors.card }}
        />
      ) : null;
    return (
      <AppShell
        testID="empty-aside"
        variant="feed"
        sidebar={{ items: DEMO_NAV }}
        contentWidth={600}
        asideWidth={350}
        asideFrom="lg"
        aside={
          <View style={{ gap: 16 }}>
            <Widget />
          </View>
        }
      >
        <Button testID="empty-aside-toggle" onPress={() => setShown((value) => !value)}>
          {shown ? 'Hide the widget' : 'Show the widget'}
        </Button>
      </AppShell>
    );
  },
};

/**
 * `scroll="page"`: routes are Screen pages, written once. The window scrolls on
 * web; on native the shell is one screen and the route's ScreenScrollView
 * scrolls inside the panel, clearing the bottom bar.
 */
export const ScreenPages: Story = {
  parameters: { controls: { disable: true }, bloomScroll: 'document' },
  render: function ScreenPages() {
    const [pages, setPages] = useState(1);
    return (
      <AppShell
        testID="screen-pages"
        variant="feed"
        panels
        scroll="page"
        sidebar={{ items: DEMO_NAV }}
      >
        <AppShellPanel>
          <Screen documentScroll header={<PageHeader title={`Pages: ${pages}`} safeArea={false} />}>
            <ScreenScrollView
              contentContainerStyle={{ padding: 16, gap: 12 }}
              onEndReached={() => setPages((count) => Math.min(count + 1, 4))}
            >
              {Array.from({ length: pages * 15 }, (_, index) => (
                <View
                  key={`row-${index + 1}`}
                  testID={`screen-pages-row-${index + 1}`}
                  style={{ padding: 16 }}
                >
                  <Text>Row {index + 1}</Text>
                </View>
              ))}
            </ScreenScrollView>
          </Screen>
        </AppShellPanel>
      </AppShell>
    );
  },
};

function DeckPage({ column }: { column: string }) {
  const navigation = usePanelNavigation();
  return (
    <Screen
      scroll="auto"
      testID={`modular-deck-panels-${column}-scroll`}
      header={<PageHeader title={`${column}: ${navigation.entry.name}`} />}
      bottomBar={
        <View style={{ padding: 12 }}>
          <Text>{column} workspace actions</Text>
        </View>
      }
    >
      <ScreenScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        <Text variant="title-2-medium">
          {column}: {navigation.entry.name}
        </Text>
        <Button testID={`deck-${column}-open`} onPress={() => navigation.push({ name: 'Detail' })}>
          Open detail
        </Button>
        {Array.from({ length: 80 }, (_, index) => (
          <Text key={index}>
            {column} item {index + 1}
          </Text>
        ))}
      </ScreenScrollView>
    </Screen>
  );
}
function DeckHeader({ column }: { column: string }) {
  const navigation = usePanelNavigation();
  return (
    <View style={{ padding: 12, flexDirection: 'row', gap: 8 }}>
      <Button
        testID={`deck-${column}-back`}
        disabled={!navigation.canGoBack}
        onPress={navigation.back}
      >
        Back
      </Button>
      <Button
        testID={`deck-${column}-forward`}
        disabled={!navigation.canGoForward}
        onPress={navigation.forward}
      >
        Forward
      </Button>
    </View>
  );
}
/** Each column owns its memory history and restores its scroll independently. */
export const ModularDeck: Story = {
  render: function Deck() {
    const [columns, setColumns] = useState(['Home', 'Mentions', 'Saved', 'Activity']);
    const [activePanel, setActivePanel] = useState<string>();
    return (
      <View style={{ height: 680 }}>
        <AppShell
          testID="modular-deck"
          navigationAlign="content"
          sidebar={{ items: DEMO_NAV, surface: 'plain' }}
          panelLayout={{
            mode: 'deck',
            activePanel,
            trailingAction: (
              <Button
                accessibilityLabel="Add column"
                onPress={() => {
                  const id = `Column ${columns.length + 1}`;
                  setColumns([...columns, id]);
                  setActivePanel(id);
                }}
              >
                Add
              </Button>
            ),
            panels: columns.map((id) => ({
              id,
              width: 360,
              minWidth: 280,
              maxWidth: 520,
              resizable: true,
              scroll: 'content',
              headerActions: <DeckHeader column={id} />,
              navigation: {
                initialEntries: [{ key: 'home', name: 'Home' }],
                render: () => <DeckPage column={id} />,
              },
            })),
          }}
        />
      </View>
    );
  },
};
/** Joined or separated tracks use the same accessible resize grip and pair constraints. */
export const ModularInbox: Story = {
  render: () => (
    <View style={{ height: 680 }}>
      <AppShell
        testID="modular-inbox"
        variant="dashboard"
        contentMaxWidth="none"
        panelLayout={{
          appearance: 'joined',
          collapseBelow: 700,
          activePanel: 'message',
          panels: [
            {
              id: 'list',
              width: 380,
              minWidth: 320,
              maxWidth: 480,
              resizable: true,
              scroll: 'panel',
              content: (
                <View style={{ padding: 16, gap: 16 }}>
                  {Array.from({ length: 30 }, (_, i) => (
                    <Text key={i}>Message {i + 1}</Text>
                  ))}
                </View>
              ),
            },
            {
              id: 'message',
              span: 2,
              minWidth: 300,
              content: (
                <View style={{ padding: 24 }}>
                  <Text variant="title-1-medium">A message with room to read</Text>
                </View>
              ),
            },
          ],
        }}
      />
    </View>
  ),
};
export const ModularMap: Story = {
  render: () => (
    <View style={{ height: 680 }}>
      <AppShell
        testID="modular-map"
        variant="dashboard"
        contentMaxWidth="none"
        panelLayout={{
          collapseBelow: 800,
          activePanel: 'results',
          panels: [
            {
              id: 'results',
              width: 400,
              minWidth: 320,
              maxWidth: 520,
              resizable: true,
              scroll: 'panel',
              content: (
                <View style={{ padding: 16, gap: 20 }}>
                  {Array.from({ length: 80 }, (_, i) => (
                    <Text key={i}>Property {i + 1}</Text>
                  ))}
                </View>
              ),
            },
            {
              id: 'map',
              span: 1,
              minWidth: 320,
              content: (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                  <Text variant="title-1-medium">Map canvas</Text>
                </View>
              ),
            },
          ],
        }}
      />
    </View>
  ),
};
function ExpandingFeedDemo() {
  const [expanded, setExpanded] = useState(false);
  return (
    <AppShell
      testID="modular-feed"
      variant="feed"
      navigationAlign="content"
      gutter={8}
      navigationGap={0}
      panelLayout={{
        flow: 'document',
        gap: 0,
        expandedPanel: expanded ? 'main' : undefined,
        panels: [
          {
            id: 'main',
            width: 620,
            content: (
              <View style={{ padding: 20, gap: 16 }}>
                <Button testID="modular-expand" onPress={() => setExpanded((value) => !value)}>
                  Toggle full content
                </Button>
                {Array.from({ length: 30 }, (_, i) => (
                  <Text key={i}>Feed item {i + 1}</Text>
                ))}
              </View>
            ),
          },
          {
            id: 'context',
            sticky: true,
            width: 350,
            hideBelow: 990,
            content: (
              <View style={{ padding: 20 }}>
                <Text variant="title-2-medium">Context panel</Text>
              </View>
            ),
          },
        ],
      }}
    />
  );
}
export const ModularExpandingFeed: Story = { render: () => <ExpandingFeedDemo /> };

function WorkspacePanel({ id }: { id: string }) {
  const [count, setCount] = useState(0);
  return (
    <View style={{ padding: 20, gap: 16 }}>
      <Text variant="title-2-medium">{id}</Text>
      <Button testID={`workspace-${id}-count`} onPress={() => setCount((value) => value + 1)}>
        Count {count}
      </Button>
      {Array.from({ length: 20 }, (_, index) => (
        <Text key={index}>
          {id} row {index + 1}
        </Text>
      ))}
    </View>
  );
}
/** Same mounted workspace stacks below lg and shares a row when its shell has room. */
export const ModularResponsiveWorkspace: Story = {
  render: () => (
    <View style={{ height: 680 }}>
      <AppShell
        testID="responsive-workspace"
        variant="dashboard"
        contentMaxWidth="none"
        panelLayout={{
          axis: { base: 'vertical', lg: 'horizontal' },
          appearance: 'joined',
          gap: 1,
          panels: [
            {
              id: 'editor',
              width: 480,
              minWidth: 300,
              height: 300,
              minHeight: 160,
              maxHeight: 450,
              resizable: true,
              scroll: 'panel',
              content: <WorkspacePanel id="editor" />,
            },
            {
              id: 'preview',
              span: 1,
              minWidth: 250,
              minHeight: 180,
              scroll: 'panel',
              content: <WorkspacePanel id="preview" />,
            },
          ],
        }}
      />
    </View>
  ),
};
/** Natural height sections share the page's document scroll without viewport-sized rows. */
export const ModularVerticalDocument: Story = {
  render: () => (
    <AppShell
      testID="vertical-document"
      panelLayout={{
        axis: 'vertical',
        flow: 'document',
        panels: [
          {
            id: 'summary',
            width: 620,
            content: (
              <View style={{ padding: 20 }}>
                <Text variant="title-1-medium">Natural-height summary</Text>
              </View>
            ),
          },
          {
            id: 'activity',
            width: 620,
            content: (
              <View style={{ padding: 20, gap: 16 }}>
                {Array.from({ length: 60 }, (_, index) => (
                  <Text key={index}>Activity {index + 1}</Text>
                ))}
              </View>
            ),
          },
        ],
      }}
    />
  ),
};
