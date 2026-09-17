import React, { memo } from 'react';
import { Pressable, View, type GestureResponderEvent } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { useInteractionState } from '../hooks/use-interaction-state';
import { RiArrowDownCircleFill } from '../icons/remix/RiArrowDownCircleFill';
import { RiDownload2Line } from '../icons/remix/RiDownload2Line';
import { RiListUnordered } from '../icons/remix/RiListUnordered';
import { RiListView } from '../icons/remix/RiListView';
import { RiMoreFill } from '../icons/remix/RiMoreFill';
import { RiSearchLine } from '../icons/remix/RiSearchLine';
import { RiShuffleLine } from '../icons/remix/RiShuffleLine';
import { GlyphButton } from '../button';
import { LikeButton } from '../media-controls/LikeButton';
import { PlayButton } from '../media-controls/PlayButton';
import { borderRadius, DISABLED_OPACITY } from '../styles/tokens';
import type { WebCssStyle } from '../styles/web-view-style';
import { Text } from '../typography';
import { useMediaHeaderPaint } from './parts';
import { IS_WEB } from './shared';
import { clamp01 } from '../styles/clamp';
import { webDataSet as webData } from '../styles/web-data';
import type {
  DownloadButtonProps,
  FollowButtonProps,
  MediaActionBarProps,
  MediaIconButtonProps,
  MediaMoreButtonProps,
  ShuffleButtonProps,
} from './types';

/**
 * The row of controls under a media header.
 *
 *   left    PlayButton large (56) accent · shuffle · heart or outline pill ·
 *           download · more — 16 apart, each only when its handler is given
 *   right   search · list / compact view · `trailing`
 *
 * The glyph controls are 40 boxes with a muted glyph that turns the text colour
 * on hover; an active toggle is accent with a 4px dot under the glyph. Colour
 * change only — no scale.
 */

function stop(event: GestureResponderEvent) {
  if (IS_WEB) {
    event.preventDefault?.();
    event.stopPropagation?.();
  }
}

/**
 * A glyph-only control; a toggle when `pressed` is given.
 *
 * `button/GlyphButton` at this bar's 40 box (`max(40, size + 12)` — the glyph is
 * the caller's, the TARGET is never under 40) with no fill in any state, plus
 * the 4px accent dot an active toggle carries.
 */
function MediaIconButtonComponent({
  icon: Icon,
  accessibilityLabel,
  onPress,
  size = 24,
  pressed,
  color,
  disabled = false,
  style,
  testID,
  'aria-expanded': ariaExpanded,
  'aria-haspopup': ariaHaspopup,
}: MediaIconButtonProps) {
  const paint = useMediaHeaderPaint();
  const box = Math.max(40, size + 12);
  return (
    <GlyphButton
      icon={Icon}
      size={box}
      glyphSize={size}
      accessibilityLabel={accessibilityLabel}
      disabled={disabled}
      pressed={pressed}
      color={color ?? paint.textMuted}
      hoverColor={paint.text}
      activeColor={paint.accent}
      activeHoverColor={paint.accent}
      fill="transparent"
      hoverFill="transparent"
      ring={paint.ring}
      aria-expanded={ariaExpanded}
      aria-haspopup={ariaHaspopup}
      onPress={(event) => {
        stop(event);
        onPress?.();
      }}
      style={style}
      testID={testID}
      decoration={
        pressed ? (
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              bottom: 1,
              width: 4,
              height: 4,
              borderRadius: 2,
              backgroundColor: paint.accent,
            }}
          />
        ) : null
      }
    />
  );
}

export const MediaIconButton = memo(MediaIconButtonComponent);
MediaIconButton.displayName = 'MediaIconButton';

function ShuffleButtonComponent({
  shuffle,
  onShuffleChange,
  size = 28,
  accessibilityLabel = 'Shuffle',
  ...rest
}: ShuffleButtonProps) {
  return (
    <MediaIconButton
      icon={RiShuffleLine}
      size={size}
      pressed={shuffle}
      accessibilityLabel={accessibilityLabel}
      onPress={() => onShuffleChange(!shuffle)}
      {...rest}
    />
  );
}

export const ShuffleButton = memo(ShuffleButtonComponent);
ShuffleButton.displayName = 'ShuffleButton';

function MediaMoreButtonComponent({
  onPress,
  accessibilityLabel = 'More options',
  size = 28,
  ...rest
}: MediaMoreButtonProps) {
  return (
    <MediaIconButton
      icon={RiMoreFill}
      size={size}
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      {...rest}
    />
  );
}

export const MediaMoreButton = memo(MediaMoreButtonComponent);
MediaMoreButton.displayName = 'MediaMoreButton';

/**
 * Download toggle.
 *
 *   idle         outline arrow, muted
 *   downloading  a ring filling in accent around a small arrow; the ring is a
 *                `progressbar` with its own name and value
 *   downloaded   filled accent circle with the arrow
 *
 * One name in every state ("Download"); `aria-pressed` is `true` once
 * downloaded, `aria-busy` while downloading.
 */
function DownloadButtonComponent({
  state,
  progress = 0,
  onPress,
  size = 28,
  disabled = false,
  accessibilityLabel = 'Download',
  progressLabel = 'Download progress',
  style,
  testID,
}: DownloadButtonProps) {
  const paint = useMediaHeaderPaint();
  const { state: hovered, onIn, onOut } = useInteractionState();
  const box = Math.max(40, size + 12);
  const downloaded = state === 'downloaded';
  const downloading = state === 'downloading';
  const idleColor = hovered && !disabled ? paint.text : paint.textMuted;
  const root: WebCssStyle = {
    width: box,
    height: box,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: disabled ? DISABLED_OPACITY : 1,
    '--bloom-media-header-ring': paint.ring,
  };
  const stroke = 2.5;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const value = clamp01(progress);
  const inner = Math.round(size * 0.55);

  return (
    <View style={[{ alignItems: 'center', justifyContent: 'center' }, style]}>
      <Pressable
        {...webData({ bloomMediaHeaderPress: '' })}
        role="button"
        accessibilityLabel={accessibilityLabel}
        aria-pressed={downloaded}
        aria-busy={downloading || undefined}
        aria-disabled={disabled || undefined}
        accessibilityState={{ selected: downloaded, busy: downloading, disabled }}
        disabled={disabled}
        onHoverIn={onIn}
        onHoverOut={onOut}
        onPress={(event) => {
          stop(event);
          onPress();
        }}
        style={root}
        testID={testID}
      >
        <View pointerEvents="none" style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
          {downloaded ? (
            <RiArrowDownCircleFill width={size} height={size} fill={paint.accent} />
          ) : downloading ? (
            <>
              <Svg width={size} height={size} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
                <Circle cx={size / 2} cy={size / 2} r={r} stroke={paint.border} strokeWidth={stroke} fill="none" />
                <Circle
                  cx={size / 2}
                  cy={size / 2}
                  r={r}
                  stroke={paint.accent}
                  strokeWidth={stroke}
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={`${circumference} ${circumference}`}
                  strokeDashoffset={circumference * (1 - value)}
                />
              </Svg>
              <RiDownload2Line width={inner} height={inner} fill={paint.accent} />
            </>
          ) : (
            <RiDownload2Line width={size} height={size} fill={idleColor} />
          )}
        </View>
      </Pressable>
      {downloading ? (
        <View
          role="progressbar"
          accessibilityLabel={progressLabel}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(value * 100)}
          pointerEvents="none"
          style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', opacity: 0 }}
          testID={testID ? `${testID}-progress` : undefined}
        />
      ) : null}
    </View>
  );
}

export const DownloadButton = memo(DownloadButtonComponent);
DownloadButton.displayName = 'DownloadButton';

/**
 * The outline pill: "Follow" → "Following", "Save" → "Saved". A toggle with
 * one name (`label`) and `aria-pressed`.
 */
function FollowButtonComponent({
  following,
  onFollowChange,
  label = 'Follow',
  followingLabel = 'Following',
  color,
  size = 'small',
  disabled = false,
  style,
  testID,
}: FollowButtonProps) {
  const paint = useMediaHeaderPaint();
  const { state: hovered, onIn, onOut } = useInteractionState();
  const fg = color ?? paint.text;
  const active = hovered && !disabled;
  const root: WebCssStyle = {
    height: size === 'medium' ? 36 : 32,
    paddingLeft: 16,
    paddingRight: 16,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: active ? fg : color ? fg : paint.border,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: disabled ? DISABLED_OPACITY : 1,
    '--bloom-media-header-ring': paint.ring,
    ...(IS_WEB ? { transitionProperty: 'border-color', transitionDuration: '150ms' } : null),
  };
  return (
    <Pressable
      {...webData({ bloomMediaHeaderPress: '' })}
      role="button"
      accessibilityLabel={label}
      aria-pressed={following}
      aria-disabled={disabled || undefined}
      accessibilityState={{ selected: following, disabled }}
      disabled={disabled}
      onHoverIn={onIn}
      onHoverOut={onOut}
      onPress={(event) => {
        stop(event);
        onFollowChange(!following);
      }}
      style={[root, style]}
      testID={testID}
    >
      <Text variant="body-semibold" style={{ color: fg }} numberOfLines={1}>
        {following ? followingLabel : label}
      </Text>
    </Pressable>
  );
}

export const FollowButton = memo(FollowButtonComponent);
FollowButton.displayName = 'FollowButton';

function MediaActionBarComponent({
  playing,
  onPlayPress,
  playSubject,
  playDisabled,
  shuffle = false,
  onShuffleChange,
  liked = false,
  onLikedChange,
  following = false,
  onFollowChange,
  followLabel,
  followingLabel,
  download = 'idle',
  downloadProgress,
  onDownloadPress,
  onMorePress,
  more,
  onSearchPress,
  searchLabel = 'Search in playlist',
  compactViewLabel = 'Compact view',
  view = 'list',
  onViewChange,
  trailing,
  style,
  testID,
}: MediaActionBarProps) {
  const hasRight = onSearchPress || onViewChange || trailing;
  return (
    <View
      style={[{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }, style]}
      testID={testID}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1, flexWrap: 'wrap' }}>
        <PlayButton
          playing={playing}
          onPress={onPlayPress}
          size="large"
          subject={playSubject}
          disabled={playDisabled}
          style={{ marginRight: 8 }}
          testID={testID ? `${testID}-play` : undefined}
        />
        {onShuffleChange ? (
          <ShuffleButton
            shuffle={shuffle}
            onShuffleChange={onShuffleChange}
            testID={testID ? `${testID}-shuffle` : undefined}
          />
        ) : null}
        {onLikedChange ? (
          <LikeButton
            liked={liked}
            onLikedChange={onLikedChange}
            size="large"
            testID={testID ? `${testID}-like` : undefined}
          />
        ) : null}
        {onFollowChange ? (
          <FollowButton
            following={following}
            onFollowChange={onFollowChange}
            label={followLabel}
            followingLabel={followingLabel}
            style={{ marginLeft: 4, marginRight: 4 }}
            testID={testID ? `${testID}-follow` : undefined}
          />
        ) : null}
        {onDownloadPress ? (
          <DownloadButton
            state={download}
            progress={downloadProgress}
            onPress={onDownloadPress}
            testID={testID ? `${testID}-download` : undefined}
          />
        ) : null}
        {more ? (
          // A menu trigger wraps its child in an anchor that aligns itself to the
          // start; a fixed-height box keeps the slot on the row's centre line.
          <View style={{ height: 40, justifyContent: 'center' }}>{more}</View>
        ) : onMorePress ? (
          <MediaMoreButton onPress={onMorePress} testID={testID ? `${testID}-more` : undefined} />
        ) : null}
      </View>
      {hasRight ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          {onSearchPress ? (
            <MediaIconButton
              icon={RiSearchLine}
              size={20}
              accessibilityLabel={searchLabel}
              onPress={onSearchPress}
              testID={testID ? `${testID}-search` : undefined}
            />
          ) : null}
          {onViewChange ? (
            <MediaIconButton
              icon={view === 'compact' ? RiListView : RiListUnordered}
              size={20}
              accessibilityLabel={compactViewLabel}
              pressed={view === 'compact'}
              onPress={() => onViewChange(view === 'compact' ? 'list' : 'compact')}
              testID={testID ? `${testID}-view` : undefined}
            />
          ) : null}
          {trailing}
        </View>
      ) : null}
    </View>
  );
}

export const MediaActionBar = memo(MediaActionBarComponent);
MediaActionBar.displayName = 'MediaActionBar';
