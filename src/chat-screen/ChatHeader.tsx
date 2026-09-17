import React, { memo, useMemo } from 'react';
import { Pressable, useWindowDimensions, View } from 'react-native';

import { Button } from '../button';
import { AvatarPresence } from '../chat-indicators/AvatarPresence';
import { PresenceDot } from '../chat-indicators/PresenceDot';
import { TypingDots } from '../chat-indicators/TypingDots';
import { RiArrowLeftLine } from '../icons/remix/RiArrowLeftLine';
import { RiCloseLine } from '../icons/remix/RiCloseLine';
import { RiDeleteBinLine } from '../icons/remix/RiDeleteBinLine';
import { RiFileCopyLine } from '../icons/remix/RiFileCopyLine';
import { RiMegaphoneLine } from '../icons/remix/RiMegaphoneLine';
import { RiMore2Fill } from '../icons/remix/RiMore2Fill';
import { RiPhoneLine } from '../icons/remix/RiPhoneLine';
import { RiPushpinLine } from '../icons/remix/RiPushpinLine';
import { RiRobot2Line } from '../icons/remix/RiRobot2Line';
import { RiSearchLine } from '../icons/remix/RiSearchLine';
import { RiShareForwardLine } from '../icons/remix/RiShareForwardLine';
import { RiVerifiedBadgeFill } from '../icons/remix/RiVerifiedBadgeFill';
import { RiVideoOnLine } from '../icons/remix/RiVideoOnLine';
import { Text } from '../typography';
import {
  CHAT_COMPACT_BREAKPOINT,
  CHAT_HEADER_HEIGHT,
  CHAT_SCREEN_LABELS,
  formatSelectedCount,
  IS_NATIVE,
  useChatScreenPaint,
  type ChatScreenPaint,
} from './shared';
import type { ChatHeaderMarker, ChatHeaderProps, ChatIconComponent } from './types';

const MARKER_ICON: Record<ChatHeaderMarker, ChatIconComponent> = {
  verified: RiVerifiedBadgeFill,
  bot: RiRobot2Line,
  channel: RiMegaphoneLine,
};

const MARKER_LABEL: Record<ChatHeaderMarker, string> = {
  verified: CHAT_SCREEN_LABELS.verified,
  bot: CHAT_SCREEN_LABELS.bot,
  channel: CHAT_SCREEN_LABELS.channel,
};

/** The marker's tint: only `verified` earns the accent. */
function markerColor(marker: ChatHeaderMarker, paint: ChatScreenPaint): string {
  return marker === 'verified' ? paint.accentColor : paint.textSecondary;
}

/**
 * A header control: transparent, a secondary-tinted glyph, and a neutral hover
 * wash. `variant="text"` rather than `ghost` — Bloom's ghost is an accent-TINTED
 * fill, and four accent-filled circles across the top of a conversation read as
 * four calls to action beside a title that is the actual subject.
 *
 * The icon is passed as an ELEMENT, not a component: `iconOnly` tints a
 * component icon with the variant's own label colour, which for `text` is the
 * accent.
 */
function HeaderIconButton({
  icon: Icon,
  label,
  onPress,
  tint,
  size = 'medium',
  testID,
}: {
  icon: ChatIconComponent;
  label: string;
  onPress: () => void;
  tint: string;
  size?: 'small' | 'medium';
  testID?: string;
}) {
  return (
    <Button
      variant="text"
      size={size}
      iconOnly
      icon={<Icon width={size === 'small' ? 18 : 20} height={size === 'small' ? 18 : 20} fill={tint} />}
      accessibilityLabel={label}
      onPress={onPress}
      testID={testID}
    />
  );
}

/**
 * The conversation header: who you are talking to, what they are doing right
 * now, and the four things you can do about it.
 *
 * THE STATUS LINE HAS ONE WRITER AND A FIXED PRECEDENCE —
 * `connecting` > `typingLabel` > `status`. Each of the three is newer news than
 * the one under it, and a header that stacked them would claim, in one row,
 * that the socket is down AND that somebody is typing over it. Every string is a
 * PROP: nothing here reads a clock, counts a roster or decides what "recently"
 * means.
 *
 * SELECTION MODE REPLACES THE HEADER, it does not decorate it. A `selectionCount`
 * above zero removes the identity block, the status line and every
 * call/video/search control, leaving the count and the actions that operate on a
 * selection. Keeping a call button beside "3 selected" is how a selection gets
 * lost to a mis-tap.
 *
 * Compact (a back button, 12px gutters) is derived from the window against
 * `CHAT_COMPACT_BREAKPOINT`, and is always on for native — where there is no
 * list pane beside the conversation, so "back" is the only way out.
 */
function ChatHeaderComponent(props: ChatHeaderProps) {
  const paint = useChatScreenPaint();
  const { width } = useWindowDimensions();
  const {
    title,
    marker,
    markerLabel,
    status,
    statusTone = 'muted',
    typingLabel,
    connecting = false,
    connectingLabel = CHAT_SCREEN_LABELS.connecting,
    avatar,
    avatarSource,
    avatarName,
    presence,
    presenceLabel,
    avatarSize = 40,
    onPressBack,
    showBack,
    backLabel = CHAT_SCREEN_LABELS.back,
    onPressHeader,
    openInfoLabel,
    onPressCall,
    onPressVideoCall,
    onPressSearch,
    onPressMore,
    callLabel = CHAT_SCREEN_LABELS.call,
    videoCallLabel = CHAT_SCREEN_LABELS.videoCall,
    searchLabel = CHAT_SCREEN_LABELS.search,
    moreLabel = CHAT_SCREEN_LABELS.more,
    renderMore,
    actions,
    selectionCount = 0,
    onClearSelection,
    onForward,
    onDelete,
    onCopy,
    onPin,
    clearSelectionLabel = CHAT_SCREEN_LABELS.clearSelection,
    forwardLabel = CHAT_SCREEN_LABELS.forward,
    deleteLabel = CHAT_SCREEN_LABELS.delete,
    copyLabel = CHAT_SCREEN_LABELS.copy,
    pinLabel = CHAT_SCREEN_LABELS.pin,
    selectionActions,
    formatSelectionCount = formatSelectedCount,
    compact: compactProp,
    divider = true,
    style,
    testID,
  } = props;

  const compact = compactProp ?? (IS_NATIVE || width < CHAT_COMPACT_BREAKPOINT);
  const gutter = compact ? 12 : 16;

  const row = useMemo(
    () => ({
      minHeight: CHAT_HEADER_HEIGHT,
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 8,
      paddingLeft: gutter,
      paddingRight: gutter,
      paddingTop: 8,
      paddingBottom: 8,
      backgroundColor: paint.surface,
      borderBottomWidth: divider ? 1 : 0,
      borderBottomColor: paint.border,
    }),
    [divider, gutter, paint.border, paint.surface],
  );

  // ---- Selection mode ----------------------------------------------------
  if (selectionCount > 0) {
    return (
      <View testID={testID} style={[row, style]}>
        {onClearSelection ? (
          <HeaderIconButton
            icon={RiCloseLine}
            label={clearSelectionLabel}
            onPress={onClearSelection}
            tint={paint.text}
          />
        ) : null}
        <Text
          variant="headline-semibold"
          numberOfLines={1}
          accessibilityRole="header"
          style={{ flexGrow: 1, flexShrink: 1, color: paint.text }}
        >
          {formatSelectionCount(selectionCount)}
        </Text>
        {selectionActions ?? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
            {onForward ? (
              <HeaderIconButton
                icon={RiShareForwardLine}
                label={forwardLabel}
                onPress={onForward}
                tint={paint.textSecondary}
              />
            ) : null}
            {onCopy ? (
              <HeaderIconButton
                icon={RiFileCopyLine}
                label={copyLabel}
                onPress={onCopy}
                tint={paint.textSecondary}
              />
            ) : null}
            {onPin ? (
              <HeaderIconButton
                icon={RiPushpinLine}
                label={pinLabel}
                onPress={onPin}
                tint={paint.textSecondary}
              />
            ) : null}
            {onDelete ? (
              // The one control that does NOT take the secondary tint: a delete
              // repainted to match its neighbours stops reading as a delete.
              <HeaderIconButton
                icon={RiDeleteBinLine}
                label={deleteLabel}
                onPress={onDelete}
                tint={paint.destructive}
              />
            ) : null}
          </View>
        )}
      </View>
    );
  }

  // ---- Identity ----------------------------------------------------------
  const MarkerIcon = marker ? MARKER_ICON[marker] : null;
  const resolvedMarkerLabel = marker ? (markerLabel ?? MARKER_LABEL[marker]) : undefined;

  const identity = (
    <View style={{ minWidth: 0, flexShrink: 1, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      {avatar ?? (
        <AvatarPresence
          source={avatarSource ?? undefined}
          name={avatarName ?? title}
          size={avatarSize}
          status={presence}
          presenceLabel={presenceLabel}
          presenceRingColor={paint.surface}
        />
      )}
      <View style={{ minWidth: 0, flexShrink: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Text
            variant="headline-semibold"
            numberOfLines={1}
            accessibilityRole="header"
            style={{ flexShrink: 1, color: paint.text }}
          >
            {title}
          </Text>
          {MarkerIcon && marker ? (
            <View
              role={resolvedMarkerLabel ? 'img' : undefined}
              accessibilityLabel={resolvedMarkerLabel || undefined}
              aria-hidden={resolvedMarkerLabel ? undefined : true}
              accessibilityElementsHidden={!resolvedMarkerLabel}
              importantForAccessibility={resolvedMarkerLabel ? 'yes' : 'no-hide-descendants'}
              testID={testID ? `${testID}-marker` : undefined}
            >
              <MarkerIcon width={16} height={16} fill={markerColor(marker, paint)} />
            </View>
          ) : null}
        </View>
        {connecting ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <PresenceDot status="idle" size="small" ringWidth={0} accessibilityLabel="" />
            <Text
              variant="caption-1-regular"
              numberOfLines={1}
              testID={testID ? `${testID}-status` : undefined}
              style={{ flexShrink: 1, color: paint.textSecondary }}
            >
              {connectingLabel}
            </Text>
          </View>
        ) : typingLabel ? (
          <TypingDots
            label={typingLabel}
            color={paint.accentColor}
            labelStyle={{ color: paint.accentColor }}
            testID={testID ? `${testID}-status` : undefined}
          />
        ) : status ? (
          <Text
            variant="caption-1-regular"
            numberOfLines={1}
            testID={testID ? `${testID}-status` : undefined}
            style={{
              flexShrink: 1,
              color: statusTone === 'accent' ? paint.accentColor : paint.textSecondary,
            }}
          >
            {status}
          </Text>
        ) : null}
      </View>
    </View>
  );

  const backVisible = showBack ?? (Boolean(onPressBack) && compact);

  return (
    <View testID={testID} style={[row, style]}>
      {backVisible && onPressBack ? (
        <HeaderIconButton
          icon={RiArrowLeftLine}
          label={backLabel}
          onPress={onPressBack}
          tint={paint.text}
          testID={testID ? `${testID}-back` : undefined}
        />
      ) : null}

      {onPressHeader ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={openInfoLabel ?? title}
          onPress={onPressHeader}
          testID={testID ? `${testID}-identity` : undefined}
          style={{ minWidth: 0, flexGrow: 1, flexShrink: 1 }}
        >
          {identity}
        </Pressable>
      ) : (
        <View style={{ minWidth: 0, flexGrow: 1, flexShrink: 1 }}>{identity}</View>
      )}

      <View style={{ flexShrink: 0, flexDirection: 'row', alignItems: 'center', gap: 2 }}>
        {onPressCall ? (
          <HeaderIconButton
            icon={RiPhoneLine}
            label={callLabel}
            onPress={onPressCall}
            tint={paint.textSecondary}
          />
        ) : null}
        {onPressVideoCall ? (
          <HeaderIconButton
            icon={RiVideoOnLine}
            label={videoCallLabel}
            onPress={onPressVideoCall}
            tint={paint.textSecondary}
          />
        ) : null}
        {onPressSearch ? (
          <HeaderIconButton
            icon={RiSearchLine}
            label={searchLabel}
            onPress={onPressSearch}
            tint={paint.textSecondary}
          />
        ) : null}
        {renderMore
          ? renderMore()
          : onPressMore
            ? (
                <HeaderIconButton
                  icon={RiMore2Fill}
                  label={moreLabel}
                  onPress={onPressMore}
                  tint={paint.textSecondary}
                />
              )
            : null}
        {actions}
      </View>
    </View>
  );
}

export const ChatHeader = memo(ChatHeaderComponent);
ChatHeader.displayName = 'ChatHeader';
