/**
 * The layout family's chrome as Bloom's, on every platform: a `Toolbar` its
 * tools before its actions (`.trailing`) and accessory row, a `StickySection`
 * its children docked under the header, a `ScrollArea` and a `ScrollSurface`
 * their content in Bloom's scroll, an `AutoHideBar` its bar over its body, a
 * `ResizeHandle` the separator a drag resizes. Each passes only what the
 * chain names, so Bloom's defaults hold.
 */
import type { ReactNode } from 'react';
import type { BloomSize } from '@oxy.so/bloom/appearance';
import type { MotionSpec } from '@oxy.so/bloom/motion';
import {
  AutoHideBar,
  ResizeHandle,
  ScrollArea,
  ScrollSurface,
  StickySection,
  Toolbar,
  type AutoHideBarProps,
  type ResizeHandleProps,
  type ScrollAreaProps,
  type ScrollSurfaceProps,
  type ToolbarProps,
} from '@oxy.so/bloom/layout';

import type { Child, Node } from '../node';
import { valuesOf } from '../platform/values';
import { type InsetRoom, withRoom } from './safe-area-inset';
import type { NodeHostProps } from '../platform/host.types';
import {
  resolveDuration,
  resolveSpace,
  type Axis,
  type DurationName,
  type InkToken,
  type KeyboardDismiss,
  type KeyboardTaps,
  type ResizeHandleStyle,
  type ScrollbarSide,
  type ScrollbarSize,
  type ScrollbarVisibility,
  type ScrollSurfaceStyle,
  type SpaceToken,
} from '../tokens';
import { resolveMotion, type MotionToken } from '../motion/tokens';
import { paintedHost } from '../painted-host';
import { defined } from './defined';
import { containerStyle, DISMISS_MODE } from './scroll-view-host';

type HostProps = NodeHostProps & { children?: ReactNode };

/** A space token as Bloom's number; none when the chain names none. */
function space(value: unknown): number | undefined {
  return value === undefined ? undefined : resolveSpace(value as SpaceToken);
}

export function ToolbarHost({ node, render, children }: HostProps) {
  const values = valuesOf(node);
  const trailing = values.trailing as readonly Child[] | undefined;
  const accessory = values.accessory as Child;
  const props: ToolbarProps = defined({
    actions: trailing && trailing.length > 0 ? render(trailing) : undefined,
    accessory: accessory ? render(accessory) : undefined,
    size: values.size as BloomSize | undefined,
    testID: values.testID as string | undefined,
  });
  return <Toolbar {...props}>{children}</Toolbar>;
}

export function StickySectionHost({ node, children }: HostProps) {
  const testID = valuesOf(node).testID as string | undefined;
  return <StickySection {...defined({ testID })}>{children}</StickySection>;
}

/** What a `ScrollArea` and a `ScrollSurface` both take: the scroll, its bar and the keyboard. */
function scrollAreaProps(node: Node, room: InsetRoom | undefined): ScrollAreaProps {
  const values = valuesOf(node);
  const dismiss = values.scrollDismissesKeyboard as KeyboardDismiss | undefined;
  return defined({
    contentContainerStyle: withRoom(
      containerStyle(node, values.spacing as SpaceToken | undefined),
      room,
    ),
    horizontal:
      (values.axis as Axis | undefined) === undefined ? undefined : values.axis === 'horizontal',
    scrollbar: values.scrollbar as ScrollbarVisibility | undefined,
    scrollbarSide: values.scrollbarSide as ScrollbarSide | undefined,
    size: values.size as ScrollbarSize | undefined,
    keyboardDismissMode: dismiss ? DISMISS_MODE[dismiss] : undefined,
    keyboardShouldPersistTaps: values.keyboardTaps as KeyboardTaps | undefined,
    testID: values.testID as string | undefined,
  });
}

export function ScrollAreaHost({ node, room, children }: HostProps & { room?: InsetRoom }) {
  return <ScrollArea {...scrollAreaProps(node, room)}>{children}</ScrollArea>;
}

/** A motion token as Bloom's spec; none when the chain names none. */
function motion(value: unknown): MotionSpec | undefined {
  return value === undefined ? undefined : resolveMotion(value as MotionToken);
}

export function ScrollSurfaceHost({
  node,
  render,
  room,
  children,
}: HostProps & { room?: InsetRoom }) {
  const values = valuesOf(node);
  const fade = values.fade as InkToken | undefined;
  const header = values.stickyHeader as Child;
  const footer = values.stickyFooter as Child;
  const props: ScrollSurfaceProps = {
    ...scrollAreaProps(node, room),
    ...defined({
      stickyHeader: header ? render(header) : undefined,
      stickyFooter: footer ? render(footer) : undefined,
      fadeHeight: space(values.fadeHeight),
      fadeBottom: values.fadeBottom as boolean | undefined,
      matchSurfacePaint: values.matchSurfacePaint as boolean | undefined,
      surface: values.style as ScrollSurfaceStyle | undefined,
      label: values.label as string | undefined,
    }),
  };
  const Host = fade === undefined ? ScrollSurface : paintedHost(ScrollSurface, 'fadeColor', fade);
  return <Host {...props}>{children}</Host>;
}

export function AutoHideBarHost({ node, render, children }: HostProps) {
  const values = valuesOf(node);
  const summary = values.summary as Child | string;
  const band = values.band as InkToken | undefined;
  const hide = motion(values.hideMotion);
  const show = motion(values.showMotion);
  const props: AutoHideBarProps = {
    bar: render((node.props as { bar: Child }).bar),
    collapsed: values.collapsed === true,
    ...defined({
      summary: typeof summary === 'string' || !summary ? summary : render(summary),
      onReveal: values.onReveal as (() => void) | undefined,
      peek: values.peek as boolean | undefined,
      height: space(values.barHeight),
      collapsedHeight: space(values.collapsedHeight),
      peekDelay: resolveDuration(values.peekDelay as DurationName | undefined),
      unpeekDelay: resolveDuration(values.unpeekDelay as DurationName | undefined),
      motion: hide === undefined && show === undefined ? undefined : defined({ hide, show }),
      revealLabel: values.label as string | undefined,
      testID: values.testID as string | undefined,
    }),
  };
  const Host = band === undefined ? AutoHideBar : paintedHost(AutoHideBar, 'background', band);
  return <Host {...props}>{children}</Host>;
}

export function ResizeHandleHost({ node }: HostProps) {
  const values = valuesOf(node);
  const axis = values.axis as Axis | undefined;
  const props: ResizeHandleProps = {
    onResize: (node.props as { onResize: (distance: number) => void }).onResize,
    ...defined({
      orientation: axis,
      variant: values.style as ResizeHandleStyle | undefined,
      thickness: space(values.thickness),
      onResizeStart: values.onResizeStart as (() => void) | undefined,
      onResizeEnd: values.onResizeEnd as (() => void) | undefined,
      onNudge: values.onNudge as ((distance: number) => void) | undefined,
      label: values.label as string | undefined,
      testID: values.testID as string | undefined,
    }),
  };
  return <ResizeHandle {...props} />;
}
