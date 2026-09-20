/**
 * The pending-attachment strip between the banner stack and the bar.
 *
 * The tile geometry and the rounded-rect progress path are `composer-panel`'s —
 * imported rather than retyped, because a second ring drawn from a second path
 * helper is how two composers end up with rings that close at different angles.
 */
import React from 'react';
import { Image, Pressable, ScrollView, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { ringPath } from '../composer-panel/shared';
import { RiCloseLine } from '../icons/remix/RiCloseLine';
import { RiFileTextLine } from '../icons/remix/RiFileTextLine';
import { useImageResolver } from '../image-resolver/context';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { ComposerIconButton } from './ComposerIconButton';
import { TILE, TILE_RADIUS, resolveChatComposerPalette } from './shared';
import type { ChatComposerAttachment, ComposerAttachmentStripProps } from './types';
import { dataHook } from './web-hooks';

function isUrl(value: string): boolean {
  return /^(https?:)?\/\//.test(value) || value.startsWith('data:') || value.startsWith('file:');
}

function defaultRemoveLabel(attachment: ChatComposerAttachment): string {
  return `Remove ${attachment.name}`;
}

function Tile({
  attachment,
  size,
  onRemove,
  removeLabel,
  onOpen,
  openLabel,
  testID,
}: {
  attachment: ChatComposerAttachment;
  size: number;
  onRemove?: (id: string) => void;
  removeLabel: (attachment: ChatComposerAttachment) => string;
  onOpen?: (id: string) => void;
  openLabel?: (attachment: ChatComposerAttachment) => string;
  testID?: string;
}) {
  const theme = useTheme();
  const palette = resolveChatComposerPalette(theme);
  const resolveImage = useImageResolver();
  const Glyph = attachment.icon ?? RiFileTextLine;
  const uploading = attachment.progress !== undefined;
  const progress = Math.min(100, Math.max(0, attachment.progress ?? 0));
  const radius = TILE_RADIUS - 1;
  const path = ringPath(size, size, 1, radius);
  // No `pathLength` on native, so the dash arithmetic needs the real length:
  // four straight runs plus one full circle of the corner radius.
  const length = 4 * (size - 2 - 2 * radius) + 2 * Math.PI * radius;

  const uri =
    attachment.source === undefined
      ? undefined
      : isUrl(attachment.source)
        ? attachment.source
        : resolveImage?.(attachment.source, 'thumb');

  // The box is a button only where the caller gave it something to do. A tile
  // that is `role="button"` with no handler announces an action that is not
  // there, and one that opens on press without a role is unreachable.
  const Box = onOpen === undefined ? View : Pressable;
  const boxProps =
    onOpen === undefined
      ? {}
      : {
          role: 'button' as const,
          accessibilityLabel: (openLabel ?? ((a: ChatComposerAttachment) => a.name))(attachment),
          onPress: () => onOpen(attachment.id),
        };

  return (
    <View style={{ width: size, gap: 4 }} testID={testID}>
      {/* The clipped box and the ring are SIBLINGS, never nested. Inside the
          bordered box an inset-0 layer is the PADDING box — `size - 2` — so a
          ring drawn in the tile's own `size` coordinates lands 1px off and has
          its last edge cut away by the same `overflow: hidden` that rounds the
          photo. The symptom is a ring that stops three quarters of the way
          round while the dash arithmetic says it is complete. */}
      <View style={{ position: 'relative', width: size, height: size }}>
        <Box
          {...boxProps}
          style={{
            width: size,
            height: size,
            borderRadius: TILE_RADIUS,
            borderWidth: 1,
            borderColor: palette.border,
            backgroundColor: palette.inset,
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}>
          {uri ? (
            <Image
              source={{ uri }}
              accessibilityIgnoresInvertColors
              style={{ width: size, height: size, opacity: uploading ? 0.6 : 1 }}
            />
          ) : (
            <Glyph width={22} height={22} fill={palette.iconSecondary} />
          )}
        </Box>
        {uploading ? (
          <View
            {...dataHook('bloomChatComposerRing')}
            pointerEvents="none"
            style={{ position: 'absolute', top: 0, left: 0, width: size, height: size }}
            testID={testID ? `${testID}-ring` : undefined}>
            <Svg width={size} height={size}>
              <Path
                d={path}
                fill="none"
                stroke={palette.accent}
                strokeWidth={2}
                strokeLinecap="round"
                strokeDasharray={`${(length * progress) / 100} ${length}`}
              />
            </Svg>
          </View>
        ) : null}
      </View>
      {onRemove && !uploading ? (
        <View style={{ position: 'absolute', top: -6, right: -6 }}>
          <ComposerIconButton
            icon={RiCloseLine}
            accessibilityLabel={removeLabel(attachment)}
            onPress={() => onRemove(attachment.id)}
            size={20}
            iconSize={12}
            style={{
              backgroundColor: palette.surface,
              borderWidth: 1,
              borderColor: palette.border,
            }}
            testID={testID ? `${testID}-remove` : undefined}
          />
        </View>
      ) : null}
      <Text
        variant="caption-2-regular"
        numberOfLines={1}
        style={{ color: uploading ? palette.accent : palette.textSecondary }}>
        {uploading ? `${Math.round(progress)}%` : (attachment.caption ?? attachment.name)}
      </Text>
    </View>
  );
}

export function ComposerAttachmentStrip({
  attachments,
  onRemove,
  onOpen,
  size = TILE,
  removeLabel = defaultRemoveLabel,
  openLabel,
  style,
  testID,
  accessibilityLabel = 'Attachments',
}: ComposerAttachmentStripProps) {
  if (attachments.length === 0) return null;
  return (
    <ScrollView
      {...dataHook('bloomChatComposerScroll')}
      horizontal
      showsHorizontalScrollIndicator={false}
      accessibilityLabel={accessibilityLabel}
      contentContainerStyle={{
        flexDirection: 'row',
        gap: 10,
        // The remove disc hangs 6px past the tile on both axes and a horizontal
        // ScrollView clips its cross axis (`overflow-y: hidden` on web), so the
        // top pad is the disc's overhang plus its border — not a rhythm value.
        paddingLeft: 8,
        paddingRight: 8,
        paddingTop: 10,
        paddingBottom: 2,
      }}
      style={[{ flexGrow: 0 }, style]}
      testID={testID}>
      {attachments.map((attachment) => (
        <Tile
          key={attachment.id}
          attachment={attachment}
          size={size}
          onRemove={onRemove}
          removeLabel={removeLabel}
          onOpen={onOpen}
          openLabel={openLabel}
          testID={testID ? `${testID}-${attachment.id}` : undefined}
        />
      ))}
    </ScrollView>
  );
}
