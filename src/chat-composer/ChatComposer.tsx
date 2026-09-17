/**
 * The message input bar of a person-to-person chat: a radius-24 pill with a
 * left attach button, an autosizing field, an emoji button and a right control
 * that swaps between a mic (nothing to send) and an accent send disc (there is).
 *
 * Presentational. Every piece of state — the draft, the banners, the pending
 * attachments, which suggestion is highlighted — arrives as a prop, because the
 * app owns drafts per conversation and a composer that kept its own would lose
 * them on every navigation.
 */
import React, { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  TextInput,
  View,
  type NativeSyntheticEvent,
  type TextInputContentSizeChangeEventData,
  type TextInputKeyPressEventData,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { RiAddLine } from '../icons/remix/RiAddLine';
import { RiCameraLine } from '../icons/remix/RiCameraLine';
import { RiEmotionLine } from '../icons/remix/RiEmotionLine';
import { RiForbidLine } from '../icons/remix/RiForbidLine';
import { RiMic2Line } from '../icons/remix/RiMic2Line';
import { RiSendPlaneLine } from '../icons/remix/RiSendPlaneLine';
import { useControllableState } from '../hooks/use-controllable-state';
import type { WebCssStyle } from '../styles/web-view-style';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { TYPE_SCALE } from '../typography/scale';
import { ComposerAttachmentStrip } from './ComposerAttachmentStrip';
import { ComposerIconButton } from './ComposerIconButton';
import {
  BAR_PADDING,
  BAR_RADIUS,
  CHAT_COMPOSER_LABELS,
  CONTROL_SIZE,
  DEFAULT_MAX_LINES,
  LINE_HEIGHT,
  SWAP_MS,
  resolveChatComposerPalette,
} from './shared';
import { SuggestionList } from './SuggestionList';
import type { ChatComposerProps } from './types';
import { dataHook, IS_WEB, useChatComposerWebCss } from './web-hooks';

const EASE_OUT = Easing.bezier(0, 0, 0.2, 1);

/**
 * One half of the mic ↔ send crossfade.
 *
 * Two things the fade must not break, neither of which the animation expresses:
 *
 * `pointerEvents` is a PROP, not a style entry — react-native-web drops it from
 * a style object silently, and a hidden layer that still takes the press is a
 * send button that fires when the field is empty.
 *
 * The hidden half leaves the ACCESSIBILITY TREE too. Both halves stay mounted so
 * they can cross-fade, so without this every composer announces "Send" and
 * "Record a voice message" side by side and only one of them does anything.
 * `aria-hidden` is what react-native-web reads and
 * `importantForAccessibility` is what React Native reads; a surface that sets
 * one of the two is hidden on one platform only.
 */
function SwapLayer({ shown, children }: { shown: boolean; children: React.ReactNode }) {
  const reducedMotion = useReducedMotion();
  const progress = useSharedValue(shown ? 1 : 0);
  React.useEffect(() => {
    progress.value = reducedMotion
      ? shown
        ? 1
        : 0
      : withTiming(shown ? 1 : 0, { duration: SWAP_MS, easing: EASE_OUT });
  }, [shown, reducedMotion, progress]);
  const animated = useAnimatedStyle(() => ({ opacity: progress.value }), [progress]);
  return (
    <Animated.View
      pointerEvents={shown ? 'auto' : 'none'}
      aria-hidden={!shown}
      accessibilityElementsHidden={!shown}
      importantForAccessibility={shown ? 'auto' : 'no-hide-descendants'}
      style={[{ position: 'absolute', top: 0, left: 0 }, animated]}>
      {children}
    </Animated.View>
  );
}

/** A DOM keyboard event as react-native-web hands it to `onKeyPress`. */
type WebKeyEvent = TextInputKeyPressEventData & {
  shiftKey?: boolean;
  metaKey?: boolean;
  ctrlKey?: boolean;
  altKey?: boolean;
  isComposing?: boolean;
};

export function ChatComposer({
  value,
  defaultValue = '',
  onValueChange,
  placeholder = 'Message',
  onSend,
  sendOn = 'enter',
  maxLines = DEFAULT_MAX_LINES,
  minLines = 1,
  disabled = false,
  notice,
  noticeIcon,
  banner,
  attachments,
  onRemoveAttachment,
  leading,
  onAttachPress,
  emojiSlot,
  onEmojiPress,
  onCameraPress,
  onMicPress,
  onMicPressIn,
  onMicPressOut,
  canSend,
  recorder,
  suggestions,
  suggestionKind = 'mention',
  activeIndex = -1,
  onActiveIndexChange,
  onSelectSuggestion,
  onEscape,
  onEditLast,
  showKeyboardHint = false,
  inputRef,
  onFocus,
  onBlur,
  labels: labelOverrides,
  style,
  testID,
  accessibilityLabel,
}: ChatComposerProps) {
  const theme = useTheme();
  const palette = resolveChatComposerPalette(theme);
  useChatComposerWebCss();
  const labels = useMemo(
    () => ({ ...CHAT_COMPOSER_LABELS, ...labelOverrides }),
    [labelOverrides],
  );

  const [text, setText] = useControllableState<string>({
    value,
    defaultValue,
    onChange: onValueChange,
  });

  const localRef = useRef<TextInput | null>(null);
  const setFieldRef = useCallback(
    (node: TextInput | null) => {
      localRef.current = node;
      if (inputRef) inputRef.current = node;
    },
    [inputRef],
  );

  const minHeight = Math.max(1, minLines) * LINE_HEIGHT;
  const maxHeight = Math.max(minLines, maxLines) * LINE_HEIGHT;
  const [contentHeight, setContentHeight] = useState(minHeight);
  const height = Math.min(maxHeight, Math.max(minHeight, contentHeight));

  /**
   * Web autosize measures the node, native reads `onContentSizeChange`.
   *
   * They are not interchangeable: react-native-web reports `scrollHeight`,
   * which never falls below the height already applied, so a field grown to six
   * lines and then emptied would stay six lines tall. Collapsing the node to
   * zero first and restoring it in the same frame is what makes it SHRINK.
   */
  useLayoutEffect(() => {
    if (!IS_WEB) return;
    const node = localRef.current as unknown as HTMLTextAreaElement | null;
    if (!node || typeof node.scrollHeight !== 'number' || !node.style) return;
    const previous = node.style.height;
    node.style.height = '0px';
    const measured = node.scrollHeight;
    node.style.height = previous;
    if (measured > 0) setContentHeight(measured);
  }, [text, minHeight]);

  const onContentSizeChange = useCallback(
    (event: NativeSyntheticEvent<TextInputContentSizeChangeEventData>) => {
      if (IS_WEB) return;
      setContentHeight(event.nativeEvent.contentSize.height);
    },
    [],
  );

  const trimmed = text.trim();
  const hasAttachments = !!attachments && attachments.length > 0;
  const showSend = canSend ?? (trimmed.length > 0 || hasAttachments);

  const submit = useCallback(() => {
    if (disabled || !showSend) return;
    onSend?.(text);
    if (value === undefined) setText('');
  }, [disabled, showSend, onSend, text, value, setText]);

  const openSuggestions = !!suggestions && suggestions.length > 0;

  const onKeyPress = useCallback(
    (event: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
      if (!IS_WEB) return;
      const native = event.nativeEvent as WebKeyEvent;
      // An IME candidate window is using the same keys; committing a
      // composition must never send the half-written word behind it.
      if (native.isComposing) return;
      const mod = native.metaKey === true || native.ctrlKey === true;

      if (openSuggestions && (native.key === 'ArrowDown' || native.key === 'ArrowUp')) {
        event.preventDefault();
        const count = suggestions?.length ?? 0;
        const step = native.key === 'ArrowDown' ? 1 : -1;
        const from = activeIndex < 0 ? (step > 0 ? -1 : 0) : activeIndex;
        onActiveIndexChange?.((from + step + count) % count);
        return;
      }
      if (native.key === 'Escape') {
        event.preventDefault();
        onEscape?.();
        return;
      }
      if (native.key === 'ArrowUp' && text.length === 0) {
        event.preventDefault();
        onEditLast?.();
        return;
      }
      if (native.key !== 'Enter') return;

      if (openSuggestions && activeIndex >= 0) {
        const picked = suggestions?.[activeIndex];
        if (picked && !picked.disabled) {
          event.preventDefault();
          onSelectSuggestion?.(picked, activeIndex);
          return;
        }
      }
      if (sendOn === 'enter' ? native.shiftKey !== true && !mod : mod) {
        event.preventDefault();
        submit();
      }
    },
    [
      activeIndex,
      onActiveIndexChange,
      onEditLast,
      onEscape,
      onSelectSuggestion,
      openSuggestions,
      sendOn,
      submit,
      suggestions,
      text.length,
    ],
  );

  const bar: WebCssStyle = {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
    minHeight: CONTROL_SIZE + BAR_PADDING * 2,
    borderRadius: BAR_RADIUS,
    borderWidth: 1,
    borderColor: palette.border,
    // A disabled bar changes its FILL rather than its opacity. Dimming the
    // container compounds with each control's own disabled opacity — 0.55 × 0.4
    // put the send disc at 0.22, which reads as a rendering fault rather than a
    // state.
    backgroundColor: disabled ? palette.inset : palette.surface,
    paddingLeft: BAR_PADDING,
    paddingRight: BAR_PADDING,
    paddingTop: BAR_PADDING,
    paddingBottom: BAR_PADDING,
    '--bloom-chat-composer-ring': palette.focusRing,
  };

  const NoticeIcon = noticeIcon ?? RiForbidLine;

  return (
    <View
      accessibilityLabel={accessibilityLabel}
      style={[{ width: '100%', flexDirection: 'column', gap: 6 }, style]}
      testID={testID}>
      {openSuggestions ? (
        <SuggestionList
          kind={suggestionKind}
          suggestions={suggestions ?? []}
          activeIndex={activeIndex}
          onActiveIndexChange={onActiveIndexChange}
          onSelectSuggestion={onSelectSuggestion}
          testID={testID ? `${testID}-suggestions` : undefined}
        />
      ) : null}

      {banner}

      {hasAttachments ? (
        <ComposerAttachmentStrip
          attachments={attachments ?? []}
          onRemove={onRemoveAttachment}
          testID={testID ? `${testID}-attachments` : undefined}
        />
      ) : null}

      {recorder ?? (
        <View style={bar} testID={testID ? `${testID}-bar` : undefined}>
          {notice !== undefined ? (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                flexGrow: 1,
                minHeight: CONTROL_SIZE,
                paddingLeft: 12,
                paddingRight: 12,
              }}
              testID={testID ? `${testID}-notice` : undefined}>
              {typeof notice === 'string' ? (
                <>
                  <NoticeIcon width={16} height={16} fill={palette.iconSecondary} />
                  <Text
                    variant="body-2-regular"
                    numberOfLines={2}
                    style={{ color: palette.textSecondary, textAlign: 'center' }}>
                    {notice}
                  </Text>
                </>
              ) : (
                notice
              )}
            </View>
          ) : (
            <>
              {leading ??
                (onAttachPress ? (
                  <ComposerIconButton
                    icon={RiAddLine}
                    accessibilityLabel={labels.attach}
                    onPress={onAttachPress}
                    disabled={disabled}
                    iconSize={22}
                    testID={testID ? `${testID}-attach` : undefined}
                  />
                ) : null)}

              <View
                style={{
                  flexGrow: 1,
                  flexShrink: 1,
                  justifyContent: 'center',
                  minHeight: CONTROL_SIZE,
                  paddingLeft: 6,
                  paddingRight: 6,
                }}>
                <TextInput
                  ref={setFieldRef}
                  {...dataHook('bloomChatComposerInput')}
                  accessibilityLabel={labels.input}
                  multiline
                  editable={!disabled}
                  value={text}
                  onChangeText={setText}
                  onKeyPress={onKeyPress}
                  onContentSizeChange={onContentSizeChange}
                  onFocus={onFocus}
                  onBlur={onBlur}
                  placeholder={placeholder}
                  placeholderTextColor={palette.textPlaceholder}
                  selectionColor={palette.accent}
                  cursorColor={palette.accent}
                  scrollEnabled={height >= maxHeight}
                  style={{
                    width: '100%',
                    height,
                    maxHeight,
                    padding: 0,
                    margin: 0,
                    ...TYPE_SCALE['body-regular'],
                    fontFamily: IS_WEB ? 'var(--bloom-font-sans)' : 'Inter',
                    color: disabled ? palette.textSecondary : palette.text,
                    backgroundColor: 'transparent',
                  }}
                  testID={testID ? `${testID}-input` : undefined}
                />
              </View>

              {onCameraPress ? (
                <ComposerIconButton
                  icon={RiCameraLine}
                  accessibilityLabel={labels.camera}
                  onPress={onCameraPress}
                  disabled={disabled}
                  testID={testID ? `${testID}-camera` : undefined}
                />
              ) : null}

              {emojiSlot ??
                (onEmojiPress ? (
                  <ComposerIconButton
                    icon={RiEmotionLine}
                    accessibilityLabel={labels.emoji}
                    onPress={onEmojiPress}
                    disabled={disabled}
                    testID={testID ? `${testID}-emoji` : undefined}
                  />
                ) : null)}

              <View style={{ width: CONTROL_SIZE, height: CONTROL_SIZE, marginLeft: 2 }}>
                <SwapLayer shown={showSend}>
                  <ComposerIconButton
                    icon={RiSendPlaneLine}
                    tone="accent"
                    accessibilityLabel={labels.send}
                    onPress={submit}
                    disabled={disabled}
                    iconSize={18}
                    testID={testID ? `${testID}-send` : undefined}
                  />
                </SwapLayer>
                <SwapLayer shown={!showSend}>
                  <ComposerIconButton
                    icon={RiMic2Line}
                    accessibilityLabel={labels.mic}
                    onPress={onMicPress}
                    onPressIn={onMicPressIn}
                    onPressOut={onMicPressOut}
                    disabled={disabled}
                    testID={testID ? `${testID}-mic` : undefined}
                  />
                </SwapLayer>
              </View>
            </>
          )}
        </View>
      )}

      {showKeyboardHint && IS_WEB && notice === undefined ? (
        <Text
          variant="caption-2-regular"
          style={{ color: palette.textPlaceholder, paddingLeft: 14 }}>
          {sendOn === 'enter' ? labels.enterHint : labels.modEnterHint}
        </Text>
      ) : null}
    </View>
  );
}
