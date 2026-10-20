import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { View } from 'react-native';
import { Button } from '../button';
import { Text } from '../typography';
import { ProjectBoard } from './ProjectBoard';
import { BoardDragHandle } from './BoardGesture';
import type { BoardColumn, BoardMove } from './types';

type RecordItem = { id: string; title: string; estimate: number };
const initial: BoardColumn<RecordItem>[] = [
  {
    id: 'planned',
    title: 'Planned',
    items: [{ id: 'brief', title: 'Write the launch brief', estimate: 3 }],
  },
  { id: 'complete', title: 'Complete', items: [] },
];

function ControlledBoard() {
  const [columns, setColumns] = useState(initial);
  const move = ({ itemId, fromColumnId, toColumnId }: BoardMove) => {
    setColumns((current) => {
      const item = current
        .find((column) => column.id === fromColumnId)
        ?.items.find((entry) => entry.id === itemId);
      if (!item) return current;
      return current.map((column) => ({
        ...column,
        items:
          column.id === fromColumnId
            ? column.items.filter((entry) => entry.id !== itemId)
            : column.id === toColumnId
              ? [...column.items, item]
              : column.items,
      }));
    });
  };
  return (
    <ProjectBoard
      variant="embedded"
      columns={columns}
      getItemId={(item) => item.id}
      onMove={move}
      dragMode="handle"
      allowReorder={false}
      accessibilityLabel="Launch board"
      renderCard={(item, column, { isDragging }) => {
        const target = columns.find((entry) => entry.id !== column.id)!;
        return (
          <View style={{ padding: 16, gap: 12, opacity: isDragging ? 0.5 : 1 }}>
            <BoardDragHandle accessibilityLabel={`Move ${item.title}`}>
              <Text>{item.title}</Text>
            </BoardDragHandle>
            <Text>{item.estimate} points</Text>
            <Button
              size="sm"
              onPress={() =>
                move({ itemId: item.id, fromColumnId: column.id, toColumnId: target.id })
              }
            >
              Move to {target.title}
            </Button>
          </View>
        );
      }}
    />
  );
}

const meta: Meta<typeof ControlledBoard> = {
  title: 'Patterns/Productivity/Controlled Board',
  component: ControlledBoard,
};
export default meta;
type Story = StoryObj<typeof ControlledBoard>;
export const Default: Story = {};
