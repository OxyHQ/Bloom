/**
 * The optional-peer boundary for `expo-web-browser`, the in-app browser
 * `openExternal` uses on native.
 *
 * The same shape as `haptics-module.ts`: a `require()` of a STRING LITERAL as a
 * DIRECT statement of a `try` block, which Metro collects as an optional
 * dependency, with the `typeof require` guard outside the try. Without the peer
 * `openExternal` hands the URL to the system (`Linking.openURL`), which still
 * opens it — in the browser app instead of over the app — so nothing warns.
 */

/**
 * Declared locally rather than taken from the ambient `NodeRequire`, which
 * returns `any`: `unknown` forces the module handle to be narrowed below.
 */
declare const require: (moduleName: string) => unknown;

/**
 * The slice of expo-web-browser's module surface Bloom calls. Hand-written
 * rather than `typeof import('expo-web-browser')`, so no expo-web-browser type
 * reaches Bloom's emitted declarations for a consumer that skips the peer.
 */
export interface WebBrowserLike {
  openBrowserAsync(url: string): Promise<unknown>;
}

/** `undefined` until the first load attempt, then the module or `null`. */
let webBrowserModule: WebBrowserLike | null | undefined;

/** The expo-web-browser module, or `null` when the optional peer is not installed. */
export function loadWebBrowser(): WebBrowserLike | null {
  if (webBrowserModule !== undefined) return webBrowserModule;
  webBrowserModule = null;
  if (typeof require === 'undefined') return webBrowserModule;
  try {
    const loaded = require('expo-web-browser') as Partial<WebBrowserLike> | null | undefined;
    if (typeof loaded?.openBrowserAsync === 'function') webBrowserModule = loaded as WebBrowserLike;
  } catch {
    // Not installed: `openExternal` uses the system handler.
  }
  return webBrowserModule;
}
