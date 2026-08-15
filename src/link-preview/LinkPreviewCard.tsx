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
 * Bloom card.
 *
 * NOTHING here is drawn by a class string. The card's chrome and its whole text
 * block are resolved tokens in inline style, because a className is INERT on web
 * until the consumer wires the Tailwind pipeline — and this card's content block
 * was the last place in the library that still depended on one. The failure was
 * total and silent: with no pipeline the `p-3` inset, both `mt-1` gaps, all
 * three sizes, both weights, the uppercase transform, the tracking AND the
 * `text-muted-foreground` / `text-foreground` colours were dropped at once, so
 * the card rendered as three identical 14px black lines flush against its own
 * border with the last one clipped by the corner radius. Storybook has no
 * Tailwind pipeline, so no story could see it either.
 *
 * The numbers below are exactly what those class strings resolved to, and each
 * one is named beside the utility it came from.
 *
 * The `image` prop is a plain absolute URL (e.g. a `cloud.oxy.so` OG image) and
 * is rendered directly with the RN `Image` primitive — NOT through
 * `ImageResolver` / `Avatar`, which resolve bare Oxy file IDs.
 */
import React, { memo, useCallback, useMemo } from 'react';
import { Image, Linking, StyleSheet, Text, View } from 'react-native';

import { Card } from '../card';
import { useTheme } from '../theme/use-theme';
import { fontSize, space } from '../styles/tokens';
import type { LinkPreviewCardProps } from './types';

/** Height (px) of the optional cover image at the top of the card. */
const COVER_IMAGE_HEIGHT = 160;

/**
 * `text-xs` pairs with a 16px leading in Tailwind's own type scale, and
 * `text-[13px] leading-[18px]` / `text-[15px]` state theirs (the title's
 * arbitrary size carries no paired leading upstream, so it takes the one Bloom's
 * `body` role uses at that size).
 */
const SITE_NAME_LINE_HEIGHT = 16;
const TITLE_LINE_HEIGHT = 22;
const DESCRIPTION_LINE_HEIGHT = 18;

/** `tracking-wide` is 0.025em, which at the site name's 12px is 0.3px. */
const SITE_NAME_LETTER_SPACING = fontSize.xs * 0.025;

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
        <Image
          source={{ uri: image }}
          resizeMode="cover"
          style={[
            styles.cover,
            // Fill-height mode: flex into the card's bounding height (supplied
            // by the consumer via `style`), letting the text block stay a
            // compact footer. Default mode: fixed intrinsic cover height.
            coverFill ? styles.coverFill : styles.coverFixed,
            { backgroundColor: colors.backgroundTertiary },
          ]}
        />
      ) : null}

      <View style={styles.content}>
        {displaySiteName ? (
          <Text
            numberOfLines={1}
            style={[styles.siteName, { color: colors.textSecondary }]}
          >
            {displaySiteName}
          </Text>
        ) : null}

        {displayTitle ? (
          <Text numberOfLines={2} style={[styles.title, { color: colors.text }]}>
            {displayTitle}
          </Text>
        ) : null}

        {description ? (
          <Text
            numberOfLines={2}
            style={[styles.description, { color: colors.textSecondary }]}
          >
            {description}
          </Text>
        ) : null}
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  // `w-full`.
  cover: {
    width: '100%',
  },
  coverFill: {
    flex: 1,
  },
  coverFixed: {
    height: COVER_IMAGE_HEIGHT,
  },
  // `p-3` — four-sided, which is what keeps the last line clear of the card's
  // 20px corner radius. Flush against the border, the description read as
  // spilling past the rounded corner.
  content: {
    padding: space.md,
  },
  // `text-xs font-medium uppercase tracking-wide text-muted-foreground`.
  siteName: {
    fontSize: fontSize.xs,
    lineHeight: SITE_NAME_LINE_HEIGHT,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: SITE_NAME_LETTER_SPACING,
  },
  // `text-[15px] font-semibold text-foreground mt-1`.
  title: {
    fontSize: fontSize.md,
    lineHeight: TITLE_LINE_HEIGHT,
    fontWeight: '600',
    marginTop: space.xs,
  },
  // `text-[13px] leading-[18px] text-muted-foreground mt-1`.
  description: {
    fontSize: fontSize.sm,
    lineHeight: DESCRIPTION_LINE_HEIGHT,
    marginTop: space.xs,
  },
});

export const LinkPreviewCard = memo(LinkPreviewCardComponent);
LinkPreviewCard.displayName = 'LinkPreviewCard';
