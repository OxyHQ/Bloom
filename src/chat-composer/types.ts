import type { ReactNode, RefObject } from 'react';
import type { StyleProp, TextInput, ViewStyle } from 'react-native';

import type { BloomIconComponent } from '../icons/icon-component';

/**
 * Every glyph slot in this family takes a Bloom icon component.
 *
 * It is `BloomIconComponent` — width, height, fill — and not the full Remix
 * prop set: those three are all this family ever passes, and demanding the
 * whole set made the type reject any icon component written to Bloom's own
 * published shape. A mail message handing its attachment glyph to this strip
 * was the case that found it.
 */
export type ChatComposerIcon = BloomIconComponent;

/** Props shared by every part: a style escape hatch and a test handle. */
interface PartProps {
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

// ---------------------------------------------------------------------------
//  ChatComposer
// ---------------------------------------------------------------------------

/**
 * Which keystroke SENDS on web.
 *
 * `'enter'` — Enter sends, Shift+Enter breaks the line. The messaging default:
 * most messages are one line and the send key should be the one already under
 * the finger.
 * `'mod-enter'` — Enter breaks the line, ⌘/Ctrl+Enter sends. For channels where
 * a message is a paragraph.
 *
 * Native has no key events to read here: the send button is the only way to
 * submit, and `sendOn` only names the hint the composer shows.
 */
export type ChatComposerSendOn = 'enter' | 'mod-enter';

/** One pending attachment in the strip above the input. */
export interface ChatComposerAttachment {
  id: string;
  /** File name, announced and shown as the tile's tooltip-free caption. */
  name: string;
  /** Thumbnail URI (or an {@link ImageResolver} id). Omit for a glyph tile. */
  source?: string;
  /** Overrides the glyph a non-image tile draws. */
  icon?: ChatComposerIcon;
  /** `0`–`100` draws the accent progress ring. Omit once the file has landed. */
  progress?: number;
  /** Small caption under the name — a size, a duration. */
  caption?: string;
}

export interface ChatComposerSuggestion {
  id: string;
  /** The name, the command (`/giphy`) or the shortcode (`:smile:`). */
  label: string;
  /** `@handle`, or a command's argument hint. */
  handle?: string;
  /** A second muted line. */
  description?: string;
  /** Avatar URI or {@link ImageResolver} id, for `kind="mention"`. */
  avatar?: string;
  /** The glyph itself, for `kind="emoji"`. */
  emoji?: string;
  disabled?: boolean;
}

/**
 * What a {@link SuggestionList} is listing. It changes the leading slot only —
 * an avatar for people, a glyph disc for commands, the emoji for shortcodes —
 * because the row geometry, the keyboard model and the announced role are the
 * same in all three cases.
 */
export type SuggestionKind = 'mention' | 'command' | 'emoji';

export interface SuggestionListProps extends PartProps {
  kind: SuggestionKind;
  suggestions: ReadonlyArray<ChatComposerSuggestion>;
  /** The highlighted row. `-1` (the default) highlights nothing. */
  activeIndex?: number;
  onSelectSuggestion?: (suggestion: ChatComposerSuggestion, index: number) => void;
  /** Fired when a pointer moves onto a row, so hover and the keyboard agree. */
  onActiveIndexChange?: (index: number) => void;
  /** A muted caption above the rows ("People", "Commands"). */
  header?: string;
  /** Scroll past this height. Default `232` (about five rows). */
  maxHeight?: number;
  /** Accessible name of the listbox. Defaults to a name derived from `kind`. */
  accessibilityLabel?: string;
}

export interface ChatComposerLabels {
  attach: string;
  emoji: string;
  camera: string;
  mic: string;
  send: string;
  /** Names the field itself (the placeholder is not a name). */
  input: string;
  /** Keyboard hint under the bar on web. */
  enterHint: string;
  modEnterHint: string;
}

export interface ChatComposerProps extends PartProps {
  /** The draft. Works controlled or uncontrolled. */
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  /** Send button, and the keyboard on web. Never fires while `disabled`. */
  onSend?: (value: string) => void;
  /** Which keystroke sends on web. Default `'enter'`. */
  sendOn?: ChatComposerSendOn;
  /** Lines the field grows to before it scrolls. Default `6`. */
  maxLines?: number;
  /** Lines the field occupies when empty. Default `1`. */
  minLines?: number;
  /** Greys the whole bar and stops every callback. */
  disabled?: boolean;
  /**
   * Replaces the input row with a centred, non-interactive line — "You can't
   * send messages in this group", "Channel muted". A string is rendered in the
   * notice type; pass a node for your own row.
   */
  notice?: ReactNode;
  /** The glyph beside a string `notice`. */
  noticeIcon?: ChatComposerIcon;
  /** Anything above the bar: reply/edit/forward previews, a slow-mode line. */
  banner?: ReactNode;
  /** Pending attachments, drawn as a strip between `banner` and the bar. */
  attachments?: ReadonlyArray<ChatComposerAttachment>;
  onRemoveAttachment?: (id: string) => void;
  /**
   * Replaces the default attach button. Pass an `AttachmentMenu` wrapping a
   * `ComposerIconButton` to anchor a menu to it.
   */
  leading?: ReactNode;
  /** Pressed when no `leading` is given. Omit with `leading` to hide the slot. */
  onAttachPress?: () => void;
  /** Replaces the default emoji button — e.g. an `EmojiPicker` in a popover. */
  emojiSlot?: ReactNode;
  onEmojiPress?: () => void;
  /** Draws a camera button between the field and the emoji button. */
  onCameraPress?: () => void;
  /** The mic, shown whenever the draft is empty and there are no attachments. */
  onMicPress?: () => void;
  /** Press-and-hold on the mic (native). Both fire on web too. */
  onMicPressIn?: () => void;
  onMicPressOut?: () => void;
  /**
   * Forces the send button even with an empty draft — an app that lets a bare
   * attachment or a sticker be sent.
   */
  canSend?: boolean;
  /** Replaces the whole bar while a recording is in flight. */
  recorder?: ReactNode;
  /** Suggestion rows floated above the bar. Empty or omitted draws nothing. */
  suggestions?: ReadonlyArray<ChatComposerSuggestion>;
  suggestionKind?: SuggestionKind;
  /** Highlighted row. The composer never owns this — arrow keys report it. */
  activeIndex?: number;
  onActiveIndexChange?: (index: number) => void;
  onSelectSuggestion?: (suggestion: ChatComposerSuggestion, index: number) => void;
  /** Escape on web (and a suggestion list's dismissal). */
  onEscape?: () => void;
  /** Up arrow on an empty draft, on web. */
  onEditLast?: () => void;
  /** Draws the keyboard hint line under the bar (web only). Default `false`. */
  showKeyboardHint?: boolean;
  /** The field, for focusing it from a reply action. */
  inputRef?: RefObject<TextInput | null>;
  onFocus?: () => void;
  onBlur?: () => void;
  labels?: Partial<ChatComposerLabels>;
  accessibilityLabel?: string;
}

/**
 * A 36px round icon control — the composer's own button, exported so a slot can
 * render the same disc the defaults do.
 *
 * The `aria-*` and `accessibilityRole` props are here because `asChild` MERGES
 * them onto whatever element it is given: an `AttachmentMenu` wrapping one of
 * these needs the button to carry the popup state it is handed, not drop it.
 */
export interface ComposerIconButtonProps extends PartProps {
  icon: ChatComposerIcon;
  accessibilityLabel: string;
  onPress?: (event?: unknown) => void;
  onLongPress?: (event?: unknown) => void;
  disabled?: boolean;
  /** `'accent'` paints the accent gradient and a white glyph (the send disc). */
  tone?: 'plain' | 'accent';
  /** Box size. Default `36`. */
  size?: number;
  /** Glyph size. Defaults to `size - 16`. */
  iconSize?: number;
  onPressIn?: () => void;
  onPressOut?: () => void;
  'aria-expanded'?: boolean;
  'aria-haspopup'?: boolean | 'menu' | 'dialog' | 'listbox' | 'grid' | 'tree';
  accessibilityRole?: 'button';
}

// ---------------------------------------------------------------------------
//  ComposerBanner
// ---------------------------------------------------------------------------

/**
 * `reply` / `edit` / `forward` draw the full two-line preview with an accent
 * bar; `note` is the one-line status ("Slow mode: 12s", "Scheduled for 9:00")
 * with no bar and no close button unless one is wired.
 */
export type ComposerBannerKind = 'reply' | 'edit' | 'forward' | 'note';

export interface ComposerBannerProps extends PartProps {
  kind: ComposerBannerKind;
  /** The heading line — a sender's name, "Edit message", "Forward to Studio". */
  title: string;
  /** The one-line preview under it. Truncated to a single line. */
  preview?: string;
  /** Thumbnail of the quoted media. */
  thumbnail?: string;
  /** Overrides the glyph. Defaults per `kind`. */
  icon?: ChatComposerIcon;
  /**
   * The accent bar and glyph colour. Defaults to the theme accent; pass a
   * per-sender colour to match the quoted bubble.
   */
  accentColor?: string;
  /** Draws the close button. Omit to draw none. */
  onClose?: () => void;
  closeLabel?: string;
  /** Extra content at the right end (a countdown, a switch). */
  trailing?: ReactNode;
  accessibilityLabel?: string;
}

export interface ComposerAttachmentStripProps extends PartProps {
  attachments: ReadonlyArray<ChatComposerAttachment>;
  onRemove?: (id: string) => void;
  /**
   * Opens a tile. A composer's attachments are things you are about to send,
   * so they only need removing; the same strip in a READ-ONLY place — a mail
   * message's attachments — is a list you open. With this the tile is a named
   * button; without it the tile stays decoration, as it was.
   */
  onOpen?: (id: string) => void;
  /** Tile edge. Default `56`. */
  size?: number;
  removeLabel?: (attachment: ChatComposerAttachment) => string;
  /** Names an openable tile. Defaults to the attachment's own name. */
  openLabel?: (attachment: ChatComposerAttachment) => string;
  accessibilityLabel?: string;
}

// ---------------------------------------------------------------------------
//  VoiceRecorder
// ---------------------------------------------------------------------------

/**
 * `recording` — held, cancels on release outside. `locked` — hands-free, with
 * cancel and send buttons. `preview` — recorded, playable, delete or send.
 */
export type VoiceRecorderState = 'recording' | 'locked' | 'preview';

export interface VoiceRecorderLabels {
  cancel: string;
  send: string;
  delete: string;
  play: string;
  pause: string;
  lock: string;
  slideToCancel: string;
  recording: string;
}

export interface VoiceRecorderProps extends PartProps {
  state: VoiceRecorderState;
  /** Elapsed seconds while recording; the playhead in `preview`. */
  seconds: number;
  /** Total length, in `preview`. Defaults to `seconds`. */
  duration?: number;
  /**
   * Live levels, `0`–`1`, oldest first. The bar drops the overflow from the
   * FRONT, so a growing array scrolls left the way a live meter does.
   */
  amplitudes?: ReadonlyArray<number>;
  /** `preview` only: whether playback is running. */
  playing?: boolean;
  onPlayToggle?: () => void;
  onCancel?: () => void;
  onDelete?: () => void;
  onSend?: () => void;
  /** Shown as the lock affordance while `recording`. Omit to hide it. */
  onLock?: () => void;
  /**
   * Draw the "slide to cancel" hint instead of a cancel button while
   * `recording`. Defaults to `true` off web — a pointer has no slide gesture.
   */
  slideToCancel?: boolean;
  labels?: Partial<VoiceRecorderLabels>;
  accessibilityLabel?: string;
}

// ---------------------------------------------------------------------------
//  AttachmentMenu
// ---------------------------------------------------------------------------

export interface AttachmentMenuItem {
  id: string;
  label: string;
  icon: ChatComposerIcon;
  /** Overrides the disc tint. Defaults to the accent. */
  color?: string;
  disabled?: boolean;
}

export interface AttachmentMenuProps {
  /** The trigger. Rendered through `PopoverTrigger asChild`. */
  children?: ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Defaults to {@link ATTACHMENT_MENU_ITEMS}. */
  items?: ReadonlyArray<AttachmentMenuItem>;
  /** `'grid'` (default) draws icon discs in `columns`; `'list'` draws rows. */
  layout?: 'grid' | 'list';
  /** Grid columns. Default `4`. */
  columns?: number;
  onSelect?: (id: string, item: AttachmentMenuItem) => void;
  /** A recent-gallery strip above the items. */
  recent?: ReactNode;
  /** Accessible name of the surface. */
  label?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

// ---------------------------------------------------------------------------
//  EmojiPicker
// ---------------------------------------------------------------------------

/**
 * One emoji. A bare string is the glyph and nothing else, which is all a picker
 * needs to DRAW; the object form adds the words the built-in search matches on.
 * Bloom ships no emoji dataset — both forms arrive as props.
 */
export type EmojiEntry = string | { char: string; name?: string; keywords?: ReadonlyArray<string> };

export interface EmojiGroup {
  key: string;
  label: string;
  emojis: ReadonlyArray<EmojiEntry>;
  /** The category-bar glyph. Defaults to a glyph picked from `key`. */
  icon?: ChatComposerIcon;
}

/** A top-level tab beside "Emoji" — stickers, GIFs, anything else. */
export interface EmojiPickerTab {
  key: string;
  label: string;
  content: ReactNode;
  icon?: ChatComposerIcon;
}

export interface EmojiPickerLabels {
  search: string;
  frequent: string;
  empty: string;
  skinTone: string;
  emojiTab: string;
}

export interface EmojiPickerProps extends PartProps {
  groups: ReadonlyArray<EmojiGroup>;
  onSelectEmoji?: (emoji: string) => void;
  /** Scrolls to, and highlights, this category. Works controlled. */
  activeGroup?: string;
  defaultActiveGroup?: string;
  onActiveGroupChange?: (key: string) => void;
  /** The search field. Works controlled. */
  query?: string;
  defaultQuery?: string;
  onQueryChange?: (query: string) => void;
  /**
   * `false` hands filtering to the app — `groups` is rendered as given and the
   * field only reports. Default `true` (Bloom filters on name and keywords).
   */
  filter?: boolean;
  /** Drawn as its own leading section. Omit to draw none. */
  frequentlyUsed?: ReadonlyArray<EmojiEntry>;
  /** Fitzpatrick modifier index, `0` (none) to `5`. Works controlled. */
  skinTone?: number;
  defaultSkinTone?: number;
  onSkinToneChange?: (tone: number) => void;
  /** Columns in the grid. Default `8`. */
  columns?: number;
  /** Height of the scrolling body. Default `288`. */
  height?: number;
  /** Extra top-level tabs (stickers, GIFs). */
  tabs?: ReadonlyArray<EmojiPickerTab>;
  activeTab?: string;
  onActiveTabChange?: (key: string) => void;
  labels?: Partial<EmojiPickerLabels>;
  accessibilityLabel?: string;
}

// ---------------------------------------------------------------------------
//  ReactionPicker
// ---------------------------------------------------------------------------

export interface ReactionPickerProps extends PartProps {
  /** Defaults to {@link REACTION_PICKER_EMOJIS}. */
  emojis?: ReadonlyArray<string>;
  /** The viewer's own reaction, drawn on an accent disc. */
  selected?: string;
  onSelectEmoji?: (emoji: string) => void;
  /** The "+" that opens the full picker. Omit to hide it. */
  onMorePress?: () => void;
  moreLabel?: string;
  /** Glyph box: `small` 30, `medium` 36. Default `medium`. */
  size?: 'small' | 'medium';
  /** `false` drops the bar's own surface — for use inside a menu panel. */
  surface?: boolean;
  accessibilityLabel?: string;
  /** Names each emoji. Defaults to the glyph itself. */
  emojiLabel?: (emoji: string) => string;
}

// ---------------------------------------------------------------------------
//  MessageContextMenu
// ---------------------------------------------------------------------------

export interface MessageMenuItem {
  id: string;
  label: string;
  icon?: ChatComposerIcon;
  /** `'destructive'` paints the row in the theme's negative colour. */
  variant?: 'default' | 'destructive';
  /** A keyboard hint at the right end of the row (web). */
  shortcut?: string;
  disabled?: boolean;
  /** Draws a hairline above the row. */
  separated?: boolean;
}

export interface MessageContextMenuProps {
  /** The trigger. Rendered through `DropdownMenuTrigger asChild`. */
  children?: ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  items: ReadonlyArray<MessageMenuItem>;
  onSelect?: (id: string, item: MessageMenuItem) => void;
  /** The quick reaction bar above the rows. `false` draws none. */
  reactions?: ReadonlyArray<string> | false;
  selectedReaction?: string;
  onSelectReaction?: (emoji: string) => void;
  onMoreReactions?: () => void;
  /** Accessible name of the surface. */
  label?: string;
  style?: StyleProp<ViewStyle>;
  /** Style for the reaction bar. */
  reactionBarStyle?: StyleProp<ViewStyle>;
  testID?: string;
}
