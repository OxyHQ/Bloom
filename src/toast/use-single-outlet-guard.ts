/**
 * Bloom-original — the dev-only guard against a SECOND toast outlet.
 *
 * Every `Toaster` subscribes to the ONE module-level `toastStore`, which has no
 * notion of an owning outlet, so N mounted outlets each render the full row set:
 * a toast appears N times. Nothing in the engine can dedupe that — the outlets
 * are legitimate, independent subscribers — so the contract is "mount exactly
 * one" and this is what enforces it.
 *
 * WHY A WARNING IS WORTH ITS WEIGHT: the copies are not visually separated, so
 * the defect does not look like duplication. Two bare outlets take identical
 * defaults and land pixel-identical; two outlets whose `offset` differs by a
 * point land 1px apart. Only counting the rendered rows reveals it, which is not
 * something anyone thinks to do — the reports this guard comes from all read as
 * "the toast looks wrong", never as "there are two of them". Stacking is on by
 * default, so a duplicate outlet now doubles the rows INSIDE a stack.
 *
 * The counter is decremented on unmount, so a remount, a route change that moves
 * the outlet, Fast Refresh and React's StrictMode double-invoke (setup, cleanup,
 * setup) all pass through a count of 1 and stay silent. The latch keeps the
 * warning to exactly one per module lifetime rather than one per extra outlet,
 * and — because StrictMode replays the setups — one per app, not two.
 *
 * Gated on `process.env.NODE_ENV`, the same mechanism as
 * `content-panel/nesting-context.ts`: Metro and Vite/Rolldown both fold it
 * statically, so production keeps the counter, the branch and the message out of
 * the bundle entirely. Deliberately NOT `__DEV__`, which is a Metro global that a
 * plain web bundler does not define. It only ever warns — a duplicate outlet
 * renders a redundant toast, it does not break the app, so it must never throw.
 */
import * as React from 'react';

let mountedOutlets = 0;
let hasWarned = false;

export function useSingleOutletGuard(): void {
  React.useEffect(() => {
    if (process.env.NODE_ENV === 'production') {
      return;
    }

    mountedOutlets += 1;
    if (mountedOutlets > 1 && !hasWarned) {
      hasWarned = true;
      // Internal Bloom diagnostic: the consumer's tree is the only place this
      // can be fixed, so it names the usual cause rather than just the symptom.
      // eslint-disable-next-line no-console
      console.warn(
        `[Bloom] Toaster: ${mountedOutlets} toast outlets are mounted, so every ` +
          'toast renders once per outlet. The copies overlap almost exactly, so ' +
          'this reads as a rendering glitch rather than as duplicate rows. Mount ' +
          "exactly one: @oxyhq/services' OxyProvider already renders a " +
          'ToastOutlet, so an app that uses it must not render its own.',
      );
    }

    return () => {
      mountedOutlets -= 1;
    };
  }, []);
}

/**
 * Test-only reset: both the counter and the one-shot latch are module state that
 * outlives a render tree, so without this the first suite to mount two outlets
 * would latch the warning and leave every later suite asserting against a guard
 * that can no longer fire — passing whatever the implementation did.
 */
export function resetSingleOutletGuardForTests(): void {
  mountedOutlets = 0;
  hasWarned = false;
}
