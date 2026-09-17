/**
 * The stack above the input: a reply / edit / forward preview, or the one-line
 * `note` a slow-mode countdown and a scheduled send use.
 *
 * Every banner is the same row — rail, glyph, optional thumbnail, two lines of
 * text, a close button — because they are the same affordance ("the next
 * message is about THIS, and here is how to get out of it"). `note` drops the
 * rail and the surface, which is the difference between "you are in a mode" and
 * "here is a fact about sending".
 */
import React from 'react';
import { Image, View } from 'react-native';

import { RiCloseLine } from '../icons/remix/RiCloseLine';
import { useImageResolver } from '../image-resolver/context';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { ComposerIconButton } from './ComposerIconButton';
import {
  BANNER_ICONS,
  BANNER_RADIUS,
  BANNER_RAIL_WIDTH,
  resolveChatComposerPalette,
} from './shared';
import type { ComposerBannerProps } from './types';

/** A URL passes through; a bare id goes to the app's `ImageResolver`. */
function isUrl(value: string): boolean {
  return /^(https?:)?\/\//.test(value) || value.startsWith('data:') || value.startsWith('file:');
}

export function ComposerBanner({
  kind,
  title,
  preview,
  thumbnail,
  icon,
  accentColor,
  onClose,
  closeLabel = 'Cancel',
  trailing,
  style,
  testID,
  accessibilityLabel,
}: ComposerBannerProps) {
  const theme = useTheme();
  const palette = resolveChatComposerPalette(theme);
  const resolveImage = useImageResolver();
  const Icon = icon ?? BANNER_ICONS[kind];
  const accent = accentColor ?? palette.accent;
  const note = kind === 'note';

  const thumbUri =
    thumbnail === undefined ? undefined : isUrl(thumbnail) ? thumbnail : resolveImage?.(thumbnail, 'thumb');

  if (note) {
    return (
      <View
        accessibilityRole="text"
        accessibilityLabel={accessibilityLabel ?? (preview ? `${title}. ${preview}` : title)}
        style={[
          {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            paddingLeft: 10,
            paddingRight: 6,
            paddingTop: 2,
            paddingBottom: 2,
          },
          style,
        ]}
        testID={testID}>
        <Icon width={14} height={14} fill={palette.iconSecondary} />
        <Text variant="caption-1-regular" numberOfLines={1} style={{ color: palette.textSecondary, flexShrink: 1 }}>
          {title}
        </Text>
        {preview ? (
          <Text variant="caption-1-regular" numberOfLines={1} style={{ color: palette.textPlaceholder, flexShrink: 1 }}>
            {preview}
          </Text>
        ) : null}
        <View style={{ flexGrow: 1 }} />
        {trailing}
        {onClose ? (
          <ComposerIconButton
            icon={RiCloseLine}
            accessibilityLabel={closeLabel}
            onPress={onClose}
            size={24}
            iconSize={14}
          />
        ) : null}
      </View>
    );
  }

  return (
    <View
      accessibilityLabel={accessibilityLabel ?? (preview ? `${title}. ${preview}` : title)}
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          borderRadius: BANNER_RADIUS,
          backgroundColor: palette.accentSoft,
          paddingLeft: 8,
          paddingRight: 4,
          paddingTop: 6,
          paddingBottom: 6,
        },
        style,
      ]}
      testID={testID}>
      <View
        testID={testID ? `${testID}-rail` : undefined}
        style={{
          width: BANNER_RAIL_WIDTH,
          alignSelf: 'stretch',
          minHeight: 32,
          borderRadius: 2,
          backgroundColor: accent,
        }}
      />
      <Icon width={18} height={18} fill={accent} />
      {thumbUri ? (
        <Image
          source={{ uri: thumbUri }}
          accessibilityIgnoresInvertColors
          style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: palette.inset }}
        />
      ) : null}
      <View style={{ flexShrink: 1, flexGrow: 1, gap: 1 }}>
        <Text variant="body-2-medium" numberOfLines={1} style={{ color: accent }}>
          {title}
        </Text>
        {preview ? (
          <Text variant="body-2-regular" numberOfLines={1} style={{ color: palette.textSecondary }}>
            {preview}
          </Text>
        ) : null}
      </View>
      {trailing}
      {onClose ? (
        <ComposerIconButton
          icon={RiCloseLine}
          accessibilityLabel={closeLabel}
          onPress={onClose}
          size={28}
          iconSize={16}
        />
      ) : null}
    </View>
  );
}
