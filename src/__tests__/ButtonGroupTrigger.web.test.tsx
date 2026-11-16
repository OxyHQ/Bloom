/** @jest-environment jsdom */
import { act } from 'react';
import { createRoot } from 'react-dom/client';
jest.mock('react-native', () => jest.requireActual('react-native-web'));

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { Text } from '../typography';
import { Button } from '../button/Button.web';
import { Popover, PopoverContent, PopoverTrigger } from '../popover/Popover.web';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

it('composes Button as the real Popover button without nesting controls', () => {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root = createRoot(host);
  try {
    act(() =>
      root.render(
        <BloomThemeProvider fonts={false}>
          <Popover>
            <PopoverTrigger asChild label="Open actions">
              <Button testID="action-trigger">
                <Text>Open</Text>
              </Button>
            </PopoverTrigger>
            <PopoverContent label="Actions">
              <Text>Action menu contents</Text>
            </PopoverContent>
          </Popover>
        </BloomThemeProvider>,
      ),
    );

    const trigger = host.querySelector<HTMLButtonElement>('[data-testid="action-trigger"]');
    if (!trigger) throw new Error('Button trigger did not render');
    expect(host.querySelectorAll('button')).toHaveLength(1);
    expect(host.querySelector('button button')).toBeNull();
    expect(trigger.getAttribute('aria-haspopup')).toBeTruthy();
    expect(trigger.getAttribute('aria-expanded')).toBe('false');

    act(() => trigger.click());
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(document.body.textContent).toContain('Action menu contents');
    expect(document.querySelector('button button')).toBeNull();
  } finally {
    act(() => root.unmount());
    host.remove();
    document.getElementById('bloom-portal-root')?.remove();
  }
});
