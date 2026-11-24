import {
  type ComponentRef,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Platform,
  type ScrollView,
  Share,
  type StyleProp,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';
import { clipboardAvailable, writeClipboardText } from '../hooks/clipboard';
import Animated from 'react-native-reanimated';
import { PageHeader } from '../page-header/PageHeader';
import { PageFooter } from '../page-footer';
import { CHAT_CONTENT_STYLE } from '../styles/chat-layout';
import { useAppShell } from '../app-shell/hooks';
import type { SidebarProps } from '../sidebar/types';

import { useControllableState } from '../hooks/use-controllable-state';
import { AgentAvatar } from '../agent-avatar';
import { AvatarFlightLayer, avatarJoinFlights, useAvatarFlights } from '../avatar-flight';
import { AgentChatMessage, StreamedText } from '../agent-chat/AgentChatMessage';
import { Button } from '../button';
import { useDialogControl } from '../dialog/context';
import { useDirectionProps } from '../hooks/use-is-rtl';
import {
  AgentProfile,
  AgentReply,
  AgentReplyActions,
  AgentReplyBubble,
  AgentReplyIdentity,
} from '../agent-reply';
import { RiCheckLine } from '../icons/remix/RiCheckLine';
import { RiGroupLine } from '../icons/remix/RiGroupLine';
import { RiMenuLine } from '../icons/remix/RiMenuLine';
import { RiMoreFill } from '../icons/remix/RiMoreFill';
import { RiShare2Line } from '../icons/remix/RiShare2Line';
import { useMessages, formatMessage } from '../locale/messages';
import { OverlayRoot, TOAST_LAYER_Z } from '../overlay';
import { IS_WEB } from '../styles/platform';
import { ROUNDED_FULL } from '../styles/rounded-full';
import { TextFieldInput } from '../text-field';
import { createTokenStyles, useColorTokens } from '../theme/color-tokens';
import { Text } from '../typography';
import { stepLineHeight, WEB_TRANSITION_COLORS } from './web-css';
import { SupportCopy } from './SupportCopy';
import { ChatSidebar } from './ChatSidebar';
import { useChatComponents } from './context';
import {
  agentCharacter,
  conversationFor,
  formatDemoReply,
  nextAgentIdentity,
  removeConversation,
  updateConversationAgents,
  type Agent,
  type Conversation,
} from './data';
import { Marketplace } from './Marketplace';
import {
  DEFAULT_PLUGINS,
  MARKETPLACE_ITEMS,
  addMarketplaceBot,
  type MarketplaceItem,
} from './marketplace-data';
import { MULTI_AGENT_CHAT_MESSAGES } from './messages';
import { WORKSPACE_MODELS } from './model-catalog';
import { SelectedAgentPreview } from './SelectedAgentPreview';
import type { MultiAgentChatProps } from './types';
import { chatId, useReplies } from './use-replies';
import { useWorkspace } from './use-workspace';

const AnimatedView = Animated.createAnimatedComponent(View);
type Panel =
  | 'picker'
  | 'rename'
  | 'options'
  | 'marketplace'
  | 'settings'
  | 'navigation'
  | 'support'
  | null;

/** Shared workspace implementation. Platform bindings select Bloom's existing surfaces only. */
/** The reply waits for the first-message flight to land on it: the flight's length. */
const REPLY_DELAY_MS = 800;

export function MultiAgentChatBase(props: MultiAgentChatProps) {
  const { messages } = useMessages(MULTI_AGENT_CHAT_MESSAGES);
  const {
    defaultEditorId = 'security',
    onCopy,
    voices,
    onPreviewVoice,
    style,
    testID = 'multi-agent-chat',
  } = props;
  const {
    Screen,
    ScreenScrollView,
    AppShell,
    Portal,
    Dialog,
    ComposerPanel,
    AgentCreator,
    Dropdown: D,
  } = useChatComponents();
  const tokens = useColorTokens();
  const tokenStyles = useTokenStyles();
  const directionProps = useDirectionProps();
  const flights = useAvatarFlights();
  const handoffGeneration = useRef(0),
    sending = useRef(false),
    starting = useRef(false);
  const { workspace, current, update, loaded } = useWorkspace(props);
  const replies = useReplies(current, update, props.onRespond);
  const composer = props.composerProps ?? {};
  const providers = props.providers ?? WORKSPACE_MODELS;
  const [model, setModel] = useControllableState({
    value: composer.model,
    defaultValue: composer.defaultModel ?? providers[0]?.models[0]?.id ?? '',
    onChange: composer.onModelChange,
  });
  const [permission, setPermission] = useControllableState({
    value: composer.permission,
    defaultValue: composer.defaultPermission ?? composer.permissions?.[0]?.id ?? 'bypass',
    onChange: composer.onPermissionChange,
  });
  const [effort, setEffort] = useControllableState<number | null>({
    value: composer.effort,
    defaultValue: composer.defaultEffort === undefined ? 1 : composer.defaultEffort,
    onChange: (next) => {
      if (next !== null) composer.onEffortChange?.(next);
    },
  });
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [editor, setEditor] = useState<Agent | null>(
    () => workspace.agents.find((a) => a.id === defaultEditorId) ?? null,
  );
  // Selection survives presentation changes; the shell retains the editor through its exit.
  const [editorOpen, setEditorOpen] = useState(Boolean(defaultEditorId));
  const [panel, setPanel] = useState<Panel>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [targetChatId, setTargetChatId] = useState<string | null>(null);
  const [rename, setRename] = useState('');
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [marketItem, setMarketItem] = useState<MarketplaceItem | null>(null);
  const [feedback, setFeedback] = useState<Record<string, 'up' | 'down'>>({});
  const surface = useDialogControl();
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);
  const follow = useRef(true);
  const offsets = useRef<Record<string, number>>({});
  const chat: Conversation = workspace.chats.find((c) => c.id === workspace.activeId) ??
    workspace.chats[0] ?? {
      id: 'draft-chat',
      title: '',
      agentIds: workspace.agents[0] ? [workspace.agents[0].id] : [],
      messages: [],
    };
  const participants =
    chat?.agentIds.flatMap((id) => workspace.agents.find((a) => a.id === id) ?? []) ?? [];
  const targetChat = workspace.chats.find((c) => c.id === targetChatId) ?? chat;
  const open = useCallback(
    (next: Panel) => {
      setPanel(next);
      if (next !== 'navigation') surface.open();
    },
    [surface],
  );
  const restoredEditor = useRef(false);
  useEffect(() => {
    if (!loaded || restoredEditor.current) return;
    restoredEditor.current = true;
    setEditor(current.current.agents.find((agent) => agent.id === defaultEditorId) ?? null);
  }, [loaded, current, defaultEditorId]);
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const id = new URL(window.location.href).searchParams.get('marketplace');
    const item = MARKETPLACE_ITEMS.find((entry) => entry.id === id);
    if (item) {
      setMarketItem(item);
      setPanel('marketplace');
    }
  }, []);
  const close = () => {
    if (panel === 'navigation') setPanel(null);
    else surface.close();
  };
  const edit = (agent: Agent) => {
    surface.close();
    setEditor({ ...agent, avatar: { ...agent.avatar } });
    setEditorOpen(true);
  };
  const saveAgent = useCallback(
    (agent: Agent) => {
      setEditor(agent);
      update((s) => {
        const previous = s.agents.find((a) => a.id === agent.id);
        return {
          ...s,
          agents: previous
            ? s.agents.map((a) => (a.id === agent.id ? agent : a))
            : [...s.agents, agent],
          chats: s.chats.map((c) =>
            c.agentIds.length === 1 &&
            c.agentIds[0] === agent.id &&
            (c.title === previous?.name || c.title === previous?.label)
              ? { ...c, title: agent.name }
              : c,
          ),
        };
      });
    },
    [update],
  );
  const createAgent = () => {
    const agent = {
      id: chatId('agent'),
      ...nextAgentIdentity(workspace.agents),
      label: '',
      description: '',
    };
    const created = conversationFor([agent], [agent.id], chatId('chat'));
    update((s) => ({
      ...s,
      agents: [...s.agents, agent],
      chats: [created, ...s.chats],
      activeId: created.id,
    }));
    edit(agent);
  };
  const chooseAgents = (ids: string[] = [], existingId: string | null = null) => {
    handoffGeneration.current++;
    flights.cancel();
    setSelected(ids);
    setEditingChatId(existingId);
    open('picker');
  };
  const startChat = async () => {
    if (starting.current) return;
    const ids = [...new Set(selected)].filter((id) => workspace.agents.some((a) => a.id === id));
    if (!ids.length) return;
    if (editingChatId) {
      replies.stop(editingChatId);
      update((s) => updateConversationAgents(s, editingChatId, ids));
      close();
      return;
    }
    const id = chatId('chat');
    const next = conversationFor(workspace.agents, ids, id);
    const existing =
      ids.length === 1
        ? workspace.chats.find((c) => c.agentIds.length === 1 && c.agentIds[0] === ids[0])
        : undefined;
    if (existing) {
      selectChat(existing.id);
      close();
      return;
    }
    starting.current = true;
    const generation = ++handoffGeneration.current;
    const selectedAgents = ids.flatMap((id) => workspace.agents.find((a) => a.id === id) ?? []);
    // The chosen avatars leave the picker's preview and land in the new conversation's.
    await flights.launch(
      ids.length > 1
        ? selectedAgents.map((agent, index) => ({
            key: agent.id,
            character: agentCharacter(agent),
            from: `picker:${agent.id}`,
            to: `empty:${agent.id}`,
            path: 'straight' as const,
            ease: 'out' as const,
            duration: 700,
            delay: index * 80,
          }))
        : [],
    );
    starting.current = false;
    if (generation !== handoffGeneration.current) return;
    setEditorOpen(false);
    update((s) => ({ ...s, chats: [next, ...s.chats], activeId: id }));
    follow.current = true;
    close();
  };
  const copy = async (text: string, message = messages.copied) => {
    try {
      if (onCopy) await onCopy(text);
      else if (clipboardAvailable()) await writeClipboardText(text);
      else await Share.share({ message: text });
      replies.setNotice(message);
    } catch {
      replies.setNotice(messages.couldnTCopyPleaseTryAgain);
    }
  };
  const transcript = (conversation: Conversation) =>
    conversation.messages
      .map(
        (m) =>
          `${m.role === 'user' ? messages.you : (workspace.agents.find((a) => a.id === m.agentId)?.name ?? messages.agent)}: ${m.text}`,
      )
      .join('\n\n');
  const selectChat = (id: string) => {
    handoffGeneration.current++;
    flights.cancel();
    update((s) => ({ ...s, activeId: id }));
    follow.current = !offsets.current[id];
    requestAnimationFrame(() =>
      scroll.current?.scrollTo({
        y: offsets.current[id] ?? 0,
        animated: false,
      }),
    );
    if (panel === 'navigation') {
      setEditorOpen(false);
      close();
    }
  };
  const removeChat = (id: string) => {
    replies.stop(id);
    update((s) => removeConversation(s, id));
    setDrafts((s) => {
      const next = { ...s };
      delete next[id];
      return next;
    });
    replies.setNotice(messages.chatRemoved);
  };
  const sendMessage = async (text: string) => {
    if (
      !chat ||
      (!text.trim() && !composer.attachments?.length) ||
      replies.pending[chat.id] ||
      sending.current
    )
      return;
    sending.current = true;
    const request = {
      model: providers.some((provider) => provider.models.some((entry) => entry.id === model))
        ? model
        : providers[0]?.models[0]?.id,
      permission,
      effort,
      attachments: [...(composer.attachments ?? [])],
    };
    const id = chat.id,
      generation = ++handoffGeneration.current;
    // In a group's first message the avatars leave the empty chat: the one answering lands on its
    // reply, the others merge into the header's profile.
    const [responder, ...waiting] = participants;
    const flying = await flights.launch(
      !chat.messages.length && responder && waiting.length
        ? [
            {
              key: responder.id,
              character: agentCharacter(responder),
              from: `empty:${responder.id}`,
              to: `reply:${responder.id}`,
              duration: REPLY_DELAY_MS,
            },
            ...avatarJoinFlights(waiting, {
              from: (agent) => `empty:${agent.id}`,
              to: 'profile',
              character: agentCharacter,
            }),
          ]
        : [],
    );
    sending.current = false;
    if (generation !== handoffGeneration.current) return;
    setDrafts((s) => ({ ...s, [id]: '' }));
    follow.current = true;
    void replies.send(text, id, flying ? REPLY_DELAY_MS : 0, chat, request);
  };
  const editPanel = useMemo(
    () =>
      editor && (
        <AgentCreator
          agent={editor}
          onChange={saveAgent}
          voices={voices}
          onPreviewVoice={onPreviewVoice}
          onClose={() => {
            setEditorOpen(false);
          }}
          style={{ flex: 1 }}
        />
      ),
    [AgentCreator, editor, saveAgent, voices, onPreviewVoice],
  );
  const sortedChats = useMemo(
    () =>
      workspace.chats
        .filter((c) =>
          `${c.customTitle || c.title} ${workspace.agents
            .filter((a) => c.agentIds.includes(a.id))
            .map((a) => `${a.name} ${a.label}`)
            .join(' ')} ${c.messages[c.messages.length - 1]?.text ?? ''}`
            .toLocaleLowerCase()
            .includes(query.toLocaleLowerCase()),
        )
        .sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned)),
    [workspace.chats, workspace.agents, query],
  );
  const sidebar = (sidebarProps: SidebarProps) => (
    <ChatSidebar
      sidebarProps={sidebarProps}
      team={props.team}
      agents={workspace.agents}
      chats={sortedChats}
      activeId={workspace.activeId}
      pending={replies.pending}
      query={query}
      searchOpen={searchOpen}
      onQuery={setQuery}
      onSearch={setSearchOpen}
      onSelect={selectChat}
      onCreate={createAgent}
      onPicker={() => chooseAgents()}
      onMarketplace={() => {
        setMarketItem(null);
        setPanel('marketplace');
      }}
      onSettings={() => setPanel('settings')}
      onSupport={() => open('support')}
      onAction={(target, action) => {
        setTargetChatId(target.id);
        if (action === 'pin')
          update((s) => ({
            ...s,
            chats: s.chats.map((c) => (c.id === target.id ? { ...c, pinned: !c.pinned } : c)),
          }));
        if (action === 'rename') {
          setRename(target.customTitle || target.title);
          open('rename');
        }
        if (action === 'edit') {
          if (target.agentIds.length > 1) chooseAgents(target.agentIds, target.id);
          else {
            const agent = workspace.agents.find((a) => a.id === target.agentIds[0]);
            if (agent) edit(agent);
          }
        }
        if (action === 'copy') void copy(transcript(target), messages.conversationCopied);
        if (action === 'copy-id') void copy(target.id, messages.conversationIDCopied);
        if (action === 'remove') removeChat(target.id);
      }}
    />
  );
  const title =
    panel === 'picker'
      ? editingChatId
        ? messages.editGroup
        : messages.chatWithYourAgents
      : panel === 'rename'
        ? messages.renameChat
        : panel === 'marketplace'
          ? (marketItem?.name ?? messages.marketplace)
          : panel === 'support'
            ? messages.aLittleHelp
            : panel === 'settings'
              ? messages.settings
              : panel === 'navigation'
                ? messages.conversations
                : messages.conversationOptions;
  const messageActions = (id: string, text: string) => (
    <AgentReplyActions
      vote={feedback[id] ?? null}
      onVoteChange={(value) => setFeedback((s) => ({ ...s, [id]: value }))}
      onCopy={() => {
        void copy(text, messages.responseCopied);
      }}
    />
  );
  const column = [
    CHAT_CONTENT_STYLE,
    styles.column,
    chat?.messages.length ? styles.columnMessages : styles.columnEmpty,
  ];
  const conversation = (
    <Screen
      scroll="auto"
      bottomBarKeyboardBehavior="visible"
      contentClearance={0}
      accessibilityLabel={messages.agentConversation}
      header={
        <PageHeader
          testID={`${testID}-header`}
          titleAlign="center"
          safeArea={false}
          sticky={false}
          title={
            <AgentProfile
              agents={participants.map((agent) => ({ ...agent, avatar: agentCharacter(agent) }))}
              label={participants.length ? undefined : messages.chooseYourTeammates}
              accessibilityLabel={
                participants.length === 1
                  ? formatMessage(messages.editAgent, participants[0]!.name)
                  : messages.editConversationAgents
              }
              avatarRef={flights.anchor('profile')}
              expanded={
                participants.length === 1
                  ? editorOpen && editor?.id === participants[0]!.id
                  : panel === 'picker'
              }
              onPress={() =>
                participants.length === 1 ? edit(participants[0]!) : chooseAgents(chat?.agentIds)
              }
            />
          }
          leading={<ConversationMenuButton label={messages.openConversations} />}
          actions={
            <Button.Group accessibilityLabel={messages.conversationOptions}>
              <Button
                iconOnly
                leadingIcon={RiShare2Line}
                accessibilityLabel={messages.copyConversation}
                onPress={() => chat && void copy(transcript(chat), messages.conversationCopied)}
              />
              <D.DropdownMenu>
                <D.DropdownMenuTrigger asChild>
                  <Button
                    iconOnly
                    leadingIcon={RiMoreFill}
                    accessibilityLabel={messages.conversationOptions}
                  />
                </D.DropdownMenuTrigger>
                <D.DropdownMenuContent
                  label={messages.conversationOptions}
                  align="end"
                  style={{ borderRadius: 14, padding: 4 }}
                >
                  <D.DropdownMenuLabel>{messages.inThisConversation}</D.DropdownMenuLabel>
                  {participants.map((agent) => (
                    <D.DropdownMenuItem
                      key={agent.id}
                      onPress={() => edit(agent)}
                      leading={<AgentAvatar character={agentCharacter(agent)} size={20} />}
                    >
                      {formatMessage(messages.editAgent, agent.name)}
                    </D.DropdownMenuItem>
                  ))}
                  <D.DropdownMenuItem
                    onPress={() => chooseAgents(chat?.agentIds)}
                    leading={<RiGroupLine width={16} height={16} />}
                  >
                    {messages.startAGroupChat}
                  </D.DropdownMenuItem>
                </D.DropdownMenuContent>
              </D.DropdownMenu>
            </Button.Group>
          }
        />
      }
      bottomBar={
        chat ? (
          <PageFooter safeArea={false} scrim="auto">
            {chat && (
              <View style={[styles.composer, CHAT_CONTENT_STYLE]}>
                <ComposerPanel
                  status={null}
                  addMenu={composer.onAddMenuSelect ? undefined : []}
                  showVoice={!!composer.onVoiceStateChange}
                  {...composer}
                  value={drafts[chat.id] ?? ''}
                  onValueChange={(value) => setDrafts((s) => ({ ...s, [chat.id]: value }))}
                  onSubmit={(text) => {
                    void sendMessage(text);
                  }}
                  disabled={composer.disabled || !!replies.pending[chat.id]}
                  busy={!!replies.pending[chat.id]}
                  onStop={() => replies.stop(chat.id)}
                  providers={providers}
                  model={model}
                  onModelChange={setModel}
                  permission={permission}
                  onPermissionChange={setPermission}
                  effort={effort}
                  onEffortChange={setEffort}
                  style={[{ borderRadius: 20 }, composer.style]}
                />
              </View>
            )}
          </PageFooter>
        ) : undefined
      }
    >
      <ScreenScrollView
        ref={scroll}
        accessibilityLabel={messages.messages}
        style={{ flex: 1 }}
        contentContainerStyle={IS_WEB ? column : styles.scrollContent}
        scrollEventThrottle={16}
        onScroll={(event) => {
          const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
          follow.current = contentSize.height - contentOffset.y - layoutMeasurement.height < 100;
          if (chat) offsets.current[chat.id] = contentOffset.y;
        }}
        onContentSizeChange={() => {
          if (follow.current) scroll.current?.scrollToEnd({ animated: false });
        }}
      >
        <ScrollColumn style={column}>
          {!chat || !chat.messages.length ? (
            <View style={styles.empty}>
              <SelectedAgentPreview agents={participants} flights={flights} anchor="empty" />
              <View style={styles.emptyCopy}>
                <Text variant="title-3-semibold" style={{ textAlign: 'center' }}>
                  {participants.length > 1
                    ? messages.aFewMindsOneConversation
                    : participants[0]
                      ? formatMessage(messages.sayHelloTo, participants[0].name)
                      : messages.chatWithYourAgents}
                </Text>
                <Text
                  variant="body-regular"
                  style={{
                    maxWidth: 420,
                    textAlign: 'center',
                    color: tokens.mutedForeground,
                  }}
                >
                  {participants.length > 1
                    ? formatMessage(
                        messages.areHereSendAMessageToGet,
                        participants.map((a) => a.name).join(', '),
                      )
                    : (participants[0]?.description ?? messages.chooseAnAgentOrCreateYourOwn)}
                </Text>
              </View>
              {!chat && <Button onPress={() => chooseAgents()}>{messages.startChat}</Button>}
            </View>
          ) : (
            <View>
              {/* DOM block margins collapse; RN flex margins add. Keep the same 16px inter-row gap. */}
              <View style={styles.today}>
                <Text style={tokenStyles.today}>{messages.today}</Text>
              </View>
              {[
                ...chat.messages,
                ...(replies.thinking[chat.id] ? [replies.thinking[chat.id]!] : []),
              ].map((message) => {
                const agent = workspace.agents.find((a) => a.id === message.agentId);
                const text = formatDemoReply(message.text);
                if (message.role === 'user')
                  return (
                    <AgentChatMessage
                      key={message.id}
                      role="user"
                      text={message.text}
                      style={{ marginTop: 12, marginInlineEnd: 12, maxWidth: '90%' }}
                    />
                  );
                const thinking = replies.thinking[chat.id]?.id === message.id;
                return (
                  <AgentReply
                    key={message.id}
                    identity={
                      agent && (
                        <AgentReplyIdentity
                          character={agentCharacter(agent)}
                          name={agent.name}
                          thinking={thinking}
                          workingKey={replies.pending[chat.id] ?? agent.id}
                          avatarRef={thinking ? flights.anchor(`reply:${agent.id}`) : undefined}
                          avatarHidden={thinking && flights.isLanding(`reply:${agent.id}`)}
                          onPress={() => edit(agent)}
                          pressLabel={formatMessage(messages.editAgent, agent.name)}
                        />
                      )
                    }
                    actions={
                      !thinking &&
                      replies.streaming[chat.id] !== message.id &&
                      messageActions(message.id, text)
                    }
                  >
                    {!!text && (
                      <AgentReplyBubble>
                        <StreamedText text={text} paragraphs />
                      </AgentReplyBubble>
                    )}
                  </AgentReply>
                );
              })}
            </View>
          )}
        </ScrollColumn>
      </ScreenScrollView>
    </Screen>
  );
  return (
    <View
      {...directionProps}
      collapsable={false}
      style={[{ flex: 1, minHeight: 0, width: '100%', height: '100%' }, style]}
      testID={testID}
    >
      <AppShell
        testID={`${testID}-shell`}
        variant="dashboard"
        contentMaxWidth="none"
        header={null}
        scroll="fixed"
        panels
        navFrom="md"
        sidebar={{ variant: 'panel', collapsed: false, collapseDisabled: true, render: sidebar }}
        // As in AiChatShell: compact navigation waits beneath the conversation.
        drawer="reveal"
        drawerOpen={panel === 'navigation'}
        onDrawerOpenChange={(open) =>
          setPanel((current) => (open ? 'navigation' : current === 'navigation' ? null : current))
        }
        panelLayout={{
          mode: 'split',
          flow: 'bounded',
          activePanel: editorOpen ? 'editor' : 'conversation',
          panels: [
            { id: 'conversation', minWidth: 320, resizable: true, content: conversation },
            {
              id: 'editor',
              width: 340,
              minWidth: 280,
              maxWidth: 560,
              visible: editorOpen && !!editor,
              floating: {
                below: 1100,
                open: editorOpen,
                onOpenChange: setEditorOpen,
                label: messages.editAgentTitle,
              },
              content: editPanel,
            },
          ],
        }}
      />
      {!!replies.notice && (
        <Portal>
          <OverlayRoot
            zIndex={TOAST_LAYER_Z}
            style={{
              justifyContent: 'flex-end',
              alignItems: 'center',
              padding: 20,
            }}
          >
            <View pointerEvents="none" style={tokenStyles.notice}>
              <View style={styles.noticeRow}>
                <RiCheckLine width={16} height={16} fill={tokens.mutedForeground} />
                {/* A confirmation: a polite `status` (RN's Text drops `aria-live`
                    on native; the role is what reaches it). */}
                <Text role="status" style={tokenStyles.noticeText}>
                  {replies.notice}
                </Text>
              </View>
            </View>
          </OverlayRoot>
        </Portal>
      )}
      <Dialog
        control={surface}
        label={title}
        header={{ title, titleLayout: 'bar' }}
        maxWidth={panel === 'picker' ? 520 : 440}
        actions={
          panel === 'picker'
            ? [
                {
                  label: messages.pickerAction(!!editingChatId, selected.length),
                  disabled: !selected.length,
                  shouldCloseOnPress: false,
                  onPress: () => {
                    void startChat();
                  },
                },
              ]
            : panel === 'rename'
              ? [
                  {
                    label: messages.saveName,
                    disabled: !rename.trim(),
                    shouldCloseOnPress: false,
                    onPress: () => {
                      update((state) => ({
                        ...state,
                        chats: state.chats.map((entry) =>
                          entry.id === targetChat?.id
                            ? { ...entry, customTitle: rename.trim() }
                            : entry,
                        ),
                      }));
                      close();
                    },
                  },
                ]
              : undefined
        }
        onClose={() => setPanel((current) => (current === 'navigation' ? current : null))}
      >
        {panel === 'picker' ? (
          <SelectedAgentPreview
            caption
            agents={selected.flatMap(
              (id) => workspace.agents.find((agent) => agent.id === id) ?? [],
            )}
            flights={flights}
            anchor="picker"
          />
        ) : null}
        {panel === 'rename' && (
          <TextFieldInput
            label={messages.chatName}
            autoFocus
            value={rename}
            onChangeText={setRename}
            maxLength={100}
            onSubmitEditing={() => {
              if (!rename.trim()) return;
              update((s) => ({
                ...s,
                chats: s.chats.map((c) =>
                  c.id === targetChat?.id ? { ...c, customTitle: rename.trim() } : c,
                ),
              }));
              close();
            }}
          />
        )}
        {panel === 'picker' && (
          <View
            collapsable={false}
            style={styles.picker}
            role="group"
            accessibilityLabel={messages.chooseYourTeammates}
          >
            {workspace.agents.map((agent) => {
              const picked = selected.includes(agent.id);
              return (
                <Button
                  key={agent.id}
                  appearance="plain"
                  tone="neutral"
                  accessibilityLabel={agent.name}
                  pressed={picked}
                  onPress={() =>
                    setSelected((ids) =>
                      picked ? ids.filter((id) => id !== agent.id) : [...ids, agent.id],
                    )
                  }
                  style={[
                    {
                      height: 40,
                      maxWidth: '100%',
                      borderRadius: 999,
                      borderStyle: 'solid',
                      borderWidth: 1,
                      borderColor: picked ? tokens.mutedForeground : 'transparent',
                      backgroundColor: picked ? tokens.popover : tokens.surface,
                      boxShadow: 'none',
                      paddingInline: 8,
                      paddingStart: 8,
                      paddingEnd: 8,
                    },
                    IS_WEB && WEB_TRANSITION_COLORS,
                  ]}
                >
                  <View style={styles.pickerContent}>
                    <View style={styles.pickerLabel}>
                      <View style={styles.pickerAvatar} aria-hidden>
                        <AgentAvatar character={agentCharacter(agent)} size={24} />
                      </View>
                      <Text
                        style={picked ? tokenStyles.pickerName : tokenStyles.pickerNameIdle}
                        numberOfLines={1}
                      >
                        {agent.name}
                      </Text>
                    </View>
                  </View>
                </Button>
              );
            })}
          </View>
        )}
        {panel === 'options' && targetChat && (
          <View style={styles.options}>
            <Button
              appearance="plain"
              onPress={() => {
                update((s) => ({
                  ...s,
                  chats: s.chats.map((c) =>
                    c.id === targetChat.id ? { ...c, pinned: !c.pinned } : c,
                  ),
                }));
                close();
              }}
            >
              {targetChat.pinned ? messages.unpinChat : messages.pinChat}
            </Button>
            <Button
              appearance="plain"
              onPress={() => {
                setRename(targetChat.customTitle || targetChat.title);
                setPanel('rename');
              }}
            >
              {messages.renameChat}
            </Button>
            <Button
              appearance="plain"
              leadingIcon={RiGroupLine}
              onPress={() => chooseAgents(targetChat.agentIds, targetChat.id)}
            >
              {messages.editGroup}
            </Button>
            {targetChat.agentIds.map((id) => {
              const agent = workspace.agents.find((a) => a.id === id);
              return (
                agent && (
                  <Button
                    key={id}
                    appearance="plain"
                    onPress={() => {
                      close();
                      edit(agent);
                    }}
                  >
                    {formatMessage(messages.editAgent, agent.name)}
                  </Button>
                )
              );
            })}
            <Button
              appearance="plain"
              onPress={() => {
                void copy(transcript(targetChat), messages.conversationCopied);
              }}
            >
              {messages.copyConversation}
            </Button>
            <Button
              appearance="plain"
              onPress={() => {
                void copy(targetChat.id, messages.conversationIDCopied);
              }}
            >
              {messages.copyConversationID}
            </Button>
            <Button appearance="plain" onPress={() => removeChat(targetChat.id)}>
              {messages.removeChat}
            </Button>
          </View>
        )}
        {panel === 'support' && (
          <View style={{ gap: 16 }}>
            <SupportCopy text={messages.useToCreateABotOrStart} term="+" />
            <SupportCopy
              text={messages.openTheMarketplaceToExplorePluginsAnd}
              term={messages.marketplace}
            />
            <Text style={tokenStyles.supportText}>{messages.sendWithEnterUseShiftEnterFor}</Text>
          </View>
        )}
      </Dialog>
      {(panel === 'marketplace' || panel === 'settings') && (
        <Marketplace
          initialItem={marketItem?.id}
          defaultPage={panel === 'settings' ? 'general' : 'marketplace'}
          agents={workspace.agents}
          installedPlugins={workspace.installedPlugins ?? DEFAULT_PLUGINS}
          onClose={() => setPanel(null)}
          onCopy={copy}
          onChat={(id) => {
            setSelected([id]);
            const existing = workspace.chats.find(
              (c) => c.agentIds.length === 1 && c.agentIds[0] === id,
            );
            if (existing) selectChat(existing.id);
            else {
              const created = conversationFor(workspace.agents, [id], chatId('chat'));
              update((s) => ({
                ...s,
                chats: [created, ...s.chats],
                activeId: created.id,
              }));
            }
            setPanel(null);
          }}
          onAddBot={(item) => update((s) => addMarketplaceBot(s, item))}
          onTogglePlugin={(id) =>
            update((s) => {
              const installed = s.installedPlugins ?? DEFAULT_PLUGINS;
              return {
                ...s,
                installedPlugins: installed.includes(id)
                  ? installed.filter((value) => value !== id)
                  : [...installed, id],
              };
            })
          }
        />
      )}
      <AvatarFlightLayer flights={flights} />
    </View>
  );
}

/**
 * The conversation's column. On the web it is the scroll content itself; native's
 * scroll content takes the chrome's insets, so the column is a view inside it.
 */
function ScrollColumn({ style, children }: { style: StyleProp<ViewStyle>; children: ReactNode }) {
  return IS_WEB ? children : <View style={style}>{children}</View>;
}

function ConversationMenuButton({ label }: { label: string }) {
  const shell = useAppShell();
  if (!shell.drawerAvailable) return null;
  return (
    <Button.Group>
      <Button
        iconOnly
        leadingIcon={RiMenuLine}
        accessibilityLabel={label}
        aria-expanded={shell.drawerOpen}
        onPress={shell.toggleDrawer}
      />
    </Button.Group>
  );
}

const styles = StyleSheet.create({
  scrollContent: { flexGrow: 1 },
  column: { flexGrow: 1 },
  columnMessages: { paddingTop: 8, paddingBottom: 16 },
  columnEmpty: { alignItems: 'center', justifyContent: 'center', padding: 16 },
  composer: { padding: 4 },
  empty: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: '0%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingInline: 16,
    paddingBlock: 32,
  },
  emptyCopy: { flexDirection: 'column', alignItems: 'center', gap: 6 },
  // DOM block margins collapse; RN flex margins add. Keep the same 16px inter-row gap.
  today: { marginTop: 12, marginBottom: 4, alignItems: 'center', justifyContent: 'center' },
  noticeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  picker: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 },
  pickerContent: {
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingInline: 4,
  },
  pickerLabel: { minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 8 },
  pickerAvatar: { width: 24, height: 24, flexShrink: 0 },
  options: { gap: 8 },
});

const useTokenStyles = createTokenStyles((t) => ({
  today: {
    borderRadius: ROUNDED_FULL,
    backgroundColor: t.popover,
    paddingInline: 7,
    paddingBlock: 4,
    color: t.mutedForeground,
    lineHeight: stepLineHeight(18, 13),
    fontWeight: 500,
  },
  notice: {
    maxWidth: '100%',
    borderRadius: 12,
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: t.border,
    backgroundColor: t.card,
    paddingInline: 16,
    paddingBlock: 12,
    boxShadow: [
      { offsetX: 0, offsetY: 10, blurRadius: 15, spreadDistance: -3, color: '#0000001a' },
      { offsetX: 0, offsetY: 4, blurRadius: 6, spreadDistance: -4, color: '#0000001a' },
    ],
  },
  noticeText: { color: t.foreground, lineHeight: stepLineHeight(20, 14), fontWeight: 400 },
  pickerName: {
    overflow: 'hidden',
    color: t.foreground,
    lineHeight: stepLineHeight(20, 14),
    fontWeight: 500,
  },
  pickerNameIdle: {
    overflow: 'hidden',
    color: t.mutedForeground,
    lineHeight: stepLineHeight(20, 14),
    fontWeight: 500,
  },
  supportText: { color: t.mutedForeground, lineHeight: stepLineHeight(20, 14), fontWeight: 400 },
}));
