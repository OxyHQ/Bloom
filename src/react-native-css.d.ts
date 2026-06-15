/**
 * Ambient declaration for `react-native-css/native-internal`.
 *
 * react-native-css is NOT a Bloom dependency — it arrives transitively via the
 * host app's NativeWind install (NativeWind 5 is built on react-native-css@3).
 * Bloom's `native-root-vars.native.ts` statically imports `rootVariables` from
 * this subpath so Metro resolves the `import` export condition to the package's
 * `module` build — the SAME family instance the react-native-css renderer
 * (`varResolver`) subscribes to. A runtime `require()` would resolve the
 * `require` condition to the separate `commonjs` build, whose `rootVariables`
 * is a distinct, un-observed family instance (see the file-level comment in
 * `native-root-vars.native.ts`).
 *
 * Because the package isn't installed in Bloom, `tsc` can't see its published
 * types, so we declare the slice we use here — typed to match react-native-css
 * @3.0.7's `dist/typescript/.../native-internal/root.d.ts` exactly (no `any`,
 * no shims). This file is `.native`-only in spirit; the web fork never imports
 * the subpath, so on web bundlers the static import is never reached.
 */
declare module 'react-native-css/native-internal' {
  /**
   * A leaf style value. Mirrors react-native-css's `compiler.types`
   * `StyleDescriptor`. Bloom only ever writes string color values (raw HSL
   * triples for the `--*` vars, sRGB `rgb(...)` for the resolved `--color-*`
   * vars), but the family is typed against the full descriptor union.
   */
  type StyleDescriptor =
    | string
    | number
    | boolean
    | undefined
    | StyleDescriptor[];

  /**
   * A media-conditioned predicate guarding a variable value. Bloom never emits
   * conditioned values (its preset vars are unconditional), so the inner shape
   * is intentionally opaque here — declaring the full recursive union would
   * duplicate a large compiler type we never construct.
   */
  type MediaCondition = readonly unknown[];

  /**
   * A single variable value: a `[value]` tuple, optionally guarded by media
   * conditions. Mirrors react-native-css's `VariableValue`. `rootVariables(...).set`
   * takes a `VariableValue[]` (the variable's full ordered value list).
   */
  type VariableValue =
    | readonly [StyleDescriptor]
    | readonly [StyleDescriptor, readonly MediaCondition[]];

  /**
   * The reactive cell react-native-css renders from. `rootVariables(name)`
   * returns one of these; `.set` replaces its value list and notifies the
   * renderer's subscribed effects. Mirrors `Observable<StyleDescriptor, VariableValue[]>`.
   */
  interface Observable {
    set: (value: readonly VariableValue[]) => void;
  }

  /**
   * The GLOBAL root-variable family — `rootVariables(name)` returns the
   * observable for the bare variable `name` (no leading `--`). This is the
   * exact callable react-native-css's compiled `:root {}` / `@theme` vars are
   * written through (`StyleCollection.inject` → `rootVariables(name).set(...)`).
   */
  export const rootVariables: ((name: string) => Observable) & {
    delete(name: string): boolean;
    clear(): void;
  };
}
