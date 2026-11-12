/** @jest-environment jsdom */
import { act } from 'react';
import { createRoot } from 'react-dom/client';
jest.mock('react-native', () => jest.requireActual('react-native-web'));
import { BloomScope } from '../appearance';
import { Button } from '../button';
import { CallHistoryList, CallHistoryRow } from '../call-ui';
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
const sections = [
  {
    title: 'Today',
    items: [{ id: '1', name: 'Ana', direction: 'incoming' as const, meta: '09:14' }],
  },
];

function scoped(size: (typeof sizes)[number][0], children: React.ReactNode) {
  return (
    <BloomThemeProvider fonts={false}>
      {size ? <BloomScope size={size}>{children}</BloomScope> : children}
    </BloomThemeProvider>
  );
}

it.each(sizes)(
  'CallHistoryList delegates its header control at %s scope on web',
  (size, height) => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);
    try {
      act(() =>
        root.render(
          scoped(
            size,
            <CallHistoryList
              sections={sections}
              header={
                <Button testID="header-action">
                  <Text>Filter</Text>
                </Button>
              }
            />,
          ),
        ),
      );
      const action = host.querySelector('[data-testid="header-action"]');
      if (!action) throw new Error('Missing CallHistoryList header action');
      expect(getComputedStyle(action).height).toBe(height);
    } finally {
      act(() => root.unmount());
      host.remove();
    }
  },
);

it.each(sizes)(
  'CallHistoryRow keeps its callback target independent of %s scope on web',
  (size) => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);
    try {
      act(() =>
        root.render(
          scoped(
            size,
            <CallHistoryRow
              name="Ana"
              direction="incoming"
              meta="09:14"
              onPress={() => {}}
              onCallBack={() => {}}
              testID="row"
            />,
          ),
        ),
      );
      const callback = host.querySelector('[data-testid="row-callback"]');
      if (!callback) throw new Error('Missing CallHistoryRow callback action');
      expect(getComputedStyle(callback).width).toBe('36px');
      expect(getComputedStyle(callback).height).toBe('36px');
      expect(callback.getAttribute('aria-label')).toBe('Call Ana back');
    } finally {
      act(() => root.unmount());
      host.remove();
    }
  },
);
