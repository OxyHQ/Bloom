/**
 * The optional-peer boundary for `expo-haptics`.
 *
 * The load has to be dynamic — an optional peer that is omitted does not
 * degrade when it is imported statically, it fails to RESOLVE and Metro aborts
 * the whole bundle naming a package the app never mentions. But it also has to
 * be dynamic in the ONE shape Metro understands: a `require()` of a STRING
 * LITERAL inside a `try` block, which Metro collects as an optional dependency
 * (resolving the real module when installed, writing `null` into the dependency
 * map when it is not, so the failure lands in the `catch` below at evaluation
 * time instead of at build time).
 *
 * The shape this replaced — the deleted `utils/lazy-require.ts`, which took the
 * specifier as a function PARAMETER — satisfied neither. Metro can only collect
 * a dependency whose specifier it can evaluate statically; a parameter it
 * cannot, so it collected nothing and rewrote the call into a thrower ("Dynamic
 * require defined at line N; not supported by Metro"). From a consumer's
 * `node_modules` that resolved NOTHING, installed or not: `expo-haptics` was
 * never loaded on any device and every haptic in Bloom was a silent no-op. It
 * only ever worked under jest, which is CommonJS with a real dynamic `require`.
 *
 * `require` may also not exist at all (this file backs the `import` condition
 * too, i.e. an ESM build under Node), hence the `typeof` guard.
 *
 * A missing haptic is invisible — indistinguishable from a device with haptics
 * turned off — so {@link warnHapticsUnavailable} names the package once, in dev.
 *
 * @see connection-status/netinfo.ts — the same boundary for netinfo.
 */

/**
 * Declared locally rather than taken from the ambient `NodeRequire`, which
 * returns `any`: `unknown` forces the module handle to be narrowed below instead
 * of leaking an untyped value into the caller.
 */
declare const require: (moduleName: string) => unknown;

/**
 * The slice of expo-haptics' module surface this hook calls.
 *
 * Hand-written rather than `typeof import('expo-haptics')` so no expo-haptics
 * type reaches Bloom's emitted declarations — a consumer that skips the optional
 * peer must not inherit a TS7016 from Bloom's own `.d.ts`. The two are kept in
 * step by the assignability check in `__tests__/useHaptics.test.tsx`, which is
 * excluded from the build and so may name the real package.
 *
 * `impactAsync` is declared in METHOD syntax deliberately: `strictFunctionTypes`
 * exempts method parameters from contravariance, which is what keeps the real
 * `(style?: ImpactFeedbackStyle) => Promise<void>` assignable to a `string`
 * parameter here. The widening cannot admit a bad value in practice — the only
 * arguments passed are read straight back out of `ImpactFeedbackStyle`.
 */
export interface HapticsLike {
  ImpactFeedbackStyle: Record<'Light' | 'Medium' | 'Heavy', string>;
  impactAsync(style?: string): Promise<void>;
}

/** `undefined` until the first load attempt, then the module or `null`. */
let hapticsModule: HapticsLike | null | undefined;
/** Why the load failed, quoted verbatim in the dev warning. */
let unavailableReason = '';
let hasWarned = false;

/** The expo-haptics module, or `null` when the optional peer is not installed. */
export function loadHaptics(): HapticsLike | null {
  if (hapticsModule !== undefined) return hapticsModule;
  hapticsModule = null;

  // The `typeof require` guard sits OUTSIDE the try on purpose. Metro's
  // `isOptionalDependency` walks up from the require call and returns as soon as
  // it meets a BlockStatement, marking the dependency optional only if THAT
  // block is a try block — so a require nested one `if`/`else` deeper is
  // resolved eagerly like any other import, and an app without the peer fails to
  // BUILD. Keeping the require a direct statement of the try block is the whole
  // difference between degrading and not building.
  if (typeof require === 'undefined') {
    unavailableReason = 'this bundle has no CommonJS `require`';
    return hapticsModule;
  }

  try {
    const loaded = require('expo-haptics') as Partial<HapticsLike> | null | undefined;

    if (
      typeof loaded?.impactAsync === 'function' &&
      typeof loaded.ImpactFeedbackStyle?.Light === 'string'
    ) {
      hapticsModule = loaded as HapticsLike;
    } else {
      unavailableReason =
        'the module resolved without an `impactAsync` / `ImpactFeedbackStyle` export';
    }
  } catch (error) {
    unavailableReason = error instanceof Error ? error.message : String(error);
  }

  return hapticsModule;
}

/**
 * One warning per module lifetime, and none in production — the same mechanism
 * as `connection-status/netinfo.ts` and `toast/use-single-outlet-guard.ts`.
 * Metro and Vite/Rolldown both fold the `NODE_ENV` check statically, so a
 * production bundle keeps neither the branch nor the message.
 */
export function warnHapticsUnavailable(): void {
  if (process.env.NODE_ENV === 'production' || hasWarned) return;
  hasWarned = true;
  // Internal Bloom diagnostic: only the consumer's package.json can fix this,
  // so it names the package, the install command and the alternative.
  // eslint-disable-next-line no-console
  console.warn(
    '[Bloom] useHaptics is inert: the optional peer `expo-haptics` could not be ' +
      'loaded, so every haptic in Bloom is a silent no-op. Install it ' +
      '(`npx expo install expo-haptics`) or disable haptics explicitly with ' +
      `<BloomHapticsProvider enabled={false}>. Reason: ${unavailableReason}`,
  );
}
