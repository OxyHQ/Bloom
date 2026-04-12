/**
 * Creates a lazy-loaded module getter that caches the result.
 *
 * Safely handles environments where `require` is not defined (e.g. Vite/browser ESM)
 * and returns `null` when the module is not installed. The result is cached after the
 * first call so subsequent calls are zero-cost.
 *
 * @example
 * ```ts
 * const getSvg = lazyRequire<typeof import('react-native-svg')>('react-native-svg');
 * const svg = getSvg(); // SvgModuleType | null
 * ```
 */
export function lazyRequire<T>(moduleName: string): () => T | null {
  let module: T | null = null;
  let resolved = false;

  return (): T | null => {
    if (!resolved) {
      resolved = true;
      try {
        if (typeof require !== 'undefined') {
          module = require(moduleName);
        }
      } catch {
        module = null;
      }
    }
    return module;
  };
}
