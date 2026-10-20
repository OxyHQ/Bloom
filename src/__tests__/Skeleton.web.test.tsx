/** @jest-environment jsdom */
import type React from 'react';
import { act, lazy, Profiler, Suspense } from 'react';
import { createRoot, type Root } from 'react-dom/client';
jest.mock('react-native', () => jest.requireActual('react-native-web'));
import { Animated } from 'react-native';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import * as Skeleton from '../skeleton';
import { installConstructedStyleSheets } from './support/constructed-style-sheets';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
let container: HTMLDivElement;
let root: Root;
let sheets: ReturnType<typeof installConstructedStyleSheets>;
beforeEach(() => {
  jest.useFakeTimers();
  sheets = installConstructedStyleSheets();
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  sheets.uninstall();
  jest.restoreAllMocks();
  jest.useRealTimers();
});
function mount(children: React.ReactNode) {
  act(() => root.render(<BloomThemeProvider mode="light">{children}</BloomThemeProvider>));
}
const placeholders = Array.from({ length: 160 }, (_, index) => `placeholder-${index}`);
function shapes() {
  return Array.from(container.querySelectorAll<HTMLElement>('[data-bloom-skeleton-motion]'));
}

it('keeps animated Suspense fallbacks off the React scheduler and reveals resolved content', async () => {
  const loop = jest.spyOn(Animated, 'loop');
  const commits = jest.fn();
  let resolve: (value: { default: React.ComponentType }) => void = () => {};
  const Content = lazy(
    () =>
      new Promise<{ default: React.ComponentType }>((ready) => {
        resolve = ready;
      }),
  );
  mount(
    <Profiler id="loading" onRender={commits}>
      <Suspense
        fallback={
          <Skeleton.Region label="Loading feed">
            {placeholders.map((id) => (
              <Skeleton.Box key={id} width={100} height={14} />
            ))}
          </Skeleton.Region>
        }
      >
        <Content />
      </Suspense>
    </Profiler>,
  );
  act(() => jest.advanceTimersByTime(100));
  const settledCommits = commits.mock.calls.length;
  expect(shapes()).toHaveLength(160);
  expect(container.querySelector('[role="group"]')?.getAttribute('aria-busy')).toBe('true');
  act(() => jest.advanceTimersByTime(3000));
  expect(commits).toHaveBeenCalledTimes(settledCommits);
  expect(loop).not.toHaveBeenCalled();
  await act(async () => resolve({ default: () => <p>Ready feed</p> }));
  expect(container.textContent).toContain('Ready feed');
  expect(shapes()).toHaveLength(0);
});

it('inherits the region phase for later and nested shapes without adding announcements', () => {
  function Content({ more }: { more: boolean }) {
    return (
      <Skeleton.Region label="Loading profile">
        <Skeleton.Circle size={40} />
        {more && (
          <Skeleton.Region label="Nested">
            <Skeleton.Pill size={20} />
            <Skeleton.Text />
          </Skeleton.Region>
        )}
      </Skeleton.Region>
    );
  }
  mount(<Content more={false} />);
  expect(shapes()[0]?.style.animationDelay).toBe('0ms');
  act(() => jest.advanceTimersByTime(300));
  mount(<Content more />);
  expect(shapes().map((node) => node.style.animationDelay)).toEqual(['0ms', '-300ms', '-300ms']);
  expect(container.querySelectorAll('[role="group"]')).toHaveLength(1);
  expect(container.querySelector('[role="group"]')?.getAttribute('aria-label')).toBe(
    'Loading profile',
  );
  const css = sheets
    .adopted()
    .filter((sheet) => sheet.cssText.includes('@keyframes bloom-skeleton-shimmer'));
  expect(css).toHaveLength(1);
  expect(css[0]?.replaceSyncCalls).toBe(1);
  expect(css[0]?.cssText).toContain('@media (prefers-reduced-motion: reduce)');
  expect(css[0]?.cssText).toContain('animation: none');
});

it('retains blend, explicit opacity overrides and standalone loading shapes', () => {
  mount(
    <>
      <Skeleton.Box width={100} height={40} blend />
      <Skeleton.Circle size={20} blend style={{ opacity: 0.25 }} />
      <Skeleton.Pill size={20} style={{ opacity: 0 }} />
    </>,
  );
  expect(shapes().map((node) => node.style.opacity)).toEqual(['0.6', '0.25', '0']);
  expect(shapes().map((node) => node.dataset.bloomSkeletonMotion)).toEqual([
    'animated',
    'static',
    'static',
  ]);
  expect(shapes()[0]?.style.getPropertyValue('--bloom-skeleton-opacity')).toBe('0.6');
  expect(container.querySelectorAll('[role="group"]')).toHaveLength(0);
  expect(shapes().every((node) => node.getAttribute('aria-hidden') === 'true')).toBe(true);
});
