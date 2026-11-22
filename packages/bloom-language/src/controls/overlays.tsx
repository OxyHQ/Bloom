import { createElement, Fragment, type ReactElement, type ReactNode } from 'react';
import { AlertDialog } from '@oxy.so/bloom/alert-dialog';
import { ConnectionStatusToasts } from '@oxy.so/bloom/connection-status';
import {
  Dialog as BloomDialog,
  type DialogAction,
  type DialogHeaderConfig,
  type DialogScreenFrame,
} from '@oxy.so/bloom/dialog';
import { Popover as BloomPopover, PopoverContent, PopoverTrigger } from '@oxy.so/bloom/popover';

import type { Binding } from '../binding';
import type { ENUMS } from '../generated/spec.generated';
import {
  type Child,
  type FrameSpec,
  isNode,
  type Modifier,
  Node,
  type NodeKind,
  type ValueModifiers,
  type ViewModifiers,
  type ViewNode,
} from '../node';
import { type PaddingToken, resolveSpace, type SpaceToken } from '../tokens';
import { lastOf } from './draw';
import type { ControlRenderer } from './draw';

/** Overlays and feedback: dialogs, alerts, popovers, toasts. */
export type OverlayKind = 'alert' | 'dialog' | 'popover' | 'connectionStatus';

export type DialogPlacement = (typeof ENUMS.dialogPlacement)[number];
export type AlertDefault = (typeof ENUMS.alertDefault)[number];
export type FloatingSide = (typeof ENUMS.floatingSide)[number];
export type FloatingAlign = (typeof ENUMS.floatingAlign)[number];
/** Where a dialog presents from each breakpoint up, over its `base` placement. */
export interface DialogTiers {
  readonly sm?: DialogPlacement;
  readonly md?: DialogPlacement;
  readonly lg?: DialogPlacement;
  readonly xl?: DialogPlacement;
}
/** A dialog's width and its ceiling (Bloom's `width` and `maxWidth`), as space tokens. */
export interface DialogFrame {
  readonly width?: SpaceToken;
  readonly maxWidth?: SpaceToken;
}
/** A popover's widths and height ceiling (Bloom's `minWidth`, `maxWidth`, `maxHeight`). */
export interface PopoverFrame {
  readonly minWidth?: SpaceToken;
  readonly maxWidth?: SpaceToken;
  readonly maxHeight?: SpaceToken;
}

/**
 * What a view presents (`.alert()`, `.dialog()`, `.popover()`): data the view
 * draws while its binding holds, never a view of its own in a stack.
 */
export interface PresentedNode {
  readonly kind: NodeKind;
  readonly props: unknown;
  readonly modifiers: readonly Modifier[];
}

/** A presentation modifier's value: when it shows, and what. */
export interface Presentation {
  readonly isPresented: Binding<boolean>;
  readonly content: PresentedNode;
}

/** Bloom `AlertDialog`: a title, a message and its confirm and cancel actions. */
export interface AlertView extends PresentedNode {
  /** The text under the title. */
  message(value: string): AlertView;
  /** The confirm button's label (Bloom's localized "Confirm" without it). */
  confirmLabel(value: string): AlertView;
  /** The cancel button's label (Bloom's localized "Cancel" without it). */
  cancelLabel(value: string): AlertView;
  /** Runs when the confirm button is pressed; the alert then closes. */
  onConfirm(value: (() => void) | undefined): AlertView;
  /** Runs when the alert is cancelled: the cancel button, Escape or the backdrop. */
  onCancel(value: (() => void) | undefined): AlertView;
  /** The confirm button in the destructive tone. */
  destructive(): AlertView;
  /** Only the confirm button: an acknowledgement. */
  hideCancel(): AlertView;
  /** The action that takes the initial focus and Enter. */
  defaultAction(value: AlertDefault): AlertView;
  /** `false`: Escape and the backdrop do not dismiss it. */
  dismissible(value: boolean): AlertView;
  testID(value: string): AlertView;
  /** A view above the title (the application's icon). */
  icon(value: ViewNode): AlertView;
}

/** Bloom `Dialog`: its content, a title, a message and a row of buttons. */
export interface DialogView extends PresentedNode {
  title(value: string): DialogView;
  /** The text under the title. */
  message(value: string): DialogView;
  /** The dialog's accessible name, when it has no title. */
  label(value: string | undefined): DialogView;
  /** The action row: Bloom's `DialogAction`s, in order. */
  buttons(value: readonly DialogAction[]): DialogView;
  /** Where it presents: `base`, and from each breakpoint `tiers` names up (Bloom's responsive placement). */
  presentAt(base: DialogPlacement, tiers?: DialogTiers): DialogView;
  /** Bloom's dialog header: a collapsing title, its slots and its layout. */
  header(value: DialogHeaderConfig): DialogView;
  /** A view pinned under the content (Bloom's `footer`). */
  footer(content: Child): DialogView;
  /** A page of a dialog that navigates (Bloom's `frame`: its key, header and travel). */
  page(value: DialogScreenFrame): DialogView;
  /** Its width and its ceiling. */
  frame(value: DialogFrame): DialogView;
  /** The padding around its content (Bloom's `contentPadding`). */
  padding(value: SpaceToken): DialogView;
  /** The least room kept beside it on a narrow screen (Bloom's `minSideGutter`). */
  sideGutter(value: SpaceToken): DialogView;
  /** Its height ceiling, as a fraction of the window's (`0.9`). */
  maxHeightRatio(value: number): DialogView;
  /** `false`: a press on the backdrop does not dismiss it. */
  dismissOnBackdrop(value: boolean): DialogView;
  /** Its content scrolls when it is taller than the dialog. */
  scrollable(value?: boolean): DialogView;
  testID(value: string): DialogView;
}

/** Bloom `Popover`: content anchored on the view that presents it. */
export interface PopoverView extends PresentedNode {
  /** The popover's accessible name. */
  label(value: string | undefined): PopoverView;
  /** The side of the view it opens on, and its alignment along that side. */
  side(side: FloatingSide, align?: FloatingAlign): PopoverView;
  testID(value: string): PopoverView;
  /** The gap between the view and the popover. */
  sideOffset(value: SpaceToken): PopoverView;
  /** A shift along the side it opens on (negative toward the start). */
  alignOffset(value: PaddingToken): PopoverView;
  /** Its widths and its height ceiling. */
  frame(value: PopoverFrame): PopoverView;
}

/** Bloom `ConnectionStatusToasts`: the offline, reconnecting and restored toasts. It draws nothing itself. */
export interface ConnectionStatusView extends ViewNode {
  /** What the offline toast says (Bloom's localized words without it). */
  offlineMessage(value: string): ConnectionStatusView;
  reconnectingMessage(value: string): ConnectionStatusView;
  restoredMessage(value: string): ConnectionStatusView;
  /** How long an outage lasts before the reconnecting toast shows, in milliseconds. */
  reconnectingDelay(ms: number): ConnectionStatusView;
  /** How long the restored toast stays, in milliseconds. */
  restoredDuration(ms: number): ConnectionStatusView;
}

const NO_CHILDREN: readonly Child[] = [];

/**
 * An alert, presented with `.alert(isPresented, Alert(title))`: Bloom's
 * `AlertDialog`, its confirm and cancel actions closing it.
 */
export function Alert(title: string): AlertView {
  return new Node('alert', { title }, NO_CHILDREN);
}

/**
 * A dialog of `content`, presented with `.dialog(isPresented, Dialog(...))`:
 * Bloom's `Dialog`, from the bottom and centred from `md` as it places itself,
 * or where `.presentAt()` says.
 */
export function Dialog(...content: Child[]): DialogView {
  return new Node('dialog', null, content);
}

/**
 * A popover of `content`, presented with `.popover(isPresented, Popover(...))`
 * on the view it is anchored on: Bloom's `Popover`, that view its trigger.
 */
export function Popover(...content: Child[]): PopoverView {
  return new Node('popover', null, content);
}

/**
 * Bloom's connection toasts: an outage, the reconnection, the network back. It
 * draws nothing in place; place it once, near the app's root.
 */
export function ConnectionStatus(): ConnectionStatusView {
  return new Node('connectionStatus', null, NO_CHILDREN);
}

/** The renderer of each kind in this family. */
export const OVERLAYS: Partial<Record<OverlayKind, ControlRenderer>> = {
  connectionStatus: (d) =>
    d.component(ConnectionStatusToasts, {
      key: d.key,
      offlineMessage: d.own('offlineMessage')?.value,
      reconnectingMessage: d.own('reconnectingMessage')?.value,
      restoredMessage: d.own('restoredMessage')?.value,
      reconnectingDelayMs: d.own('reconnectingDelay')?.value,
      restoredDurationMs: d.own('restoredDuration')?.value,
    }),
};

/** A presented node's own values: the last of each of its modifiers. */
type Own = Partial<
  ValueModifiers & {
    label: string | undefined;
    testID: string;
    frame: FrameSpec;
    padding: SpaceToken;
  }
>;

/** A space token as Bloom's number prop, when it is set. */
function space(token: PaddingToken | undefined): number | undefined {
  return token === undefined ? undefined : resolveSpace(token);
}

/** One presented view, drawn where its presenter is. */
function one(
  render: (children: readonly Child[]) => ReactNode[],
  view: Child | undefined,
): ReactNode {
  return view === undefined ? undefined : render([view])[0];
}

function values(node: PresentedNode): Own {
  const out: Record<string, unknown> = {};
  for (const modifier of node.modifiers)
    out[modifier.kind] = (modifier as { value?: unknown }).value;
  return out as Own;
}

/** A view's presentations, each by its modifier: what `presentAround` draws. */
export interface Presentations {
  readonly alert: Presentation | undefined;
  readonly dialog: Presentation | undefined;
  readonly popover: Presentation | undefined;
}

/**
 * A view with what it presents: a popover's trigger is the view itself, and an
 * alert or a dialog is drawn beside it (each portals itself over the screen),
 * as an app writes them next to the control that opens them.
 */
export function presentAround(
  element: ReactElement,
  { alert, dialog, popover }: Presentations,
  render: (children: readonly Child[]) => ReactNode[],
  key: string | number | undefined,
): ReactElement {
  const anchored = popover === undefined ? element : drawPopover(element, popover, render, key);
  if (alert === undefined && dialog === undefined) return anchored;
  return createElement(
    Fragment,
    { key },
    anchored,
    alert === undefined ? null : drawAlert(alert, render),
    dialog === undefined ? null : drawDialog(dialog, render),
  );
}

function drawAlert(
  { isPresented: [open, setOpen], content }: Presentation,
  render: (children: readonly Child[]) => ReactNode[],
): ReactElement {
  const own = values(content);
  return createElement(AlertDialog, {
    icon: one(render, own.icon as ViewNode | undefined),
    open,
    onOpenChange: setOpen,
    title: (content.props as { title: string }).title,
    description: own.message,
    confirmLabel: own.confirmLabel,
    cancelLabel: own.cancelLabel,
    onConfirm: own.onConfirm,
    onCancel: own.onCancel,
    destructive: own.destructive,
    hideCancel: own.hideCancel,
    defaultAction: own.defaultAction,
    dismissible: own.dismissible,
    testID: own.testID,
  });
}

function drawDialog(
  { isPresented: [open, setOpen], content }: Presentation,
  render: (children: readonly Child[]) => ReactNode[],
): ReactElement {
  const own = values(content);
  const at = own.presentAt;
  const footer = isNode(content) ? lastOf(content, 'footer')?.content : undefined;
  return createElement(
    BloomDialog,
    {
      open,
      onClose: () => setOpen(false),
      header: own.header as DialogHeaderConfig | undefined,
      footer: one(render, footer),
      frame: own.page as DialogScreenFrame | undefined,
      width: space(own.frame?.width as SpaceToken | undefined),
      maxWidth: space(own.frame?.maxWidth as SpaceToken | undefined),
      contentPadding: space(own.padding),
      minSideGutter: space(own.sideGutter),
      maxHeightRatio: own.maxHeightRatio,
      title: own.title,
      description: own.message,
      label: own.label,
      actions: own.buttons as DialogAction[] | undefined,
      placement:
        at === undefined
          ? undefined
          : at.tiers === undefined
            ? at.base
            : { base: at.base, ...at.tiers },
      dismissOnBackdrop: own.dismissOnBackdrop,
      scrollable: own.scrollable,
      testID: own.testID,
    },
    ...(isNode(content) ? render(content.children) : []),
  );
}

function drawPopover(
  element: ReactElement,
  { isPresented: [open, setOpen], content }: Presentation,
  render: (children: readonly Child[]) => ReactNode[],
  key: string | number | undefined,
): ReactElement {
  const own = values(content);
  const side = own.side;
  return createElement(
    BloomPopover,
    { key, open, onOpenChange: setOpen },
    createElement(PopoverTrigger, { asChild: true }, element),
    createElement(
      PopoverContent,
      {
        label: own.label,
        side: side?.side,
        align: side?.align,
        sideOffset: space(own.sideOffset),
        alignOffset: space(own.alignOffset),
        minWidth: space(own.frame?.minWidth as SpaceToken | undefined),
        maxWidth: space(own.frame?.maxWidth as SpaceToken | undefined),
        maxHeight: space(own.frame?.maxHeight as SpaceToken | undefined),
        testID: own.testID,
      },
      ...(isNode(content) ? render(content.children) : []),
    ),
  );
}
