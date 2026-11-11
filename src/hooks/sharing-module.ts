/**
 * The optional-peer boundary for `expo-sharing`, the system share sheet for a
 * FILE on native (React Native's own `Share` carries text and a URL only, and on
 * Android not even a file).
 *
 * The same shape as `clipboard-module.ts`, for the same reasons: a `require()`
 * of a STRING LITERAL as a DIRECT statement of a `try` block, so Metro collects
 * it as an optional dependency, with the `typeof require` guard outside the try.
 * An app without the peer builds, and `shareFile` there reports `unavailable`.
 */

declare const require: (moduleName: string) => unknown;

/** The slice of expo-sharing Bloom calls, hand-written so no expo-sharing type leaks into Bloom's declarations. */
export interface SharingModuleLike {
  isAvailableAsync(): Promise<boolean>;
  shareAsync(
    uri: string,
    options?: { mimeType?: string; UTI?: string; dialogTitle?: string },
  ): Promise<void>;
}

/** `undefined` until the first load attempt, then the module or `null`. */
let sharingModule: SharingModuleLike | null | undefined;

/** The expo-sharing module, or `null` when the optional peer is not installed. */
export function loadSharing(): SharingModuleLike | null {
  if (sharingModule !== undefined) return sharingModule;
  sharingModule = null;
  if (typeof require === 'undefined') return sharingModule;
  try {
    const loaded = require('expo-sharing') as Partial<SharingModuleLike> | null | undefined;
    if (typeof loaded?.shareAsync === 'function' && typeof loaded.isAvailableAsync === 'function')
      sharingModule = loaded as SharingModuleLike;
  } catch {
    // Not installed: there is no file share sheet.
  }
  return sharingModule;
}
