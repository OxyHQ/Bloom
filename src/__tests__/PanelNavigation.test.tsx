import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import {
  PanelNavigation,
  normalizePanelHistory,
  usePanelNavigation,
  useOptionalPanelNavigation,
} from '../app-shell/PanelNavigation';
import { useScrollRestorationContext } from '../scroll/context';
import type { PanelNavigationOptions } from '../app-shell/panel-layout-types';
function Page() {
  const nav = usePanelNavigation();
  const { adapter } = useScrollRestorationContext();
  const id = adapter.useScreenContentId();
  return (
    <View>
      <Text testID="route">{nav.entry.name}</Text>
      <Text testID="id">{id}</Text>
      <Pressable testID="push" onPress={() => nav.push({ name: 'detail' })} />
      <Pressable testID="back" onPress={nav.back} />
      <Pressable testID="forward" onPress={nav.forward} />
      <Pressable testID="replace" onPress={() => nav.replace({ name: 'replacement' })} />
    </View>
  );
}
const options: PanelNavigationOptions = {
  initialEntries: [{ key: 'home', name: 'home' }],
  render: () => <Page />,
};
describe('independent panel histories', () => {
  it('offers a null-safe adapter hook outside panels', () => {
    function Probe() {
      const nav = useOptionalPanelNavigation();
      return <Text>{nav?.entry.name ?? 'outside'}</Text>;
    }
    const screen = render(
      <View>
        <Probe />
        <PanelNavigation id="one" active options={{ ...options, render: () => <Probe /> }} />
      </View>,
    );
    expect(screen.getByText('outside')).toBeTruthy();
    expect(screen.getByText('home')).toBeTruthy();
  });
  it('pushes, backs, forwards and replaces without touching another panel', () => {
    const screen = render(
      <View>
        <PanelNavigation id="left" active options={options} />
        <PanelNavigation id="right" active options={options} />
      </View>,
    );
    expect(screen.getAllByTestId('id').map((n) => n.props.children)).toEqual([
      'left:home',
      'right:home',
    ]);
    fireEvent.press(screen.getAllByTestId('push')[0]!);
    expect(screen.getAllByTestId('route').map((n) => n.props.children)).toEqual(['detail', 'home']);
    fireEvent.press(screen.getAllByTestId('back')[0]!);
    expect(screen.getAllByTestId('route')[0]!.props.children).toBe('home');
    fireEvent.press(screen.getAllByTestId('forward')[0]!);
    expect(screen.getAllByTestId('route')[0]!.props.children).toBe('detail');
    fireEvent.press(screen.getAllByTestId('replace')[0]!);
    expect(screen.getAllByTestId('route')[0]!.props.children).toBe('replacement');
  });
  it('reports controlled navigation without mutating controlled state', () => {
    const onNavigationChange = jest.fn();
    const screen = render(
      <PanelNavigation
        id="one"
        active
        options={{
          ...options,
          state: { entries: options.initialEntries, index: 0 },
          onNavigationChange,
        }}
      />,
    );
    fireEvent.press(screen.getByTestId('push'));
    expect(screen.getByTestId('route').props.children).toBe('home');
    expect(onNavigationChange.mock.calls[0][0].entries).toHaveLength(2);
  });
  it('does not run focus effects while hidden', () => {
    const focus = jest.fn(() => undefined);
    function Focus() {
      const { adapter } = useScrollRestorationContext();
      adapter.useScreenFocusEffect(focus);
      return null;
    }
    const renderOptions = { ...options, render: () => <Focus /> };
    const screen = render(<PanelNavigation id="one" active={false} options={renderOptions} />);
    expect(focus).not.toHaveBeenCalled();
    screen.rerender(<PanelNavigation id="one" active options={renderOptions} />);
    expect(focus).toHaveBeenCalledTimes(1);
    screen.rerender(<PanelNavigation id="one" active={false} options={renderOptions} />);
    expect(focus).toHaveBeenCalledTimes(1);
  });
  it('does not reuse an initial key when generating history entries', () => {
    const screen = render(
      <PanelNavigation
        id="one"
        active
        options={{ ...options, initialEntries: [{ key: 'one-1', name: 'home' }] }}
      />,
    );
    fireEvent.press(screen.getByTestId('push'));
    expect(screen.getByTestId('id').props.children).toBe('one:one-2');
    screen.rerender(<PanelNavigation id="one" active={false} options={options} />);
    expect(screen.getByTestId('id').props.children).toBeNull();
  });
  it('rejects duplicate history keys and bounds an invalid index', () => {
    expect(() =>
      normalizePanelHistory({
        entries: [
          { key: 'x', name: 'a' },
          { key: 'x', name: 'b' },
        ],
        index: 0,
      }),
    ).toThrow('unique');
    expect(normalizePanelHistory({ entries: options.initialEntries, index: 99 }).index).toBe(0);
    expect(normalizePanelHistory({ entries: options.initialEntries, index: NaN }).index).toBe(0);
  });
});
