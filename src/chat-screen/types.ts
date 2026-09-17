import type { ComponentType, ReactNode } from 'react';
import type { ImageSourcePropType, StyleProp, TextStyle, ViewStyle } from 'react-native';

import type { PresenceStatus } from '../chat-indicators/types';

/**
 * A Remix-style icon COMPONENT (`RiPhoneLine`, not `<RiPhoneLine />`) — the
 * caller passes the component and the part that draws it decides the size and
 * the tint, so an icon can never arrive at the wrong rung.
 */
export type ChatIconComponent = ComponentType<{
  width?: number;
  height?: number;
  fill?: string;
}>;

// ---------------------------------------------------------------------------
//  ChatHeader
// ---------------------------------------------------------------------------

/**
 * The small glyph after the title. `verified` is the accent badge, `bot` and
 * `channel` are quiet secondary glyphs — a bot is not an endorsement, so it is
 * deliberately NOT painted in the accent.
 */
export type ChatHeaderMarker = 'verified' | 'bot' | 'channel';

/** How loud the status line is. `accent` is for "online"; `muted` for the rest. */
export type ChatHeaderStatusTone = 'muted' | 'accent';

export interface ChatHeaderProps {
  /** The conversation's name. */
  title: string;
  /** The glyph after the title. Omit for a plain title. */
  marker?: ChatHeaderMarker;
  /**
   * Names the marker for assistive tech. Defaults to "Verified" / "Bot" /
   * "Channel" — pass a translated one. An empty string hides the glyph, for a
   * header whose own text already says it.
   */
  markerLabel?: string;
  /**
   * The second line: `"online"`, `"last seen recently"`,
   * `"5 members, 2 online"`. A pre-formatted STRING — nothing here reads a
   * clock or counts a roster.
   */
  status?: string;
  /** `accent` for a live status, `muted` (default) for everything else. */
  statusTone?: ChatHeaderStatusTone;
  /**
   * "Ana is typing…". Drawn as `TypingDots` with this as its label, and it WINS
   * over {@link ChatHeaderProps.status} — someone typing is newer news than
   * when they were last seen.
   */
  typingLabel?: string;
  /**
   * The transport is down. Replaces both of the above — a "last seen" line
   * rendered while the socket is closed is a claim the app cannot currently
   * make.
   */
  connecting?: boolean;
  /** The text of the connecting line. Default `"Connecting…"`. */
  connectingLabel?: string;

  /**
   * The identity mark. Pass a node for a group (an `AvatarGroup`, a stacked
   * pair); omit it and the header builds an `AvatarPresence` from
   * `avatarSource` / `avatarName` / `presence`.
   */
  avatar?: ReactNode;
  /** A URL, an `ImageResolver` id, or an RN image source. */
  avatarSource?: string | ImageSourcePropType | null;
  /** Initials fallback and the avatar's tint seed. Defaults to `title`. */
  avatarName?: string;
  /** Draws a presence dot on the avatar. */
  presence?: PresenceStatus;
  /** Names the presence dot. Default: the English word for the status. */
  presenceLabel?: string;
  /** Avatar diameter. Default `40`. */
  avatarSize?: number;

  /** Back navigation. Drawn on the compact layout only (see `showBack`). */
  onPressBack?: () => void;
  /**
   * Forces the back button on or off. Default: on when `onPressBack` is set AND
   * the header is compact (below `lg`, or on native, where there is no
   * persistent list pane to go back TO on screen).
   */
  showBack?: boolean;
  /** Names the back button. Default `"Back"`. */
  backLabel?: string;

  /** Opens the info panel. Wraps the avatar + title block in a button. */
  onPressHeader?: () => void;
  /** Names that button. Defaults to `title`. */
  openInfoLabel?: string;

  onPressCall?: () => void;
  onPressVideoCall?: () => void;
  onPressSearch?: () => void;
  onPressMore?: () => void;
  callLabel?: string;
  videoCallLabel?: string;
  searchLabel?: string;
  moreLabel?: string;
  /**
   * Replaces the "more" button — return your own trigger (a `DropdownMenu`
   * wrapping one, say). The menu's CONTENTS are the app's, so the header never
   * owns them.
   */
  renderMore?: () => ReactNode;
  /** Extra controls, after the built-in ones. */
  actions?: ReactNode;

  /**
   * Selection mode. Any value above `0` REPLACES the whole header: the identity
   * block, the status line and every call/search control go away, and the row
   * becomes a count plus the actions below. The two cannot coexist — a call
   * button next to "3 selected" is an invitation to lose a selection.
   */
  selectionCount?: number;
  /** Leaves selection mode. */
  onClearSelection?: () => void;
  onForward?: () => void;
  onDelete?: () => void;
  onCopy?: () => void;
  onPin?: () => void;
  clearSelectionLabel?: string;
  forwardLabel?: string;
  deleteLabel?: string;
  copyLabel?: string;
  pinLabel?: string;
  /** Replaces the built-in selection actions entirely. */
  selectionActions?: ReactNode;
  /** The count line. Default `` `${n} selected` ``. */
  formatSelectionCount?: (count: number) => string;

  /**
   * Forces the compact layout (back button, tighter gutters). Default: derived
   * from the window width against `CHAT_COMPACT_BREAKPOINT`, and always `true`
   * on native.
   */
  compact?: boolean;
  /** Draws the bottom hairline. Default `true`. */
  divider?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

// ---------------------------------------------------------------------------
//  PinnedMessageBar
// ---------------------------------------------------------------------------

export interface ChatPinnedMessage {
  /** Stable key, and what `onPressPin` reports. */
  id: string;
  /** The message's one-line preview. */
  preview: string;
  /** Who wrote it, drawn before the preview. Optional. */
  author?: string;
  /** A thumbnail for a media message: a URL, an `ImageResolver` id or a source. */
  thumbnail?: string | ImageSourcePropType | null;
}

export interface PinnedMessageBarProps {
  /** The pinned messages, newest last. Empty renders NOTHING. */
  pins: ChatPinnedMessage[];
  /** Which one is shown. Clamped into range. Default `0`. */
  index?: number;
  /** Jump to the pinned message. */
  onPressPin?: (pin: ChatPinnedMessage, index: number) => void;
  /** Opens the full list of pins. Omit to hide the list button. */
  onPressList?: () => void;
  /** Closes the bar, or unpins — `dismissIcon` says which. Omit to hide it. */
  onDismiss?: () => void;
  /** `close` (default) hides the bar; `unpin` removes the pin. */
  dismissIcon?: 'close' | 'unpin';
  /**
   * The title line. Default: `"Pinned message"` for a single pin and
   * `` `Pinned message #${index + 1}` `` for several.
   */
  formatTitle?: (index: number, total: number) => string;
  listLabel?: string;
  dismissLabel?: string;
  /** Names the jump button. Default: the title line plus the preview. */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

// ---------------------------------------------------------------------------
//  ChatBackground
// ---------------------------------------------------------------------------

/**
 * `plain` — the page colour. `pattern` — a repeated glyph tile drawn in SVG and
 * tinted from the theme. `gradient` — a two-stop wash off the accent ramp.
 * `image` — a consumer image under a dimming overlay.
 */
export type ChatBackgroundVariant = 'plain' | 'pattern' | 'gradient' | 'image';

export interface ChatBackgroundProps {
  /** Default `plain`. */
  variant?: ChatBackgroundVariant;
  /** The wallpaper image. `variant="image"` only. */
  source?: string | ImageSourcePropType | null;
  /**
   * How hard the image is dimmed, `0`–`1`. Default `0.55` in light, `0.62` in
   * dark. This is what keeps an unknown photo from swallowing a bubble, so
   * lowering it is a legibility decision, not a taste one.
   */
  overlayOpacity?: number;
  /** Overrides the pattern's ink. Default: a faint step off the neutral ramp. */
  tint?: string;
  /** The pattern's opacity. Default `0.5`. */
  patternOpacity?: number;
  /** Overrides the gradient stops. 2+ colours. */
  colors?: string[];
  /** The transcript. Drawn above the wallpaper. */
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

// ---------------------------------------------------------------------------
//  ScrollToBottomButton / JumpToMentionButton
// ---------------------------------------------------------------------------

export interface ScrollToBottomButtonProps {
  /** `false` renders NOTHING — no hidden button parked in the focus order. */
  visible?: boolean;
  /** Unread messages below the fold. `0` draws no badge. */
  unreadCount?: number;
  /** Above this the badge reads `"99+"`. Default `99`. */
  badgeMax?: number;
  onPress?: () => void;
  /**
   * Names the button. Default `"Scroll to latest messages"`; the unread count
   * is announced by the badge, which carries its own name.
   */
  accessibilityLabel?: string;
  /** Diameter. Default `44`. */
  size?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export interface JumpToMentionButtonProps
  extends Omit<ScrollToBottomButtonProps, 'unreadCount' | 'accessibilityLabel'> {
  /** How many mentions are waiting. `0` draws no badge. */
  count?: number;
  /** Default `"Jump to mention"`. */
  accessibilityLabel?: string;
}

// ---------------------------------------------------------------------------
//  ChatDateHeader
// ---------------------------------------------------------------------------

/**
 * `floating` (default) pins the pill over the transcript; `inline` puts it in
 * flow, as a separator between two days.
 */
export type ChatDateHeaderPlacement = 'floating' | 'inline';

export interface ChatDateHeaderProps {
  /** Pre-formatted: `"Today"`, `"Yesterday"`, `"14 March"`. */
  label: string;
  /**
   * Default `true`. `false` fades the pill to nothing and takes it out of the
   * accessibility tree; it is not focusable either way, so it stays mounted and
   * the label never re-announces as it fades.
   */
  visible?: boolean;
  /** Default `floating`. */
  placement?: ChatDateHeaderPlacement;
  /** Distance from the top of the transcript, `floating` only. Default `8`. */
  offset?: number;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  testID?: string;
}

// ---------------------------------------------------------------------------
//  ChatEmptyState
// ---------------------------------------------------------------------------

export interface ChatEmptyStateProps {
  /** Default `"No messages yet"`. */
  title?: string;
  /** The line under it. Optional. */
  description?: string;
  /** An illustration, a large avatar, anything. Drawn above the title. */
  illustration?: ReactNode;
  /**
   * The notice under the block — "Messages are end-to-end encrypted", say.
   * There is NO default: a security claim is the app's to make, and a component
   * that ships one by default makes it on behalf of apps that cannot keep it.
   */
  notice?: string;
  /**
   * The glyph before the notice. Defaults to a padlock when `notice` is set;
   * `false` draws none.
   */
  noticeIcon?: ChatIconComponent | false;
  /** A call to action under the notice — a Button, a Chip row. */
  action?: ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

// ---------------------------------------------------------------------------
//  ChatInfoPanel
// ---------------------------------------------------------------------------

/** `pane` is the desktop right-hand column; `screen` is the mobile full page. */
export type ChatInfoPanelVariant = 'pane' | 'screen';

/** One tile in the panel's action row. */
export interface ChatInfoAction {
  key: string;
  label: string;
  icon: ChatIconComponent;
  onPress?: () => void;
  /** `negative` paints it in the error colour. Default `default`. */
  tone?: 'default' | 'negative';
  disabled?: boolean;
  /** Names it when the visible label is not enough. */
  accessibilityLabel?: string;
}

/** One pane of the shared-content strip. The GRID inside it is the caller's. */
export interface ChatInfoTab {
  value: string;
  label: string;
  icon?: ChatIconComponent;
  /** Drawn as a count beside the label. `0` draws nothing. */
  count?: number;
  content?: ReactNode;
}

/** `owner` and `admin` draw a badge; `member` draws none. */
export type ChatMemberRole = 'owner' | 'admin' | 'member';

export interface ChatMember {
  id: string;
  name: string;
  /** A URL, an `ImageResolver` id or an RN image source. */
  source?: string | ImageSourcePropType | null;
  status?: PresenceStatus;
  role?: ChatMemberRole;
  /** The second line — a handle, "last seen recently", a phone number. */
  subtitle?: string;
}

export interface ChatMemberRowProps {
  member: ChatMember;
  onPress?: (member: ChatMember) => void;
  /** The badge text per role. Default `{ owner: 'Owner', admin: 'Admin' }`. */
  roleLabels?: Partial<Record<ChatMemberRole, string>>;
  /** Avatar diameter. Default `40`. */
  avatarSize?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export interface ChatInfoPanelProps {
  /** Default `pane`. */
  variant?: ChatInfoPanelVariant;
  /** Pane width. Default `380`. Ignored by `screen`. */
  width?: number;

  /** The panel's own title bar text. Default `"Info"`. */
  title?: string;
  /** Closes the panel. Omit to hide the close button. */
  onClose?: () => void;
  closeLabel?: string;
  /** Extra controls in the title bar (an edit button, a menu trigger). */
  headerActions?: ReactNode;

  /**
   * A cover image behind the identity block — a group photo, a banner. Pass a
   * node for full control, or `coverSource` for the plain case.
   */
  cover?: ReactNode;
  coverSource?: string | ImageSourcePropType | null;
  /** Cover height. Default `160`. */
  coverHeight?: number;

  /** Replaces the built-in avatar. */
  avatar?: ReactNode;
  avatarSource?: string | ImageSourcePropType | null;
  presence?: PresenceStatus;
  /** Avatar diameter. Default `96` (`72` over a cover). */
  avatarSize?: number;

  name?: string;
  /** `@handle`, a phone number — drawn under the name. */
  handle?: string;
  /** A short description. */
  bio?: string;
  /** A third line under the bio — "last seen recently", "created 12 March". */
  meta?: string;

  /** The action row. Empty or omitted draws no row. */
  actions?: ChatInfoAction[];

  /**
   * The settings block. A SLOT, not a schema: a notifications switch, a
   * disappearing-messages picker and a theme row each need state and semantics
   * the panel cannot own. Compose it from `SettingsListGroup` /
   * `SettingsListItem` — `docs/chat-screen.mdx` has the worked example.
   */
  settings?: ReactNode;
  /** Heading above the settings block. */
  settingsTitle?: string;

  /** Shared content. The panes' contents come from the caller. */
  tabs?: ChatInfoTab[];
  /** Controlled selected tab. */
  tab?: string;
  onTabChange?: (value: string) => void;
  /** Uncontrolled initial tab. Defaults to the first tab. */
  defaultTab?: string;

  /** The roster. Empty or omitted draws no members section. */
  members?: ChatMember[];
  membersTitle?: string;
  onPressMember?: (member: ChatMember) => void;
  roleLabels?: Partial<Record<ChatMemberRole, string>>;
  /** Draws the roster search field. Default: `true` once there are 8+ members. */
  memberSearch?: boolean;
  /**
   * Controlled search text. WITH it the panel filters nothing — the caller owns
   * the result set (a server search, a fuzzy match). WITHOUT it the panel keeps
   * its own query and filters by name.
   */
  memberQuery?: string;
  onMemberQueryChange?: (query: string) => void;
  memberSearchPlaceholder?: string;
  /** Adds the "Add members" row. */
  onAddMember?: () => void;
  addMemberLabel?: string;
  /** Drawn when the roster (or the filtered roster) is empty. */
  membersEmptyLabel?: string;

  /** Leave / Block / Report. Painted in the negative tone, at the bottom. */
  destructiveActions?: ChatInfoAction[];

  /** Anything else, appended after the destructive rows. */
  children?: ReactNode;
  /** The panel scrolls its own content. Default `true`. */
  scrollable?: boolean;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  testID?: string;
}

// ---------------------------------------------------------------------------
//  ChatSplitLayout
// ---------------------------------------------------------------------------

/** Which single pane a narrow layout shows. */
export type ChatPane = 'list' | 'conversation' | 'info';

export interface ChatSplitLayoutProps {
  /** The conversation list. */
  list: ReactNode;
  /** The conversation itself. */
  children: ReactNode;
  /** The info panel. Omit for two panes. */
  info?: ReactNode;

  /**
   * Which pane a NARROW layout shows. Default `conversation`. Asking for
   * `info` with no `info` node falls back to the conversation rather than
   * rendering an empty screen.
   */
  pane?: ChatPane;

  /** Controlled list-pane width. */
  listWidth?: number;
  /** Reported while the grip is dragged and when it is released. */
  onListWidthChange?: (width: number) => void;
  /** Uncontrolled starting width. Default `340`. */
  defaultListWidth?: number;
  /** Default `280`. */
  minWidth?: number;
  /** Default `480`. */
  maxWidth?: number;
  /** Info pane width. Default `380`. */
  infoWidth?: number;
  /** Draws the resize grip. Default `true`. */
  resizable?: boolean;
  /** Names the grip. Default `"Resize the conversation list"`. */
  resizeLabel?: string;

  /** Below this width the layout shows one pane. Default `900`. */
  breakpoint?: number;
  /** Forces the one-pane layout. Default: measured, seeded from the window. */
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
