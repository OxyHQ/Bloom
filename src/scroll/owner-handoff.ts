/** A same-commit transfer between existing scroll owners, consumed by restoration. */
const offsets = new WeakMap<object, number>();

export function recordScrollOwnerHandoff(owner: object, offset: number) {
  offsets.set(owner, offset);
}

export function takeScrollOwnerHandoff(owner: object): number | undefined {
  const offset = offsets.get(owner);
  offsets.delete(owner);
  return offset;
}

export function clearScrollOwnerHandoff(owner: object) {
  offsets.delete(owner);
}
