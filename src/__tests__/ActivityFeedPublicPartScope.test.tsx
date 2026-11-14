import { render } from '@testing-library/react-native';
import { ActivityFeed } from '../activity-feed/ActivityFeed';
import { Button } from '../button';
import { BloomScope } from '../appearance';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { Text } from '../typography';
import type { ActivityFeedEntry } from '../activity-feed';
import { resolvedStyle } from './support/rendered-style';

const entries: ActivityFeedEntry[] = [
  {
    id: 'one',
    actor: { name: 'Marta' },
    day: 'Today',
    title: 'updated the record',
    content: (
      <Button testID="caller-action">
        <Text>Open</Text>
      </Button>
    ),
  },
];

function Subject({
  size,
  nested,
  density,
}: {
  size?: 'xs' | 'lg';
  nested?: boolean;
  density?: 'comfortable' | 'compact';
}) {
  const feed = <ActivityFeed entries={entries} density={density} testID="feed" />;
  return (
    <BloomThemeProvider>
      {nested ? (
        <BloomScope size="xs">
          <BloomScope size="lg">{feed}</BloomScope>
        </BloomScope>
      ) : size ? (
        <BloomScope size={size}>{feed}</BloomScope>
      ) : (
        feed
      )}
    </BloomThemeProvider>
  );
}

it('keeps feed artwork tied to content density and passes size scope to supplied actions', () => {
  const screen = render(<Subject />);
  const avatar = () => resolvedStyle(screen.getByTestId('feed-one-avatar').props.style);
  const action = () => resolvedStyle(screen.getByTestId('caller-action').props.style);

  expect(avatar()).toMatchObject({ width: 32, height: 32 });
  const defaultActionHeight = action().height;
  screen.rerender(<Subject size="xs" />);
  expect(avatar()).toMatchObject({ width: 32, height: 32 });
  expect(action().height).not.toBe(defaultActionHeight);

  screen.rerender(<Subject size="lg" />);
  expect(avatar()).toMatchObject({ width: 32, height: 32 });
  const largeActionHeight = action().height;
  screen.rerender(<Subject nested />);
  expect(avatar()).toMatchObject({ width: 32, height: 32 });
  expect(action().height).toBe(largeActionHeight);

  screen.rerender(<Subject density="compact" size="lg" />);
  expect(avatar()).toMatchObject({ width: 24, height: 24 });
  expect(action().height).toBe(largeActionHeight);
});
