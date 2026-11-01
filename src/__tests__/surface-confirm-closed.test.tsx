import { confirm, confirmWithSuppression } from '../surfaces';
import {
  __resetSurfacesForTests,
  finalizeClose,
  getSnapshot,
  markSurfaceMounted,
  requestDismiss,
  resetSurfaces,
} from '../surfaces/surface-store';

const flush = () => Promise.resolve();
function firstId() {
  const entry = getSnapshot()[0];
  if (!entry) throw new Error('Expected a confirmation');
  return entry.id;
}
afterEach(() => {
  resetSurfaces();
  __resetSurfacesForTests();
});

it('notifies once after a confirmation is already aborted before presentation', async () => {
  const controller = new AbortController();
  controller.abort();
  const closed = jest.fn();
  const answer = confirm({ title: 'owned', signal: controller.signal, onClosed: closed });
  expect(closed).not.toHaveBeenCalled();
  expect(getSnapshot()).toHaveLength(0);
  await expect(answer).resolves.toBe(false);
  await flush();
  expect(closed).toHaveBeenCalledTimes(1);
});

it('supports completion notification without requiring a signal or host', async () => {
  const closed = jest.fn();
  const answer = confirm({ title: 'owned', onClosed: closed });
  requestDismiss(firstId(), true);
  expect(getSnapshot()).toHaveLength(0);
  await expect(answer).resolves.toBe(true);
  await flush();
  expect(closed).toHaveBeenCalledTimes(1);
});

it('keeps the owner through normal confirmation exit and cleans up after unmount', async () => {
  const controller = new AbortController();
  const remove = jest.spyOn(controller.signal, 'removeEventListener');
  const closed = jest.fn();
  const answer = confirm({ title: 'owned', signal: controller.signal, onClosed: closed });
  const id = firstId();
  const release = markSurfaceMounted(id);
  requestDismiss(id, true);
  await expect(answer).resolves.toBe(true);
  expect(getSnapshot()[0]?.status).toBe('closing');
  expect(remove).not.toHaveBeenCalled();
  expect(closed).not.toHaveBeenCalled();
  finalizeClose(id);
  expect(remove).not.toHaveBeenCalled();
  release();
  expect(remove).toHaveBeenCalledTimes(1);
  await flush();
  expect(closed).toHaveBeenCalledTimes(1);
});

it('removes only an answered confirmation if its owner aborts during exit', async () => {
  const controller = new AbortController();
  const closed = jest.fn();
  const answer = confirm({ title: 'owned', signal: controller.signal, onClosed: closed });
  const id = firstId();
  const release = markSurfaceMounted(id);
  const other = confirm({ title: 'other' });
  const otherId = getSnapshot()[1]?.id;
  if (!otherId) throw new Error('Expected other confirmation');
  requestDismiss(id, true);
  await expect(answer).resolves.toBe(true);
  controller.abort();
  expect(getSnapshot().map((entry) => [entry.id, entry.status])).toEqual([[otherId, 'open']]);
  expect(closed).not.toHaveBeenCalled();
  release();
  await flush();
  expect(closed).toHaveBeenCalledTimes(1);
  requestDismiss(otherId, false);
  await expect(other).resolves.toBe(false);
});

it('retains the existing animated exit when an open confirmation is aborted', async () => {
  const controller = new AbortController();
  const closed = jest.fn();
  const answer = confirm({ title: 'owned', signal: controller.signal, onClosed: closed });
  const id = firstId();
  const release = markSurfaceMounted(id);
  controller.abort();
  expect(getSnapshot()[0]?.status).toBe('closing');
  await expect(answer).resolves.toBe(false);
  expect(closed).not.toHaveBeenCalled();
  finalizeClose(id);
  release();
  await flush();
  expect(closed).toHaveBeenCalledTimes(1);
});

it('notifies suppression confirmation after reset without changing its result', async () => {
  const controller = new AbortController();
  const closed = jest.fn();
  const answer = confirmWithSuppression({
    title: 'owned',
    suppressionLabel: 'Remember',
    suppressed: true,
    signal: controller.signal,
    onClosed: closed,
  });
  const release = markSurfaceMounted(firstId());
  resetSurfaces();
  await expect(answer).resolves.toEqual({ confirmed: false, suppressed: true });
  expect(closed).not.toHaveBeenCalled();
  release();
  await flush();
  expect(closed).toHaveBeenCalledTimes(1);
});

it('notifies an already-aborted suppression confirmation with its initial state', async () => {
  const controller = new AbortController();
  controller.abort();
  const closed = jest.fn();
  const answer = confirmWithSuppression({
    title: 'owned',
    suppressionLabel: 'Remember',
    suppressed: true,
    signal: controller.signal,
    onClosed: closed,
  });
  await expect(answer).resolves.toEqual({ confirmed: false, suppressed: true });
  await flush();
  expect(closed).toHaveBeenCalledTimes(1);
  expect(getSnapshot()).toHaveLength(0);
});

it('keeps a suppression answer when aborted during its exit', async () => {
  const controller = new AbortController();
  const closed = jest.fn();
  const answer = confirmWithSuppression({
    title: 'owned',
    suppressionLabel: 'Remember',
    signal: controller.signal,
    onClosed: closed,
  });
  const id = firstId();
  const release = markSurfaceMounted(id);
  requestDismiss(id, { confirmed: true, suppressed: true });
  await expect(answer).resolves.toEqual({ confirmed: true, suppressed: true });
  controller.abort();
  expect(getSnapshot()).toHaveLength(0);
  release();
  await flush();
  expect(closed).toHaveBeenCalledTimes(1);
});

it('notifies if signal setup fails before the confirmation can mount', async () => {
  const controller = new AbortController();
  const closed = jest.fn();
  const remove = jest.spyOn(controller.signal, 'removeEventListener');
  jest.spyOn(controller.signal, 'addEventListener').mockImplementation(() => {
    throw new Error('signal installation failed');
  });
  const answer = confirm({ title: 'owned', signal: controller.signal, onClosed: closed });
  await expect(answer).rejects.toThrow('signal installation failed');
  await flush();
  expect(remove).toHaveBeenCalledTimes(1);
  expect(closed).toHaveBeenCalledTimes(1);
  expect(getSnapshot()).toHaveLength(0);
});
