import {
  type ChatFolder,
  ChatFolderTabs as BloomChatFolderTabs,
  type ChatFolderTabsProps,
  ChatSearchField as BloomChatSearchField,
  type ChatSearchFieldProps,
  type ChatSearchResult,
  ChatSearchResults as BloomChatSearchResults,
  type ChatSearchResultsProps,
  StoriesRow as BloomStoriesRow,
  type StoriesRowProps,
  type StoryEntry,
} from '@oxy.so/bloom/chat-list';
import {
  StoryRing as BloomStoryRing,
  type StoryRingProps,
  TypingDots as BloomTypingDots,
  type TypingDotsProps,
} from '@oxy.so/bloom/chat-indicators';
import {
  ChatBackground as BloomChatBackground,
  type ChatBackgroundProps,
  ChatDateHeader as BloomChatDateHeader,
  type ChatDateHeaderProps,
  ChatEmptyState as BloomChatEmptyState,
  type ChatEmptyStateProps,
  ChatHeader as BloomChatHeader,
  type ChatHeaderProps,
  ChatInfoPanel as BloomChatInfoPanel,
  type ChatInfoPanelProps,
  type ChatPinnedMessage,
  PinnedMessageBar as BloomPinnedMessageBar,
  type PinnedMessageBarProps,
  ScrollToBottomButton as BloomScrollToBottomButton,
  type ScrollToBottomButtonProps,
} from '@oxy.so/bloom/chat-screen';
import {
  ContactMessage as BloomContactMessage,
  type ContactMessageProps,
  DocumentGrid as BloomDocumentGrid,
  type DocumentGridItem,
  type DocumentGridProps,
  FileMessage as BloomFileMessage,
  type FileMessageProps,
  GifMessage as BloomGifMessage,
  type GifMessageProps,
  ImageMessage as BloomImageMessage,
  type ImageMessageProps,
  LocationMessage as BloomLocationMessage,
  type LocationMessageProps,
  type MessageMediaSource,
  PollMessage as BloomPollMessage,
  type PollMessageProps,
  type PollOption,
  SharedMediaGrid as BloomSharedMediaGrid,
  type SharedMediaGridProps,
  type SharedMediaItem,
  StickerMessage as BloomStickerMessage,
  type StickerMessageProps,
  VideoMessage as BloomVideoMessage,
  type VideoMessageProps,
  VoiceMessage as BloomVoiceMessage,
  type VoiceMessageProps,
} from '@oxy.so/bloom/message-media';

import type { Binding } from '../binding';
import { OPACITY } from '../generated/spec.generated';
import { type Child, Node, type ViewModifiers } from '../node';
import type {
  ChatBackgroundStyle,
  ChatDateHeaderStyle,
  ChatInfoPanelStyle,
  ChatStatusTone,
  ColorToken,
  InkToken,
  ControlDensity,
  DismissIcon,
  FileMessageStyle,
  MessageTone,
  OpacityName,
  SpaceToken,
  HeaderPresentation,
  TitleAlign,
  TitleAppearance,
  TitleLayout,
  VideoMessageStyle,
} from '../tokens';
import type { ControlDraw, ControlRenderer } from './draw';
import { type CornerToken, length, product, type ProductSpec } from './product';

/** The person-to-person chat families: the screen's parts, the list's parts, the indicators and the media in a bubble. */
export type ChatKind =
  | 'chatBackground'
  | 'chatDateHeader'
  | 'chatEmptyState'
  | 'chatHeader'
  | 'chatInfoPanel'
  | 'pinnedMessageBar'
  | 'scrollToBottomButton'
  | 'chatFolderTabs'
  | 'chatSearchField'
  | 'chatSearchResults'
  | 'storiesRow'
  | 'storyRing'
  | 'typingDots'
  | 'contactMessage'
  | 'documentGrid'
  | 'fileMessage'
  | 'gifMessage'
  | 'imageMessage'
  | 'locationMessage'
  | 'pollMessage'
  | 'sharedMediaGrid'
  | 'stickerMessage'
  | 'videoMessage'
  | 'voiceMessage';

type Drawn = 'style' | 'testID' | 'accessibilityLabel';
/** Lengths, corners and opacities a node takes as tokens instead of Bloom's numbers. */
type Tokens<P, L extends keyof P = never, C extends keyof P = never> = Omit<P, L | C> & {
  readonly [K in L]?: SpaceToken;
} & { readonly [K in C]?: CornerToken };
/** What a bubble's media leaves to modifiers: its side and its colours. */
type Bubble = 'tone' | 'onColor' | 'bubbleColor';

export type ChatBackgroundOptions = Omit<
  ChatBackgroundProps,
  Drawn | 'variant' | 'tint' | 'colors' | 'children' | 'overlayOpacity' | 'patternOpacity'
> & { readonly overlayOpacity?: OpacityName; readonly patternOpacity?: OpacityName };
export type ChatDateHeaderOptions = Tokens<
  Omit<ChatDateHeaderProps, Drawn | 'textStyle' | 'label' | 'placement'>,
  'offset'
>;
export type ChatEmptyStateOptions = Omit<ChatEmptyStateProps, Drawn | 'illustration' | 'action'> & {
  readonly illustration?: Child;
  readonly action?: Child;
};
type ChatHeaderSlots = 'avatar' | 'accessory' | 'actions' | 'selectionActions';
/** What a chat header leaves to modifiers: its look. */
type ChatHeaderLook =
  | 'statusTone'
  | 'presentation'
  | 'titleAlign'
  | 'titleLayout'
  | 'titleAppearance'
  | 'compact'
  | 'divider';
export type ChatHeaderOptions = Tokens<
  Omit<ChatHeaderProps, Drawn | 'title' | ChatHeaderLook | ChatHeaderSlots>,
  'avatarSize'
> & { readonly [K in ChatHeaderSlots]?: Child };
type ChatInfoSlots = 'headerActions' | 'cover' | 'avatar' | 'settings';
/** Bloom `ChatInfoPanel`'s data; `content` is what it shows under its sections (Bloom's children). */
export type ChatInfoPanelOptions = Tokens<
  Omit<ChatInfoPanelProps, Drawn | 'contentStyle' | 'variant' | 'children' | ChatInfoSlots>,
  'width' | 'coverHeight' | 'avatarSize'
> & { readonly [K in ChatInfoSlots]?: Child } & { readonly content?: Child };
export type PinnedMessageBarOptions = Omit<PinnedMessageBarProps, Drawn | 'pins' | 'dismissIcon'>;
export type ScrollToBottomButtonOptions = Tokens<
  Omit<ScrollToBottomButtonProps, Drawn | 'onPress'>,
  'size'
>;
export type ChatFolderTabsOptions = Tokens<
  Omit<ChatFolderTabsProps, Drawn | 'folders' | 'gap' | 'divider'>,
  'paddingHorizontal'
>;
export type ChatSearchFieldOptions = Omit<
  ChatSearchFieldProps,
  Drawn | 'value' | 'onChangeText' | 'trailing'
> & { readonly trailing?: Child };
export type ChatSearchResultsOptions = Omit<ChatSearchResultsProps, Drawn | 'query' | 'results'>;
export type StoriesRowOptions = Tokens<
  Omit<StoriesRowProps, Drawn | 'stories' | 'gap'>,
  'size' | 'paddingHorizontal'
>;
/** Bloom `StoryRing`'s data; its edge (`size`, required as Bloom's is) and ring are space tokens. */
export type StoryRingOptions = Omit<
  StoryRingProps,
  Drawn | 'children' | 'onPress' | 'colors' | 'badge' | 'size' | 'thickness' | 'gap'
> & {
  readonly size: SpaceToken;
  readonly thickness?: SpaceToken;
  readonly gap?: SpaceToken;
  readonly badge?: Child;
};
export type TypingDotsOptions = Tokens<
  Omit<TypingDotsProps, Drawn | 'labelStyle' | 'color'>,
  'size'
>;
export type ContactMessageOptions = Tokens<
  Omit<ContactMessageProps, Drawn | Bubble | 'name'>,
  'width',
  'radius'
>;
export type DocumentGridOptions = Omit<DocumentGridProps, Drawn | 'items' | 'divider'>;
export type FileMessageOptions = Tokens<
  Omit<FileMessageProps, Drawn | Bubble | 'name' | 'variant'>,
  'width',
  'radius'
>;
type Media = Bubble | 'source' | 'placeholderColor';
export type GifMessageOptions = Tokens<
  Omit<GifMessageProps, Drawn | Media>,
  'maxWidth' | 'maxHeight',
  'radius'
>;
export type ImageMessageOptions = Tokens<
  Omit<ImageMessageProps, Drawn | Media | 'caption'>,
  'maxWidth' | 'maxHeight',
  'radius'
> & { readonly caption?: Child };
export type LocationMessageOptions = Tokens<
  Omit<LocationMessageProps, Drawn | Bubble | 'renderMap'>,
  'width' | 'mapHeight',
  'radius'
> & { readonly renderMap?: (size: { width: number; height: number }) => Child };
export type PollMessageOptions = Tokens<
  Omit<PollMessageProps, Drawn | Bubble | 'question' | 'options'>,
  'width',
  'radius'
>;
export type SharedMediaGridOptions = Tokens<
  Omit<SharedMediaGridProps, Drawn | 'items' | 'columns' | 'gap'>,
  'width',
  'radius'
>;
export type StickerMessageOptions = Tokens<
  Omit<StickerMessageProps, Drawn | Bubble | 'source'>,
  'size'
>;
export type VideoMessageOptions = Tokens<
  Omit<VideoMessageProps, Drawn | Media | 'variant'>,
  'width',
  'radius'
>;
export type VoiceMessageOptions = Tokens<
  Omit<VoiceMessageProps, Drawn | Bubble | 'samples' | 'duration'>,
  'width'
>;

/** A bubble's media: its side and its colours. */
interface InBubble<Self> {
  /** `incoming` (default) or `outgoing`: the side of the conversation it is on. */
  tint(value: MessageTone): Self;
  /** The bubble's fill it sits on, when it is not Bloom's. */
  bubbleTint(value: ColorToken): Self;
  /** What is drawn on the bubble (text, icons), when it is not Bloom's. */
  contentTint(value: ColorToken): Self;
}
/** Media drawn before it loads in a colour of its own. */
interface Placeheld<Self> extends InBubble<Self> {
  placeholderTint(value: ColorToken): Self;
}

export interface ChatBackgroundView extends ViewModifiers<ChatBackgroundView> {
  /** `plain`, `pattern`, `gradient` or `image`. */
  style(value: ChatBackgroundStyle): ChatBackgroundView;
  tint(value: ColorToken): ChatBackgroundView;
  /** The `gradient` style's stops, two or more: colour roles or an app's own colours. */
  gradient(colors: readonly [InkToken, InkToken, ...InkToken[]]): ChatBackgroundView;
}
export interface ChatDateHeaderView extends ViewModifiers<ChatDateHeaderView> {
  /** `floating` over the scroll, or `inline` in it. */
  style(value: ChatDateHeaderStyle): ChatDateHeaderView;
}
export type ChatEmptyStateView = ViewModifiers<ChatEmptyStateView>;
export interface ChatHeaderView extends ViewModifiers<ChatHeaderView> {
  /** The status line's tone: `muted` (default) or `accent`. */
  tint(value: ChatStatusTone): ChatHeaderView;
  /** Bloom's header presentation: `floating` (default) islands, a `bar`, or the `navigation` bar. */
  presentation(value: HeaderPresentation): ChatHeaderView;
  /** Where the avatar and title sit: `start` (default) or `center`. */
  titleAlign(value: TitleAlign): ChatHeaderView;
  /** The title and status on one line (`inline`, default) or two (`stacked`). */
  titleLayout(value: TitleLayout): ChatHeaderView;
  /** The title as text (`plain`, default) or in a `capsule`. */
  titleAppearance(value: TitleAppearance): ChatHeaderView;
  /** `compact` gutters, or `default`; with neither, the window's width decides. */
  density(value: ControlDensity): ChatHeaderView;
  /** The bar presentation's bottom hairline: drawn by default. */
  dividers(value?: boolean): ChatHeaderView;
}
export interface ChatInfoPanelView extends ViewModifiers<ChatInfoPanelView> {
  /** A `pane` beside the chat, or a `screen` of its own. */
  style(value: ChatInfoPanelStyle): ChatInfoPanelView;
}
export interface PinnedMessageBarView extends ViewModifiers<PinnedMessageBarView> {
  /** Its dismiss button's glyph: `close` the bar or `unpin`. */
  dismissIcon(value: DismissIcon): PinnedMessageBarView;
}
export type ScrollToBottomButtonView = ViewModifiers<ScrollToBottomButtonView>;
export interface ChatFolderTabsView extends ViewModifiers<ChatFolderTabsView> {
  spacing(value: SpaceToken): ChatFolderTabsView;
  /** The hairline under the tabs. */
  dividers(value?: boolean): ChatFolderTabsView;
}
export type ChatSearchFieldView = ViewModifiers<ChatSearchFieldView>;
export type ChatSearchResultsView = ViewModifiers<ChatSearchResultsView>;
export interface StoriesRowView extends ViewModifiers<StoriesRowView> {
  spacing(value: SpaceToken): StoriesRowView;
}
export interface StoryRingView extends ViewModifiers<StoryRingView> {
  /** The ring's colours: one for a solid ring, two or more for a gradient (roles or an app's own colours). */
  gradient(colors: readonly [InkToken, ...InkToken[]]): StoryRingView;
}
export interface TypingDotsView extends ViewModifiers<TypingDotsView> {
  tint(value: ColorToken): TypingDotsView;
}
export interface ContactMessageView
  extends ViewModifiers<ContactMessageView>,
    InBubble<ContactMessageView> {}
export interface DocumentGridView extends ViewModifiers<DocumentGridView> {
  /** The hairlines between its rows. */
  dividers(value?: boolean): DocumentGridView;
}
export interface FileMessageView extends ViewModifiers<FileMessageView>, InBubble<FileMessageView> {
  /** `bubble` (default) or `compact`. */
  style(value: FileMessageStyle): FileMessageView;
}
export interface GifMessageView extends ViewModifiers<GifMessageView>, Placeheld<GifMessageView> {}
export interface ImageMessageView
  extends ViewModifiers<ImageMessageView>,
    Placeheld<ImageMessageView> {}
export interface LocationMessageView
  extends ViewModifiers<LocationMessageView>,
    InBubble<LocationMessageView> {}
export interface PollMessageView
  extends ViewModifiers<PollMessageView>,
    InBubble<PollMessageView> {}
export interface SharedMediaGridView extends ViewModifiers<SharedMediaGridView> {
  columns(value: number): SharedMediaGridView;
  spacing(value: SpaceToken): SharedMediaGridView;
}
export interface StickerMessageView
  extends ViewModifiers<StickerMessageView>,
    InBubble<StickerMessageView> {}
export interface VideoMessageView
  extends ViewModifiers<VideoMessageView>,
    Placeheld<VideoMessageView> {
  /** `thumbnail` (default) or a round `videoNote`. */
  style(value: VideoMessageStyle): VideoMessageView;
}
export interface VoiceMessageView
  extends ViewModifiers<VoiceMessageView>,
    InBubble<VoiceMessageView> {}

const node = (kind: ChatKind, props: object, children: Child[] = []) =>
  new Node(kind, props, children);

export function ChatBackground(
  content?: Child,
  options: ChatBackgroundOptions = {},
): ChatBackgroundView {
  return node('chatBackground', { options }, content === undefined ? [] : [content]);
}
export function ChatDateHeader(
  label: string,
  options: ChatDateHeaderOptions = {},
): ChatDateHeaderView {
  return node('chatDateHeader', { label, options });
}
export function ChatEmptyState(options: ChatEmptyStateOptions = {}): ChatEmptyStateView {
  return node('chatEmptyState', { options });
}
export function ChatHeader(title: string, options: ChatHeaderOptions = {}): ChatHeaderView {
  return node('chatHeader', { title, options });
}
export function ChatInfoPanel(options: ChatInfoPanelOptions = {}): ChatInfoPanelView {
  const { content, ...rest } = options;
  return node('chatInfoPanel', { options: rest }, content === undefined ? [] : [content]);
}
export function PinnedMessageBar(
  pins: readonly ChatPinnedMessage[],
  options: PinnedMessageBarOptions = {},
): PinnedMessageBarView {
  return node('pinnedMessageBar', { pins, options });
}
/** Bloom `ScrollToBottomButton`; `.onPress()` scrolls. */
export function ScrollToBottomButton(
  options: ScrollToBottomButtonOptions = {},
): ScrollToBottomButtonView {
  return node('scrollToBottomButton', { options });
}
/** Bloom `ChatFolderTabs`; `.label()` names the tab list (Bloom requires it). */
export function ChatFolderTabs(
  folders: readonly ChatFolder[],
  options: ChatFolderTabsOptions = {},
): ChatFolderTabsView {
  return node('chatFolderTabs', { folders, options });
}
/** Bloom `ChatSearchField`, writing the query the binding holds. */
export function ChatSearchField(
  query: Binding<string>,
  options: ChatSearchFieldOptions = {},
): ChatSearchFieldView {
  return node('chatSearchField', { binding: query, options });
}
export function ChatSearchResults(
  query: string,
  results: readonly ChatSearchResult[],
  options: ChatSearchResultsOptions = {},
): ChatSearchResultsView {
  return node('chatSearchResults', { query, results, options });
}
export function StoriesRow(
  stories: readonly StoryEntry[],
  options: StoriesRowOptions = {},
): StoriesRowView {
  return node('storiesRow', { stories, options });
}
/** Bloom `StoryRing` round `content` (an avatar); `.onPress()` opens the story. */
export function StoryRing(content: Child, options: StoryRingOptions): StoryRingView {
  return node('storyRing', { options }, [content]);
}
export function TypingDots(options: TypingDotsOptions = {}): TypingDotsView {
  return node('typingDots', { options });
}
export function ContactMessage(
  name: string,
  options: ContactMessageOptions = {},
): ContactMessageView {
  return node('contactMessage', { name, options });
}
export function DocumentGrid(
  items: readonly DocumentGridItem[],
  options: DocumentGridOptions = {},
): DocumentGridView {
  return node('documentGrid', { items, options });
}
export function FileMessage(name: string, options: FileMessageOptions = {}): FileMessageView {
  return node('fileMessage', { name, options });
}
export function GifMessage(
  source: MessageMediaSource,
  options: GifMessageOptions = {},
): GifMessageView {
  return node('gifMessage', { source, options });
}
export function ImageMessage(
  source: MessageMediaSource,
  options: ImageMessageOptions = {},
): ImageMessageView {
  return node('imageMessage', { source, options });
}
export function LocationMessage(options: LocationMessageOptions = {}): LocationMessageView {
  return node('locationMessage', { options });
}
/** Bloom `PollMessage`: its question and its options (Bloom's `options`). */
export function PollMessage(
  question: string,
  choices: readonly PollOption[],
  options: PollMessageOptions = {},
): PollMessageView {
  return node('pollMessage', { question, options: { ...options, options: choices } });
}
export function SharedMediaGrid(
  items: readonly SharedMediaItem[],
  options: SharedMediaGridOptions = {},
): SharedMediaGridView {
  return node('sharedMediaGrid', { items, options });
}
export function StickerMessage(
  source: MessageMediaSource,
  options: StickerMessageOptions = {},
): StickerMessageView {
  return node('stickerMessage', { source, options });
}
export function VideoMessage(
  source: MessageMediaSource,
  options: VideoMessageOptions = {},
): VideoMessageView {
  return node('videoMessage', { source, options });
}
export function VoiceMessage(
  samples: readonly number[],
  duration: number,
  options: VoiceMessageOptions = {},
): VoiceMessageView {
  return node('voiceMessage', { samples, duration, options });
}

const opacity = (name: OpacityName | undefined) => (name === undefined ? undefined : OPACITY[name]);
const optionsOf = <O,>(d: ControlDraw) => (d.node.props as { options: O }).options;

/** A bubble's media: its side a modifier, its colours painted from roles. */
const bubble = (spec: ProductSpec, placeholder = false): ProductSpec => ({
  ...spec,
  own: (d) => ({ tone: d.own('tint')?.value, ...spec.own?.(d) }),
  colors: (d) => ({
    bubbleColor: d.own('bubbleTint')?.value,
    onColor: d.own('contentTint')?.value,
    ...(placeholder ? { placeholderColor: d.own('placeholderTint')?.value } : null),
  }),
});
const sized = ['width'] as const;
const rounded = ['radius'] as const;

export const CHATS: Record<ChatKind, ControlRenderer> = {
  chatBackground: product(BloomChatBackground, {
    own: (d) => {
      const options = optionsOf<ChatBackgroundOptions>(d);
      return {
        variant: d.own('style')?.value,
        overlayOpacity: opacity(options.overlayOpacity),
        patternOpacity: opacity(options.patternOpacity),
      };
    },
    colors: (d) => ({
      tint: d.own('tint')?.value as ColorToken | undefined,
      colors: d.own('gradient')?.value,
    }),
  }),
  chatDateHeader: product(BloomChatDateHeader, {
    lengths: ['offset'],
    own: (d) => ({ placement: d.own('style')?.value }),
  }),
  chatEmptyState: product(BloomChatEmptyState, { slots: ['illustration', 'action'] }),
  chatHeader: product(BloomChatHeader, {
    slots: ['avatar', 'accessory', 'actions', 'selectionActions'],
    lengths: ['avatarSize'],
    own: (d) => {
      const density = d.own('density')?.value;
      return {
        statusTone: d.own('tint')?.value,
        presentation: d.own('presentation')?.value,
        titleAlign: d.own('titleAlign')?.value,
        titleLayout: d.own('titleLayout')?.value,
        titleAppearance: d.own('titleAppearance')?.value,
        compact: density === undefined ? undefined : density === 'compact',
        divider: d.own('dividers')?.value,
      };
    },
  }),
  chatInfoPanel: product(BloomChatInfoPanel, {
    slots: ['headerActions', 'cover', 'avatar', 'settings'],
    lengths: ['width', 'coverHeight', 'avatarSize'],
    own: (d) => ({ variant: d.own('style')?.value }),
  }),
  pinnedMessageBar: product(BloomPinnedMessageBar, {
    own: (d) => ({ dismissIcon: d.own('dismissIcon')?.value }),
  }),
  scrollToBottomButton: product(BloomScrollToBottomButton, { lengths: ['size'], press: true }),
  chatFolderTabs: product(BloomChatFolderTabs, {
    lengths: ['paddingHorizontal'],
    own: (d) => ({
      gap: length(d.own('spacing')?.value as SpaceToken | undefined),
      divider: d.own('dividers')?.value,
    }),
  }),
  chatSearchField: product(BloomChatSearchField, {
    binding: ['value', 'onChangeText'],
    slots: ['trailing'],
  }),
  chatSearchResults: product(BloomChatSearchResults),
  storiesRow: product(BloomStoriesRow, {
    lengths: ['size', 'paddingHorizontal'],
    own: (d) => ({ gap: length(d.own('spacing')?.value as SpaceToken | undefined) }),
  }),
  storyRing: product(BloomStoryRing, {
    slots: ['badge'],
    lengths: ['size', 'thickness', 'gap'],
    press: true,
    colors: (d) => ({ colors: d.own('gradient')?.value }),
  }),
  typingDots: product(BloomTypingDots, {
    lengths: ['size'],
    colors: (d) => ({ color: d.own('tint')?.value as ColorToken | undefined }),
  }),
  contactMessage: product(BloomContactMessage, bubble({ lengths: sized, corners: rounded })),
  documentGrid: product(BloomDocumentGrid, { own: (d) => ({ divider: d.own('dividers')?.value }) }),
  fileMessage: product(
    BloomFileMessage,
    bubble({
      lengths: sized,
      corners: rounded,
      own: (d) => ({ variant: d.own('style')?.value }),
    }),
  ),
  gifMessage: product(
    BloomGifMessage,
    bubble({ lengths: ['maxWidth', 'maxHeight'], corners: rounded }, true),
  ),
  imageMessage: product(
    BloomImageMessage,
    bubble({ slots: ['caption'], lengths: ['maxWidth', 'maxHeight'], corners: rounded }, true),
  ),
  locationMessage: product(
    BloomLocationMessage,
    bubble({
      lengths: ['width', 'mapHeight'],
      corners: rounded,
      own: (d) => {
        const { renderMap } = optionsOf<LocationMessageOptions>(d);
        return {
          renderMap:
            renderMap === undefined
              ? undefined
              : (size: { width: number; height: number }) => d.render(renderMap(size)),
        };
      },
    }),
  ),
  pollMessage: product(BloomPollMessage, bubble({ lengths: sized, corners: rounded })),
  sharedMediaGrid: product(BloomSharedMediaGrid, {
    lengths: sized,
    corners: rounded,
    own: (d) => ({
      columns: d.own('columns')?.value,
      gap: length(d.own('spacing')?.value as SpaceToken | undefined),
    }),
  }),
  stickerMessage: product(BloomStickerMessage, bubble({ lengths: ['size'] })),
  videoMessage: product(
    BloomVideoMessage,
    bubble(
      { lengths: sized, corners: rounded, own: (d) => ({ variant: d.own('style')?.value }) },
      true,
    ),
  ),
  voiceMessage: product(BloomVoiceMessage, bubble({ lengths: sized })),
};
