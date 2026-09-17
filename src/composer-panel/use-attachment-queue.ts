import { useEffect, useRef, useState } from 'react';

import type { ComposerAttachmentsProps, ComposerPanelAttachment } from './types';

const TICK_MS = 50;

/** Anything carrying a progress value — the closed ring at 100 included — is still the queue's. */
const inFlight = (attachment: ComposerPanelAttachment) => attachment.progress !== undefined;

/** Keep the parent's order; keep our progress for files we already know. */
function reconcile(
  prev: ReadonlyArray<ComposerPanelAttachment>,
  next: ReadonlyArray<ComposerPanelAttachment>,
): ComposerPanelAttachment[] {
  const known = new Map(prev.map((attachment) => [attachment.id, attachment]));
  return next.map((attachment) => known.get(attachment.id) ?? { ...attachment });
}

/**
 * The `ComposerWithAttachments` queue: files with `progress: 0` land one
 * after another — the tile scales in, the ring draws in uneven steps over
 * `uploadDuration`, holds closed for 150ms, then fades as the dismiss appears
 * and the next file starts after `uploadGap`. Queued files wait out of sight.
 * The upload is SIMULATED, so the block stays backend-agnostic; real uploads
 * feed their own `progress` to `ComposerPanel` instead.
 */
export function useAttachmentQueue({
  attachments,
  uploadDuration = 1100,
  uploadGap = 240,
  onAttachmentsChange,
  onUploadComplete,
  onAllUploaded,
}: Pick<
  ComposerAttachmentsProps,
  'attachments' | 'uploadDuration' | 'uploadGap' | 'onAttachmentsChange' | 'onUploadComplete' | 'onAllUploaded'
>): { visible: ComposerPanelAttachment[]; remove: (id: string) => void } {
  const [items, setItems] = useState(() => reconcile([], attachments));
  const [synced, setSynced] = useState(attachments);
  if (synced !== attachments) {
    setSynced(attachments);
    setItems(reconcile(items, attachments));
  }

  const itemsRef = useRef(items);
  const completeRef = useRef(onUploadComplete);
  const allUploadedRef = useRef(onAllUploaded);
  useEffect(() => {
    itemsRef.current = items;
    completeRef.current = onUploadComplete;
    allUploadedRef.current = onAllUploaded;
  });

  const activeId = items.find(inFlight)?.id ?? null;
  const hadActive = useRef(false);

  useEffect(() => {
    if (activeId === null) {
      if (hadActive.current) {
        hadActive.current = false;
        allUploadedRef.current?.();
      }
      return;
    }
    hadActive.current = true;

    const id = activeId;
    const patch = (progress: number | undefined) =>
      setItems((prev) => prev.map((attachment) => (attachment.id === id ? { ...attachment, progress } : attachment)));

    let value = itemsRef.current.find((attachment) => attachment.id === id)?.progress ?? 0;
    const step = 100 / Math.max(1, uploadDuration / TICK_MS);
    let timer: ReturnType<typeof setTimeout> | undefined;
    const tick = () => {
      // Uneven steps so the ring reads as a transfer rather than a timer.
      value = Math.min(100, value + step * (0.55 + Math.random() * 0.9));
      patch(Math.round(value));
      if (value < 100) {
        timer = setTimeout(tick, TICK_MS);
        return;
      }
      // Let the closed ring be seen before it fades and the dismiss appears.
      timer = setTimeout(() => {
        patch(undefined);
        const landed = itemsRef.current.find((attachment) => attachment.id === id);
        if (landed) completeRef.current?.({ ...landed, progress: undefined });
      }, 150);
    };
    timer = setTimeout(tick, uploadGap);
    return () => {
      if (timer !== undefined) clearTimeout(timer);
    };
  }, [activeId, uploadDuration, uploadGap]);

  const remove = (id: string) => {
    const next = itemsRef.current.filter((attachment) => attachment.id !== id);
    setItems(next);
    onAttachmentsChange?.(next);
  };

  const visible = items.filter((attachment) => !inFlight(attachment) || attachment.id === activeId);
  return { visible, remove };
}
