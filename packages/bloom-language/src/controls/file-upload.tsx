import {
  FileUpload as BloomFileUpload,
  type FileUploadFile,
  type FileUploadLabels,
  type FileUploadProps,
} from '@oxy.so/bloom/file-upload';

import { Node, type Child, type ViewModifiers } from '../node';
import type { ControlRenderer } from './draw';

/** A drag-and-drop file zone with validation, a progress ring and a success state (Bloom `file-upload`). */
export type FileUploadKind = 'fileUpload';

/** Bloom `FileUpload`: a zone a file is dropped on or picked into, and its upload. */
export interface FileUploadView extends ViewModifiers<FileUploadView> {
  /** The file being uploaded (or uploaded), when the screen owns it. */
  file(value: FileUploadFile | null): FileUploadView;
  /** The upload's progress, 0 to 100; 100 is uploaded. */
  uploadProgress(value: number): FileUploadView;
  /** A file passed the checks. */
  onFileSelected(value: (file: FileUploadFile) => void): FileUploadView;
  onUploadComplete(value: (file: FileUploadFile) => void): FileUploadView;
  /** A file failed the checks, and why. */
  onReject(value: (message: string, file: FileUploadFile) => void): FileUploadView;
  /** How a file is picked on a press (the platform's picker). */
  picker(value: NonNullable<FileUploadProps['onPickFiles']>): FileUploadView;
  /** The extensions it takes (`['pdf', 'png']`). */
  allowedExtensions(value: readonly string[]): FileUploadView;
  /** The largest file, in bytes. */
  maxBytes(value: number): FileUploadView;
  /** A file's glyph of your own. */
  fileIcon(value: (file: FileUploadFile) => Child): FileUploadView;
  disabled(value?: boolean): FileUploadView;
  labels(value: Partial<FileUploadLabels>): FileUploadView;
}

/** Bloom `FileUpload`. */
export function FileUpload(): FileUploadView {
  return new Node('fileUpload', null, []);
}

export const FILE_UPLOADS: Record<FileUploadKind, ControlRenderer> = {
  fileUpload: (d) => {
    const fileIcon = d.own('fileIcon')?.value;
    const props = d.props();
    Object.assign(props, {
      file: d.own('file')?.value,
      progress: d.own('uploadProgress')?.value,
      onFileSelected: d.own('onFileSelected')?.value,
      onUploadComplete: d.own('onUploadComplete')?.value,
      onReject: d.own('onReject')?.value,
      onPickFiles: d.own('picker')?.value,
      allowedExtensions: d.own('allowedExtensions')?.value,
      maxBytes: d.own('maxBytes')?.value,
      renderFileIcon:
        fileIcon === undefined ? undefined : (file: FileUploadFile) => d.render(fileIcon(file)),
      disabled: d.own('disabled')?.value,
      labels: d.own('labels')?.value,
    });
    return d.component(BloomFileUpload, props);
  },
};
