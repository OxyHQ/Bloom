/**
 * The optional-peer boundary for `@react-native-community/netinfo`.
 *
 * netinfo is an OPTIONAL peer, and a static `import` contradicts that: an
 * optional peer that is omitted does not degrade, it fails to RESOLVE, and Metro
 * aborts the whole bundle with `Unable to resolve module
 * @react-native-community/netinfo` — naming a package the app never mentions.
 * Bloom's other optional-peer static imports are immune by accident (`expo-font`
 * ships inside `expo`; `react-dom` is required by react-native-web), but netinfo
 * arrives with nothing, so for this one the failure is real.
 *
 * Metro treats a `require()` of a STRING LITERAL inside a `try` block as an
 * optional dependency: it resolves the real module when installed, and writes
 * `null` into the dependency map when it is not, so the failure moves from build
 * time to the `catch` below. Two constraints the shape has to respect:
 *
 *   - The specifier MUST be a literal. Bloom's own `lazyRequire()` helper passes
 *     the name as a VARIABLE, which Metro rewrites into a thrower ("Dynamic
 *     require defined at line N; not supported by Metro") — under Metro it can
 *     never resolve anything, installed or not.
 *   - `require` may not exist at all (this file also backs the `import`
 *     condition, i.e. an ESM build under Node), hence the `typeof` guard.
 *
 * The caller degrades to inert rather than throwing: an absent netinfo costs the
 * outage toast and nothing else, and crashing an app root over a missing
 * cosmetic affordance would be a worse trade than the build failure this
 * replaces. The degradation is silent by construction — a connection toast that
 * never appears looks exactly like a connection that never dropped — so
 * {@link warnNetInfoUnavailable} names the missing package once, in dev.
 */

/**
 * Declared locally rather than taken from the ambient `NodeRequire`, which
 * returns `any`: `unknown` forces the module handle to be narrowed below instead
 * of leaking an untyped value into the caller.
 */
declare const require: (moduleName: string) => unknown;

/** The slice of netinfo's state this component reads. */
export interface NetInfoStateLike {
  isConnected: boolean | null;
  isInternetReachable: boolean | null | undefined;
}

/**
 * The slice of netinfo's module surface this component calls.
 *
 * Hand-written rather than `typeof import('@react-native-community/netinfo')` so
 * no netinfo type reaches Bloom's emitted declarations — a consumer that skips
 * the optional peer must not inherit a TS7016 from Bloom's own `.d.ts`. The two
 * are kept in step by the assignability check in
 * `__tests__/connection-status-netinfo.test.tsx`, which is excluded from the
 * build and so may name the real package.
 */
export interface NetInfoLike {
  addEventListener: (listener: (state: NetInfoStateLike) => void) => () => void;
}

/** `undefined` until the first load attempt, then the module or `null`. */
let netInfoModule: NetInfoLike | null | undefined;
/** Why the load failed, quoted verbatim in the dev warning. */
let unavailableReason = '';
let hasWarned = false;

/** The netinfo module, or `null` when the optional peer is not installed. */
export function loadNetInfo(): NetInfoLike | null {
  if (netInfoModule !== undefined) return netInfoModule;
  netInfoModule = null;

  try {
    if (typeof require === 'undefined') {
      unavailableReason = 'this bundle has no CommonJS `require`';
    } else {
      // netinfo exposes `addEventListener` both as a named export and on its
      // default export; which one comes back depends on whether the bundler
      // resolved the CommonJS build or the ESM/source entry.
      const loaded = require('@react-native-community/netinfo') as
        | (Partial<NetInfoLike> & { default?: Partial<NetInfoLike> })
        | null
        | undefined;
      const resolved = typeof loaded?.addEventListener === 'function' ? loaded : loaded?.default;

      if (typeof resolved?.addEventListener === 'function') {
        netInfoModule = resolved as NetInfoLike;
      } else {
        unavailableReason = 'the module resolved without an `addEventListener` export';
      }
    }
  } catch (error) {
    unavailableReason = error instanceof Error ? error.message : String(error);
  }

  return netInfoModule;
}

/**
 * One warning per module lifetime, and none in production — the same mechanism
 * as `toast/use-single-outlet-guard.ts`. Metro and Vite/Rolldown both fold the
 * `NODE_ENV` check statically, so a production bundle keeps neither the branch
 * nor the message.
 */
export function warnNetInfoUnavailable(): void {
  if (process.env.NODE_ENV === 'production' || hasWarned) return;
  hasWarned = true;
  // Internal Bloom diagnostic: only the consumer's package.json can fix this,
  // so it names the package, the install command and the alternative.
  // eslint-disable-next-line no-console
  console.warn(
    '[Bloom] ConnectionStatusToasts is inert: the optional peer ' +
      '`@react-native-community/netinfo` could not be loaded, so connection changes ' +
      'are never observed and no offline / reconnecting / restored toast will ever ' +
      'appear. Install it (`npx expo install @react-native-community/netinfo`) or ' +
      `stop rendering <ConnectionStatusToasts>. Reason: ${unavailableReason}`,
  );
}
