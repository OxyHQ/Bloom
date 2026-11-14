/** @jest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
jest.mock('react-native', () => jest.requireActual('react-native-web'));

import { ActivityFeed } from '../activity-feed/ActivityFeed';
import { Button } from '../button';
import { BloomScope } from '../appearance';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { Text } from '../typography';
import type { ActivityFeedEntry } from '../activity-feed';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

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
    <BloomThemeProvider fonts={false}>
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
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root: Root = createRoot(host);
  try {
    const renderSubject = (props?: {
      size?: 'xs' | 'lg';
      nested?: boolean;
      density?: 'comfortable' | 'compact';
    }) => act(() => root.render(<Subject {...props} />));
    const style = (id: string) => {
      const element = host.querySelector<HTMLElement>(`[data-testid="${id}"]`);
      if (!element) throw new Error(`ActivityFeed did not render ${id}`);
      return getComputedStyle(element);
    };
    const avatar = () => style('feed-one-avatar');
    const action = () => style('caller-action');

    renderSubject();
    expect(avatar().width).toBe('32px');
    expect(avatar().height).toBe('32px');
    const defaultActionHeight = action().height;
    renderSubject({ size: 'xs' });
    expect(avatar().width).toBe('32px');
    expect(avatar().height).toBe('32px');
    expect(action().height).not.toBe(defaultActionHeight);

    renderSubject({ size: 'lg' });
    expect(avatar().width).toBe('32px');
    expect(avatar().height).toBe('32px');
    const largeActionHeight = action().height;
    renderSubject({ nested: true });
    expect(avatar().width).toBe('32px');
    expect(avatar().height).toBe('32px');
    expect(action().height).toBe(largeActionHeight);

    renderSubject({ density: 'compact', size: 'lg' });
    expect(avatar().width).toBe('24px');
    expect(avatar().height).toBe('24px');
    expect(action().height).toBe(largeActionHeight);
  } finally {
    act(() => root.unmount());
    host.remove();
  }
});
