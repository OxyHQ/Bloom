import { blockDomId, blockElementAt, blockIdFromDomId, gutterDomId } from '../block-dom';
import { afterConfirm } from '../confirm-remove';

describe('afterConfirm', () => {
  it('removes at once when nothing is asked', () => {
    const remove = jest.fn();
    expect(afterConfirm(undefined, ['a'], remove)).toBe(true);
    expect(remove).toHaveBeenCalledTimes(1);
  });

  it('asks with the blocks, and removes at once on a yes', () => {
    const remove = jest.fn();
    const confirm = jest.fn(() => true);
    expect(afterConfirm(confirm, ['a', 'b'], remove)).toBe(true);
    expect(confirm).toHaveBeenCalledWith(['a', 'b']);
    expect(remove).toHaveBeenCalledTimes(1);
  });

  it('removes nothing on a no', () => {
    const remove = jest.fn();
    expect(afterConfirm(() => false, ['a'], remove)).toBe(false);
    expect(remove).not.toHaveBeenCalled();
  });

  it('waits for an answer that takes time', async () => {
    const remove = jest.fn();
    let answer: (value: boolean) => void = () => {};
    const pending = afterConfirm(
      () =>
        new Promise<boolean>((resolve) => {
          answer = resolve;
        }),
      ['a'],
      remove,
    );
    expect(remove).not.toHaveBeenCalled();
    answer(true);
    await expect(pending).resolves.toBe(true);
    expect(remove).toHaveBeenCalledTimes(1);
  });

  it('removes nothing when the answer resolves false or fails', async () => {
    const remove = jest.fn();
    await expect(afterConfirm(async () => false, ['a'], remove)).resolves.toBe(false);
    await expect(
      afterConfirm(() => Promise.reject(new Error('dismissed')), ['a'], remove),
    ).resolves.toBe(false);
    expect(remove).not.toHaveBeenCalled();
  });
});

describe('block DOM ids', () => {
  it('prefixes block ids, by default and per surface', () => {
    expect(blockDomId('b1')).toBe('bloom-block-b1');
    expect(blockDomId('b1', 'synced-x-')).toBe('synced-x-b1');
    expect(blockIdFromDomId('synced-x-b1', 'synced-x-')).toBe('b1');
    expect(blockIdFromDomId('bloom-block-b1', 'synced-x-')).toBeNull();
    expect(blockIdFromDomId('synced-x-', 'synced-x-')).toBeNull();
  });

  it('gives gutters ids that are never a block row’s', () => {
    expect(gutterDomId('b1')).toBe('bloom-gutter-bloom-block-b1');
    expect(gutterDomId('b1', 'ref-')).toBe('bloom-gutter-ref-b1');
    expect(blockIdFromDomId(gutterDomId('b1'))).toBeNull();
  });

  it('finds the row of a block this surface knows, looking through another surface’s', () => {
    // A block row with, inside it, a nested surface's row of another block.
    const element = (id: string, parent: FakeElement | null): FakeElement => ({
      id,
      parentElement: parent,
      closest(selector: string) {
        expect(selector).toBe('[id]');
        return this.id ? this : (this.parentElement?.closest(selector) ?? null);
      },
    });
    const outer = element('bloom-block-ref', null);
    const inner = element('bloom-block-inside', outer);
    const text = element('', inner);
    const known = new Set(['ref']);
    const found = blockElementAt(text as unknown as EventTarget, 'bloom-block-', (id) =>
      known.has(id),
    );
    expect(found?.id).toBe('ref');
    expect(found?.element).toBe(outer);
    expect(blockElementAt(null, 'bloom-block-', () => true)).toBeNull();
  });
});

interface FakeElement {
  id: string;
  parentElement: FakeElement | null;
  closest(selector: string): FakeElement | null;
}
