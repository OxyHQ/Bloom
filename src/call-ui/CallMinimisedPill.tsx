import React, { memo, useMemo } from 'react';
import { Pressable, View } from 'react-native';

import { bloomShadowStyle } from '../design-tokens/shadows';
import { useInteractionState } from '../hooks/use-interaction-state';
import { RiMicLine } from '../icons/remix/RiMicLine';
import { RiMicOffFill } from '../icons/remix/RiMicOffFill';
import { RiPhoneFill } from '../icons/remix/RiPhoneFill';
import { RiVideoOnLine } from '../icons/remix/RiVideoOnLine';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { CallControlButton } from './CallControls';
import { CallEndGlyph } from './glyphs';
import { CALL_CONTROL_LABELS, resolveCallPaint } from './shared';
import type { CallMinimisedPillProps } from './types';

/**
 * `CallMinimisedPill`: the call while you are doing something else.
 *
 *   48 tall, full pill, the stage's own fill so it reads as the same call
 *   glyph   a handset, or a camera for a video call
 *   line    the name (one line, truncating) over the timer in TABULAR figures —
 *           proportional digits make a running clock jitter sideways, which is
 *           the one thing a pill parked over someone's content must not do
 *   muted   a struck-through mic in the negative colour, drawn only while muted
 *   end     a 32px red circle
 *
 * It does NOT drag itself. Position is the app's: it knows the safe areas, the
 * keyboard and what is underneath, and a component that moves itself inside a
 * layout it cannot see ends up under a tab bar. Pass `style` with the offsets
 * (or an animated one), and the pill stays a pill.
 */

const HEIGHT = 48;
const PILL_MIN_WIDTH = 184;
const GLYPH = 18;

function CallMinimisedPillComponent({
  name,
  duration,
  statusText,
  mode = 'voice',
  muted = false,
  onMutedChange,
  onExpand,
  onEndCall,
  accentColor,
  labels,
  style,
  testID,
}: CallMinimisedPillProps) {
  const theme = useTheme();
  const paint = useMemo(() => resolveCallPaint(theme, accentColor), [theme, accentColor]);
  const { state: hovered, onIn, onOut } = useInteractionState();
  const l = { ...CALL_CONTROL_LABELS, ...labels };
  const expandLabel = labels?.expand ?? (name === undefined ? 'Return to call' : `Return to call with ${name}`);
  const ModeGlyph = mode === 'video' ? RiVideoOnLine : RiPhoneFill;
  const line = statusText !== undefined && statusText !== '' ? statusText : duration;

  const body = (
    <>
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 16,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: paint.control,
        }}
      >
        <ModeGlyph width={GLYPH} height={GLYPH} fill={paint.onStage} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        {name === undefined ? null : (
          <Text variant="body-2-medium" numberOfLines={1} style={{ color: paint.onStage }}>
            {name}
          </Text>
        )}
        {line === undefined ? null : (
          <Text
            variant="caption-1-regular"
            numberOfLines={1}
            style={{ color: paint.onStageMuted, fontVariant: ['tabular-nums'] }}
            testID={testID ? `${testID}-timer` : undefined}
          >
            {line}
          </Text>
        )}
      </View>
      {muted && onMutedChange === undefined ? (
        <RiMicOffFill
          width={16}
          height={16}
          fill={paint.negativeOnStage}
          testID={testID ? `${testID}-muted` : undefined}
        />
      ) : null}
    </>
  );

  const shell = {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
    minHeight: HEIGHT,
    // A floor, not a width. The two lines are laid out by the SHELL rather than
    // by their own content: react-native-web gives a `numberOfLines` text
    // `max-width: 100%`, and inside a shrink-to-fit column that percentage is
    // circular — the column ends up the width of the FIRST line and truncates
    // the second. Measured: "Reconnecting…" clipped under a 90px "Nour Haddad".
    minWidth: PILL_MIN_WIDTH,
    paddingTop: 8,
    paddingRight: 8,
    paddingBottom: 8,
    paddingLeft: 8,
    borderRadius: HEIGHT / 2,
    backgroundColor: hovered ? paint.controlHover : paint.stage,
    borderWidth: 1,
    borderColor: paint.pipBorder,
    ...bloomShadowStyle('m'),
  };

  return (
    <View style={[{ flexDirection: 'row', alignSelf: 'flex-start' }, style]} testID={testID}>
      {onExpand === undefined ? (
        <View style={shell}>{body}</View>
      ) : (
        <Pressable
          role="button"
          accessibilityLabel={expandLabel}
          onPress={onExpand}
          onHoverIn={onIn}
          onHoverOut={onOut}
          style={shell}
          testID={testID ? `${testID}-expand` : undefined}
        >
          {body}
        </Pressable>
      )}
      {onMutedChange === undefined && onEndCall === undefined ? null : (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginLeft: 6 }}>
          {onMutedChange === undefined ? null : (
            <CallControlButton
              icon={RiMicLine}
              activeIcon={RiMicOffFill}
              label={muted ? l.unmute : l.mute}
              active={muted}
              size="small"
              accentColor={accentColor}
              onPress={() => onMutedChange(!muted)}
              testID={testID ? `${testID}-mute` : undefined}
            />
          )}
          {onEndCall === undefined ? null : (
            <CallControlButton
              icon={CallEndGlyph}
              label={l.endCall}
              tone="end"
              size="small"
              accentColor={accentColor}
              onPress={onEndCall}
              testID={testID ? `${testID}-end` : undefined}
            />
          )}
        </View>
      )}
    </View>
  );
}

export const CallMinimisedPill = memo(CallMinimisedPillComponent);
CallMinimisedPill.displayName = 'CallMinimisedPill';
