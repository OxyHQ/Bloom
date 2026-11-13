import { pointerEventsStyles } from '../styles/pointer-events';
import { useContext } from 'react';
import { BloomAppearanceContext } from '../appearance/context';
import type React from 'react';
import { memo, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { View, StyleSheet, Pressable, Platform } from 'react-native';
import type { PressableStateCallbackType, TextStyle } from 'react-native';
import { imageSourcesKey } from './source-key';

import { useTheme } from '../theme/use-theme';
import { useMessages } from '../locale/messages';
import { useImageResolver } from '../image-resolver/context';
import { isImageUrl } from '../image-resolver/is-image-url';
import { Z_INDEX } from '../styles/z-index';
import { useAvatarPlaceholder } from './context';
import { AVATAR_MESSAGES } from './messages';
import { LiveBadge } from './LiveBadge';
import { AvatarRing } from './AvatarRing';
import { CharacterFace } from './CharacterFace';
import { accountName, pickAccountCharacter } from './account';
import { tryResolveAvatarCharacter } from '../agent-avatar/character';
import { Fill as ShapeFill, Image as ShapeImage } from '../shapes';
import type { Shape, ImageSource } from '../shapes';
import type { BloomImageErrorInfo } from '../image';
import {
  canProbeImageFailure,
  classifyImageFailure,
  probeImageFailure,
} from '../image/image-failure';
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
      <View style={[StyleSheet.absoluteFill, pointerEventsStyles.none]}>
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
            <ShapeImage source={DEFAULT_AVATAR_IMAGE} shape={shape} size={size} alt={alt} />
          ))}
      </View>
    </View>
  );
}

/** Only a caller observing primary failures needs duplicate/unmount protection. */
function ObservedAvatarImage({
  onError,
  onImageError,
  ...image
}: React.ComponentProps<typeof ShapeImage> & { onImageError: () => void }) {
  const request = useRef({ mounted: false, reported: false });
  useLayoutEffect(() => {
    request.current.mounted = true;
    return () => {
      request.current.mounted = false;
    };
  }, []);
  return (
    <ShapeImage
      {...image}
      onError={(error) => {
        if (!request.current.mounted || request.current.reported) return;
        request.current.reported = true;
        // Queue fallback before notifying the caller, even if it throws or rerenders.
        onError?.(error);
        onImageError();
      }}
    />
  );
}

/**
 * The wait before each new request for a primary photo that failed transiently.
 * Its length is the budget: two more requests, 2 s and then 8 s after a failure.
 */
export const AVATAR_PHOTO_RETRY_DELAYS_MS = [2_000, 8_000] as const;

type PhotoStage = 'primary' | 'fallback' | 'placeholder';

interface PhotoState {
  stage: PhotoStage;
  /** Requests of the primary photo made before the current one. */
  attempt: number;
  /** A failed primary is asked for again: known transient, or a web failure to probe. */
  retry?: 'transient' | 'unknown';
}

function primaryUri(source: ImageSource | undefined): string | undefined {
  return source && typeof source === 'object' && 'uri' in source ? source.uri : undefined;
}

/**
 * Waits out a transiently failed primary, then requests it again. Mounted only
 * while such a retry is due, so a photo that loads allocates nothing for it.
 * A web failure (`unknown`: the browser hides the status) is retried only once a
 * `HEAD` says it was transient, so a missing photo is never requested again.
 */
function AvatarPhotoRetry({
  uri,
  kind,
  attempt,
  setPhoto,
}: {
  uri: string | undefined;
  kind: 'transient' | 'unknown';
  attempt: number;
  setPhoto: React.Dispatch<React.SetStateAction<PhotoState>>;
}) {
  useEffect(() => {
    const delay = AVATAR_PHOTO_RETRY_DELAYS_MS[attempt];
    if (delay === undefined) return;
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const schedule = () => {
      timer = setTimeout(
        () =>
          setPhoto((current) =>
            current.retry && current.attempt === attempt
              ? { stage: 'primary', attempt: attempt + 1 }
              : current,
          ),
        delay,
      );
    };
    if (kind === 'transient') schedule();
    else if (canProbeImageFailure(uri))
      void probeImageFailure(uri, controller.signal).then((verdict) => {
        if (verdict === 'transient' && !controller.signal.aborted) schedule();
      });
    return () => {
      controller.abort();
      if (timer) clearTimeout(timer);
    };
  }, [uri, kind, attempt, setPhoto]);
  return null;
}

/**
 * Keyed by resolved source values: a new request starts the stages over. A
 * primary that fails transiently shows the next stage at once and is requested
 * again after {@link AVATAR_PHOTO_RETRY_DELAYS_MS}; a 404 is never re-requested.
 */
function AvatarImageContent({
  primarySource,
  fallbackSource,
  onImageError,
  ...placeholder
}: React.ComponentProps<typeof ShapeFallback> & {
  primarySource?: ImageSource;
  fallbackSource?: ImageSource;
  onImageError?: () => void;
}) {
  const [photo, setPhoto] = useState<PhotoState>(() => ({
    stage: primarySource ? 'primary' : fallbackSource ? 'fallback' : 'placeholder',
    attempt: 0,
  }));
  const { stage, attempt, retry } = photo;
  const uri = primaryUri(primarySource);
  const source =
    stage === 'primary' ? primarySource : stage === 'fallback' ? fallbackSource : undefined;
  const pendingRetry =
    retry && stage !== 'primary' ? (
      <AvatarPhotoRetry uri={uri} kind={retry} attempt={attempt} setPhoto={setPhoto} />
    ) : null;
  if (!source)
    return (
      <>
        <ShapeFallback {...placeholder} />
        {pendingRetry}
      </>
    );
  const image = {
    source,
    shape: placeholder.shape,
    size: placeholder.size,
    alt: placeholder.alt,
    onError: ({ error }: BloomImageErrorInfo) =>
      setPhoto((current) => {
        if (current.stage !== stage || current.attempt !== attempt) return current;
        if (stage !== 'primary') return { ...current, stage: 'placeholder' };
        const kind = classifyImageFailure(error);
        const retriable =
          attempt < AVATAR_PHOTO_RETRY_DELAYS_MS.length &&
          (kind === 'transient' || (kind === 'unknown' && canProbeImageFailure(uri)));
        return {
          stage: fallbackSource ? 'fallback' : 'placeholder',
          attempt,
          ...(retriable ? { retry: kind } : {}),
        };
      }),
  };
  // The caller hears about the first failure of a photo only; a retry is Avatar's.
  return (
    <>
      {stage === 'primary' && onImageError && attempt === 0 ? (
        <ObservedAvatarImage key={stage} {...image} onImageError={onImageError} />
      ) : (
        <ShapeImage key={`${stage}:${attempt}`} {...image} />
      )}
      {pendingRetry}
    </>
  );
}

function avatarPressStyle({ pressed }: PressableStateCallbackType) {
  return pressed ? styles.pressed : undefined;
}

const AvatarComponent: React.FC<AvatarProps> = ({
  source,
  uri,
  variant = 'thumb',
  fallbackSource,
  onImageError,
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
  name: nameProp,
  account,
  character,
  characterStill,
  motion,
  activity,
  reactionKey,
  workingKey,
  onPress,
  live = false,
  hideLiveBadge = false,
  liveLabel: liveLabelProp,
  liveColor,
  ring,
  testID,
}) => {
  const theme = useTheme();
  const { messages } = useMessages(AVATAR_MESSAGES);
  const liveLabel = liveLabelProp ?? messages.live;
  const placeholderConfig = useAvatarPlaceholder();
  const scope = useContext(BloomAppearanceContext);
  const size = resolveAvatarSize(sizeProp ?? scope.size);
  const name = nameProp ?? accountName(account);
  const hasName = typeof name === 'string' && name.trim().length > 0;
  const hasInitials = typeof initials === 'string' && initials.trim().length > 0;
  // The fallback text: explicit `initials` > the first letter of `name`.
  const fallbackText = hasInitials ? initials.trim() : hasName ? getInitial(name) : undefined;
  // The tint: explicit `color` > deterministic from `name` > neutral.
  const tint = useMemo(
    () =>
      resolveAvatarTint(
        theme,
        color ?? (hasName && !hasInitials ? avatarTintForName(name) : 'neutral'),
      ),
    [theme, color, hasName, hasInitials, name],
  );
  // Priority: explicit placeholderColor > the tint. A caller's own colour gets
  // a white letter (Bloom cannot know its contrast) unless a tint is also named.
  const fallbackColor = placeholderColor || tint.background;
  const fallbackTextColor = placeholderColor && !color ? '#FFFFFF' : tint.foreground;
  // With fallback text we render it instead of invoking the default
  // placeholder-context icon. Explicit placeholderIcon still wins.
  const resolvedPlaceholderIcon =
    placeholderIcon ?? (fallbackText ? undefined : placeholderConfig?.icon?.(size * 0.6));

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
  // An explicit `source`/`uri` wins over the account's own image.
  const sourceValue = source ?? (uri ? undefined : account?.avatar);
  const resolvedUri =
    typeof sourceValue === 'string'
      ? isImageUrl(sourceValue)
        ? sourceValue
        : imageResolver?.(sourceValue, variant)
      : sourceValue != null
        ? undefined
        : uri;

  const resolvedImageSource = useMemo(() => {
    if (sourceValue != null && typeof sourceValue !== 'string') return sourceValue;
    return undefined;
  }, [sourceValue]);

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

  // Resolution order: character, then image, then initials.
  // An invalid stored character resolves to nothing, which sends this avatar to its image.
  // A bot account's character is painted in the account's colour: a new object per call, so the
  // memo keys are what it is made of, not the object.
  const accountKind = account?.kind;
  const accountCharacter = account?.character;
  const accountColor = account?.color;
  const resolvedCharacter = useMemo(
    () =>
      tryResolveAvatarCharacter(
        pickAccountCharacter({
          character,
          account: { kind: accountKind, character: accountCharacter, color: accountColor },
        }),
      ),
    [character, accountKind, accountCharacter, accountColor],
  );
  const placeholderProps = {
    shape,
    size,
    alt,
    fallbackColor,
    icon: resolvedPlaceholderIcon,
    text: fallbackText,
    textColor: fallbackTextColor,
  };

  const avatarBox = (
    <View style={[styles.avatarBox, SIZE_TRANSITION, { width: size, height: size }]}>
      {resolvedCharacter ? (
        <CharacterFace
          character={resolvedCharacter}
          still={characterStill}
          size={size}
          motion={motion}
          activity={activity}
          reactionKey={reactionKey}
          workingKey={workingKey}
          alt={alt}
          name={hasName ? name : undefined}
          placeholder={<AvatarImageContent {...placeholderProps} />}
        />
      ) : (
        <AvatarImageContent
          key={imageSourcesKey(primarySource, fallbackSource)}
          primarySource={primarySource}
          fallbackSource={fallbackSource}
          onImageError={onImageError}
          {...placeholderProps}
        />
      )}
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
    <View style={[styles.container, { width: size, height: size }, style]} testID={testID}>
      {avatarBox}
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={alt ?? (hasName ? name : undefined)}
        style={avatarPressStyle}
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
