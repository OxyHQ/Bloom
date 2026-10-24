import { Text } from 'react-native';
import { render } from '@testing-library/react-native';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { SurfaceLevelProvider } from '../styles/surface-levels';
import { stackSceneLayout } from '../panel-routing/expo-router';
import { resolvedStyle } from './support/rendered-style';
import { Screen, useScreen } from '../screen';

let mockFocused = true;
jest.mock('expo-router', () => ({ useIsFocused: () => mockFocused }));

it("paints the panel's fill and hides every scene but the top one from screen readers", () => {
  const ui = () => (
    <BloomThemeProvider fonts={false}>
      <SurfaceLevelProvider level={1} fill="#123456">
        {stackSceneLayout({ children: <Text>Post</Text> })}
      </SurfaceLevelProvider>
    </BloomThemeProvider>
  );
  const tree = render(ui());
  const scene = () => tree.getByText('Post', { includeHiddenElements: true }).parent!.parent!;
  expect(resolvedStyle(scene().props.style).backgroundColor).toBe('#123456');
  expect(scene().props.accessibilityElementsHidden).toBe(false);
  mockFocused = false;
  tree.rerender(ui());
  expect(scene().props.accessibilityElementsHidden).toBe(true);
  expect(scene().props.importantForAccessibility).toBe('no-hide-descendants');
});

it('makes the screens of a covered scene inactive', () => {
  let active: boolean | undefined;
  function Probe() {
    active = useScreen().active;
    return null;
  }
  const ui = () => (
    <BloomThemeProvider fonts={false}>
      {stackSceneLayout({
        children: (
          <Screen scroll="none">
            <Probe />
          </Screen>
        ),
      })}
    </BloomThemeProvider>
  );
  mockFocused = true;
  const tree = render(ui());
  expect(active).toBe(true);
  mockFocused = false;
  tree.rerender(ui());
  expect(active).toBe(false);
});
