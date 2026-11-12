/** @jest-environment jsdom */
import { act } from 'react';
import { createRoot } from 'react-dom/client';
jest.mock('react-native', () => jest.requireActual('react-native-web'));
import { BloomScope } from '../appearance';
import { ChartCenterReadout } from '../chart-cards/primitives/ChartCenterReadout';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
const sizes = [undefined, 'xs', 'sm', 'md', 'lg'] as const;

it.each(sizes)('ChartCenterReadout keeps its explicit chart recipe at %s scope on web', (size) => {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root = createRoot(host);
  act(() =>
    root.render(
      <BloomThemeProvider fonts={false}>
        {size ? (
          <BloomScope size={size}>
            <ChartCenterReadout value={42} format={() => '42'} testID="readout" />
          </BloomScope>
        ) : (
          <ChartCenterReadout value={42} format={() => '42'} testID="readout" />
        )}
      </BloomThemeProvider>,
    ),
  );
  try {
    const readout = host.querySelector<HTMLElement>('[data-testid="readout"]');
    if (!readout) throw new Error('Missing ChartCenterReadout');
    expect(getComputedStyle(readout).pointerEvents).toBe('none');
    expect(getComputedStyle(readout).position).toBe('absolute');
    expect(host.textContent).toContain('42');
  } finally {
    act(() => root.unmount());
    host.remove();
  }
});
