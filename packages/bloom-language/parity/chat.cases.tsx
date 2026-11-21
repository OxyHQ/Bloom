import { StoryRing, TypingDots } from '@oxy.so/bloom/chat-indicators';
import {
  ChatFolderTabs,
  ChatSearchField,
  ChatSearchResults,
  StoriesRow,
} from '@oxy.so/bloom/chat-list';
import {
  ChatBackground,
  ChatDateHeader,
  ChatEmptyState,
  ChatHeader,
  ChatInfoPanel,
  PinnedMessageBar,
  ScrollToBottomButton,
} from '@oxy.so/bloom/chat-screen';
import {
  ContactMessage,
  DocumentGrid,
  FileMessage,
  GifMessage,
  ImageMessage,
  LocationMessage,
  PollMessage,
  SharedMediaGrid,
  StickerMessage,
  VideoMessage,
  VoiceMessage,
} from '@oxy.so/bloom/message-media';
import { withAlpha } from '@oxy.so/bloom/theme';
import { Text } from '@oxy.so/bloom/typography';

import { ENUMS } from '../src/generated/spec.generated';
import * as L from '../src/index';
import { toElement } from '../src/render';
import { type ParityCase, Themed } from './support/cases';

const press = () => {};
const set = () => {};
const PHOTO = 'https://cdn.oxy.so/p.jpg';
const PINS = [
  { id: 'a', preview: 'Meet at 6', author: 'Ana' },
  { id: 'b', preview: 'Bring the map' },
];
const FOLDERS = [
  { key: 'all', label: 'All', unreadCount: 3 },
  { key: 'work', label: 'Work', muted: true },
];
const RESULTS = [
  { id: 'r1', kind: 'chat' as const, name: 'Ana Lima', detail: 'See you', time: '9:41' },
];
const STORIES = [
  { id: 's1', name: 'Ana', state: 'unseen' as const },
  { id: 's2', name: 'Bo', state: 'seen' as const },
];
const POLL = [
  { id: 'a', label: 'Lisbon', votes: 3 },
  { id: 'b', label: 'Porto', votes: 1 },
];
const SHARED = [
  { id: 'a', source: PHOTO },
  { id: 'b', source: PHOTO, kind: 'video' as const, duration: 12 },
  { id: 'c', source: PHOTO },
];
const DOCS = [{ id: 'd', name: 'plan.pdf', kind: 'pdf' as const, sizeBytes: 120_000 }];
const SAMPLES = [0.2, 0.5, 0.9, 0.4, 0.7, 0.3];

const screen: ParityCase[] = [
  ...ENUMS.chatBackgroundStyle.map((variant) => ({
    name: `ChatBackground ${variant}`,
    language: () =>
      toElement(
        L.ChatBackground(L.Text('Messages'), {
          source: variant === 'image' ? PHOTO : undefined,
          overlayOpacity: '40',
        }).style(variant),
      ),
    bloom: () => (
      <ChatBackground
        variant={variant}
        source={variant === 'image' ? PHOTO : undefined}
        overlayOpacity={0.4}
      >
        <Text>Messages</Text>
      </ChatBackground>
    ),
  })),
  {
    name: 'ChatBackground tinted',
    language: () => toElement(L.ChatBackground().style('pattern').tint('primary/half')),
    bloom: () => (
      <Themed>
        {(c) => <ChatBackground variant="pattern" tint={withAlpha(c.primary, 0.5)} />}
      </Themed>
    ),
  },
  ...ENUMS.chatDateHeaderStyle.map((placement) => ({
    name: `ChatDateHeader ${placement}`,
    language: () => toElement(L.ChatDateHeader('Today', { offset: 'sm' }).style(placement)),
    bloom: () => <ChatDateHeader label="Today" offset={8} placement={placement} />,
  })),
  {
    name: 'ChatEmptyState',
    language: () =>
      toElement(
        L.ChatEmptyState({
          title: 'No messages',
          description: 'Say hello',
          action: L.Button(L.Text('Wave')).onPress(press),
        }),
      ),
    bloom: () => (
      <ChatEmptyState
        title="No messages"
        description="Say hello"
        action={toElement(L.Button(L.Text('Wave')).onPress(press))}
      />
    ),
  },
  {
    name: 'ChatHeader',
    language: () =>
      toElement(
        L.ChatHeader('Ana Lima', {
          status: 'online',
          avatarName: 'Ana Lima',
          onPressBack: press,
          onPressCall: press,
          marker: 'verified',
        }),
      ),
    bloom: () => (
      <ChatHeader
        title="Ana Lima"
        status="online"
        avatarName="Ana Lima"
        onPressBack={press}
        onPressCall={press}
        marker="verified"
      />
    ),
  },
  ...ENUMS.chatStatusTone.map((tone) => ({
    name: `ChatHeader status ${tone}, an avatar size, an accessory`,
    language: () =>
      toElement(
        L.ChatHeader('Ana Lima', {
          status: 'typing…',
          avatarSize: '36',
          accessory: L.Text('★'),
        }).tint(tone),
      ),
    bloom: () => (
      <ChatHeader
        title="Ana Lima"
        status="typing…"
        avatarSize={36}
        accessory={<Text>★</Text>}
        statusTone={tone}
      />
    ),
  })),
  ...ENUMS.chatInfoPanelStyle.map((variant) => ({
    name: `ChatInfoPanel ${variant}`,
    language: () =>
      toElement(
        L.ChatInfoPanel({ name: 'Ana Lima', handle: 'ana', bio: 'Maps', width: '320' }).style(
          variant,
        ),
      ),
    bloom: () => (
      <ChatInfoPanel name="Ana Lima" handle="ana" bio="Maps" width={320} variant={variant} />
    ),
  })),
  {
    name: 'PinnedMessageBar',
    language: () => toElement(L.PinnedMessageBar(PINS, { index: 1, onPressPin: set })),
    bloom: () => <PinnedMessageBar pins={PINS} index={1} onPressPin={set} />,
  },
  {
    name: 'ScrollToBottomButton',
    language: () =>
      toElement(L.ScrollToBottomButton({ unreadCount: 4, size: '44' }).onPress(press)),
    bloom: () => <ScrollToBottomButton unreadCount={4} size={44} onPress={press} />,
  },
];

const list: ParityCase[] = [
  {
    name: 'ChatFolderTabs',
    language: () => toElement(L.ChatFolderTabs(FOLDERS, { value: 'all' }).label('Folders')),
    bloom: () => <ChatFolderTabs folders={FOLDERS} value="all" accessibilityLabel="Folders" />,
  },
  {
    name: 'ChatFolderTabs spaced, padded, a divider',
    language: () =>
      toElement(
        L.ChatFolderTabs(FOLDERS, { paddingHorizontal: 'lg', divider: true })
          .spacing('sm')
          .label('Folders'),
      ),
    bloom: () => (
      <ChatFolderTabs
        folders={FOLDERS}
        paddingHorizontal={16}
        divider
        gap={8}
        accessibilityLabel="Folders"
      />
    ),
  },
  {
    name: 'ChatSearchField',
    language: () =>
      toElement(L.ChatSearchField(['ana', set], { placeholder: 'Search', onClear: press })),
    bloom: () => (
      <ChatSearchField value="ana" onChangeText={set} placeholder="Search" onClear={press} />
    ),
  },
  {
    name: 'ChatSearchResults',
    language: () => toElement(L.ChatSearchResults('ana', RESULTS, { onResultPress: set })),
    bloom: () => <ChatSearchResults query="ana" results={RESULTS} onResultPress={set} />,
  },
  {
    name: 'ChatSearchResults loading',
    language: () => toElement(L.ChatSearchResults('ana', [], { loading: true, loadingCount: 2 })),
    bloom: () => <ChatSearchResults query="ana" results={[]} loading loadingCount={2} />,
  },
  {
    name: 'StoriesRow',
    language: () =>
      toElement(L.StoriesRow(STORIES, { onStoryPress: set, size: '56' }).spacing('md')),
    bloom: () => <StoriesRow stories={STORIES} onStoryPress={set} size={56} gap={12} />,
  },
  ...(['unseen', 'seen', 'none'] as const).map((state) => ({
    name: `StoryRing ${state}`,
    language: () =>
      toElement(L.StoryRing(L.Avatar(null, { name: 'Ana Lima' }), { size: '48', state })),
    bloom: () => (
      <StoryRing size={48} state={state}>
        {toElement(L.Avatar(null, { name: 'Ana Lima' }))}
      </StoryRing>
    ),
  })),
  {
    name: 'StoryRing pressable, a ring of its own, a badge',
    language: () =>
      toElement(
        L.StoryRing(L.Avatar(null, { name: 'Ana Lima' }), {
          size: '56',
          thickness: '3',
          gap: '3',
          badge: L.Text('+'),
        })
          .onPress(press)
          .label('Ana’s story'),
      ),
    bloom: () => (
      <StoryRing
        size={56}
        thickness={3}
        gap={3}
        badge={<Text>+</Text>}
        onPress={press}
        accessibilityLabel="Ana’s story"
      >
        {toElement(L.Avatar(null, { name: 'Ana Lima' }))}
      </StoryRing>
    ),
  },
];

const media: ParityCase[] = [
  ...ENUMS.messageTone.map((tone) => ({
    name: `ContactMessage ${tone}`,
    language: () =>
      toElement(L.ContactMessage('Ana Lima', { detail: '+351 912', onMessage: press }).tint(tone)),
    bloom: () => <ContactMessage name="Ana Lima" detail="+351 912" onMessage={press} tone={tone} />,
  })),
  {
    name: 'ContactMessage on a bubble of its own',
    language: () =>
      toElement(
        L.ContactMessage('Ana Lima', { width: '256', radius: 'lg' })
          .bubbleTint('primary')
          .contentTint('onPrimary'),
      ),
    bloom: () => (
      <Themed>
        {(c) => (
          <ContactMessage
            name="Ana Lima"
            width={256}
            radius={16}
            bubbleColor={c.primary}
            onColor={c.primaryForeground}
          />
        )}
      </Themed>
    ),
  },
  {
    name: 'DocumentGrid',
    language: () => toElement(L.DocumentGrid(DOCS, { onPressItem: set })),
    bloom: () => <DocumentGrid items={DOCS} onPressItem={set} />,
  },
  ...ENUMS.fileMessageStyle.map((variant) => ({
    name: `FileMessage ${variant}`,
    language: () =>
      toElement(
        L.FileMessage('plan.pdf', {
          kind: 'pdf',
          sizeBytes: 120_000,
          progress: 0.5,
          transfer: 'downloading',
        }).style(variant),
      ),
    bloom: () => (
      <FileMessage
        name="plan.pdf"
        kind="pdf"
        sizeBytes={120_000}
        progress={0.5}
        transfer="downloading"
        variant={variant}
      />
    ),
  })),
  {
    name: 'GifMessage',
    language: () =>
      toElement(L.GifMessage(PHOTO, { aspectRatio: 1.5, maxWidth: '256' }).tint('outgoing')),
    bloom: () => <GifMessage source={PHOTO} aspectRatio={1.5} maxWidth={256} tone="outgoing" />,
  },
  {
    name: 'ImageMessage with a caption and a placeholder colour',
    language: () =>
      toElement(
        L.ImageMessage(PHOTO, { aspectRatio: 1, caption: L.Text('The view') }).placeholderTint(
          'mutedFill',
        ),
      ),
    bloom: () => (
      <Themed>
        {(c) => (
          <ImageMessage
            source={PHOTO}
            aspectRatio={1}
            caption={<Text>The view</Text>}
            placeholderColor={c.contrast50}
          />
        )}
      </Themed>
    ),
  },
  {
    name: 'ImageMessage a spoiler, failed',
    language: () =>
      toElement(L.ImageMessage(PHOTO, { spoiler: true, state: 'failed', onRetry: press })),
    bloom: () => <ImageMessage source={PHOTO} spoiler state="failed" onRetry={press} />,
  },
  {
    name: 'LocationMessage live',
    language: () =>
      toElement(
        L.LocationMessage({
          title: 'Ana',
          address: 'Rua Augusta',
          live: true,
          renderMap: () => L.Text('Map'),
          mapHeight: '120',
        }),
      ),
    bloom: () => (
      <LocationMessage
        title="Ana"
        address="Rua Augusta"
        live
        renderMap={() => <Text>Map</Text>}
        mapHeight={120}
      />
    ),
  },
  {
    name: 'PollMessage',
    language: () => toElement(L.PollMessage('Where to?', POLL, { totalVotes: 4, onVote: set })),
    bloom: () => <PollMessage question="Where to?" options={POLL} totalVotes={4} onVote={set} />,
  },
  {
    name: 'PollMessage voted, a quiz',
    language: () =>
      toElement(L.PollMessage('Capital?', POLL, { voted: true, quiz: true, showResults: true })),
    bloom: () => <PollMessage question="Capital?" options={POLL} voted quiz showResults />,
  },
  {
    name: 'SharedMediaGrid',
    language: () =>
      toElement(L.SharedMediaGrid(SHARED, { width: '320', maxItems: 2 }).columns(3).spacing('2xs')),
    bloom: () => <SharedMediaGrid items={SHARED} width={320} maxItems={2} columns={3} gap={2} />,
  },
  {
    name: 'StickerMessage',
    language: () => toElement(L.StickerMessage(PHOTO, { size: '128' })),
    bloom: () => <StickerMessage source={PHOTO} size={128} />,
  },
  ...ENUMS.videoMessageStyle.map((variant) => ({
    name: `VideoMessage ${variant}`,
    language: () => toElement(L.VideoMessage(PHOTO, { duration: 42, width: '256' }).style(variant)),
    bloom: () => <VideoMessage source={PHOTO} duration={42} width={256} variant={variant} />,
  })),
  {
    name: 'VoiceMessage',
    language: () => toElement(L.VoiceMessage(SAMPLES, 12, { position: 4, onPlayPress: press })),
    bloom: () => <VoiceMessage samples={SAMPLES} duration={12} position={4} onPlayPress={press} />,
  },
  {
    name: 'VoiceMessage outgoing, a transcript',
    language: () =>
      toElement(
        L.VoiceMessage(SAMPLES, 12, { transcript: 'See you at six', transcriptOpen: true }).tint(
          'outgoing',
        ),
      ),
    bloom: () => (
      <VoiceMessage
        samples={SAMPLES}
        duration={12}
        transcript="See you at six"
        transcriptOpen
        tone="outgoing"
      />
    ),
  },
];

/** The typing dots pulse on the JS thread: compared by Jest as they mount, left out of the story. */
export const CHAT_CASES_MOVING: ParityCase[] = [
  {
    name: 'TypingDots',
    language: () => toElement(L.TypingDots({ label: 'Ana is typing' })),
    bloom: () => <TypingDots label="Ana is typing" />,
  },
  {
    name: 'TypingDots sized, tinted',
    language: () => toElement(L.TypingDots({ size: '6' }).tint('primary')),
    bloom: () => <Themed>{(c) => <TypingDots size={6} color={c.primary} />}</Themed>,
  },
];

export const CHAT_CASES: ParityCase[] = [...screen, ...list, ...media];
