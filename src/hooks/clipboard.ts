import { loadClipboard } from './clipboard-module';

/**
 * The clipboard, as one guarded call on every platform: the browser's
 * `navigator.clipboard`, else the optional `expo-clipboard` peer (native).
 * Where neither exists — native without the peer, or a browser that refuses
 * the permission — there is nothing to write to and the caller decides what
 * that means: the copy buttons leave their glyph unchanged, the share action
 * reports nothing copied.
 */

type ClipboardNavigator = { clipboard?: { writeText?: (value: string) => Promise<void> } };

function webClipboard(): ClipboardNavigator['clipboard'] | undefined {
  return typeof navigator === 'undefined' ? undefined : (navigator as ClipboardNavigator).clipboard;
}

/** Whether `writeClipboardText` can succeed here at all. */
export function clipboardAvailable(): boolean {
  return typeof webClipboard()?.writeText === 'function' || loadClipboard() !== null;
}

/** Writes `text` to the clipboard; rejects when there is none or the platform refuses. */
export async function writeClipboardText(text: string): Promise<void> {
  const clipboard = webClipboard();
  if (clipboard?.writeText) return clipboard.writeText(text);
  const native = loadClipboard();
  if (!native) throw new Error('clipboard unavailable');
  // expo-clipboard answers `false` where the platform refused the write.
  if ((await native.setStringAsync(text)) === false) throw new Error('clipboard refused');
}
