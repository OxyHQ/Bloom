/** @jest-environment jsdom */
import { act } from 'react';
import { createRoot } from 'react-dom/client';
jest.mock('react-native', () => jest.requireActual('react-native-web'));

import { BloomScope } from '../appearance';
import { GlyphButton } from '../button/GlyphButton';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

it('keeps GlyphButton numeric diameters independent from control-size scopes in web DOM', () => {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root = createRoot(host);
  try {
    act(() =>
      root.render(
        <BloomThemeProvider fonts={false}>
          <GlyphButton testID="default" accessibilityLabel="Default" />
          <BloomScope size="xs">
            <GlyphButton testID="compact-scope-default" accessibilityLabel="Default in xs" />
            <GlyphButton testID="compact-scope-explicit" size={40} accessibilityLabel="40 in xs" />
          </BloomScope>
          <BloomScope size="lg">
            <GlyphButton testID="large-scope-explicit" size={28} accessibilityLabel="28 in lg" />
          </BloomScope>
        </BloomThemeProvider>,
      ),
    );

    const dimensions = (id: string) => {
      const button = host.querySelector<HTMLElement>(`[data-testid="${id}"]`);
      if (!button) throw new Error(`GlyphButton ${id} did not render`);
      return [button.style.width, button.style.height];
    };
    expect(dimensions('default')).toEqual(['36px', '36px']);
    expect(dimensions('compact-scope-default')).toEqual(['36px', '36px']);
    expect(dimensions('compact-scope-explicit')).toEqual(['40px', '40px']);
    expect(dimensions('large-scope-explicit')).toEqual(['28px', '28px']);
  } finally {
    act(() => root.unmount());
    host.remove();
  }
});
