/**
 * Without the `menu-bar` capability (OxyOS ADR 0021, decision 2) a `Menubar`
 * draws itself in the window exactly as it did before the capability existed.
 *
 * The snapshots were recorded on the commit before the capability, from the
 * same declaration, closed and with each menu open (native: the bottom sheet
 * each menu opens into). A change to what the bar draws without the capability
 * fails here, and so does one that draws anything for the headless
 * registration the bar now keeps of its items.
 */
import type React from 'react';
import { render } from '@testing-library/react-native';

import * as Parts from '../menubar';
import { PlatformSurfaceProvider } from '../platform-surface/context';
import { PortalOutlet, PortalProvider } from '../portal';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { declaration } from './support/menubar-declaration';

function draw(ui: React.ReactElement, adapter?: { platform: string; capabilities: Set<never> }) {
  const tree = (
    <PortalProvider>
      {ui}
      <PortalOutlet />
    </PortalProvider>
  );
  return render(
    <BloomThemeProvider mode="light" colorPreset="teal">
      {adapter ? <PlatformSurfaceProvider value={adapter}>{tree}</PlatformSurfaceProvider> : tree}
    </BloomThemeProvider>,
  );
}

/** The host tree as markup, with React's per-root `useId` values made comparable. */
const markup = (screen: ReturnType<typeof render>) =>
  JSON.stringify(screen.toJSON(), null, 1).replace(/-r[0-9a-z]+-/g, '-r-');

describe('Menubar without the menu-bar capability (native)', () => {
  it.each([
    ['closed', undefined],
    ['with File open', 'file'],
    ['with Edit open', 'edit'],
    ['with View open', 'view'],
  ])('draws in the window as before, %s', (_name, open) => {
    const screen = draw(declaration(Parts, {}, {}, { defaultValue: open }));
    expect(markup(screen)).toMatchSnapshot();
    screen.unmount();
  });

  it('draws the same with an adapter that does not report it', () => {
    const before = markup(draw(declaration(Parts, {}, {}, { defaultValue: 'file' })));
    const screen = draw(declaration(Parts, {}, {}, { defaultValue: 'file' }), {
      platform: 'test',
      capabilities: new Set(),
    });
    expect(markup(screen)).toBe(before);
  });
});
