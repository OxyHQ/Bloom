import React, { memo, useMemo } from 'react';
import { Pressable, View } from 'react-native';

import { webDataSet } from '../checkbox/shared';
import { formatFileSize } from '../file-upload/shared';
import { RiCheckLine } from '../icons/remix/RiCheckLine';
import { RiDownload2Line } from '../icons/remix/RiDownload2Line';
import { RiFileCodeLine } from '../icons/remix/RiFileCodeLine';
import { RiFileExcel2Line } from '../icons/remix/RiFileExcel2Line';
import { RiFileImageLine } from '../icons/remix/RiFileImageLine';
import { RiFileMusicLine } from '../icons/remix/RiFileMusicLine';
import { RiFilePaper2Line } from '../icons/remix/RiFilePaper2Line';
import { RiFilePdf2Line } from '../icons/remix/RiFilePdf2Line';
import { RiFileTextLine } from '../icons/remix/RiFileTextLine';
import { RiFileWord2Line } from '../icons/remix/RiFileWord2Line';
import { RiFileZipLine } from '../icons/remix/RiFileZipLine';
import { RiVideoLine } from '../icons/remix/RiVideoLine';
import { borderRadius, space } from '../styles/tokens';
import type { WebCssStyle } from '../styles/web-view-style';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { MediaFailure, MediaProgressRing, useHovered, useMessageMediaCss } from './parts';
import {
  fileKindFor,
  fileMetaLine,
  fileTypeLabel,
  MESSAGE_MEDIA_RADIUS,
  MESSAGE_MEDIA_WIDTH,
  resolveFileKindPaint,
  resolveMessageMediaPaint,
} from './shared';
import type { FileKind, FileMessageProps } from './types';

/** One glyph per kind. The colour is `resolveFileKindPaint`'s job, not this map's. */
const KIND_ICONS: Record<FileKind, typeof RiFileTextLine> = {
  pdf: RiFilePdf2Line,
  doc: RiFileWord2Line,
  sheet: RiFileExcel2Line,
  slides: RiFilePaper2Line,
  zip: RiFileZipLine,
  audio: RiFileMusicLine,
  video: RiVideoLine,
  image: RiFileImageLine,
  code: RiFileCodeLine,
  other: RiFileTextLine,
};

const DISC_SIZE = { bubble: 44, compact: 36 } as const;

/**
 * A file attachment, in a bubble or in the shared-files list.
 *
 * THE RING IS THE BUTTON. The download / cancel control and the progress
 * indicator are one control, not a button beside a bar: the thing you press to
 * cancel is the thing that is showing you how far it got, and splitting them
 * gives the row two controls for one transfer.
 *
 * `compact` is the same row at 36px with no bubble inset — the Files tab of a
 * chat's info panel. It is a variant rather than a second component because the
 * two differ in geometry only, and a second component would grow its own
 * opinion about the meta line within a week.
 *
 * The kind COLOUR survives both tones (see `resolveFileKindPaint`): on the accent
 * bubble the disc becomes a near-white plate and the hue is darkened onto it,
 * rather than the colour being dropped because the bubble is already coloured.
 */
function FileMessageComponent({
  name,
  kind,
  mimeType,
  sizeBytes,
  sizeLabel,
  typeLabel,
  metaLabel,
  progress,
  transfer = 'idle',
  onPress,
  onDownload,
  onCancel,
  onRetry,
  state = 'idle',
  variant = 'bubble',
  radius = MESSAGE_MEDIA_RADIUS,
  width,
  accessibilityLabel,
  downloadLabel = 'Download',
  cancelLabel = 'Cancel',
  tone = 'incoming',
  onColor,
  bubbleColor,
  style,
  testID,
}: FileMessageProps) {
  const theme = useTheme();
  useMessageMediaCss();
  const paint = useMemo(
    () => resolveMessageMediaPaint(theme, tone, onColor, bubbleColor),
    [theme, tone, onColor, bubbleColor],
  );
  const resolvedKind = kind ?? fileKindFor(name, mimeType);
  const kindPaint = useMemo(
    () => resolveFileKindPaint(theme, resolvedKind, paint),
    [theme, resolvedKind, paint],
  );
  const [hovered, handlers] = useHovered();

  const size = sizeLabel ?? (typeof sizeBytes === 'number' ? formatFileSize(sizeBytes) : undefined);
  const type = typeLabel ?? fileTypeLabel(name, mimeType);
  const meta = fileMetaLine([size, type, metaLabel]);

  const disc = DISC_SIZE[variant];
  const Glyph = KIND_ICONS[resolvedKind];
  const transferring = transfer === 'downloading' || transfer === 'uploading';
  const done = transfer === 'done';

  const rowStyle: WebCssStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    minWidth: 0,
    ...(variant === 'bubble'
      ? {
          width: width ?? MESSAGE_MEDIA_WIDTH,
          paddingTop: space.sm,
          paddingBottom: space.sm,
          paddingLeft: space.sm,
          paddingRight: space.sm,
          borderRadius: radius,
          backgroundColor: hovered && onPress ? paint.wash : 'transparent',
        }
      : {
          width: width,
          paddingTop: space.sm,
          paddingBottom: space.sm,
          backgroundColor: hovered && onPress ? paint.wash : 'transparent',
        }),
    '--bloom-message-media-ring': paint.ring,
  };

  const body = (
    <>
      <View
        style={{
          width: disc,
          height: disc,
          borderRadius: borderRadius.full,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: kindPaint.disc,
        }}
        testID={testID ? `${testID}-disc` : undefined}
      >
        <Glyph
          width={Math.round(disc * 0.48)}
          height={Math.round(disc * 0.48)}
          fill={kindPaint.glyph}
        />
      </View>

      <View style={{ flexGrow: 1, flexShrink: 1, minWidth: 0 }}>
        <Text variant="body-medium" numberOfLines={1} style={{ color: paint.text }}>
          {name}
        </Text>
        {meta ? (
          <Text
            variant="caption-1-regular"
            numberOfLines={1}
            style={{ color: paint.textMuted }}
            testID={testID ? `${testID}-meta` : undefined}
          >
            {meta}
          </Text>
        ) : null}
      </View>

      {transferring ? (
        <MediaProgressRing
          progress={progress}
          size={32}
          color={paint.accent}
          track={paint.rail}
          fill="transparent"
          glyph={onCancel ? 'cancel' : 'none'}
          onPress={onCancel}
          accessibilityLabel={onCancel ? cancelLabel : downloadLabel}
          ring={paint.ring}
          testID={testID ? `${testID}-progress` : undefined}
        />
      ) : done ? (
        <View
          role="img"
          accessibilityLabel="Downloaded"
          style={{
            width: 32,
            height: 32,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: borderRadius.full,
            backgroundColor: paint.wash,
          }}
          testID={testID ? `${testID}-done` : undefined}
        >
          <RiCheckLine width={16} height={16} fill={paint.textMuted} />
        </View>
      ) : onDownload ? (
        <DownloadButton label={downloadLabel} paint={paint} onPress={onDownload} testID={testID} />
      ) : null}
    </>
  );

  const rowName = accessibilityLabel ?? fileMetaLine([name, meta]);

  return (
    <View style={style ?? null} testID={testID}>
      {onPress ? (
        <Pressable
          {...webDataSet({ bloomMessageMediaPressable: '' })}
          {...handlers}
          role="button"
          accessibilityLabel={rowName}
          onPress={onPress}
          style={rowStyle}
          testID={testID ? `${testID}-row` : undefined}
        >
          {body}
        </Pressable>
      ) : (
        <View style={rowStyle} testID={testID ? `${testID}-row` : undefined}>
          {body}
        </View>
      )}
      {state === 'failed' ? (
        <MediaFailure paint={paint} onRetry={onRetry} testID={testID ? `${testID}-failed` : undefined} />
      ) : null}
    </View>
  );
}

function DownloadButton({
  label,
  paint,
  onPress,
  testID,
}: {
  label: string;
  paint: ReturnType<typeof resolveMessageMediaPaint>;
  onPress: () => void;
  testID?: string;
}) {
  const [hovered, handlers] = useHovered();
  const style: WebCssStyle = {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.full,
    backgroundColor: hovered ? paint.washStrong : paint.wash,
    '--bloom-message-media-ring': paint.ring,
  };
  return (
    <Pressable
      {...webDataSet({ bloomMessageMediaPressable: '' })}
      {...handlers}
      role="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={style}
      testID={testID ? `${testID}-download` : undefined}
    >
      <RiDownload2Line width={16} height={16} fill={paint.text} />
    </Pressable>
  );
}

export const FileMessage = memo(FileMessageComponent);
FileMessage.displayName = 'FileMessage';
