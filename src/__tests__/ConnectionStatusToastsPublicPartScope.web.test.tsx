/** @jest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
jest.mock('react-native', () => jest.requireActual('react-native-web'));
const mockToast = { error: jest.fn(), warning: jest.fn(), success: jest.fn() };
jest.mock('../toast', () => ({ toast: mockToast }));

import { BloomScope } from '../appearance';
import { ConnectionStatusToasts } from '../connection-status/ConnectionStatusToasts.web';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

it('renders no UI under control scopes and delegates the offline notice to Toast', () => {
  const originalOnline = Object.getOwnPropertyDescriptor(navigator, 'onLine');
  Object.defineProperty(navigator, 'onLine', { configurable: true, value: true });
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root: Root = createRoot(host);
  const subject = (
    <BloomScope size="xs">
      <ConnectionStatusToasts offlineMessage="Offline" />
    </BloomScope>
  );
  try {
    act(() => root.render(subject));
    expect(host.innerHTML).toBe('');
    expect(mockToast.error).not.toHaveBeenCalled();

    Object.defineProperty(navigator, 'onLine', { configurable: true, value: false });
    act(() => window.dispatchEvent(new Event('offline')));
    expect(mockToast.error).toHaveBeenCalledWith(
      'Offline',
      expect.objectContaining({ id: 'bloom-connection-status', duration: Infinity }),
    );
    expect(host.innerHTML).toBe('');
    expect(mockToast.error.mock.calls[0]?.[1]).not.toHaveProperty('size');
  } finally {
    act(() => root.unmount());
    host.remove();
    if (originalOnline) Object.defineProperty(navigator, 'onLine', originalOnline);
    else delete (navigator as { onLine?: boolean }).onLine;
  }
});
