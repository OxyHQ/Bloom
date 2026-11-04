/**
 * One `Intl` formatter per (locale, options), shared by every call.
 *
 * Constructing an `Intl.NumberFormat` / `DateTimeFormat` resolves the locale's
 * data and is far costlier than formatting with it; Bloom's helpers are called
 * per row, per tick and per render, so each builds its formatter once. The
 * options objects are Bloom's own literals, so their JSON is a stable key. The
 * set of keys a running app produces is small (a few locales × a few shapes);
 * the bound only guards against an unbounded stream of distinct currencies.
 */
const MAX_ENTRIES = 256;

export class FormatterCache<F> {
  private readonly entries = new Map<string, F>();

  get(locale: string | undefined, options: object, create: () => F): F {
    const key = `${locale ?? ''}\u0000${JSON.stringify(options)}`;
    if (this.entries.has(key)) return this.entries.get(key) as F;
    const formatter = create();
    if (this.entries.size >= MAX_ENTRIES) this.entries.clear();
    this.entries.set(key, formatter);
    return formatter;
  }
}
