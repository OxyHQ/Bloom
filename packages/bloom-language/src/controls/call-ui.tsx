import {
  CallMinimisedPill as BloomCallMinimisedPill,
  type CallMinimisedPillProps,
  type CallControlsProps,
  CallScreen as BloomCallScreen,
  type CallScreenProps,
  type CallStatus,
  GroupCallGrid as BloomGroupCallGrid,
  type GroupCallGridProps,
  type GroupCallParticipant,
  IncomingCallBanner as BloomIncomingCallBanner,
  type IncomingCallBannerProps,
  IncomingCallScreen as BloomIncomingCallScreen,
  type IncomingCallScreenProps,
} from '@oxy.so/bloom/call-ui';

import { type Child, Node, type ViewModifiers } from '../node';
import type {
  CallControlSize,
  CallMode,
  ColorToken,
  GroupCallLayout,
  IncomingCallAnswer,
  SpaceToken,
} from '../tokens';
import type { ControlDraw, ControlRenderer } from './draw';
import { length, product, slot } from './product';

/** The call screens: a call in progress, minimised, in a group, and ringing. */
export type CallUiKind =
  | 'callScreen'
  | 'callMinimisedPill'
  | 'groupCallGrid'
  | 'incomingCallScreen'
  | 'incomingCallBanner';

/** What the language draws itself: the box, the name, the call's look. */
type Drawn = 'style' | 'testID' | 'mode' | 'accentColor';

/**
 * A call screen's control bar: Bloom `CallControls`' toggles and handlers. Its
 * size is the screen's `.size()`, its colour the screen's `.tint()`; extra
 * buttons drawn before the end button are `extra`, language children.
 */
export type CallScreenControls = Omit<
  CallControlsProps,
  'style' | 'testID' | 'size' | 'accentColor' | 'children'
> & { readonly extra?: Child };

type CallScreenSlots = 'remoteVideo' | 'localVideo' | 'controlsSlot' | 'topBarSlot';
/**
 * Bloom `CallScreen`'s data: who, the time, its handlers and words. The video
 * frames, a control bar of the app's own and the top bar's extra chrome are
 * language children, as is `content` (what Bloom draws over the stage); the
 * end-to-end line is a string or a view; the picture-in-picture's width is a
 * space token.
 */
export type CallScreenOptions = Omit<
  CallScreenProps,
  | Drawn
  | 'name'
  | 'status'
  | 'children'
  | 'encryption'
  | 'localVideoWidth'
  | 'controls'
  | CallScreenSlots
> & {
  readonly [K in CallScreenSlots]?: Child;
} & {
  readonly encryption?: string | Child;
  readonly localVideoWidth?: SpaceToken;
  readonly controls?: CallScreenControls;
  readonly content?: Child;
};
export type CallMinimisedPillOptions = Omit<CallMinimisedPillProps, Drawn | 'name'>;
/** Bloom `GroupCallGrid`'s data; its fixed width is a space token. */
export type GroupCallGridOptions = Omit<
  GroupCallGridProps,
  Drawn | 'participants' | 'layout' | 'columns' | 'gap' | 'aspectRatio' | 'width'
> & { readonly width?: SpaceToken };
/** Bloom `IncomingCallScreen`'s data; `content` is what it draws under its buttons (Bloom's children). */
export type IncomingCallScreenOptions = Omit<
  IncomingCallScreenProps,
  Drawn | 'name' | 'answerMode' | 'children'
> & { readonly content?: Child };
export type IncomingCallBannerOptions = Omit<IncomingCallBannerProps, Drawn | 'name' | 'onPress'>;

/** A call's look: its medium and the hue its stage is washed with. */
interface CallLook<Self> {
  /** `voice` (default) or `video`. */
  style(value: CallMode): Self;
  /** The accent the stage is washed with: the theme's accent by default. */
  tint(value: ColorToken): Self;
}

export interface CallScreenView extends ViewModifiers<CallScreenView>, CallLook<CallScreenView> {
  /** The control bar's buttons: `sm` 40, `md` 48 or `lg` 56. */
  size(value: CallControlSize): CallScreenView;
}
export interface CallMinimisedPillView
  extends ViewModifiers<CallMinimisedPillView>,
    CallLook<CallMinimisedPillView> {}
export interface GroupCallGridView extends ViewModifiers<GroupCallGridView> {
  /** `grid` (default): equal tiles; `spotlight`: one big tile and a strip. */
  style(value: GroupCallLayout): GroupCallGridView;
  columns(value: number): GroupCallGridView;
  /** The gutter between tiles. */
  spacing(value: SpaceToken): GroupCallGridView;
  /** A tile's width over its height (1 by default). */
  aspectRatio(value: number): GroupCallGridView;
}
export interface IncomingCallScreenView
  extends ViewModifiers<IncomingCallScreenView>,
    CallLook<IncomingCallScreenView> {
  /** Two round `buttons` (default), or a `slide` track. */
  answerStyle(value: IncomingCallAnswer): IncomingCallScreenView;
}
export interface IncomingCallBannerView
  extends ViewModifiers<IncomingCallBannerView>,
    CallLook<IncomingCallBannerView> {}

const node = (kind: CallUiKind, props: object, children: Child[] = []) =>
  new Node(kind, props, children);

/** Bloom `CallScreen`: the call with `name`, at `status`. */
export function CallScreen(
  name: string,
  status: CallStatus,
  options: CallScreenOptions = {},
): CallScreenView {
  const { content, ...rest } = options;
  return node(
    'callScreen',
    { name, status, options: rest },
    content === undefined ? [] : [content],
  );
}
/** Bloom `CallMinimisedPill`: the call with `name`, folded into a pill. */
export function CallMinimisedPill(
  name?: string,
  options: CallMinimisedPillOptions = {},
): CallMinimisedPillView {
  return node('callMinimisedPill', { name, options });
}
/** Bloom `GroupCallGrid` of `participants`. */
export function GroupCallGrid(
  participants: readonly GroupCallParticipant[],
  options: GroupCallGridOptions = {},
): GroupCallGridView {
  return node('groupCallGrid', { participants, options });
}
/** Bloom `IncomingCallScreen`: `name` is calling. */
export function IncomingCallScreen(
  name: string,
  options: IncomingCallScreenOptions = {},
): IncomingCallScreenView {
  const { content, ...rest } = options;
  return node(
    'incomingCallScreen',
    { name, options: rest },
    content === undefined ? [] : [content],
  );
}
/** Bloom `IncomingCallBanner`: `name` is calling; `.onPress()` opens the call. */
export function IncomingCallBanner(
  name: string,
  options: IncomingCallBannerOptions = {},
): IncomingCallBannerView {
  return node('incomingCallBanner', { name, options });
}

/** A call's medium, and its accent painted from its role. */
const look = {
  colors: (d: ControlDraw) => ({ accentColor: d.own('tint')?.value as ColorToken | undefined }),
};
const mode = (d: ControlDraw) => d.own('style')?.value as CallMode | undefined;

/** A call screen's control bar as Bloom takes it: its size and extra buttons drawn in. */
function controlsOf(d: ControlDraw): CallControlsProps | undefined {
  const { controls } = (d.node.props as { options: CallScreenOptions }).options;
  if (controls === undefined) return undefined;
  const size = d.own('size')?.value as CallControlSize | undefined;
  const { extra, ...rest } = controls;
  if (size === undefined && extra === undefined) return rest;
  return { ...rest, size, children: slot(d, extra) };
}

export const CALL_UIS: Record<CallUiKind, ControlRenderer> = {
  callScreen: product(BloomCallScreen, {
    ...look,
    slots: ['remoteVideo', 'localVideo', 'controlsSlot', 'topBarSlot'],
    lengths: ['localVideoWidth'],
    own: (d) => {
      const { encryption } = (d.node.props as { options: CallScreenOptions }).options;
      return {
        mode: mode(d),
        controls: controlsOf(d),
        encryption: typeof encryption === 'string' ? encryption : slot(d, encryption),
      };
    },
  }),
  callMinimisedPill: product(BloomCallMinimisedPill, {
    ...look,
    own: (d) => ({ mode: mode(d) }),
  }),
  groupCallGrid: product(BloomGroupCallGrid, {
    lengths: ['width'],
    own: (d) => ({
      layout: d.own('style')?.value,
      columns: d.own('columns')?.value,
      gap: length(d.own('spacing')?.value as SpaceToken | undefined),
      aspectRatio: d.own('aspectRatio')?.value,
    }),
  }),
  incomingCallScreen: product(BloomIncomingCallScreen, {
    ...look,
    own: (d) => ({ mode: mode(d), answerMode: d.own('answerStyle')?.value }),
  }),
  incomingCallBanner: product(BloomIncomingCallBanner, {
    ...look,
    press: true,
    own: (d) => ({ mode: mode(d) }),
  }),
};
