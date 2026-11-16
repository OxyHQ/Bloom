import { Text } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';
import { BottomBar } from '../bottom-bar';
import { BottomEdgeProvider, useBottomEdgeInset, useClaimBottomEdge } from '../layout/bottom-edge';
import { Screen, ScreenScrollView } from '../screen';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { resolvedStyle } from './support/rendered-style';

const items = [{ name: 'library', label: 'Library', icon: null }];

function OuterNavigation({ height }: { height: number }) {
  useClaimBottomEdge(height);
  return null;
}

function EdgeReader() {
  return <Text testID="edge">{useBottomEdgeInset()}</Text>;
}

it.each([0, 32, 96])(
  'reserves a Screen-owned BottomBar once above an outer edge of %i',
  (outer) => {
    const tree = render(
      <BloomThemeProvider fonts={false}>
        <BottomEdgeProvider>
          <OuterNavigation height={outer} />
          <EdgeReader />
          <Screen
            testID="screen"
            scroll="content"
            bottomBar={<BottomBar items={items} value="library" onValueChange={() => {}} />}
          >
            <ScreenScrollView testID="scroll" />
          </Screen>
        </BottomEdgeProvider>
      </BloomThemeProvider>,
    );
    fireEvent(tree.getByTestId('screen-bottom'), 'layout', {
      nativeEvent: { layout: { height: 74 } },
    });
    expect(tree.getByTestId('edge').props.children).toBe(outer);
    expect(resolvedStyle(tree.getByTestId('screen-bottom').props.style).bottom).toBe(outer);
    expect(
      resolvedStyle(tree.getByTestId('scroll').props.contentContainerStyle).paddingBottom,
    ).toBe(74 + outer + 16);
  },
);

it('still publishes the footprint of an independently positioned BottomBar', () => {
  const tree = render(
    <BloomThemeProvider fonts={false}>
      <BottomEdgeProvider>
        <EdgeReader />
        <BottomBar testID="bar" items={items} value="library" onValueChange={() => {}} />
      </BottomEdgeProvider>
    </BloomThemeProvider>,
  );
  const height = resolvedStyle(tree.getByTestId('bar').props.style).height;
  expect(height).toBeGreaterThan(0);
  expect(tree.getByTestId('edge').props.children).toBe(height);
});
