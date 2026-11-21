import { RefreshControl } from 'react-native';
import { PageHeader } from '@oxy.so/bloom/page-header';
import { Screen, ScreenScrollView } from '@oxy.so/bloom/screen';
import { tokens } from '@oxy.so/bloom/styles';
import { Text } from '@oxy.so/bloom/typography';

import { ENUMS } from '../src/generated/spec.generated';
import * as L from '../src/primitives';
import { toElement } from '../src/render';
import { ScreenHost } from '../src/router/screen-host';
import type { ParityCase } from './support/cases';

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
    name: 'pull to refresh',
    language: () => toElement(L.ScrollView(L.Text('a')).refreshable(noop)),
    bloom: () => (
      <ScreenScrollView refreshControl={<RefreshControl refreshing={false} onRefresh={noop} />}>
        <Text>a</Text>
      </ScreenScrollView>
    ),
  },
]);

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
];

export const SCREEN_CASES: ParityCase[] = [...scrollViews, ...screens];
