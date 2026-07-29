import React from 'react';
import { render } from '@testing-library/react-native';
import type NetInfo from '@react-native-community/netinfo';

import type { NetInfoLike } from '../connection-status/netinfo';

/**
 * THE OPTIONAL-PEER BOUNDARY for `@react-native-community/netinfo`.
 *
 * The defect: netinfo was declared an optional peer AND imported statically, so
 * an app that never installed it did not lose the outage toast — its native
 * bundle failed to build, pointing at a package it never mentions. The fix
 * (`try { require('<literal>') } catch`) has to hold two properties at once, and
 * both are asserted here: the real module is still used when it IS installed,
 * and the component degrades to inert — not to a crash, and not silently —
 * when it is not.
 *
 * `optional-peer-imports.test.ts` guards the static shape of the same contract.
 * This one runs it.
 *
 * Every case goes through `jest.isolateModules` + `jest.doMock` because the
 * loader caches its result in module state: without a fresh registry the first
 * case to resolve netinfo would leave every later case asserting against a cache
 * it can no longer influence, passing whatever the implementation did.
 */

const NETINFO = '@react-native-community/netinfo';
const reactModule: unknown = jest.requireActual('react');

/** A netinfo state object with only the two fields the component reads. */
function state(isConnected: boolean, isInternetReachable: boolean | null = true) {
  return { isConnected, isInternetReachable };
}

/**
 * Compile-time half of the contract: the real netinfo surface must remain
 * assignable to Bloom's hand-written `NetInfoLike`. The interface is written by
 * hand so netinfo's types never reach Bloom's emitted `.d.ts` (a consumer that
 * skips the optional peer must not inherit a TS7016 from Bloom), which leaves
 * this as the only place a shape change in netinfo can be caught.
 *
 * It is enforced by `bun run typescript`, NOT by jest: ts-jest transpiles
 * without typechecking here, so a drifted type is green under `bunx jest` and
 * red under `tsc` (verified by mutation — widening the unsubscribe to
 * `Promise<void>` produces `TS2322: Type 'true' is not assignable to type
 * 'never'` on the line below).
 */
type RealNetInfoIsCompatible = typeof NetInfo extends NetInfoLike ? true : never;
const NETINFO_TYPES_STILL_MATCH: RealNetInfoIsCompatible = true;

type Harness = {
  ConnectionStatusToasts: React.ComponentType<Record<string, never>>;
  toast: { error: jest.Mock; warning: jest.Mock; success: jest.Mock };
};

/**
 * Load `connection-status` against a given netinfo module factory. Passing a
 * factory that THROWS is how the absent-peer case is expressed: that is exactly
 * what the `catch` sees when Metro stubs an unresolved optional dependency.
 */
function loadWithNetInfo(factory: () => unknown): Harness {
  let harness: Harness | undefined;

  jest.isolateModules(() => {
    const toast = { error: jest.fn(), warning: jest.fn(), success: jest.fn() };
    // NOT `{ virtual: true }`: netinfo is a real devDependency here, and a
    // virtual mock is keyed by the bare name while the component's `require`
    // resolves to the installed path — the mock would never be consulted and
    // every case would quietly run against the real module.
    jest.doMock(NETINFO, factory);
    jest.doMock('../toast', () => ({ toast }));
    // An isolated registry would otherwise build the component against a SECOND
    // copy of React, whose dispatcher is null under the outer renderer — every
    // case would fail on `useState` before reaching what it asserts. Pinning
    // react to the outer instance keeps one hook dispatcher for the whole tree.
    jest.doMock('react', () => reactModule);

    // A plain `require`, NOT `jest.requireActual`: the latter bypasses the mock
    // registry for the whole dependency subtree, so the doMocks above would be
    // ignored and the suite would silently exercise the REAL netinfo.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { ConnectionStatusToasts } = require('../connection-status') as typeof import('../connection-status');

    harness = { ConnectionStatusToasts, toast };
  });

  if (!harness) throw new Error('module isolation did not run');
  return harness;
}

describe('ConnectionStatusToasts netinfo loading', () => {
  let warn: jest.SpyInstance<void, Parameters<typeof console.warn>>;

  beforeEach(() => {
    // `__mocks__/setup.ts` already silences console.warn; this re-spies so the
    // calls are recorded and stay scoped to one test.
    warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warn.mockRestore();
    jest.resetModules();
    jest.dontMock(NETINFO);
    jest.dontMock('../toast');
  });

  it('keeps its own types in step with the real netinfo surface', () => {
    // The real assertion is the type annotation above, checked by `tsc`. This
    // only keeps the constant referenced so it cannot be dropped as unused.
    expect(NETINFO_TYPES_STILL_MATCH).toBe(true);
  });

  it('subscribes through the named export when the peer is installed', () => {
    const unsubscribe = jest.fn();
    const addEventListener = jest.fn().mockReturnValue(unsubscribe);
    const { ConnectionStatusToasts, toast } = loadWithNetInfo(() => ({ addEventListener }));

    const view = render(<ConnectionStatusToasts />);
    expect(addEventListener).toHaveBeenCalledTimes(1);
    expect(warn).not.toHaveBeenCalled();

    const emit = addEventListener.mock.calls[0][0] as (s: ReturnType<typeof state>) => void;
    view.rerender(<ConnectionStatusToasts />);
    emit(state(false));
    view.rerender(<ConnectionStatusToasts />);

    expect(toast.error).toHaveBeenCalledWith('No internet connection', expect.anything());

    view.unmount();
    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });

  it('subscribes through the default export too', () => {
    // Which shape comes back depends on whether the bundler resolved netinfo's
    // CommonJS build or its ESM/source entry; both are live in the fleet.
    const addEventListener = jest.fn().mockReturnValue(jest.fn());
    const { ConnectionStatusToasts } = loadWithNetInfo(() => ({
      __esModule: true,
      default: { addEventListener },
    }));

    render(<ConnectionStatusToasts />);
    expect(addEventListener).toHaveBeenCalledTimes(1);
  });

  it('renders inert instead of throwing when the peer is absent', () => {
    const { ConnectionStatusToasts, toast } = loadWithNetInfo(() => {
      throw new Error(`Cannot find module '${NETINFO}'`);
    });

    const view = render(<ConnectionStatusToasts />);
    expect(view.toJSON()).toBeNull();
    expect(toast.error).not.toHaveBeenCalled();
    expect(toast.warning).not.toHaveBeenCalled();
    expect(toast.success).not.toHaveBeenCalled();
    expect(() => view.unmount()).not.toThrow();
  });

  it('names the missing package once, not once per mount', () => {
    const { ConnectionStatusToasts } = loadWithNetInfo(() => {
      throw new Error(`Cannot find module '${NETINFO}'`);
    });

    render(<ConnectionStatusToasts />).unmount();
    render(<ConnectionStatusToasts />).unmount();

    expect(warn).toHaveBeenCalledTimes(1);
    const [message] = warn.mock.calls[0] as [string];
    // An actionable warning has to carry all three: what broke, which package,
    // and how to fix it. A bare "netinfo missing" sends the reader to Bloom.
    expect(message).toContain(NETINFO);
    expect(message).toContain('inert');
    expect(message).toContain('expo install');
    // …and the underlying resolution error, so a shape/version failure is not
    // reported as if the package were simply not installed.
    expect(message).toContain('Cannot find module');
  });

  it('warns when the peer resolves but has no addEventListener', () => {
    const { ConnectionStatusToasts } = loadWithNetInfo(() => ({ fetch: jest.fn() }));

    render(<ConnectionStatusToasts />);

    expect(warn).toHaveBeenCalledTimes(1);
    expect((warn.mock.calls[0] as [string])[0]).toContain('without an `addEventListener` export');
  });

  it('stays silent in production', () => {
    const previous = process.env.NODE_ENV;
    // Metro and Vite fold this branch away entirely; jest cannot, so the guard
    // is asserted at runtime instead.
    process.env.NODE_ENV = 'production';
    try {
      const { ConnectionStatusToasts } = loadWithNetInfo(() => {
        throw new Error(`Cannot find module '${NETINFO}'`);
      });
      render(<ConnectionStatusToasts />);
      expect(warn).not.toHaveBeenCalled();
    } finally {
      process.env.NODE_ENV = previous;
    }
  });
});
