import React, { memo } from 'react';
import { Pressable, View } from 'react-native';

import { UnreadBadge } from '../chat-indicators/UnreadBadge';
import { RiArrowDownLine } from '../icons/remix/RiArrowDownLine';
import { RiAtLine } from '../icons/remix/RiAtLine';
import type { WebCssStyle } from '../styles/web-view-style';
import { CHAT_SCREEN_LABELS, useChatScreenPaint } from './shared';
import type {
  ChatIconComponent,
  JumpToMentionButtonProps,
  ScrollToBottomButtonProps,
} from './types';

/**
 * The shared body of the two round jump buttons.
 *
 * `visible={false}` renders NOTHING. Keeping a faded button mounted would leave
 * a focusable control in the tab order that nobody can see, and a screen reader
 * announcing "Scroll to latest messages" for a transcript already at the bottom
 * is worse than silence. There is no entrance animation for the same reason
 * nothing else in Bloom scales on press: the button appearing IS the signal.
 *
 * The badge sits ABOVE the circle rather than inside it, and it carries its own
 * accessible name (`UnreadBadge` composes "3 unread messages"), so the count is
 * announced without the button's name having to be rewritten per count.
 */
function RoundJumpButton({
  visible = true,
  count = 0,
  badgeMax = 99,
  icon: Icon,
  onPress,
  accessibilityLabel,
  size = 44,
  style,
  testID,
}: {
  visible?: boolean;
  count?: number;
  badgeMax?: number;
  icon: ChatIconComponent;
  onPress?: () => void;
  accessibilityLabel: string;
  size?: number;
  style?: ScrollToBottomButtonProps['style'];
  testID?: string;
}) {
  const paint = useChatScreenPaint();
  if (!visible) return null;

  const circle: WebCssStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: paint.floatingSurface,
    borderWidth: 1,
    borderColor: paint.floatingBorder,
    boxShadow: paint.floatingShadow,
  };

  return (
    <View testID={testID} style={[{ alignItems: 'center' }, style]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        onPress={onPress}
        style={circle}
        testID={testID ? `${testID}-button` : undefined}
      >
        <Icon width={22} height={22} fill={paint.textSecondary} />
      </Pressable>
      {count > 0 ? (
        <View
          pointerEvents="none"
          style={{ position: 'absolute', top: -6, alignSelf: 'center' }}
          testID={testID ? `${testID}-badge` : undefined}
        >
          <UnreadBadge count={count} max={badgeMax} size="small" />
        </View>
      ) : null}
    </View>
  );
}

/** The round "back to the newest message" button, with its unread tally. */
function ScrollToBottomButtonComponent({
  visible = true,
  unreadCount = 0,
  badgeMax,
  onPress,
  accessibilityLabel = CHAT_SCREEN_LABELS.scrollToBottom,
  size,
  style,
  testID,
}: ScrollToBottomButtonProps) {
  return (
    <RoundJumpButton
      visible={visible}
      count={unreadCount}
      badgeMax={badgeMax}
      icon={RiArrowDownLine}
      onPress={onPress}
      accessibilityLabel={accessibilityLabel}
      size={size}
      style={style}
      testID={testID}
    />
  );
}

/**
 * The `@` companion: the same button for the mentions you have not read. It is a
 * SEPARATE control rather than a mode of the one above, because "newest" and
 * "the message that named me" are different destinations and a user scrolled
 * far up wants both offered at once.
 */
function JumpToMentionButtonComponent({
  visible = true,
  count = 0,
  badgeMax,
  onPress,
  accessibilityLabel = CHAT_SCREEN_LABELS.jumpToMention,
  size,
  style,
  testID,
}: JumpToMentionButtonProps) {
  return (
    <RoundJumpButton
      visible={visible}
      count={count}
      badgeMax={badgeMax}
      icon={RiAtLine}
      onPress={onPress}
      accessibilityLabel={accessibilityLabel}
      size={size}
      style={style}
      testID={testID}
    />
  );
}

export const ScrollToBottomButton = memo(ScrollToBottomButtonComponent);
ScrollToBottomButton.displayName = 'ScrollToBottomButton';

export const JumpToMentionButton = memo(JumpToMentionButtonComponent);
JumpToMentionButton.displayName = 'JumpToMentionButton';
