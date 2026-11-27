/**
 * @jest-environment node
 *
 * `.refreshable { … }`'s binding (`refreshRun`, stdlib/Bloom/runtime.ts): a pull sets the
 * refreshing state and runs the action once; the action's end, or its failure, clears it.
 */
import { refreshRun } from '../stdlib/Bloom/runtime';

function state() {
  const writes: boolean[] = [];
  let value = false;
  const binding = () =>
    [
      value,
      (next: boolean) => {
        value = next;
        writes.push(next);
      },
    ] as const;
  return { writes, binding };
}

test('a pull runs the action, and its end ends the refresh', async () => {
  const s = state();
  let runs = 0;
  let finish: () => void = () => {};
  const action = () =>
    new Promise<void>((resolve) => {
      runs += 1;
      finish = resolve;
    });
  refreshRun(s.binding(), action)[1](true);
  // A second pull while refreshing starts nothing.
  refreshRun(s.binding(), action)[1](true);
  await Promise.resolve();
  expect(runs).toBe(1);
  expect(s.writes).toEqual([true]);
  finish();
  await new Promise((resolve) => setTimeout(resolve, 0));
  expect(s.writes).toEqual([true, false]);
});

test('a failed action still ends the refresh', async () => {
  const s = state();
  refreshRun(s.binding(), () => Promise.reject(new Error('offline')))[1](true);
  await new Promise((resolve) => setTimeout(resolve, 0));
  expect(s.writes).toEqual([true, false]);
});
