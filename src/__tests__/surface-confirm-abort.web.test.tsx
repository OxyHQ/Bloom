/** @jest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

jest.mock('react-native', () => jest.requireActual('react-native-web'));
jest.mock('../bottom-sheet', () => jest.requireActual('../bottom-sheet/index.web'));

import { confirm, SurfaceHost } from '../surfaces/index.web';
import { __resetSurfacesForTests, getSnapshot, resetSurfaces } from '../surfaces/surface-store';
import { resetOverlayStack } from '../overlay/stack';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
let root: Root;
let container: HTMLDivElement;
let opener: HTMLButtonElement;
beforeEach(() => {
  jest.useFakeTimers();
  resetOverlayStack();
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  opener = document.createElement('button');
  opener.textContent = 'Open';
  document.body.appendChild(opener);
  opener.focus();
  act(() =>
    root.render(
      <BloomThemeProvider fonts={false}>
        <SurfaceHost />
      </BloomThemeProvider>,
    ),
  );
});
afterEach(() => {
  act(() => root.unmount());
  resetSurfaces();
  __resetSurfacesForTests();
  resetOverlayStack();
  container.remove();
  opener.remove();
  jest.useRealTimers();
});
function flush() {
  for (let i = 0; i < 6; i++) act(() => jest.advanceTimersByTime(100));
}
function button(label: string) {
  const result = Array.from(document.querySelectorAll('button')).find(
    (node) => node.textContent === label,
  );
  if (!result) throw new Error(`Missing button ${label}`);
  return result;
}

it('does not steal focus from a later confirmation when the earlier one aborts', async () => {
  const controller = new AbortController();
  let lower!: Promise<boolean>;
  let upper!: Promise<boolean>;
  act(() => {
    lower = confirm({
      title: 'Lower dialog',
      confirmLabel: 'Lower confirm',
      signal: controller.signal,
    });
  });
  flush();
  act(() => {
    upper = confirm({ title: 'Upper dialog', confirmLabel: 'Upper confirm' });
  });
  flush();
  const upperButton = button('Upper confirm');
  upperButton.focus();
  expect(document.activeElement).toBe(upperButton);
  act(() => controller.abort());
  flush();
  expect(document.activeElement).toBe(upperButton);
  expect(document.body.textContent).not.toContain('Lower dialog');
  expect(document.body.textContent).toContain('Upper dialog');
  expect(getSnapshot()).toHaveLength(1);
  await expect(lower).resolves.toBe(false);
  act(() => upperButton.click());
  flush();
  await expect(upper).resolves.toBe(true);
});

it('does not render or steal focus if aborted before the next host commit', async () => {
  const controller = new AbortController();
  let answer!: Promise<boolean>;
  act(() => {
    answer = confirm({ title: 'never mounted', signal: controller.signal });
    controller.abort();
  });
  flush();
  expect(document.body.textContent).not.toContain('never mounted');
  expect(document.activeElement).toBe(opener);
  expect(getSnapshot()).toHaveLength(0);
  await expect(answer).resolves.toBe(false);
});

it('does not reopen or steal focus when abort falls between host unmount and remount', async () => {
  const controller = new AbortController();
  let answer!: Promise<boolean>;
  act(() => {
    answer = confirm({ title: 'In transit', signal: controller.signal });
  });
  flush();
  expect(document.body.textContent).toContain('In transit');
  act(() => root.render(<BloomThemeProvider fonts={false} />));
  flush();
  opener.focus();
  act(() => controller.abort());
  act(() =>
    root.render(
      <BloomThemeProvider fonts={false}>
        <SurfaceHost />
      </BloomThemeProvider>,
    ),
  );
  flush();
  expect(document.body.textContent).not.toContain('In transit');
  expect(document.activeElement).toBe(opener);
  expect(getSnapshot()).toHaveLength(0);
  await expect(answer).resolves.toBe(false);
});
