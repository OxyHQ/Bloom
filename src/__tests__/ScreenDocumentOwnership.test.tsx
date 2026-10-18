/** @jest-environment jsdom */
import React from 'react';
import { Platform, View } from 'react-native';
import { render } from '@testing-library/react-native';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { AppShell } from '../app-shell';
import { Screen } from '../screen';
import { ScrollRestorationProvider } from '../scroll/context';
const mockOwners = new Set<unknown>();
jest.mock('../scroll/use-scroll-restoration', () => ({
  useScrollRestoration(target: unknown, options: { enabled?: boolean } = {}) {
    const React = require('react');
    const token = React.useRef({ target });
    React.useEffect(() => {
      if (options.enabled === false) return;
      mockOwners.add(token.current);
      return () => {
        mockOwners.delete(token.current);
      };
    }, [options.enabled]);
    return { restorePending: false, onScroll: jest.fn() };
  },
}));
it('gives a document shared by two screens exactly one restoration writer', () => {
  const original = Platform.OS;
  Object.defineProperty(Platform, 'OS', { configurable: true, value: 'web' });
  try {
    const tree = render(
      <BloomThemeProvider fonts={false}>
        <ScrollRestorationProvider
          adapter={{ useScreenContentId: () => 'route', useScreenFocusEffect: () => {} }}
        >
          <AppShell
            panelLayout={{
              flow: 'document',
              panels: [
                {
                  id: 'main',
                  content: (
                    <Screen scroll="auto">
                      <View />
                    </Screen>
                  ),
                },
                {
                  id: 'context',
                  content: (
                    <Screen scroll="auto">
                      <View />
                    </Screen>
                  ),
                },
              ],
            }}
          />
        </ScrollRestorationProvider>
      </BloomThemeProvider>,
    );
    expect([...mockOwners].map((owner) => (owner as { target: unknown }).target)).toEqual([
      'window',
    ]);
    tree.unmount();
    expect(mockOwners.size).toBe(0);
  } finally {
    Object.defineProperty(Platform, 'OS', { configurable: true, value: original });
  }
});
