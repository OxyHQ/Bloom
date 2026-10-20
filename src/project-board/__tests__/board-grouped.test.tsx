import { fireEvent, render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { BloomThemeProvider } from '../../theme/BloomThemeProvider';
import { ProjectBoard } from '../ProjectBoard';
import { BoardDragHandle } from '../BoardGesture';
import type { ProjectBoardLane } from '../types';

type Item = { id: string; title: string };
const lanes: ProjectBoardLane<Item>[] = ['North', 'South'].map((title) => ({
  id: title.toLowerCase(),
  title,
  columns: [
    { id: 'todo', title: 'To do', items: [{ id: 'same', title: `${title} record` }] },
    { id: 'done', title: 'Done', items: [] },
  ],
}));

it('owns lane sizing and routes moves and footer content to the correct subgroup', () => {
  const onMove = jest.fn();
  const screen = render(
    <BloomThemeProvider>
      <ProjectBoard
        variant="grouped"
        lanes={lanes}
        onLaneCollapsedChange={jest.fn()}
        onMove={onMove}
        getItemId={(item) => item.id}
        dragMode="handle"
        allowReorder={false}
        renderCard={(item) => (
          <BoardDragHandle accessibilityLabel={`Move ${item.title}`}>
            <Text>{item.title}</Text>
          </BoardDragHandle>
        )}
        renderColumnFooter={(column, lane) => (
          <Text>
            {lane.title}/{column.title}
          </Text>
        )}
      />
    </BloomThemeProvider>,
  );
  fireEvent(screen.getByTestId('project-board'), 'layout', {
    nativeEvent: { layout: { x: 0, y: 0, width: 900, height: 420 } },
  });
  expect(screen.getByText('North/To do')).toBeTruthy();
  expect(screen.getByText('South/To do')).toBeTruthy();
  fireEvent(screen.getByLabelText('Move South record'), 'accessibilityAction', {
    nativeEvent: { actionName: 'nextColumn' },
  });
  expect(onMove).toHaveBeenCalledTimes(1);
  expect(onMove).toHaveBeenCalledWith(
    expect.objectContaining({ itemId: 'same', fromColumnId: 'todo', toColumnId: 'done' }),
    'south',
  );
});

it('reports controlled collapse without affecting other lanes', () => {
  const onLaneCollapsedChange = jest.fn();
  const screen = render(
    <BloomThemeProvider>
      <ProjectBoard
        variant="grouped"
        lanes={lanes}
        onLaneCollapsedChange={onLaneCollapsedChange}
        getItemId={(item) => item.id}
        renderCard={(item) => <Text>{item.title}</Text>}
      />
    </BloomThemeProvider>,
  );
  fireEvent.press(screen.getByText('North'));
  expect(onLaneCollapsedChange).toHaveBeenCalledWith('north', true);
  expect(onLaneCollapsedChange).toHaveBeenCalledTimes(1);
});
