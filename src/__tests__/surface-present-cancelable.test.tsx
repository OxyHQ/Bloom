import React from 'react';
import { act, render } from '@testing-library/react-native';
import { presentCancelable, surfaces, type SurfaceControls } from '../surfaces';
import { createSurfaceHost } from '../surfaces/SurfaceHost';
import {
  __resetSurfacesForTests,
  finalizeClose,
  getSnapshot,
  present,
  requestDismiss,
  resetSurfaces,
  subscribe,
} from '../surfaces/surface-store';

const noop = () => null;
function entryId(index = 0) {
  const entry = getSnapshot()[index];
  if (!entry) throw new Error('Expected a surface');
  return entry.id;
}

// Compile-time contract: existing structural SurfaceControls and legacy typed
// present still work; the new explicit API requires a signal and permits abort.
function typeContract() {
  const existing: SurfaceControls = {
    dismiss: () => {},
    present: <T,>() => Promise.resolve(undefined as T),
  };
  const value: Promise<string | undefined> = presentCancelable<string>(noop, {
    signal: new AbortController().signal,
  });
  const namespaced: Promise<string | undefined> = surfaces.presentCancelable<string>(noop, {
    signal: new AbortController().signal,
  });
  const legacy: Promise<string> = present<string>(noop, { title: 'legacy' });
  // @ts-expect-error Cancellation can resolve with undefined.
  const unsafe: Promise<string> = presentCancelable<string>(noop, {
    signal: new AbortController().signal,
  });
  // @ts-expect-error A cancelable presentation requires a signal.
  presentCancelable(noop, { title: 'missing signal' });
  // @ts-expect-error Namespace cancellation has the same result type.
  const unsafeNamespaced: Promise<string> = surfaces.presentCancelable<string>(noop, {
    signal: new AbortController().signal,
  });
  void existing;
  void value;
  void namespaced;
  void legacy;
  void unsafe;
  void unsafeNamespaced;
}
void typeContract;

afterEach(() => {
  resetSurfaces();
  __resetSurfacesForTests();
});

it('does not present when already aborted and does not expose the signal as presentation', async () => {
  const old = getSnapshot();
  const controller = new AbortController();
  controller.abort();
  await expect(
    presentCancelable(noop, { title: 'old', signal: controller.signal }),
  ).resolves.toBeUndefined();
  expect(getSnapshot()).toBe(old);
  const next = new AbortController();
  const result = presentCancelable(noop, { title: 'new', signal: next.signal });
  expect(getSnapshot()[0]?.presentation).toEqual({ title: 'new' });
  next.abort();
  await expect(result).resolves.toBeUndefined();
});

it('rejects a missing signal without presenting anything', async () => {
  // @ts-expect-error Runtime callers can omit the required signal.
  await expect(presentCancelable(noop, { title: 'missing' })).rejects.toThrow(
    'requires an AbortSignal',
  );
  expect(getSnapshot()).toHaveLength(0);
});

it('cleans up when the host resets before abort', async () => {
  const controller = new AbortController();
  const remove = jest.spyOn(controller.signal, 'removeEventListener');
  const answer = presentCancelable(noop, { signal: controller.signal });
  resetSurfaces();
  expect(remove).toHaveBeenCalledWith('abort', expect.any(Function));
  controller.abort();
  expect(getSnapshot()).toHaveLength(0);
  await expect(answer).resolves.toBeUndefined();
});

it('does not strand a surface if the signal aborts while installing its listener', async () => {
  const controller = new AbortController();
  const add = controller.signal.addEventListener.bind(controller.signal);
  jest.spyOn(controller.signal, 'addEventListener').mockImplementation((...args) => {
    add(...args);
    controller.abort();
  });
  const answer = presentCancelable(noop, { signal: controller.signal });
  expect(getSnapshot()).toHaveLength(0);
  await expect(answer).resolves.toBeUndefined();
});

it('cancels a nested surface without touching its parent or a later surface', async () => {
  const root = present(noop);
  const controller = new AbortController();
  const child = surfaces.presentCancelable<string>(noop, { signal: controller.signal });
  const later = present(noop);
  const rootId = entryId(0);
  const laterId = entryId(2);
  controller.abort();
  expect(getSnapshot().map((entry) => entry.id)).toEqual([rootId, laterId]);
  await expect(child).resolves.toBeUndefined();
  requestDismiss(laterId, 'later');
  requestDismiss(rootId, 'root');
  await expect(later).resolves.toBe('later');
  await expect(root).resolves.toBe('root');
});

it('cleans the listener immediately and preserves a result chosen before abort', async () => {
  const controller = new AbortController();
  const remove = jest.spyOn(controller.signal, 'removeEventListener');
  const answer = presentCancelable<string>(noop, { signal: controller.signal });
  requestDismiss(entryId(), 'chosen');
  expect(remove).toHaveBeenCalledWith('abort', expect.any(Function));
  controller.abort();
  await expect(answer).resolves.toBe('chosen');
});

it('handles abort during notification and ignores a late dismissal', async () => {
  const controller = new AbortController();
  let id = '';
  const unsubscribe = subscribe(() => {
    const entry = getSnapshot()[0];
    if (entry) {
      id = entry.id;
      controller.abort();
    }
  });
  const answer = presentCancelable<string>(noop, { signal: controller.signal });
  unsubscribe();
  expect(id).not.toBe('');
  expect(getSnapshot()).toHaveLength(0);
  requestDismiss(id, 'late');
  await expect(answer).resolves.toBeUndefined();
});

it('finalizes an aborted surface when its last host leaves during exit', async () => {
  const MockDialog = ({ control }: import('../dialog/types').DialogProps) => {
    React.useImperativeHandle(control?.ref, () => ({ open: () => {}, close: () => {} }));
    return null;
  };
  const { SurfaceHost: Host } = createSurfaceHost(MockDialog);
  const first = render(
    <React.StrictMode>
      <Host />
    </React.StrictMode>,
  );
  const second = render(<Host />);
  const controller = new AbortController();
  let answer!: Promise<unknown>;
  act(() => {
    answer = presentCancelable(noop, { signal: controller.signal });
  });
  const id = entryId();
  act(() => controller.abort());
  expect(getSnapshot()[0]?.status).toBe('closing');
  first.unmount();
  expect(getSnapshot()[0]?.id).toBe(id);
  second.unmount();
  expect(getSnapshot()).toHaveLength(0);
  finalizeClose(id);
  await expect(answer).resolves.toBeUndefined();
});

it('does not reopen if cancelled between host unmount and remount', async () => {
  const renders = jest.fn();
  const MockDialog = ({ control }: import('../dialog/types').DialogProps) => {
    React.useImperativeHandle(control?.ref, () => ({ open: () => {}, close: () => {} }));
    renders();
    return null;
  };
  const { SurfaceHost: Host } = createSurfaceHost(MockDialog);
  const screen = render(<Host />);
  const controller = new AbortController();
  let answer!: Promise<unknown>;
  act(() => {
    answer = presentCancelable(noop, { signal: controller.signal });
  });
  screen.unmount();
  controller.abort();
  renders.mockClear();
  render(<Host />);
  expect(renders).not.toHaveBeenCalled();
  expect(getSnapshot()).toHaveLength(0);
  await expect(answer).resolves.toBeUndefined();
});
