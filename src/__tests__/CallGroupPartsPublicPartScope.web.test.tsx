/** @jest-environment jsdom */
import { act } from 'react';
import { createRoot } from 'react-dom/client';
jest.mock('react-native', () => jest.requireActual('react-native-web'));
import { BloomScope } from '../appearance';
import { Button } from '../button';
import { GroupCallBar, GroupCallGrid, GroupCallTile, IncomingCallBanner } from '../call-ui';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { Text } from '../typography';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
const sizes = [
  [undefined, '36px'],
  ['xs', '24px'],
  ['sm', '32px'],
  ['md', '36px'],
  ['lg', '44px'],
] as const;
const participant = { id: 'p1', name: 'Ana' };

function renderInScope(size: (typeof sizes)[number][0], child: React.ReactNode, host: HTMLElement) {
  const root = createRoot(host);
  act(() =>
    root.render(
      <BloomThemeProvider fonts={false}>
        {size ? <BloomScope size={size}>{child}</BloomScope> : child}
      </BloomThemeProvider>,
    ),
  );
  return root;
}

it.each(sizes)('IncomingCallBanner keeps its 40px answer targets under %s scope on web', (size) => {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root = renderInScope(
    size,
    <IncomingCallBanner name="Ana" onAccept={() => {}} onDecline={() => {}} testID="incoming" />,
    host,
  );
  try {
    for (const id of ['incoming-accept', 'incoming-decline']) {
      const control = host.querySelector(`[data-testid="${id}"]`);
      if (!control) throw new Error(`Missing incoming action: ${id}`);
      expect(getComputedStyle(control).width).toBe('40px');
      expect(getComputedStyle(control).height).toBe('40px');
    }
  } finally {
    act(() => root.unmount());
    host.remove();
  }
});

it.each(sizes)('GroupCallBar keeps its sm Join button under %s scope on web', (size) => {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root = renderInScope(
    size,
    <GroupCallBar title="Group" onJoin={() => {}} testID="bar" />,
    host,
  );
  try {
    const join = host.querySelector('[data-testid="bar-join"]');
    if (!join) throw new Error('Missing GroupCallBar Join button');
    expect(getComputedStyle(join).height).toBe('32px');
  } finally {
    act(() => root.unmount());
    host.remove();
  }
});

it.each(sizes)('GroupCallTile delegates its video node at %s scope on web', (size, height) => {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root = renderInScope(
    size,
    <GroupCallTile
      participant={{
        ...participant,
        video: (
          <Button testID="video-action">
            <Text>Video</Text>
          </Button>
        ),
      }}
      width={200}
      height={120}
      testID="tile"
    />,
    host,
  );
  try {
    const action = host.querySelector('[data-testid="video-action"]');
    if (!action) throw new Error('Missing participant video action');
    expect(getComputedStyle(action).height).toBe(height);
    const tile = host.querySelector('[data-testid="tile"]');
    if (!tile) throw new Error('Missing GroupCallTile');
    expect(getComputedStyle(tile).width).toBe('200px');
    expect(getComputedStyle(tile).height).toBe('120px');
  } finally {
    act(() => root.unmount());
    host.remove();
  }
});

it.each(sizes)(
  'GroupCallGrid delegates participant video nodes at %s scope on web',
  (size, height) => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = renderInScope(
      size,
      <GroupCallGrid
        participants={[
          {
            ...participant,
            video: (
              <Button testID="grid-video">
                <Text>Video</Text>
              </Button>
            ),
          },
        ]}
        width={220}
        testID="grid"
      />,
      host,
    );
    try {
      const action = host.querySelector('[data-testid="grid-video"]');
      if (!action) throw new Error('Missing grid participant video action');
      expect(getComputedStyle(action).height).toBe(height);
      const tile = host.querySelector('[data-testid="grid-tile-p1"]');
      if (!tile) throw new Error('Missing GroupCallGrid tile');
      expect(getComputedStyle(tile).width).toBe('220px');
      expect(getComputedStyle(tile).height).toBe('220px');
    } finally {
      act(() => root.unmount());
      host.remove();
    }
  },
);
