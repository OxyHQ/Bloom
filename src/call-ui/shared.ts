import {
  ACCENT_TABLE,
  colorRamp,
  DANGER_TABLE,
  mixColor,
  resolveButtonRamps,
} from '../button/shared';
import type { Theme } from '../theme/types';
import type {
  CallControlKey,
  CallControlLabels,
  CallControlSize,
  CallHistoryLabels,
  CallPipCorner,
  CallScreenLabels,
  CallStatusLabels,
  CallStatusLineInput,
  GroupCallParticipant,
  IncomingCallLabels,
} from './types';

// ---------------------------------------------------------------------------
//  The stage palette
// ---------------------------------------------------------------------------

/**
 * A call STAGE is dark in both modes, and that is a decision rather than an
 * oversight.
 *
 * The stage backs a video frame Bloom does not own. White chrome over an
 * unknown frame is the only thing that survives a bright kitchen and a dark
 * bedroom in the same call, and a light-mode stage would have to repaint every
 * glyph the moment the camera turns on. So the MODE picks the depth
 * (`neutral-900` light, `neutral-950` dark) and nothing else: the preset's hue
 * still tints both, and the accent still comes from the theme.
 *
 * The surfaces that are IN the app rather than over the video — the incoming
 * banner, the call-log row, the group-call strip — take the ordinary theme
 * surface and flip with the mode like everything else in Bloom.
 */
export interface CallPaint {
  /** The stage fill. */
  stage: string;
  /** The wash the voice stage fades from, mixed from `accentColor`. */
  stageWash: string;
  /** Text on the stage. */
  onStage: string;
  /** The status line and the encryption line. */
  onStageMuted: string;
  /** A control button at rest. */
  control: string;
  controlHover: string;
  /** A control button while its toggle is ON — the inverted fill. */
  controlActive: string;
  /** The glyph on `controlActive`. */
  onControlActive: string;
  /** The end-call button. */
  end: string;
  endHover: string;
  onEnd: string;
  /** The accept button. */
  accept: string;
  acceptHover: string;
  onAccept: string;
  /** The speaking ring, and the live dot on the group bar. */
  speaking: string;
  /**
   * A negative glyph drawn ON THE STAGE — the muted mic on a tile pill.
   * `negative` is the theme's text red, which is a PALE rose in dark mode and a
   * deep one in light; the stage is dark in both, so neither works there.
   */
  negativeOnStage: string;
  /** The PiP frame's hairline. */
  pipBorder: string;
  /** A group-call tile with no video. */
  tile: string;
  /** The name pill over a tile. */
  tilePill: string;

  // In-app surfaces (these DO flip with the mode).
  surface: string;
  surfaceRaised: string;
  border: string;
  text: string;
  textSecondary: string;
  /** Missed and declined calls. */
  negative: string;
  accent: string;
  onAccent: string;
  /** The row highlight for a selected call-log entry. */
  rowSelected: string;
}

export function resolveCallPaint(theme: Theme, accentColor?: string): CallPaint {
  const { accent, neutral: n } = resolveButtonRamps(theme);
  const c = theme.colors;
  const dark = theme.isDark;
  const red = colorRamp(c.negative, DANGER_TABLE);
  const green = colorRamp(c.success, ACCENT_TABLE);
  const hue = accentColor ?? accent[500];
  const stage = dark ? n[950] : n[900];

  return {
    stage,
    // 0.42 is the most wash the stage takes before the status line stops
    // clearing AA against it on the brightest preset.
    stageWash: mixColor(stage, hue, 0.42),
    onStage: n[50],
    onStageMuted: mixColor(stage, n[50], 0.72),
    control: mixColor(stage, n[50], 0.16),
    controlHover: mixColor(stage, n[50], 0.26),
    controlActive: n[50],
    onControlActive: n[900],
    // READ THE PAIR. `negative`/`negativeForeground` is the text pair — in dark
    // mode it is a pale rose meant for type on a dark page, and a filled circle
    // painted from it reads as a warning sticker rather than as "stop". The
    // ERROR pair is the filled one and it is strong in both modes, which is what
    // a stage that is dark in both modes needs.
    end: c.error,
    endHover: mixColor(c.error, c.errorForeground, 0.16),
    onEnd: c.errorForeground,
    accept: c.success,
    acceptHover: mixColor(c.success, c.successForeground, 0.16),
    onAccept: c.successForeground,
    speaking: dark ? green[400] : green[500],
    negativeOnStage: colorRamp(c.error, DANGER_TABLE)[400],
    pipBorder: mixColor(stage, n[50], 0.24),
    tile: mixColor(stage, n[50], 0.09),
    tilePill: mixColor(stage, n[950], 0.45),

    surface: c.background,
    surfaceRaised: c.card,
    border: c.border,
    text: c.text,
    textSecondary: c.textSecondary,
    negative: dark ? red[400] : red[500],
    accent: accent[500],
    onAccent: c.primaryForeground,
    rowSelected: c.backgroundSecondary,
  };
}

// ---------------------------------------------------------------------------
//  Status line
// ---------------------------------------------------------------------------

export const CALL_STATUS_LABELS: CallStatusLabels = {
  calling: 'Calling…',
  ringing: 'Ringing',
  connecting: 'Connecting…',
  active: 'Connected',
  reconnecting: 'Reconnecting…',
  onHold: 'On hold',
  ended: 'Call ended',
};

/**
 * The ONE line under the name, resolved by precedence rather than by five
 * call sites each picking their own.
 *
 *   1. `statusText`     the app said exactly what to show
 *   2. `ended`          never a timer: a call that is over has no elapsed time,
 *                       and the last tick frozen on screen reads as live
 *   3. `reconnecting`   the timer keeps counting underneath, but saying so
 *                       while the media is down is a lie the user can see
 *   4. `active`         `duration`, or the `active` label until the first tick
 *   5. anything else    that status's own label
 *
 * Written as a function, not as JSX branches, because it is the part that has
 * a wrong answer — and `duration` surviving into `ended` was the wrong answer
 * this shape exists to make impossible.
 */
export function resolveCallStatusLine(input: CallStatusLineInput): string {
  const { status, duration, statusText, labels } = input;
  if (statusText !== undefined && statusText !== '') return statusText;
  const l = { ...CALL_STATUS_LABELS, ...labels };
  if (status === 'ended') return l.ended;
  if (status === 'reconnecting') return l.reconnecting;
  if (status === 'active') return duration !== undefined && duration !== '' ? duration : l.active;
  return l[status];
}

/** Whether the stage should keep drawing the control bar. */
export function callIsLive(status: CallStatusLineInput['status']): boolean {
  return status !== 'ended';
}

// ---------------------------------------------------------------------------
//  Controls
// ---------------------------------------------------------------------------

export const CALL_CONTROL_LABELS: CallControlLabels = {
  mute: 'Mute',
  unmute: 'Unmute',
  speakerOn: 'Turn speaker on',
  speakerOff: 'Turn speaker off',
  videoOn: 'Turn camera on',
  videoOff: 'Turn camera off',
  flipCamera: 'Flip camera',
  screenShareOn: 'Share screen',
  screenShareOff: 'Stop sharing screen',
  addParticipant: 'Add participant',
  endCall: 'End call',
};

/** The order a bar draws its toggles in, whichever subset is present. */
export const CALL_CONTROL_ORDER: readonly CallControlKey[] = [
  'mute',
  'video',
  'speaker',
  'screenShare',
  'flipCamera',
  'addParticipant',
];

/** Button diameter and glyph size per rung. */
export const CALL_CONTROL_GEOMETRY: Record<
  CallControlSize,
  { size: number; glyph: number; gap: number }
> = {
  small: { size: 40, glyph: 20, gap: 8 },
  medium: { size: 48, glyph: 22, gap: 12 },
  large: { size: 56, glyph: 26, gap: 16 },
};

export const CALL_SCREEN_LABELS: CallScreenLabels = {
  ...CALL_STATUS_LABELS,
  minimise: 'Minimise call',
  chat: 'Open chat',
  participants: 'Participants',
  movePip: (corner) => `Move self view (now ${CALL_PIP_CORNER_NAMES[corner]})`,
};

export const CALL_PIP_CORNER_NAMES: Record<CallPipCorner, string> = {
  'top-left': 'top left',
  'top-right': 'top right',
  'bottom-left': 'bottom left',
  'bottom-right': 'bottom right',
};

/**
 * The corner the PiP moves to next — clockwise from wherever it is.
 *
 * One button that CYCLES rather than a drag gesture, because a drag has no
 * keyboard and no screen-reader equivalent; the app is still free to drag it
 * itself and report the corner it landed in.
 */
export const CALL_PIP_CYCLE: Record<CallPipCorner, CallPipCorner> = {
  'top-right': 'bottom-right',
  'bottom-right': 'bottom-left',
  'bottom-left': 'top-left',
  'top-left': 'top-right',
};

// ---------------------------------------------------------------------------
//  Group call layout
// ---------------------------------------------------------------------------

/**
 * Columns for `count` tiles: `ceil(sqrt(count))`, which is the layout people
 * already expect — 2 side by side, 4 as a square, 6 as 3×2, 9 as 3×3, 12 as
 * 4×3.
 *
 * A count of 0 still answers 1: a grid with no columns divides by zero, and a
 * participant list is empty for one frame every time a call starts.
 */
export function callGridColumns(count: number): number {
  const n = Math.max(0, Math.floor(count));
  if (n <= 1) return 1;
  return Math.ceil(Math.sqrt(n));
}

export interface CallGridLayout {
  /** How many participants are drawn as their own tile. */
  visible: number;
  /** How many are folded into the `+N` tile. `0` means there is no overflow tile. */
  overflow: number;
  columns: number;
  rows: number;
  /** Cells drawn in total — `visible` plus one when `overflow > 0`. */
  cells: number;
}

/**
 * How many tiles fit, and how they sit.
 *
 * The overflow tile TAKES A CELL rather than being added beside them: with
 * `maxTiles` 9 and 12 people the grid draws 8 faces and a `+4`, not 9 faces and
 * a tenth cell that breaks the 3×3. Getting this backwards is how a "9-up"
 * grid silently becomes a 10-cell 4×3.
 */
export function callGridLayout(count: number, maxTiles = 9, columnsOverride?: number): CallGridLayout {
  const total = Math.max(0, Math.floor(count));
  const cap = maxTiles > 0 ? Math.floor(maxTiles) : total;
  const overflowing = total > cap;
  const visible = overflowing ? Math.max(0, cap - 1) : total;
  const overflow = overflowing ? total - visible : 0;
  const cells = visible + (overflow > 0 ? 1 : 0);
  const columns = Math.max(1, columnsOverride ?? callGridColumns(cells));
  return { visible, overflow, columns, rows: Math.max(1, Math.ceil(cells / columns)), cells };
}

/**
 * Which participant the spotlight shows: the one asked for, else whoever is
 * presenting, else whoever is speaking, else the first.
 */
export function callSpotlightIndex(
  participants: readonly GroupCallParticipant[],
  spotlightId?: string,
): number {
  if (participants.length === 0) return -1;
  const byId = spotlightId ? participants.findIndex((p) => p.id === spotlightId) : -1;
  if (byId >= 0) return byId;
  const presenting = participants.findIndex((p) => p.presenting === true);
  if (presenting >= 0) return presenting;
  const speaking = participants.findIndex((p) => p.speaking === true);
  if (speaking >= 0) return speaking;
  return 0;
}

/** The speaking ring's pulse. One period, so the tile and the group bar agree. */
export const CALL_SPEAKING_PULSE_MS = 900;

// ---------------------------------------------------------------------------
//  Call history
// ---------------------------------------------------------------------------

export const CALL_HISTORY_LABELS: CallHistoryLabels = {
  incoming: 'Incoming',
  outgoing: 'Outgoing',
  missed: 'Missed',
  declined: 'Declined',
  callBack: (name) => `Call ${name} back`,
};

/** A missed or declined call is the only one drawn in the negative colour. */
export function isNegativeDirection(direction: string): boolean {
  return direction === 'missed' || direction === 'declined';
}

export const CALL_UI_RADIUS = {
  /** Cards, tiles and the incoming banner. */
  card: 16,
  /** The PiP and a group tile. */
  tile: 14,
  /** The stage itself, when it is framed rather than full-bleed. */
  stage: 20,
} as const;

// ---------------------------------------------------------------------------
//  Incoming
// ---------------------------------------------------------------------------

export const INCOMING_CALL_LABELS: IncomingCallLabels = {
  accept: 'Accept',
  decline: 'Decline',
  message: 'Message',
  remind: 'Remind me',
  slideToAnswer: 'Slide to answer',
  voice: 'Incoming voice call',
  video: 'Incoming video call',
};

/**
 * How far along the track the knob has to be RELEASED for the call to answer.
 *
 * 0.6 rather than "all the way": a slider that only fires at 100% needs a
 * pixel-accurate finish on a phone someone is fumbling for, and one that fires
 * at 30% answers calls the user was only inspecting. Exported so the gate reads
 * the same number the component does.
 */
export const SLIDE_ANSWER_THRESHOLD = 0.6;

/** Whether a release at `dx` over a `max`-px track answers the call. */
export function slideAnswers(dx: number, max: number): boolean {
  if (!(max > 0)) return false;
  return dx >= max * SLIDE_ANSWER_THRESHOLD;
}
