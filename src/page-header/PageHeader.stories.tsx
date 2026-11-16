import { fn } from 'storybook/test';
import { Search } from '../search';
import type React from 'react';
import { createContext, useContext, useState } from 'react';
import { Tabs, TabsTrigger } from '../tabs';
import { Screen } from '../screen';
import { View } from 'react-native';
import { ScrollArea as ScrollView } from '../layout';
import { BloomImage } from '../image';
import { List } from '../list';
import Animated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Avatar } from '../avatar';
import { AgentAvatar } from '../agent-avatar';
import { Badge } from '../badge';
import { Button } from '../button';

import { RiAddFill, RiBookmarkLine, RiMore2Line, RiShare2Line } from '../icons/remix';
import { ScrollOffsetProvider, TopEdgeProvider, useTopEdgeInset } from '../layout';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { PageHeader, PageHeaderTitleInput } from './index';
import { Toolbar } from '../layout';
import { Breadcrumb, BreadcrumbItem } from '../breadcrumb';
import { Popover, PopoverTrigger, PopoverContent } from '../popover';
import { TextFieldInput } from '../text-field';

const meta: Meta<typeof PageHeader> = {
  id: 'blocks-page-header',
  title: 'Composition/Layout/Page Header',
  component: PageHeader,
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <SearchDemo>
        <Story />
      </SearchDemo>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof PageHeader>;

const SearchDemoContext = createContext({ query: '', setQuery: (_query: string) => {} });

/** Demo data stays here; the interaction is the same shared Search used by apps. */
function SearchDemo({ children }: { children: React.ReactNode }) {
  const [query, setQuery] = useState('');
  return (
    <SearchDemoContext.Provider value={{ query, setQuery }}>{children}</SearchDemoContext.Provider>
  );
}

function PageSearch() {
  const { query, setQuery } = useContext(SearchDemoContext);
  return (
    <Search
      presentation="auto"
      label="Search"
      value={query}
      onValueChange={setQuery}
      onClearText={() => setQuery('')}
    />
  );
}

const back = fn().mockName('onBack');
const share = fn().mockName('onShare');
const more = fn().mockName('onMore');

/** A composed identity sets the header height without a fixed-height wrapper. */
export const CenteredAgentIdentity: Story = {
  render: () => (
    <Page>
      <PageHeader
        testID="header"
        titleAlign="center"
        onBack={back}
        title="Product planner"
        titleLayout="stacked"
        titleAppearance="capsule"
        titleVisual={<AgentAvatar character={{ preset: 'blue_beret' }} size={48} />}
        onPressTitle={back}
        actions={<PageActions />}
        search={<PageSearch />}
      />
      <Rows count={5} />
    </Page>
  ),
};

const HERO = 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200';

function Page({ children, fill }: { children: React.ReactNode; fill?: string }) {
  const theme = useTheme();
  return (
    <View
      style={{
        alignSelf: 'stretch',
        minHeight: 700,
        backgroundColor: fill ?? theme.colors.background,
      }}
    >
      {children}
    </View>
  );
}

function Rows({ count = 30 }: { count?: number }) {
  const { query } = useContext(SearchDemoContext);
  return (
    <List
      items={Array.from({ length: count }, (_, i) => ({
        id: String(i),
        title: `Row ${i + 1}`,
      })).filter((row) => row.title.toLowerCase().includes(query.trim().toLowerCase()))}
      empty={<Text>No results</Text>}
    />
  );
}

function LiveStatus() {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <Badge dot tone="success" />
      <Text variant="body-2-regular" style={{ color: theme.colors.textSecondary }}>
        Live · deployed 2 min ago
      </Text>
    </View>
  );
}

function IconAction({ icon, label }: { icon: typeof RiMore2Line; label: string }) {
  return (
    <Button
      appearance="outline"
      tone="neutral"
      size="md"
      icon={icon}
      accessibilityLabel={label}
      onPress={fn().mockName(label)}
    />
  );
}

/**
 * The canonical floating header: back, grouped page actions and a shared
 * adaptive search. Nothing here names a
 * material — the island's `BloomScope` does.
 */
function PageActions() {
  return (
    <Button.Group accessibilityLabel="Page actions">
      <Button iconOnly leadingIcon={RiShare2Line} accessibilityLabel="Share" onPress={share} />
      <Button iconOnly leadingIcon={RiMore2Line} accessibilityLabel="More" onPress={more} />
    </Button.Group>
  );
}

// ---------------------------------------------------------------------------
//  Floating — the default
// ---------------------------------------------------------------------------

/** Back capsule, title, grouped actions and working adaptive search. */
export const Floating: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Page>
      <PageHeader
        testID="header"
        onBack={back}
        title="Lisbon loft"
        actions={<PageActions />}
        search={<PageSearch />}
      />
      <Rows />
    </Page>
  ),
};

const DEEP_WATER = '#1d3b53';

/**
 * Over a colour the THEME does not know about.
 *
 * The scrim fades content into the surface it is leaving, so its colour has to
 * be that surface — and the header cannot read the pixel behind it. A screen
 * that paints its own background hands it over with `scrimColor`; without one
 * the ramp is the theme's background, which over a tinted page is a wash of the
 * wrong hue rather than a fade.
 */
export const FloatingOverColour: Story = {
  args: { scrimColor: DEEP_WATER },
  parameters: { controls: { disable: true } },
  render: (args) => (
    <Page fill={DEEP_WATER}>
      <PageHeader
        testID="header"
        onBack={back}
        title="Deep water"
        scrim="always"
        tone="onImage"
        scrimColor={args.scrimColor}
        actions={<PageActions />}
        search={<PageSearch />}
      />
      <Rows count={12} />
    </Page>
  ),
};

/**
 * Over a photograph, which is what the islands are for: the controls carry
 * their own material, so they read before the scrim has arrived.
 *
 * `titleReveal="onScroll"` holds the title back — the photo already names the
 * screen — and it is a SEPARATE decision from the scrim's.
 */
export const FloatingOverImage: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Page>
      <View>
        <BloomImage source={{ uri: HERO }} style={{ width: '100%', height: 320 }} />
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0 }}>
          <PageHeader
            testID="header"
            onBack={back}
            title="Lisbon loft"
            titleReveal="onScroll"
            scrollThreshold={264}
            actions={<PageActions />}
            search={<PageSearch />}
          />
        </View>
      </View>
      <Rows />
    </Page>
  ),
};

/** A centred title stays on the container's centre whatever the two sides hold. */
export const FloatingCentred: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Page>
      <View style={{ gap: 24 }}>
        <PageHeader onBack={back} title="Messages" titleAlign="center" scrim="always" />
        <PageHeader
          onBack={back}
          title="A rather long conversation title that truncates"
          subtitle="Centred subtitle"
          titleAlign="center"
          scrim="always"
          actions={<PageActions />}
          search={<PageSearch />}
        />
      </View>
      <Rows count={8} />
    </Page>
  ),
};

/** `leading` sits between the back capsule and the title. */
export const FloatingLeadingAvatar: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Page>
      <PageHeader
        onBack={back}
        leading={<Avatar size={32} name="Maya Chen" />}
        title="Maya Chen"
        subtitle={<LiveStatus />}
        scrim="always"
        actions={<PageActions />}
        search={<PageSearch />}
      />
      <Rows count={8} />
    </Page>
  ),
};

// ---------------------------------------------------------------------------
//  Placement — who reserves the space
// ---------------------------------------------------------------------------

function OverlayContent() {
  // The header claims its measured height; the content reads it back. No
  // constant, and nothing for the app to keep in step with the header.
  const inset = useTopEdgeInset();
  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingTop: inset }}>
      <Rows />
    </ScrollView>
  );
}

/**
 * `placement="overlay"`: the content starts at the top of the container and
 * scrolls UNDER the islands. `TopEdgeProvider` is already mounted by
 * `BloomProvider` in a real app.
 */
export const OverlayPlacement: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <TopEdgeProvider>
      <Page>
        <View style={{ height: 640 }}>
          <OverlayContent />
          <PageHeader
            testID="header"
            onBack={back}
            title="Inbox"
            subtitle="128 conversations"
            placement="overlay"
            actions={<PageActions />}
            search={<PageSearch />}
          />
        </View>
      </Page>
    </TopEdgeProvider>
  ),
};

function ScrollOwnerDemo() {
  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler(
    {
      onScroll: (event) => {
        scrollY.value = event.contentOffset.y;
      },
    },
    [scrollY],
  );
  return (
    <Page>
      {/*
        The header takes the offset from the context rather than from a prop —
        the arrangement a Bloom scroll composition gets with no wiring, and the
        one that used to follow `window.scrollY` and never move.
      */}
      <ScrollOffsetProvider value={scrollY}>
        <View style={{ height: 640, overflow: 'hidden' }}>
          <PageHeader testID="header" onBack={back} title="Scroll container" sticky={false} />
          <Animated.ScrollView onScroll={onScroll} scrollEventThrottle={16} style={{ flex: 1 }}>
            <Rows />
          </Animated.ScrollView>
        </View>
      </ScrollOffsetProvider>
    </Page>
  );
}

/** A panel that owns its own scroller, published through `ScrollOffsetProvider`. */
export const NestedScrollOwner: Story = {
  parameters: { controls: { disable: true } },
  render: () => <ScrollOwnerDemo />,
};

// ---------------------------------------------------------------------------
//  The `bar` presentation
// ---------------------------------------------------------------------------

/** Bloom's original flat strip, now asked for by name. */
export const Bar: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Page>
      <PageHeader
        testID="header"
        presentation="bar"
        onBack={back}
        title="Order #4821"
        border="always"
        actions={
          <>
            <IconAction icon={RiShare2Line} label="Share" />
            <Button
              appearance="solid"
              tone="accent"
              size="md"
              leadingIcon={RiAddFill}
              onPress={fn().mockName('New order')}
            >
              New order
            </Button>
          </>
        }
      />
      <Rows count={8} />
    </Page>
  ),
};

export const Playground: StoryObj<typeof PageHeader> = {
  args: {
    title: 'Community',
    subtitle: 'A shared canvas',
    presentation: 'floating',
    titleAlign: 'start',
    titleReveal: 'always',
    scrim: 'always',
    border: 'auto',
    sticky: false,
    onBack: back,
  },
  parameters: {
    controls: {
      disable: false,
      include: [
        'title',
        'subtitle',
        'presentation',
        'titleAlign',
        'titleReveal',
        'scrim',
        'border',
      ],
    },
  },
  argTypes: {
    presentation: { control: 'select', options: ['floating', 'bar', 'navigation'] },
    titleAlign: { control: 'select', options: ['start', 'center'] },
    titleReveal: { control: 'select', options: ['always', 'onScroll'] },
    scrim: { control: 'select', options: ['auto', 'always', 'none'] },
    border: { control: 'select', options: ['auto', 'always', 'none'] },
    title: { control: 'text' },
    subtitle: { control: 'text' },
  },
  render: function Playground(args) {
    const offset = useSharedValue(0);
    const onScroll = useAnimatedScrollHandler(
      (event) => {
        offset.value = event.contentOffset.y;
      },
      [offset],
    );
    return (
      <View style={{ width: 900, maxWidth: '100%', height: 420 }}>
        <PageHeader
          {...args}
          scrollY={offset}
          placement="overlay"
          actions={<PageActions />}
          search={<PageSearch />}
        />
        <Animated.ScrollView
          onScroll={onScroll}
          scrollEventThrottle={16}
          contentContainerStyle={{ paddingTop: 88 }}
        >
          <Rows count={16} />
        </Animated.ScrollView>
      </View>
    );
  },
};

/** The shared Screen signal takes over only after the in-content heading leaves. */
export const RevealAfterContentHeading: Story = {
  args: { title: 'Library', subtitle: 'Everything you have saved', scrollThreshold: 20 },
  parameters: {
    bloomScroll: 'document',
    controls: { disable: false, include: ['title', 'subtitle', 'scrollThreshold'] },
  },
  argTypes: {
    title: { control: 'text' },
    subtitle: { control: 'text' },
    scrollThreshold: { control: { type: 'range', min: 1, max: 100 } },
  },
  render: function RevealAfterContentHeading(args) {
    const [headingHeight, setHeadingHeight] = useState(140);
    const theme = useTheme();
    return (
      <View
        style={{ flex: 1, minHeight: 0, width: '100%', backgroundColor: theme.colors.background }}
      >
        <Screen
          documentScroll
          header={
            <PageHeader
              {...args}
              testID="revealed-header"
              onBack={back}
              sticky={false}
              titleRevealOffset={headingHeight}
              actions={<PageActions />}
              search={<PageSearch />}
            />
          }
        >
          <View testID="reveal-content">
            <View
              testID="content-heading"
              onLayout={(event) => setHeadingHeight(event.nativeEvent.layout.height)}
              style={{ padding: 24, gap: 8 }}
            >
              <Text variant="title-1-bold" role="heading" aria-level={1}>
                {args.title}
              </Text>
              <Text style={{ color: theme.colors.textSecondary }}>{args.subtitle}</Text>
            </View>
            <Rows count={30} />
          </View>
        </Screen>
      </View>
    );
  },
};

function EditableWorkspaceHeader() {
  const [title, setTitle] = useState('Projects');
  const [view, setView] = useState('board');
  return (
    <Page>
      <PageHeader
        presentation="bar"
        title={
          <PageHeaderTitleInput label="Database title" value={title} onChangeText={setTitle} />
        }
        accessory={
          <Toolbar
            actions={
              <Button leadingIcon={RiAddFill} onPress={fn().mockName('New record')}>
                New
              </Button>
            }
            accessory={<Text className="text-text-secondary">12 records</Text>}
          >
            <Tabs value={view} onValueChange={setView}>
              <TabsTrigger value="board" label="Board" />
              <TabsTrigger value="table" label="Table" />
            </Tabs>
            <Button appearance="plain" onPress={fn().mockName('Filter')}>
              Filter
            </Button>
            <Button appearance="plain" onPress={fn().mockName('Sort')}>
              Sort
            </Button>
            <Button appearance="plain" onPress={fn().mockName('Properties')}>
              Properties
            </Button>
          </Toolbar>
        }
      />
      <Rows count={5} />
    </Page>
  );
}

/** Narrow the canvas: tools scroll, while the primary action remains visible. */
export const EditableWorkspace: Story = { render: () => <EditableWorkspaceHeader /> };

export const Navigation: Story = {
  render: () => {
    const [title, setTitle] = useState('Project notes');
    return (
      <Page>
        <Popover>
          <PageHeader
            presentation="navigation"
            title={
              <Breadcrumb overflow="collapse" separator="/">
                <BreadcrumbItem href="#workspace">Workspace</BreadcrumbItem>
                <BreadcrumbItem href="#projects">Projects</BreadcrumbItem>
                <BreadcrumbItem current trigger={<PopoverTrigger asChild />}>
                  {title}
                </BreadcrumbItem>
              </Breadcrumb>
            }
            actions={({ compact }) => (
              <>
                <Button
                  appearance="plain"
                  tone="neutral"
                  iconOnly={compact}
                  icon={compact ? RiShare2Line : undefined}
                  accessibilityLabel="Share"
                  onPress={back}
                >
                  {compact ? undefined : 'Share'}
                </Button>
                <Button
                  appearance="plain"
                  tone="neutral"
                  iconOnly
                  icon={RiMore2Line}
                  accessibilityLabel="Actions"
                  onPress={back}
                />
              </>
            )}
          />
          <PopoverContent label="Page details">
            <TextFieldInput label="Title" value={title} onChangeText={setTitle} />
          </PopoverContent>
        </Popover>
        <Rows count={5} />
      </Page>
    );
  },
};

/** The header allocates its search slot; Search owns the capsule and input transition. */
export const AdaptiveSearch: Story = {
  parameters: { controls: { disable: true } },
  render: function AdaptiveSearchStory() {
    const [query, setQuery] = useState('');
    const notes = [
      {
        id: 'nature',
        title: 'Nature Walks',
        supporting: 'Notes, trails and things worth remembering.',
      },
      { id: 'coast', title: 'A day on the coast', supporting: 'The little places along the way.' },
      { id: 'garden', title: 'In the garden', supporting: 'What is growing this spring.' },
    ];
    return (
      <Page>
        <PageHeader
          testID="search-header"
          title="Notes"
          search={
            <Search
              presentation="auto"
              value={query}
              onValueChange={setQuery}
              onClearText={() => setQuery('')}
              label="Search notes"
            />
          }
        />
        <List
          items={notes.filter((note) =>
            `${note.title} ${note.supporting}`.toLowerCase().includes(query.toLowerCase()),
          )}
          empty={<Text>No matching notes</Text>}
        />
      </Page>
    );
  },
};
