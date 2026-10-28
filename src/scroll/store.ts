import type { VirtualItem } from '@tanstack/react-virtual';

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
export function deriveScrollKey(contentId: string | null, subKey?: string): string | null {
  if (!contentId) return null;
  return [contentId, subKey ?? ''].join(COMPOSITE_KEY_SEPARATOR);
}

/**
 * In-memory map of `scrollKey -> last-known scroll offset`.
 *
 * Memory is the default. Hosts can explicitly seed and observe serializable
 * snapshots; the store never chooses a storage backend. The most recently
 * updated 256 content keys are retained to bound long-lived workspaces.
 *
 * Deliberately an instance held in React context rather than a module-level
 * singleton: a dependency tree can legitimately contain two copies of Bloom
 * (a hoisted one plus a nested one under another Oxy package), and a
 * module-global would then exist twice with no way for either half to see the
 * other's offsets.
 */
/** URI-encoded keys keep internal separators portable across JSON stores, including SQL JSON. */
export type ScrollRestorationSnapshot = Readonly<Record<string, number>>;

/** In-memory layout seed; never included in the portable offset snapshot. */
export interface ScrollMeasurementSnapshot {
  columns: number;
  items: VirtualItem[];
}

export class ScrollOffsetStore {
  private readonly offsets = new Map<string, number>();
  private readonly measurements = new Map<string, ScrollMeasurementSnapshot>();
  private readonly retainedKeys = new Map<string, true>();

  private retainKey(key: string): boolean {
    this.retainedKeys.delete(key);
    this.retainedKeys.set(key, true);
    if (this.retainedKeys.size > 256) {
      const oldest = this.retainedKeys.keys().next().value;
      if (oldest !== undefined) {
        this.retainedKeys.delete(oldest);
        const removedOffset = this.offsets.delete(oldest);
        this.measurements.delete(oldest);
        return removedOffset;
      }
    }
    return false;
  }

  readMeasurements(key: string): ScrollMeasurementSnapshot | undefined {
    return this.measurements.get(key);
  }

  saveMeasurements(key: string, snapshot: ScrollMeasurementSnapshot): void {
    this.measurements.set(key, snapshot);
    if (this.retainKey(key)) this.changed();
  }

  private readonly listeners = new Set<() => void>();
  private readonly flushListeners = new Set<() => void>();

  constructor(snapshot?: ScrollRestorationSnapshot) {
    for (const [encodedKey, offset] of Object.entries(snapshot ?? {})) {
      try {
        this.save(decodeURIComponent(encodedKey), offset);
      } catch {
        /* Ignore malformed external keys. */
      }
    }
  }

  snapshot(): ScrollRestorationSnapshot {
    return Object.fromEntries(
      Array.from(this.offsets, ([key, offset]) => [encodeURIComponent(key), offset]),
    );
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  subscribeFlush(listener: () => void): () => void {
    this.flushListeners.add(listener);
    return () => {
      this.flushListeners.delete(listener);
    };
  }

  /** Flush pending host notification at navigation/lifecycle boundaries. */
  flush(): void {
    for (const listener of this.flushListeners) listener();
  }

  private changed(): void {
    for (const listener of this.listeners) listener();
  }

  /** Persist finite offsets only; bounce overscroll is clamped to zero. */
  save(key: string, offset: number): void {
    if (!key || !Number.isFinite(offset)) return;
    // Router ids with invalid Unicode cannot be represented by the portable codec.
    try {
      encodeURIComponent(key);
    } catch {
      return;
    }
    const value = Math.max(0, offset);
    if (this.offsets.get(key) === value) return;
    this.offsets.delete(key);
    this.offsets.set(key, value);
    this.retainKey(key);
    this.changed();
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
    this.retainedKeys.delete(key);
    this.measurements.delete(key);
    if (this.offsets.delete(key)) this.changed();
  }

  /** Drop offsets belonging to entries removed from an owned navigation history. */
  retainContentIds(ids: readonly string[]): void {
    const allowed = new Set(ids);
    let changed = false;
    for (const key of this.retainedKeys.keys()) {
      if (!allowed.has(key.split(COMPOSITE_KEY_SEPARATOR)[0] ?? '')) {
        this.retainedKeys.delete(key);
        this.measurements.delete(key);
        changed = this.offsets.delete(key) || changed;
      }
    }
    if (changed) this.changed();
  }

  /** Clear every saved offset. Primarily for tests and full resets. */
  clear(): void {
    this.retainedKeys.clear();
    this.measurements.clear();
    if (!this.offsets.size) return;
    this.offsets.clear();
    this.changed();
  }

  /** Number of distinct keys currently tracked. */
  get size(): number {
    return this.offsets.size;
  }
}
