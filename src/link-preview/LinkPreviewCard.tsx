/**
 * `LinkPreviewCard` — the canonical Oxy link-preview surface.
 *
 * One component renders the OpenGraph-style "cover image + site name + title +
 * description" card across every Oxy app. It consumes the link-preview DATA
 * produced by the Oxy SDK (`@oxyhq/core` `getLinkPreview` / `getLinkPreviews`,
 * DTO `LinkPreview`) but takes a structural prop shape so Bloom never depends on
 * `@oxyhq/contracts`.
 *
 * The surface chrome is `Card`'s (`outlined` at the `radius-20` rung): one
 * platform branch for background, border and elevation, shared with every other
 * Bloom card. The card's own background and border used to be `bg-card` /
 * `border-border` classes, which are inert on web until the consumer wires the
 * Tailwind pipeline — as inline resolved tokens they now paint either way.
 *
 * The CONTENT is still NativeWind-className-first (`text-foreground`,
 * `text-muted-foreground`, spacing). Those class strings must stay literal so a
 * consumer's Tailwind content-scan over `lib/**` (and the native `src/**`)
 * picks them up.
 *
 * The `image` prop is a plain absolute URL (e.g. a `cloud.oxy.so` OG image) and
 * is rendered directly with the RN `Image` primitive — NOT through
 * `ImageResolver` / `Avatar`, which resolve bare Oxy file IDs.
 */
import React, { memo, useCallback, useMemo } from 'react';
import { Linking } from 'react-native';

import { Card } from '../card';
import { useTheme } from '../theme/use-theme';
import {
  StyledImage,
  StyledText,
  StyledView,
} from '../styles/styled-primitives';
import type { LinkPreviewCardProps } from './types';

/** Height (px) of the optional cover image at the top of the card. */
const COVER_IMAGE_HEIGHT = 160;

/**
 * Best-effort hostname for the siteName / title fallbacks. Returns `undefined`
 * for an unparseable URL so the caller can fall back further (to the raw URL).
 */
function hostnameOf(url: string): string | undefined {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return undefined;
  }
}

const LinkPreviewCardComponent: React.FC<LinkPreviewCardProps> = ({
  url,
  title,
  description,
  image,
  siteName,
  coverFill = false,
  onPress,
  className,
  style,
}) => {
  const { colors } = useTheme();

  const { displaySiteName, displayTitle } = useMemo(() => {
    const host = hostnameOf(url);
    return {
      displaySiteName: siteName ?? host,
      displayTitle: title ?? host ?? url,
    };
  }, [url, siteName, title]);

  const handlePress = useCallback(() => {
    if (onPress) {
      onPress();
      return;
    }
    // No explicit handler: open the URL with the system handler. A rejected
    // promise (unsupported scheme / no handler) is non-actionable for a
    // presentational card, so it is swallowed rather than surfaced.
    void Linking.openURL(url).catch(() => undefined);
  }, [onPress, url]);

  return (
    <Card
      variant="outlined"
      radius="radius-20"
      className={className}
      style={style}
      onPress={handlePress}
      accessibilityRole="link"
      accessibilityLabel={displayTitle}
    >
      {image ? (
        <StyledImage
          source={{ uri: image }}
          resizeMode="cover"
          className="w-full"
          style={{
            // Fill-height mode: flex into the card's bounding height (supplied
            // by the consumer via `style`), letting the text block stay a
            // compact footer. Default mode: fixed intrinsic cover height.
            ...(coverFill ? { flex: 1 } : { height: COVER_IMAGE_HEIGHT }),
            backgroundColor: colors.backgroundTertiary,
          }}
        />
      ) : null}

      <StyledView className="p-3">
        {displaySiteName ? (
          <StyledText
            numberOfLines={1}
            className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
          >
            {displaySiteName}
          </StyledText>
        ) : null}

        {displayTitle ? (
          <StyledText
            numberOfLines={2}
            className="text-[15px] font-semibold text-foreground mt-1"
          >
            {displayTitle}
          </StyledText>
        ) : null}

        {description ? (
          <StyledText
            numberOfLines={2}
            className="text-[13px] leading-[18px] text-muted-foreground mt-1"
          >
            {description}
          </StyledText>
        ) : null}
      </StyledView>
    </Card>
  );
};

export const LinkPreviewCard = memo(LinkPreviewCardComponent);
LinkPreviewCard.displayName = 'LinkPreviewCard';
