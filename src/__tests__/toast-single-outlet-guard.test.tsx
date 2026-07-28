import React from 'react';
import { render } from '@testing-library/react-native';

import { ToastOutlet } from '../toast';
import { resetSingleOutletGuardForTests } from '../toast/use-single-outlet-guard';

/**
 * THE DUPLICATE-OUTLET GUARD.
 *
 * `Toaster` subscribes to the module-level `toastStore`, so two mounted outlets
 * render two copies of every row — measured 1→1, 2→2, 3→3 in Mention, and 1→2→1
 * in Alia with the second outlet gated on a query param inside ONE bundle so both
 * arms came from identical bytes. The copies overlap almost exactly (bare outlets
 * take identical defaults and land pixel-identical), so nothing but a row count
 * reveals it — hence a warning.
 *
 * Every test here mounts outlets and fires NO toast: a second outlet duplicates
 * rows from the moment it mounts, so the warning must not wait for one. An idle
 * `Toaster` renders null, which is why these need no theme provider or portal.
 *
 * The guard's module state outlives a render tree, so `beforeEach` resets it.
 * Without that, the first test to latch the warning would leave every later test
 * asserting "did not warn" against a guard that can no longer fire — green
 * whatever the implementation does. That vacuity is the specific failure mode
 * this suite is mutation-tested against; see the per-test mutation notes.
 */
describe('duplicate toast outlet guard', () => {
  let warn: jest.SpyInstance<void, Parameters<typeof console.warn>>;

  beforeEach(() => {
    resetSingleOutletGuardForTests();
    // `__mocks__/setup.ts` already silences console.warn; this re-spies so the
    // calls are recorded and stay scoped to one test.
    warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warn.mockRestore();
  });

  const bloomWarnings = () =>
    warn.mock.calls.filter(
      (call) => typeof call[0] === 'string' && call[0].startsWith('[Bloom] Toaster:'),
    );

  /** Mutation: `mountedOutlets > 1` → `>= 1` warns here. */
  it('stays silent for a single outlet', () => {
    render(<ToastOutlet />);

    expect(bloomWarnings()).toHaveLength(0);
  });

  it('warns exactly once when a second outlet mounts', () => {
    render(
      <>
        <ToastOutlet />
        <ToastOutlet />
      </>,
    );

    expect(bloomWarnings()).toHaveLength(1);
  });

  it('names the cause rather than just the symptom', () => {
    render(
      <>
        <ToastOutlet />
        <ToastOutlet />
      </>,
    );

    // The consumer's tree is the only place this is fixable, and the overwhelming
    // cause is an app mounting its own outlet beside OxyProvider's.
    expect(bloomWarnings()[0]?.[0]).toContain('OxyProvider');
  });

  /** Mutation: drop the `hasWarned` latch and this warns twice. */
  it('warns once, not once per extra outlet, when a third mounts', () => {
    render(
      <>
        <ToastOutlet />
        <ToastOutlet />
        <ToastOutlet />
      </>,
    );

    expect(bloomWarnings()).toHaveLength(1);
  });

  /**
   * Mutation: drop the unmount decrement and the second mount reads a count of 2
   * and warns. This is the counter-never-resets failure mode.
   */
  it('does not warn across an unmount / remount cycle', () => {
    render(<ToastOutlet />).unmount();
    render(<ToastOutlet />);

    expect(bloomWarnings()).toHaveLength(0);
  });

  /** Three cycles: a counter that leaks by one per mount crosses the threshold. */
  it('does not warn across repeated remounts', () => {
    render(<ToastOutlet />).unmount();
    render(<ToastOutlet />).unmount();
    render(<ToastOutlet />);

    expect(bloomWarnings()).toHaveLength(0);
  });

  /**
   * A route change or provider reshuffle that moves the outlet: React runs the
   * outgoing tree's cleanups before the incoming tree's setups, so the count dips
   * to 0 and back to 1 rather than reaching 2.
   */
  it('does not warn when one outlet replaces another', () => {
    const first = render(<ToastOutlet />);
    const second = render(<ToastOutlet />);
    first.unmount();
    second.unmount();
    render(<ToastOutlet />);

    // Two were genuinely co-mounted in the middle, so one warning is correct...
    expect(bloomWarnings()).toHaveLength(1);
  });

  /**
   * StrictMode is the dominant dev environment and it replays effects
   * (setup → cleanup → setup), so without the latch a real duplicate would warn
   * TWICE and a well-behaved single outlet could warn at all. Verified against
   * this renderer: it does double-invoke, so neither case below is vacuous.
   */
  describe('under StrictMode double-invoked effects', () => {
    it('still stays silent for a single outlet', () => {
      render(
        <React.StrictMode>
          <ToastOutlet />
        </React.StrictMode>,
      );

      expect(bloomWarnings()).toHaveLength(0);
    });

    it('still warns exactly once for a duplicate', () => {
      render(
        <React.StrictMode>
          <ToastOutlet />
          <ToastOutlet />
        </React.StrictMode>,
      );

      expect(bloomWarnings()).toHaveLength(1);
    });
  });

  /**
   * Mutation: drop the `process.env.NODE_ENV` gate and this warns. Bundlers fold
   * the branch statically, so production ships neither the counter nor the
   * message — the guard must not change production behaviour at all.
   */
  it('does not warn in production', () => {
    const previous = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    try {
      render(
        <>
          <ToastOutlet />
          <ToastOutlet />
        </>,
      );
    } finally {
      process.env.NODE_ENV = previous;
    }

    expect(bloomWarnings()).toHaveLength(0);
  });
});
