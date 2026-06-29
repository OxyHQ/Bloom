/**
 * `LinkPreviewCard` — the canonical Oxy link-preview surface.
 *
 * One component renders the OpenGraph-style "cover image + site name + title +
 * description" card across every Oxy app. It consumes the link-preview DATA
 * produced by the Oxy SDK (`@oxyhq/core` `getLinkPreview` / `getLinkPreviews`,
 * DTO `LinkPreview`) but takes a structural prop shape so Bloom never depends on
 * `@oxyhq/contracts`.
 *
 * Styling is NativeWind-className-first (semantic Bloom utilities like
 * `bg-card`, `border-border`, `text-foreground`, `text-muted-foreground`) with
 * `useTheme()` Bloom tokens for the runtime-color and numeric-geometry values
 * that have no clean utility — mirroring the `ContentPanel` idiom. The literal
 * class strings must stay literal so a consumer's Tailwind content-scan over
 * `lib/**` (and the native `src/**`) picks them up.
 *
 * The `image` prop is a plain absolute URL (e.g. a `cloud.oxy.so` OG image) and
 * is rendered directly with the RN `Image` primitive — NOT through
 * `ImageResolver` / `Avatar`, which resolve bare Oxy file IDs.
 */
import React, { memo, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  Linking,
} from 'react-native';

import { useTheme } from '../theme/use-theme';
import { useInteractionState } from '../hooks/useInteractionState';
import { RADIUS } from '../design-tokens/scales';
import type { LinkPreviewCardProps } from './types';

/** Height (px) of the optional cover image at the top of the card. */
const COVER_IMAGE_HEIGHT = 160;

/** Opacity applied to the whole card while it is pressed. */
const PRESSED_OPACITY = 0.85;

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
  const { state: pressed, onIn: onPressIn, onOut: onPressOut } =
    useInteractionState();

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

  const surfaceClass = ['overflow-hidden border border-border bg-card', className]
    .filter(Boolean)
    .join(' ');

  return (
    <Pressable
      {...({ className: surfaceClass } as Record<string, string>)}
      style={[
        { borderRadius: RADIUS['radius-20'] },
        pressed && { opacity: PRESSED_OPACITY },
        style,
      ]}
      onPress={handlePress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      accessibilityRole="link"
      accessibilityLabel={displayTitle}
    >
      {image ? (
        <Image
          source={{ uri: image }}
          resizeMode="cover"
          {...({ className: 'w-full' } as Record<string, string>)}
          style={{
            // Fill-height mode: flex into the card's bounding height (supplied
            // by the consumer via `style`), letting the text block stay a
            // compact footer. Default mode: fixed intrinsic cover height.
            ...(coverFill ? { flex: 1 } : { height: COVER_IMAGE_HEIGHT }),
            backgroundColor: colors.backgroundTertiary,
          }}
        />
      ) : null}

      <View {...({ className: 'p-3' } as Record<string, string>)}>
        {displaySiteName ? (
          <Text
            numberOfLines={1}
            {...({
              className:
                'text-xs font-medium uppercase tracking-wide text-muted-foreground',
            } as Record<string, string>)}
          >
            {displaySiteName}
          </Text>
        ) : null}

        {displayTitle ? (
          <Text
            numberOfLines={2}
            {...({
              className: 'text-[15px] font-semibold text-foreground mt-1',
            } as Record<string, string>)}
          >
            {displayTitle}
          </Text>
        ) : null}

        {description ? (
          <Text
            numberOfLines={2}
            {...({
              className: 'text-[13px] leading-[18px] text-muted-foreground mt-1',
            } as Record<string, string>)}
          >
            {description}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
};

export const LinkPreviewCard = memo(LinkPreviewCardComponent);
LinkPreviewCard.displayName = 'LinkPreviewCard';
