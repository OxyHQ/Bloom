/** @jest-environment jsdom */
import { act } from 'react';
import { createRoot } from 'react-dom/client';
jest.mock('../page-header/EdgeScrim', () => ({ EdgeScrim: () => null }));
jest.mock('react-native', () => jest.requireActual('react-native-web'));
jest.mock('react-native-reanimated', () => {
  const base = jest.requireActual('../../__mocks__/react-native-reanimated');
  const { View } = jest.requireActual('react-native-web');
  return { ...base, __esModule: true, default: { ...base.default, View } };
});
import { ScrollSurface } from '../layout/ScrollSurface.web';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
it('composes fades above the viewport and beneath the scrollbar inside the same stacking host', () => {
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  try {
    act(() =>
      root.render(
        <BloomThemeProvider fonts={false}>
          <ScrollSurface testID="surface" hostStyle={{ height: 300, borderRadius: 20 }} fadeBottom>
            <div style={{ height: 1000 }}>Body</div>
          </ScrollSurface>
        </BloomThemeProvider>,
      ),
    );
    const viewport = host.querySelector('[data-bloom-scroll-area]')!;
    const track = host.querySelector('[data-bloom-scrollbar]')!;
    const fade = host.querySelector('[data-testid="surface-fade-top"]')!;
    expect(viewport).not.toBeNull();
    expect(track).not.toBeNull();
    expect(fade).not.toBeNull();
    const compositor = viewport.parentElement!;
    expect(track.parentElement).toBe(compositor);
    const decoration = fade.parentElement!;
    expect(decoration.parentElement).toBe(compositor);
    expect(
      viewport.compareDocumentPosition(decoration) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      decoration.compareDocumentPosition(track) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(host.querySelectorAll('[data-bloom-scroll-area]')).toHaveLength(1);
  } finally {
    act(() => root.unmount());
    host.remove();
  }
});
