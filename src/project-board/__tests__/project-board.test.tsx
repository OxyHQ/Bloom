import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { BloomThemeProvider } from '../../theme/BloomThemeProvider';
import { ProjectBoard } from '../ProjectBoard';
import { cloneColumns, dropTarget, moveTicket, sortColumns } from '../shared';
import type { ProjectColumn } from '../types';

// Isolate the surface's content/imperative contract; overlay hit testing is a
// separate real-browser gate. Keep the board, fields, selects and menus real.
jest.mock('../../dialog', () => ({
  Dialog: (props: {
    children?: React.ReactNode;
    control?: { ref: { current: unknown } };
    onClose?: () => void;
  }) => {
    const React = require('react') as typeof import('react');
    React.useEffect(() => {
      if (props.control)
        props.control.ref.current = {
          open() {},
          close() {
            props.onClose?.();
          },
        };
    }, [props.control, props.onClose]);
    return <View>{props.children}</View>;
  },
}));
jest.mock('../../chart-cards/TokensChartCard', () => ({
  TokensChartCard: () => <View testID="ticket-token-chart" />,
}));
const columns: ProjectColumn[] = [
  {
    id: 'todo',
    title: 'To do',
    limit: 5,
    tickets: [
      {
        id: 'a',
        code: 'FE-1',
        area: 'Composer',
        title: 'Zebra title',
        since: 'Since today',
        priority: 'Low',
        project: 'Bloom',
        assignees: ['maya'],
        description: 'Original description',
      },
      {
        id: 'b',
        code: 'FE-2',
        area: 'Theme',
        title: 'Alpha title',
        since: 'Since yesterday',
        priority: 'Urgent',
        project: 'vibl',
        assignees: [],
      },
    ],
  },
  { id: 'done', title: 'Done', limit: 3, tickets: [] },
];
const members = { maya: { id: 'maya', name: 'Maya Chen', initials: 'MC' } };
function renderBoard(
  extra: Partial<React.ComponentProps<typeof ProjectBoard>> = {},
) {
  return render(
    <BloomThemeProvider colorPreset="teal" mode="light">
      <ProjectBoard
        initialColumns={columns}
        members={members}
        projects={['Bloom', 'vibl']}
        {...extra}
      />
    </BloomThemeProvider>,
  );
}

describe('ProjectBoard data transitions', () => {
  it('moves within and across columns without losing fields or mutating its source', () => {
    const reordered = moveTicket(columns, 'a', 'todo', 1);
    expect(reordered[0]?.tickets.map((ticket) => ticket.id)).toEqual([
      'b',
      'a',
    ]);
    const moved = moveTicket(reordered, 'a', 'done');
    expect(moved[0]?.tickets.map((ticket) => ticket.id)).toEqual(['b']);
    expect(moved[1]?.tickets[0]?.description).toBe('Original description');
    expect(columns[0]?.tickets.map((ticket) => ticket.id)).toEqual(['a', 'b']);
  });
  it('does not lose tickets on invalid destinations and clones mutable nested fields', () => {
    expect(moveTicket(columns, 'a', 'unknown')).toBe(columns);
    const copied = cloneColumns(columns);
    copied[0]?.tickets[0]?.assignees.push('someone');
    expect(columns[0]?.tickets[0]?.assignees).toEqual(['maya']);
  });
  it('sorts all priorities and titles with a stable manual order', () => {
    expect(
      sortColumns(columns, 'priority')[0]?.tickets.map((ticket) => ticket.id),
    ).toEqual(['b', 'a']);
    expect(
      sortColumns(columns, 'title')[0]?.tickets.map((ticket) => ticket.id),
    ).toEqual(['b', 'a']);
    expect(sortColumns(columns, 'manual')).toBe(columns);
  });
  it('chooses an empty column underneath the pointer instead of cards in an adjacent column', () => {
    const target = dropTarget(
      320,
      150,
      columns,
      {
        todo: { x: 0, y: 0, width: 273, height: 400 },
        done: { x: 281, y: 0, width: 273, height: 400 },
      },
      { a: { x: 6, y: 40, width: 261, height: 150 } },
      'a',
    );
    expect(target).toEqual({ columnId: 'done', index: 0 });
    expect(dropTarget(700, 50, columns, {}, {}, 'a')).toBeNull();
  });
});

describe('ProjectBoard interactions', () => {
  const previousFrame = global.requestAnimationFrame;
  beforeAll(() => {
    global.requestAnimationFrame = (callback) => {
      callback(0);
      return 0;
    };
  });
  afterAll(() => {
    global.requestAnimationFrame = previousFrame;
  });
  it('keeps the complete ticket layout and empty column illustration', () => {
    const screen = renderBoard();
    expect(screen.getByText('Zebra title')).toBeTruthy();
    expect(screen.getByText('Alpha title')).toBeTruthy();
    expect(screen.getByText('No issues here')).toBeTruthy();
    expect(screen.getByLabelText('Open FE-1: Zebra title')).toBeTruthy();
  });
  it('creates a ticket using the selected destination and calls the data callback', () => {
    const onColumnsChange = jest.fn();
    const screen = renderBoard({ onColumnsChange });
    fireEvent.press(screen.getByLabelText('Add ticket to Done'));
    fireEvent.changeText(screen.getByLabelText('Ticket title'), '  New task  ');
    fireEvent.changeText(
      screen.getByLabelText('Description'),
      '  Task context  ',
    );
    fireEvent.press(screen.getByTestId('project-board-create-submit'));
    const next = onColumnsChange.mock.calls.slice(
      -1,
    )[0]?.[0] as ProjectColumn[];
    expect(next[1]?.tickets[0]).toMatchObject({
      title: 'New task',
      description: 'Task context',
      priority: 'Low',
      project: 'Bloom',
      assignees: [],
    });
    expect(screen.getByText('New task')).toBeTruthy();
  });
  it('keeps the create surface open when create-more is enabled', () => {
    const onColumnsChange = jest.fn();
    const screen = renderBoard({ onColumnsChange });
    fireEvent.press(screen.getByLabelText('Add ticket to To do'));
    fireEvent.press(screen.getByLabelText('Keep creating'));
    fireEvent.changeText(screen.getByLabelText('Ticket title'), 'One');
    fireEvent.press(screen.getByTestId('project-board-create-submit'));
    expect(screen.getByLabelText('Ticket title').props.value).toBe('');
    fireEvent.changeText(screen.getByLabelText('Ticket title'), 'Two');
    fireEvent.press(screen.getByTestId('project-board-create-submit'));
    const next = onColumnsChange.mock.calls.slice(
      -1,
    )[0]?.[0] as ProjectColumn[];
    expect(next[0]?.tickets.slice(0, 2).map((ticket) => ticket.title)).toEqual([
      'Two',
      'One',
    ]);
  });
  it('puts a long native creation form inside a bounded scroll view that keeps submit taps', () => {
    const previousOS = Platform.OS;
    Platform.OS = 'ios';
    try {
      const screen = renderBoard();
      fireEvent.press(screen.getByLabelText('Add ticket to To do'));
      const scroll = screen.getByTestId('project-board-create-scroll');
      expect(StyleSheet.flatten(scroll.props.style).maxHeight).toBeGreaterThan(0);
      expect(scroll.props.keyboardShouldPersistTaps).toBe('handled');
      expect(StyleSheet.flatten(scroll.props.contentContainerStyle).padding).toBe(16);
      fireEvent.changeText(screen.getByLabelText('Ticket title'), 'Long task');
      fireEvent.changeText(screen.getByLabelText('Description'), Array(40).fill('Context line').join('\n'));
      fireEvent.press(screen.getByTestId('project-board-create-submit'));
      expect(screen.getByText('Long task')).toBeTruthy();
      screen.unmount();
    } finally {
      Platform.OS = previousOS;
    }
  });
  it('opens details, toggles favorites and posts trimmed comments', () => {
    const onColumnsChange = jest.fn();
    const onTicketOpen = jest.fn();
    const screen = renderBoard({ onColumnsChange, onTicketOpen });
    fireEvent.press(screen.getByLabelText('Open FE-1: Zebra title'));
    expect(onTicketOpen).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'a' }),
    );
    expect(screen.getByText('Original description')).toBeTruthy();
    fireEvent.press(screen.getByLabelText('Add to favorites'));
    fireEvent.changeText(
      screen.getByLabelText('Add a comment'),
      '  Reviewed with the team  ',
    );
    fireEvent.press(screen.getByLabelText('Post comment'));
    const next = onColumnsChange.mock.calls.slice(
      -1,
    )[0]?.[0] as ProjectColumn[];
    expect(next[0]?.tickets[0]?.isFavorite).toBe(true);
    expect(next[0]?.tickets[0]?.comments?.[0]).toMatchObject({
      author: 'you',
      body: 'Reviewed with the team',
    });
    expect(screen.getByText('Reviewed with the team')).toBeTruthy();
  });
  it('moves with native accessibility actions while preserving every ticket', () => {
    const onColumnsChange = jest.fn();
    const screen = renderBoard({ onColumnsChange });
    fireEvent(
      screen.getByLabelText('Open FE-1: Zebra title'),
      'accessibilityAction',
      { nativeEvent: { actionName: 'nextColumn' } },
    );
    const next = onColumnsChange.mock.calls.slice(
      -1,
    )[0]?.[0] as ProjectColumn[];
    expect(next[0]?.tickets.map((ticket) => ticket.id)).toEqual(['b']);
    expect(next[1]?.tickets.map((ticket) => ticket.id)).toEqual(['a']);
    expect(next.flatMap((column) => column.tickets)).toHaveLength(2);
  });
  it('renders supplied resources and token history without generating fake activity', () => {
    const data = cloneColumns(columns);
    const ticket = data[0]?.tickets[0];
    if (!ticket) throw new Error('Missing fixture');
    ticket.tokenUsage = { data: [{ label: 'Today', value: 2 }], headline: 2 };
    ticket.resources = [{ label: 'react.dev', href: 'https://react.dev' }];
    const screen = renderBoard({ initialColumns: data, initialTicketId: 'a' });
    expect(screen.getByTestId('ticket-token-chart')).toBeTruthy();
    expect(screen.getByText('react.dev')).toBeTruthy();
    expect(screen.queryByText('2 hours ago')).toBeNull();
  });
  it('leaves columns empty by default and disables creation without a destination', () => {
    const screen = renderBoard({ initialColumns: [] });
    expect(screen.queryByText('Zebra title')).toBeNull();
    expect(screen.getByText('New ticket')).toBeTruthy();
  });
});
