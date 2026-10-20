/** @jest-environment jsdom */
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
jest.mock('react-native', () => jest.requireActual('react-native-web'));
// Image loading/layout has separate geometry coverage. This boundary supplies a
// cropped image so the DOM test can exercise real focus and keyboard delivery.
jest.mock('../cover-header/CoverImage', () => ({
  CoverImage: ({ onGeometryChange }: { onGeometryChange: (geometry: object) => void }) => {
    const React = jest.requireActual('react');
    React.useEffect(() => {
      onGeometryChange({ width: 400, height: 400, overflowX: 0, overflowY: 200 });
    }, [onGeometryChange]);
    return null;
  },
}));
import { CoverHeader } from '../cover-header';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
let container: HTMLDivElement;
let root: Root;
beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
});
function action(text: string) {
  const button = Array.from(container.querySelectorAll<HTMLElement>('[role="button"]')).find(
    (node) => node.textContent === text,
  );
  if (!button) throw new Error(`Missing action ${text}`);
  return button;
}
it('names the keyboard editor, consumes Escape, restores focus, and saves through Enter', async () => {
  const commit = jest.fn();
  const bubbled = jest.fn();
  document.addEventListener('keydown', bubbled);
  act(() =>
    root.render(
      <BloomThemeProvider mode="light" colorPreset="teal">
        <CoverHeader
          testID="cover"
          coverSource="test.jpg"
          repositionable
          onCoverPositionCommit={commit}
        />
      </BloomThemeProvider>,
    ),
  );
  act(() => action('Reposition').click());
  const editor = container.querySelector<HTMLElement>('[data-testid="cover-position-editor"]')!;
  expect(document.activeElement).toBe(editor);
  expect(editor.getAttribute('role')).toBe('group');
  expect(editor.getAttribute('aria-label')).toContain('arrow keys');
  act(() =>
    editor.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }),
    ),
  );
  bubbled.mockClear();
  act(() =>
    editor.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
    ),
  );
  expect(bubbled).not.toHaveBeenCalled();
  expect(document.activeElement).toBe(action('Reposition'));
  expect(commit).not.toHaveBeenCalled();
  act(() => action('Reposition').click());
  act(() =>
    editor.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true, cancelable: true }),
    ),
  );
  await act(async () => {
    editor.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }),
    );
  });
  expect(commit).toHaveBeenCalledWith({ x: 0.5, y: 0.55 });
  expect(document.activeElement).toBe(action('Reposition'));
  document.removeEventListener('keydown', bubbled);
});
