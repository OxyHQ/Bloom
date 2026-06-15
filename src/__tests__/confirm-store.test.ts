import {
  confirm,
  getConfirmQueue,
  resolveConfirm,
  subscribeConfirms,
} from '../alert-dialog/confirm-store';

describe('confirm-store', () => {
  afterEach(() => {
    // Drain any leftover entries between tests.
    for (const entry of [...getConfirmQueue()]) {
      resolveConfirm(entry.id, false);
    }
  });

  it('enqueues an entry and delivers it to a subscriber', () => {
    const seen: number[] = [];
    const unsub = subscribeConfirms((q) => seen.push(q.length));

    void confirm({ title: 'Delete?' });

    expect(getConfirmQueue()).toHaveLength(1);
    expect(getConfirmQueue()[0]?.title).toBe('Delete?');
    // Initial delivery (0) + enqueue (1).
    expect(seen[seen.length - 1]).toBe(1);
    unsub();
  });

  it('resolves the promise with true on confirm', async () => {
    const promise = confirm({ title: 'Save?' });
    const id = getConfirmQueue()[0]?.id;
    expect(id).toBeTruthy();
    if (id) resolveConfirm(id, true);
    await expect(promise).resolves.toBe(true);
    expect(getConfirmQueue()).toHaveLength(0);
  });

  it('resolves the promise with false on cancel', async () => {
    const promise = confirm({ title: 'Discard?' });
    const id = getConfirmQueue()[0]?.id;
    if (id) resolveConfirm(id, false);
    await expect(promise).resolves.toBe(false);
  });

  it('drains queued entries to a late subscriber', () => {
    void confirm({ title: 'Queued before subscribe' });
    let delivered: number | null = null;
    const unsub = subscribeConfirms((q) => {
      delivered = q.length;
    });
    expect(delivered).toBe(1);
    unsub();
  });

  it('ignores resolving an unknown id', () => {
    expect(() => resolveConfirm('does-not-exist', true)).not.toThrow();
  });
});
