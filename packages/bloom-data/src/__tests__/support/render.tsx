import type { ReactElement } from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

// React 19 marks the test renderer deprecated; it is still the renderer with no DOM.
const consoleError = console.error;
console.error = (...args: unknown[]) => {
  if (typeof args[0] === 'string' && args[0].includes('react-test-renderer is deprecated')) return;
  consoleError(...args);
};

export function render(element: ReactElement): ReactTestRenderer {
  let renderer: ReactTestRenderer | undefined;
  act(() => {
    renderer = create(element);
  });
  if (!renderer) throw new Error('render failed');
  return renderer;
}

/** Runs `fn` (and the renders it causes) inside act. */
export function update(fn: () => void): void {
  act(fn);
}

export async function settle(fn?: () => unknown): Promise<void> {
  await act(async () => {
    await fn?.();
  });
}
