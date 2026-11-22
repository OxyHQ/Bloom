import { type ReactNode, useState } from 'react';
import { RefreshControl, View } from 'react-native';
import { EdgeScrim, PageHeader, SCRIM_TAIL_RATIO } from '@oxy.so/bloom/page-header';
import { Screen, ScreenScrollView } from '@oxy.so/bloom/screen';
import { tokens, useSurfaceFill } from '@oxy.so/bloom/styles';
import { withAlpha } from '@oxy.so/bloom/theme';
import { Text } from '@oxy.so/bloom/typography';

import { ENUMS } from '../src/generated/spec.generated';
import * as L from '../src/primitives';
import { toElement } from '../src/render';
import { ScreenHost } from '../src/router/screen-host';
import { type ParityCase, Themed } from './support/cases';

const { space } = tokens;
const noop = () => {};

const DISMISS_MODE = {
  never: 'none',
  immediately: 'on-drag',
  interactively: 'interactive',
} as const;

/** A scroll view is the screen's: both sides in a Bloom `Screen`. */
function inScreen(cases: ParityCase[]): ParityCase[] {
  return cases.map((c) => ({
    name: c.name,
    language: () => <Screen>{c.language()}</Screen>,
    bloom: () => <Screen>{c.bloom()}</Screen>,
  }));
}

const scrollViews: ParityCase[] = inScreen([
  {
    name: 'a scroll view of two texts',
    language: () => toElement(L.ScrollView(L.Text('a'), L.Text('b'))),
    bloom: () => (
      <ScreenScrollView>
        <Text>a</Text>
        <Text>b</Text>
      </ScreenScrollView>
    ),
  },
  {
    name: 'content margins and spacing',
    language: () =>
      toElement(
        L.ScrollView(L.Text('a'), L.Text('b'))
          .contentMargins('horizontal', 'lg')
          .contentMargins('top', 'sm')
          .contentMargins('leading', '2xl')
          .spacing('md'),
      ),
    bloom: () => (
      <ScreenScrollView
        contentContainerStyle={{
          paddingHorizontal: space.lg,
          paddingTop: space.sm,
          paddingStart: space._2xl,
          gap: space.md,
        }}
      >
        <Text>a</Text>
        <Text>b</Text>
      </ScreenScrollView>
    ),
  },
  {
    name: 'physical left and right margins',
    language: () =>
      toElement(
        L.ScrollView(L.Text('a')).contentMargins('left', 'sm').contentMargins('right', 'lg'),
      ),
    bloom: () => (
      <ScreenScrollView contentContainerStyle={{ paddingLeft: space.sm, paddingRight: space.lg }}>
        <Text>a</Text>
      </ScreenScrollView>
    ),
  },
  {
    name: 'margins on every edge',
    language: () => toElement(L.ScrollView(L.Text('a')).contentMargins('xl')),
    bloom: () => (
      <ScreenScrollView contentContainerStyle={{ padding: space.xl }}>
        <Text>a</Text>
      </ScreenScrollView>
    ),
  },
  ...(['visible', 'hidden'] as const).map((shown) => ({
    name: `scroll indicators ${shown}`,
    language: () => toElement(L.ScrollView(L.Text('a')).scrollIndicators(shown)),
    bloom: () => (
      <ScreenScrollView
        showsVerticalScrollIndicator={shown === 'visible'}
        showsHorizontalScrollIndicator={shown === 'visible'}
      >
        <Text>a</Text>
      </ScreenScrollView>
    ),
  })),
  ...ENUMS.keyboardDismiss.map((dismiss) => ({
    name: `keyboard dismissal ${dismiss}`,
    language: () => toElement(L.ScrollView(L.Text('a')).scrollDismissesKeyboard(dismiss)),
    bloom: () => (
      <ScreenScrollView keyboardDismissMode={DISMISS_MODE[dismiss]}>
        <Text>a</Text>
      </ScreenScrollView>
    ),
  })),
  ...ENUMS.keyboardTaps.map((taps) => ({
    name: `keyboard taps ${taps}`,
    language: () => toElement(L.ScrollView(L.Text('a')).keyboardTaps(taps)),
    bloom: () => (
      <ScreenScrollView keyboardShouldPersistTaps={taps}>
        <Text>a</Text>
      </ScreenScrollView>
    ),
  })),
  {
    name: 'the end reached, three viewports early',
    language: () => toElement(L.ScrollView(L.Text('a')).onEndReached(noop, 3).testID('feed')),
    bloom: () => (
      <ScreenScrollView onEndReached={noop} onEndReachedThreshold={3} testID="feed">
        <Text>a</Text>
      </ScreenScrollView>
    ),
  },
  {
    name: 'vertical scroll indicator hidden',
    language: () => toElement(L.ScrollView(L.Text('a')).scrollIndicators('hidden', 'vertical')),
    bloom: () => (
      <ScreenScrollView showsVerticalScrollIndicator={false}>
        <Text>a</Text>
      </ScreenScrollView>
    ),
  },
  {
    name: 'horizontal scroll indicator visible, vertical hidden',
    language: () =>
      toElement(
        L.ScrollView(L.Text('a'))
          .scrollIndicators('hidden')
          .scrollIndicators('visible', 'horizontal'),
      ),
    bloom: () => (
      <ScreenScrollView showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator>
        <Text>a</Text>
      </ScreenScrollView>
    ),
  },
  {
    name: 'pull to refresh',
    language: () => toElement(L.ScrollView(L.Text('a')).refreshable([false, noop])),
    bloom: () => (
      <ScreenScrollView refreshControl={<RefreshControl refreshing={false} onRefresh={noop} />}>
        <Text>a</Text>
      </ScreenScrollView>
    ),
  },
  ...(['primary', 'muted/70'] as const).map((tint) => ({
    name: `pull to refresh tinted ${tint}`,
    language: () => toElement(L.ScrollView(L.Text('a')).refreshable([true, noop], tint)),
    bloom: () => (
      <Themed>
        {(c) => {
          const color = tint === 'primary' ? c.primary : withAlpha(c.textSecondary, 0.7);
          return (
            <ScreenScrollView
              refreshControl={
                <RefreshControl refreshing onRefresh={noop} tintColor={color} colors={[color]} />
              }
            >
              <Text>a</Text>
            </ScreenScrollView>
          );
        }}
      </Themed>
    ),
  })),
]);

/** A `Header` as Bloom's `PageHeader`, each prop an app gives it that the header maps. */
const pageHeaders: ParityCase[] = [
  {
    name: 'a header',
    language: () => toElement(L.Header('Home')),
    bloom: () => <PageHeader title="Home" />,
  },
  {
    name: 'a header in the page',
    language: () => toElement(L.Header('Home').inPage()),
    bloom: () => <PageHeader title="Home" />,
  },
  ...[true, false].map((safeArea) => ({
    name: `a header's safe area ${safeArea}`,
    language: () => toElement(L.Header('Home').safeArea(safeArea)),
    bloom: () => <PageHeader title="Home" safeArea={safeArea} />,
  })),
  ...ENUMS.titleAlign.map((align) => ({
    name: `a header's title aligned ${align}`,
    language: () => toElement(L.Header('Home').titleAlign(align)),
    bloom: () => <PageHeader title="Home" titleAlign={align} />,
  })),
  {
    name: 'a header with an accessory',
    language: () => toElement(L.Header('Home').accessory(L.Text('Tabs'))),
    bloom: () => <PageHeader title="Home" accessory={<Text>Tabs</Text>} />,
  },
  ...ENUMS.headerTone.map((tone) => ({
    name: `a header's tone ${tone}`,
    language: () => toElement(L.Header('Home').tone(tone)),
    bloom: () => <PageHeader title="Home" tone={tone} />,
  })),
  {
    name: 'a header’s scrim colour',
    language: () => toElement(L.Header('Home').scrollEdge('always').scrimColor('surface')),
    bloom: () => (
      <Themed>
        {(c) => <PageHeader title="Home" scrim="always" scrimColor={c.backgroundSecondary} />}
      </Themed>
    ),
  },
  ...ENUMS.scrimFalloff.map((falloff) => ({
    name: `a header's scrim falloff ${falloff}`,
    language: () => toElement(L.Header('Home').scrollEdge('always').scrimFalloff(falloff)),
    bloom: () => <PageHeader title="Home" scrim="always" scrimFalloff={falloff} />,
  })),
  ...ENUMS.titleReveal.map((reveal) => ({
    name: `a header's title reveal ${reveal}`,
    language: () => toElement(L.Header('Home').titleReveal(reveal)),
    bloom: () => <PageHeader title="Home" titleReveal={reveal} />,
  })),
];

const screens: ParityCase[] = [
  {
    name: 'a screen without a header',
    language: () => <ScreenHost root={L.Text('a').header(false)} />,
    bloom: () => (
      <Screen>
        <Text>a</Text>
      </Screen>
    ),
  },
  {
    name: 'a titled screen: the floating PageHeader',
    language: () => <ScreenHost root={L.Text('a').title('Home')} />,
    bloom: () => (
      <Screen header={<PageHeader title="Home" presentation="floating" />}>
        <Text>a</Text>
      </Screen>
    ),
  },
  ...ENUMS.scrollEdge.map((edge) => ({
    name: `the header's scroll edge ${edge}`,
    language: () => <ScreenHost root={L.Text('a').title('Home').scrollEdge(edge)} />,
    bloom: () => (
      <Screen header={<PageHeader title="Home" presentation="floating" scrim={edge} />}>
        <Text>a</Text>
      </Screen>
    ),
  })),
  ...ENUMS.screenKind.map((kind) => ({
    name: `a ${kind} screen`,
    language: () => <ScreenHost root={L.Text('a').header(false).screenKind(kind)} />,
    bloom: () => (
      <Screen kind={kind}>
        <Text>a</Text>
      </Screen>
    ),
  })),
  ...ENUMS.screenScroll.map((scroll) => ({
    name: `scrolled by ${scroll}`,
    language: () => (
      <ScreenHost root={L.ScrollView(L.Text('a')).header(false).screenScroll(scroll)} />
    ),
    bloom: () => (
      <Screen scroll={scroll}>
        <ScreenScrollView>
          <Text>a</Text>
        </ScreenScrollView>
      </Screen>
    ),
  })),
  {
    name: 'document scroll, an overlaid header, the content’s clearance and an isolated scope',
    language: () => (
      <ScreenHost
        root={L.Text('a')
          .title('Home')
          .documentScroll()
          .headerPlacement('overlay')
          .contentClearance('2xl')
          .navigationScope('isolated')}
      />
    ),
    bloom: () => (
      <Screen
        documentScroll
        header={<PageHeader title="Home" presentation="floating" />}
        headerPlacement="overlay"
        contentClearance={space._2xl}
        navigationScope="isolated"
      >
        <Text>a</Text>
      </Screen>
    ),
  },
  {
    name: 'an underlay behind the screen',
    language: () => <ScreenHost root={L.Text('a').header(false).underlay(L.Text('wallpaper'))} />,
    bloom: () => (
      <Screen underlay={<Text>wallpaper</Text>}>
        <Text>a</Text>
      </Screen>
    ),
  },
  ...ENUMS.actionPlacement.map((placement) => ({
    name: `the screen's floating action, ${placement}`,
    language: () => (
      <ScreenHost
        root={L.Text('a').header(false).floatingAction(L.Text('new'), {
          placement,
          visibility: 'alone',
        })}
      />
    ),
    bloom: () => (
      <Screen
        primaryAction={<Text>new</Text>}
        primaryActionPlacement={placement}
        primaryActionVisibility="alone"
      >
        <Text>a</Text>
      </Screen>
    ),
  })),
  ...(['inset', 'overlay'] as const).map((placement) => ({
    name: `a footer, ${placement}, visible with the keyboard`,
    language: () => (
      <ScreenHost
        root={L.Text('a').header(false).footer(L.Text('reply'), { placement, keyboard: 'visible' })}
      />
    ),
    bloom: () => (
      <Screen
        bottomBar={<Text>reply</Text>}
        bottomBarPlacement={placement}
        bottomBarKeyboardBehavior="visible"
      >
        <Text>a</Text>
      </Screen>
    ),
  })),
  // Every preset: a screen's recipe themes its content (and the panel and shell around it).
  ...ENUMS.colorPreset.map((preset) => ({
    name: `a ${preset} screen`,
    language: () => (
      <ScreenHost root={L.Text('a').header(false).colorPreset(preset).testID('tinted')} />
    ),
    bloom: () => (
      <Screen colorPreset={preset} testID="tinted">
        <Text>a</Text>
      </Screen>
    ),
  })),
  {
    name: 'a screen seeded by a colour, over a preset',
    language: () => (
      <ScreenHost root={L.Text('a').header(false).colorPreset('teal').seed('#8e5137')} />
    ),
    bloom: () => (
      <Screen colorPreset="teal" seed="#8e5137">
        <Text>a</Text>
      </Screen>
    ),
  },
  {
    name: 'a retained screen, with its starting chrome heights',
    language: () => (
      <ScreenHost
        root={L.ScrollView(L.Text('a'))
          .title('Home')
          .footer(L.Text('reply'))
          .screenScroll('content')
          .screenActive(false)
          .initialHeaderHeight('64')
          .initialFooterHeight('96')}
      />
    ),
    bloom: () => (
      <Screen
        scroll="content"
        active={false}
        header={<PageHeader title="Home" presentation="floating" />}
        bottomBar={<Text>reply</Text>}
        headerHeight={64}
        bottomBarHeight={96}
      >
        <ScreenScrollView>
          <Text>a</Text>
        </ScreenScrollView>
      </Screen>
    ),
  },
];

/**
 * A scroll with a view pinned at its edge, as an app writes it with Bloom: a
 * box the scroll fills, the view absolute at the edge and measured, the
 * content padded by its height (and a gap), a bar with Bloom's scrim under it.
 */
function Pinned({
  edge,
  gap = 0,
  bar = false,
  view,
  children,
}: {
  edge: 'top' | 'bottom';
  gap?: number;
  bar?: boolean;
  view: ReactNode;
  children: ReactNode;
}) {
  const [height, setHeight] = useState(0);
  const fill = useSurfaceFill();
  const room = height + gap;
  const at = edge === 'top' ? { top: 0 } : { bottom: 0 };
  const pinned = { position: 'absolute', left: 0, right: 0, ...at } as const;
  return (
    <View style={{ flex: 1 }}>
      <ScreenScrollView
        contentContainerStyle={
          room === 0
            ? undefined
            : { paddingTop: edge === 'top' ? room : 0, paddingBottom: edge === 'bottom' ? room : 0 }
        }
      >
        {children}
      </ScreenScrollView>
      {bar && height > 0 ? (
        <View pointerEvents="none" style={[pinned, { height: height * (1 + SCRIM_TAIL_RATIO) }]}>
          <EdgeScrim color={fill} edge={edge} opaqueFraction={1 / (1 + SCRIM_TAIL_RATIO)} />
        </View>
      ) : null}
      <View style={pinned} onLayout={(event) => setHeight(event.nativeEvent.layout.height)}>
        {view}
      </View>
    </View>
  );
}

const insets: ParityCase[] = inScreen([
  {
    name: 'a view pinned at the top of a scroll, with a gap',
    language: () =>
      toElement(
        L.ScrollView(L.Text('a'), L.Text('b')).safeAreaInset('top', L.Text('Filters'), 'sm'),
      ),
    bloom: () => (
      <Pinned edge="top" gap={space.sm} view={<Text>Filters</Text>}>
        <Text>a</Text>
        <Text>b</Text>
      </Pinned>
    ),
  },
  {
    name: 'a bar pinned at the bottom of a scroll, with its scrim',
    language: () =>
      toElement(L.ScrollView(L.Text('a')).safeAreaBar('bottom', L.Text('Composer').padding('md'))),
    bloom: () => (
      <Pinned
        edge="bottom"
        bar
        view={
          <Text
            style={{
              paddingTop: space.md,
              paddingBottom: space.md,
              paddingStart: space.md,
              paddingEnd: space.md,
            }}
          >
            Composer
          </Text>
        }
      >
        <Text>a</Text>
      </Pinned>
    ),
  },
]);

export const SCREEN_CASES: ParityCase[] = [...scrollViews, ...insets, ...pageHeaders, ...screens];
