/**
 * What a tree costs React: fibers, hook slots and context reads below a
 * marker host, by the same walk as the runtime's cost gate
 * (`packages/bloom-language/parity/cost.parity.test.tsx`). This suite runs on
 * the runtime's stand-ins, whose theme has no provider (its contexts read
 * their defaults), so both sides of a comparison render with none.
 */
import type { ReactElement } from 'react';
import * as RN from 'react-native';
import TestRenderer, { act } from 'react-test-renderer';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

interface Fiber {
  tag: number;
  child: Fiber | null;
  sibling: Fiber | null;
  return: Fiber | null;
  stateNode: { current?: Fiber } | null;
  memoizedProps: { testID?: string } | null;
  memoizedState: { next: unknown } | null;
  dependencies?: { firstContext: { next: unknown } | null } | null;
}

export interface Cost {
  fibers: number;
  hooks: number;
  contexts: number;
}

/** React's function-component tags (Function, ForwardRef, Memo, SimpleMemo): the fibers that hold hooks. */
const HOOK_TAGS = new Set([0, 11, 14, 15]);

/** Renders `element` and counts what is below the marker; `inspect` sees the live tree. */
export function measured(
  element: ReactElement,
  inspect?: (renderer: TestRenderer.ReactTestRenderer) => void,
): Cost {
  let renderer!: TestRenderer.ReactTestRenderer;
  act(() => {
    renderer = TestRenderer.create(<RN.View testID="measured">{element}</RN.View>);
  });
  let top = (renderer.root as unknown as { _fiber: Fiber })._fiber;
  while (top.return) top = top.return;
  const stack: Fiber[] = [top.stateNode?.current ?? top];
  let marker: Fiber | undefined;
  while (marker === undefined && stack.length > 0) {
    const fiber = stack.pop() as Fiber;
    if (fiber.tag === 5 && fiber.memoizedProps?.testID === 'measured') marker = fiber;
    if (fiber.sibling) stack.push(fiber.sibling);
    if (fiber.child) stack.push(fiber.child);
  }
  const cost: Cost = { fibers: 0, hooks: 0, contexts: 0 };
  const walk = (first: Fiber | null): void => {
    for (let fiber = first; fiber; fiber = fiber.sibling) {
      cost.fibers += 1;
      if (HOOK_TAGS.has(fiber.tag))
        for (let hook = fiber.memoizedState; hook; hook = hook.next as Fiber['memoizedState'])
          cost.hooks += 1;
      for (
        let read = fiber.dependencies?.firstContext ?? null;
        read;
        read = read.next as typeof read
      )
        cost.contexts += 1;
      walk(fiber.child);
    }
  };
  walk(marker?.child ?? null);
  inspect?.(renderer);
  act(() => renderer.unmount());
  return cost;
}
