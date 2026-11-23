/**
 * A FAB beside the bottom bar is the bar's height, so the two read as one row (on a Pixel 8a the
 * 50 dp FAB stood shorter than the 58 dp bar); elsewhere it keeps its size's diameter.
 */
import { render } from '@testing-library/react-native';
import { StyleSheet, View } from 'react-native';

import { BottomBarBase } from '../bottom-bar/BottomBarBase';
import { Fab } from '../fab/Fab';
import { FAB_METRICS } from '../fab/constants';
import { createTabBar, createTabBarButton } from '../tab-bar/TabBarBase';
import { EXPANDED_HEIGHT } from '../tab-bar/shared';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

const Blur = () => null;
const Navigation = createTabBar(Blur);
const Item = createTabBarButton(() => <View style={{ width: 24, height: 24 }} />);
const items = ['home', 'search'].map((name) => ({ name, label: name, icon: null }));

function heightOf(testID: string, screen: ReturnType<typeof render>): unknown {
  return StyleSheet.flatten(screen.getByTestId(testID).props.style)?.height;
}

it('beside the bar, the FAB is the bar’s height', () => {
  const screen = render(
    <BloomThemeProvider mode="light">
      <BottomBarBase
        Navigation={Navigation}
        Item={Item}
        Blur={Blur}
        items={items}
        value="home"
        onValueChange={() => {}}
        action={<Fab icon={() => null} accessibilityLabel="Compose" testID="fab" />}
      />
    </BloomThemeProvider>,
  );
  expect(heightOf('fab', screen)).toBe(EXPANDED_HEIGHT);
});

it('on its own, the FAB keeps its size’s diameter', () => {
  const screen = render(
    <BloomThemeProvider mode="light">
      <Fab icon={() => null} accessibilityLabel="Compose" testID="fab" />
    </BloomThemeProvider>,
  );
  expect(heightOf('fab', screen)).toBe(FAB_METRICS.md.diameter);
});
