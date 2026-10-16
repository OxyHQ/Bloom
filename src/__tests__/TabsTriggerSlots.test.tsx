/**
 * `TabsTrigger`'s `trailing` slot and `onLongPress`, and the panel-less strip.
 *
 * A view strip (a database's views) needs each tab to carry its own settings
 * button and a long-press menu, and switches what is shown somewhere else
 * entirely. The settings button must be the tab's SIBLING: nested inside the
 * tab's press target, pressing it would also select the tab, and on web it
 * would be a button inside a button.
 */
import React from 'react';
import { Pressable, Text } from 'react-native';
import type { ReactTestInstance } from 'react-test-renderer';
import { fireEvent, render } from '@testing-library/react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { Tabs, TabsTrigger } from '../tabs';

function renderWithTheme(ui: React.ReactElement) {
  return render(
    <BloomThemeProvider mode="light" colorPreset="teal">
      {ui}
    </BloomThemeProvider>,
  );
}

function tabFor(node: ReactTestInstance): ReactTestInstance {
  let current: ReactTestInstance | null = node;
  while (current && current.props?.accessibilityRole !== 'tab') current = current.parent;
  if (!current) throw new Error('No trigger ancestor with role "tab" found');
  return current;
}

function contains(ancestor: ReactTestInstance, node: ReactTestInstance): boolean {
  for (let current: ReactTestInstance | null = node; current; current = current.parent) {
    if (current === ancestor) return true;
  }
  return false;
}

describe('TabsTrigger trailing', () => {
  function Strip({
    onValueChange,
    onSettings,
    disabled,
  }: {
    onValueChange: (value: string) => void;
    onSettings: () => void;
    disabled?: boolean;
  }) {
    return (
      <Tabs value="a" onValueChange={onValueChange} variant="filled">
        <TabsTrigger value="a" label="Table" />
        <TabsTrigger
          value="b"
          label="Board"
          disabled={disabled}
          trailing={
            <Pressable testID="settings" accessibilityRole="button" onPress={onSettings}>
              <Text>Settings</Text>
            </Pressable>
          }
        />
      </Tabs>
    );
  }

  it('renders the node beside the tab, outside its press target', () => {
    const { getByText, getByTestId } = renderWithTheme(
      <Strip onValueChange={() => {}} onSettings={() => {}} />,
    );
    const tab = tabFor(getByText('Board'));
    const settings = getByTestId('settings');
    expect(contains(tab, settings)).toBe(false);
    // Both live in the one measured wrapper, so the strip's pill spans them.
    expect(tab.parent).not.toBeNull();
    let wrapper: ReactTestInstance | null = tab;
    while (wrapper && !wrapper.props.onLayout) wrapper = wrapper.parent;
    expect(wrapper).not.toBeNull();
    expect(contains(wrapper!, settings)).toBe(true);
  });

  it('pressing the trailing node runs its own handler and does not select the tab', () => {
    const onValueChange = jest.fn();
    const onSettings = jest.fn();
    const { getByTestId, getByText } = renderWithTheme(
      <Strip onValueChange={onValueChange} onSettings={onSettings} />,
    );
    fireEvent.press(getByTestId('settings'));
    expect(onSettings).toHaveBeenCalledTimes(1);
    expect(onValueChange).not.toHaveBeenCalled();
    // The tab itself still selects.
    fireEvent.press(getByText('Board'));
    expect(onValueChange).toHaveBeenCalledWith('b');
  });

  it('gives the press target the gap before the node instead of its own right padding', () => {
    const { getByText } = renderWithTheme(<Strip onValueChange={() => {}} onSettings={() => {}} />);
    const style = (node: ReactTestInstance) =>
      Object.assign({}, ...[node.props.style].flat(Infinity).filter(Boolean));
    expect(style(tabFor(getByText('Board'))).paddingRight).toBe(4);
    expect(style(tabFor(getByText('Table'))).paddingRight).toBe(8);
  });

  it('dims the trailing node with a disabled tab', () => {
    const { getByTestId } = renderWithTheme(
      <Strip onValueChange={() => {}} onSettings={() => {}} disabled />,
    );
    const slot = getByTestId('settings').parent!;
    let host: ReactTestInstance | null = slot;
    while (host && !host.props.style) host = host.parent;
    expect(Object.assign({}, ...[host!.props.style].flat(Infinity).filter(Boolean)).opacity).toBe(
      0.5,
    );
  });
});

describe('TabsTrigger onLongPress', () => {
  it('calls onLongPress with the event and does not select the tab', () => {
    const onValueChange = jest.fn();
    const onLongPress = jest.fn();
    const { getByText } = renderWithTheme(
      <Tabs value="a" onValueChange={onValueChange}>
        <TabsTrigger value="a" label="Table" />
        <TabsTrigger value="b" label="Board" onLongPress={onLongPress} />
      </Tabs>,
    );
    const tab = tabFor(getByText('Board'));
    expect(typeof tab.props.onLongPress).toBe('function');
    fireEvent(tab, 'longPress', { nativeEvent: {} });
    expect(onLongPress).toHaveBeenCalledTimes(1);
    expect(onLongPress.mock.calls[0]![0]).toEqual({ nativeEvent: {} });
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('a disabled tab installs no long-press handler', () => {
    const { getByText } = renderWithTheme(
      <Tabs value="a" onValueChange={() => {}}>
        <TabsTrigger value="a" label="Table" />
        <TabsTrigger value="b" label="Board" disabled onLongPress={() => {}} />
      </Tabs>,
    );
    expect(tabFor(getByText('Board')).props.onLongPress).toBeUndefined();
  });
});

describe('a strip without panels', () => {
  it('is Tabs with triggers alone: it selects and reports, with no TabsContent', () => {
    const onValueChange = jest.fn();
    function ViewStrip() {
      const [value, setValue] = React.useState('table');
      return (
        <>
          <Tabs
            value={value}
            onValueChange={(next) => {
              onValueChange(next);
              setValue(next);
            }}
          >
            <TabsTrigger value="table" label="Table" />
            <TabsTrigger value="board" label="Board" />
          </Tabs>
          {/* The view is switched outside the strip, keyed on the same value. */}
          <Text>{`Showing ${value}`}</Text>
        </>
      );
    }
    const { getByText } = renderWithTheme(<ViewStrip />);
    expect(tabFor(getByText('Table')).props['aria-selected']).toBe(true);
    fireEvent.press(getByText('Board'));
    expect(onValueChange).toHaveBeenCalledWith('board');
    expect(getByText('Showing board')).toBeTruthy();
    expect(tabFor(getByText('Board')).props['aria-selected']).toBe(true);
  });

  it('a bare trigger outside Tabs says how to render the panel-less strip', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderWithTheme(<TabsTrigger value="a" label="First" />)).toThrow(
      /TabsContent is optional.*<Tabs value=\{…\} onValueChange=\{…\}> with TabsTrigger children/,
    );
    spy.mockRestore();
  });
});
