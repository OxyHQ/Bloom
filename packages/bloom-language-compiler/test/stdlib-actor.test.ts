/**
 * @jest-environment node
 *
 * An `actor`'s queue (`actorQueue`, stdlib/Bloom/runtime.ts): its calls run one at a time
 * in call order, an `async` one holding the queue until it ends, and one that throws
 * neither stops the next nor reaches another caller.
 */
import { actorQueue } from '../stdlib/Bloom/runtime';

const tick = () => new Promise<void>((resolve) => setTimeout(resolve, 1));

describe('actorQueue', () => {
  it('runs calls one at a time, in call order', async () => {
    const actor = {};
    const log: string[] = [];
    const slow = actorQueue(actor, async () => {
      log.push('slow start');
      await tick();
      log.push('slow end');
      return 1;
    });
    const fast = actorQueue(actor, () => {
      log.push('fast');
      return 2;
    });
    expect(await Promise.all([slow, fast])).toEqual([1, 2]);
    expect(log).toEqual(['slow start', 'slow end', 'fast']);
  });

  it('keeps going after a call that throws, and keeps actors apart', async () => {
    const a = {};
    const b = {};
    const failed = actorQueue(a, async () => {
      await tick();
      throw new Error('refused');
    });
    const after = actorQueue(a, () => 'next');
    const other = actorQueue(b, () => 'other');
    await expect(failed).rejects.toThrow('refused');
    await expect(after).resolves.toBe('next');
    await expect(other).resolves.toBe('other');
  });
});
