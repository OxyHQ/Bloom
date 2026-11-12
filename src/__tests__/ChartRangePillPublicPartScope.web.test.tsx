/** @jest-environment jsdom */
import { act } from 'react';
import { createRoot } from 'react-dom/client';
jest.mock('react-native', () => jest.requireActual('react-native-web'));
import { BloomScope } from '../appearance';
import { ChartRangePill } from '../chart-cards/primitives/ChartRangePill';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
const sizes = [undefined, 'xs', 'sm', 'md', 'lg'] as const;

it.each(sizes)('ChartRangePill keeps 32px geometry under %s scope on web', (size) => {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root = createRoot(host);
  act(() =>
    root.render(
      <BloomThemeProvider fonts={false}>
        {size ? (
          <BloomScope size={size}>
            <ChartRangePill label="Jan – Jun 2026" testID="range" />
          </BloomScope>
        ) : (
          <ChartRangePill label="Jan – Jun 2026" testID="range" />
        )}
      </BloomThemeProvider>,
    ),
  );
  try {
    const pill = host.querySelector<HTMLElement>('[data-testid="range"]');
    expect(pill).not.toBeNull();
    if (!pill) throw new Error('Missing ChartRangePill');
    expect(getComputedStyle(pill).height).toBe('32px');
    const icon = pill.querySelector<HTMLElement>('svg');
    expect(icon?.getAttribute('width')).toBe('16');
    expect(icon?.getAttribute('height')).toBe('16');
  } finally {
    act(() => root.unmount());
    host.remove();
  }
});
