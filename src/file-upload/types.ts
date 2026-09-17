import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

/**
 * A picked file, platform-neutral. On web `raw` is the DOM `File` the input or
 * the drop handed over (upload it with `fetch`/`FormData`); on native it is
 * whatever the caller's picker returned, passed back untouched.
 */
export interface FileUploadFile {
  name: string;
  /** Size in bytes. */
  size: number;
  /** Local URI, when the picker provides one (native pickers do). */
  uri?: string;
  mimeType?: string;
  /** The platform's own file object — the DOM `File` on web. */
  raw?: unknown;
}

/** Visible copy, overridable for localisation. */
export interface FileUploadLabels {
  /** Idle prompt before the accent word. Default "Drag and drop to upload or" (web), "Tap to" (native). */
  prompt: string;
  /** The accent-coloured action word. Default "select" (web), "select a file" (native). */
  select: string;
  /** Default `` size => `Uploading ${size}...` ``. */
  uploading: (formattedSize: string) => string;
  /** Default "Uploaded successfully!". */
  uploaded: string;
  /** Default `` exts => `Only ${exts} files are supported` ``. */
  unsupported: (extensions: string) => string;
  /** Default `` max => `That file is larger than ${max}` ``. */
  tooLarge: (formattedMax: string) => string;
}

export interface FileUploadProps {
  /**
   * Called with a file that passed validation, the moment it is accepted —
   * start the real upload here and feed `progress` back.
   */
  onFileSelected?: (file: FileUploadFile) => void;
  /** Called after the progress and success states finish. */
  onUploadComplete?: (file: FileUploadFile) => void;
  /** Called with the message shown when a file is rejected. */
  onReject?: (message: string, file: FileUploadFile) => void;
  /**
   * Upload progress, 0–100. When set, the component is CONTROLLED: it shows
   * this value instead of its own simulated progress, and enters the success
   * state once it reaches 100. Omit it for the self-running demo behaviour.
   */
  progress?: number;
  /**
   * The file being uploaded. When set (including `null`), the component is
   * FULLY controlled: `null` is the idle drop zone, a file with `progress`
   * below 100 is uploading, and at 100 it shows the success state, calls
   * `onUploadComplete` after the hold, and waits for you to clear `file`.
   * Set it from `onFileSelected`.
   */
  file?: FileUploadFile | null;
  /**
   * Opens a picker and resolves the chosen file(s); the first is used.
   * REQUIRED on native, which has no built-in picker (wire `expo-document-picker`
   * or similar). On web it replaces the built-in `<input type="file">`.
   */
  onPickFiles?: () =>
    | Promise<FileUploadFile | readonly FileUploadFile[] | null | undefined>
    | FileUploadFile
    | readonly FileUploadFile[]
    | null
    | undefined;
  /** Accepted filename extensions, without dots. Default pdf, jpg, jpeg, png, xlsx. */
  allowedExtensions?: readonly string[];
  /** Maximum accepted size in bytes. Default 8 MB. */
  maxBytes?: number;
  /** Overrides the icon shown while a file uploads (24px). */
  renderFileIcon?: (file: FileUploadFile) => ReactNode;
  labels?: Partial<FileUploadLabels>;
  disabled?: boolean;
  /** Accessible name of the drop zone. Default "Upload a file". */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
