import React, { memo, useMemo, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';

import { Button } from '../button';
import { FileUpload } from '../file-upload/FileUpload';
import type { FileUploadFile } from '../file-upload/types';
import { RiDeleteBinLine } from '../icons/remix/RiDeleteBinLine';
import { RiErrorWarningLine } from '../icons/remix/RiErrorWarningLine';
import { RiImageLine } from '../icons/remix/RiImageLine';
import { RiRefreshLine } from '../icons/remix/RiRefreshLine';
import { useImageResolver } from '../image-resolver/context';
import { isImageUrl } from '../image-resolver/is-image-url';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { CARD_RADIUS, resolveCreatorStudioPaint } from './shared';
import type { ArtworkUploaderLabels, ArtworkUploaderProps } from './types';

/**
 * `ArtworkUploader`: a release's square cover.
 *
 *   heading   `body-medium` title
 *   square    up to 320 wide (or `size`), aspect 1, radius 16
 *   empty     Bloom's `FileUpload` filling the square — drag and drop or pick
 *             on web, `onPickFiles` on native — limited to JPG / PNG
 *   preview   the image covering the square; "Replace" (secondary, refresh
 *             glyph) and a delete icon button on a row pinned 12px inside the
 *             bottom edge. Replace swaps the preview for the drop zone with a
 *             "Cancel" under it until a file is picked
 *   error     a 2px error ring over the square and the message (warning glyph,
 *             `body-2-regular`, error colour) announced politely under it
 *   caption   the requirements (`caption-1-regular` text-tertiary)
 *
 * The component never decodes an image: the app measures what was picked and
 * passes `error` — `artworkDimensionsError(width, height)` builds the "too
 * small" message.
 */

export const ARTWORK_UPLOADER_LABELS: ArtworkUploaderLabels = {
  title: 'Artwork',
  requirements: '3000×3000 px, JPG or PNG',
  replace: 'Replace',
  remove: 'Remove artwork',
  cancel: 'Cancel',
  preview: 'Release artwork',
  upload: 'Upload artwork',
};

const DEFAULT_MAX = 320;
const DEFAULT_EXTENSIONS = ['jpg', 'jpeg', 'png'] as const;

function ArtworkUploaderComponent({
  artwork,
  onFileSelected,
  onRemove,
  onPickFiles,
  error,
  progress,
  file,
  allowedExtensions = DEFAULT_EXTENSIONS,
  maxBytes = 20 * 1024 * 1024,
  size,
  disabled = false,
  labels: labelOverrides,
  style,
  testID,
}: ArtworkUploaderProps) {
  const theme = useTheme();
  const paint = useMemo(() => resolveCreatorStudioPaint(theme), [theme]);
  const labels = { ...ARTWORK_UPLOADER_LABELS, ...labelOverrides };
  const resolver = useImageResolver();
  const [replacing, setReplacing] = useState(false);

  const uri = artwork ? (isImageUrl(artwork) ? artwork : resolver?.(artwork, 'cover')) : undefined;
  const showPreview = Boolean(uri) && !replacing;
  const id = (suffix: string) => (testID ? `${testID}-${suffix}` : undefined);

  const pick = (picked: FileUploadFile) => {
    setReplacing(false);
    onFileSelected?.(picked);
  };

  return (
    <View testID={testID} style={[styles.root, { maxWidth: size ?? DEFAULT_MAX }, style]}>
      <Text variant="body-medium" style={{ color: paint.text }}>
        {labels.title}
      </Text>

      <View style={[styles.square, size ? { width: size, height: size } : null]}>
        {showPreview ? (
          <View style={[styles.preview, { backgroundColor: paint.placeholder }]} testID={id('preview')}>
            <Image
              source={{ uri: uri! }}
              style={styles.fill}
              role="img"
              accessibilityLabel={labels.preview}
              accessibilityIgnoresInvertColors
            />
            <View style={styles.previewActions}>
              <Button
                variant="secondary"
                size="small"
                leadingIcon={RiRefreshLine}
                onPress={() => setReplacing(true)}
                disabled={disabled}
                testID={id('replace')}
              >
                {labels.replace}
              </Button>
              {onRemove ? (
                <Button
                  variant="secondary"
                  size="small"
                  iconOnly
                  leadingIcon={RiDeleteBinLine}
                  accessibilityLabel={labels.remove}
                  onPress={onRemove}
                  disabled={disabled}
                  testID={id('remove')}
                />
              ) : null}
            </View>
          </View>
        ) : (
          <FileUpload
            onFileSelected={pick}
            onPickFiles={onPickFiles}
            allowedExtensions={allowedExtensions}
            maxBytes={maxBytes}
            progress={progress}
            file={file}
            disabled={disabled}
            accessibilityLabel={labels.upload}
            renderFileIcon={() => <RiImageLine width={24} height={24} fill={paint.textSecondary} />}
            style={styles.fill}
            testID={id('dropzone')}
          />
        )}
        {error ? (
          <View
            pointerEvents="none"
            testID={id('error-ring')}
            style={[styles.errorRing, { borderColor: paint.error }]}
          />
        ) : null}
      </View>

      {replacing && uri ? (
        <Button
          variant="secondary"
          size="small"
          onPress={() => setReplacing(false)}
          style={styles.cancel}
          testID={id('cancel')}
        >
          {labels.cancel}
        </Button>
      ) : null}

      {error ? (
        <View testID={id('error')} aria-live="polite" style={styles.errorRow}>
          <RiErrorWarningLine width={16} height={16} fill={paint.error} />
          <Text variant="body-2-regular" style={[styles.errorText, { color: paint.error }]}>
            {error}
          </Text>
        </View>
      ) : null}

      <Text variant="caption-1-regular" style={{ color: paint.textTertiary }}>
        {labels.requirements}
      </Text>
    </View>
  );
}

export const ArtworkUploader = memo(ArtworkUploaderComponent);
ArtworkUploader.displayName = 'ArtworkUploader';

const styles = StyleSheet.create({
  root: { width: '100%', gap: 8, minWidth: 0 },
  square: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: CARD_RADIUS,
  },
  fill: { width: '100%', height: '100%' },
  // The preview clips to the radius; the drop zone must not be clipped (its
  // progress pill rides over the top edge).
  preview: { width: '100%', height: '100%', borderRadius: CARD_RADIUS, overflow: 'hidden' },
  previewActions: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  errorRing: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderRadius: CARD_RADIUS,
    borderWidth: 2,
  },
  cancel: { alignSelf: 'flex-start' },
  errorRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  errorText: { flex: 1, minWidth: 0 },
});
