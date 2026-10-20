import { PageFooter } from '../page-footer';
import { useAgentChatPlatform } from './context';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import type { ComponentRef } from 'react';
import { Pressable, type ScrollView, View } from 'react-native';

import { AgentThinking } from '../agent-thinking';
import { useControllableState } from '../hooks/use-controllable-state';
import { useMessages } from '../locale/messages';
import { PageHeader } from '../page-header';
import type { WebCssStyle } from '../styles/web-view-style';
import { Text } from '../typography';
import { AgentChatActionsBase } from './AgentChatActionsBase';
import { AgentChatComposerBase } from './AgentChatComposerBase';
import { AgentChatHistoryBase } from './AgentChatHistoryBase';
import { AgentChatMessage } from './AgentChatMessage';
import { AGENT_CHAT_MESSAGES } from './messages';
import {
  COLUMN_MAX_WIDTH,
  HISTORY_BREAKPOINT,
  RAIL_WIDTH,
  useAgentChatPalette,
  useAgentChatWebCss,
  type AgentChatPalette,
} from './shared';
import type { AgentChatMessageData, AgentChatProps } from './types';
import { dataHook } from '../styles/data-hook';
import { useInteractionState } from '../hooks/use-interaction-state';

/**
 * `AgentChat` — a modular conversation/history workspace without its transport.
 *
 *   workspace  row, gap 12: the chat card (flex 1) and the history rail
 *   card       radius 24, background-secondary, clipped
 *   header     PageHeader with floating action islands; a custom identity determines its height
 *   transcript flex 1, scrolls; the column is max 768, px 16, pt 16, pb 24,
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
 * by default) and scrolling to the
 * newest message.
 *
 * Left out, as app shell rather than chat: the dashboard sidebar and its
 * phone drawer (use `headerLeading` for the nav toggle), the pro-offer card,
 * and the "Add an API key" setup notice (pass it as `emptyState`).
 */

function SuggestionPill({
  text,
  onPress,
  disabled,
  palette,
}: {
  text: string;
  onPress: () => void;
  disabled?: boolean;
  palette: AgentChatPalette;
}) {
  const { state: hovered, onIn: onHoverIn, onOut: onHoverOut } = useInteractionState();
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
      disabled={disabled}
      aria-disabled={disabled}
      onHoverIn={onHoverIn}
      onHoverOut={onHoverOut}
      style={style}
    >
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
  disabled,
  palette,
}: {
  title: string;
  description: string;
  suggestions: ReadonlyArray<string>;
  onPick: (text: string) => void;
  disabled?: boolean;
  palette: AgentChatPalette;
}) {
  return (
    <View style={{ flexDirection: 'column', alignItems: 'center', gap: 16 }}>
      <View style={{ flexDirection: 'column', gap: 4 }}>
        <Text
          variant="title-2-medium"
          role="heading"
          aria-level={2}
          style={{ textAlign: 'center', color: palette.text }}
        >
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
              disabled={disabled}
              palette={palette}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

function transcriptOf(
  messages: ReadonlyArray<AgentChatMessageData>,
  speakers: { you: string; assistant: string },
): string {
  return messages
    .map(
      (message) =>
        `${message.role === 'user' ? speakers.you : speakers.assistant}: ${message.text}`,
    )
    .filter((line) => !line.endsWith(': '))
    .join('\n\n');
}

export function AgentChatBase({
  disabled = false,
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
  suggestions: suggestionsProp,
  emptyState,
  headerLeading,
  headerIdentity,
  headerTitleAlign,
  composerProps,
  onShare,
  onExport,
  onCopyMessage,
  onReadAloud,
  onLinkPress,
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
  const { messages: catalog } = useMessages(AGENT_CHAT_MESSAGES);
  const l = useMemo(() => ({ ...catalog.chat, ...labels }), [catalog, labels]);
  const suggestions = suggestionsProp ?? catalog.chat.suggestions;
  const { Screen, ScreenScrollView, AppShell } = useAgentChatPlatform();
  const [input, setInput] = useControllableState<string>({
    value,
    defaultValue: '',
    onChange: onValueChange,
  });

  const busy = status === 'submitted' || status === 'streaming';
  const blocked = disabled || composerProps?.disabled === true;
  const showError = error ?? status === 'error';
  const last = messages[messages.length - 1];
  const streamedText = last && last.role !== 'user' ? last.text : '';
  const showThinking = busy && streamedText.length === 0;
  const transcript = useMemo(() => transcriptOf(messages, catalog.chat), [messages, catalog]);

  const headerTitle =
    title ?? threads?.find((thread) => thread.id === activeThreadId)?.title ?? l.newChat;

  // --- Follow the newest message --------------------------------------------
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
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
      if ((!trimmed && !composerProps?.attachments?.length) || busy || blocked) return;
      onSubmit?.(trimmed);
      setInput('');
    },
    [busy, blocked, onSubmit, setInput, composerProps?.attachments?.length],
  );

  const empty = messages.length === 0;

  return (
    <AppShell
      testID={testID}
      variant="dashboard"
      gutter={0}
      safeArea={false}
      contentMaxWidth="none"
      style={style}
      panelLayout={{
        mode: 'split',
        flow: 'bounded',
        gap: 12,
        activePanel: 'conversation',
        panels: [
          {
            id: 'conversation',
            minWidth: 280,
            scroll: 'content',
            content: (
              <Screen
                bottomBarKeyboardBehavior="visible"
                scroll="auto"
                contentClearance={0}
                header={
                  <PageHeader
                    testID={testID ? `${testID}-header` : undefined}
                    title={headerIdentity ?? headerTitle}
                    titleAlign={headerTitleAlign ?? (headerIdentity ? 'center' : 'start')}
                    leading={headerLeading}
                    sticky={false}
                    safeArea={false}
                    actions={
                      <AgentChatActionsBase
                        testID={testID ? `${testID}-actions` : undefined}
                        transcript={transcript}
                        onShare={onShare}
                        onExport={onExport}
                        onToggleUnread={
                          onToggleUnread && activeThreadId
                            ? () => onToggleUnread(activeThreadId)
                            : undefined
                        }
                        onDelete={
                          onDeleteThread && activeThreadId
                            ? () => onDeleteThread(activeThreadId)
                            : undefined
                        }
                        disabled={empty}
                        labels={actionsLabels}
                      />
                    }
                  />
                }
                bottomBar={
                  empty && emptyState ? undefined : (
                    <PageFooter safeArea={false} scrim="auto">
                      <View
                        style={{ width: '100%', maxWidth: COLUMN_MAX_WIDTH, alignSelf: 'center' }}
                      >
                        <AgentChatComposerBase
                          testID={testID ? `${testID}-composer` : undefined}
                          value={input}
                          onValueChange={setInput}
                          onSubmit={submit}
                          onStop={onStop}
                          onAttach={onAttach}
                          busy={busy}
                          disabled={blocked}
                          model={model}
                          provider={provider}
                          messageCount={messages.length}
                          labels={composerLabels}
                          composerProps={composerProps}
                        />
                      </View>
                    </PageFooter>
                  )
                }
              >
                {empty && emptyState ? (
                  emptyState
                ) : (
                  <ScreenScrollView
                    ref={scrollRef}
                    testID={testID ? `${testID}-transcript` : undefined}
                    style={{ flex: 1, minHeight: 0 }}
                    contentContainerStyle={{ flexGrow: 1 }}
                    scrollEventThrottle={16}
                    onContentSizeChange={onContentSizeChange}
                  >
                    <View
                      style={{
                        width: '100%',
                        maxWidth: COLUMN_MAX_WIDTH,
                        alignSelf: 'center',
                        flexDirection: 'column',
                        gap: 20,
                        paddingLeft: 16,
                        paddingRight: 16,
                        paddingTop: 16,
                        paddingBottom: 24,
                        ...(empty ? { flexGrow: 1, justifyContent: 'center' } : null),
                      }}
                    >
                      {empty ? (
                        <EmptyState
                          title={l.emptyTitle}
                          description={l.emptyDescription}
                          suggestions={suggestions}
                          onPick={submit}
                          disabled={busy || blocked}
                          palette={palette}
                        />
                      ) : (
                        messages.map((message, index) => (
                          <AgentChatMessage
                            key={message.id}
                            role={message.role}
                            text={message.text}
                            at={message.at}
                            agent={message.agent}
                            reasoning={message.reasoning}
                            toolCalls={message.toolCalls}
                            markdown={message.markdown}
                            onLinkPress={onLinkPress}
                            streaming={busy && index === messages.length - 1}
                            onCopy={onCopyMessage}
                            onReadAloud={onReadAloud}
                            labels={messageLabels}
                          />
                        ))
                      )}

                      {showThinking ? (
                        <AgentThinking
                          variant="wave"
                          label={l.thinking}
                          style={{ paddingLeft: 4, paddingRight: 4 }}
                        />
                      ) : null}

                      {showError ? (
                        <Text
                          variant="body-regular"
                          role="alert"
                          style={{ paddingLeft: 4, paddingRight: 4, color: palette.textTertiary }}
                        >
                          {l.error}
                        </Text>
                      ) : null}
                    </View>
                  </ScreenScrollView>
                )}
              </Screen>
            ),
          },
          {
            id: 'history',
            width: RAIL_WIDTH,
            minWidth: RAIL_WIDTH,
            maxWidth: RAIL_WIDTH,
            visible: threads !== undefined && showHistory !== false,
            hideBelow: showHistory ? undefined : HISTORY_BREAKPOINT,
            scroll: 'content',
            content: threads ? (
              <AgentChatHistoryBase
                framed={false}
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
            ) : null,
          },
        ],
      }}
    />
  );
}
