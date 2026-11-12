/** @jest-environment jsdom */
import { act, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';

jest.mock('react-native', () => jest.requireActual('react-native-web'));
jest.mock('../button', () => jest.requireActual('../button/index.web'));

import { BloomScope, type BloomSize } from '../appearance';
import { NotificationBell } from '../app-shell/NotificationBell';
import { PortalOutlet, PortalProvider } from '../portal';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import type { NotificationCenterItem } from '../notification-center';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const notifications: NotificationCenterItem[] = [
  { id: 'one', category: 'system', group: 'Today', title: 'Update', description: 'Ready' },
];

function Fixture({ scopes }: { scopes: BloomSize[] }) {
  const bell = <NotificationBell testID="scoped-bell" notifications={notifications} />;
  const scoped = scopes.reduceRight<ReactNode>(
    (children, size) => (
      <BloomScope key={size} size={size}>
        {children}
      </BloomScope>
    ),
    bell,
  );
  return (
    <BloomThemeProvider fonts={false}>
      <PortalProvider>
        {scoped}
        <PortalOutlet />
      </PortalProvider>
    </BloomThemeProvider>
  );
}

it.each([
  { name: 'default md', scopes: [], height: '28px' },
  { name: 'xs', scopes: ['xs'], height: '20px' },
  { name: 'sm', scopes: ['sm'], height: '24px' },
  { name: 'md', scopes: ['md'], height: '28px' },
  { name: 'lg', scopes: ['lg'], height: '36px' },
  { name: 'nested lg over xs', scopes: ['xs', 'lg'], height: '36px' },
] as const)(
  'NotificationBell preserves trigger and popover size recipes on web ($name)',
  ({ scopes, height }) => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);
    try {
      act(() => root.render(<Fixture scopes={[...scopes]} />));
      const trigger = host.querySelector<HTMLElement>('[data-testid="scoped-bell"]');
      expect(trigger?.style.getPropertyValue('--bloom-btn-height')).toBe('36px');
      act(() => trigger?.click());
      const tabs = document.body.querySelectorAll<HTMLElement>('[role="tab"]');
      expect(tabs).toHaveLength(3);
      expect(tabs[0]?.style.height).toBe(height);
    } finally {
      act(() => root.unmount());
      host.remove();
    }
  },
);
