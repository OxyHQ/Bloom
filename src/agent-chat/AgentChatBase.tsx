import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  View,
  useWindowDimensions,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';

import { AgentThinking } from '../agent-thinking';
import { useControllableState } from '../hooks/use-controllable-state';
import type { WebCssStyle } from '../styles/web-view-style';
import { Text } from '../typography';
import { AgentChatActionsBase } from './AgentChatActionsBase';
import { AgentChatComposerBase } from './AgentChatComposerBase';
import { AgentChatHistoryBase } from './AgentChatHistoryBase';
import { AgentChatMessage } from './AgentChatMessage';
import {
  CARD_RADIUS,
  COLUMN_MAX_WIDTH,
  dataHook,
  HEADER_HEIGHT,
  HISTORY_BREAKPOINT,
  IS_WEB,
  useAgentChatPalette,
  useAgentChatWebCss,
  type AgentChatPalette,
} from './shared';
import type { AgentChatMessageData, AgentChatProps } from './types';

/**
 * `AgentChat` — the chat workspace, without the app shell around it and
 * without its transport.
 *
 *   workspace  row, gap 12: the chat card (flex 1) and the history rail
 *   card       radius 24, background-secondary, clipped
 *   header     overlaid (absolute, z 10), 48 tall, px 16 / pt 7, gap 8:
 *              `headerLeading`, the title (headline-medium, truncated) and the
 *              actions pushed right. A 1px bottom rule is always present but
 *              transparent; once the transcript is scrolled AND the title
 *              actually reaches the message column (measured, +16px buffer), the
 *              rule shows (separator-border) and the band frosts over (white /
 *              black 20%, 20px backdrop blur)
 *   transcript flex 1, scrolls; the column is max 768, px 16, pt 72, pb 24,
 *              gap 20 — centred vertically while empty
 *   empty      centred, gap 16: title-2-medium heading + body-regular
 *              text-secondary line (gap 4), then wrapping suggestion pills
 *              (gap 8; full radius, px 14 / py 8, background-primary, shadow-xs,
 *              body-regular text-secondary, background-primary-hover on hover)
 *   thinking   `AgentThinking` wave "Thinking", px 4 — up while busy and the
 *              reply has no text yet (reasoning models stream nothing visible
 *              first)
 *   error      body-regular text-tertiary, px 4, `role="alert"`
 *   composer   px 12 / pb 12, max 768 centred
 *
 * Everything a chat integration would get from `useChat`, `localStorage` and
 * `/api/chat` is a prop here: messages, status, threads and every action are
 * the consumer's. What the
 * component still owns is interaction state — the composer text (uncontrolled
 * by default), the scroll-under / clash measurement, and scrolling to the
 * newest message.
 *
 * Left out, as app shell rather than chat: the dashboard sidebar and its
 * phone drawer (use `headerLeading` for the nav toggle), the pro-offer card,
 * and the "Add an API key" setup notice (pass it as `emptyState`).
 */

const DEFAULT_SUGGESTIONS = [
  'Explain what this starter does',
  'Write a product update in three sentences',
  'Give me five names for a scheduling app',
];

const DEFAULT_LABELS = {
  newChat: 'New chat',
  emptyTitle: 'What can I help with?',
  emptyDescription: 'This chat runs against your own API key. History stays in this browser.',
  thinking: 'Thinking',
  error: 'Something went wrong. Check the server logs, then try again.',
};

function SuggestionPill({
  text,
  onPress,
  palette,
}: {
  text: string;
  onPress: () => void;
  palette: AgentChatPalette;
}) {
  const [hovered, setHovered] = useState(false);
  const style: WebCssStyle = {
    borderRadius: 9999,
    backgroundColor: hovered ? palette.cardHover : palette.card,
    paddingLeft: 14,
    paddingRight: 14,
    paddingTop: 8,
    paddingBottom: 8,
    boxShadow: palette.shadowXs,
    '--bloom-agent-chat-ring': palette.ring,
  };
  return (
    <Pressable
      {...dataHook('bloomAgentChatControl')}
      accessibilityRole="button"
      accessibilityLabel={text}
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={style}>
      <Text variant="body-regular" style={{ color: palette.textSecondary }}>
        {text}
      </Text>
    </Pressable>
  );
}

function EmptyState({
  title,
  description,
  suggestions,
  onPick,
  palette,
}: {
  title: string;
  description: string;
  suggestions: ReadonlyArray<string>;
  onPick: (text: string) => void;
  palette: AgentChatPalette;
}) {
  return (
    <View style={{ flexDirection: 'column', alignItems: 'center', gap: 16 }}>
      <View style={{ flexDirection: 'column', gap: 4 }}>
        <Text
          variant="title-2-medium"
          role="heading"
          aria-level={2}
          style={{ textAlign: 'center', color: palette.text }}>
          {title}
        </Text>
        <Text variant="body-regular" style={{ textAlign: 'center', color: palette.textSecondary }}>
          {description}
        </Text>
      </View>
      {suggestions.length > 0 ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 }}>
          {suggestions.map((suggestion) => (
            <SuggestionPill
              key={suggestion}
              text={suggestion}
              onPress={() => onPick(suggestion)}
              palette={palette}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

function transcriptOf(messages: ReadonlyArray<AgentChatMessageData>): string {
  return messages
    .map((message) => `${message.role === 'user' ? 'You' : 'Assistant'}: ${message.text}`)
    .filter((line) => !line.endsWith(': '))
    .join('\n\n');
}

export function AgentChatBase({
  messages,
  status = 'ready',
  error,
  title,
  value,
  onValueChange,
  onSubmit,
  onStop,
  onAttach,
  model,
  provider,
  suggestions = DEFAULT_SUGGESTIONS,
  emptyState,
  headerLeading,
  onShare,
  onExport,
  onCopyMessage,
  onReadAloud,
  threads,
  activeThreadId,
  onSelectThread,
  onNewChat,
  onRenameThread,
  onToggleUnread,
  onDeleteThread,
  showHistory,
  historyProps,
  labels,
  actionsLabels,
  composerLabels,
  messageLabels,
  style,
  testID,
}: AgentChatProps) {
  useAgentChatWebCss();
  const palette = useAgentChatPalette();
  const l = useMemo(() => ({ ...DEFAULT_LABELS, ...labels }), [labels]);
  const { width: windowWidth } = useWindowDimensions();
  const [input, setInput] = useControllableState<string>({
    value,
    defaultValue: '',
    onChange: onValueChange,
  });

  const busy = status === 'submitted' || status === 'streaming';
  const showError = error ?? status === 'error';
  const last = messages[messages.length - 1];
  const streamedText = last && last.role !== 'user' ? last.text : '';
  const showThinking = busy && streamedText.length === 0;
  const transcript = useMemo(() => transcriptOf(messages), [messages]);

  const headerTitle =
    title ?? threads?.find((thread) => thread.id === activeThreadId)?.title ?? l.newChat;

  // --- Scroll-under + clash (geometry, not a breakpoint) --------------------
  const [scrolledUnder, setScrolledUnder] = useState(false);
  const [titleRight, setTitleRight] = useState(0);
  const [columnLeft, setColumnLeft] = useState(Number.POSITIVE_INFINITY);
  const canClash = titleRight + 16 > columnLeft;
  const frosted = scrolledUnder && canClash;

  const onTitleLayout = useCallback((event: LayoutChangeEvent) => {
    const { x, width } = event.nativeEvent.layout;
    setTitleRight(x + width);
  }, []);
  const onColumnLayout = useCallback((event: LayoutChangeEvent) => {
    setColumnLeft(event.nativeEvent.layout.x);
  }, []);
  const onScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    setScrolledUnder(event.nativeEvent.contentOffset.y > 0);
  }, []);

  // --- Follow the newest message --------------------------------------------
  const scrollRef = useRef<ScrollView | null>(null);
  const pendingScroll = useRef(false);
  useEffect(() => {
    pendingScroll.current = true;
  }, [messages, busy]);
  const onContentSizeChange = useCallback(() => {
    if (!pendingScroll.current) return;
    pendingScroll.current = false;
    scrollRef.current?.scrollToEnd({ animated: true });
  }, []);
  useEffect(() => {
    // A change that does not resize the content (the thinking row swapping for
    // the first token) still scrolls.
    const id = setTimeout(() => {
      if (pendingScroll.current) onContentSizeChange();
    }, 0);
    return () => clearTimeout(id);
  }, [messages, busy, onContentSizeChange]);

  const submit = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || busy) return;
      onSubmit?.(trimmed);
      setInput('');
    },
    [busy, onSubmit, setInput],
  );

  const railVisible = showHistory ?? (threads !== undefined && windowWidth >= HISTORY_BREAKPOINT);
  const empty = messages.length === 0;

  const header: WebCssStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    height: HEADER_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingLeft: 16,
    paddingRight: 16,
    paddingTop: 7,
    borderBottomWidth: 1,
    borderBottomColor: frosted ? palette.separator : 'transparent',
    backgroundColor: frosted ? palette.frost : 'transparent',
    ...(frosted && IS_WEB
      ? { backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }
      : null),
  };

  return (
    <View
      testID={testID}
      style={[
        { flex: 1, minHeight: 0, minWidth: 0, flexDirection: 'row', gap: 12, overflow: 'hidden' },
        style,
      ]}>
      <View
        style={{
          position: 'relative',
          flex: 1,
          minWidth: 0,
          height: '100%',
          flexDirection: 'column',
          overflow: 'hidden',
          borderRadius: CARD_RADIUS,
          backgroundColor: palette.chatSurface,
        }}>
        <View {...dataHook('bloomAgentChatHeader')} testID={testID ? `${testID}-header` : undefined} style={header}>
          {headerLeading}
          <View onLayout={onTitleLayout} style={{ minWidth: 0, flexShrink: 1 }}>
            <Text variant="headline-medium" numberOfLines={1} style={{ color: palette.text }}>
              {headerTitle}
            </Text>
          </View>
          <AgentChatActionsBase
            testID={testID ? `${testID}-actions` : undefined}
            style={{ marginLeft: 'auto' }}
            transcript={transcript}
            onShare={onShare}
            onExport={onExport}
            onToggleUnread={
              onToggleUnread && activeThreadId ? () => onToggleUnread(activeThreadId) : undefined
            }
            onDelete={
              onDeleteThread && activeThreadId ? () => onDeleteThread(activeThreadId) : undefined
            }
            disabled={empty}
            labels={actionsLabels}
          />
        </View>

        {empty && emptyState ? (
          <View style={{ flex: 1, minHeight: 0 }}>{emptyState}</View>
        ) : (
          <>
            <ScrollView
              ref={scrollRef}
              testID={testID ? `${testID}-transcript` : undefined}
              style={{ flex: 1, minHeight: 0 }}
              contentContainerStyle={{ flexGrow: 1 }}
              onScroll={onScroll}
              scrollEventThrottle={16}
              onContentSizeChange={onContentSizeChange}>
              <View
                onLayout={onColumnLayout}
                style={{
                  width: '100%',
                  maxWidth: COLUMN_MAX_WIDTH,
                  alignSelf: 'center',
                  flexDirection: 'column',
                  gap: 20,
                  paddingLeft: 16,
                  paddingRight: 16,
                  paddingTop: 72,
                  paddingBottom: 24,
                  ...(empty ? { flexGrow: 1, justifyContent: 'center' } : null),
                }}>
                {empty ? (
                  <EmptyState
                    title={l.emptyTitle}
                    description={l.emptyDescription}
                    suggestions={suggestions}
                    onPick={submit}
                    palette={palette}
                  />
                ) : (
                  messages.map((message, index) => (
                    <AgentChatMessage
                      key={message.id}
                      role={message.role}
                      text={message.text}
                      at={message.at}
                      streaming={busy && index === messages.length - 1}
                      onCopy={onCopyMessage}
                      onReadAloud={onReadAloud}
                      labels={messageLabels}
                    />
                  ))
                )}

                {showThinking ? (
                  <AgentThinking variant="wave" label={l.thinking} style={{ paddingLeft: 4, paddingRight: 4 }} />
                ) : null}

                {showError ? (
                  <Text
                    variant="body-regular"
                    role="alert"
                    style={{ paddingLeft: 4, paddingRight: 4, color: palette.textTertiary }}>
                    {l.error}
                  </Text>
                ) : null}
              </View>
            </ScrollView>

            <View style={{ flexShrink: 0, paddingLeft: 12, paddingRight: 12, paddingBottom: 12 }}>
              <View style={{ width: '100%', maxWidth: COLUMN_MAX_WIDTH, alignSelf: 'center' }}>
                <AgentChatComposerBase
                  testID={testID ? `${testID}-composer` : undefined}
                  value={input}
                  onValueChange={setInput}
                  onSubmit={submit}
                  onStop={onStop}
                  onAttach={onAttach}
                  busy={busy}
                  model={model}
                  provider={provider}
                  messageCount={messages.length}
                  labels={composerLabels}
                />
              </View>
            </View>
          </>
        )}
      </View>

      {railVisible && threads ? (
        <AgentChatHistoryBase
          testID={testID ? `${testID}-history` : undefined}
          {...historyProps}
          threads={threads}
          activeId={activeThreadId}
          onSelect={onSelectThread}
          onNewChat={onNewChat}
          onRename={onRenameThread}
          onToggleUnread={onToggleUnread}
          onDelete={onDeleteThread}
          onExport={onExport}
          disabled={busy}
        />
      ) : null}
    </View>
  );
}
