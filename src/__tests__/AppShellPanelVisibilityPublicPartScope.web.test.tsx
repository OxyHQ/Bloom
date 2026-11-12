/** @jest-environment jsdom */
import { act, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';

jest.mock('react-native', () => jest.requireActual('react-native-web'));
jest.mock('../button', () => jest.requireActual('../button/index.web'));

import { BloomScope, type BloomSize } from '../appearance';
import { Button } from '../button';
import { AppShellPanelContext } from '../app-shell/context';
import { AppShellPanelVisibility } from '../app-shell/AppShellPanelVisibility';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { Text } from 'react-native';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function Fixture({ scopes }: { scopes: BloomSize[] }) {
  const content = (
    <AppShellPanelContext.Provider value={{ alone: true, framed: true, cssVisibility: true }}>
      <AppShellPanelVisibility testID="visibility" when="alone">
        <Button testID="child-button">
          <Text>Continue</Text>
        </Button>
      </AppShellPanelVisibility>
    </AppShellPanelContext.Provider>
  );
  const nested = scopes.reduceRight<ReactNode>(
    (children, size) => (
      <BloomScope key={size} size={size}>
        {children}
      </BloomScope>
    ),
    content,
  );
  return <BloomThemeProvider fonts={false}>{nested}</BloomThemeProvider>;
}

it.each([
  { name: 'default md', scopes: [], height: '36px' },
  { name: 'xs scope', scopes: ['xs'], height: '24px' },
  { name: 'sm scope', scopes: ['sm'], height: '32px' },
  { name: 'md scope', scopes: ['md'], height: '36px' },
  { name: 'nested lg over xs', scopes: ['xs', 'lg'], height: '44px' },
  { name: 'lg scope', scopes: ['lg'], height: '44px' },
] as const)('preserves child Button scope in DOM web ($name)', ({ scopes, height }) => {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root = createRoot(host);
  try {
    act(() => root.render(<Fixture scopes={[...scopes]} />));
    const wrapper = host.querySelector<HTMLElement>('[data-testid="visibility"]');
    const button = host.querySelector<HTMLElement>('[data-testid="child-button"]');
    expect(wrapper?.style.display).toContain('--bloom-panel-alone-display');
    expect(button?.style.getPropertyValue('--bloom-btn-height')).toBe(height);
    expect(button?.textContent).toBe('Continue');
  } finally {
    act(() => root.unmount());
    host.remove();
  }
});
