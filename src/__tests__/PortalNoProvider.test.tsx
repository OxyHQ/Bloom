/**
 * A native `<Portal>` with no `<PortalProvider>` above it shows nothing. That used to be silent:
 * Mention 2.2.0's surfaces vanished on Android with no log at all. Now it says so in development,
 * and a surface can ask (`usePortalProviderPresent`) before it relies on a portal.
 */
import { Text } from 'react-native';
import { render } from '@testing-library/react-native';

import { Portal, PortalOutlet, PortalProvider, usePortalProviderPresent } from '../portal/Portal';

function Probe({ onRead }: { onRead: (present: boolean) => void }) {
  onRead(usePortalProviderPresent());
  return null;
}

it('reports whether a PortalProvider is above', () => {
  const reads: boolean[] = [];
  render(<Probe onRead={(present) => reads.push(present)} />);
  render(
    <PortalProvider>
      <Probe onRead={(present) => reads.push(present)} />
    </PortalProvider>,
  );
  expect(reads).toEqual([false, true]);
});

it('warns once in development when a Portal has no provider, and shows it with one', () => {
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  const orphan = render(
    <Portal>
      <Text>Orphan</Text>
    </Portal>,
  );
  expect(orphan.queryByText('Orphan')).toBeNull();
  render(
    <Portal>
      <Text>Second orphan</Text>
    </Portal>,
  );
  const portalWarnings = warn.mock.calls.filter(([message]) =>
    String(message).includes('[bloom/portal]'),
  );
  expect(portalWarnings).toHaveLength(1);
  warn.mockRestore();

  const shown = render(
    <PortalProvider>
      <Portal>
        <Text>Shown</Text>
      </Portal>
      <PortalOutlet />
    </PortalProvider>,
  );
  expect(shown.getByText('Shown')).toBeTruthy();
});
