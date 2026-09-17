import React, { memo, useEffect, useMemo, useRef } from 'react';
import { Pressable, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { mixColor } from '../button/shared';
import { MESSAGE_STATUS_LABELS } from '../chat-indicators';
import { webDataSet } from '../styles/web-data';
import { adoptStyleSheet } from '../styles/adopt-style-sheet';
import type { WebCssStyle } from '../styles/web-view-style';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import {
  BubbleTail,
  ForwardedLine,
  MessageText,
  MetaRow,
  ReactionRow,
  ReplyQuote,
  RetryButton,
} from './parts';
import {
  BUBBLE_PADDING_X,
  BUBBLE_PADDING_Y,
  BUBBLE_RADIUS,
  DEFAULT_MAX_WIDTH,
  DOUBLE_PRESS_MS,
  IS_WEB,
  MESSAGE_BUBBLE_CSS,
  MESSAGE_BUBBLE_STYLE_ID,
  bubbleAccessibleName,
  bubbleRadii,
  hasTail,
  resolveLabels,
  resolveMessageBubblePaint,
  senderNameColor,
  sidePaint,
} from './shared';
import { SwipeToReply } from './SwipeToReply';
import type { MessageBubbleProps } from './types';

/**
 * One message in a transcript.
 *
 *   outgoing   the theme accent fill; the on-colour is picked by CONTRAST, not
 *              assumed — `primaryForeground`, white or near-black, whichever
 *              clears AA over the accent this preset resolved to
 *   incoming   a neutral surface (the card in light mode, neutral-800 in dark)
 *              with a hairline in light mode, where a card on a near-white page
 *              has no edge of its own
 *
 * Radius 18 everywhere, except the ONE corner a run cuts: `position` is
 * `'single' | 'first' | 'middle' | 'last'` and only the last bubble of a run
 * gets the 4px corner, on its own side. That is what makes a run read as one
 * block with a single spout. `tail` draws the notch on that corner; it is off
 * by default and drawn OUTSIDE the bubble box, so turning it on re-lays out
 * nothing.
 *
 * THE META ROW TUCKS. Time, "edited", views and the delivery ticks sit at the
 * bottom-right INSIDE the bubble, on the same line as the last words when they
 * fit and on a line of their own when they do not — a wrapping flex row with an
 * `auto` left margin, which is the one spelling of that behaviour both Yoga and
 * the browser agree on. Over media with no text it becomes a translucent pill
 * (`metaOverlay`).
 *
 * States: `pending` dims, `failed` washes the fill towards the error colour and
 * offers `onRetry`, `selected` bands the whole ROW (not the bubble — selection
 * is a property of the message, and the band has to reach the avatar gutter),
 * `highlighted` flashes that same band once after a jump, `deleted` replaces
 * everything with one italic line and no meta.
 *
 * Accessibility: the bubble is ONE node with a composed name — sender, text,
 * time, and then what a sighted reader gets from colour and a tick glyph
 * ("Read", "Not sent", "Selected"). The ticks inside it are hidden
 * (`label=""`), because announcing the delivery state twice per message is the
 * cost of announcing it in words at all. With `selected` defined the bubble is
 * a TOGGLE and carries both spellings — `aria-pressed` for web,
 * `accessibilityState.selected` for native.
 *
 * Rich media is `media`, a slot: this family owns the shell, the text and the
 * metadata and never the image decoder.
 */

/** How long the jump flash stays up before it fades. */
const FLASH_HOLD_MS = 700;
const FLASH_FADE_MS = 500;

function MessageBubbleComponent({
  direction,
  position = 'single',
  text,
  children,
  media,
  metaOverlay,
  tail = false,
  senderName,
  senderColorSeed,
  senderColor,
  renderEntity,
  replyTo,
  onPressReply,
  forwardedFrom,
  editedLabel,
  time,
  status,
  channelViews,
  authorSignature,
  reactions,
  onToggleReaction,
  onAddReaction,
  pending = false,
  failed = false,
  onRetry,
  selected,
  highlighted = false,
  deleted = false,
  onPress,
  onLongPress,
  onContextMenu,
  onDoublePress,
  onSwipeReply,
  maxWidth = DEFAULT_MAX_WIDTH,
  labels,
  accessibilityLabel,
  style,
  bubbleStyle,
  textStyle,
  testID,
}: MessageBubbleProps) {
  const theme = useTheme();
  const paint = useMemo(() => resolveMessageBubblePaint(theme), [theme]);
  const side = sidePaint(paint, direction);
  const text_ = resolveLabels(labels);
  const outgoing = direction === 'outgoing';

  if (IS_WEB) adoptStyleSheet(MESSAGE_BUBBLE_STYLE_ID, MESSAGE_BUBBLE_CSS);

  // The jump flash: one band, up fast and down slow, and nothing at all under
  // reduced motion — where the band still appears, it just does not animate.
  const flash = useSharedValue(0);
  const reducedMotion = useReducedMotion();
  useEffect(() => {
    if (!highlighted) {
      flash.value = 0;
      return;
    }
    if (reducedMotion) {
      flash.value = 1;
      return;
    }
    flash.value = withSequence(
      withTiming(1, { duration: 140 }),
      withTiming(1, { duration: FLASH_HOLD_MS }),
      withTiming(0, { duration: FLASH_FADE_MS }),
    );
  }, [highlighted, reducedMotion, flash]);
  const flashStyle = useAnimatedStyle(() => ({ opacity: flash.value }), [flash]);

  const lastPress = useRef(0);
  const handlePress = (): void => {
    if (onDoublePress !== undefined) {
      const now = Date.now();
      const isDouble = now - lastPress.current < DOUBLE_PRESS_MS;
      lastPress.current = isDouble ? 0 : now;
      if (isDouble) {
        onDoublePress();
        return;
      }
    }
    onPress?.();
  };

  const interactive =
    onPress !== undefined ||
    onLongPress !== undefined ||
    onDoublePress !== undefined ||
    onContextMenu !== undefined ||
    selected !== undefined;

  const name =
    accessibilityLabel ??
    bubbleAccessibleName({
      senderName,
      text: deleted ? text_.deleted : text,
      time,
      extras: [
        editedLabel,
        channelViews,
        failed ? text_.failed : undefined,
        pending && !failed ? text_.pending : undefined,
        outgoing && status !== undefined && !failed ? MESSAGE_STATUS_LABELS[status] : undefined,
        selected === true ? text_.selected : undefined,
      ],
    });

  const radii = bubbleRadii(direction, position);
  const fill = failed ? mixColor(side.fill, paint.failed, theme.isDark ? 0.3 : 0.22) : side.fill;
  const showTail = tail && hasTail(position);
  const mediaOnly = media !== undefined && text === undefined && children === undefined && !deleted;
  const overlayMeta = metaOverlay ?? mediaOnly;
  const hasMeta =
    !deleted &&
    (time !== undefined ||
      (outgoing && status !== undefined) ||
      (editedLabel !== undefined && editedLabel !== '') ||
      channelViews !== undefined ||
      authorSignature !== undefined);

  const resolvedSenderColor =
    senderColor ?? (senderName === undefined ? undefined : senderNameColor(senderColorSeed ?? senderName, theme));

  const meta = hasMeta ? (
    <MetaRow
      time={time}
      status={status}
      direction={direction}
      editedLabel={editedLabel}
      channelViews={channelViews}
      authorSignature={authorSignature}
      color={overlayMeta ? side.overlayText : side.meta}
    />
  ) : null;

  // The two custom properties the adopted sheet reads. They sit on the ROW so
  // both the focus ring (on the pressable) and the selection colour (inside the
  // bubble) inherit them from one place.
  const rowWebStyle: WebCssStyle = IS_WEB
    ? { '--bloom-message-ring': paint.focusRing, '--bloom-message-selection': side.quoteFill }
    : {};

  const body = (
    <View
      {...webDataSet({ bloomMessageBubble: direction })}
      style={[
        {
          borderRadius: 0,
          ...radii,
          backgroundColor: fill,
          borderWidth: side.border === undefined ? 0 : 1,
          borderColor: side.border,
          paddingTop: BUBBLE_PADDING_Y,
          paddingBottom: BUBBLE_PADDING_Y,
          paddingLeft: BUBBLE_PADDING_X,
          paddingRight: BUBBLE_PADDING_X,
          gap: 2,
          opacity: pending && !failed ? 0.65 : 1,
          overflow: 'hidden',
        },
        bubbleStyle,
      ]}
    >
      {forwardedFrom === undefined || deleted ? null : (
        <ForwardedLine name={forwardedFrom} prefix={text_.forwardedFrom} side={side} />
      )}
      {senderName === undefined || deleted ? null : (
        <Text variant="body-2-medium" numberOfLines={1} style={{ color: resolvedSenderColor }}>
          {senderName}
        </Text>
      )}
      {replyTo === undefined || deleted ? null : (
        <ReplyQuote quote={replyTo} side={side} onPress={onPressReply} label={text_.replyTo} />
      )}
      {media === undefined || deleted ? null : (
        <View
          style={{
            marginTop: forwardedFrom === undefined && senderName === undefined && replyTo === undefined ? -BUBBLE_PADDING_Y : 0,
            marginLeft: -BUBBLE_PADDING_X,
            marginRight: -BUBBLE_PADDING_X,
            marginBottom: mediaOnly ? -BUBBLE_PADDING_Y : 2,
            overflow: 'hidden',
          }}
        >
          {media}
          {overlayMeta && meta !== null ? (
            <View
              style={{
                position: 'absolute',
                right: 8,
                bottom: 8,
                borderRadius: 12,
                paddingTop: 2,
                paddingBottom: 2,
                paddingLeft: 8,
                paddingRight: 8,
                backgroundColor: side.overlayFill,
              }}
            >
              {meta}
            </View>
          ) : null}
        </View>
      )}
      {deleted ? (
        <Text variant="body-regular" style={{ color: paint.muted, fontStyle: 'italic' }}>
          {text_.deleted}
        </Text>
      ) : (
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            alignItems: 'flex-end',
            rowGap: 2,
          }}
        >
          {children === undefined ? null : <View style={{ flexShrink: 1 }}>{children}</View>}
          {children === undefined && text !== undefined ? (
            <View style={{ flexShrink: 1 }}>
              <MessageText text={text} side={side} renderEntity={renderEntity} style={textStyle} />
            </View>
          ) : null}
          {overlayMeta || meta === null ? null : (
            <View style={{ marginLeft: 'auto', paddingLeft: 8 }}>{meta}</View>
          )}
        </View>
      )}
    </View>
  );

  const bubble = interactive ? (
    <Pressable
      role="button"
      accessibilityLabel={name}
      aria-pressed={selected === undefined ? undefined : selected}
      accessibilityState={selected === undefined ? undefined : { selected }}
      onPress={handlePress}
      onLongPress={onLongPress}
      {...(IS_WEB && onContextMenu !== undefined
        ? {
            onContextMenu: (event: { preventDefault?: () => void }) => {
              event.preventDefault?.();
              onContextMenu();
            },
          }
        : null)}
      {...webDataSet({ bloomMessagePress: '' })}
      style={{
        alignSelf: outgoing ? 'flex-end' : 'flex-start',
        maxWidth: '100%',
        borderRadius: BUBBLE_RADIUS,
      }}
    >
      {body}
      {showTail ? <BubbleTail direction={direction} color={fill} border={side.border} /> : null}
    </Pressable>
  ) : (
    <View
      accessible
      accessibilityLabel={name}
      style={{ alignSelf: outgoing ? 'flex-end' : 'flex-start', maxWidth: '100%' }}
    >
      {body}
      {showTail ? <BubbleTail direction={direction} color={fill} border={side.border} /> : null}
    </View>
  );

  const column = (
    <>
      {bubble}
      {reactions === undefined || reactions.length === 0 || deleted ? null : (
        <ReactionRow
          reactions={reactions}
          paint={paint}
          direction={direction}
          onToggle={onToggleReaction}
          onAdd={onAddReaction}
          addLabel={text_.addReaction}
        />
      )}
    </>
  );

  return (
    <View
      style={[
        {
          paddingTop: 1,
          paddingBottom: 1,
          paddingLeft: 2,
          paddingRight: 2,
          backgroundColor: selected === true ? paint.selectedBand : 'transparent',
        },
        rowWebStyle,
        style,
      ]}
      testID={testID}
    >
      <Animated.View
        aria-hidden
        pointerEvents="none"
        style={[
          { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: paint.highlightBand },
          flashStyle,
        ]}
      />
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-end',
          gap: 6,
          justifyContent: outgoing ? 'flex-end' : 'flex-start',
        }}
      >
        {failed && onRetry !== undefined && outgoing ? (
          <RetryButton onPress={onRetry} label={text_.retry} color={paint.failed} />
        ) : null}
        <SwipeToReply
          direction={direction}
          onSwipeReply={onSwipeReply}
          style={{ maxWidth, alignItems: outgoing ? 'flex-end' : 'flex-start' }}
        >
          {column}
        </SwipeToReply>
        {failed && onRetry !== undefined && !outgoing ? (
          <RetryButton onPress={onRetry} label={text_.retry} color={paint.failed} />
        ) : null}
      </View>
    </View>
  );
}

export const MessageBubble = memo(MessageBubbleComponent);
MessageBubble.displayName = 'MessageBubble';
