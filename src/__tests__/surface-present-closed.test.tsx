import React, { useLayoutEffect } from 'react';
import { act, render } from '@testing-library/react-native';
import type { DialogProps } from '../dialog/types';
import { presentCancelable } from '../surfaces';
import { createSurfaceHost } from '../surfaces/SurfaceHost';
import {
  __resetSurfacesForTests,
  finalizeClose,
  getSnapshot,
  markSurfaceMounted,
  requestDismiss,
  resetSurfaces,
  subscribe,
} from '../surfaces/surface-store';

const noop = () => null;
const flush = () => Promise.resolve();
function firstId() {
  const entry = getSnapshot()[0];
  if (!entry) throw new Error('Expected the surface');
  return entry.id;
}

afterEach(() => {
  resetSurfaces();
  __resetSurfacesForTests();
});

it('notifies once asynchronously for a signal aborted before presentation', async () => {
  const controller = new AbortController();
  controller.abort();
  const closed = jest.fn();
  const result = presentCancelable(noop, { signal: controller.signal, onClosed: closed });
  expect(closed).not.toHaveBeenCalled();
  expect(getSnapshot()).toHaveLength(0);
  await expect(result).resolves.toBeUndefined();
  await flush();
  expect(closed).toHaveBeenCalledTimes(1);
});

it('finishes an answer without a host and releases the listener', async () => {
  const controller = new AbortController();
  const remove = jest.spyOn(controller.signal, 'removeEventListener');
  const closed = jest.fn();
  const result = presentCancelable<string>(noop, { signal: controller.signal, onClosed: closed });
  requestDismiss(firstId(), 'chosen');
  expect(getSnapshot()).toHaveLength(0);
  expect(remove).toHaveBeenCalledTimes(1);
  expect(closed).not.toHaveBeenCalled();
  await expect(result).resolves.toBe('chosen');
  await flush();
  expect(closed).toHaveBeenCalledTimes(1);
});

it('waits for every host after normal exit and calls once after cleanup', async () => {
  const controller = new AbortController();
  const remove = jest.spyOn(controller.signal, 'removeEventListener');
  const closed = jest.fn();
  const result = presentCancelable<string>(noop, { signal: controller.signal, onClosed: closed });
  const id = firstId();
  const releaseFirst = markSurfaceMounted(id);
  const releaseSecond = markSurfaceMounted(id);
  requestDismiss(id, 'chosen');
  await expect(result).resolves.toBe('chosen');
  expect(closed).not.toHaveBeenCalled();
  expect(remove).not.toHaveBeenCalled();
  finalizeClose(id);
  releaseFirst();
  await flush();
  expect(closed).not.toHaveBeenCalled();
  expect(remove).not.toHaveBeenCalled();
  releaseSecond();
  expect(remove).toHaveBeenCalledTimes(1);
  expect(closed).not.toHaveBeenCalled();
  await flush();
  expect(closed).toHaveBeenCalledTimes(1);
  releaseSecond();
  finalizeClose(id);
  await flush();
  expect(closed).toHaveBeenCalledTimes(1);
});

it('keeps the owner through a host hand-off and removes it on abort during exit', async () => {
  const controller = new AbortController();
  const closed = jest.fn();
  const result = presentCancelable<string>(noop, { signal: controller.signal, onClosed: closed });
  const id = firstId();
  const releaseOld = markSurfaceMounted(id);
  requestDismiss(id, 'chosen');
  await expect(result).resolves.toBe('chosen');
  const releaseNew = markSurfaceMounted(id);
  releaseOld();
  await flush();
  expect(closed).not.toHaveBeenCalled();
  controller.abort();
  expect(getSnapshot()).toHaveLength(0);
  await flush();
  expect(closed).not.toHaveBeenCalled();
  releaseNew();
  await flush();
  expect(closed).toHaveBeenCalledTimes(1);
});

it('finishes a normal exit when its last host disappears before animation completion', async () => {
  const controller = new AbortController();
  const remove = jest.spyOn(controller.signal, 'removeEventListener');
  const closed = jest.fn();
  const result = presentCancelable<string>(noop, { signal: controller.signal, onClosed: closed });
  const id = firstId();
  const release = markSurfaceMounted(id);
  requestDismiss(id, 'chosen');
  await expect(result).resolves.toBe('chosen');
  expect(getSnapshot()[0]?.status).toBe('closing');
  release();
  expect(getSnapshot()).toHaveLength(0);
  await flush();
  expect(remove).toHaveBeenCalledTimes(1);
  expect(closed).toHaveBeenCalledTimes(1);
  controller.abort();
  await flush();
  expect(closed).toHaveBeenCalledTimes(1);
});

it('waits for both hosts after reset during an answered exit', async () => {
  const controller = new AbortController();
  const remove = jest.spyOn(controller.signal, 'removeEventListener');
  const closed = jest.fn();
  const result = presentCancelable<string>(noop, { signal: controller.signal, onClosed: closed });
  const id = firstId();
  const releaseFirst = markSurfaceMounted(id);
  const releaseSecond = markSurfaceMounted(id);
  requestDismiss(id, 'chosen');
  resetSurfaces();
  await expect(result).resolves.toBe('chosen');
  await flush();
  expect(closed).not.toHaveBeenCalled();
  expect(remove).not.toHaveBeenCalled();
  releaseFirst();
  await flush();
  expect(closed).not.toHaveBeenCalled();
  expect(remove).not.toHaveBeenCalled();
  releaseSecond();
  await flush();
  expect(closed).toHaveBeenCalledTimes(1);
  expect(remove).toHaveBeenCalledTimes(1);
  releaseSecond();
  controller.abort();
  await flush();
  expect(closed).toHaveBeenCalledTimes(1);
});

it('allows reentrant presentation and isolates errors in onClosed', async () => {
  const controller = new AbortController();
  const first = jest.fn(() => {
    throw new Error('callback failure');
  });
  const second = jest.fn(() => {
    void presentCancelable(noop, { signal: new AbortController().signal });
  });
  const error = jest.spyOn(console, 'error').mockImplementation(() => {});
  const a = presentCancelable(noop, { signal: controller.signal, onClosed: first });
  const b = presentCancelable(noop, { signal: controller.signal, onClosed: second });
  controller.abort();
  await Promise.all([a, b]);
  await flush();
  expect(first).toHaveBeenCalledTimes(1);
  expect(second).toHaveBeenCalledTimes(1);
  expect(error).toHaveBeenCalledTimes(1);
  expect(getSnapshot()).toHaveLength(1);
  error.mockRestore();
});

it('runs after real host content cleanup, including StrictMode', async () => {
  const events: string[] = [];
  const MockDialog = ({ control, children }: DialogProps) => {
    React.useImperativeHandle(control?.ref, () => ({ open: () => {}, close: () => {} }));
    return <>{children}</>;
  };
  const Content = () => {
    useLayoutEffect(
      () => () => {
        events.push('unmounted');
      },
      [],
    );
    return null;
  };
  const { SurfaceHost: Host } = createSurfaceHost(MockDialog);
  render(
    <React.StrictMode>
      <Host />
    </React.StrictMode>,
  );
  const controller = new AbortController();
  let result!: Promise<unknown>;
  act(() => {
    result = presentCancelable(() => <Content />, {
      signal: controller.signal,
      onClosed: () => events.push('closed'),
    });
  });
  events.length = 0;
  const id = firstId();
  act(() => requestDismiss(id, 'chosen'));
  await expect(result).resolves.toBe('chosen');
  expect(events).toEqual([]);
  act(() => finalizeClose(id));
  expect(events).toEqual(['unmounted']);
  await flush();
  expect(events).toEqual(['unmounted', 'closed']);
});

it('does not complete on a reentrant notification before the entry actually closes', async () => {
  const controller = new AbortController();
  const closed = jest.fn();
  const unsubscribe = subscribe(() => {
    if (getSnapshot().length) controller.abort();
  });
  const result = presentCancelable(noop, { signal: controller.signal, onClosed: closed });
  unsubscribe();
  expect(getSnapshot()).toHaveLength(0);
  await expect(result).resolves.toBeUndefined();
  await flush();
  expect(closed).toHaveBeenCalledTimes(1);
});

it('notifies after rejecting a missing signal without creating a surface', async () => {
  const closed = jest.fn();
  // @ts-expect-error JavaScript callers can omit a required signal.
  const result = presentCancelable(noop, { onClosed: closed });
  expect(closed).not.toHaveBeenCalled();
  await expect(result).rejects.toThrow('requires an AbortSignal');
  await flush();
  expect(closed).toHaveBeenCalledTimes(1);
  expect(getSnapshot()).toHaveLength(0);
});

it('releases a listener and notifies if installation throws after attaching', async () => {
  const controller = new AbortController();
  const closed = jest.fn();
  const add = controller.signal.addEventListener.bind(controller.signal);
  const remove = jest.spyOn(controller.signal, 'removeEventListener');
  jest.spyOn(controller.signal, 'addEventListener').mockImplementation((...args) => {
    add(...args);
    throw new Error('signal installation failed');
  });
  const result = presentCancelable(noop, { signal: controller.signal, onClosed: closed });
  await expect(result).rejects.toThrow('signal installation failed');
  await flush();
  expect(remove).toHaveBeenCalledTimes(1);
  expect(closed).toHaveBeenCalledTimes(1);
  expect(getSnapshot()).toHaveLength(0);
  controller.abort();
  await flush();
  expect(closed).toHaveBeenCalledTimes(1);
});
