/**
 * Jest mock for `react-native-css/native-internal`.
 *
 * react-native-css is NOT a Bloom dependency — it arrives transitively via the
 * host app's NativeWind install. `theme/native-root-vars.ts` statically imports
 * `rootVariables` from this subpath (so Metro resolves the package's `module`
 * build, the SAME family instance the renderer reads). Because the package is
 * absent in Bloom's own test tree, every suite that transitively pulls
 * `BloomThemeProvider` would otherwise fail to resolve the module.
 *
 * This mock provides a faithful, in-memory `rootVariables` family so those
 * suites run unchanged. The dedicated `native-root-vars.test.ts` overrides this
 * with `jest.doMock(..., { virtual: true })` inside `jest.isolateModules` when it
 * needs to capture exact `.set` calls.
 */

interface Observable {
  set: (value: ReadonlyArray<readonly [string]>) => void;
}

const store = new Map<string, Observable>();

function makeRootVariables(): ((name: string) => Observable) & {
  delete(name: string): boolean;
  clear(): void;
} {
  const family = (name: string): Observable => {
    const existing = store.get(name);
    if (existing) return existing;
    const observable: Observable = {
      set: () => {
        // No-op: the in-memory family records nothing by default. Tests that
        // assert on writes install their own virtual mock.
      },
    };
    store.set(name, observable);
    return observable;
  };
  family.delete = (name: string): boolean => store.delete(name);
  family.clear = (): void => store.clear();
  return family;
}

export const rootVariables = makeRootVariables();
