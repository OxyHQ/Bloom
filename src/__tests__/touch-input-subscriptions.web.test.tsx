/** @jest-environment jsdom */
import React, { act, StrictMode } from 'react';
import { createRoot, hydrateRoot, type Root } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
jest.mock('react-native', () => jest.requireActual('react-native-web'));
import { PlatformSurfaceProvider } from '../platform-surface/context';
import type { PlatformSurfaceAdapter } from '../platform-surface/types';
import { useTouchInput } from '../styles/pointer';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
const originalMatchMedia = window.matchMedia;
let host: HTMLDivElement;
let root: Root | undefined;
let coarse: boolean;
let active: Set<EventListenerOrEventListenerObject>;
let media: MediaQueryList;
let added: jest.Mock;
let removed: jest.Mock;

function installMedia(legacy = false) {
  coarse = false;
  active = new Set();
  added = jest.fn((listener: EventListenerOrEventListenerObject) => active.add(listener));
  removed = jest.fn((listener: EventListenerOrEventListenerObject) => active.delete(listener));
  const result = {
    media: '(pointer: coarse)',
    get matches() {
      return coarse;
    },
    onchange: null,
    addListener: (listener: EventListenerOrEventListenerObject) => added(listener),
    removeListener: (listener: EventListenerOrEventListenerObject) => removed(listener),
    dispatchEvent: () => true,
    ...(legacy
      ? {}
      : {
          addEventListener: (type: string, listener: EventListenerOrEventListenerObject) => {
            if (type === 'change') added(listener);
          },
          removeEventListener: (type: string, listener: EventListenerOrEventListenerObject) => {
            if (type === 'change') removed(listener);
          },
        }),
  };
  media = result as unknown as MediaQueryList;
  window.matchMedia = jest.fn(() => media);
}
function change(value: boolean) {
  act(() => {
    coarse = value;
    for (const listener of [...active]) {
      if (typeof listener === 'function') listener(new Event('change'));
      else listener.handleEvent(new Event('change'));
    }
  });
}
function Probe({ id }: { id: string }) {
  return <span data-testid={id}>{String(useTouchInput())}</span>;
}
function value(id: string) {
  return host.querySelector(`[data-testid="${id}"]`)?.textContent;
}
function render(node: React.ReactNode) {
  act(() => root?.render(node));
}

beforeEach(() => {
  installMedia();
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
});
afterEach(() => {
  if (root) act(() => root?.unmount());
  host.remove();
  window.matchMedia = originalMatchMedia;
});

it('shares one listener across consumers and removes it with the final consumer', () => {
  render(
    <>
      <Probe id="a" />
      <Probe id="b" />
      <Probe id="c" />
    </>,
  );
  expect(active.size).toBe(1);
  expect(added).toHaveBeenCalledTimes(1);
  expect([value('a'), value('b'), value('c')]).toEqual(['false', 'false', 'false']);
  change(true);
  expect([value('a'), value('b'), value('c')]).toEqual(['true', 'true', 'true']);
  render(
    <>
      <Probe id="a" />
      <Probe id="b" />
    </>,
  );
  expect(active.size).toBe(1);
  expect(removed).not.toHaveBeenCalled();
  change(false);
  expect([value('a'), value('b')]).toEqual(['false', 'false']);
  render(null);
  expect(active.size).toBe(0);
  expect(removed).toHaveBeenCalledTimes(1);
  coarse = true;
  render(<Probe id="fresh" />);
  expect(active.size).toBe(1);
  expect(added).toHaveBeenCalledTimes(2);
  expect(value('fresh')).toBe('true');
});

it('leaves exactly one active listener in StrictMode and none after unmount', () => {
  render(
    <StrictMode>
      <Probe id="a" />
      <Probe id="b" />
    </StrictMode>,
  );
  expect(active.size).toBe(1);
  expect(added.mock.calls.length - removed.mock.calls.length).toBe(1);
  render(null);
  expect(active.size).toBe(0);
  expect(added.mock.calls.length).toBe(removed.mock.calls.length);
});

it('observes a change between the initial render and subscription', () => {
  added.mockImplementation((listener: EventListenerOrEventListenerObject) => {
    active.add(listener);
    // No change event is delivered: React must check the snapshot after subscribing.
    coarse = true;
  });
  render(<Probe id="a" />);
  expect(value('a')).toBe('true');
  expect(active.size).toBe(1);
});

it('honours changing platform capabilities while following the shared media query', () => {
  const desktop: PlatformSurfaceAdapter = {
    platform: 'desktop',
    capabilities: new Set(['window']),
  };
  const pointer: PlatformSurfaceAdapter = {
    platform: 'desktop',
    capabilities: new Set(['pointer']),
  };
  const normal: PlatformSurfaceAdapter = {
    platform: 'other',
    capabilities: new Set(['popup-surface']),
  };
  function tree(value: PlatformSurfaceAdapter | null) {
    return (
      <PlatformSurfaceProvider value={value}>
        <Probe id="a" />
      </PlatformSurfaceProvider>
    );
  }
  render(tree(normal));
  change(true);
  expect(value('a')).toBe('true');
  render(tree(desktop));
  expect(value('a')).toBe('false');
  render(tree(pointer));
  expect(value('a')).toBe('false');
  render(tree(null));
  expect(value('a')).toBe('true');
  expect(active.size).toBe(1);
});

it('supports the legacy media query listener API', () => {
  installMedia(true);
  render(
    <>
      <Probe id="a" />
      <Probe id="b" />
    </>,
  );
  expect(active.size).toBe(1);
  change(true);
  expect([value('a'), value('b')]).toEqual(['true', 'true']);
  render(null);
  expect(active.size).toBe(0);
  expect(added).toHaveBeenCalledTimes(1);
  expect(removed).toHaveBeenCalledTimes(1);
});

it.each(['missing', 'throwing'] as const)(
  'falls back to false when matchMedia is %s',
  (failure) => {
    window.matchMedia =
      failure === 'missing'
        ? (undefined as unknown as typeof window.matchMedia)
        : () => {
            throw new Error('unavailable');
          };
    render(<Probe id="a" />);
    expect(value('a')).toBe('false');
  },
);

it('renders the server fallback and hydrates to the current client setting', async () => {
  act(() => root?.unmount());
  root = undefined;
  coarse = true;
  host.innerHTML = renderToString(<Probe id="a" />);
  expect(value('a')).toBe('false');
  const errors = jest.spyOn(console, 'error').mockImplementation(() => {});
  try {
    await act(async () => {
      root = hydrateRoot(host, <Probe id="a" />);
    });
    expect(value('a')).toBe('true');
    expect(active.size).toBe(1);
    expect(errors).not.toHaveBeenCalled();
    change(false);
    expect(value('a')).toBe('false');
  } finally {
    errors.mockRestore();
  }
});

it('keeps independent listeners when separate copies of the module are loaded', () => {
  jest.doMock('react', () => React);
  try {
    let first: typeof useTouchInput | undefined;
    let second: typeof useTouchInput | undefined;
    jest.isolateModules(() => {
      first = require('../styles/pointer').useTouchInput;
    });
    jest.isolateModules(() => {
      second = require('../styles/pointer').useTouchInput;
    });
    if (!first || !second) throw new Error('Failed to load isolated modules');
    const useFirst = first;
    const useSecond = second;
    function First() {
      return <span data-testid="first">{String(useFirst())}</span>;
    }
    function Second() {
      return <span data-testid="second">{String(useSecond())}</span>;
    }
    render(
      <>
        <First />
        <Second />
      </>,
    );
    expect(active.size).toBe(2);
    change(true);
    expect([value('first'), value('second')]).toEqual(['true', 'true']);
    render(<Second />);
    expect(active.size).toBe(1);
    change(false);
    expect(value('second')).toBe('false');
    render(null);
    expect(active.size).toBe(0);
  } finally {
    jest.dontMock('react');
  }
});

function isolatedSubscribe() {
  let subscribe!: (listener: () => void) => () => void;
  jest.doMock('react', () => ({
    ...React,
    useSyncExternalStore: (attach: typeof subscribe) => {
      subscribe = attach;
      return false;
    },
  }));
  jest.doMock('../platform-surface/context', () => ({ usePlatformSurfaces: () => null }));
  try {
    jest.isolateModules(() => {
      const isolated = require('../styles/pointer') as typeof import('../styles/pointer');
      isolated.useTouchInput();
    });
  } finally {
    jest.dontMock('react');
    jest.dontMock('../platform-surface/context');
  }
  return subscribe;
}

it('handles unsubscribe and subscribe during a notification without calling stale listeners', () => {
  const subscribe = isolatedSubscribe();
  const next = jest.fn();
  const stale = jest.fn();
  let removeStale = () => {};
  let removeNext = () => {};
  let first = true;
  const current = jest.fn(() => {
    if (!first) return;
    first = false;
    removeStale();
    removeNext = subscribe(next);
  });
  const removeCurrent = subscribe(current);
  removeStale = subscribe(stale);
  expect(active.size).toBe(1);
  change(true);
  expect(current).toHaveBeenCalledTimes(1);
  expect(stale).not.toHaveBeenCalled();
  expect(next).not.toHaveBeenCalled();
  change(false);
  expect(current).toHaveBeenCalledTimes(2);
  expect(next).toHaveBeenCalledTimes(1);
  removeCurrent();
  removeNext();
  expect(active.size).toBe(0);
});

it('does not retain a subscriber when installing its browser listener throws', () => {
  const subscribe = isolatedSubscribe();
  media.addEventListener = () => {
    throw new Error('cannot subscribe');
  };
  const abandoned = jest.fn();
  expect(() => subscribe(abandoned)).toThrow('cannot subscribe');
  expect(active.size).toBe(0);
  installMedia();
  const current = jest.fn();
  const removeCurrent = subscribe(current);
  expect(active.size).toBe(1);
  change(true);
  expect(current).toHaveBeenCalledTimes(1);
  expect(abandoned).not.toHaveBeenCalled();
  removeCurrent();
  expect(active.size).toBe(0);
});
