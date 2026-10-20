import { fireEvent, render } from '@testing-library/react-native';
import { Pressable, Text } from 'react-native';
import { BloomThemeProvider } from '../../theme/BloomThemeProvider';
import { Board } from '../Board';

it('keeps native card actions operable and renders controlled column updates', () => {
  const move = jest.fn();
  const renderBoard = (destination: boolean) => (
    <BloomThemeProvider>
      <Board
        columns={[
          { id: 'todo', title: 'To do', items: destination ? [] : [{ id: 'a', title: 'Alpha' }] },
          { id: 'done', title: 'Done', items: destination ? [{ id: 'a', title: 'Alpha' }] : [] },
        ]}
        getItemId={(item) => item.id}
        renderCard={(item, column) => (
          <Pressable
            accessible
            accessibilityRole="button"
            accessibilityLabel="Move Alpha"
            onPress={move}
          >
            <Text>{`${item.title} in ${column.title}`}</Text>
          </Pressable>
        )}
      />
    </BloomThemeProvider>
  );
  const screen = render(renderBoard(false));
  fireEvent.press(screen.getByRole('button', { name: 'Move Alpha' }));
  expect(move).toHaveBeenCalledTimes(1);
  expect(screen.getByText('Alpha in To do')).toBeTruthy();
  screen.rerender(renderBoard(true));
  expect(screen.getByText('Alpha in Done')).toBeTruthy();
});
