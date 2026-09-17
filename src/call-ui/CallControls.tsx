import React, { memo, useMemo } from 'react';
import { Pressable, View } from 'react-native';

import { useInteractionState } from '../hooks/use-interaction-state';
import { RiCameraSwitchLine } from '../icons/remix/RiCameraSwitchLine';
import { RiCastLine } from '../icons/remix/RiCastLine';
import { RiMicLine } from '../icons/remix/RiMicLine';
import { RiMicOffLine } from '../icons/remix/RiMicOffLine';
import { RiUserAddLine } from '../icons/remix/RiUserAddLine';
import { RiVideoOffLine } from '../icons/remix/RiVideoOffLine';
import { RiVideoOnLine } from '../icons/remix/RiVideoOnLine';
import { RiVolumeDownLine } from '../icons/remix/RiVolumeDownLine';
import { RiVolumeUpLine } from '../icons/remix/RiVolumeUpLine';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import {
  CALL_CONTROL_GEOMETRY,
  CALL_CONTROL_LABELS,
  CALL_CONTROL_ORDER,
  resolveCallPaint,
  type CallPaint,
} from './shared';
import { CallEndGlyph } from './glyphs';
import type { CallControlButtonProps, CallControlKey, CallControlsProps } from './types';
import { DISABLED_OPACITY } from '../styles/tokens';

/**
 * `CallControlButton`: one round control on a call stage.
 *
 *   rest      a raised wash of the stage (16% of the on-stage white)
 *   hover     26% — colour only, no scale; a control bar that grows under the
 *             pointer is a moving target on the one screen you cannot re-aim on
 *   active    the wash INVERTS: white fill, dark glyph. A toggle that is "on"
 *             has to be readable over a moving video frame, and an accent tint
 *             is not, because the frame behind it is any colour at all
 *   end       the negative ramp, always; `accept` the success ramp
 *
 * `active` also decides the ACCESSIBILITY shape. Passing it makes the button a
 * toggle — `aria-pressed` for web and `accessibilityState.selected` for native,
 * both spellings, because react-native-web reads only the first and React
 * Native has no concept of the second. Leaving it undefined makes a plain
 * action button: "flip camera" is not a state, and a button that reports
 * `aria-pressed="false"` forever is announcing one it does not have.
 *
 * The glyph is the whole button, so `label` is required — it is the accessible
 * name whether or not `showLabel` draws it.
 */

function CallControlButtonComponent({
  icon: Icon,
  activeIcon,
  label,
  active,
  tone = 'default',
  size = 'large',
  disabled = false,
  onPress,
  showLabel = false,
  badge,
  accentColor,
  style,
  testID,
}: CallControlButtonProps) {
  const theme = useTheme();
  const paint = useMemo(() => resolveCallPaint(theme, accentColor), [theme, accentColor]);
  const { state: hovered, onIn, onOut } = useInteractionState();
  const geometry = CALL_CONTROL_GEOMETRY[size];
  const Glyph = active === true && activeIcon !== undefined ? activeIcon : Icon;

  const { background, foreground } = resolveControlColors(paint, tone, active === true, hovered);

  return (
    <View style={[{ alignItems: 'center', gap: 6 }, style]}>
      <Pressable
        role="button"
        accessibilityLabel={label}
        aria-pressed={active}
        accessibilityState={active === undefined ? { disabled } : { selected: active, disabled }}
        aria-disabled={disabled || undefined}
        disabled={disabled}
        onPress={onPress}
        onHoverIn={onIn}
        onHoverOut={onOut}
        testID={testID}
        style={{
          width: geometry.size,
          height: geometry.size,
          borderRadius: geometry.size / 2,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: background,
          opacity: disabled ? DISABLED_OPACITY : 1,
        }}
      >
        <Glyph width={geometry.glyph} height={geometry.glyph} fill={foreground} />
        {badge === undefined ? null : (
          <View style={{ position: 'absolute', top: -2, right: -2 }}>{badge}</View>
        )}
      </Pressable>
      {showLabel ? (
        <Text
          variant="caption-2-medium"
          numberOfLines={1}
          style={{ color: paint.onStageMuted, maxWidth: geometry.size + 24, textAlign: 'center' }}
        >
          {label}
        </Text>
      ) : null}
    </View>
  );
}

function resolveControlColors(
  paint: CallPaint,
  tone: CallControlButtonProps['tone'],
  active: boolean,
  hovered: boolean,
): { background: string; foreground: string } {
  if (tone === 'end') {
    return { background: hovered ? paint.endHover : paint.end, foreground: paint.onEnd };
  }
  if (tone === 'accept') {
    return { background: hovered ? paint.acceptHover : paint.accept, foreground: paint.onAccept };
  }
  if (active) {
    return { background: paint.controlActive, foreground: paint.onControlActive };
  }
  return {
    background: hovered ? paint.controlHover : paint.control,
    foreground: paint.onStage,
  };
}

export const CallControlButton = memo(CallControlButtonComponent);
CallControlButton.displayName = 'CallControlButton';

/**
 * `CallControls`: the row at the foot of a call.
 *
 * A control appears when you hand it a HANDLER. There is no `mode` prop and no
 * `show*` booleans: a voice call passes `onMutedChange` and `onSpeakerChange`,
 * a video call adds `onVideoChange` and `onFlipCamera`, and the bar is whatever
 * those add up to. The alternative — a list of what to show, kept in sync with
 * a list of what to do — is two sources of truth for one row, and the failure
 * is a button that does nothing.
 *
 * `controls` reorders and narrows that set; a key in it with no handler is
 * still skipped, so it can never put a dead button back.
 *
 * The end button is last, always, and it is the one control that is not a
 * toggle.
 */

function CallControlsComponent({
  muted = false,
  onMutedChange,
  speaker = false,
  onSpeakerChange,
  videoOn = false,
  onVideoChange,
  onFlipCamera,
  screenSharing = false,
  onScreenShareChange,
  onAddParticipant,
  onEndCall,
  controls,
  size = 'large',
  disabled = false,
  showLabels = false,
  labels,
  accentColor,
  children,
  style,
  testID,
}: CallControlsProps) {
  const l = useMemo(() => ({ ...CALL_CONTROL_LABELS, ...labels }), [labels]);
  const geometry = CALL_CONTROL_GEOMETRY[size];

  const byKey: Partial<Record<CallControlKey, CallControlButtonProps>> = {
    mute:
      onMutedChange === undefined
        ? undefined
        : {
            icon: RiMicLine,
            activeIcon: RiMicOffLine,
            label: muted ? l.unmute : l.mute,
            active: muted,
            onPress: () => onMutedChange(!muted),
          },
    video:
      onVideoChange === undefined
        ? undefined
        : {
            // `active` is "the camera is OFF", so the toggled-on state is the
            // struck-through glyph — the same shape as mute, where the loud
            // state is the one that stops sending.
            icon: RiVideoOnLine,
            activeIcon: RiVideoOffLine,
            label: videoOn ? l.videoOff : l.videoOn,
            active: !videoOn,
            onPress: () => onVideoChange(!videoOn),
          },
    speaker:
      onSpeakerChange === undefined
        ? undefined
        : {
            icon: RiVolumeDownLine,
            activeIcon: RiVolumeUpLine,
            label: speaker ? l.speakerOff : l.speakerOn,
            active: speaker,
            onPress: () => onSpeakerChange(!speaker),
          },
    screenShare:
      onScreenShareChange === undefined
        ? undefined
        : {
            icon: RiCastLine,
            label: screenSharing ? l.screenShareOff : l.screenShareOn,
            active: screenSharing,
            onPress: () => onScreenShareChange(!screenSharing),
          },
    flipCamera:
      onFlipCamera === undefined
        ? undefined
        : { icon: RiCameraSwitchLine, label: l.flipCamera, onPress: onFlipCamera },
    addParticipant:
      onAddParticipant === undefined
        ? undefined
        : { icon: RiUserAddLine, label: l.addParticipant, onPress: onAddParticipant },
  };

  const order = controls ?? CALL_CONTROL_ORDER;
  const buttons = order
    .map((key) => [key, byKey[key]] as const)
    .filter((entry): entry is readonly [CallControlKey, CallControlButtonProps] => entry[1] !== undefined);

  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'flex-start',
          justifyContent: 'center',
          flexWrap: 'wrap',
          gap: geometry.gap,
        },
        style,
      ]}
      testID={testID}
    >
      {buttons.map(([key, props]) => (
        <CallControlButton
          key={key}
          {...props}
          size={size}
          disabled={disabled}
          showLabel={showLabels}
          accentColor={accentColor}
          testID={testID ? `${testID}-${key}` : undefined}
        />
      ))}
      {children}
      {onEndCall === undefined ? null : (
        <CallControlButton
          icon={CallEndGlyph}
          label={l.endCall}
          tone="end"
          size={size}
          disabled={disabled}
          showLabel={showLabels}
          accentColor={accentColor}
          onPress={onEndCall}
          testID={testID ? `${testID}-end` : undefined}
        />
      )}
    </View>
  );
}

export const CallControls = memo(CallControlsComponent);
CallControls.displayName = 'CallControls';
