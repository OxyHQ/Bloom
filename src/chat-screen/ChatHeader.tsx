import { PageHeader } from '../page-header/PageHeader';
import { useBloomAppearance } from '../appearance';
import { memo } from 'react';
import { View } from 'react-native';

import { Button } from '../button';
import { AvatarPresence } from '../chat-indicators/AvatarPresence';
import { PresenceDot } from '../chat-indicators/PresenceDot';
import { TypingDots } from '../chat-indicators/TypingDots';
import { useMeasuredSizeClass } from '../hooks/use-width-class';
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
  formatSelectedCount,
  IS_NATIVE,
  useChatScreenPaint,
  type ChatScreenPaint,
} from './shared';
import type { ChatHeaderMarker, ChatHeaderProps, ChatIconComponent } from './types';
import { useCommonMessages } from '../locale/common-messages';
import { useMessages } from '../locale/messages';
import { CHAT_SCREEN_MESSAGES } from './messages';

const CHAT_HEADER_WIDTH_THRESHOLDS = [CHAT_COMPACT_BREAKPOINT] as const;

const MARKER_ICON: Record<ChatHeaderMarker, ChatIconComponent> = {
  verified: RiVerifiedBadgeFill,
  bot: RiRobot2Line,
  channel: RiMegaphoneLine,
};

/** The marker's tint: only `verified` earns the accent. */
function markerColor(marker: ChatHeaderMarker, paint: ChatScreenPaint): string {
  return marker === 'verified' ? paint.accentColor : paint.textSecondary;
}

/** Conversation actions inherit the common PageHeader control appearance. */
function HeaderIconButton({
  icon: Icon,
  label,
  onPress,
  tint,
  size: sizeProp,
  testID,
}: {
  icon: ChatIconComponent;
  label: string;
  onPress: () => void;
  tint: string;
  size?: 'sm' | 'md';
  testID?: string;
}) {
  const { size: inheritedSize } = useBloomAppearance(
    { size: sizeProp },
    { size: 'md', tone: 'neutral' },
  );
  const size = inheritedSize;
  return (
    <Button
      size={size}
      iconOnly
      icon={<Icon width={size === 'sm' ? 18 : 20} height={size === 'sm' ? 18 : 20} fill={tint} />}
      accessibilityLabel={label}
      onPress={onPress}
      testID={testID}
      tone="neutral"
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
 * Compact (a back button by default) follows this header's
 * measured width against `CHAT_COMPACT_BREAKPOINT`. The back button follows the
 * same width on web and is always on for native, where there is no list pane
 * beside the conversation. `showBack` remains the caller's explicit choice.
 */
function ChatHeaderComponent(props: ChatHeaderProps) {
  const paint = useChatScreenPaint();
  const { width, onLayout } = useMeasuredSizeClass(CHAT_HEADER_WIDTH_THRESHOLDS);
  const { messages } = useMessages(CHAT_SCREEN_MESSAGES);
  const common = useCommonMessages();
  const {
    title,
    marker,
    markerLabel,
    status,
    statusTone = 'muted',
    typingLabel,
    connecting = false,
    connectingLabel = messages.connecting,
    avatar,
    avatarSource,
    avatarName,
    presence,
    presenceLabel,
    avatarSize = 40,
    onPressBack,
    showBack,
    backLabel,
    backCount,
    titleAlign = 'start',
    titleLayout = 'inline',
    titleAppearance = 'plain',
    accessory,
    onPressHeader,
    openInfoLabel,
    onPressCall,
    onPressVideoCall,
    onPressSearch,
    onPressMore,
    callLabel = messages.call,
    videoCallLabel = messages.videoCall,
    searchLabel = messages.searchInConversation,
    moreLabel = common.moreOptions,
    renderMore,
    actions,
    selectionCount = 0,
    onClearSelection,
    onForward,
    onDelete,
    onCopy,
    onPin,
    clearSelectionLabel = messages.clearSelection,
    forwardLabel = messages.forward,
    deleteLabel = common.delete,
    copyLabel = common.copy,
    pinLabel = messages.pin,
    selectionActions,
    formatSelectionCount = (count: number) => formatSelectedCount(count, messages),
    compact: compactProp,
    divider = true,
    presentation = 'floating',
    style,
    testID,
  } = props;

  const compact = compactProp ?? width < CHAT_COMPACT_BREAKPOINT;
  // ---- Selection mode ----------------------------------------------------
  if (selectionCount > 0) {
    return (
      <View
        onLayout={onLayout}
        testID={testID ? `${testID}-measure` : undefined}
        style={{ width: '100%' }}
      >
        <PageHeader
          testID={testID}
          style={style}
          title={formatSelectionCount(selectionCount)}
          onBack={null}
          leading={
            onClearSelection ? (
              <HeaderIconButton
                icon={RiCloseLine}
                label={clearSelectionLabel}
                onPress={onClearSelection}
                tint={paint.text}
              />
            ) : null
          }
          actions={
            selectionActions ?? (
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
            )
          }
          presentation={presentation}
          border={divider ? 'always' : 'none'}
          safeArea={false}
          sticky={false}
        />
      </View>
    );
  }

  // ---- Identity ----------------------------------------------------------
  const MarkerIcon = marker ? MARKER_ICON[marker] : null;
  const resolvedMarkerLabel = marker ? (markerLabel ?? messages[marker]) : undefined;

  const titleContent = (
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
  );
  const statusContent = (
    <>
      {connecting ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <PresenceDot status="idle" size="sm" ringWidth={0} accessibilityLabel="" />
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
    </>
  );

  // Native has no list pane beside the conversation, so back is its only way out at any width.
  const backVisible = showBack ?? (Boolean(onPressBack) && (IS_NATIVE || compact));

  return (
    <View
      onLayout={onLayout}
      testID={testID ? `${testID}-measure` : undefined}
      style={{ width: '100%' }}
    >
      <PageHeader
        testID={testID}
        style={style}
        title={titleContent}
        subtitle={statusContent}
        titleVisual={
          avatar ?? (
            <AvatarPresence
              source={avatarSource ?? undefined}
              name={avatarName ?? title}
              size={avatarSize}
              status={presence}
              presenceLabel={presenceLabel}
              presenceRingColor={paint.surface}
            />
          )
        }
        titleAlign={titleAlign}
        titleLayout={titleLayout}
        titleAppearance={titleAppearance}
        onPressTitle={onPressHeader}
        titleAccessibilityLabel={openInfoLabel ?? title}
        onBack={backVisible ? (onPressBack ?? null) : null}
        backLabel={backLabel}
        backCount={backCount}
        accessory={accessory}
        actions={
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
            {renderMore ? (
              renderMore()
            ) : onPressMore ? (
              <HeaderIconButton
                icon={RiMore2Fill}
                label={moreLabel}
                onPress={onPressMore}
                tint={paint.textSecondary}
              />
            ) : null}
            {actions}
          </View>
        }
        presentation={presentation}
        border={divider ? 'always' : 'none'}
        safeArea={false}
        sticky={false}
      />
    </View>
  );
}

export const ChatHeader = memo(ChatHeaderComponent);
ChatHeader.displayName = 'ChatHeader';
