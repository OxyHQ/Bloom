/**
 * The web clipboard, as one guarded call. React Native has no
 * `navigator.clipboard` (and Bloom takes no clipboard peer), so on native — or
 * in a browser that refuses the permission — there is nothing to write to and
 * the caller decides what that means: the copy buttons leave their glyph
 * unchanged, the share action reports nothing copied.
 *
 * Three families wrote this out for themselves (code, agent-chat twice).
 */

type ClipboardNavigator = { clipboard?: { writeText?: (value: string) => Promise<void> } };

function webClipboard(): ClipboardNavigator['clipboard'] | undefined {
  return typeof navigator === 'undefined' ? undefined : (navigator as ClipboardNavigator).clipboard;
}

/** Whether `writeClipboardText` can succeed here at all. */
export function clipboardAvailable(): boolean {
  return typeof webClipboard()?.writeText === 'function';
}

/** Writes `text` to the clipboard; rejects when there is none or the browser refuses. */
export function writeClipboardText(text: string): Promise<void> {
  const clipboard = webClipboard();
  if (!clipboard?.writeText) return Promise.reject(new Error('clipboard unavailable'));
  return clipboard.writeText(text);
}
