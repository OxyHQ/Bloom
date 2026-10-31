import { act } from 'react';
import TestRenderer from 'react-test-renderer';
import { Platform } from 'react-native';
// Bloom's Jest resolver does not select .native; exercise that fork explicitly.
jest.mock('../surface/use-surface-paint-layer', () =>
  jest.requireActual('../surface/use-surface-paint-layer.native'),
);
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { SurfacePaint } from '../surface/SurfacePaint';

type Fiber = {
  type?: { name?: string } | string | null;
  return: Fiber | null;
  child: Fiber | null;
  sibling: Fiber | null;
  stateNode?: { current?: Fiber } | null;
  memoizedState: { next: unknown } | null;
};

const originalOS = Platform.OS;
afterEach(() => {
  Platform.OS = originalOS;
});

it.each(['ios', 'android'] as const)('does not allocate web material hooks on %s', (os) => {
  Platform.OS = os;
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  let renderer!: TestRenderer.ReactTestRenderer;
  act(() => {
    renderer = TestRenderer.create(
      <BloomThemeProvider fonts={false}>
        <SurfacePaint fill="#fff" />
      </BloomThemeProvider>,
    );
  });
  let root = (renderer.root as unknown as { _fiber: Fiber })._fiber;
  while (root.return) root = root.return;
  root = root.stateNode?.current ?? root;
  const pending = [root];
  let paint: Fiber | undefined;
  while (pending.length) {
    const fiber = pending.pop();
    if (!fiber) continue;
    if (typeof fiber.type !== 'string' && fiber.type?.name === 'SurfacePaint') paint = fiber;
    if (fiber.child) pending.push(fiber.child);
    if (fiber.sibling && fiber !== root) pending.push(fiber.sibling);
  }
  if (!paint) throw new Error('SurfacePaint fiber was not mounted');
  let count = 0;
  for (let hook = paint.memoizedState; hook; hook = hook.next as typeof hook) count += 1;
  expect(count).toBe(3);
  act(() => renderer.unmount());
});
