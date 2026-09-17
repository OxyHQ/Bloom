import React, { memo, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { Avatar } from '../avatar/Avatar';
import { RiChat3Line } from '../icons/remix/RiChat3Line';
import { RiCollapseDiagonalLine } from '../icons/remix/RiCollapseDiagonalLine';
import { RiGroupLine } from '../icons/remix/RiGroupLine';
import { RiLockLine } from '../icons/remix/RiLockLine';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { CallControlButton, CallControls } from './CallControls';
import { CallMinimisedPill } from './CallMinimisedPill';
import { CallScrim, CallStageBackdrop, PictureInPicture } from './parts';
import {
  CALL_PIP_CYCLE,
  CALL_SCREEN_LABELS,
  CALL_UI_RADIUS,
  callIsLive,
  resolveCallPaint,
  resolveCallStatusLine,
} from './shared';
import type { CallScreenProps } from './types';

/**
 * `CallScreen`: the whole call, as one presentational surface.
 *
 *   voice     a 128px avatar over an accent wash (see `parts.tsx`), the name in
 *             `title-1-semibold`, the status line, then the encryption line
 *   video     `remoteVideo` fills the stage, the name and status move to a
 *             compact overlay under the top bar, and the local camera sits in a
 *             corner as a 96×140 PiP
 *   top bar   minimise · (slot) · chat · participants
 *   bottom    `CallControls`, over a scrim
 *
 * Two scrims, not a tint: chrome over a video frame has to stay legible
 * whatever the frame is doing, and darkening the whole picture to achieve that
 * throws away the thing the user is looking at.
 *
 * `status` is never read directly for the line under the name — that is
 * `resolveCallStatusLine`, which owns the precedence (a `duration` surviving
 * into `ended` is the bug it exists for).
 *
 * The PiP MOVES BY PRESS, not by drag. A drag has no keyboard and no
 * screen-reader equivalent, so pressing the PiP cycles the corners clockwise
 * and reports the new one through `onMoveLocal` — the whole 96×140 frame is
 * the target, which is also the easiest thing to hit with a thumb. An app that
 * wants a real drag gesture wraps the screen and reports the corner it landed
 * in; `localVideoCorner` is a controlled prop, so both paths drive the same
 * state.
 */

const AVATAR_SIZE = 128;
const TOP_BAR_HEIGHT = 96;
const BOTTOM_SCRIM_HEIGHT = 200;

function CallScreenComponent({
  mode = 'voice',
  name,
  subtitle,
  avatar,
  avatarVariant,
  status,
  duration,
  statusText,
  accentColor,
  encryption,
  remoteVideo,
  localVideo,
  localVideoCorner = 'top-right',
  onMoveLocal,
  localVideoWidth = 96,
  controls,
  controlsSlot,
  onMinimise,
  onOpenChat,
  onOpenParticipants,
  participantCount,
  topBarSlot,
  minimised = false,
  labels,
  children,
  style,
  testID,
}: CallScreenProps) {
  const theme = useTheme();
  const paint = useMemo(() => resolveCallPaint(theme, accentColor), [theme, accentColor]);
  const l = useMemo(() => ({ ...CALL_SCREEN_LABELS, ...labels }), [labels]);

  const line = resolveCallStatusLine({ status, duration, statusText, labels: l });
  const live = callIsLive(status);
  const onStage = mode === 'video' && remoteVideo !== undefined;

  if (minimised) {
    return (
      <CallMinimisedPill
        name={name}
        duration={duration}
        statusText={status === 'active' ? statusText : line}
        mode={mode}
        muted={controls?.muted}
        onMutedChange={controls?.onMutedChange}
        onExpand={onMinimise}
        onEndCall={controls?.onEndCall}
        accentColor={accentColor}
        style={style}
        testID={testID}
      />
    );
  }

  const identity = (
    <View style={{ alignItems: 'center', gap: 6 }}>
      <Text
        variant="title-1-semibold"
        numberOfLines={1}
        style={{ color: paint.onStage, textAlign: 'center' }}
        testID={testID ? `${testID}-name` : undefined}
      >
        {name}
      </Text>
      {subtitle === undefined ? null : (
        <Text
          variant="body-regular"
          numberOfLines={1}
          style={{ color: paint.onStageMuted, textAlign: 'center' }}
        >
          {subtitle}
        </Text>
      )}
      <Text
        variant="body-medium"
        numberOfLines={1}
        style={{ color: paint.onStageMuted, textAlign: 'center' }}
        testID={testID ? `${testID}-status` : undefined}
      >
        {line}
      </Text>
      {encryption === undefined ? null : (
        <View
          style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}
          testID={testID ? `${testID}-encryption` : undefined}
        >
          <RiLockLine width={13} height={13} fill={paint.onStageMuted} />
          {typeof encryption === 'string' ? (
            <Text variant="caption-1-regular" style={{ color: paint.onStageMuted }}>
              {encryption}
            </Text>
          ) : (
            encryption
          )}
        </View>
      )}
    </View>
  );

  return (
    <View
      style={[
        {
          flex: 1,
          minHeight: 420,
          backgroundColor: paint.stage,
          overflow: 'hidden',
          borderRadius: CALL_UI_RADIUS.stage,
        },
        style,
      ]}
      testID={testID}
    >
      {onStage ? (
        <View style={StyleSheet.absoluteFill} testID={testID ? `${testID}-remote` : undefined}>
          {remoteVideo}
        </View>
      ) : (
        <CallStageBackdrop paint={paint} />
      )}

      {onStage ? (
        <>
          <CallScrim paint={paint} edge="top" height={TOP_BAR_HEIGHT} opacity={0.68} />
          <CallScrim paint={paint} edge="bottom" height={BOTTOM_SCRIM_HEIGHT} opacity={0.78} />
        </>
      ) : null}

      {/* Top bar */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          paddingTop: 16,
          paddingRight: 16,
          paddingBottom: 8,
          paddingLeft: 16,
        }}
      >
        {onMinimise === undefined ? null : (
          <CallControlButton
            icon={RiCollapseDiagonalLine}
            label={l.minimise}
            size="small"
            accentColor={accentColor}
            onPress={onMinimise}
            testID={testID ? `${testID}-minimise` : undefined}
          />
        )}
        <View style={{ flex: 1 }}>{topBarSlot}</View>
        {onOpenChat === undefined ? null : (
          <CallControlButton
            icon={RiChat3Line}
            label={l.chat}
            size="small"
            accentColor={accentColor}
            onPress={onOpenChat}
            testID={testID ? `${testID}-chat` : undefined}
          />
        )}
        {onOpenParticipants === undefined ? null : (
          <CallControlButton
            icon={RiGroupLine}
            label={
              participantCount === undefined
                ? l.participants
                : `${l.participants} (${participantCount})`
            }
            size="small"
            accentColor={accentColor}
            onPress={onOpenParticipants}
            testID={testID ? `${testID}-participants` : undefined}
          />
        )}
      </View>

      {/* Stage */}
      {onStage ? (
        <View style={{ paddingRight: 16, paddingLeft: 16 }}>{identity}</View>
      ) : (
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            gap: 24,
            paddingRight: 24,
            paddingLeft: 24,
          }}
        >
          <Avatar
            source={avatar}
            variant={avatarVariant}
            name={name}
            size={AVATAR_SIZE}
            testID={testID ? `${testID}-avatar` : undefined}
          />
          {identity}
        </View>
      )}

      {onStage ? <View style={{ flex: 1 }} /> : null}

      {/* Local picture-in-picture */}
      {localVideo === undefined ? null : (
        <PictureInPicture
          corner={localVideoCorner}
          width={localVideoWidth}
          borderColor={paint.pipBorder}
          backgroundColor={paint.tile}
          moveLabel={onMoveLocal === undefined ? undefined : l.movePip(CALL_PIP_CYCLE[localVideoCorner])}
          onMove={
            onMoveLocal === undefined
              ? undefined
              : () => onMoveLocal(CALL_PIP_CYCLE[localVideoCorner])
          }
          hintColor={paint.onStage}
          hintBackground={paint.tilePill}
          testID={testID ? `${testID}-pip` : undefined}
        >
          {localVideo}
        </PictureInPicture>
      )}

      {children}

      {/* Controls */}
      <View style={{ paddingRight: 16, paddingBottom: 24, paddingLeft: 16, paddingTop: 8 }}>
        {controlsSlot !== undefined
          ? controlsSlot
          : controls !== undefined && live
            ? <CallControls
                {...controls}
                accentColor={controls.accentColor ?? accentColor}
                testID={testID ? `${testID}-controls` : undefined}
              />
            : null}
      </View>
    </View>
  );
}

export const CallScreen = memo(CallScreenComponent);
CallScreen.displayName = 'CallScreen';
