import type { ComponentType, ReactNode } from 'react';
import type { ImageSourcePropType, StyleProp, TextStyle, ViewStyle } from 'react-native';

import type { PresenceStatus } from '../chat-indicators/types';

/**
 * Every prop in this family is DATA the app already has. Nothing here reads a
 * clock, opens a socket or knows what WebRTC is: `duration` arrives as the
 * string the app already formatted (`"00:42"`), a video frame arrives as a
 * `ReactNode` slot, and a participant's `speaking` flag arrives from whatever
 * audio-level meter the app runs.
 */

/** A glyph component, sized and coloured by whatever draws it. */
export type CallGlyph = ComponentType<{ width?: number; height?: number; fill?: string }>;

/** An avatar source: a URL, an `ImageResolver` id, or an RN image source. */
export type CallAvatarSource = string | ImageSourcePropType | null;

// ---------------------------------------------------------------------------
//  Status
// ---------------------------------------------------------------------------

/**
 * Where the call is in its life.
 *
 *   calling       we placed it, the other end has not picked up
 *   ringing       the other end is ringing (the callee's own view is
 *                 `IncomingCallScreen`, not this)
 *   connecting    answered, media not flowing yet
 *   active        media flowing — this is the only state with a timer
 *   reconnecting  media dropped, the call is not over
 *   onHold        parked
 *   ended         over
 */
export type CallStatus =
  | 'calling'
  | 'ringing'
  | 'connecting'
  | 'active'
  | 'reconnecting'
  | 'onHold'
  | 'ended';

/** The English default for each status line. Apps in other languages pass their own. */
export interface CallStatusLabels {
  calling: string;
  ringing: string;
  connecting: string;
  /** Shown while `active` when no `duration` has arrived yet. */
  active: string;
  reconnecting: string;
  onHold: string;
  ended: string;
}

/** The inputs {@link resolveCallStatusLine} reads, in precedence order. */
export interface CallStatusLineInput {
  status: CallStatus;
  /** The elapsed time, PRE-FORMATTED (`"00:42"`, `"1:04:11"`). */
  duration?: string;
  /** Replaces the whole line — it wins over every other input. */
  statusText?: string;
  labels?: Partial<CallStatusLabels>;
}

// ---------------------------------------------------------------------------
//  Controls
// ---------------------------------------------------------------------------

/** One toggle in the control bar. The end-call button is not one of these. */
export type CallControlKey =
  | 'mute'
  | 'speaker'
  | 'video'
  | 'flipCamera'
  | 'screenShare'
  | 'addParticipant';

/**
 * `small` 40px buttons (the top bar, the minimised pill), `medium` 48 (a
 * banner or a sheet), `large` 56 (the full screen's own bar).
 */
export type CallControlSize = 'small' | 'medium' | 'large';

/** How a control button is painted. */
export type CallControlTone = 'default' | 'end' | 'accept';

export interface CallControlLabels {
  mute: string;
  unmute: string;
  speakerOn: string;
  speakerOff: string;
  videoOn: string;
  videoOff: string;
  flipCamera: string;
  screenShareOn: string;
  screenShareOff: string;
  addParticipant: string;
  endCall: string;
}

export interface CallControlButtonProps {
  /** The glyph drawn when the button is NOT active (or always, with no `activeIcon`). */
  icon: CallGlyph;
  /** The glyph drawn while `active` — a muted mic, a crossed-out camera. */
  activeIcon?: CallGlyph;
  /**
   * The accessible name, and the caption under the button when `showLabel`.
   * REQUIRED: the button draws one glyph and no text of its own.
   */
  label: string;
  /**
   * Makes the button a TOGGLE: it emits `aria-pressed` plus native
   * `accessibilityState.selected`. Leave it undefined for a plain action
   * (flip camera, add participant) — a one-shot action that reports
   * `aria-pressed="false"` forever announces a state it does not have.
   */
  active?: boolean;
  tone?: CallControlTone;
  size?: CallControlSize;
  disabled?: boolean;
  onPress?: () => void;
  /** Draws `label` under the button. */
  showLabel?: boolean;
  /** A count or dot pinned to the button's top-right — "3 waiting". */
  badge?: ReactNode;
  /** Paints the stage this button sits on, so the toggled fill stays legible. */
  accentColor?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export interface CallControlsProps {
  /**
   * A control appears when you hand it a HANDLER — `onMutedChange` draws the
   * mic, `onFlipCamera` the flip. That is the whole rule: a bar cannot show a
   * toggle that does nothing, and there is no `mode` prop to keep in sync with
   * the call.
   */
  muted?: boolean;
  onMutedChange?: (next: boolean) => void;
  speaker?: boolean;
  onSpeakerChange?: (next: boolean) => void;
  videoOn?: boolean;
  onVideoChange?: (next: boolean) => void;
  onFlipCamera?: () => void;
  screenSharing?: boolean;
  onScreenShareChange?: (next: boolean) => void;
  onAddParticipant?: () => void;
  /** Draws the round red button. Without it there is no end button. */
  onEndCall?: () => void;
  /**
   * The order controls are drawn in, and which ones. Defaults to every key
   * whose handler is present, in the order of {@link CALL_CONTROL_ORDER}. A key
   * listed here with no handler is still skipped.
   */
  controls?: readonly CallControlKey[];
  size?: CallControlSize;
  /** Dims and disables every button, end call included. */
  disabled?: boolean;
  /** Draws each button's name under it. */
  showLabels?: boolean;
  labels?: Partial<CallControlLabels>;
  accentColor?: string;
  /** Extra buttons drawn after the toggles and before the end button. */
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

// ---------------------------------------------------------------------------
//  CallScreen
// ---------------------------------------------------------------------------

export type CallMode = 'voice' | 'video';

/** Which corner the local picture-in-picture sits in. */
export type CallPipCorner = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

export interface CallScreenLabels extends CallStatusLabels {
  minimise: string;
  chat: string;
  participants: string;
  /** Names the PiP's move button: `movePip('top-left')`. */
  movePip: (corner: CallPipCorner) => string;
}

export interface CallScreenProps {
  mode?: CallMode;
  /** The person or group on the other end. */
  name: string;
  /** One quiet line under the name — "Mobile", "5 participants". */
  subtitle?: string;
  avatar?: CallAvatarSource;
  /** `ImageResolver` rendition for a bare-id `avatar`. */
  avatarVariant?: string;
  status: CallStatus;
  /** Pre-formatted elapsed time. Only drawn while `active`. */
  duration?: string;
  /** Replaces the status line entirely. */
  statusText?: string;
  /**
   * The hue the voice stage is washed with — a colour the app derived from the
   * contact's artwork, NOT sampled here. Defaults to the theme accent.
   */
  accentColor?: string;
  /** The end-to-end line under the status — a string, or your own node. */
  encryption?: ReactNode;
  /** The remote video frame. Fills the stage; `mode="video"` without it shows the avatar. */
  remoteVideo?: ReactNode;
  /** The local camera frame, drawn as the picture-in-picture. */
  localVideo?: ReactNode;
  /** Default `top-right`. */
  localVideoCorner?: CallPipCorner;
  /** Called with the NEXT corner when the PiP's move button is pressed. */
  onMoveLocal?: (corner: CallPipCorner) => void;
  /** PiP size. Default 96 × 140. */
  localVideoWidth?: number;
  /** The control bar's props. Omit for a stage with no controls. */
  controls?: CallControlsProps;
  /** Replaces the control bar entirely. */
  controlsSlot?: ReactNode;
  onMinimise?: () => void;
  onOpenChat?: () => void;
  onOpenParticipants?: () => void;
  /** Drawn on the participants button. */
  participantCount?: number;
  /** Extra chrome in the top bar, between the minimise button and the actions. */
  topBarSlot?: ReactNode;
  /**
   * Collapses the whole screen to {@link CallMinimisedPillProps} — the same
   * call, one boolean. The pill reads `name`, `duration`, `mode`, `accentColor`
   * and `controls.muted`; `onMinimise` becomes its EXPAND press.
   */
  minimised?: boolean;
  labels?: Partial<CallScreenLabels>;
  /** Anything drawn over the stage — a "poor connection" banner, a reaction burst. */
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export interface CallMinimisedPillProps {
  /** Who the call is with. Truncates to one line. */
  name?: string;
  /** Pre-formatted elapsed time, in tabular figures. */
  duration?: string;
  /** Replaces `duration` — "Reconnecting…". */
  statusText?: string;
  mode?: CallMode;
  /** Draws the struck-through mic. */
  muted?: boolean;
  onMutedChange?: (next: boolean) => void;
  /** Press the pill to go back to the call. */
  onExpand?: () => void;
  onEndCall?: () => void;
  accentColor?: string;
  labels?: Partial<Pick<CallControlLabels, 'mute' | 'unmute' | 'endCall'>> & {
    expand?: string;
  };
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

// ---------------------------------------------------------------------------
//  Incoming
// ---------------------------------------------------------------------------

export interface IncomingCallLabels {
  accept: string;
  decline: string;
  message: string;
  remind: string;
  /** The hint under the slider. */
  slideToAnswer: string;
  voice: string;
  video: string;
}

export interface IncomingCallBannerProps {
  name: string;
  avatar?: CallAvatarSource;
  avatarVariant?: string;
  mode?: CallMode;
  /** Replaces "Incoming voice call" / "Incoming video call". */
  subtitle?: string;
  status?: PresenceStatus;
  onAccept?: () => void;
  onDecline?: () => void;
  /** Press the banner body (not the buttons) to open the full screen. */
  onPress?: () => void;
  labels?: Partial<IncomingCallLabels>;
  accentColor?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/** `buttons` — two round buttons. `slide` — a track you drag or tap. */
export type IncomingCallAnswerMode = 'buttons' | 'slide';

export interface IncomingCallScreenProps {
  name: string;
  avatar?: CallAvatarSource;
  avatarVariant?: string;
  mode?: CallMode;
  subtitle?: string;
  accentColor?: string;
  /** Default `buttons`. */
  answerMode?: IncomingCallAnswerMode;
  onAccept?: () => void;
  onDecline?: () => void;
  /** Draws the "Message" button under the answer row. */
  onMessage?: () => void;
  /** Draws the "Remind me" button under the answer row. */
  onRemind?: () => void;
  labels?: Partial<IncomingCallLabels>;
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

// ---------------------------------------------------------------------------
//  Group call
// ---------------------------------------------------------------------------

export interface GroupCallParticipant {
  id: string;
  name: string;
  avatar?: CallAvatarSource;
  avatarVariant?: string;
  /** The participant's video frame. Without one the tile draws the avatar. */
  video?: ReactNode;
  muted?: boolean;
  /** Draws the speaking ring, and animates it. */
  speaking?: boolean;
  /** Marks the tile as the one sharing a screen. */
  presenting?: boolean;
  /** Replaces the name pill's text (`"You"`). */
  label?: string;
  accentColor?: string;
}

/** `grid` — equal tiles. `spotlight` — one big tile plus a strip. */
export type GroupCallLayout = 'grid' | 'spotlight';

export interface GroupCallGridProps {
  participants: readonly GroupCallParticipant[];
  /** Default `grid`. */
  layout?: GroupCallLayout;
  /** Which tile fills the stage in `spotlight`. Defaults to the presenter, then the speaker, then the first. */
  spotlightId?: string;
  /**
   * Tiles drawn before the `+N` overflow tile takes over the last cell.
   * Default 9. `0` means no limit.
   */
  maxTiles?: number;
  /** Columns override. Default {@link callGridColumns} of the tile count. */
  columns?: number;
  /** Gutter between tiles. Default 8. */
  gap?: number;
  /** Tile aspect (width / height). Default 1. */
  aspectRatio?: number;
  /** Fixed grid width. Without it the grid measures itself. */
  width?: number;
  onParticipantPress?: (id: string) => void;
  /** Names the overflow tile. Default `"+3 more"`. */
  formatOverflow?: (count: number) => string;
  /** Names a muted tile for assistive tech. Default `"<name>, muted"`. */
  formatMuted?: (name: string) => string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export interface GroupCallTileProps {
  participant: GroupCallParticipant;
  width: number;
  height: number;
  onPress?: (id: string) => void;
  formatMuted?: (name: string) => string;
  /** Larger name pill and glyphs, for the spotlight tile. */
  prominent?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export interface GroupCallBarProps {
  /** The headline — "Group call". */
  title?: string;
  /** Who is speaking right now. Drawn with a live dot; wins over `statusText`. */
  speakingName?: string;
  /** The quiet line when nobody is speaking — "4 on the call". */
  statusText?: string;
  participants?: readonly Pick<GroupCallParticipant, 'id' | 'name' | 'avatar' | 'avatarVariant'>[];
  /** Avatars drawn before the `+N` mark. Default 4. */
  maxAvatars?: number;
  /** Switches the trailing button between "Join" and "Leave". */
  joined?: boolean;
  onJoin?: () => void;
  onLeave?: () => void;
  muted?: boolean;
  onMutedChange?: (next: boolean) => void;
  /** Press the bar body to open the call. */
  onPress?: () => void;
  labels?: Partial<{
    join: string;
    leave: string;
    speaking: (name: string) => string;
    mute: string;
    unmute: string;
  }>;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

// ---------------------------------------------------------------------------
//  Call history
// ---------------------------------------------------------------------------

/** `missed` and `declined` are drawn in the negative colour; the other two are quiet. */
export type CallDirection = 'incoming' | 'outgoing' | 'missed' | 'declined';

export interface CallHistoryLabels {
  incoming: string;
  outgoing: string;
  missed: string;
  declined: string;
  /** Names the trailing button: `callBack('Ana Restrepo')`. */
  callBack: (name: string) => string;
}

export interface CallHistoryRowProps {
  name: string;
  avatar?: CallAvatarSource;
  avatarVariant?: string;
  direction: CallDirection;
  mode?: CallMode;
  /** The whole second line, PRE-FORMATTED — `"Yesterday, 18:40 · 4:32"`. */
  meta: string;
  /** Repeated calls in one entry — drawn as `"(3)"` after the name. */
  count?: number;
  onPress?: () => void;
  /** Draws the trailing call-back button. */
  onCallBack?: () => void;
  /** Tints the row, for a selected entry in a two-pane layout. */
  selected?: boolean;
  labels?: Partial<CallHistoryLabels>;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  testID?: string;
}

export interface CallHistoryItem extends Omit<CallHistoryRowProps, 'onPress' | 'onCallBack'> {
  id: string;
}

export interface CallHistorySection {
  /** Falls back to `title` when absent. */
  id?: string;
  /** The day heading — `"Today"`, `"Last week"`. Pre-formatted. */
  title: string;
  items: readonly CallHistoryItem[];
}

export interface CallHistoryListProps {
  sections: readonly CallHistorySection[];
  onItemPress?: (id: string) => void;
  onCallBack?: (id: string) => void;
  /** Hairline between rows inside a section. Default true. */
  divider?: boolean;
  /** Drawn instead of the sections when every one of them is empty. */
  emptyState?: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
  labels?: Partial<CallHistoryLabels>;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
