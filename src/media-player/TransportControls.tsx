import React, { memo, useMemo } from 'react';
import { View } from 'react-native';

import { RiArrowGoBackLine } from '../icons/remix/RiArrowGoBackLine';
import { RiArrowGoForwardLine } from '../icons/remix/RiArrowGoForwardLine';
import { RiForward10Line } from '../icons/remix/RiForward10Line';
import { RiForward15Line } from '../icons/remix/RiForward15Line';
import { RiForward30Line } from '../icons/remix/RiForward30Line';
import { RiForward5Line } from '../icons/remix/RiForward5Line';
import { RiRepeatLine } from '../icons/remix/RiRepeatLine';
import { RiRepeatOneLine } from '../icons/remix/RiRepeatOneLine';
import { RiReplay10Line } from '../icons/remix/RiReplay10Line';
import { RiReplay15Line } from '../icons/remix/RiReplay15Line';
import { RiReplay30Line } from '../icons/remix/RiReplay30Line';
import { RiReplay5Line } from '../icons/remix/RiReplay5Line';
import { RiShuffleLine } from '../icons/remix/RiShuffleLine';
import { RiSkipBackFill } from '../icons/remix/RiSkipBackFill';
import { RiSkipForwardFill } from '../icons/remix/RiSkipForwardFill';
import { PlayButton } from '../media-controls/PlayButton';
import { useTheme } from '../theme/use-theme';
import { PlaybackSpeedMenu } from './PlaybackSpeedMenu';
import { PlayerIconButton, type PlayerGlyph } from './PlayerIconButton';
import { nextRepeatMode, TRANSPORT_GEOMETRY } from './shared';
import type { TransportControlsLabels, TransportControlsProps } from './types';

export const DEFAULT_TRANSPORT_LABELS: TransportControlsLabels = {
  shuffle: 'Shuffle',
  previous: 'Previous',
  next: 'Next',
  play: 'Play',
  pause: 'Pause',
  repeat: 'Repeat',
  repeatOne: 'Repeat one',
  skipBack: (s) => `Back ${s} seconds`,
  skipForward: (s) => `Forward ${s} seconds`,
};

const REPLAY_GLYPHS: Record<number, PlayerGlyph> = {
  5: RiReplay5Line,
  10: RiReplay10Line,
  15: RiReplay15Line,
  30: RiReplay30Line,
};
const FORWARD_GLYPHS: Record<number, PlayerGlyph> = {
  5: RiForward5Line,
  10: RiForward10Line,
  15: RiForward15Line,
  30: RiForward30Line,
};

/** The numbered skip glyph for 5 / 10 / 15 / 30 seconds; a plain curved arrow for any other count. */
export function skipGlyphFor(direction: 'back' | 'forward', seconds: number): PlayerGlyph {
  if (direction === 'back') return REPLAY_GLYPHS[seconds] ?? RiArrowGoBackLine;
  return FORWARD_GLYPHS[seconds] ?? RiArrowGoForwardLine;
}

/**
 * The transport row.
 *
 *   music     shuffle · previous · PLAY · next · repeat
 *   podcast   speed · back N · PLAY · forward N · trailing
 *
 *              play   glyph   prev/next   hit box   gap
 *   compact    32     16      20          32        8
 *   regular    48     20      24          32        16
 *   large      56     24      32          40        24
 *
 * The play button is `PlayButton` `inverse`. Previous / next rest in the text
 * colour; the toggles rest muted and turn accent with a 4px dot when on.
 * Optional buttons (shuffle, repeat, speed) keep their slot when absent, so
 * the play button stays centred.
 *
 * Repeat cycles `off` → `all` → `one`: `onRepeatChange` receives the NEXT mode.
 * It is a toggle (`aria-pressed` true for `all` and `one`) named "Repeat", or
 * "Repeat one" while repeating one — the pressed state says whether it is on,
 * the name which repeat.
 */
function TransportControlsComponent({
  playing,
  onPlayPause,
  loading,
  subject,
  variant = 'music',
  size = 'regular',
  onPrevious,
  onNext,
  previousDisabled,
  nextDisabled,
  shuffle = false,
  onShuffleChange,
  repeat = 'off',
  onRepeatChange,
  skipBackSeconds = 15,
  skipForwardSeconds = 30,
  onSkipBack,
  onSkipForward,
  playbackRate = 1,
  onPlaybackRateChange,
  trailing,
  disabled = false,
  labels: labelOverrides,
  style,
  testID,
}: TransportControlsProps) {
  const theme = useTheme();
  const labels = useMemo(() => ({ ...DEFAULT_TRANSPORT_LABELS, ...labelOverrides }), [labelOverrides]);
  const g = TRANSPORT_GEOMETRY[size];
  const id = (part: string) => (testID ? `${testID}-${part}` : undefined);
  const slot = { width: g.box, height: g.box, alignItems: 'center', justifyContent: 'center' } as const;

  const play = (
    <PlayButton
      playing={playing}
      onPress={onPlayPause}
      size={g.play}
      variant="inverse"
      loading={loading}
      disabled={disabled}
      subject={subject}
      playLabel={labels.play}
      pauseLabel={labels.pause}
      testID={id('play')}
    />
  );

  let children: React.ReactNode;
  if (variant === 'podcast') {
    children = (
      <>
        <View style={{ minWidth: g.box, height: g.box, alignItems: 'center', justifyContent: 'center' }}>
          {onPlaybackRateChange ? (
            <PlaybackSpeedMenu
              rate={playbackRate}
              onRateChange={onPlaybackRateChange}
              size={size}
              disabled={disabled}
              testID={id('speed')}
            />
          ) : null}
        </View>
        <PlayerIconButton
          icon={skipGlyphFor('back', skipBackSeconds)}
          glyph={g.skipGlyph}
          box={g.box}
          restColor={theme.colors.text}
          accessibilityLabel={labels.skipBack(skipBackSeconds)}
          onPress={onSkipBack}
          disabled={disabled || !onSkipBack}
          testID={id('skip-back')}
        />
        {play}
        <PlayerIconButton
          icon={skipGlyphFor('forward', skipForwardSeconds)}
          glyph={g.skipGlyph}
          box={g.box}
          restColor={theme.colors.text}
          accessibilityLabel={labels.skipForward(skipForwardSeconds)}
          onPress={onSkipForward}
          disabled={disabled || !onSkipForward}
          testID={id('skip-forward')}
        />
        <View style={{ minWidth: g.box, height: g.box, alignItems: 'center', justifyContent: 'center' }}>
          {trailing}
        </View>
      </>
    );
  } else {
    const repeating = repeat !== 'off';
    children = (
      <>
        <View style={slot}>
          {onShuffleChange ? (
            <PlayerIconButton
              icon={RiShuffleLine}
              glyph={g.glyph}
              box={g.box}
              pressed={shuffle}
              accessibilityLabel={labels.shuffle}
              onPress={() => onShuffleChange(!shuffle)}
              disabled={disabled}
              testID={id('shuffle')}
            />
          ) : null}
        </View>
        <PlayerIconButton
          icon={RiSkipBackFill}
          glyph={g.skipGlyph}
          box={g.box}
          restColor={theme.colors.text}
          accessibilityLabel={labels.previous}
          onPress={onPrevious}
          disabled={disabled || previousDisabled || !onPrevious}
          testID={id('previous')}
        />
        {play}
        <PlayerIconButton
          icon={RiSkipForwardFill}
          glyph={g.skipGlyph}
          box={g.box}
          restColor={theme.colors.text}
          accessibilityLabel={labels.next}
          onPress={onNext}
          disabled={disabled || nextDisabled || !onNext}
          testID={id('next')}
        />
        <View style={slot}>
          {onRepeatChange ? (
            <PlayerIconButton
              icon={repeat === 'one' ? RiRepeatOneLine : RiRepeatLine}
              glyph={g.glyph}
              box={g.box}
              pressed={repeating}
              accessibilityLabel={repeat === 'one' ? labels.repeatOne : labels.repeat}
              onPress={() => onRepeatChange(nextRepeatMode(repeat))}
              disabled={disabled}
              testID={id('repeat')}
            />
          ) : null}
        </View>
      </>
    );
  }

  return (
    <View
      style={[{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: g.gap }, style]}
      testID={testID}
    >
      {children}
    </View>
  );
}

export const TransportControls = memo(TransportControlsComponent);
TransportControls.displayName = 'TransportControls';
