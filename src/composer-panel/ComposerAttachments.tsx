import React from 'react';

import { ComposerPanel } from './ComposerPanel';
import type { ComposerAttachmentsProps } from './types';
import { useAttachmentQueue } from './use-attachment-queue';

/**
 * `ComposerAttachments` — NATIVE. `ComposerWithAttachments`: the Composer
 * Panel with its simulated sequential upload queue wired up (see
 * `use-attachment-queue`). The parent owns the list; dismissals come back
 * through `onAttachmentsChange`.
 */
export function ComposerAttachments({
  attachments,
  uploadDuration,
  uploadGap,
  onAttachmentsChange,
  onUploadComplete,
  onAllUploaded,
  ...panelProps
}: ComposerAttachmentsProps) {
  const { visible, remove } = useAttachmentQueue({
    attachments,
    uploadDuration,
    uploadGap,
    onAttachmentsChange,
    onUploadComplete,
    onAllUploaded,
  });
  return <ComposerPanel {...panelProps} attachments={visible} onRemoveAttachment={remove} />;
}
ComposerAttachments.displayName = 'ComposerAttachments';
