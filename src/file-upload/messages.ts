import { defineMessages, type MessageCatalog } from '../locale/messages';

/**
 * Every fixed string the file upload draws or announces, in each Bloom
 * language. Sizes and extensions arrive formatted. A caller's `labels` and
 * `accessibilityLabel` still win.
 */
export interface FileUploadMessages {
  /** The idle prompt before the accent word, on web (a drop zone) and on native (a tap target). */
  promptWeb: string;
  promptNative: string;
  /** The accent-coloured action word that completes the prompt. */
  selectWeb: string;
  selectNative: string;
  uploading: (size: string) => string;
  uploaded: string;
  unsupported: (extensions: string) => string;
  tooLarge: (max: string) => string;
  /** The hint's size limit after the accepted types: "(max 8 MB)". */
  max: (size: string) => string;
  /** The drop zone's name. */
  uploadFile: string;
}

export const FILE_UPLOAD_MESSAGES: MessageCatalog<FileUploadMessages> = defineMessages<FileUploadMessages>('FILE_UPLOAD_MESSAGES', {
  promptWeb: 'Drag and drop to upload or',
  promptNative: 'Tap to',
  selectWeb: 'select',
  selectNative: 'select a file',
  uploading: (size) => `Uploading ${size}...`,
  uploaded: 'Uploaded successfully!',
  unsupported: (extensions) => `Only ${extensions} files are supported`,
  tooLarge: (max) => `That file is larger than ${max}`,
  max: (size) => `(max ${size})`,
  uploadFile: 'Upload a file',
});
