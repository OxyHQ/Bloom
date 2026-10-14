import React from 'react';

import { Button } from '../button';
import { RiChat3Line } from '../icons/remix/RiChat3Line';
import { RiMicLine } from '../icons/remix/RiMicLine';
import { RiMicOffLine } from '../icons/remix/RiMicOffLine';
import { RiPauseFill } from '../icons/remix/RiPauseFill';
import { RiPlayFill } from '../icons/remix/RiPlayFill';
import { RiStopFill } from '../icons/remix/RiStopFill';
import { useMessages } from '../locale/messages';
import { StyledView } from '../styles/styled-primitives';
import { VOICE_MESSAGES } from './messages';
import type { VoiceControlsProps } from './types';

/**
 * The control row of a voice session: type instead, mute, pause and end, each
 * present only when its handler is given.
 *
 * Mute and pause are toggles: their NAME is the action ("Mute microphone") and
 * `pressed` carries the state, so a screen reader says "Mute microphone,
 * pressed" rather than a label that flips under it. Only the glyph changes
 * with the state. Both work only while the session is live; ending it and
 * typing instead stay available so the user is never stuck in a failed session.
 */
export function VoiceControls({
  state = 'listening',
  muted = false,
  onMutedChange,
  paused = false,
  onPausedChange,
  onEnd,
  onTypeInstead,
  disabled = false,
  size = 'lg',
  leading,
  trailing,
  className,
  style,
  ref,
  testID,
}: VoiceControlsProps) {
  const { messages } = useMessages(VOICE_MESSAGES);
  const live = state !== 'idle' && state !== 'error';
  const id = (part: string) => (testID ? `${testID}-${part}` : undefined);

  return (
    <StyledView
      ref={ref}
      role="toolbar"
      aria-label={messages.controls}
      className={className}
      testID={testID}
      style={[
        { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
        style,
      ]}
    >
      {leading}
      {onTypeInstead ? (
        <Button
          iconOnly
          icon={RiChat3Line}
          appearance="subtle"
          tone="neutral"
          size={size}
          accessibilityLabel={messages.typeInstead}
          disabled={disabled}
          onPress={() => onTypeInstead()}
          testID={id('type')}
        />
      ) : null}
      {onMutedChange ? (
        <Button
          iconOnly
          icon={muted ? RiMicOffLine : RiMicLine}
          appearance="subtle"
          tone="neutral"
          size={size}
          accessibilityLabel={messages.mute}
          pressed={muted}
          disabled={disabled || !live}
          onPress={() => onMutedChange(!muted)}
          testID={id('mute')}
        />
      ) : null}
      {onPausedChange ? (
        <Button
          iconOnly
          icon={paused ? RiPlayFill : RiPauseFill}
          appearance="subtle"
          tone="neutral"
          size={size}
          accessibilityLabel={messages.pause}
          pressed={paused}
          disabled={disabled || !live}
          onPress={() => onPausedChange(!paused)}
          testID={id('pause')}
        />
      ) : null}
      {onEnd ? (
        <Button
          iconOnly
          icon={RiStopFill}
          appearance="solid"
          tone="danger"
          size={size}
          accessibilityLabel={messages.end}
          disabled={disabled}
          onPress={() => onEnd()}
          testID={id('end')}
        />
      ) : null}
      {trailing}
    </StyledView>
  );
}
