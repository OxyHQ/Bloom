import { Text } from 'react-native';
import { act, render } from '@testing-library/react-native';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { SurfaceLevelProvider } from '../styles/surface-levels';
import { stackSceneLayout } from '../panel-routing/expo-router';
import { resolvedStyle } from './support/rendered-style';
import { Screen, useScreen, useScreenEntered } from '../screen';

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
  // The scene is the nearest host above the text that paints a fill.
  const scene = () => {
    let node = tree.getByText('Post', { includeHiddenElements: true }).parent;
    while (node && !resolvedStyle(node.props.style).backgroundColor) node = node.parent;
    return node!;
  };
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

describe('a pushed scene', () => {
  function sceneNavigation(routes: string[]) {
    const listeners = new Set<(event: { data?: { closing?: boolean } }) => void>();
    return {
      navigation: {
        getState: () => ({ index: routes.length - 1, routes: routes.map((key) => ({ key })) }),
        addListener: (
          _type: 'transitionEnd',
          listener: (event: { data?: { closing?: boolean } }) => void,
        ) => {
          listeners.add(listener);
          return () => listeners.delete(listener);
        },
      },
      emit: (closing: boolean) => {
        for (const listener of listeners) listener({ data: { closing } });
      },
    };
  }
  let entered: boolean | undefined;
  function Probe() {
    entered = useScreenEntered();
    return null;
  }
  const ui = (navigation: ReturnType<typeof sceneNavigation>['navigation'], key: string) => (
    <BloomThemeProvider fonts={false}>
      {stackSceneLayout({ children: <Probe />, navigation, route: { key } })}
    </BloomThemeProvider>
  );

  beforeEach(() => {
    mockFocused = true;
  });

  it('has entered once its push transition ends, not before', () => {
    const { navigation, emit } = sceneNavigation(['tabs', 'post']);
    render(ui(navigation, 'post'));
    expect(entered).toBe(false);
    act(() => emit(true));
    expect(entered).toBe(false);
    act(() => emit(false));
    expect(entered).toBe(true);
  });

  it('has not entered when the pushing render reads the state from before the push', () => {
    // The navigator's committed state, as the pushed scene's first render reads it.
    const { navigation, emit } = sceneNavigation(['tabs']);
    render(ui(navigation, 'post'));
    expect(entered).toBe(false);
    act(() => emit(false));
    expect(entered).toBe(true);
  });

  it('is there from the start when no push brought it in', () => {
    render(ui(sceneNavigation(['tabs']).navigation, 'tabs'));
    expect(entered).toBe(true);
    render(ui(sceneNavigation(['tabs', 'post']).navigation, 'tabs'));
    expect(entered).toBe(true);
  });

  it('is there from the start outside a stack', () => {
    render(<Probe />);
    expect(entered).toBe(true);
  });
});
