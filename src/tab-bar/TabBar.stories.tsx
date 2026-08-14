import React, { useState, type PropsWithChildren } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import type { Meta, StoryObj } from '@storybook/react-vite';

import * as Icons from '../icons';
import { useTheme } from '../theme/use-theme';
import { TabBar, TabBarButton, TabBarMinimizeProvider, useMinimizeOnScroll } from './index';
import type { TabBarItem, TabBarProps } from './types';

/**
 * The floating tab bar, on the ROUTER-FREE core (`activeIndex` /
 * `onIndexChange`). No expo-router anywhere — that is the point of the core
 * layer, and it is what lets the family be exercised in a plain web bundle.
 *
 * Storybook resolves `./index` through its `.web.*`-first extension list, so
 * these stories run the WEB fork (`surface.web.tsx`'s `backdrop-filter` glass
 * and `progressive-blur/index.web.tsx`) against the REAL reanimated,
 * gesture-handler and safe-area-context — no worklets babel plugin, exactly
 * what every Oxy RN-Web app ships. That makes every animated path here
 * observable rather than assumed:
 *
 *  - **tap / scrub**: the highlight springs to the tapped tab, and follows the
 *    finger 1:1 while dragging across the bar
 *  - **minimize**: scrolling down shrinks the pill and fades the labels out
 *  - **glyph crossfade**: the active tint tracks the highlight, not the tap
 *
 * All of them are driven by shared values read inside `useAnimatedStyle`
 * mappers, so if a dependency array is ever dropped (the web freeze-at-first-
 * frame failure mode documented in `TabBarBase`) these stories visibly stop
 * moving while nothing errors.
 */
const meta: Meta<typeof TabBar> = {
  title: 'Navigation/TabBar',
  component: TabBar,
  // The bar is a screen-level element: its highlight geometry comes from
  // `useWindowDimensions()`, so the demo has to be exactly window-wide or the
  // pill drifts out of step with the tabs and reads as a component bug.
  // `fullscreen` drops Storybook's own canvas padding; the preview decorator's
  // padding is cancelled by `Screen`'s negative margin.
  parameters: { layout: 'fullscreen' },
};

export default meta;

type Story = StoryObj<typeof TabBar>;

const ITEMS: TabBarItem[] = [
  { name: 'home', label: 'Home', icon: <Icons.Home_Stroke2_Corner0_Rounded /> },
  { name: 'search', label: 'Search', icon: <Icons.MagnifyingGlass_Stroke2_Corner0_Rounded /> },
  { name: 'inbox', label: 'Inbox', icon: <Icons.Message_Stroke2_Corner0_Rounded /> },
  { name: 'profile', label: 'Profile', icon: <Icons.Person_Stroke2_Corner0_Rounded /> },
];

/** Padding the preview decorator puts around every story (`.storybook/preview.tsx`). */
const PREVIEW_PADDING = 24;
/** Height of the demo viewport — a phone-ish screen for the bar to float over. */
const SCREEN_HEIGHT = 560;
/** Keeps the last rows scrollable clear of the pill. */
const CONTENT_BOTTOM_PAD = 140;

const ROWS = Array.from({ length: 18 }, (_, index) => index + 1);

/**
 * The demo viewport.
 *
 * It bleeds past the preview decorator's padding on purpose: the bar is a
 * screen-level element and derives its highlight geometry from
 * `useWindowDimensions()`, so anything narrower than the window would put the
 * pill out of step with the tabs and look like a component bug.
 *
 * `SafeAreaProvider` is here because `TabBar` reads safe-area insets to sit
 * above the home indicator; a consuming app already has one at its root, the
 * Storybook preview does not.
 */
function Screen({ children }: PropsWithChildren) {
  const { colors } = useTheme();
  return (
    <SafeAreaProvider
      style={{ flex: 0, alignSelf: 'stretch', marginHorizontal: -PREVIEW_PADDING }}
    >
      <GestureHandlerRootView
        style={{
          height: SCREEN_HEIGHT,
          backgroundColor: colors.background,
          overflow: 'hidden',
        }}
      >
        {children}
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}

/** Tall themed filler so there is something for the bar to float over — and to scroll. */
function Feed({ heading, caption }: { heading: string; caption: string }) {
  const { colors } = useTheme();
  return (
    <>
      <Text style={{ color: colors.text, fontSize: 24, fontWeight: '700' }}>{heading}</Text>
      <Text style={{ color: colors.textSecondary, fontSize: 14 }}>{caption}</Text>
      {ROWS.map((row) => (
        <View
          key={row}
          style={{
            padding: 16,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.backgroundSecondary,
            gap: 4,
          }}
        >
          <Text style={{ color: colors.text, fontSize: 15, fontWeight: '600' }}>Item {row}</Text>
          <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
            Scrolls under the glass so the surface has something to refract.
          </Text>
        </View>
      ))}
    </>
  );
}

const CONTENT_STYLE = { padding: 16, paddingBottom: CONTENT_BOTTOM_PAD, gap: 12 } as const;

/** Controlled core: local state in, `onIndexChange` out. No router involved. */
function ControlledBar(props: TabBarProps) {
  return (
    <TabBar {...props}>
      {ITEMS.map((item, index) => (
        <TabBarButton key={item.name} item={item} index={index} />
      ))}
    </TabBar>
  );
}

function DefaultScreen() {
  const [activeIndex, setActiveIndex] = useState(0);
  return (
    <Screen>
      <ScrollView contentContainerStyle={CONTENT_STYLE}>
        <Feed
          heading={ITEMS[activeIndex]?.label ?? 'Feed'}
          caption="Tap a tab, or press and drag across the bar to scrub the highlight."
        />
      </ScrollView>
      <ControlledBar activeIndex={activeIndex} onIndexChange={setActiveIndex} />
    </Screen>
  );
}

/**
 * Body of {@link MinimizeOnScroll} — a separate component because
 * `useMinimizeOnScroll()` has to run INSIDE `TabBarMinimizeProvider` to share
 * the bar's progress value. Called outside it, the hook silently falls back to
 * its own local shared value and nothing minimizes.
 */
function MinimizeScreen() {
  const [activeIndex, setActiveIndex] = useState(0);
  const onScroll = useMinimizeOnScroll();
  return (
    <Screen>
      <Animated.ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={CONTENT_STYLE}
      >
        <Feed
          heading="Minimize on scroll"
          caption="Scroll down: the pill shrinks in both dimensions and the labels fade out. Scroll up, or tap a tab, and it expands again."
        />
      </Animated.ScrollView>
      <ControlledBar activeIndex={activeIndex} onIndexChange={setActiveIndex} />
    </Screen>
  );
}

/**
 * Body of {@link NoSelection} — the consumer shape that exposed the bug.
 *
 * An index derived from the current route is `-1` on every screen outside the
 * tab set, and the capsule used to slide one item-width to the LEFT of the first
 * tab and poke out of the pill. What to watch for, none of which jest can see:
 * it fades out WHERE IT STANDS rather than travelling off, no glyph or label
 * stays lit while it is gone, and picking a tab again fades it back in AT that
 * tab instead of sliding across the bar to reach it. Scrubbing from the
 * off-tab state arms it under the finger.
 */
function NoSelectionScreen() {
  const { colors } = useTheme();
  const [activeIndex, setActiveIndex] = useState(0);
  const offTab = activeIndex < 0;
  return (
    <Screen>
      <ScrollView contentContainerStyle={CONTENT_STYLE}>
        <Pressable
          onPress={() => setActiveIndex(offTab ? 0 : -1)}
          style={{
            padding: 16,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.backgroundSecondary,
          }}
        >
          <Text style={{ color: colors.text, fontSize: 15, fontWeight: '600' }}>
            {offTab ? 'Back to the Home tab' : 'Open a screen that is not a tab (index -1)'}
          </Text>
        </Pressable>
        <Feed
          heading={offTab ? 'Not a tab' : (ITEMS[activeIndex]?.label ?? 'Feed')}
          caption={
            offTab
              ? 'No tab is selected: the highlight has faded out where it stood and nothing is tinted. Tap a tab — it fades back in there rather than sliding across — or drag across the bar to arm it under the finger.'
              : 'Open the screen above to leave the tab set, the way a post detail or a settings route does.'
          }
        />
      </ScrollView>
      <ControlledBar activeIndex={activeIndex} onIndexChange={setActiveIndex} />
    </Screen>
  );
}

function ThemeOverrideScreen() {
  const { colors } = useTheme();
  const [activeIndex, setActiveIndex] = useState(1);
  return (
    <Screen>
      <ScrollView contentContainerStyle={CONTENT_STYLE}>
        <Feed
          heading="Theme override"
          caption="Only the highlight and the active tint are overridden — the inactive tint, the glass tint and the solid fallback still come from the active preset."
        />
      </ScrollView>
      <ControlledBar
        activeIndex={activeIndex}
        onIndexChange={setActiveIndex}
        theme={{ highlight: colors.primary, activeTint: colors.primaryForeground }}
      />
    </Screen>
  );
}

/** Four tabs, controlled highlight, floating over scrollable content. */
export const Default: Story = {
  render: () => <DefaultScreen />,
};

/** The Revolut-style minimize: the shared progress value driven by a scroll handler. */
export const MinimizeOnScroll: Story = {
  render: () => (
    <TabBarMinimizeProvider>
      <MinimizeScreen />
    </TabBarMinimizeProvider>
  ),
};

/** No tab selected (`activeIndex` naming no tab): the highlight fades out in place. */
export const NoSelection: Story = {
  render: () => <NoSelectionScreen />,
};

/** A partial `theme` override on top of the token-derived defaults. */
export const ThemeOverride: Story = {
  render: () => <ThemeOverrideScreen />,
};
