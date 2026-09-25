import React, { memo, useEffect, useRef, useState } from 'react';
import { Image, Pressable, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { mixColor } from '../button/shared';
import { RiErrorWarningLine } from '../icons/remix/RiErrorWarningLine';
import { RiRefreshLine } from '../icons/remix/RiRefreshLine';
import { Text } from '../typography';
import type { WebCssStyle } from '../styles/web-view-style';
import {
  ATTACHMENT_KIND_ICONS,
  EASE_OUT_QUINT,
  TILE,
  TILE_RADIUS,
  TILE_RING,
  TILE_RING_LENGTH,
  type ComposerPalette,
} from './shared';
import type { ComposerPanelAttachment } from './types';
import { dataHook, IS_WEB } from './web-hooks';

const QUINT = Easing.bezier(...EASE_OUT_QUINT);
const TILE_MS = 280;

/** Tailwind `ease-out`, 300ms fades on the tile. */
const fade = (property: string): WebCssStyle =>
  IS_WEB
    ? {
        transitionProperty: property,
        transitionDuration: '300ms',
        transitionTimingFunction: 'cubic-bezier(0, 0, 0.2, 1)',
      }
    : {};

/** `CloseButton size="2xs"`: 16px disc, 6.8px X at a 1.6px stroke. */
function TileDismiss({
  label,
  onPress,
  overImage,
  visible,
  palette,
}: {
  label: string;
  onPress: () => void;
  overImage: boolean;
  visible: boolean;
  palette: ComposerPalette;
}) {
  const [hovered, setHovered] = useState(false);
  const glyph = 6.8;
  const inset = 0.57;
  // Over a photo the glyph stays white on a frosted white/50 disc; over the plain
  // tile it is the secondary icon, text-primary on hover, on tertiary/50.
  const color = overImage ? '#ffffff' : hovered ? palette.text : palette.iconSecondary;
  const style: WebCssStyle = {
    position: 'absolute',
    top: 3,
    left: 35,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: overImage ? 'rgba(255, 255, 255, 0.5)' : mixColor(palette.surface, palette.tertiary, 0.5),
    opacity: visible ? 1 : 0,
    pointerEvents: visible ? 'auto' : 'none',
    cursor: 'pointer',
    '--bloom-composer-ring': palette.focusRing,
    ...(IS_WEB
      ? {
          filter: visible ? 'blur(0px)' : 'blur(3px)',
          backdropFilter: overImage ? 'blur(2px)' : undefined,
          transitionProperty: 'opacity, filter, color',
          transitionDuration: '300ms',
          transitionTimingFunction: 'cubic-bezier(0, 0, 0.2, 1)',
        }
      : {}),
  };
  return (
    <Pressable
      {...dataHook('bloomComposerControl', 'offset')}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityElementsHidden={!visible}
      importantForAccessibility={visible ? 'auto' : 'no-hide-descendants'}
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      hitSlop={6}
      style={style}>
      <Svg width={glyph} height={glyph} viewBox={`0 0 ${glyph} ${glyph}`} fill="none">
        <Path d={`M${inset} ${inset}L${glyph - inset} ${glyph - inset}`} stroke={color} strokeWidth={1.6} strokeLinecap="round" />
        <Path d={`M${glyph - inset} ${inset}L${inset} ${glyph - inset}`} stroke={color} strokeWidth={1.6} strokeLinecap="round" />
      </Svg>
    </Pressable>
  );
}

/**
 * A failed tile's retry: a 24px disc on the card surface where the kind glyph
 * sits (3, 4), a 14px refresh glyph in the error foreground, text-primary on
 * hover.
 */
function TileRetry({ label, onPress, palette }: { label: string; onPress: () => void; palette: ComposerPalette }) {
  const [hovered, setHovered] = useState(false);
  const style: WebCssStyle = {
    position: 'absolute',
    top: 3,
    left: 3,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.surface,
    cursor: 'pointer',
    '--bloom-composer-ring': palette.focusRing,
  };
  return (
    <Pressable
      {...dataHook('bloomComposerControl', 'offset')}
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      hitSlop={4}
      style={style}>
      <RiRefreshLine width={14} height={14} fill={hovered ? palette.text : palette.errorText} />
    </Pressable>
  );
}

/** The upload percentage's box: top 3 / right 3, blurring out as it fades. */
function percentStyle(inFlight: boolean): WebCssStyle {
  return {
    position: 'absolute',
    top: 3,
    right: 3,
    opacity: inFlight ? 1 : 0,
    ...(IS_WEB
      ? {
          filter: inFlight ? 'blur(0px)' : 'blur(3px)',
          transitionProperty: 'opacity, filter',
          transitionDuration: '300ms',
          transitionTimingFunction: 'cubic-bezier(0, 0, 0.2, 1)',
        }
      : null),
  };
}

interface TileProps {
  attachment: ComposerPanelAttachment;
  palette: ComposerPalette;
  onRemove?: () => void;
  onRetry?: () => void;
  removeLabel: string;
  retryLabel: string;
}

/**
 * One 56px tile: the thumbnail for images,
 * otherwise a 24px glyph at (3, 4) with the name in 9/15 medium underneath at
 * (6, 36), max 44 wide. While `progress` is set the content dims to 60%, the
 * accent-400 ring draws clockwise from top-centre over the 1px border, and the
 * percentage (9/16 medium, tabular; white over a photo, accent-500 otherwise)
 * sits at top 3 / right 3; once landed it blurs out as the dismiss blurs in on
 * the same spot.
 *
 * A FAILED tile (`error`) drops the ring and percentage and fills with the
 * error subtle surface under an error-foreground border: the warning glyph (or
 * the retry button) at (3, 4) and the message in 9/11 medium, two lines at
 * most, from (5, 30). The dismiss shows as on a landed tile.
 */
export const AttachmentTile = memo(function AttachmentTile({
  attachment,
  palette,
  onRemove,
  onRetry,
  removeLabel,
  retryLabel,
}: TileProps) {
  const { error } = attachment;
  const failed = !!error;
  const progress = failed ? undefined : attachment.progress;
  const inFlight = progress !== undefined;
  const image = attachment.kind === 'image' ? attachment.src : undefined;
  const dash = inFlight && progress < 100 ? (Math.max(0, progress) / 100) * TILE_RING_LENGTH : TILE_RING_LENGTH + 2;
  const KindIcon = attachment.kind === 'image' ? null : ATTACHMENT_KIND_ICONS[attachment.kind];

  return (
    <View
      accessibilityLabel={failed ? `${attachment.name}: ${error}` : attachment.name}
      {...(IS_WEB ? { title: failed ? `${attachment.name}: ${error}` : attachment.name } : {})}
      style={{
        position: 'relative',
        width: TILE,
        height: TILE,
        flexShrink: 0,
        borderRadius: TILE_RADIUS,
        borderWidth: 1,
        borderColor: failed ? palette.errorText : palette.tileBorder,
      }}>
      {image ? (
        <View
          style={[
            { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: inFlight ? 0.6 : 1 },
            fade('opacity'),
          ]}>
        <Image
          source={{ uri: image }}
          accessibilityLabel={attachment.name}
          resizeMode="cover"
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: TILE_RADIUS - 1 }}
        />
        </View>
      ) : (
        <View
          style={[
            { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: inFlight ? 0.6 : 1 },
            fade('opacity'),
          ]}>
          <View style={{ position: 'absolute', top: 4, left: 3, width: 24, height: 24 }}>
            {attachment.icon ?? (KindIcon ? <KindIcon width={24} height={24} fill={palette.iconSecondary} /> : null)}
          </View>
          <Text
            numberOfLines={1}
            style={{
              position: 'absolute',
              top: 36,
              left: 6,
              maxWidth: 44,
              // 9px has no type-ramp step; spelled out literally.
              fontSize: 9,
              lineHeight: 15,
              fontWeight: '500',
              letterSpacing: 0.2,
              color: palette.textSecondary,
            }}>
            {attachment.name}
          </Text>
        </View>
      )}

      {failed ? (
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderRadius: TILE_RADIUS - 1,
            backgroundColor: palette.errorSurface,
          }}>
          {onRetry ? null : (
            <View style={{ position: 'absolute', top: 4, left: 3, width: 24, height: 24, alignItems: 'center', justifyContent: 'center' }}>
              <RiErrorWarningLine width={20} height={20} fill={palette.errorText} />
            </View>
          )}
          <Text
            numberOfLines={2}
            style={{
              position: 'absolute',
              top: 30,
              left: 5,
              right: 5,
              // 9px has no type-ramp step; spelled out literally.
              fontSize: 9,
              lineHeight: 11,
              fontWeight: '500',
              color: palette.errorText,
            }}>
            {error}
          </Text>
          {onRetry ? <TileRetry label={`${retryLabel} ${attachment.name}`} onPress={onRetry} palette={palette} /> : null}
        </View>
      ) : null}

      {/* Upload ring over the border: the svg spans the border box. */}
      <View
        pointerEvents="none"
        {...dataHook('bloomComposerTileRing')}
        style={[
          { position: 'absolute', top: -1, left: -1, width: TILE, height: TILE, opacity: inFlight ? 1 : 0 },
          fade('opacity'),
        ]}>
        <Svg width={TILE} height={TILE} viewBox={`0 0 ${TILE} ${TILE}`}>
          <Path
            d={TILE_RING}
            fill="none"
            stroke={palette.accent400}
            strokeWidth={2}
            strokeLinecap="round"
            strokeDasharray={`${dash} ${TILE_RING_LENGTH * 2}`}
          />
        </Svg>
      </View>

      <View pointerEvents="none" style={percentStyle(inFlight)}>
        <Text
          aria-hidden
          importantForAccessibility="no"
          style={{
            fontSize: 9,
            lineHeight: 16,
            fontWeight: '500',
            fontVariant: ['tabular-nums'],
            color: image ? '#ffffff' : palette.accent500,
          }}>
          {`${inFlight ? progress : 100}%`}
        </Text>
      </View>

      {onRemove ? (
        <TileDismiss
          label={`${removeLabel} ${attachment.name}`}
          onPress={onRemove}
          overImage={!!image}
          visible={!inFlight}
          palette={palette}
        />
      ) : null}
    </View>
  );
});

/** A tile scaling and blurring in on mount, and out again before it unmounts. */
function PresenceTile({
  leaving,
  onLeft,
  children,
}: {
  leaving: boolean;
  onLeft: () => void;
  children: React.ReactNode;
}) {
  const reducedMotion = useReducedMotion();
  const progress = useSharedValue(reducedMotion ? 1 : 0);
  const onLeftRef = useRef(onLeft);
  onLeftRef.current = onLeft;

  useEffect(() => {
    if (leaving) {
      if (reducedMotion) {
        onLeftRef.current();
        return;
      }
      progress.value = withTiming(0, { duration: TILE_MS, easing: QUINT });
      const timer = setTimeout(() => onLeftRef.current(), TILE_MS);
      return () => clearTimeout(timer);
    }
    progress.value = reducedMotion ? 1 : withTiming(1, { duration: TILE_MS, easing: QUINT });
    return undefined;
  }, [leaving, reducedMotion, progress]);

  const style = useAnimatedStyle(
    () => ({
      opacity: progress.value,
      transform: [{ scale: 0.8 + 0.2 * progress.value }],
      ...(IS_WEB ? { filter: progress.value >= 1 ? 'none' : `blur(${4 * (1 - progress.value)}px)` } : null),
    }),
    [progress],
  );
  return <Animated.View style={style}>{children}</Animated.View>;
}

interface StripProps {
  attachments: ReadonlyArray<ComposerPanelAttachment>;
  palette: ComposerPalette;
  onRemove?: (id: string) => void;
  onRetry?: (id: string) => void;
  removeLabel: string;
  retryLabel: string;
}

/**
 * The tile row: 8 apart, wrapping. Tiles
 * scale 0.8 → 1, fade and un-blur on arrival over 280ms `cubic-bezier(0.22, 1,
 * 0.36, 1)`, and play it backwards on dismissal before leaving the row.
 */
export function AttachmentStrip({ attachments, palette, onRemove, onRetry, removeLabel, retryLabel }: StripProps) {
  const [leaving, setLeaving] = useState<ReadonlyArray<ComposerPanelAttachment>>([]);
  const previous = useRef(attachments);

  useEffect(() => {
    const nextIds = new Set(attachments.map((a) => a.id));
    const gone = previous.current.filter((a) => !nextIds.has(a.id));
    previous.current = attachments;
    if (gone.length > 0) {
      setLeaving((current) => [...current.filter((a) => !nextIds.has(a.id)), ...gone]);
    }
  }, [attachments]);

  // Leaving tiles keep their slot: rendered in the order they last held.
  const rendered: Array<{ attachment: ComposerPanelAttachment; leaving: boolean }> = attachments.map((attachment) => ({
    attachment,
    leaving: false,
  }));
  for (const gone of leaving) {
    if (rendered.some((entry) => entry.attachment.id === gone.id)) continue;
    rendered.push({ attachment: gone, leaving: true });
  }

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start', gap: 8 }}>
      {rendered.map(({ attachment, leaving: isLeaving }) => (
        <PresenceTile
          key={attachment.id}
          leaving={isLeaving}
          onLeft={() => setLeaving((current) => current.filter((a) => a.id !== attachment.id))}>
          <AttachmentTile
            attachment={attachment}
            palette={palette}
            removeLabel={removeLabel}
            retryLabel={retryLabel}
            onRemove={onRemove && !isLeaving ? () => onRemove(attachment.id) : undefined}
            onRetry={onRetry && !isLeaving ? () => onRetry(attachment.id) : undefined}
          />
        </PresenceTile>
      ))}
    </View>
  );
}
