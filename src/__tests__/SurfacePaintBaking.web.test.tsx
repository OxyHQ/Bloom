/** @jest-environment jsdom */
import { act } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
jest.mock('react-native', () => jest.requireActual('react-native-web'));
const mockBaking = jest.fn();
jest.mock('../surface/baked-material', () => {
  const actual = jest.requireActual<typeof import('../surface/baked-material')>(
    '../surface/baked-material',
  );
  return {
    ...actual,
    useBakedMaterial: (...args: Parameters<typeof actual.useBakedMaterial>) => {
      mockBaking(...args);
      actual.useBakedMaterial(...args);
    },
  };
});
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { SurfacePaint } from '../surface/SurfacePaint';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

it('keeps the web paint node registered for baking and disables it during transitions', () => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  const render = (transition?: string) => (
    <BloomThemeProvider fonts={false}>
      <SurfacePaint testID="paint" fill="#ffffff" transition={transition} />
    </BloomThemeProvider>
  );
  act(() => root.render(render()));
  const call = mockBaking.mock.lastCall;
  if (!call) throw new Error('Web paint did not register the baking hook');
  const [ref, enabled] = call;
  expect(enabled).toBe(true);
  expect(ref.current).toBe(container.querySelector('[data-testid="paint"]'));

  act(() => root.render(render('background-color 200ms')));
  const nextCall = mockBaking.mock.lastCall;
  if (!nextCall) throw new Error('Web paint did not update the baking hook');
  const [nextRef, nextEnabled] = nextCall;
  expect(nextRef).toBe(ref);
  expect(nextEnabled).toBe(false);

  act(() => root.unmount());
  expect(ref.current).toBeNull();
  container.remove();
});

it('hydrates the server-rendered paint without replacing its DOM node', async () => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const app = (
    <BloomThemeProvider fonts={false}>
      <SurfacePaint testID="paint" fill="#ffffff" />
    </BloomThemeProvider>
  );
  container.innerHTML = renderToString(app);
  const paint = container.querySelector('[data-testid="paint"]');
  expect(paint).not.toBeNull();
  const errors: unknown[] = [];
  let root!: ReturnType<typeof hydrateRoot>;
  await act(async () => {
    root = hydrateRoot(container, app, { onRecoverableError: (error) => errors.push(error) });
  });
  expect(errors).toEqual([]);
  expect(container.querySelector('[data-testid="paint"]')).toBe(paint);
  act(() => root.unmount());
  container.remove();
});
