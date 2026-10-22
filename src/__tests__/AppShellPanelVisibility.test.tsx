import { useEffect } from 'react';
import { render } from '@testing-library/react-native';
import { Platform, StyleSheet, Text } from 'react-native';
import { AppShellPanelVisibility } from '../app-shell/AppShellPanelVisibility';
import { AppShellPanelContext } from '../app-shell/context';

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
