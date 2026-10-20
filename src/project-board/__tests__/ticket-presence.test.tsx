import React from 'react';
import { act, render } from '@testing-library/react-native';
import { Text, View } from 'react-native';
import { StyledView } from '../../styles/styled-primitives';
import { BoardPresenceList } from '../BoardPresence';
import type { ProjectTicket } from '../types';

const ticket: ProjectTicket = {
  id: 'a',
  code: 'A-1',
  title: 'Retained ticket',
  area: 'Product',
  since: 'Now',
  priority: 'Low',
  project: 'Product',
  assignees: [],
};
function Fixture({ tickets, retainId }: { tickets: ProjectTicket[]; retainId?: string }) {
  return (
    <BoardPresenceList items={tickets} getItemId={(item) => item.id} retainId={retainId}>
      {({ item: entry, present }) => (
        <View>
          <Text>{`${present ? 'active' : 'ghost'}-${entry.id}`}</Text>
        </View>
      )}
    </BoardPresenceList>
  );
}
beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

it('keeps the gesture owner alive beyond its visual exit until a long drag ends', () => {
  const screen = render(<Fixture tickets={[ticket]} retainId="a" />);
  screen.rerender(<Fixture tickets={[]} retainId="a" />);
  act(() => jest.advanceTimersByTime(1200));
  expect(screen.getByText('ghost-a', { includeHiddenElements: true })).toBeTruthy();
  const retained = screen
    .UNSAFE_getAllByType(StyledView)
    .find((node) => node.props.accessibilityElementsHidden);
  expect(retained?.props.pointerEvents).toBe('auto');
  expect(retained?.props.inert).toBeUndefined();
  screen.rerender(<Fixture tickets={[]} />);
  act(() => jest.advanceTimersByTime(319));
  expect(screen.getByText('ghost-a', { includeHiddenElements: true })).toBeTruthy();
  act(() => jest.advanceTimersByTime(1));
  expect(screen.queryByText('ghost-a', { includeHiddenElements: true })).toBeNull();
});

it('revives a filtered ticket during its exit without leaving an obsolete ghost', () => {
  const screen = render(<Fixture tickets={[ticket]} />);
  screen.rerender(<Fixture tickets={[]} />);
  act(() => jest.advanceTimersByTime(100));
  screen.rerender(<Fixture tickets={[ticket]} />);
  act(() => jest.advanceTimersByTime(1000));
  expect(screen.getAllByText('active-a')).toHaveLength(1);
  expect(screen.queryByText('ghost-a', { includeHiddenElements: true })).toBeNull();
});
