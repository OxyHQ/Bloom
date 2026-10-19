import type { BlockId } from '../model/document';
import type { ConfirmRemove } from './context';

/**
 * Run `remove` once `confirm` agrees to removing `ids`: at once when there is
 * nothing to ask or it answers at once, when its promise resolves to true
 * otherwise. Anything but true — false, a rejected promise — removes nothing.
 * Returns the answer, or a promise of it while it is awaited.
 */
export function afterConfirm(
  confirm: ConfirmRemove | undefined,
  ids: readonly BlockId[],
  remove: () => void,
): boolean | Promise<boolean> {
  if (!confirm) {
    remove();
    return true;
  }
  const answer = confirm(ids);
  if (typeof answer === 'boolean') {
    if (answer) remove();
    return answer;
  }
  return Promise.resolve(answer).then(
    (agreed) => {
      if (agreed !== true) return false;
      remove();
      return true;
    },
    () => false,
  );
}
