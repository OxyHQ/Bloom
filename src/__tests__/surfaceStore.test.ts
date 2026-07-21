import {
  __resetSurfacesForTests,
  dismissAll,
  dismissToRoot,
  dismissTop,
  finalizeClose,
  getSnapshot,
  present,
  requestDismiss,
  resetSurfaces,
  subscribe,
} from '../surfaces/surfaceStore';
import { confirm, prompt, surfaces } from '../surfaces/api';

const noop = () => null;

/** Id of the current top surface (guarded so strict tsc is satisfied). */
function topId(): string {
  const stack = getSnapshot();
  const top = stack[stack.length - 1];
  if (!top) throw new Error('expected a surface on the stack');
  return top.id;
}

afterEach(() => {
  // Resolve any lingering promises so awaiting tests never hang, then reset the
  // module store + id counter for isolation.
  resetSurfaces();
  __resetSurfacesForTests();
});

describe('surfaceStore', () => {
  it('present pushes an entry and resolves its promise on dismiss', async () => {
    const p = present(noop);
    const stack = getSnapshot();
    expect(stack).toHaveLength(1);
    expect(stack[0]?.status).toBe('open');
    requestDismiss(topId(), 'hello');
    await expect(p).resolves.toBe('hello');
  });

  it('stacks bottom→top; the last entry is the top', () => {
    void present(noop);
    void present(noop);
    void present(noop);
    expect(getSnapshot().map((e) => e.id)).toEqual([
      'bloom-surface-1',
      'bloom-surface-2',
      'bloom-surface-3',
    ]);
  });

  it('resolves ONCE — a second dismiss with a different result is ignored', async () => {
    const p = present(noop);
    const id = topId();
    requestDismiss(id, 'first');
    requestDismiss(id, 'second');
    await expect(p).resolves.toBe('first');
  });

  it('requestDismiss flips the entry to closing but does not splice it', () => {
    void present(noop);
    const id = topId();
    requestDismiss(id, 1);
    const stack = getSnapshot();
    expect(stack).toHaveLength(1);
    expect(stack[0]?.status).toBe('closing');
    expect(stack[0]?.generation).toBe(1);
  });

  it('finalizeClose removes a CLOSING entry; is a no-op for an OPEN entry', async () => {
    const p = present(noop);
    const id = topId();
    // Open → no-op.
    finalizeClose(id);
    expect(getSnapshot()).toHaveLength(1);
    // Closing → removed.
    requestDismiss(id, 'x');
    finalizeClose(id);
    expect(getSnapshot()).toHaveLength(0);
    await expect(p).resolves.toBe('x');
  });

  it('dismissTop dismisses only the top surface', async () => {
    const a = present(noop);
    const b = present(noop);
    dismissTop('B');
    await expect(b).resolves.toBe('B');
    const stack = getSnapshot();
    expect(stack.find((e) => e.id === 'bloom-surface-1')?.status).toBe('open');
    expect(stack.find((e) => e.id === 'bloom-surface-2')?.status).toBe('closing');
    // Clean up the still-open root.
    void a;
  });

  it('dismissToRoot resolves everything above the root with undefined, keeps the root', async () => {
    const root = present(noop);
    const mid = present(noop);
    const top = present(noop);
    dismissToRoot();
    await expect(mid).resolves.toBeUndefined();
    await expect(top).resolves.toBeUndefined();
    const stack = getSnapshot();
    expect(stack.find((e) => e.id === 'bloom-surface-1')?.status).toBe('open');
    void root;
  });

  it('dismissToRoot is a no-op with 0 or 1 surfaces', async () => {
    dismissToRoot();
    expect(getSnapshot()).toHaveLength(0);
    const only = present(noop);
    dismissToRoot();
    expect(getSnapshot()[0]?.status).toBe('open');
    void only;
  });

  it('dismissAll resolves ALL pending awaiters with undefined', async () => {
    const a = present(noop);
    const b = present(noop);
    const c = present(noop);
    dismissAll();
    await expect(a).resolves.toBeUndefined();
    await expect(b).resolves.toBeUndefined();
    await expect(c).resolves.toBeUndefined();
  });

  it('resetSurfaces resolves pending awaiters and clears the stack', async () => {
    const a = present(noop);
    const b = present(noop);
    resetSurfaces();
    await expect(a).resolves.toBeUndefined();
    await expect(b).resolves.toBeUndefined();
    expect(getSnapshot()).toHaveLength(0);
  });

  it('requestDismiss / finalizeClose ignore an unknown id', () => {
    expect(() => requestDismiss('does-not-exist', 1)).not.toThrow();
    expect(() => finalizeClose('does-not-exist')).not.toThrow();
  });

  it('getSnapshot returns a STABLE reference while unchanged', () => {
    const s1 = getSnapshot();
    expect(getSnapshot()).toBe(s1);
    void present(noop);
    const s2 = getSnapshot();
    expect(s2).not.toBe(s1);
    expect(getSnapshot()).toBe(s2);
  });

  it('notifies subscribers on each stack mutation', () => {
    let calls = 0;
    const unsub = subscribe(() => {
      calls += 1;
    });
    void present(noop); // +1
    dismissTop(); // requestDismiss emits +1
    expect(calls).toBe(2);
    unsub();
  });
});

describe('surfaces imperative API', () => {
  it('surfaces.present + surfaces.dismiss resolve with the top result', async () => {
    const p = surfaces.present(noop);
    surfaces.dismiss('done');
    await expect(p).resolves.toBe('done');
  });

  it('surfaces.dismissById targets a specific surface', async () => {
    const a = surfaces.present(noop);
    const b = surfaces.present(noop);
    const bottom = getSnapshot()[0];
    if (!bottom) throw new Error('expected a surface on the stack');
    surfaces.dismissById(bottom.id, 'A');
    await expect(a).resolves.toBe('A');
    void b;
  });

  it('surfaces.dismissAll clears the stack and resolves pending', async () => {
    const a = surfaces.present(noop);
    const b = surfaces.present(noop);
    surfaces.dismissAll();
    await expect(a).resolves.toBeUndefined();
    await expect(b).resolves.toBeUndefined();
  });
});

describe('confirm / prompt surfaces', () => {
  it('confirm resolves true when dismissed with true, false otherwise', async () => {
    const yes = confirm({ title: 'Delete?' });
    requestDismiss(topId(), true);
    await expect(yes).resolves.toBe(true);

    const no = confirm({ title: 'Delete?' });
    requestDismiss(topId(), false);
    await expect(no).resolves.toBe(false);
  });

  it('confirm resolves false when dismissed without a result (backdrop/Escape)', async () => {
    const c = confirm({ title: 'Proceed?' });
    dismissTop(); // undefined → coerced to false
    await expect(c).resolves.toBe(false);
  });

  it('confirm presents a centered surface', () => {
    void confirm({ title: 'Hi' });
    expect(getSnapshot()[0]?.presentation.placement).toBe('center');
  });

  it('prompt resolves the entered string, or null when dismissed without one', async () => {
    const p = prompt({ title: 'Name?' });
    requestDismiss(topId(), 'Ada');
    await expect(p).resolves.toBe('Ada');

    const cancelled = prompt({ title: 'Name?' });
    dismissTop(); // undefined → coerced to null
    await expect(cancelled).resolves.toBeNull();
  });
});
