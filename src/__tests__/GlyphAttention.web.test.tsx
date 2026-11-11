/** @jest-environment jsdom */
import { act } from 'react';
import { createRoot } from 'react-dom/client';
jest.mock('react-native', () => jest.requireActual('react-native-web'));
let mockReduced = false;
jest.mock('../hooks/use-prefers-reduced-motion', () => ({
  usePrefersReducedMotion: () => mockReduced,
}));

import { GlyphButton } from '../button/GlyphButton';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

it('restarts each attention event without replacing the button, glyph or focused input', () => {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root = createRoot(host);
  const render = (attention: number, busy = false) =>
    act(() =>
      root.render(
        <BloomThemeProvider fonts={false}>
          <input aria-label="Reply" defaultValue="Retained draft" />
          <GlyphButton attention={attention} busy={busy} accessibilityLabel="Expand" size={32}>
            <svg aria-hidden="true" data-testid="glyph" width="20" height="20">
              <path d="M2 18L18 2M2 2H18V18" />
            </svg>
          </GlyphButton>
        </BloomThemeProvider>,
      ),
    );
  try {
    render(7);
    const input = host.querySelector('input');
    const button = host.querySelector('[role="button"]');
    const glyph = host.querySelector('[data-testid="glyph"]');
    const motion = host.querySelector<HTMLElement>('[data-bloom-glyph-attention]');
    if (!input || !button || !glyph || !motion) throw new Error('Fixture missing');
    input.focus();
    expect(motion.style.animationName).toBe('');
    render(8);
    expect(motion.style.animationName).toBe('bloom-glyph-attention-a');
    render(8);
    expect(motion.style.animationName).toBe('bloom-glyph-attention-a');
    render(20); // Any changed token, not just parity or +1.
    expect(motion.style.animationName).toBe('bloom-glyph-attention-b');
    render(21);
    expect(motion.style.animationName).toBe('bloom-glyph-attention-a');
    expect(host.querySelector('[role="button"]')).toBe(button);
    expect(host.querySelector('[data-testid="glyph"]')).toBe(glyph);
    expect(document.activeElement).toBe(input);
    expect(input.value).toBe('Retained draft');
    render(22, true);
    expect(motion.style.animationName).toBe('none');
    render(22);
    expect(motion.style.animationName).toBe('none');
    mockReduced = true;
    render(23);
    expect(motion.style.animationName).toBe('none');
    mockReduced = false;
    render(23);
    expect(motion.style.animationName).toBe('none');
    render(24);
    expect(motion.style.animationName).toBe('bloom-glyph-attention-b');
  } finally {
    mockReduced = false;
    act(() => root.unmount());
    host.remove();
  }
});
