/**
 * Pure, platform-agnostic core of the scroll-restoration primitive.
 *
 * This file deliberately contains NO React and NO DOM/native imports so the
 * logic can be unit-tested in isolation and shared verbatim by the web and
 * native barrels.
 */
/**
 * Separator between the two components of a storage key.
 *
 * `\0` (NUL) can never appear in a router-derived content id or in a
 * developer-authored sub-key, so it is collision-free as a delimiter. It is
 * written as an escape sequence (not a literal byte) so the source stays
 * text-diffable.
 */
const COMPOSITE_KEY_SEPARATOR = '\0';

/**
 * Derive the storage key for a scrollable from WHAT its screen is showing plus
 * an optional caller sub-key.
 *
 * The key is CONTENT identity, deliberately not the navigation entry. An offset
 * belongs to what the user was looking at, so returning to it restores however
 * they got there — browser Back or Forward, a tab press, an in-app link — and
 * only content never seen this session opens at the top. Keying on the entry
 * would defeat that: a tab press and `router.replace` both mint a fresh entry,
 * so both would open at the top even though the user has been there.
 *
 * The trade, chosen rather than overlooked: the same content occupying two LIVE
 * entries now shares one offset. Pushing `/@alice` on top of `/@alice` in a
 * native stack restores the first one's position instead of opening at the top,
 * and while both are mounted each writes to the same key. That is the price of
 * a tab press restoring, which is the behaviour that was asked for.
 *
 * The key is always the same two-field composite, with an absent sub-key
 * written as empty, so two different identities can never collapse onto one key
 * by omission.
 *
 * Returns `null` when there is no content id to anchor against (the scrollable
 * is not inside a navigator, or the adapter cannot answer), which every caller
 * treats as "do not persist and do not restore".
 */
export function deriveScrollKey(
  contentId: string | null,
  subKey?: string,
): string | null {
  if (!contentId) return null;
  return [contentId, subKey ?? ''].join(COMPOSITE_KEY_SEPARATOR);
}

/**
 * In-memory map of `scrollKey -> last-known scroll offset`.
 *
 * Offsets live only for the lifetime of the document/session. We never persist
 * them — a full reload should start at the top — and we never auto-evict,
 * because an entry can be revisited via browser Forward/Back long after it
 * blurred.
 *
 * Deliberately an instance held in React context rather than a module-level
 * singleton: a dependency tree can legitimately contain two copies of Bloom
 * (a hoisted one plus a nested one under another Oxy package), and a
 * module-global would then exist twice with no way for either half to see the
 * other's offsets.
 */
export class ScrollOffsetStore {
  private readonly offsets = new Map<string, number>();

  /** Persist the offset for a key. A negative offset is clamped to 0. */
  save(key: string, offset: number): void {
    this.offsets.set(key, offset > 0 ? offset : 0);
  }

  /**
   * Read the saved offset for a key. Returns `0` when nothing was saved, which
   * is the same value a caller writes when {@link has} is false — an unseen
   * list restores to the top.
   */
  read(key: string): number {
    return this.offsets.get(key) ?? 0;
  }

  /**
   * Whether an offset was ever saved for this key. This — not `read() > 0` —
   * is what separates "restore" from "reset": a key that was never seen and a
   * key deliberately saved at the top both read 0, and only the store knows
   * which is which.
   */
  has(key: string): boolean {
    return this.offsets.has(key);
  }

  /** Drop a saved offset (e.g. when an entry is permanently removed). */
  forget(key: string): void {
    this.offsets.delete(key);
  }

  /** Clear every saved offset. Primarily for tests and full resets. */
  clear(): void {
    this.offsets.clear();
  }

  /** Number of distinct keys currently tracked. */
  get size(): number {
    return this.offsets.size;
  }
}
