import { useContext } from 'react';
import { BloomAppearanceContext } from '../appearance/context';
import React, { memo, useMemo, useState } from 'react';
import { View, StyleSheet, Pressable, Platform } from 'react-native';
import type { TextStyle } from 'react-native';
import { imageSourcesKey } from './source-key';

import { useTheme } from '../theme/use-theme';
import { useMessages } from '../locale/messages';
import { useInteractionState } from '../hooks/use-interaction-state';
import { useImageResolver } from '../image-resolver/context';
import { isImageUrl } from '../image-resolver/is-image-url';
import { Z_INDEX } from '../styles/z-index';
import { useAvatarPlaceholder } from './context';
import { AVATAR_MESSAGES } from './messages';
import { LiveBadge } from './LiveBadge';
import { AvatarRing } from './AvatarRing';
import { Fill as ShapeFill, Image as ShapeImage } from '../shapes';
import type { Shape, ImageSource } from '../shapes';
import { Text } from '../typography';
import type { WebCssStyle } from '../styles/web-view-style';
import {
  avatarInitialsType,
  avatarTintForName,
  getInitial,
  resolveAvatarSize,
  resolveAvatarTint,
} from './initials';
import type { AvatarProps, AvatarRingConfig } from './types';

/**
 * `transition-[width,height,font-size] duration-200 ease` — web only;
 * native has no style transitions and a size change there is a relayout.
 */
const SIZE_TRANSITION: WebCssStyle =
  Platform.OS === 'web'
    ? {
        transitionProperty: 'width, height, font-size',
        transitionDuration: '200ms',
        transitionTimingFunction: 'ease',
      }
    : {};

// Built-in default avatar image — used when no source, fallbackSource, or placeholderIcon is provided.
// Sourced from a TypeScript module that exports an inlined base64 data URI, so no
// `.jpg` asset import (and no ambient `*.jpg` module declaration) is required for
// consumers compiling Bloom's source files directly.
import DEFAULT_AVATAR_IMAGE from './default-avatar';

function ShapeFallback({
  shape,
  alt,
  size,
  fallbackColor,
  icon,
  text,
  textColor,
}: {
  shape: Shape;
  alt?: string;
  size: number;
  fallbackColor: string;
  icon?: React.ReactNode;
  text?: string;
  textColor: string;
}) {
  const initialStyle: TextStyle = {
    ...avatarInitialsType(size),
    color: textColor,
    textAlign: 'center',
    includeFontPadding: false,
  };
  return (
    <View
      style={{
        width: size,
        height: size,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <ShapeFill shape={shape} size={size} color={fallbackColor} />
      </View>
      {/* Positioned foreground paints after the absolute background on web,
          including caller SVGs whose own default position is static. */}
      <View style={{ position: 'relative', alignItems: 'center', justifyContent: 'center' }}>
        {icon ??
          (text ? (
            <Text allowFontScaling={false} numberOfLines={1} style={initialStyle}>
              {text}
            </Text>
          ) : (
            <ShapeImage
              source={DEFAULT_AVATAR_IMAGE}
              shape={shape}
              size={size}
              alt={alt}
            />
          ))}
      </View>
    </View>
  );
}

/** Keyed by resolved source values, so failed images retry only when their request changes. */
function AvatarImageContent({
  primarySource,
  fallbackSource,
  ...placeholder
}: React.ComponentProps<typeof ShapeFallback> & {
  primarySource?: ImageSource;
  fallbackSource?: ImageSource;
}) {
  const [stage, setStage] = useState<'primary' | 'fallback' | 'placeholder'>(
    primarySource ? 'primary' : fallbackSource ? 'fallback' : 'placeholder',
  );
  const source =
    stage === 'primary'
      ? primarySource
      : stage === 'fallback'
        ? fallbackSource
        : undefined;
  if (!source) return <ShapeFallback {...placeholder} />;
  return (
    <ShapeImage
      key={stage}
      source={source}
      shape={placeholder.shape}
      size={placeholder.size}
      alt={placeholder.alt}
      onError={() =>
        setStage((current) =>
          current !== stage
            ? current
            : stage === 'primary' && fallbackSource
              ? 'fallback'
              : 'placeholder',
        )
      }
    />
  );
}

const AvatarComponent: React.FC<AvatarProps> = ({
  source,
  uri,
  variant = 'thumb',
  fallbackSource,
  size: sizeProp,
  color,
  initials,
  alt,
  verified = false,
  verifiedIcon,
  shape = 'circle',
  style,
  placeholderColor,
  placeholderIcon,
  name,
  onPress,
  live = false,
  hideLiveBadge = false,
  liveLabel: liveLabelProp,
  liveColor,
  ring,
  testID,
}) => {
  // The press dip goes through the shared interaction hook rather than
  // `TouchableOpacity`'s `activeOpacity` — one mechanism across the library, and
  // the one the reduced-motion / pointer-type guards live behind.
  const {
    state: pressed,
    onIn: onPressIn,
    onOut: onPressOut,
  } = useInteractionState();
  const theme = useTheme();
  const { messages } = useMessages(AVATAR_MESSAGES);
  const liveLabel = liveLabelProp ?? messages.live;
  const placeholderConfig = useAvatarPlaceholder();
  const scope = useContext(BloomAppearanceContext);
  const size = resolveAvatarSize(sizeProp ?? scope.size);
  const hasName = typeof name === 'string' && name.trim().length > 0;
  const hasInitials =
    typeof initials === 'string' && initials.trim().length > 0;
  // The fallback text: explicit `initials` > the first letter of `name`.
  const fallbackText = hasInitials
    ? initials.trim()
    : hasName
      ? getInitial(name)
      : undefined;
  // The tint: explicit `color` > deterministic from `name` > neutral.
  const tint = useMemo(
    () =>
      resolveAvatarTint(
        theme,
        color ??
          (hasName && !hasInitials ? avatarTintForName(name) : 'neutral'),
      ),
    [theme, color, hasName, hasInitials, name],
  );
  // Priority: explicit placeholderColor > the tint. A caller's own colour gets
  // a white letter (Bloom cannot know its contrast) unless a tint is also named.
  const fallbackColor = placeholderColor || tint.background;
  const fallbackTextColor =
    placeholderColor && !color ? '#FFFFFF' : tint.foreground;
  // With fallback text we render it instead of invoking the default
  // placeholder-context icon. Explicit placeholderIcon still wins.
  const resolvedPlaceholderIcon =
    placeholderIcon ??
    (fallbackText ? undefined : placeholderConfig?.icon?.(size * 0.6));

  const imageResolver = useImageResolver();

  // Resolve source prop: string → uri, object → ImageSource.
  // A URL passes through directly (`isImageUrl`, the package's one answer to
  // "URL or id"). Non-URL strings (e.g. Oxy file IDs) are resolved via the
  // app-provided ImageResolver if available, with the requested `variant`
  // forwarded so the resolver (the single URL chokepoint) can build the right
  // rendition. `variant` defaults to `'thumb'` (see prop default) so a bare-id
  // avatar never accidentally requests the full-size original; callers wanting
  // the full image pass an explicit variant.
  // Resolve on each render: a stable resolver can read refreshed URL data.
  const resolvedUri =
    typeof source === 'string'
      ? isImageUrl(source)
        ? source
        : imageResolver?.(source, variant)
      : source != null
        ? undefined
        : uri;

  const resolvedImageSource = useMemo(() => {
    if (source != null && typeof source !== 'string') return source;
    return undefined;
  }, [source]);

  const primarySource = useMemo(
    () => (resolvedUri ? { uri: resolvedUri } : resolvedImageSource),
    [resolvedUri, resolvedImageSource],
  );

  // Resolve a SINGLE ring config shared by `live` and the public `ring` prop.
  // An explicit `ring` wins for geometry and colors; otherwise `live` derives a
  // solid theme-`negative` ring (modeled on Bluesky's live indicator). The
  // "LIVE" badge stays independently controlled by `live` / `hideLiveBadge` and
  // uses the theme `negative` color regardless of the ring's colors.
  const liveBadgeColor = liveColor ?? theme.colors.negative;
  const resolvedRing: AvatarRingConfig | undefined = ring
    ? ring
    : live
      ? { colors: liveBadgeColor, width: size > 16 ? 2 : 1 }
      : undefined;
  const ringWidth = resolvedRing?.width ?? (size > 16 ? 2 : 1);
  const showLiveBadge = live && size > 16 && !hideLiveBadge;

  const ringElement = resolvedRing ? (
    <AvatarRing
      size={size}
      shape={shape}
      colors={resolvedRing.colors}
      width={ringWidth}
      gradientDirection={resolvedRing.gradientDirection ?? 'diagonal'}
    />
  ) : null;

  const avatarBox = (
    <View
      style={[styles.avatarBox, SIZE_TRANSITION, { width: size, height: size }]}
    >
      <AvatarImageContent
        key={imageSourcesKey(primarySource, fallbackSource)}
        primarySource={primarySource}
        fallbackSource={fallbackSource}
        shape={shape}
        size={size}
        alt={alt}
        fallbackColor={fallbackColor}
        icon={resolvedPlaceholderIcon}
        text={fallbackText}
        textColor={fallbackTextColor}
      />
      {ringElement}

      {verified && verifiedIcon && (
        <View
          style={[
            styles.verifiedBadge,
            {
              width: size * 0.36,
              height: size * 0.36,
            },
          ]}
        >
          {verifiedIcon}
        </View>
      )}

      {showLiveBadge && (
        <LiveBadge
          variant={size > 32 ? 'small' : 'tiny'}
          label={liveLabel}
          backgroundColor={liveBadgeColor}
          textColor={theme.colors.negativeForeground}
        />
      )}
    </View>
  );

  const content = (
    <View
      style={[styles.container, { width: size, height: size }, style]}
      testID={testID}
    >
      {avatarBox}
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        accessibilityRole="button"
        accessibilityLabel={alt ?? (hasName ? name : undefined)}
        style={pressed ? styles.pressed : undefined}
      >
        {content}
      </Pressable>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.7,
  },
  container: {
    position: 'relative',
    overflow: 'visible',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarBox: {
    position: 'relative',
    overflow: 'visible',
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: Z_INDEX.raised,
  },
});

export const Avatar = memo(AvatarComponent);
Avatar.displayName = 'Avatar';
