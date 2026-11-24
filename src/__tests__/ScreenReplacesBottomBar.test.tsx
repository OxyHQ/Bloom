import { Text } from 'react-native';
import { render } from '@testing-library/react-native';
import { BottomBar } from '../bottom-bar';
import { BottomEdgeProvider, useBottomEdgeInset } from '../layout/bottom-edge';
import { Screen, ScreenScrollView } from '../screen';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { resolvedStyle } from './support/rendered-style';

const items = [{ name: 'home', label: 'Home', icon: null }];

function EdgeReader() {
  return <Text testID="edge">{useBottomEdgeInset()}</Text>;
}

/** The app's bar, and a pushed screen whose own bar replaces it while it is in front. */
function App({ active, replaces = true }: { active: boolean; replaces?: boolean }) {
  return (
    <BloomThemeProvider fonts={false}>
      <BottomEdgeProvider>
        <BottomBar testID="app-bar" items={items} value="home" onValueChange={() => {}} />
        <EdgeReader />
        <Screen
          testID="post"
          scroll="content"
          active={active}
          replacesBottomBar={replaces}
          bottomBar={
            <BottomBar testID="own-bar" items={items} value="home" onValueChange={() => {}} />
          }
        >
          <ScreenScrollView testID="scroll" />
        </Screen>
      </BottomEdgeProvider>
    </BloomThemeProvider>
  );
}

const hidden = { includeHiddenElements: true };

it('hides the app bar while the screen whose bar replaces it is in front, keeping it mounted', () => {
  const tree = render(<App active />);
  // The take lands in the layout phase; the jest mapper reads it on the next render.
  tree.rerender(<App active />);
  const bar = tree.getByTestId('app-bar', hidden);
  const style = resolvedStyle(bar.props.style);
  expect(style.opacity).toBe(0);
  expect(style.transform).toEqual([{ translateY: style.height }]);
  expect(bar.props.pointerEvents).toBe('none');
  expect(bar.props.importantForAccessibility).toBe('no-hide-descendants');
  // The screen's own bar is not the app's: it stays.
  expect(resolvedStyle(tree.getByTestId('own-bar').props.style).opacity).toBe(1);
});

it('keeps the app bar’s claim for the screens it covers, and sits the screen on the window edge', () => {
  const tree = render(<App active />);
  const claim = Number(tree.getByTestId('edge').props.children);
  expect(claim).toBeGreaterThan(0);
  expect(resolvedStyle(tree.getByTestId('post-bottom').props.style).bottom).toBe(0);
});

it('gives the bar back when the screen is no longer in front', () => {
  const tree = render(<App active />);
  tree.rerender(<App active={false} />);
  tree.rerender(<App active={false} />);
  const bar = tree.getByTestId('app-bar');
  expect(resolvedStyle(bar.props.style).opacity).toBe(1);
  expect(bar.props.pointerEvents).toBe('box-none');
});

it('stacks a screen that does not replace the bar on it, and leaves the bar shown', () => {
  const tree = render(<App active replaces={false} />);
  tree.rerender(<App active replaces={false} />);
  const claim = Number(tree.getByTestId('edge').props.children);
  expect(resolvedStyle(tree.getByTestId('app-bar').props.style).opacity).toBe(1);
  expect(resolvedStyle(tree.getByTestId('post-bottom').props.style).bottom).toBe(claim);
});
