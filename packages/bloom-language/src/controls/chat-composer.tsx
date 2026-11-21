import {
  AttachmentMenu as BloomAttachmentMenu,
  type AttachmentMenuProps,
  ChatComposer as BloomChatComposer,
  type ChatComposerIcon,
  type ChatComposerProps,
  type ChatComposerSuggestion,
  CompactComposer as BloomCompactComposer,
  type CompactComposerProps,
  ComposerBanner as BloomComposerBanner,
  type ComposerBannerKind,
  type ComposerBannerProps,
  ComposerIconButton as BloomComposerIconButton,
  type ComposerIconButtonProps,
  EmojiPicker as BloomEmojiPicker,
  type EmojiGroup,
  type EmojiPickerProps,
  MessageContextMenu as BloomMessageContextMenu,
  type MessageContextMenuProps,
  type MessageMenuItem,
  ReactionPicker as BloomReactionPicker,
  type ReactionPickerProps,
  SuggestionList as BloomSuggestionList,
  type SuggestionKind,
  type SuggestionListProps,
  VoiceRecorder as BloomVoiceRecorder,
  type VoiceRecorderProps,
  type VoiceRecorderState,
} from '@oxy.so/bloom/chat-composer';

import type { BloomSize } from '@oxy.so/bloom/appearance';

import type { Binding } from '../binding';
import { type Child, Node, type ViewModifiers } from '../node';
import type {
  AttachmentLayout,
  ColorToken,
  ComposerButtonTone,
  IconSizeToken,
  ReactionPickerSize,
  SpaceToken,
} from '../tokens';
import { resolveIconSize } from '../tokens';
import type { ControlDraw, ControlRenderer } from './draw';
import { length, product, slot } from './product';

/** The chat composer's family: the message bar, its banners and buttons, and the pickers and menus around it. */
export type ChatComposerKind =
  | 'chatComposer'
  | 'compactComposer'
  | 'composerBanner'
  | 'composerIconButton'
  | 'suggestionList'
  | 'voiceRecorder'
  | 'attachmentMenu'
  | 'emojiPicker'
  | 'reactionPicker'
  | 'messageContextMenu';

/** What every part leaves to the language: its box, its name and its test id. */
type Drawn = 'style' | 'testID' | 'accessibilityLabel';

/** Bloom `ChatComposer`'s data: its handlers, attachments and suggestions, its slots as language children. */
export type ChatComposerOptions = Omit<
  ChatComposerProps,
  | Drawn
  | 'barStyle'
  | 'inputStyle'
  | 'value'
  | 'defaultValue'
  | 'onValueChange'
  | 'disabled'
  | 'notice'
  | 'banner'
  | 'leading'
  | 'emojiSlot'
  | 'recorder'
> & {
  readonly notice?: Child;
  readonly banner?: Child;
  readonly leading?: Child;
  readonly emojiSlot?: Child;
  readonly recorder?: Child;
};
/** Bloom `CompactComposer`'s data: the limit and the submit are required, as Bloom's are. */
export type CompactComposerOptions = Omit<
  CompactComposerProps,
  Drawn | 'className' | 'value' | 'onChangeText' | 'disabled' | 'avatar' | 'attachments'
> & { readonly avatar?: Child; readonly attachments?: Child };
export type ComposerBannerOptions = Omit<
  ComposerBannerProps,
  Drawn | 'kind' | 'title' | 'accentColor' | 'trailing'
> & { readonly trailing?: Child };
export type ComposerIconButtonOptions = Pick<
  ComposerIconButtonProps,
  'onPressIn' | 'onPressOut' | 'onLayout' | 'aria-expanded' | 'aria-haspopup'
>;
export type SuggestionListOptions = Omit<
  SuggestionListProps,
  Drawn | 'kind' | 'suggestions' | 'size' | 'loading' | 'maxHeight'
> & { readonly maxHeight?: SpaceToken };
export type VoiceRecorderOptions = Omit<VoiceRecorderProps, Drawn | 'state' | 'seconds'>;
export type AttachmentMenuOptions = Omit<
  AttachmentMenuProps,
  'style' | 'testID' | 'children' | 'layout' | 'columns' | 'recent'
> & { readonly recent?: Child };
export type EmojiPickerOptions = Omit<EmojiPickerProps, Drawn | 'groups' | 'size' | 'height'> & {
  readonly height?: SpaceToken;
};
export type ReactionPickerOptions = Omit<
  ReactionPickerProps,
  Drawn | 'emojis' | 'size' | 'surface'
>;
export type MessageContextMenuOptions = Omit<
  MessageContextMenuProps,
  'style' | 'reactionBarStyle' | 'testID' | 'children' | 'items'
>;

/** Bloom `ChatComposer`: a person-to-person chat's message bar. */
export interface ChatComposerView extends ViewModifiers<ChatComposerView> {
  disabled(value?: boolean): ChatComposerView;
}
/** Bloom `CompactComposer`: a reply box that grows into the full composer. */
export interface CompactComposerView extends ViewModifiers<CompactComposerView> {
  disabled(value?: boolean): CompactComposerView;
}
/** Bloom `ComposerBanner`: what a message replies to, edits, forwards or notes, above the bar. */
export interface ComposerBannerView extends ViewModifiers<ComposerBannerView> {
  /** The accent stripe and title: a colour role (the theme's accent by default). */
  tint(value: ColorToken): ComposerBannerView;
}
/** Bloom `ComposerIconButton`: a round icon button of the bar. */
export interface ComposerIconButtonView extends ViewModifiers<ComposerIconButtonView> {
  /** `plain` (default) or `accent` (the send button). */
  tint(value: ComposerButtonTone): ComposerIconButtonView;
  /** Its edge (Bloom's 36 by default). */
  size(value: SpaceToken): ComposerIconButtonView;
  /** Its glyph (the edge less 16 by default). */
  iconSize(value: IconSizeToken): ComposerIconButtonView;
  disabled(value?: boolean): ComposerIconButtonView;
}
/** Bloom `SuggestionList`: the mentions, commands or emoji a typed trigger offers. */
export interface SuggestionListView extends ViewModifiers<SuggestionListView> {
  size(value: BloomSize): SuggestionListView;
  loading(value?: boolean): SuggestionListView;
}
/** Bloom `VoiceRecorder`: the bar a voice note is recorded and previewed in. */
export type VoiceRecorderView = ViewModifiers<VoiceRecorderView>;
/** Bloom `AttachmentMenu`: what can be attached, opened from its trigger. */
export interface AttachmentMenuView extends ViewModifiers<AttachmentMenuView> {
  /** `grid` (default) of tinted tiles, or a `list`. */
  style(value: AttachmentLayout): AttachmentMenuView;
  columns(value: number): AttachmentMenuView;
}
/** Bloom `EmojiPicker`: emoji by group, with search, skin tones and tabs. */
export interface EmojiPickerView extends ViewModifiers<EmojiPickerView> {
  size(value: BloomSize): EmojiPickerView;
}
/** Bloom `ReactionPicker`: the quick reactions over a message. */
export interface ReactionPickerView extends ViewModifiers<ReactionPickerView> {
  size(value: ReactionPickerSize): ReactionPickerView;
  /** `false` draws the emoji without their pill surface. */
  surface(value?: boolean): ReactionPickerView;
}
/** Bloom `MessageContextMenu`: a message's menu, with its reaction bar. */
export type MessageContextMenuView = ViewModifiers<MessageContextMenuView>;

/** Bloom `ChatComposer`, writing the text the binding holds. */
export function ChatComposer(
  text: Binding<string>,
  options: ChatComposerOptions = {},
): ChatComposerView {
  return new Node('chatComposer', { binding: text, options }, []);
}
export function CompactComposer(
  text: Binding<string>,
  options: CompactComposerOptions,
): CompactComposerView {
  return new Node('compactComposer', { binding: text, options }, []);
}
/** Bloom `ComposerBanner`: a `reply`, `edit`, `forward` or `note`, and its title. */
export function ComposerBanner(
  kind: ComposerBannerKind,
  title: string,
  options: ComposerBannerOptions = {},
): ComposerBannerView {
  return new Node('composerBanner', { kind, title, options }, []);
}
/** Bloom `ComposerIconButton`: its glyph and its name. `.onPress()` is what it does. */
export function ComposerIconButton(
  icon: ChatComposerIcon,
  label: string,
  options: ComposerIconButtonOptions = {},
): ComposerIconButtonView {
  return new Node('composerIconButton', { icon, label, options }, []);
}
export function SuggestionList(
  kind: SuggestionKind,
  suggestions: readonly ChatComposerSuggestion[],
  options: SuggestionListOptions = {},
): SuggestionListView {
  return new Node('suggestionList', { kind, suggestions, options }, []);
}
/** Bloom `VoiceRecorder`: `recording`, `locked` or `preview`, and the seconds recorded. */
export function VoiceRecorder(
  state: VoiceRecorderState,
  seconds: number,
  options: VoiceRecorderOptions = {},
): VoiceRecorderView {
  return new Node('voiceRecorder', { state, seconds, options }, []);
}
/** Bloom `AttachmentMenu`, opened by `trigger`. */
export function AttachmentMenu(
  trigger: Child,
  options: AttachmentMenuOptions = {},
): AttachmentMenuView {
  return new Node('attachmentMenu', { options }, [trigger]);
}
export function EmojiPicker(
  groups: readonly EmojiGroup[],
  options: EmojiPickerOptions = {},
): EmojiPickerView {
  return new Node('emojiPicker', { groups, options }, []);
}
/** Bloom `ReactionPicker`: these emoji (Bloom's six by default). */
export function ReactionPicker(
  emojis?: readonly string[],
  options: ReactionPickerOptions = {},
): ReactionPickerView {
  return new Node('reactionPicker', { emojis, options }, []);
}
/** Bloom `MessageContextMenu` on `message`, with these items. */
export function MessageContextMenu(
  message: Child,
  items: readonly MessageMenuItem[],
  options: MessageContextMenuOptions = {},
): MessageContextMenuView {
  return new Node('messageContextMenu', { items, options }, [message]);
}

interface Props<O> {
  readonly options: O;
  readonly [key: string]: unknown;
}
const propsOf = <O,>(d: ControlDraw) => d.node.props as Props<O>;

export const CHAT_COMPOSERS: Record<ChatComposerKind, ControlRenderer> = {
  chatComposer: product(BloomChatComposer, {
    binding: ['value', 'onValueChange'],
    slots: ['notice', 'banner', 'leading', 'emojiSlot', 'recorder'],
    own: (d) => ({ disabled: d.own('disabled')?.value }),
  }),
  compactComposer: product(BloomCompactComposer, {
    binding: ['value', 'onChangeText'],
    slots: ['avatar', 'attachments'],
    own: (d) => ({ disabled: d.own('disabled')?.value }),
  }),
  composerBanner: product(BloomComposerBanner, {
    slots: ['trailing'],
    colors: (d) => ({ accentColor: d.own('tint')?.value as ColorToken | undefined }),
  }),
  composerIconButton: (d) => {
    const { icon, label, options } = propsOf<ComposerIconButtonOptions>(d);
    const iconSize = d.own('iconSize')?.value;
    return d.component(BloomComposerIconButton, {
      accessibilityLabel: label,
      ...d.props(),
      ...options,
      icon,
      tone: d.own('tint')?.value,
      size: length(d.own('size')?.value as SpaceToken | undefined),
      iconSize: iconSize === undefined ? undefined : resolveIconSize(iconSize),
      disabled: d.own('disabled')?.value,
    });
  },
  suggestionList: product(BloomSuggestionList, {
    lengths: ['maxHeight'],
    own: (d) => ({ size: d.own('size')?.value, loading: d.own('loading')?.value }),
  }),
  voiceRecorder: product(BloomVoiceRecorder),
  attachmentMenu: product(BloomAttachmentMenu, {
    slots: ['recent'],
    own: (d) => ({ layout: d.own('style')?.value, columns: d.own('columns')?.value }),
  }),
  emojiPicker: product(BloomEmojiPicker, {
    lengths: ['height'],
    own: (d) => ({ size: d.own('size')?.value }),
  }),
  reactionPicker: product(BloomReactionPicker, {
    own: (d) => ({ size: d.own('size')?.value, surface: d.own('surface')?.value }),
  }),
  messageContextMenu: product(BloomMessageContextMenu),
};
