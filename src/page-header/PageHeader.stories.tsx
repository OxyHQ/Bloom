import React from 'react';
import { Image, View } from 'react-native';
import Animated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Avatar } from '../avatar';
import { Badge } from '../badge';
import { Button } from '../button';
import { resolveButtonRamps } from '../button/shared';
import { RiAddFill, RiBookmarkLine, RiMore2Line, RiSearchLine, RiShare2Line } from '../icons/remix';
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

function Page({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  const { neutral } = resolveButtonRamps(theme);
  return (
    // The preview decorator pads every story by 24; a page header is edge to edge.
    <View
      style={{
        alignSelf: 'stretch',
        marginTop: -24,
        marginLeft: -24,
        marginRight: -24,
        marginBottom: -24,
        minHeight: 700,
        backgroundColor: theme.isDark ? neutral[950] : neutral[50],
      }}
    >
      {children}
    </View>
  );
}

function Rows({ count = 30 }: { count?: number }) {
  const theme = useTheme();
  const { neutral } = resolveButtonRamps(theme);
  return (
    <View style={{ padding: 16, gap: 12 }}>
      {Array.from({ length: count }, (_, i) => (
        <View
          key={i}
          style={{
            height: 64,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: theme.isDark ? neutral[800] : neutral[200],
            backgroundColor: theme.isDark ? neutral[900] : theme.colors.card,
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
  const { neutral } = resolveButtonRamps(theme);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <Badge dot color="success" />
      <Text variant="body-2-regular" style={{ color: neutral[500] }}>
        Live · deployed 2 min ago
      </Text>
    </View>
  );
}

function IconAction({ icon, label }: { icon: typeof RiMore2Line; label: string }) {
  return <Button variant="secondary" size="medium" iconOnly leadingIcon={icon} accessibilityLabel={label} />;
}

/** Back, title and two actions, border always on. */
export const Basic: Story = {
  render: () => (
    <Page>
      <PageHeader
        testID="header"
        onBack={back}
        title="Order #4821"
        border="always"
        actions={
          <>
            <IconAction icon={RiShare2Line} label="Share" />
            <Button variant="primary" size="medium" leadingIcon={RiAddFill}>
              New order
            </Button>
          </>
        }
      />
    </Page>
  ),
};

/** Title on the bar's centre, whatever the sides hold. */
export const CenteredTitle: Story = {
  render: () => (
    <Page>
      <View style={{ gap: 24 }}>
        <PageHeader onBack={back} title="Messages" titleAlign="center" border="always" actions={<IconAction icon={RiSearchLine} label="Search" />} />
        <PageHeader
          onBack={back}
          title="A rather long conversation title that truncates"
          subtitle="Centred subtitle"
          titleAlign="center"
          border="always"
          actions={
            <>
              <IconAction icon={RiSearchLine} label="Search" />
              <IconAction icon={RiMore2Line} label="More" />
            </>
          }
        />
        <PageHeader title="Settings" titleAlign="center" border="always" />
      </View>
    </Page>
  ),
};

/** A string subtitle, and a node subtitle. */
export const Subtitle: Story = {
  render: () => (
    <Page>
      <View style={{ gap: 24 }}>
        <PageHeader
          onBack={back}
          title="Design team"
          subtitle="12 members · 3 online"
          border="always"
          actions={<IconAction icon={RiMore2Line} label="More" />}
        />
        <PageHeader
          onBack={back}
          title="Deploy #219"
          subtitle={<LiveStatus />}
          border="always"
        />
      </View>
    </Page>
  ),
};

/** `leading` sits between the back button and the title. */
export const LeadingAvatar: Story = {
  render: () => (
    <Page>
      <PageHeader
        onBack={back}
        leading={<Avatar size={32} name="Maya Chen" />}
        title="Maya Chen"
        subtitle="Active now"
        border="always"
        actions={
          <>
            <IconAction icon={RiSearchLine} label="Search" />
            <IconAction icon={RiMore2Line} label="More" />
          </>
        }
      />
    </Page>
  ),
};

/** Web: sticky on the window; border and shadow fade in over the first 20px of scroll. */
export const StickyLongPage: Story = {
  render: () => (
    <Page>
      <PageHeader
        testID="header"
        onBack={back}
        title="Inbox"
        subtitle="128 conversations"
        actions={
          <>
            <IconAction icon={RiSearchLine} label="Search" />
            <Button variant="primary" size="medium" leadingIcon={RiAddFill}>
              Compose
            </Button>
          </>
        }
      />
      <Rows />
    </Page>
  ),
};

/** Over a photo: background, shadow and title arrive as the photo scrolls under the bar (threshold 264 = photo minus bar). */
export const TransparentOverImage: Story = {
  render: () => (
    <Page>
      <PageHeader
        testID="header"
        transparent
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

function ScrollContainerDemo() {
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
      <View style={{ height: 640, overflow: 'hidden' }}>
        <PageHeader testID="header" onBack={back} title="Scroll container" scrollY={scrollY} sticky={false} />
        <Animated.ScrollView onScroll={onScroll} scrollEventThrottle={16} style={{ flex: 1 }}>
          <Rows />
        </Animated.ScrollView>
      </View>
    </Page>
  );
}

/** Native-style: the header sits above a scroll view and follows its `scrollY`. */
export const ScrollContainer: Story = {
  render: () => <ScrollContainerDemo />,
};

/** The same bars, forced dark. */
export const Dark: Story = {
  globals: { theme: 'dark' },
  render: Basic.render,
};

/** Open at a phone viewport (390): 16px side insets below `sm`. */
export const Phone: Story = {
  render: () => (
    <View style={{ alignSelf: 'stretch' }}>
      <Page>
        <View style={{ gap: 24 }}>
          <PageHeader onBack={back} title="Order #4821" subtitle="Placed today" border="always" actions={<IconAction icon={RiMore2Line} label="More" />} />
          <PageHeader onBack={back} title="Messages" titleAlign="center" border="always" actions={<IconAction icon={RiSearchLine} label="Search" />} />
        </View>
      </Page>
    </View>
  ),
};
