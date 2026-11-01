import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import { confirm, confirmWithSuppression, SurfaceHost } from '../surfaces';
import {
  __resetSurfacesForTests,
  getSnapshot,
  markSurfaceMounted,
  present,
  requestDismiss,
  resetSurfaces,
  subscribe,
} from '../surfaces/surface-store';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

const noop = () => null;
function firstId() {
  const entry = getSnapshot()[0];
  if (!entry) throw new Error('Expected a surface');
  return entry.id;
}

afterEach(() => {
  resetSurfaces();
  __resetSurfacesForTests();
});

it('does not create a surface for an already aborted signal', async () => {
  const controller = new AbortController();
  controller.abort();
  const old = getSnapshot();
  await expect(confirm({ title: 'cancelled', signal: controller.signal })).resolves.toBe(false);
  expect(getSnapshot()).toBe(old);
});

it('dismisses only its own entry when another surface is above it', async () => {
  const lower = present(noop);
  const controller = new AbortController();
  const answer = confirm({ title: 'owned', signal: controller.signal, dismissible: false });
  const upper = present(noop);
  const [bottom, owned, top] = getSnapshot();
  if (!bottom || !owned || !top) throw new Error('Expected three surfaces');
  markSurfaceMounted(owned.id);
  controller.abort();
  expect(getSnapshot().map((entry) => [entry.id, entry.status])).toEqual([
    [bottom.id, 'open'],
    [owned.id, 'closing'],
    [top.id, 'open'],
  ]);
  await expect(answer).resolves.toBe(false);
  requestDismiss(top.id, 'upper');
  requestDismiss(bottom.id, 'lower');
  await expect(upper).resolves.toBe('upper');
  await expect(lower).resolves.toBe('lower');
});

it('cleans the listener synchronously on confirm; later abort cannot change the answer', async () => {
  const controller = new AbortController();
  const remove = jest.spyOn(controller.signal, 'removeEventListener');
  const answer = confirm({ title: 'owned', signal: controller.signal });
  const id = firstId();
  requestDismiss(id, true);
  expect(remove).toHaveBeenCalledWith('abort', expect.any(Function));
  controller.abort();
  requestDismiss(id, false);
  await expect(answer).resolves.toBe(true);
});

it('ignores a late confirmation after abort and releases the listener', async () => {
  const controller = new AbortController();
  const remove = jest.spyOn(controller.signal, 'removeEventListener');
  const answer = confirm({ title: 'owned', signal: controller.signal });
  const id = firstId();
  controller.abort();
  expect(remove).toHaveBeenCalledWith('abort', expect.any(Function));
  requestDismiss(id, true);
  await expect(answer).resolves.toBe(false);
});

it('registers before notifying a subscriber that aborts synchronously', async () => {
  const controller = new AbortController();
  const unsubscribe = subscribe(() => controller.abort());
  const answer = confirm({ title: 'reentrant', signal: controller.signal });
  unsubscribe();
  expect(getSnapshot()).toHaveLength(0);
  await expect(answer).resolves.toBe(false);
});

it('does not strand a surface if the signal aborts while its listener is installed', async () => {
  const controller = new AbortController();
  const add = controller.signal.addEventListener.bind(controller.signal);
  jest.spyOn(controller.signal, 'addEventListener').mockImplementation((...args) => {
    add(...args);
    controller.abort();
  });
  const answer = confirm({ title: 'cancelled during registration', signal: controller.signal });
  expect(getSnapshot()).toHaveLength(0);
  await expect(answer).resolves.toBe(false);
});

it('cleans up if a subscriber resets the stack during presentation', async () => {
  const controller = new AbortController();
  const remove = jest.spyOn(controller.signal, 'removeEventListener');
  const unsubscribe = subscribe(resetSurfaces);
  const answer = confirm({ title: 'reset during presentation', signal: controller.signal });
  unsubscribe();
  expect(remove).toHaveBeenCalledWith('abort', expect.any(Function));
  expect(getSnapshot()).toHaveLength(0);
  await expect(answer).resolves.toBe(false);
});

it('cleans the listener if the host is reset', async () => {
  const controller = new AbortController();
  const remove = jest.spyOn(controller.signal, 'removeEventListener');
  const answer = confirm({ title: 'owned', signal: controller.signal });
  resetSurfaces();
  expect(remove).toHaveBeenCalledWith('abort', expect.any(Function));
  await expect(answer).resolves.toBe(false);
});

it('does not mount a surface cancelled before the host renders', async () => {
  const controller = new AbortController();
  const answer = confirm({ title: 'never visible', signal: controller.signal });
  controller.abort();
  const screen = render(
    <BloomThemeProvider mode="light" colorPreset="teal">
      <SurfaceHost />
    </BloomThemeProvider>,
  );
  expect(screen.queryByText('never visible')).toBeNull();
  expect(getSnapshot()).toHaveLength(0);
  await expect(answer).resolves.toBe(false);
});

it('aborts suppressible confirmations with the current checkbox value', async () => {
  const controller = new AbortController();
  const screen = render(
    <BloomThemeProvider mode="light" colorPreset="teal">
      <SurfaceHost />
    </BloomThemeProvider>,
  );
  let answer!: ReturnType<typeof confirmWithSuppression>;
  act(() => {
    answer = confirmWithSuppression({
      title: 'owned',
      suppressionLabel: 'Remember',
      signal: controller.signal,
    });
  });
  act(() => fireEvent.press(screen.getByLabelText('Remember')));
  act(() => controller.abort());
  await expect(answer).resolves.toEqual({ confirmed: false, suppressed: true });
});

it('preserves the existing non-abort close lifecycle during a host hand-off', async () => {
  const { createSurfaceHost } = await import('../surfaces/SurfaceHost');
  const calls: string[] = [];
  const MockDialog = ({ control, startOpen }: import('../dialog/types').DialogProps) => {
    React.useImperativeHandle(control?.ref, () => ({
      open: () => calls.push('open'),
      close: () => calls.push('close'),
    }));
    calls.push(`render:${String(startOpen)}`);
    return null;
  };
  const { SurfaceHost: MockHost } = createSurfaceHost(MockDialog);
  const screen = render(<MockHost />);
  let answer!: Promise<boolean>;
  act(() => {
    answer = confirm({ title: 'handoff' });
  });
  act(() => requestDismiss(firstId(), false));
  screen.unmount();
  calls.length = 0;
  render(<MockHost />);
  expect(calls).toContain('render:false');
  expect(calls).toContain('close');
  expect(getSnapshot()[0]?.status).toBe('closing');
  await expect(answer).resolves.toBe(false);
});

it('keeps independent signals independent even when one is reused', async () => {
  const first = new AbortController();
  const second = new AbortController();
  const a = confirm({ title: 'a', signal: first.signal });
  const b = confirm({ title: 'b', signal: second.signal });
  const c = confirm({ title: 'c', signal: first.signal });
  markSurfaceMounted(firstId());
  first.abort();
  expect(getSnapshot().map((entry) => entry.status)).toEqual(['closing', 'open']);
  await expect(a).resolves.toBe(false);
  await expect(c).resolves.toBe(false);
  const middle = getSnapshot()[1];
  if (!middle) throw new Error('Expected second confirmation');
  requestDismiss(middle.id, true);
  await expect(b).resolves.toBe(true);
});

it('closes correctly under StrictMode', async () => {
  const screen = render(
    <React.StrictMode>
      <BloomThemeProvider mode="light" colorPreset="teal">
        <SurfaceHost />
      </BloomThemeProvider>
    </React.StrictMode>,
  );
  const controller = new AbortController();
  let answer!: Promise<boolean>;
  act(() => {
    answer = confirm({ title: 'strict', signal: controller.signal });
  });
  expect(screen.getByText('strict')).toBeTruthy();
  act(() => controller.abort());
  await expect(answer).resolves.toBe(false);
  expect(getSnapshot()).toHaveLength(0);
});

it('does not reopen an aborted confirmation between host unmount and remount', async () => {
  const { createSurfaceHost } = await import('../surfaces/SurfaceHost');
  const renders = jest.fn();
  const MockDialog = ({ control }: import('../dialog/types').DialogProps) => {
    React.useImperativeHandle(control?.ref, () => ({ open: () => {}, close: () => {} }));
    renders();
    return null;
  };
  const { SurfaceHost: MockHost } = createSurfaceHost(MockDialog);
  const screen = render(<MockHost />);
  const controller = new AbortController();
  const remove = jest.spyOn(controller.signal, 'removeEventListener');
  let answer!: Promise<boolean>;
  act(() => {
    answer = confirm({ title: 'handoff abort', signal: controller.signal });
  });
  expect(renders).toHaveBeenCalled();
  screen.unmount();
  controller.abort();
  expect(remove).toHaveBeenCalledWith('abort', expect.any(Function));
  expect(getSnapshot()).toHaveLength(0);
  renders.mockClear();
  render(<MockHost />);
  expect(renders).not.toHaveBeenCalled();
  await expect(answer).resolves.toBe(false);
});

it('keeps an entry alive when one of two mounted hosts unmounts before abort', async () => {
  const { createSurfaceHost } = await import('../surfaces/SurfaceHost');
  const onClose = jest.fn();
  const MockDialog = ({ control }: import('../dialog/types').DialogProps) => {
    React.useImperativeHandle(control?.ref, () => ({ open: () => {}, close: onClose }));
    return null;
  };
  const { SurfaceHost: MockHost } = createSurfaceHost(MockDialog);
  const first = render(<MockHost />);
  const second = render(<MockHost />);
  const controller = new AbortController();
  let answer!: Promise<boolean>;
  act(() => {
    answer = confirm({ title: 'two hosts', signal: controller.signal });
  });
  first.unmount();
  act(() => controller.abort());
  expect(getSnapshot()[0]?.status).toBe('closing');
  expect(onClose).toHaveBeenCalled();
  await expect(answer).resolves.toBe(false);
  second.unmount();
});

it('does not reopen if the last host unmounts during an aborted exit', async () => {
  const { createSurfaceHost } = await import('../surfaces/SurfaceHost');
  const renders = jest.fn();
  const MockDialog = ({ control }: import('../dialog/types').DialogProps) => {
    React.useImperativeHandle(control?.ref, () => ({ open: () => {}, close: () => {} }));
    renders();
    return null;
  };
  const { SurfaceHost: MockHost } = createSurfaceHost(MockDialog);
  const screen = render(<MockHost />);
  const controller = new AbortController();
  let answer!: Promise<boolean>;
  act(() => {
    answer = confirm({ title: 'abort then handoff', signal: controller.signal });
  });
  act(() => controller.abort());
  expect(getSnapshot()[0]?.status).toBe('closing');
  screen.unmount();
  expect(getSnapshot()).toHaveLength(0);
  renders.mockClear();
  render(<MockHost />);
  expect(renders).not.toHaveBeenCalled();
  await expect(answer).resolves.toBe(false);
});

it('waits for the last mounted host before finalizing an aborted exit', async () => {
  const { createSurfaceHost } = await import('../surfaces/SurfaceHost');
  const MockDialog = ({ control }: import('../dialog/types').DialogProps) => {
    React.useImperativeHandle(control?.ref, () => ({ open: () => {}, close: () => {} }));
    return null;
  };
  const { SurfaceHost: MockHost } = createSurfaceHost(MockDialog);
  const first = render(<MockHost />);
  const second = render(<MockHost />);
  const controller = new AbortController();
  let answer!: Promise<boolean>;
  act(() => {
    answer = confirm({ title: 'overlapping hosts', signal: controller.signal });
  });
  act(() => controller.abort());
  first.unmount();
  expect(getSnapshot()[0]?.status).toBe('closing');
  second.unmount();
  expect(getSnapshot()).toHaveLength(0);
  await expect(answer).resolves.toBe(false);
});

it('ignores a stale host cleanup after reset and test id reuse', async () => {
  const old = present(noop);
  const oldId = firstId();
  const releaseOld = markSurfaceMounted(oldId);
  resetSurfaces();
  await expect(old).resolves.toBeUndefined();
  __resetSurfacesForTests();
  const controller = new AbortController();
  const answer = confirm({ title: 'new', signal: controller.signal });
  expect(firstId()).toBe(oldId);
  const releaseNew = markSurfaceMounted(oldId);
  releaseOld();
  controller.abort();
  expect(getSnapshot()[0]?.status).toBe('closing');
  releaseNew();
  expect(getSnapshot()).toHaveLength(0);
  await expect(answer).resolves.toBe(false);
});

it('does not count the same host cleanup twice', async () => {
  const controller = new AbortController();
  const answer = confirm({ title: 'two hosts', signal: controller.signal });
  const id = firstId();
  const releaseFirst = markSurfaceMounted(id);
  const releaseSecond = markSurfaceMounted(id);
  releaseFirst();
  releaseFirst();
  controller.abort();
  expect(getSnapshot()[0]?.status).toBe('closing');
  releaseSecond();
  expect(getSnapshot()).toHaveLength(0);
  await expect(answer).resolves.toBe(false);
});
