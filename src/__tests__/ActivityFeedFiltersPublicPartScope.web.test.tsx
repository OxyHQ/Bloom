/** @jest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
jest.mock('react-native', () => jest.requireActual('react-native-web'));

import { ActivityFeedFilters } from '../activity-feed/ActivityFeedFilters';
import { BloomScope } from '../appearance';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function Subject({ nested, size }: { nested?: boolean; size?: 'xs' | 'lg' }) {
  const filters = (
    <ActivityFeedFilters
      kinds={['call', 'email']}
      selected={['call']}
      onToggle={() => undefined}
      testID="filters"
    />
  );
  return (
    <BloomThemeProvider fonts={false}>
      {nested ? (
        <BloomScope size="xs">
          <BloomScope size="lg">{filters}</BloomScope>
        </BloomScope>
      ) : size ? (
        <BloomScope size={size}>{filters}</BloomScope>
      ) : (
        filters
      )}
    </BloomThemeProvider>
  );
}

it('keeps the filter target geometry at xl, independent of BloomScope', () => {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root: Root = createRoot(host);
  try {
    const renderSubject = (props?: { nested?: boolean; size?: 'xs' | 'lg' }) =>
      act(() => root.render(<Subject {...props} />));
    const height = () => {
      const chip = host.querySelector<HTMLElement>('[data-testid="filters-call"]');
      if (!chip) throw new Error('ActivityFeedFilters did not render its call filter');
      return chip.style.height;
    };

    renderSubject();
    expect(height()).toBe('32px');
    renderSubject({ size: 'xs' });
    expect(height()).toBe('32px');
    renderSubject({ size: 'lg' });
    expect(height()).toBe('32px');
    renderSubject({ nested: true });
    expect(height()).toBe('32px');
  } finally {
    act(() => root.unmount());
    host.remove();
  }
});
