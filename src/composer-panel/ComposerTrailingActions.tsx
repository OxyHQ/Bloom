import React, { type ReactNode } from 'react';
import { View } from 'react-native';

import { MicButton, SendButton, StopButton } from './ComposerControls';
import { isComposerEmpty, type ComposerPalette } from './shared';
import type { ComposerPanelAttachment, ComposerVoiceState } from './types';

interface ComposerTrailingActionsProps {
  palette: ComposerPalette;
  voice: ComposerVoiceState;
  onVoiceChange: (voice: ComposerVoiceState) => void;
  text: string;
  attachments?: ReadonlyArray<ComposerPanelAttachment>;
  busy: boolean;
  disabled: boolean;
  onStop?: () => void;
  onSubmit: () => void;
  emptyAction?: ReactNode;
  labels: { voice: string; transcribing: string; send: string; stop: string };
  /** Drawn behind the mic inside its own box (the pill's frosted chip). */
  micBackdrop?: ReactNode;
}

/**
 * The mic and what sits where send would be, shared by `ComposerPanel` and `ComposerPill`.
 *
 * What the trailing control is, in the order the states rank: stop wins (a turn in flight is the
 * one thing a person must reach, and `StopButton` takes no `disabled`); then the host's
 * `emptyAction` while there is nothing to send; otherwise send.
 */
export function ComposerTrailingActions({
  palette,
  voice,
  onVoiceChange,
  text,
  attachments,
  busy,
  disabled,
  onStop,
  onSubmit,
  emptyAction,
  labels,
  micBackdrop,
}: ComposerTrailingActionsProps) {
  const mic = (
    <MicButton
      state={voice}
      onToggle={() => onVoiceChange(voice === 'recording' ? 'idle' : 'recording')}
      label={labels.voice}
      transcribingLabel={labels.transcribing}
      palette={palette}
    />
  );
  return (
    <>
      {micBackdrop ? (
        <View style={{ position: 'relative' }}>
          {micBackdrop}
          {mic}
        </View>
      ) : (
        mic
      )}
      {busy && onStop ? (
        <StopButton onPress={onStop} label={labels.stop} />
      ) : emptyAction !== undefined && isComposerEmpty(text, attachments) ? (
        emptyAction
      ) : (
        <SendButton disabled={disabled} onPress={onSubmit} label={labels.send} />
      )}
    </>
  );
}
