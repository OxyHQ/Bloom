/** @jest-environment jsdom */
import { act } from 'react';
import { createRoot } from 'react-dom/client';
jest.mock('react-native', () => jest.requireActual('react-native-web'));
import { View } from 'react-native';
import { BloomScope } from '../appearance';
import { Button } from '../button';
import { ComposerLoader } from '../composer-loader';
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

function mount(size: (typeof sizes)[number][0], child: React.ReactNode) {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root = createRoot(host);
  act(() =>
    root.render(
      <BloomThemeProvider fonts={false}>
        {size ? <BloomScope size={size}>{child}</BloomScope> : child}
      </BloomThemeProvider>,
    ),
  );
  return {
    host,
    cleanup() {
      act(() => root.unmount());
      host.remove();
    },
  };
}

it.each(sizes)('ComposerLoader preserves its child control scope at %s on web', (size, height) => {
  const mounted = mount(
    size,
    <ComposerLoader surface={false} testID="loader">
      <Button testID="loader-action">
        <Text>Send</Text>
      </Button>
    </ComposerLoader>,
  );
  try {
    const action = mounted.host.querySelector<HTMLElement>('[data-testid="loader-action"]');
    if (!action) throw new Error('Missing ComposerLoader child action');
    expect(getComputedStyle(action).height).toBe(height);
  } finally {
    mounted.cleanup();
  }
});

it('ComposerLoader preserves nested child scope through a wrapper on web', () => {
  const mounted = mount(
    'xs',
    <View>
      <ComposerLoader surface={false} testID="loader">
        <BloomScope size="lg">
          <Button testID="loader-action">
            <Text>Send</Text>
          </Button>
        </BloomScope>
      </ComposerLoader>
    </View>,
  );
  try {
    const action = mounted.host.querySelector<HTMLElement>('[data-testid="loader-action"]');
    if (!action) throw new Error('Missing ComposerLoader child action');
    expect(getComputedStyle(action).height).toBe('44px');
  } finally {
    mounted.cleanup();
  }
});
