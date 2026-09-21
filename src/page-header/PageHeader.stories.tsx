import React, { useState } from 'react';
import { Screen } from '../screen';
import { Image, ScrollView, View } from 'react-native';
import Animated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Avatar } from '../avatar';
import { Badge } from '../badge';
import { Button } from '../button';
import { ButtonGroup, ButtonGroupItem } from '../button-group';
import {
  RiAddFill,
  RiBookmarkLine,
  RiMore2Line,
  RiSearchLine,
  RiShare2Line,
} from '../icons/remix';
import { ScrollOffsetProvider, TopEdgeProvider, useTopEdgeInset } from '../layout';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { PageHeader } from './index';

const meta: Meta<typeof PageHeader> = {
  title: 'Blocks/Page Header',
  component: PageHeader,
  parameters: { layout: 'fullscreen' },
};

export default meta;

type Story = StoryObj<typeof PageHeader>;

const back = () => {};

const HERO = 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200';

function Page({ children, fill, inset = false }: { children: React.ReactNode; fill?: string; inset?: boolean }) {
  const theme = useTheme();
  return (
    // The preview decorator pads every story by 24; a page header is edge to edge.
    <View
      style={{
        alignSelf: 'stretch',
        marginTop: inset ? 0 : -24,
        marginLeft: inset ? 0 : -24,
        marginRight: inset ? 0 : -24,
        marginBottom: inset ? 0 : -24,
        minHeight: 700,
        backgroundColor: fill ?? theme.colors.background,
      }}
    >
      {children}
    </View>
  );
}

function Rows({ count = 30 }: { count?: number }) {
  const theme = useTheme();
  return (
    <View style={{ padding: 16, gap: 12 }}>
      {Array.from({ length: count }, (_, i) => (
        <View
          key={i}
          style={{
            height: 64,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: theme.colors.border,
            backgroundColor: theme.colors.card,
            justifyContent: 'center',
            paddingLeft: 16,
          }}
        >
          <Text variant="body-medium" style={{ color: theme.colors.text }}>
            Row {i + 1}
          </Text>
        </View>
      ))}
    </View>
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
  return <Button appearance="outline" tone="neutral" size="md" icon={icon} accessibilityLabel={label} />;
}

/**
 * The canonical floating header: back in its own capsule, two related actions
 * sharing one island, a primary action in its own. Nothing here names a
 * material — the island's `ControlSurface` does.
 */
function PageActions() {
  return (
    <>
      <ButtonGroup accessibilityLabel="Page actions">
        <ButtonGroupItem iconOnly leadingIcon={RiSearchLine} accessibilityLabel="Search" />
        <ButtonGroupItem iconOnly leadingIcon={RiShare2Line} accessibilityLabel="Share" />
      </ButtonGroup>
      <ButtonGroup accessibilityLabel="More">
        <ButtonGroupItem iconOnly leadingIcon={RiMore2Line} accessibilityLabel="More" />
      </ButtonGroup>
    </>
  );
}

// ---------------------------------------------------------------------------
//  Floating — the default
// ---------------------------------------------------------------------------

/** Back capsule, title, one shared island of two actions and a second island. */
export const Floating: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Page>
      <PageHeader testID="header" onBack={back} title="Lisbon loft" actions={<PageActions />} />
      <Rows />
    </Page>
  ),
};

/** The same header, forced dark. */
export const FloatingDark: Story = {
  parameters: { controls: { disable: true } },
  globals: { theme: 'dark' },
  render: Floating.render,
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
  parameters: { controls: { disable: true } },
  // Dark, because the page colour is dark: a screen that paints a near-black
  // surface in a LIGHT theme has a text-contrast problem of its own, and it is
  // not the one this story is about.
  globals: { theme: 'dark' },
  render: () => (
    <Page fill={DEEP_WATER}>
      <PageHeader
        testID="header"
        onBack={back}
        title="Deep water"
        scrim="always"
        scrimColor={DEEP_WATER}
        actions={<PageActions />}
      />
      <Rows count={12} />
    </Page>
  ),
};

/** The same screen WITHOUT `scrimColor` — the wrong-hue wash, for comparison. */
export const FloatingScrimColourMismatch: Story = {
  parameters: { controls: { disable: true } },
  globals: { theme: 'dark' },
  render: () => (
    <Page fill={DEEP_WATER}>
      <PageHeader
        testID="header"
        onBack={back}
        title="Deep water"
        scrim="always"
        actions={<PageActions />}
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
        <Image source={{ uri: HERO }} style={{ width: '100%', height: 320 }} />
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0 }}>
          <PageHeader
            testID="header"
            onBack={back}
            title="Lisbon loft"
            titleReveal="onScroll"
            scrollThreshold={264}
            actions={<PageActions />}
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
        />
      </View>
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
      />
      <Rows count={8} />
    </Page>
  ),
};

/**
 * 320 wide with both sides loaded and a long centred title — the case where an
 * unclamped centring inset asks for more room than the container has.
 */
export const FloatingNarrow: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <View style={{ width: 320, maxWidth: '100%', alignSelf: 'flex-start' }}>
      <Page>
        <PageHeader
          onBack={back}
          title="A long screen title that will not fit"
          titleAlign="center"
          scrim="always"
          actions={<PageActions />}
        />
        <Rows count={6} />
      </Page>
    </View>
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
            <Button appearance="solid" tone="accent" size="md" leadingIcon={RiAddFill}>
              New order
            </Button>
          </>
        }
      />
      <Rows count={8} />
    </Page>
  ),
};

/** Bar, centred title, subtitle node, and a header with no back button. */
export const BarVariants: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Page>
      <View style={{ gap: 24 }}>
        <PageHeader
          presentation="bar"
          onBack={back}
          title="Messages"
          titleAlign="center"
          border="always"
          actions={<IconAction icon={RiSearchLine} label="Search" />}
        />
        <PageHeader
          presentation="bar"
          onBack={back}
          title="Design team"
          subtitle="12 members · 3 online"
          border="always"
          actions={<IconAction icon={RiMore2Line} label="More" />}
        />
        <PageHeader presentation="bar" title="Settings" titleAlign="center" border="always" />
      </View>
    </Page>
  ),
};

/**
 * Bar over a photo, the pre-islands recipe: `transparent` fades the strip in
 * with scroll, and `titleReveal` — which used to be part of the same flag —
 * holds the title back.
 */
export const BarOverImage: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Page>
      <PageHeader
        testID="header"
        presentation="bar"
        transparent
        titleReveal="onScroll"
        scrollThreshold={264}
        onBack={back}
        title="Lisbon loft"
        actions={
          <>
            <IconAction icon={RiShare2Line} label="Share" />
            <IconAction icon={RiBookmarkLine} label="Save" />
          </>
        }
      />
      <Image source={{ uri: HERO }} style={{ width: '100%', height: 320, marginTop: -56 }} />
      <Rows />
    </Page>
  ),
};

/** Open at a phone viewport (390): 16px side insets below `sm`. */
export const Phone: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <View style={{ width: 390, maxWidth: '100%', alignSelf: 'flex-start' }}>
      <Page inset>
        <PageHeader onBack={back} title="Order #4821" subtitle="Placed today" scrim="always" actions={<PageActions />} />
        <Rows count={6} />
      </Page>
    </View>
  ),
};

export const Playground: StoryObj<typeof PageHeader> = {
  args: { title: 'Community', subtitle: 'A shared canvas', presentation: 'floating', titleAlign: 'start', titleReveal: 'always', scrim: 'always', border: 'auto', sticky: false, onBack: () => {} },
  parameters: { controls: { disable: false, include: ['title', 'subtitle', 'presentation', 'titleAlign', 'titleReveal', 'scrim', 'border'] } },
  argTypes: { presentation: { control: 'select', options: ['floating','bar'] }, titleAlign: { control: 'select', options: ['start','center'] }, titleReveal: { control: 'select', options: ['always','onScroll'] }, scrim: { control: 'select', options: ['auto','always','none'] }, border: { control: 'select', options: ['auto','always','none'] }, title: { control: 'text' }, subtitle: { control: 'text' } },
  render: function Playground(args) {

    const offset = useSharedValue(0);
    const onScroll = useAnimatedScrollHandler(event => { offset.value = event.contentOffset.y; }, [offset]);
    return <View style={{ width: 900, maxWidth: '100%', height: 420 }}><PageHeader {...args} scrollY={offset} placement="overlay" actions={<PageActions />} /><Animated.ScrollView onScroll={onScroll} scrollEventThrottle={16} contentContainerStyle={{ paddingTop: 88 }}><Rows count={16} /></Animated.ScrollView></View>;
  },
};

/** The shared Screen signal takes over only after the in-content heading leaves. */
export const RevealAfterContentHeading: Story = {
  args: { title: 'Library', subtitle: 'Everything you have saved', scrollThreshold: 20 },
  parameters: { bloomScroll: 'document', controls: { disable: false, include: ['title', 'subtitle', 'scrollThreshold'] } },
  argTypes: { title: { control: 'text' }, subtitle: { control: 'text' }, scrollThreshold: { control: { type: 'range', min: 1, max: 100 } } },
  render: function RevealAfterContentHeading(args) {
    const [headingHeight, setHeadingHeight] = useState(140);
    const theme = useTheme();
    return <View style={{ flex: 1, minHeight: 0, width: '100%', backgroundColor: theme.colors.background }}>
      <Screen documentScroll header={<PageHeader {...args} testID="revealed-header" onBack={back} sticky={false} titleReveal="onScroll" titleRevealOffset={headingHeight} actions={<PageActions />} />}>
        <View testID="reveal-content">
          <View testID="content-heading" onLayout={event => setHeadingHeight(event.nativeEvent.layout.height)} style={{ padding: 24, gap: 8 }}>
            <Text variant="title-1-bold" role="heading" aria-level={1}>{args.title}</Text>
            <Text style={{ color: theme.colors.textSecondary }}>{args.subtitle}</Text>
          </View>
          <Rows count={30} />
        </View>
      </Screen>
    </View>;
  },
};
