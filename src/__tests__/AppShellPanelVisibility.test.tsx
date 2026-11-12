import { useEffect } from 'react';
import { render } from '@testing-library/react-native';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { AppShellPanelVisibility } from '../app-shell/AppShellPanelVisibility';
import { AppShellPanelContext } from '../app-shell/context';
import { BloomScope } from '../appearance';
import { Button } from '../button';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

it.each(['alone', 'multiple'] as const)(
  'uses native compositor state for %s without unmounting children',
  (when) => {
    expect(Platform.OS).not.toBe('web');
    const mount = jest.fn();
    const unmount = jest.fn();
    function Child() {
      useEffect(() => {
        mount();
        return unmount;
      }, []);
      return <Text>Header</Text>;
    }
    const fixture = (alone: boolean) => (
      <AppShellPanelContext.Provider value={{ alone, framed: true }}>
        <AppShellPanelVisibility testID="conditional" when={when} style={{ padding: 12 }}>
          <Child />
        </AppShellPanelVisibility>
      </AppShellPanelContext.Provider>
    );
    const screen = render(fixture(true));
    expect(
      StyleSheet.flatten(
        screen.getByTestId('conditional', { includeHiddenElements: true }).props.style,
      ),
    ).toMatchObject({
      display: when === 'alone' ? 'flex' : 'none',
      padding: 12,
    });
    screen.rerender(fixture(false));
    expect(
      StyleSheet.flatten(
        screen.getByTestId('conditional', { includeHiddenElements: true }).props.style,
      ),
    ).toMatchObject({
      display: when === 'alone' ? 'none' : 'flex',
      padding: 12,
    });
    expect(mount).toHaveBeenCalledTimes(1);
    expect(unmount).not.toHaveBeenCalled();
  },
);

it.each([
  { name: 'default md', sizes: [], height: 36 },
  { name: 'xs', sizes: ['xs'], height: 24 },
  { name: 'sm', sizes: ['sm'], height: 32 },
  { name: 'md', sizes: ['md'], height: 36 },
  { name: 'lg', sizes: ['lg'], height: 44 },
  { name: 'nested lg over xs', sizes: ['xs', 'lg'], height: 44 },
] as const)('preserves child Button scope through its wrapper ($name)', ({ sizes, height }) => {
  const content = (
    <AppShellPanelContext.Provider value={{ alone: true, framed: true }}>
      <AppShellPanelVisibility testID="visibility" when="alone">
        <View>
          <Button testID="child-button">
            <Text>Continue</Text>
          </Button>
        </View>
      </AppShellPanelVisibility>
    </AppShellPanelContext.Provider>
  );
  const scoped = [...sizes].reverse().reduce(
    (children, size) => (
      <BloomScope key={size} size={size}>
        {children}
      </BloomScope>
    ),
    content,
  );
  const screen = render(
    <BloomThemeProvider mode="light" colorPreset="teal">
      {scoped}
    </BloomThemeProvider>,
  );
  expect(StyleSheet.flatten(screen.getByTestId('child-button').props.style).height).toBe(height);
});
