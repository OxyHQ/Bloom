import React, { memo, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

import { Avatar } from '../avatar';
import { mixColor, resolveButtonRamps } from '../button/shared';
import {
  MENU_MOTION_BLUR,
  MENU_MOTION_DURATION,
  MENU_MOTION_EASING,
  MENU_MOTION_SCALE_FROM,
} from '../floating/constants';
import { resolveMenuPalette } from '../floating/menu-palette';
import { useInsideHoverCardSurface } from '../hover-card/context';
import { RiVerifiedBadgeFill } from '../icons/remix/RiVerifiedBadgeFill';
import { useImageResolver } from '../image-resolver/context';
import { SUPPORTS_NATIVE_DRIVER } from '../styles/native-driver';
import type { WebCssStyle } from '../styles/web-view-style';
import type { Theme } from '../theme/types';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import {
  USER_HOVER_CARD_CONTENT_WIDTH,
  USER_HOVER_CARD_INSET,
  USER_HOVER_CARD_WIDTH,
} from './constants';
import type { UserHoverCardProps } from './types';

/**
 * A profile hover card, built from Bloom's existing component vocabulary:
 *
 *   panel    the floating menu surface (`menu-palette.ts`): radius 16, 1px
 *            border/button/default, background/primary, `shadow-dropdown`;
 *            286 wide, p15 — 256 of inner width (`USER_HOVER_CARD_CONTENT_WIDTH`)
 *   cover    optional, full-bleed 88 tall, clipped to the panel's inner radius
 *            (15), background/tertiary under the image (the ai-profile card)
 *   avatar   48, the ported `Avatar` (initials disc when no photo); over a cover
 *            it wears a 3px ring of the panel colour and overlaps the edge by half
 *   action   pinned top-right, centred on the avatar's visible band
 *   name     headline-medium text-primary + 16px `RiVerifiedBadgeFill` accent-500
 *   handle   body-regular text-secondary, 2 under the name
 *   bio      body-regular text-primary, three lines
 *   stats    the ai-profile stat tiles: flex-1, radius 10, p10,
 *            background/secondary, value body-medium over label body-2-medium
 *            text-secondary, 8 apart
 *   rhythm   12 between blocks (the notification card's gap)
 *   motion   the menu entrance: 150ms ease-out from opacity 0 / scale 0.95 /
 *            blur 2px (web), growing from the top edge. No press scale.
 *
 *   token                        light          dark
 *   background/primary           card           neutral-800
 *   border/button/default        neutral-200    neutral-700
 *   background/secondary (tile)  neutral-100    neutral-900
 *   background/tertiary (cover)  neutral-200    neutral-700
 *   skeleton block               neutral-100    neutral-700 @60% over 800
 *   text-secondary               neutral-500    neutral-500
 */

const WIDTH = USER_HOVER_CARD_WIDTH;
const PADDING = USER_HOVER_CARD_INSET;
const AVATAR_SIZE = 48;
const AVATAR_RING = 3;
const COVER_HEIGHT = 88;
const GAP = 12;
const VERIFIED_SIZE = 16;
const RADIUS = 16;
const STAT_RADIUS = 10;

const IS_WEB = Platform.OS === 'web';
const MENU_EASING = Easing.bezier(...MENU_MOTION_EASING);

interface HoverCardPalette {
  surface: string;
  border: string;
  shadow: string;
  text: string;
  textSecondary: string;
  tile: string;
  cover: string;
  skeleton: string;
  verified: string;
}

export function resolveUserHoverCardPalette(theme: Theme): HoverCardPalette {
  const menu = resolveMenuPalette(theme);
  const { accent, neutral: n } = resolveButtonRamps(theme);
  const dark = theme.isDark;
  return {
    surface: menu.surface,
    border: menu.border,
    shadow: menu.shadow,
    text: menu.text,
    textSecondary: menu.textSecondary,
    tile: dark ? n[900] : n[100],
    cover: dark ? n[700] : n[200],
    skeleton: dark ? mixColor(n[800], n[700], 0.6) : n[100],
    verified: accent[500],
  };
}

function isUrl(value: string): boolean {
  return (
    value.startsWith('http://') ||
    value.startsWith('https://') ||
    value.startsWith('data:') ||
    value.startsWith('blob:') ||
    value.startsWith('file:')
  );
}

/** Entrance only: the card is mounted when it is shown and unmounted to hide. */
function useEntrance(enabled: boolean) {
  const reducedMotion = useReducedMotion();
  const animate = enabled && !reducedMotion;
  const progress = useRef(new Animated.Value(animate ? 0 : 1)).current;
  // Once the entrance lands the animated style is dropped, so a settled card is
  // not left on a `blur(0px)` filter layer (FloatingPanel rests on `none` too).
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    if (!animate) return;
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: MENU_MOTION_DURATION,
      easing: MENU_EASING,
      // The blur is a CSS filter and only exists on web, where there is no
      // native driver anyway.
      useNativeDriver: SUPPORTS_NATIVE_DRIVER,
    });
    animation.start((result) => {
      if (result?.finished !== false) setSettled(true);
    });
    return () => animation.stop();
    // Mount-only, like the panel's own enter.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return useMemo(() => {
    if (!animate || settled) return null;
    const style: Record<string, unknown> = {
      opacity: progress,
      transform: [
        {
          scale: progress.interpolate({
            inputRange: [0, 1],
            outputRange: [MENU_MOTION_SCALE_FROM, 1],
          }),
        },
      ],
    };
    if (IS_WEB) {
      style.filter = progress.interpolate({
        inputRange: [0, 1],
        outputRange: [`blur(${MENU_MOTION_BLUR}px)`, 'blur(0px)'],
      });
    }
    return style as Animated.WithAnimatedObject<WebCssStyle>;
  }, [animate, settled, progress]);
}

function SkeletonBlock({ style, color }: { style: ViewStyle; color: string }) {
  return <View style={[style, { backgroundColor: color }]} />;
}

const UserHoverCardComponent: React.FC<UserHoverCardProps> = ({
  avatar,
  variant,
  displayName,
  username,
  bio,
  stats,
  verified = false,
  cover,
  coverVariant,
  loading = false,
  animateIn = true,
  onPressProfile,
  action,
  badge,
  footer,
  style,
  testID,
}) => {
  const theme = useTheme();
  const palette = useMemo(() => resolveUserHoverCardPalette(theme), [theme]);
  const resolver = useImageResolver();
  // Inside a `HoverCardContent` (or `AvatarGroup`'s hover card) the floating
  // panel already IS the surface — border, background, shadow, inset — and runs
  // the same entrance and an exit. Drawing them again would put a card inside a
  // card and play the entrance twice.
  const bare = useInsideHoverCardSurface();
  const entrance = useEntrance(animateIn && !bare);

  const hasCover = typeof cover === 'string' && cover.length > 0;
  const coverUri = hasCover
    ? isUrl(cover) ? cover : resolver?.(cover, coverVariant)
    : undefined;

  const cardStyle: WebCssStyle = bare
    ? { width: USER_HOVER_CARD_CONTENT_WIDTH, maxWidth: '100%', overflow: 'visible' }
    : {
        width: WIDTH,
        paddingTop: PADDING,
        paddingBottom: PADDING,
        paddingLeft: PADDING,
        paddingRight: PADDING,
        borderRadius: RADIUS,
        borderWidth: 1,
        borderColor: palette.border,
        backgroundColor: palette.surface,
        boxShadow: palette.shadow,
        // The card clips nothing: the `footer` slot is documented as unclipped,
        // and the cover clips itself to the inner radius.
        overflow: 'visible',
        transformOrigin: 'top',
      };

  // Where the avatar's visible band sits, so the action can centre on it.
  const avatarOuter = hasCover ? AVATAR_SIZE + AVATAR_RING * 2 : AVATAR_SIZE;
  const avatarOverlap = hasCover ? avatarOuter / 2 : 0;
  const actionZone: ViewStyle = hasCover
    ? { top: COVER_HEIGHT + 6, height: avatarOuter - avatarOverlap }
    : { top: PADDING, height: AVATAR_SIZE };

  const coverView = hasCover ? (
    <View
      testID={testID ? `${testID}-cover` : undefined}
      style={[styles.cover, { backgroundColor: palette.cover }]}
    >
      {coverUri ? (
        <Image
          source={{ uri: coverUri }}
          style={styles.coverImage}
          resizeMode="cover"
          accessibilityIgnoresInvertColors
        />
      ) : null}
    </View>
  ) : null;

  const avatarView = (
    <View
      style={[
        styles.avatarWrap,
        hasCover
          ? {
              marginTop: -avatarOverlap,
              padding: AVATAR_RING,
              borderRadius: avatarOuter / 2,
              backgroundColor: palette.surface,
            }
          : null,
      ]}
    >
      {loading ? (
        <SkeletonBlock
          color={palette.skeleton}
          style={{ width: AVATAR_SIZE, height: AVATAR_SIZE, borderRadius: AVATAR_SIZE / 2 }}
        />
      ) : (
        <Avatar
          source={avatar ?? undefined}
          variant={variant}
          name={displayName}
          size={AVATAR_SIZE}
        />
      )}
    </View>
  );

  if (loading) {
    return (
      <Animated.View
        testID={testID}
        aria-busy
        accessibilityState={{ busy: true }}
        style={[cardStyle, entrance, style]}
      >
        {coverView}
        {avatarView}
        <View style={styles.identityText}>
          <SkeletonBlock color={palette.skeleton} style={styles.skeletonName} />
          <SkeletonBlock color={palette.skeleton} style={styles.skeletonHandle} />
        </View>
        <View style={styles.bio}>
          <SkeletonBlock color={palette.skeleton} style={styles.skeletonLine} />
          <SkeletonBlock color={palette.skeleton} style={styles.skeletonLineShort} />
        </View>
        <View style={styles.statsRow}>
          {[0, 1].map((key) => (
            <View key={key} style={[styles.stat, { backgroundColor: palette.tile }]}>
              <SkeletonBlock
                color={theme.isDark ? palette.skeleton : palette.cover}
                style={styles.skeletonStatValue}
              />
              <SkeletonBlock
                color={theme.isDark ? palette.skeleton : palette.cover}
                style={styles.skeletonStatLabel}
              />
            </View>
          ))}
        </View>
      </Animated.View>
    );
  }

  const identity = (
    <View>
      {avatarView}
      <View style={styles.identityText}>
        <View style={styles.nameRow}>
          <Text
            variant="headline-medium"
            numberOfLines={1}
            style={[styles.displayName, { color: palette.text }]}
          >
            {displayName}
          </Text>
          {verified && (
            <RiVerifiedBadgeFill
              fill={palette.verified}
              width={VERIFIED_SIZE}
              height={VERIFIED_SIZE}
              style={styles.verifiedBadge}
            />
          )}
        </View>
        {username || badge != null ? (
          <View style={styles.handleRow}>
            {username ? (
              <Text
                variant="body-regular"
                numberOfLines={1}
                style={[styles.username, { color: palette.textSecondary }]}
              >
                @{username}
              </Text>
            ) : null}
            {/* The badge is a fact about the ACCOUNT, not about the handle, so
                it renders even for a user with no handle to sit beside. */}
            {badge != null ? <View style={styles.badge}>{badge}</View> : null}
          </View>
        ) : null}
      </View>
    </View>
  );

  return (
    <Animated.View
      testID={testID}
      style={[cardStyle, entrance, style]}
    >
      {coverView}
      {onPressProfile ? (
        <Pressable
          onPress={onPressProfile}
          accessibilityRole="button"
          accessibilityLabel={username ? `${displayName} (@${username})` : displayName}
        >
          {identity}
        </Pressable>
      ) : (
        identity
      )}

      {/* After the identity in document order, so it paints above it; pinned
          top-right and centred on the avatar's visible band. */}
      {action != null ? (
        <View style={[styles.action, actionZone]}>{action}</View>
      ) : null}

      {bio ? (
        <Text
          variant="body-regular"
          numberOfLines={3}
          style={[styles.bio, { color: palette.text }]}
        >
          {bio}
        </Text>
      ) : null}

      {stats && stats.length > 0 ? (
        <View style={styles.statsRow}>
          {stats.map((stat) => (
            <View key={stat.label} style={[styles.stat, { backgroundColor: palette.tile }]}>
              <Text variant="body-medium" numberOfLines={1} style={{ color: palette.text }}>
                {stat.value}
              </Text>
              <Text
                variant="body-2-medium"
                numberOfLines={1}
                style={{ color: palette.textSecondary }}
              >
                {stat.label}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      {/* The consumer's own content. It is a SIBLING of the identity
          `Pressable`, not a child: nested, a press on anything in it that is not
          itself pressable would open the profile, and on web it would sit inside
          a real `<button>`, where interactive content is invalid HTML. (The
          card's accessible NAME is not at stake either way — the identity area
          has an explicit label, which wins over contents.) */}
      {footer != null ? <View style={styles.footer}>{footer}</View> : null}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  cover: {
    height: COVER_HEIGHT,
    marginTop: -PADDING,
    marginLeft: -PADDING,
    marginRight: -PADDING,
    // The panel's 16 minus its 1px border.
    borderTopLeftRadius: RADIUS - 1,
    borderTopRightRadius: RADIUS - 1,
    overflow: 'hidden',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  avatarWrap: {
    alignSelf: 'flex-start',
  },
  identityText: {
    marginTop: GAP,
    gap: 2,
    minWidth: 0,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minWidth: 0,
  },
  displayName: {
    flexShrink: 1,
  },
  verifiedBadge: {
    flexShrink: 0,
  },
  handleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  username: {
    // The handle yields to the badge rather than pushing it out of the card: a
    // long handle truncates (`numberOfLines={1}`), a marker cannot.
    flexShrink: 1,
  },
  badge: {
    flexShrink: 0,
  },
  action: {
    position: 'absolute',
    right: PADDING,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  bio: {
    marginTop: GAP,
    gap: 6,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: GAP,
  },
  stat: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
    minWidth: 0,
    alignItems: 'flex-start',
    borderRadius: STAT_RADIUS,
    paddingTop: 10,
    paddingBottom: 10,
    paddingLeft: 10,
    paddingRight: 10,
  },
  footer: {
    marginTop: GAP,
  },
  skeletonName: { width: 136, height: 16, marginTop: 3, marginBottom: 3, borderRadius: 6 },
  skeletonHandle: { width: 88, height: 14, marginTop: 3, marginBottom: 3, borderRadius: 6 },
  skeletonLine: { width: '100%', height: 14, borderRadius: 6 },
  skeletonLineShort: { width: '64%', height: 14, borderRadius: 6 },
  skeletonStatValue: { width: 40, height: 14, marginTop: 3, marginBottom: 3, borderRadius: 6 },
  skeletonStatLabel: { width: 64, height: 12, marginTop: 3, marginBottom: 3, borderRadius: 6 },
});

export const UserHoverCard = memo(UserHoverCardComponent);
UserHoverCard.displayName = 'UserHoverCard';
