/**
 * The test-side replacement for a non-null assertion (`x!`).
 *
 * `x!` tells the compiler a value is present and checks nothing, so when the
 * assumption is wrong the suite fails later and somewhere else — a
 * `Cannot read properties of undefined` three lines down, or worse an
 * `undefined` that flows into an assertion and makes it vacuous. `defined()`
 * narrows the same way but throws AT the lookup, naming what was missing.
 */
export function defined<T>(value: T | null | undefined, what = 'value'): T {
  if (value === null || value === undefined) {
    throw new Error(`expected ${what} to be defined, got ${String(value)}`);
  }
  return value;
}
