import { formatFileSize as formatLocaleFileSize } from '../locale/format-number';

/**
 * The size formatter, split out of `FileUpload.tsx` so a caller can have the
 * STRING without the component.
 *
 * `message-media`'s file bubble and shared-files list print the same "2.4 MB"
 * and must agree with the uploader that produced it. Importing it from
 * `FileUpload.tsx` would drag the whole uploader — reanimated, its icons, its
 * drop-zone web CSS — into every consumer of `@oxy.so/bloom/message-media`,
 * which Metro does not tree-shake away. `FileUpload.tsx` re-exports it, so the
 * public spelling is unchanged.
 */

/**
 * Bytes as a size string: `"312 KB"`, `"2.4 MB"`, `"15 MB"`, `"1.4 GB"`.
 *
 * Binary units (1024), one decimal below ten of a unit and none at or above it,
 * and a floor of 1 KB — a 200-byte attachment reading "0 KB" looks like a failed
 * upload.
 */
export function formatFileSize(bytes: number, locale?: string): string {
  return formatLocaleFileSize(bytes, locale);
}
