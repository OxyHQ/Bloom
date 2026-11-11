import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, Share } from 'react-native';

import { writeClipboardText } from './clipboard';
import { loadSharing } from './sharing-module';

/**
 * What became of a share. `shared`: the sheet (or Web Share) completed — on
 * native a cancelled sheet is reported as `dismissed` only where the OS says so.
 * `copied`: there was no sheet, or it threw, and the link went to the clipboard.
 * `dismissed`: the person closed the sheet. `failed`: neither sharing nor
 * copying was possible; the caller says so.
 */
export type ShareOutcome = 'shared' | 'copied' | 'dismissed' | 'failed';

export interface ShareUrlInput {
  /** The link. Always carried, in the field each platform reads it from. */
  url: string;
  /** The sheet's title (Android sheet, Web Share). */
  title?: string;
  /** Text that goes with the link. Default: none, the link alone. */
  message?: string;
  /** What the clipboard fallback writes. Default `url`. */
  copyText?: string;
}

async function copy(text: string): Promise<ShareOutcome> {
  try {
    await writeClipboardText(text);
    return 'copied';
  } catch {
    return 'failed';
  }
}

/**
 * Shares a link through the best transport the platform has — the Web Share
 * API in a browser, the system sheet on native, the clipboard where there is
 * neither (a desktop browser) or sharing throws. Never throws: every path is
 * an {@link ShareOutcome}, and the caller picks the toast.
 *
 * Android's sheet takes only a message, so the link rides in it after any
 * `message`; iOS takes `url` as a field and shows it as a link.
 */
export async function shareUrl(input: ShareUrlInput): Promise<ShareOutcome> {
  const { url, title, message, copyText = url } = input;
  if (Platform.OS === 'web') {
    const nav = typeof navigator === 'undefined' ? undefined : navigator;
    if (typeof nav?.share !== 'function') return copy(copyText);
    try {
      await nav.share({ title, text: message, url });
      return 'shared';
    } catch (error) {
      // A closed Web Share dialog rejects with AbortError: a dismissal, not a failure.
      if (error instanceof Error && error.name === 'AbortError') return 'dismissed';
      return copy(copyText);
    }
  }
  try {
    const content =
      Platform.OS === 'ios'
        ? { title, message, url }
        : { title, message: message ? `${message}\n${url}` : url };
    const result = await Share.share(content);
    return result.action === Share.dismissedAction ? 'dismissed' : 'shared';
  } catch {
    return copy(copyText);
  }
}

/** A file already on the device (`file://`) or in the page (`blob:`), to hand on. */
export interface ShareFileInput {
  uri: string;
  /** The name a download or a share sheet shows. */
  filename: string;
  mimeType?: string;
}

/**
 * What became of a file share. `unavailable` is a platform with nowhere to send
 * a file (no `expo-sharing`, no app that takes one) — say sharing is not possible
 * here, not that something broke. A cancelled file sheet reports `shared`:
 * neither platform tells the difference.
 */
export type ShareFileOutcome = 'shared' | 'unavailable' | 'failed';

/**
 * Hands a file on. A browser gets a DOWNLOAD (the Web Share API carries files
 * on two browsers and offers nothing on desktop; a download works everywhere
 * and is what the button promises); native gets the system file sheet through
 * the optional `expo-sharing` peer. Nothing is copied: the `uri` shared is the
 * one passed. Never throws.
 */
export async function shareFile(input: ShareFileInput): Promise<ShareFileOutcome> {
  const { uri, filename, mimeType } = input;
  try {
    if (Platform.OS === 'web') {
      if (typeof document === 'undefined') return 'unavailable';
      const anchor = document.createElement('a');
      anchor.href = uri;
      anchor.download = filename;
      anchor.rel = 'noopener';
      // Off-screen, not `display: none`, which stops the click in some browsers.
      anchor.style.position = 'fixed';
      anchor.style.left = '-10000px';
      document.body.appendChild(anchor);
      try {
        anchor.click();
      } finally {
        anchor.remove();
      }
      return 'shared';
    }
    const sharing = loadSharing();
    if (!sharing || !(await sharing.isAvailableAsync())) return 'unavailable';
    // Both are hints the sheet uses to decide what to offer.
    await sharing.shareAsync(uri, { mimeType, UTI: mimeType, dialogTitle: filename });
    return 'shared';
  } catch {
    return 'failed';
  }
}

export interface UseShare {
  shareUrl: (input: ShareUrlInput) => Promise<ShareOutcome>;
  shareFile: (input: ShareFileInput) => Promise<ShareFileOutcome>;
  /** The last outcome of either, `null` before the first share or after `reset`. */
  outcome: ShareOutcome | ShareFileOutcome | null;
  /** The last link went to the clipboard: show "Link copied". */
  copied: boolean;
  /** Clears `outcome`, e.g. once the "Link copied" note has been shown. */
  reset: () => void;
}

/**
 * {@link shareUrl} and {@link shareFile} with the last outcome kept as state,
 * for a button that turns into "Copied" or a screen that toasts on `failed`.
 * The returned functions keep one identity; an outcome that arrives after
 * unmount is not stored.
 */
export function useShare(): UseShare {
  const [outcome, setOutcome] = useState<UseShare['outcome']>(null);
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  const url = useCallback(async (input: ShareUrlInput) => {
    const result = await shareUrl(input);
    if (alive.current) setOutcome(result);
    return result;
  }, []);
  const file = useCallback(async (input: ShareFileInput) => {
    const result = await shareFile(input);
    if (alive.current) setOutcome(result);
    return result;
  }, []);
  const reset = useCallback(() => setOutcome(null), []);
  return { shareUrl: url, shareFile: file, outcome, copied: outcome === 'copied', reset };
}
