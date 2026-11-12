/** @jest-environment jsdom */
import { act } from 'react';
import { createRoot } from 'react-dom/client';
jest.mock('react-native', () => jest.requireActual('react-native-web'));
import { BloomScope } from '../appearance';
import { Button } from '../button';
import { Field } from '../field';
import { Portal, PortalOutlet, PortalProvider } from '../portal/Portal';
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

function mount(child: React.ReactNode) {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root = createRoot(host);
  act(() =>
    root.render(
      <BloomThemeProvider fonts={false}>
        <PortalProvider>
          {child}
          <PortalOutlet />
        </PortalProvider>
      </BloomThemeProvider>,
    ),
  );
  return {
    host,
    cleanup() {
      act(() => root.unmount());
      host.remove();
      document.getElementById('bloom-portal-root')?.remove();
    },
  };
}

function action(host: HTMLElement) {
  const button = host.querySelector<HTMLElement>('[data-testid="field-action"]');
  if (!button) throw new Error('Missing delegated Field control');
  return button;
}

it.each(sizes)('Field delegates child control scope at %s on web', (size, height) => {
  const content = (
    <Field label="Preference">
      <Button testID="field-action">
        <Text>Apply</Text>
      </Button>
    </Field>
  );
  const mounted = mount(
    size ? (
      <BloomScope size={size}>
        <div>{content}</div>
      </BloomScope>
    ) : (
      <div>{content}</div>
    ),
  );
  try {
    expect(getComputedStyle(action(mounted.host)).height).toBe(height);
  } finally {
    mounted.cleanup();
  }
});

it('Field child controls retain nearest nested scope through a portal on web', () => {
  const mounted = mount(
    <BloomScope size="xs">
      <Field label="Preference">
        <BloomScope size="lg">
          <Portal>
            <Button testID="field-action">
              <Text>Apply</Text>
            </Button>
          </Portal>
        </BloomScope>
      </Field>
    </BloomScope>,
  );
  try {
    expect(getComputedStyle(action(mounted.host)).height).toBe('44px');
  } finally {
    mounted.cleanup();
  }
});

it('explicit child size overrides the delegated scope on web', () => {
  const mounted = mount(
    <BloomScope size="xs">
      <Field label="Preference">
        <Button size="lg" testID="field-action">
          <Text>Apply</Text>
        </Button>
      </Field>
    </BloomScope>,
  );
  try {
    expect(getComputedStyle(action(mounted.host)).height).toBe('44px');
  } finally {
    mounted.cleanup();
  }
});
