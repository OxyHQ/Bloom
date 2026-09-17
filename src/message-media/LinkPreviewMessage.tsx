import React, { memo, useCallback, useMemo } from 'react';
import { Linking, View } from 'react-native';

import { fontSize, space } from '../styles/tokens';
import type { WebCssStyle } from '../styles/web-view-style';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { MediaImage, MediaPressable } from './parts';
import {
  MESSAGE_MEDIA_RADIUS,
  MESSAGE_MEDIA_WIDTH,
  resolveMessageMediaPaint,
} from './shared';
import type { LinkPreviewMessageProps } from './types';

/** `tracking-wide` at the site name's 12px. */
const SITE_TRACKING = fontSize.xs * 0.025;
/** The accent rule down the left edge. */
const RULE_WIDTH = 3;
/** The inline layout's thumbnail. */
const THUMB = 56;

/** Best-effort hostname, for the site-name fallback. */
function hostnameOf(url: string): string | undefined {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return undefined;
  }
}

/**
 * A link's preview INSIDE a bubble.
 *
 * WHY THIS IS NOT `link-preview`'s `LinkPreviewCard`. That card is the right
 * component everywhere else and was read before this one was written; it is a
 * `Card variant="outlined"` at `radius-20` painting `colors.text` /
 * `colors.textSecondary` on `colors.card`. All three of those are page colours.
 * Dropped into an outgoing bubble it draws a page-coloured card ON the accent
 * fill — a second surface inside the message, with its own border and its own
 * background, and a body text colour that is a grey on a saturated fill.
 * Re-skinning it would mean giving it a tone prop, a palette, and a mode with no
 * card chrome, which is a different component wearing the same name.
 *
 * So the bubble's preview is its own block and takes the family's shape: NO
 * surface of its own, an accent RULE down the left edge instead of a border
 * (one line of colour, which is legible on both tones and does not read as a
 * nested card), and every colour from `resolveMessageMediaPaint`.
 *
 * `large` puts the cover above the text, `inline` keeps a 56px thumb beside it —
 * the second is for a link in a busy thread where a 160px cover is most of the
 * message.
 */
function LinkPreviewMessageComponent({
  url,
  siteName,
  title,
  description,
  image,
  imageVariant,
  layout = 'large',
  width = MESSAGE_MEDIA_WIDTH,
  radius = MESSAGE_MEDIA_RADIUS,
  onPress,
  accessibilityLabel,
  tone = 'incoming',
  onColor,
  bubbleColor,
  style,
  testID,
}: LinkPreviewMessageProps) {
  const theme = useTheme();
  const paint = useMemo(
    () => resolveMessageMediaPaint(theme, tone, onColor, bubbleColor),
    [theme, tone, onColor, bubbleColor],
  );

  const host = hostnameOf(url);
  const site = siteName ?? host;
  const heading = title ?? host ?? url;

  const handlePress = useCallback(() => {
    if (onPress) {
      onPress();
      return;
    }
    void Linking.openURL(url).catch(() => undefined);
  }, [onPress, url]);

  const root: WebCssStyle = {
    width,
    flexDirection: 'row',
    gap: space.md,
    paddingLeft: space.md,
    borderLeftWidth: RULE_WIDTH,
    borderLeftColor: paint.accent,
    borderTopLeftRadius: 2,
    borderBottomLeftRadius: 2,
  };

  const text = (
    <View style={{ flexGrow: 1, flexShrink: 1, minWidth: 0, gap: 2 }}>
      {site ? (
        <Text
          variant="caption-2-medium"
          numberOfLines={1}
          style={{ color: paint.accent, textTransform: 'uppercase', letterSpacing: SITE_TRACKING }}
          testID={testID ? `${testID}-site` : undefined}
        >
          {site}
        </Text>
      ) : null}
      <Text variant="body-2-medium" numberOfLines={2} style={{ color: paint.text }}>
        {heading}
      </Text>
      {description ? (
        <Text variant="caption-1-regular" numberOfLines={2} style={{ color: paint.textMuted }}>
          {description}
        </Text>
      ) : null}
      {layout === 'large' && image ? (
        <View style={{ paddingTop: space.sm }}>
          <MediaImage
            source={image}
            sourceVariant={imageVariant}
            height={Math.round((width - space.md - RULE_WIDTH) * 0.52)}
            radius={Math.min(radius, 12)}
            placeholder={paint.placeholder}
            testID={testID ? `${testID}-cover` : undefined}
          />
        </View>
      ) : null}
    </View>
  );

  return (
    <MediaPressable
      accessibilityLabel={accessibilityLabel ?? heading}
      role="link"
      onPress={handlePress}
      ring={paint.ring}
      style={[root, style ?? null]}
      testID={testID}
    >
      {text}
      {layout === 'inline' && image ? (
        <MediaImage
          source={image}
          sourceVariant={imageVariant}
          width={THUMB}
          height={THUMB}
          radius={Math.min(radius, 10)}
          placeholder={paint.placeholder}
          testID={testID ? `${testID}-cover` : undefined}
        />
      ) : null}
    </MediaPressable>
  );
}

export const LinkPreviewMessage = memo(LinkPreviewMessageComponent);
LinkPreviewMessage.displayName = 'LinkPreviewMessage';
