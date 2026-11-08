/** @jest-environment jsdom */
import React from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
jest.mock('react-native', () => jest.requireActual('react-native-web'));
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { ComposerPill } from '../composer-panel';
import { ComposerLoader } from '../composer-loader/ComposerLoader.web';
import { useComposerLoaderPaint } from '../composer-loader/context';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function State() {
  return <span data-testid="owner">{String(useComposerLoaderPaint())}</span>;
}

test('nearest loader owns semantic paint state without replacing the focused draft', () => {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root = createRoot(host);
  const render = (active: boolean) =>
    act(() =>
      root.render(
        <BloomThemeProvider mode="light" colorPreset="teal">
          <ComposerLoader active={!active}>
            <ComposerLoader active={active}>
              <State />
              <ComposerPill testID="pill" defaultValue="Retained draft" showVoice={false} />
            </ComposerLoader>
          </ComposerLoader>
        </BloomThemeProvider>,
      ),
    );
  try {
    render(false);
    const input = host.querySelector('textarea')!;
    expect(input).not.toBeNull();
    act(() => {
      input.focus();
      input.setSelectionRange(2, 7);
    });
    expect(host.querySelector('[data-testid="owner"]')?.textContent).toBe('false');
    render(true);
    expect(host.querySelector('[data-testid="owner"]')?.textContent).toBe('true');
    expect(host.querySelector('textarea')).toBe(input);
    expect(document.activeElement).toBe(input);
    expect(input.value).toBe('Retained draft');
    expect([input.selectionStart, input.selectionEnd]).toEqual([2, 7]);
    render(false);
    expect(host.querySelector('textarea')).toBe(input);
  } finally {
    act(() => root.unmount());
    host.remove();
  }
});
