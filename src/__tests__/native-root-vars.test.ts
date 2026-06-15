type SetCall = ReadonlyArray<readonly [string]>;

/**
 * Verifies the native/default variant `theme/native-root-vars.ts` publishes the
 * active preset into react-native-css's GLOBAL `rootVariables` family with the
 * exact keying and value shape react-native-css itself uses for compiled `:root`
 * vars, and that the web fork `theme/native-root-vars.web.ts` is an inert no-op.
 *
 *  - keys are written WITHOUT the leading `--` (the family is keyed by the bare
 *    name — confirmed against react-native-css@3.0.7's compiler, which stores
 *    `:root { --x }` via `slice(2)` and looks up `var(--x)` by the bare name);
 *  - each value is a single-element value-array `[[value]]` (`VariableValue[]`);
 *  - the native variant reaches react-native-css via a STATIC ESM import (so
 *    Metro resolves the `module` build — the SAME family the renderer reads);
 *  - the web variant never imports react-native-css and writes nothing.
 *
 * react-native-css is NOT a Bloom dependency (it arrives transitively via the
 * host's NativeWind install), so the subpath is mocked virtually here — both for
 * the runtime `.set` capture AND so ts-jest can compile the static import. The
 * ambient `src/react-native-css.d.ts` declares the subpath's types for `tsc`.
 */
describe('applyNativeRootVars (native variant)', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('writes preset vars to rootVariables with the leading -- stripped', () => {
    const sets: Record<string, SetCall> = {};

    jest.isolateModules(() => {
      jest.doMock(
        'react-native-css/native-internal',
        () => ({
          rootVariables: (name: string) => ({
            set: (value: SetCall) => {
              sets[name] = value;
            },
          }),
        }),
        { virtual: true },
      );

      const { applyNativeRootVars } = require('../theme/native-root-vars') as {
        applyNativeRootVars: (preset: string, mode: 'light' | 'dark') => void;
      };
      applyNativeRootVars('blue', 'light');
    });

    // Keys are bare (no `--`), and the raw HSL triple is present unwrapped.
    expect(sets).toHaveProperty('primary');
    expect(sets).not.toHaveProperty('--primary');
    expect(sets.primary).toEqual([['205 87% 53%']]);

    // Resolved Tailwind v4 `--color-*` vars are written too, also bare-keyed,
    // and as sRGB `rgb(...)` (not `hsl(...)`) so native `color-mix` alpha
    // utilities resolve — `205 87% 53%` → `rgb(31 153 239)`.
    expect(sets).toHaveProperty('color-primary');
    expect(sets['color-primary']).toEqual([['rgb(31 153 239)']]);

    // Every value is a single-element value-array `[[value]]` of strings.
    for (const value of Object.values(sets)) {
      expect(Array.isArray(value)).toBe(true);
      expect(value).toHaveLength(1);
      expect(value[0]).toHaveLength(1);
      expect(typeof value[0]?.[0]).toBe('string');
    }
  });

  it('reflects the resolved mode (dark preset differs from light)', () => {
    const collect = (mode: 'light' | 'dark'): Record<string, SetCall> => {
      const sets: Record<string, SetCall> = {};
      jest.isolateModules(() => {
        jest.doMock(
          'react-native-css/native-internal',
          () => ({
            rootVariables: (name: string) => ({
              set: (value: SetCall) => {
                sets[name] = value;
              },
            }),
          }),
          { virtual: true },
        );
        const { applyNativeRootVars } = require('../theme/native-root-vars') as {
          applyNativeRootVars: (preset: string, mode: 'light' | 'dark') => void;
        };
        applyNativeRootVars('teal', mode);
      });
      return sets;
    };

    expect(collect('light').background).not.toEqual(collect('dark').background);
  });

  it('guards when rootVariables is not callable (defensive, never throws)', () => {
    jest.isolateModules(() => {
      jest.doMock(
        'react-native-css/native-internal',
        () => ({ rootVariables: undefined }),
        { virtual: true },
      );
      const { applyNativeRootVars } = require('../theme/native-root-vars') as {
        applyNativeRootVars: (preset: string, mode: 'light' | 'dark') => void;
      };
      expect(() => applyNativeRootVars('blue', 'light')).not.toThrow();
    });
  });
});

describe('applyNativeRootVars (web fork)', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('no-ops on web (vars are written to documentElement there instead)', () => {
    // The web fork must never touch react-native-css. We assert it neither
    // imports the subpath nor throws — it is a pure no-op with the same
    // signature as the native variant.
    jest.isolateModules(() => {
      const { applyNativeRootVars } = require('../theme/native-root-vars.web') as {
        applyNativeRootVars: (preset: string, mode: 'light' | 'dark') => void;
      };
      expect(() => applyNativeRootVars('blue', 'light')).not.toThrow();
      expect(applyNativeRootVars('blue', 'light')).toBeUndefined();
    });
  });
});
