import { fireEvent, render } from '@testing-library/react-native';
import { ActivityHeatmap } from '../activity-heatmap';
import { BloomScope } from '../appearance';
import type { BloomSize } from '../appearance';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { resolvedStyle } from './support/rendered-style';

function Subject({
  scope,
  nestedScope,
  cellSize = 12,
  onPressDay,
}: {
  scope?: BloomSize;
  nestedScope?: BloomSize;
  cellSize?: number;
  onPressDay: jest.Mock;
}) {
  const heatmap = (
    <ActivityHeatmap
      data={[{ date: '2026-03-08', count: 2 }]}
      endDate="2026-03-14"
      numDays={7}
      cellSize={cellSize}
      onPressDay={onPressDay}
    />
  );
  return (
    <BloomThemeProvider mode="light" colorPreset="teal">
      <BloomScope size={scope}>
        {nestedScope ? <BloomScope size={nestedScope}>{heatmap}</BloomScope> : heatmap}
      </BloomScope>
    </BloomThemeProvider>
  );
}

it('keeps explicit cell geometry under control scopes and exposes the current small touch target', () => {
  const onPressDay = jest.fn();
  const screen = render(<Subject onPressDay={onPressDay} />);
  const cell = () => screen.getByLabelText('2026-03-08: 2');
  const size = () => {
    const style = resolvedStyle(cell().props.style);
    return [style.width, style.height];
  };

  expect(cell().props.accessibilityRole).toBe('button');
  expect(size()).toEqual([12, 12]);
  fireEvent.press(cell());
  expect(onPressDay).toHaveBeenLastCalledWith({ date: '2026-03-08', count: 2 });

  screen.rerender(<Subject scope="xs" onPressDay={onPressDay} />);
  expect(size()).toEqual([12, 12]);
  screen.rerender(<Subject scope="lg" onPressDay={onPressDay} />);
  expect(size()).toEqual([12, 12]);
  screen.rerender(<Subject scope="lg" nestedScope="xs" onPressDay={onPressDay} />);
  expect(size()).toEqual([12, 12]);
  screen.rerender(<Subject scope="xs" cellSize={20} onPressDay={onPressDay} />);
  expect(size()).toEqual([20, 20]);
});
