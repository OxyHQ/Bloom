/** @jest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
jest.mock('react-native', () => jest.requireActual('react-native-web'));
import { ActivityHeatmap } from '../activity-heatmap/ActivityHeatmap';
import { BloomScope } from '../appearance';
import type { BloomSize } from '../appearance';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

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
    <BloomThemeProvider fonts={false} mode="light" colorPreset="teal">
      <BloomScope size={scope}>
        {nestedScope ? <BloomScope size={nestedScope}>{heatmap}</BloomScope> : heatmap}
      </BloomScope>
    </BloomThemeProvider>
  );
}

it('keeps explicit cell geometry under control scopes and exposes the current small touch target', () => {
  const onPressDay = jest.fn();
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root: Root = createRoot(host);
  const renderSubject = (props?: {
    scope?: BloomSize;
    nestedScope?: BloomSize;
    cellSize?: number;
  }) => act(() => root.render(<Subject {...props} onPressDay={onPressDay} />));
  const cell = () => host.querySelector<HTMLElement>('[aria-label="2026-03-08: 2"]');
  const size = () => {
    const node = cell();
    if (!node) throw new Error('ActivityHeatmap did not render its March 8 cell');
    const style = getComputedStyle(node);
    return [style.width, style.height];
  };
  try {
    renderSubject();
    expect(cell()?.getAttribute('role')).toBe('button');
    expect(size()).toEqual(['12px', '12px']);
    act(() => cell()?.click());
    expect(onPressDay).toHaveBeenLastCalledWith({ date: '2026-03-08', count: 2 });

    renderSubject({ scope: 'xs' });
    expect(size()).toEqual(['12px', '12px']);
    renderSubject({ scope: 'lg' });
    expect(size()).toEqual(['12px', '12px']);
    renderSubject({ scope: 'lg', nestedScope: 'xs' });
    expect(size()).toEqual(['12px', '12px']);
    renderSubject({ scope: 'xs', cellSize: 20 });
    expect(size()).toEqual(['20px', '20px']);
  } finally {
    act(() => root.unmount());
    host.remove();
  }
});
