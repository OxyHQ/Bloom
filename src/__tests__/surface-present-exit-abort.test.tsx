import React from 'react';
import { act, render } from '@testing-library/react-native';
import { presentCancelable } from '../surfaces';
import {
  __resetSurfacesForTests,
  finalizeClose,
  getSnapshot,
  markSurfaceMounted,
  present,
  requestDismiss,
  resetSurfaces,
  subscribe,
} from '../surfaces/surface-store';

afterEach(() => {
  resetSurfaces();
  __resetSurfacesForTests();
});

it('removes a cancelable surface if the owner aborts after its answer, during exit', async () => {
  const controller = new AbortController();
  const answer = presentCancelable<string>(() => null, { signal: controller.signal });
  const id = getSnapshot()[0]?.id;
  if (!id) throw new Error('Expected the surface');
  const release = markSurfaceMounted(id);
  requestDismiss(id, 'chosen');
  expect(getSnapshot()[0]?.status).toBe('closing');
  await expect(answer).resolves.toBe('chosen');
  controller.abort();
  expect(getSnapshot()).toHaveLength(0);
  release();
});

it('keeps the listener through exit and releases it on normal finalization', async () => {
  const controller = new AbortController();
  const remove = jest.spyOn(controller.signal, 'removeEventListener');
  const answer = presentCancelable<string>(() => null, { signal: controller.signal });
  const id = getSnapshot()[0]?.id;
  if (!id) throw new Error('Expected the surface');
  const release = markSurfaceMounted(id);
  requestDismiss(id, 'chosen');
  await expect(answer).resolves.toBe('chosen');
  expect(remove).not.toHaveBeenCalled();
  finalizeClose(id);
  expect(remove).not.toHaveBeenCalled();
  release();
  expect(remove).toHaveBeenCalledTimes(1);
  controller.abort();
  expect(getSnapshot()).toHaveLength(0);
  expect(remove).toHaveBeenCalledTimes(1);
});

it('cleans listeners for both answered and pending surfaces on reset', async () => {
  const first = new AbortController();
  const second = new AbortController();
  const firstRemove = jest.spyOn(first.signal, 'removeEventListener');
  const secondRemove = jest.spyOn(second.signal, 'removeEventListener');
  const answered = presentCancelable<string>(() => null, { signal: first.signal });
  const id = getSnapshot()[0]?.id;
  if (!id) throw new Error('Expected the surface');
  requestDismiss(id, 'first');
  const pending = presentCancelable<string>(() => null, { signal: second.signal });
  resetSurfaces();
  await expect(answered).resolves.toBe('first');
  await expect(pending).resolves.toBeUndefined();
  expect(firstRemove).toHaveBeenCalledTimes(1);
  expect(secondRemove).toHaveBeenCalledTimes(1);
  first.abort();
  second.abort();
  expect(getSnapshot()).toHaveLength(0);
});

it('a shared signal removes answered and pending owned entries, leaving other layers', async () => {
  const controller = new AbortController();
  const first = presentCancelable<string>(() => null, { signal: controller.signal });
  const firstId = getSnapshot()[0]?.id;
  if (!firstId) throw new Error('Expected the first surface');
  const release = markSurfaceMounted(firstId);
  const other = present<string>(() => null);
  const otherId = getSnapshot()[1]?.id;
  if (!otherId) throw new Error('Expected the other surface');
  const second = presentCancelable<string>(() => null, { signal: controller.signal });
  requestDismiss(firstId, 'first');
  await expect(first).resolves.toBe('first');
  controller.abort();
  expect(getSnapshot().map((entry) => [entry.id, entry.status])).toEqual([[otherId, 'open']]);
  release();
  await expect(second).resolves.toBeUndefined();
  requestDismiss(otherId, 'other');
  await expect(other).resolves.toBe('other');
});

it('does not resurrect an entry if a subscriber aborts as dismissal is notified', async () => {
  const controller = new AbortController();
  const answer = presentCancelable<string>(() => null, { signal: controller.signal });
  const id = getSnapshot()[0]?.id;
  if (!id) throw new Error('Expected the surface');
  const release = markSurfaceMounted(id);
  const unsubscribe = subscribe(() => {
    if (getSnapshot().some((entry) => entry.id === id && entry.status === 'closing')) {
      controller.abort();
    }
  });
  requestDismiss(id, 'chosen');
  unsubscribe();
  expect(getSnapshot()).toHaveLength(0);
  release();
  await expect(answer).resolves.toBe('chosen');
});

it('does not retain a signal when aborted during listener installation', async () => {
  const controller = new AbortController();
  const add = controller.signal.addEventListener.bind(controller.signal);
  const remove = jest.spyOn(controller.signal, 'removeEventListener');
  jest.spyOn(controller.signal, 'addEventListener').mockImplementation((...args) => {
    add(...args);
    controller.abort();
  });
  await expect(
    presentCancelable(() => null, { signal: controller.signal }),
  ).resolves.toBeUndefined();
  expect(remove).toHaveBeenCalledTimes(1);
  expect(getSnapshot()).toHaveLength(0);
});

it('removes an answered surface after one of two StrictMode hosts unmounts', async () => {
  const { createSurfaceHost } = await import('../surfaces/SurfaceHost');
  const MockDialog = ({ control }: import('../dialog/types').DialogProps) => {
    React.useImperativeHandle(control?.ref, () => ({ open: () => {}, close: () => {} }));
    return null;
  };
  const { SurfaceHost: Host } = createSurfaceHost(MockDialog);
  const firstHost = render(
    <React.StrictMode>
      <Host />
    </React.StrictMode>,
  );
  const secondHost = render(<Host />);
  const controller = new AbortController();
  let answer!: Promise<string | undefined>;
  act(() => {
    answer = presentCancelable<string>(() => null, { signal: controller.signal });
  });
  const id = getSnapshot()[0]?.id;
  if (!id) throw new Error('Expected the surface');
  act(() => requestDismiss(id, 'chosen'));
  await expect(answer).resolves.toBe('chosen');
  firstHost.unmount();
  act(() => controller.abort());
  expect(getSnapshot()).toHaveLength(0);
  secondHost.unmount();
  finalizeClose(id);
});

it('removes an answered surface aborted between host unmount and remount', async () => {
  const { createSurfaceHost } = await import('../surfaces/SurfaceHost');
  const renders = jest.fn();
  const MockDialog = ({ control }: import('../dialog/types').DialogProps) => {
    React.useImperativeHandle(control?.ref, () => ({ open: () => {}, close: () => {} }));
    renders();
    return null;
  };
  const { SurfaceHost: Host } = createSurfaceHost(MockDialog);
  const screen = render(<Host />);
  const controller = new AbortController();
  let answer!: Promise<string | undefined>;
  act(() => {
    answer = presentCancelable<string>(() => null, { signal: controller.signal });
  });
  const id = getSnapshot()[0]?.id;
  if (!id) throw new Error('Expected the surface');
  act(() => requestDismiss(id, 'chosen'));
  await expect(answer).resolves.toBe('chosen');
  screen.unmount();
  controller.abort();
  renders.mockClear();
  render(<Host />);
  expect(renders).not.toHaveBeenCalled();
  expect(getSnapshot()).toHaveLength(0);
});
