import React, { useState } from 'react';
import { Text, Pressable } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';
import { Sidebar, SidebarItem, SidebarToolbar } from '../sidebar';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { ContextMenu, ContextMenuTrigger } from '../context-menu';
import { pressHost } from './support/press-host';

const scope = (node: React.ReactNode) => (
  <BloomThemeProvider fonts={false}>{node}</BloomThemeProvider>
);
const priorFrame = global.requestAnimationFrame;
const priorCancel = global.cancelAnimationFrame;
beforeAll(() => {
  global.requestAnimationFrame = jest.fn(() => 0);
  global.cancelAnimationFrame = jest.fn();
});
afterAll(() => {
  global.requestAnimationFrame = priorFrame;
  global.cancelAnimationFrame = priorCancel;
});

it('expands controlled search, filters app content, clears it on close and removes adjacent actions from accessibility', () => {
  function Fixture() {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    return (
      <Sidebar
        testID="sidebar"
        showSearch={false}
        showThemeToggle={false}
        header={
          <SidebarToolbar
            search={{
              open,
              onOpenChange: setOpen,
              value: query,
              onValueChange: setQuery,
              accessibilityLabel: 'Find conversations',
              closeLabel: 'Close search',
            }}
            actions={[
              <Pressable key="new" accessibilityLabel="New conversation">
                <Text>New</Text>
              </Pressable>,
            ]}
          />
        }
        content={
          <Text>{'Security'.includes(query) ? 'Security' : 'No matches'}</Text>
        }
      />
    );
  }
  const screen = render(scope(<Fixture />));
  expect(screen.getByLabelText('New conversation')).toBeTruthy();
  pressHost(screen.getByLabelText('Find conversations'));
  expect(screen.queryByLabelText('New conversation')).toBeNull();
  fireEvent.changeText(screen.getByLabelText('Find conversations'), 'missing');
  expect(screen.getByText('No matches')).toBeTruthy();
  pressHost(screen.getByLabelText('Close search'));
  expect(screen.getByText('Security')).toBeTruthy();
  expect(screen.getByLabelText('New conversation')).toBeTruthy();
});

it('keeps a custom header outside the destination scroll and preserves it across collapse', () => {
  const screen = render(
    scope(
      <Sidebar
        testID="nav"
        showSearch={false}
        showThemeToggle={false}
        header={({ collapsed }) => (
          <Text>{collapsed ? 'Compact header' : 'Expanded header'}</Text>
        )}
        content={<Text>Conversation</Text>}
      />,
    ),
  );
  for (
    let node = screen.getByText('Expanded header').parent;
    node;
    node = node.parent
  )
    expect(node.props.testID).not.toBe('nav-scroll');
  expect(screen.queryByLabelText('Collapse sidebar')).toBeNull();
  screen.rerender(
    scope(
      <Sidebar
        testID="nav"
        collapsed
        showSearch={false}
        showThemeToggle={false}
        header={({ collapsed }) => (
          <Text>{collapsed ? 'Compact header' : 'Expanded header'}</Text>
        )}
        content={<Text>Conversation</Text>}
      />,
    ),
  );
  expect(screen.getByText('Compact header')).toBeTruthy();
  expect(screen.queryByText('Conversation')).toBeNull();
});

it('composes a descriptive avatar row with native context-menu holds while ordinary presses still select it', () => {
  const select = jest.fn();
  const onOpenChange = jest.fn();
  const screen = render(
    scope(
      <ContextMenu onOpenChange={onOpenChange}>
        <ContextMenuTrigger asChild testID="context">
          <SidebarItem
            leading={<Text>Avatar</Text>}
            label="Security"
            description="Last response"
            selectedAppearance="neutral"
            selected
            onPress={select}
          />
        </ContextMenuTrigger>
      </ContextMenu>,
    ),
  );
  pressHost(screen.getByLabelText('Security'));
  expect(select).toHaveBeenCalledTimes(1);
  expect(onOpenChange).not.toHaveBeenCalled();
  const trigger = screen.getByLabelText('Security');
  expect(typeof trigger.props.onLongPress).toBe('function');
  fireEvent(trigger, 'longPress', {
    nativeEvent: { pageX: 20, pageY: 20, touches: [{}] },
  });
  expect(onOpenChange).toHaveBeenCalledWith(true);
  expect(select).toHaveBeenCalledTimes(1);
  expect(screen.getByText('Last response')).toBeTruthy();
});
