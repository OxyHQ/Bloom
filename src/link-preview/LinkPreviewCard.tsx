/**
 * `LinkPreviewCard` — the canonical Oxy link-preview surface.
 *
 * One component renders the OpenGraph-style "cover image + site name + title +
 * description + byline" card across every Oxy app. It consumes the link-preview DATA
 * produced by the Oxy SDK (`@oxy.so/core` `getLinkPreview` / `getLinkPreviews`,
 * DTO `LinkPreview`) but takes a structural prop shape so Bloom never depends on
 * `@oxy.so/contracts`.
 *
 * The surface chrome is `Card`'s (`outlined` at the `radius-20` rung): one
 * platform branch for background, border and elevation, shared with every other
 * Bloom card.
 *
 * The card's chrome and its whole text block are resolved tokens in style.
 *
 * The `image` prop is an absolute URL, or the same image at several widths, and
 * is rendered with `expo-image` (which picks among the widths by the cover's
 * laid-out size) — NOT through `ImageResolver` / `Avatar`, which resolve bare
 * Oxy file IDs.
 */
import type React from 'react';
import { memo, useCallback, useMemo } from 'react';
import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';
import { openExternal } from '../hooks/link-activation';

import { Card } from '../card';
import { useTheme } from '../theme/use-theme';
import { fontSize, space } from '../styles/tokens';
import { Text } from '../typography';
import { TYPE_SCALE } from '../typography/scale';
import type { LinkPreviewCardProps, LinkPreviewImageSource } from './types';

/** Height (px) of the optional cover image at the top of the card. */
const COVER_IMAGE_HEIGHT = 160;

/**
 * The text block of an article card (one with a cover, or one whose preview is
 * still on its way) is never shorter than its full shape: the site name, two
 * lines of title and two of description, with their gaps and the block's
 * padding. Its height is then known before the preview loads, and a card whose
 * title or description runs to one line, or whose preview arrives late, does
 * not change height and move the list around it.
 */
const ARTICLE_TEXT_MIN_HEIGHT =
  2 * space.md +
  TYPE_SCALE['caption-1-medium'].lineHeight +
  space.xs +
  2 * TYPE_SCALE['headline-semibold'].lineHeight +
  space.xs +
  2 * TYPE_SCALE['body-2-regular'].lineHeight;

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

/**
 * `image` as `expo-image` takes it, or `undefined` when there is nothing to
 * show. An empty list counts as no image, so a card whose preview has arrived
 * never reserves a blank cover.
 */
function coverSource(
  image: string | readonly LinkPreviewImageSource[] | undefined,
): string | LinkPreviewImageSource[] | undefined {
  if (typeof image === 'string') return image || undefined;
  return image && image.length > 0 ? [...image] : undefined;
}

/**
 * The URL as a person reads it, for a card whose site gave no title: host and
 * path, without the scheme, `www.`, query string, fragment or trailing slash.
 * `https://www.example.com/a/b-c/?utm_source=x#top` reads `example.com/a/b-c`.
 * Undefined for an unparseable URL, so the caller falls back to the raw string.
 */
function readableUrl(url: string): string | undefined {
  try {
    const parsed = new URL(url);
    const path = parsed.pathname.replace(/\/+$/, '');
    return `${parsed.hostname.replace(/^www\./, '')}${path}`;
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
  author,
  coverFill = false,
  pending = false,
  onPress,
  style,
}) => {
  const { colors } = useTheme();

  const { displaySiteName, displayTitle } = useMemo(() => {
    const host = hostnameOf(url);
    const displayTitle = title ?? readableUrl(url) ?? url;
    const displaySiteName = siteName ?? host;
    return {
      // A bare origin has the host for both: say it once, not twice.
      displaySiteName: displaySiteName === displayTitle ? undefined : displaySiteName,
      displayTitle,
    };
  }, [url, siteName, title]);

  const cover = useMemo(() => coverSource(image), [image]);
  // The slot is held while the preview is pending: it will most likely bring one.
  const hasCoverSlot = Boolean(cover) || pending;
  // Stable across re-renders and rendition lists alike: recycled list cells
  // must not flash the previous card's image while the next one loads.
  const coverKey = typeof cover === 'string' ? cover : cover?.[0]?.uri;

  const handlePress = useCallback(() => {
    if (onPress) {
      onPress();
      return;
    }
    // No explicit handler: open the page outside the app (a new tab, the
    // in-app browser). A URL nothing can open does nothing.
    openExternal(url);
  }, [onPress, url]);

  return (
    <Card
      appearance="outline"
      radius="radius-20"
      clipContent
      contentStyle={coverFill ? { flex: 1 } : undefined}
      style={style}
      onPress={handlePress}
      accessibilityRole="link"
      accessibilityLabel={displayTitle}
    >
      {hasCoverSlot ? (
        <Image
          source={cover ?? null}
          recyclingKey={coverKey}
          contentFit="cover"
          cachePolicy="memory-disk"
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

      <View style={hasCoverSlot ? [styles.content, styles.articleContent] : styles.content}>
        {displaySiteName ? (
          <Text
            variant="caption-1-medium"
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
            variant="body-2-regular"
            numberOfLines={2}
            style={[styles.description, { color: colors.textSecondary }]}
          >
            {description}
          </Text>
        ) : null}

        {author ? (
          <Text
            variant="caption-1-medium"
            numberOfLines={1}
            style={[styles.author, { color: colors.textSecondary }]}
          >
            {author}
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
  articleContent: {
    minHeight: ARTICLE_TEXT_MIN_HEIGHT,
  },
  // `p-3` — four-sided, which is what keeps the last line clear of the card's
  // 20px corner radius. Flush against the border, the description read as
  // spilling past the rounded corner.
  content: {
    padding: space.md,
  },
  // `caption-1-medium` (12/16), uppercase and tracked wide.
  siteName: {
    textTransform: 'uppercase',
    letterSpacing: SITE_NAME_LETTER_SPACING,
  },
  // `headline-semibold`'s 22 line and weight at the 15px size step.
  title: {
    ...TYPE_SCALE['headline-semibold'],
    fontSize: fontSize.md,
    marginTop: space.xs,
  },
  // `body-2-regular` (13/18).
  description: {
    marginTop: space.xs,
  },
  // `caption-1-medium`: the byline, a quiet footer under the text it credits.
  author: {
    marginTop: space.xs,
  },
});

export const LinkPreviewCard = memo(LinkPreviewCardComponent);
LinkPreviewCard.displayName = 'LinkPreviewCard';
