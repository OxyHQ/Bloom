/** @jest-environment jsdom */
import { act } from 'react';
import { createRoot } from 'react-dom/client';
jest.mock('react-native', () => jest.requireActual('react-native-web'));
import { BloomScope } from '../appearance';
import { Button } from '../button';
import { CallMinimisedPill, CallScreen, IncomingCallScreen } from '../call-ui';
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

function scoped(size: (typeof sizes)[number][0], children: React.ReactNode) {
  return (
    <BloomThemeProvider fonts={false}>
      {size ? <BloomScope size={size}>{children}</BloomScope> : children}
    </BloomThemeProvider>
  );
}

it.each(sizes)('CallScreen delegates caller slots at %s scope on web', (size, height) => {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root = createRoot(host);
  try {
    act(() =>
      root.render(
        scoped(
          size,
          <CallScreen
            name="Ana"
            status="active"
            topBarSlot={
              <Button testID="top-action">
                <Text>Top</Text>
              </Button>
            }
            controlsSlot={
              <Button testID="controls-action">
                <Text>Custom controls</Text>
              </Button>
            }
          />,
        ),
      ),
    );
    for (const id of ['top-action', 'controls-action']) {
      const action = host.querySelector(`[data-testid="${id}"]`);
      if (!action) throw new Error(`Missing CallScreen slot control: ${id}`);
      expect(getComputedStyle(action).height).toBe(height);
    }
  } finally {
    act(() => root.unmount());
    host.remove();
  }
});

it.each(sizes)('CallMinimisedPill keeps its shell independent of %s scope on web', (size) => {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root = createRoot(host);
  try {
    act(() =>
      root.render(
        scoped(
          size,
          <CallMinimisedPill
            name="Ana"
            duration="01:02"
            onExpand={() => {}}
            onMutedChange={() => {}}
            onEndCall={() => {}}
            testID="pill"
          />,
        ),
      ),
    );
    const shell = host.querySelector('[data-testid="pill-expand"]');
    if (!shell) throw new Error('Missing CallMinimisedPill shell');
    expect(getComputedStyle(shell).minHeight).toBe('48px');
  } finally {
    act(() => root.unmount());
    host.remove();
  }
});

it.each([
  [undefined, '56px'],
  ['xs', '40px'],
  ['sm', '40px'],
  ['md', '48px'],
  ['lg', '56px'],
] as const)('CallScreen sizes built-in controls from BloomScope %s on web', (size, diameter) => {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root = createRoot(host);
  try {
    act(() =>
      root.render(
        scoped(
          size,
          <CallScreen
            name="Ana"
            status="active"
            controls={{ onMutedChange: () => {} }}
            testID="controlled-screen"
          />,
        ),
      ),
    );
    const control = host.querySelector('[data-testid="controlled-screen-controls-mute"]');
    if (!control) throw new Error('Missing CallScreen built-in mute control');
    expect(getComputedStyle(control).width).toBe(diameter);
    expect(getComputedStyle(control).height).toBe(diameter);
  } finally {
    act(() => root.unmount());
    host.remove();
  }
});

it.each(sizes)(
  'IncomingCallScreen delegates overlay children at %s scope on web',
  (size, height) => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);
    try {
      act(() =>
        root.render(
          scoped(
            size,
            <IncomingCallScreen name="Ana" onAccept={() => {}}>
              <Button testID="incoming-overlay-action">
                <Text>Overlay</Text>
              </Button>
            </IncomingCallScreen>,
          ),
        ),
      );
      const action = host.querySelector('[data-testid="incoming-overlay-action"]');
      if (!action) throw new Error('Missing IncomingCallScreen overlay action');
      expect(getComputedStyle(action).height).toBe(height);
    } finally {
      act(() => root.unmount());
      host.remove();
    }
  },
);

it.each([
  [undefined, '56px'],
  ['xs', '40px'],
  ['sm', '40px'],
  ['md', '48px'],
  ['lg', '56px'],
] as const)(
  'IncomingCallScreen scales answer controls from BloomScope %s on web',
  (size, diameter) => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);
    try {
      act(() =>
        root.render(
          scoped(
            size,
            <IncomingCallScreen name="Ana" onAccept={() => {}} testID="incoming-screen" />,
          ),
        ),
      );
      const control = host.querySelector('[data-testid="incoming-screen-accept"]');
      if (!control) throw new Error('Missing IncomingCallScreen answer control');
      expect(getComputedStyle(control).width).toBe(diameter);
      expect(getComputedStyle(control).height).toBe(diameter);
    } finally {
      act(() => root.unmount());
      host.remove();
    }
  },
);
