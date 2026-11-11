import { render } from '@testing-library/react-native';
import { ActivityFeedFilters } from '../activity-feed/ActivityFeedFilters';
import { BloomScope } from '../appearance';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { resolvedStyle } from './support/rendered-style';

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
    <BloomThemeProvider>
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
  const screen = render(<Subject />);
  const height = () => resolvedStyle(screen.getByTestId('filters-call').props.style).height;

  expect(height()).toBe(32);
  screen.rerender(<Subject size="xs" />);
  expect(height()).toBe(32);
  screen.rerender(<Subject size="lg" />);
  expect(height()).toBe(32);
  screen.rerender(<Subject nested />);
  expect(height()).toBe(32);
});
