/**
 * The optional-peer boundary for `expo-clipboard`, the clipboard on native.
 *
 * The same shape as `haptics-module.ts` and `connection-status/netinfo.ts`, for
 * the same reasons: a `require()` of a STRING LITERAL as a DIRECT statement of
 * a `try` block, which Metro collects as an optional dependency (the real
 * module when installed, `null` in the dependency map when not), with the
 * `typeof require` guard outside the try so the require stays a direct
 * statement of it. An app without the peer builds, and copying there reports
 * that nothing was copied — the caller's copy button keeps its glyph.
 */

/**
 * Declared locally rather than taken from the ambient `NodeRequire`, which
 * returns `any`: `unknown` forces the module handle to be narrowed below.
 */
declare const require: (moduleName: string) => unknown;

/**
 * The slice of expo-clipboard's module surface Bloom calls. Hand-written rather
 * than `typeof import('expo-clipboard')`, so no expo-clipboard type reaches
 * Bloom's emitted declarations for a consumer that skips the optional peer.
 */
export interface ClipboardModuleLike {
  setStringAsync(text: string): Promise<unknown>;
}

/** `undefined` until the first load attempt, then the module or `null`. */
let clipboardModule: ClipboardModuleLike | null | undefined;

/** The expo-clipboard module, or `null` when the optional peer is not installed. */
export function loadClipboard(): ClipboardModuleLike | null {
  if (clipboardModule !== undefined) return clipboardModule;
  clipboardModule = null;
  if (typeof require === 'undefined') return clipboardModule;
  try {
    const loaded = require('expo-clipboard') as Partial<ClipboardModuleLike> | null | undefined;
    if (typeof loaded?.setStringAsync === 'function')
      clipboardModule = loaded as ClipboardModuleLike;
  } catch {
    // Not installed: there is no clipboard to write to.
  }
  return clipboardModule;
}
