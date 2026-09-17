import React, { memo, useMemo } from 'react';
import { Pressable, View } from 'react-native';

import { AvatarPresence } from '../chat-indicators/AvatarPresence';
import { bloomShadowStyle } from '../design-tokens/shadows';
import { useInteractionState } from '../hooks/use-interaction-state';
import { RiPhoneFill } from '../icons/remix/RiPhoneFill';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { CallControlButton } from './CallControls';
import { CallEndGlyph } from './glyphs';
import { CALL_UI_RADIUS, INCOMING_CALL_LABELS, resolveCallPaint } from './shared';
import type { IncomingCallBannerProps } from './types';

/**
 * `IncomingCallBanner`: the call arriving while the app is open.
 *
 *   a card, not a stage — it sits IN the app, so it takes the ordinary theme
 *   surface and flips with the mode like every other card
 *   44 avatar with presence · name (`headline-semibold`) over
 *   "Incoming video call" · decline (red) · accept (green), both 40px circles
 *
 * The two round buttons are SIBLINGS of the banner's own press target, never
 * nested inside it: a button inside a button is one hit area on web and two
 * announcements on native, and the one time it matters is the one time the
 * user cannot look at the screen.
 */

function IncomingCallBannerComponent({
  name,
  avatar,
  avatarVariant,
  mode = 'voice',
  subtitle,
  status,
  onAccept,
  onDecline,
  onPress,
  labels,
  accentColor,
  style,
  testID,
}: IncomingCallBannerProps) {
  const theme = useTheme();
  const paint = useMemo(() => resolveCallPaint(theme, accentColor), [theme, accentColor]);
  const { state: hovered, onIn, onOut } = useInteractionState();
  const l = { ...INCOMING_CALL_LABELS, ...labels };
  const line = subtitle ?? (mode === 'video' ? l.video : l.voice);

  const body = (
    <>
      <AvatarPresence
        source={avatar}
        variant={avatarVariant}
        name={name}
        size={44}
        status={status}
        presenceRingColor={paint.surfaceRaised}
      />
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <Text variant="headline-semibold" numberOfLines={1} style={{ color: paint.text }}>
          {name}
        </Text>
        <Text
          variant="body-2-regular"
          numberOfLines={1}
          style={{ color: paint.textSecondary }}
          testID={testID ? `${testID}-subtitle` : undefined}
        >
          {line}
        </Text>
      </View>
    </>
  );

  const shell = {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
    flex: 1,
    minWidth: 0,
    borderRadius: CALL_UI_RADIUS.card - 4,
    backgroundColor: hovered && onPress !== undefined ? paint.rowSelected : 'transparent',
    paddingTop: 4,
    paddingRight: 4,
    paddingBottom: 4,
    paddingLeft: 4,
  };

  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          borderRadius: CALL_UI_RADIUS.card,
          borderWidth: 1,
          borderColor: paint.border,
          backgroundColor: paint.surfaceRaised,
          paddingTop: 10,
          paddingRight: 10,
          paddingBottom: 10,
          paddingLeft: 10,
          ...bloomShadowStyle('m'),
        },
        style,
      ]}
      testID={testID}
    >
      {onPress === undefined ? (
        <View style={shell}>{body}</View>
      ) : (
        <Pressable
          role="button"
          accessibilityLabel={`${name} — ${line}`}
          onPress={onPress}
          onHoverIn={onIn}
          onHoverOut={onOut}
          style={shell}
          testID={testID ? `${testID}-open` : undefined}
        >
          {body}
        </Pressable>
      )}
      {onDecline === undefined ? null : (
        <CallControlButton
          icon={CallEndGlyph}
          label={l.decline}
          tone="end"
          size="small"
          onPress={onDecline}
          testID={testID ? `${testID}-decline` : undefined}
        />
      )}
      {onAccept === undefined ? null : (
        <CallControlButton
          icon={RiPhoneFill}
          label={l.accept}
          tone="accept"
          size="small"
          onPress={onAccept}
          testID={testID ? `${testID}-accept` : undefined}
        />
      )}
    </View>
  );
}

export const IncomingCallBanner = memo(IncomingCallBannerComponent);
IncomingCallBanner.displayName = 'IncomingCallBanner';
