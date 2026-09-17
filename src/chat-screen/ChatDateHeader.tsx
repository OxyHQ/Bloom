import React, { memo } from 'react';
import { View } from 'react-native';

import type { WebCssStyle } from '../styles/web-view-style';
import { Text } from '../typography';
import { useChatScreenPaint } from './shared';
import type { ChatDateHeaderProps } from './types';

/**
 * The date pill that hovers over the transcript.
 *
 * `label` is PRE-FORMATTED — "Today", "Yesterday", "14 March". Nothing here
 * reads a clock, and nothing here decides what "today" means in the reader's
 * timezone.
 *
 * `visible={false}` fades the pill to nothing and hides it from assistive tech
 * rather than unmounting it — unlike the jump buttons, this control is not
 * focusable, so there is no phantom tab stop to worry about, and keeping it
 * mounted stops the label re-announcing every time a scroll crosses a day
 * boundary. Hiding is `opacity`, never `display: none`: collapsing an element
 * inside a scroller is how a restored scroll offset gets clamped to 0.
 *
 * `floating` (the default) positions itself over the transcript, so the pill is
 * `pointerEvents="none"` inside a `box-none` wrapper — a strip across the top of
 * a conversation that swallowed taps would eat every press on the newest
 * messages. Both are PROPS, not style entries: react-native-web drops
 * `pointerEvents` given as a style.
 */
function ChatDateHeaderComponent({
  label,
  visible = true,
  placement = 'floating',
  offset = 8,
  style,
  textStyle,
  testID,
}: ChatDateHeaderProps) {
  const paint = useChatScreenPaint();

  const pill: WebCssStyle = {
    alignSelf: 'center',
    paddingLeft: 10,
    paddingRight: 10,
    paddingTop: 4,
    paddingBottom: 4,
    borderRadius: 999,
    backgroundColor: paint.floatingSurface,
    borderWidth: 1,
    borderColor: paint.floatingBorder,
    boxShadow: paint.floatingShadow,
    opacity: visible ? 1 : 0,
  };

  const pillNode = (
    <View
      pointerEvents="none"
      aria-hidden={visible ? undefined : true}
      accessibilityElementsHidden={!visible}
      importantForAccessibility={visible ? 'yes' : 'no-hide-descendants'}
      testID={testID ? `${testID}-pill` : undefined}
      style={pill}
    >
      <Text
        variant="caption-1-medium"
        numberOfLines={1}
        style={[{ color: paint.textSecondary }, textStyle]}
      >
        {label}
      </Text>
    </View>
  );

  if (placement === 'inline') {
    return (
      <View
        testID={testID}
        style={[{ alignItems: 'center', paddingTop: 8, paddingBottom: 8 }, style]}
      >
        {pillNode}
      </View>
    );
  }

  return (
    <View
      pointerEvents="box-none"
      testID={testID}
      style={[
        { position: 'absolute', top: offset, left: 0, right: 0, alignItems: 'center', zIndex: 1 },
        style,
      ]}
    >
      {pillNode}
    </View>
  );
}

export const ChatDateHeader = memo(ChatDateHeaderComponent);
ChatDateHeader.displayName = 'ChatDateHeader';
