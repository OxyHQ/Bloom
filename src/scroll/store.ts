/**
 * Pure, platform-agnostic core of the scroll-restoration primitive.
 *
 * This file deliberately contains NO React and NO DOM/native imports so the
 * logic can be unit-tested in isolation and shared verbatim by the web and
 * native barrels. The web barrel drives it with real scroll offsets; the
 * native barrel never instantiates it (native-stack already restores scroll).
 */

/**
 * Separator between the navigation route key and an optional caller-supplied
 * sub-key. A route may host more than one independently-scrolling list (e.g.
 * a tabbed profile screen), so each list contributes its own sub-key.
 *
 * `\0` (NUL) can never appear in a React Navigation route key or in a
 * developer-authored sub-key, so it is collision-free as a delimiter. It is
 * written as an escape sequence (not a literal byte) so the source stays
 * text-diffable.
 */
const COMPOSITE_KEY_SEPARATOR = '\0';

/**
 * Derive the storage key for a scrollable from its owning route key and an
 * optional caller sub-key.
 *
 * - `routeKey` is React Navigation's stable per-route `route.key`.
 * - `subKey` distinguishes multiple scrollables that share a single route.
 *
 * Returns `null` when there is no route key to anchor against (the scrollable
 * is not inside a navigator), which the caller treats as "do not persist".
 */
export function deriveScrollKey(
  routeKey: string | undefined,
  subKey?: string,
): string | null {
  if (!routeKey) return null;
  if (subKey === undefined || subKey === '') return routeKey;
  return `${routeKey}${COMPOSITE_KEY_SEPARATOR}${subKey}`;
}

/**
 * In-memory map of `scrollKey -> last-known scroll offset`.
 *
 * Mirrors the semantics of Bluesky's `Map<screenKey, scrollY>`: offsets live
 * only for the lifetime of the document/session. We never persist them — a
 * full reload should start at the top — and we never auto-evict, because a
 * route can be revisited via browser Forward/Back long after it blurred.
 */
export class ScrollOffsetStore {
  private readonly offsets = new Map<string, number>();

  /** Persist the offset for a key. A negative offset is clamped to 0. */
  save(key: string, offset: number): void {
    this.offsets.set(key, offset > 0 ? offset : 0);
  }

  /**
   * Read the saved offset for a key. Returns `0` when nothing was saved, so
   * callers can restore unconditionally (an unseen list restores to the top).
   */
  read(key: string): number {
    return this.offsets.get(key) ?? 0;
  }

  /** Whether an offset was ever saved for this key. */
  has(key: string): boolean {
    return this.offsets.has(key);
  }

  /** Drop a saved offset (e.g. when a route is permanently removed). */
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
