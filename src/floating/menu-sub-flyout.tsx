/**
 * The WEB sub-menu: a FLYOUT panel beside its trigger row.
 *
 * WEB ONLY — imported by the `.web.tsx` menu forks and nothing else, which is
 * why it can name `FloatingPanel` (itself web-only) outright. The native
 * counterpart is `menu-sub-inline.tsx`; each family's platform fork picks one.
 * There is no `Platform.OS` branch, because a runtime branch would drag
 * `react-dom` and the web portal into every native bundle.
 *
 * What a flyout needs beyond an inline disclosure, and where each part lives:
 *
 *  - **Position.** `overlay/dropdown-placement` with `side="right"`, so the
 *    panel fits-flips-clamps HORIZONTALLY and aligns vertically against the row.
 *    Near the right edge of the window it flips to the left of the row on its
 *    own; there is no second positioner here.
 *  - **Stack rank.** Taken by the `OverlayRoot` inside `FloatingPanel`, on
 *    mount, like every other surface. The sub-panel mounts AFTER the root panel,
 *    so it paints above it by construction and carries no `zIndex`.
 *  - **Hover intent.** A real mouse/pen move over the row opens it; a layout
 *    transition placing the row under a parked pointer does not. Leaving either
 *    surface SCHEDULES a close, moving over either CANCELS it, and the delay is
 *    long enough (`CLOSE_DELAY_MS`) to cross the gap.
 *  - **Keyboard.** Right opens and moves into the panel, Left and Escape leave
 *    it. Escape is handled here in the CAPTURE phase with
 *    `stopImmediatePropagation`, which is the only way the INNERMOST surface
 *    wins: every `FloatingPanel` listens on `document`, and `stopPropagation`
 *    does nothing between two listeners on the same node.
 *
 * The panel is deliberately `dismissible={false} modal={false}`. A modal
 * sub-panel would lay its own full-screen backdrop over the root menu, so
 * clicking a row of the PARENT menu would only dismiss the sub; and a dismissible
 * one would install the competing Escape handler this file exists to order.
 */
import React, {
  type ComponentRef,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { flushSync } from 'react-dom';
import { View } from 'react-native';

import { useControllableState } from '../hooks/use-controllable-state';
import { surfacePresenceTargets } from '../surface/use-surface-presence';
import { RiArrowRightSLine as ChevronRightIcon } from '../icons/remix/RiArrowRightSLine';
import { StyledView } from '../styles/styled-primitives';
import { useMenuPalette } from './menu-palette';
import { MENU_SUB_PANEL_CLASS, MENU_SUB_SIDE_OFFSET, ROW_ICON_SIZE } from './constants';
import { useMenuSurface } from './context';
import { pushFloatingEscape } from './escape-stack';
import { FloatingPanel } from './FloatingPanel';
import { hostElement, MENU_ROW_SELECTOR, useMenuPanelKeys } from './menu-keyboard';
import { cx, MenuRowChevron, MenuRowShell, splitChildren, SUB_TRIGGER_CLASS } from './shared';
import { MenuRowAlignmentScope, useMenuRowsAligned } from './menu-row-alignment';
import type {
  FloatingAnchor,
  MenuSubContentProps,
  MenuSubParts,
  MenuSubProps,
  MenuSubTriggerProps,
} from './types';
import { useFrameThrottle } from './use-frame-throttle';
import { useMessages } from '../locale/messages';
import { FLOATING_MESSAGES } from './messages';

/**
 * How long the panel survives after the pointer leaves the row or the panel.
 *
 * The pointer's path from the row's label to the panel's first item is
 * DIAGONAL, and it crosses the gap between the two surfaces where neither is
 * hovered. Radix solves this with a grace-area polygon; a delay is the smaller
 * mechanism that covers the same failure, and 300ms is long enough for a
 * deliberate diagonal at any reasonable pointer speed while still feeling
 * immediate when the user genuinely moves away.
 */
const CLOSE_DELAY_MS = 300;

/**
 * How many animation frames `useFlyoutAnchor` keeps re-measuring after a flyout
 * opens.
 *
 * Long enough to outlast the parent panel's own enter (`MENU_MOTION_DURATION`,
 * ~9 frames at 60Hz) with room for a slower machine, and cheap because a
 * settled box re-measures to the identical value and sets no state.
 */
const SETTLE_FRAMES = 20;

/**
 * The one node a DOM listener can be attached to per surface.
 *
 * react-native-web resolves a `View` ref to the DOM element itself, but the RN
 * types do not say so — reading through the two methods actually needed keeps
 * this honest and makes a non-DOM ref (a jsdom stub, a native build that
 * reached this file by accident) answer `null` instead of throwing.
 */
type DomNode = {
  addEventListener: HTMLElement['addEventListener'];
  removeEventListener: HTMLElement['removeEventListener'];
  contains: HTMLElement['contains'];
  querySelector: HTMLElement['querySelector'];
  closest: HTMLElement['closest'];
  style: HTMLElement['style'];
  getBoundingClientRect: HTMLElement['getBoundingClientRect'];
  animate: HTMLElement['animate'];
  children: HTMLElement['children'];
};

function domNode(node: ComponentRef<typeof View> | null): DomNode | null {
  const element = node as unknown as Partial<DomNode> | null;
  if (
    typeof element?.addEventListener !== 'function' ||
    typeof element.removeEventListener !== 'function' ||
    typeof element.contains !== 'function' ||
    typeof element.querySelector !== 'function'
  ) {
    return null;
  }
  return element as DomNode;
}

/** Touch movement is scrolling/dragging, not hover intent. */
function isHoverPointer(event: Event): boolean {
  const pointerType = (event as PointerEvent).pointerType;
  return pointerType === 'mouse' || pointerType === 'pen';
}

/** Every role a menu ROW can carry — the rows a pointer can actually land on. */
const MENU_ITEM_SELECTOR = MENU_ROW_SELECTOR;

/**
 * Did the pointer leave for another ROW, rather than for the gap this sub's
 * grace delay exists to cover?
 *
 * {@link CLOSE_DELAY_MS} buys time for ONE journey: the diagonal from a trigger
 * row to its own flyout, across a strip where neither surface is hovered. Every
 * other departure is unambiguous the moment it happens, and the most visible one
 * is a SIBLING sub-trigger: two subs in a panel each own their state and their
 * own timer, so the one being left served out its full delay while the one being
 * entered had already opened — 300ms of two overlapping flyouts, which is not a
 * grace period but a bug.
 *
 * "Another row" means the pointer landed on an actual menu ITEM that belongs to
 * neither this sub's trigger nor its flyout. Testing for an ITEM rather than for
 * a `[role="menu"]` ancestor is the whole subtlety: the diagonal to the flyout
 * crosses the parent panel's own padding, which IS inside a `[role="menu"]` but
 * is not a row — measured, a panel-ancestor test dismissed the flyout mid-journey
 * and broke the very case the delay exists for.
 *
 * Both exclusions are load-bearing. Without the flyout check, arriving at the
 * panel's first row would close the panel the move was aimed at. Without the
 * trigger check, moving from the panel back onto its own trigger would close and
 * immediately re-open, which flickers.
 *
 * A departure with no `relatedTarget` — off the window, or the node under the
 * pointer being torn down — is NOT another row, so it keeps the delay and
 * behaviour there is what it was.
 */
function leavesForAnotherRow(
  event: Event,
  ownFlyout: DomNode | null,
  ownTrigger: DomNode | null,
): boolean {
  const next = (event as PointerEvent).relatedTarget;
  if (!(next instanceof Element)) return false;
  const row = next.closest(MENU_ITEM_SELECTOR);
  if (!row) return false;
  if (ownFlyout?.contains(row as HTMLElement)) return false;
  if (ownTrigger?.contains(row as HTMLElement)) return false;
  return true;
}

/**
 * Is the pointer heading for a SIBLING sub-trigger? Then this flyout does not close
 * on its own: the sibling's flyout takes it over (see {@link travel}), and a
 * close here would race the takeover and fade a second panel past the first.
 */
function leavesForSiblingSub(event: Event, ownTrigger: DomNode | null): boolean {
  const next = (event as PointerEvent).relatedTarget;
  if (!(next instanceof Element)) return false;
  const trigger = next.closest('[aria-haspopup="menu"]');
  return !!trigger && !ownTrigger?.contains(trigger as HTMLElement);
}

/**
 * One flyout per menu level. When the pointer moves from one sub-trigger to a
 * sibling, the open flyout is not closed while another opens beside it: the new
 * panel takes over from the old one where the user sees it, then travels to its
 * own place and size while its rows fade in, so the user sees one panel travel
 * rather than two overlap.
 *
 * The travel moves the LIVE panel (a transform, its width and height), never a
 * snapshot of it. A view transition did this before and lost the material for
 * the whole hand-over: its snapshots are painted without the page behind them,
 * so the panel's blur had nothing to blur and the page showed through its tint
 * for ~400ms on every move between sibling rows (measured on Windows from the
 * window's composited frames).
 */
/** The panel's travel; its rows fade in a little faster so they settle as it lands. */
const TRAVEL_MS = 200;
const TRAVEL_EASING = 'cubic-bezier(0.2, 0.8, 0.2, 1)';
const FADE_MS = 140;

interface OpenFlyout {
  id: symbol;
  /** Where the user sees this flyout now: its own box, or the one it is taking over. */
  shownRect: () => DOMRect | null;
  closeInstantly: () => void;
}

/** The open flyout of each menu panel, keyed by the panel its trigger sits in. */
const openFlyouts = new Map<Element, OpenFlyout>();

function parentPanel(trigger: ComponentRef<typeof View> | null): Element | null {
  return domNode(trigger)?.closest('[role="menu"]') ?? null;
}

function canTravel(): boolean {
  if (typeof document === 'undefined' || typeof window === 'undefined') return false;
  if (typeof Element === 'undefined' || typeof Element.prototype.animate !== 'function') return false;
  return !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

/** Carry `panel` from the box it took over (`from`) to its own (`to`). */
function travel(panel: DomNode, from: DOMRect, to: DOMRect): Animation[] {
  const moves = [
    panel.animate(
      [
        {
          transform: `translate(${from.left - to.left}px, ${from.top - to.top}px)`,
          width: `${from.width}px`,
          height: `${from.height}px`,
        },
        { transform: 'translate(0px, 0px)', width: `${to.width}px`, height: `${to.height}px` },
      ],
      { duration: TRAVEL_MS, easing: TRAVEL_EASING },
    ),
  ];
  for (const piece of surfacePresenceTargets(panel as unknown as Element)) {
    if (piece === (panel as unknown as Element)) continue;
    moves.push(piece.animate([{ opacity: 0 }, { opacity: 1 }], { duration: FADE_MS, easing: 'ease-out' }));
  }
  return moves;
}

interface Takeover {
  rect: DOMRect;
  release: () => void;
}

/** The first focusable descendant, so Right lands ON the panel's first row. */
function focusFirstItem(node: DomNode | null): void {
  const first = node?.querySelector<HTMLElement>(MENU_ITEM_SELECTOR);
  first?.focus?.();
}

/**
 * The box a flyout anchors to: the trigger ROW vertically, the parent PANEL
 * horizontally.
 *
 * Two boxes rather than one, because the two axes are answering different
 * questions. Vertically the panel's first row lines up with the row it flew out
 * of, so that axis is the row's. Horizontally the panel flies out from the
 * PARENT SURFACE's edge — and the row is not on that edge: it sits inside the
 * panel's own `p-1` and its 1px border, so an offset measured from the row lands
 * 5px further in. Measured before this existed: a 4px offset put the sub-panel's
 * left edge at 279 against a parent whose right edge is 280 — a ONE PIXEL
 * OVERLAP, which is the "flush against the parent" the flyout shipped with.
 *
 * Taking the horizontal axis off the panel also makes {@link MENU_SUB_SIDE_OFFSET}
 * mean the gap you actually see, with no dependence on the panel's inset: change
 * `MENU_PANEL_CLASS`'s padding and the gap does not move.
 *
 * The panel is found with `closest`, so a sub-menu nested inside a sub-menu
 * anchors to ITS parent rather than to the root. If there is no panel ancestor
 * (a row rendered outside a surface, a non-DOM ref), the row's own box is the
 * fallback and behaviour is what it was.
 */
function useFlyoutAnchor(
  ref: React.RefObject<ComponentRef<typeof View> | null>,
  open: boolean,
): FloatingAnchor | null {
  const [anchor, setAnchor] = useState<FloatingAnchor | null>(null);

  const measure = useCallback(() => {
    // react-native-web resolves a `View` ref to the DOM element itself; the RN
    // types do not say so, so read through the two methods actually needed and a
    // non-DOM ref answers `null` instead of throwing.
    const row = ref.current as unknown as {
      getBoundingClientRect?: () => DOMRect;
      closest?: (selector: string) => Element | null;
    } | null;
    if (typeof row?.getBoundingClientRect !== 'function') {
      setAnchor(null);
      return;
    }
    const rowBox = row.getBoundingClientRect();
    const panel = typeof row.closest === 'function' ? row.closest('[role="menu"]') : null;
    const sideBox = panel ? panel.getBoundingClientRect() : rowBox;
    const next = {
      top: rowBox.top,
      bottom: rowBox.bottom,
      left: sideBox.left,
      right: sideBox.right,
    };
    // Only on a real change: this runs on every scroll event and, below, on a
    // run of animation frames, and a fresh object each time would re-render the
    // panel and re-resolve its placement for a box that did not move.
    setAnchor((current) =>
      current &&
      current.top === next.top &&
      current.bottom === next.bottom &&
      current.left === next.left &&
      current.right === next.right
        ? current
        : next,
    );
  }, [ref]);

  // Two `getBoundingClientRect`s per pass — the row's and the parent panel's —
  // so the stream of events a scroll gesture dispatches is coalesced to one pass
  // per frame, like every other anchored surface.
  const [schedule, cancel] = useFrameThrottle(measure);

  useLayoutEffect(() => {
    if (!open) {
      // Dropped in the COMMIT phase along with the box: a frame armed by the
      // last scroll before the flyout closed would otherwise re-publish an
      // anchor for a row that is no longer showing anything.
      cancel();
      setAnchor(null);
      return;
    }
    measure();
    if (typeof requestAnimationFrame !== 'function') return;
    // Re-measured across a BOUNDED RUN OF FRAMES, because the parent panel may
    // still be running its own enter when the flyout opens — and
    // `getBoundingClientRect` reports the TRANSFORMED box, so its right edge is
    // up to `width × (1 − scale)` short of where it will settle. A pointer
    // already resting where the trigger row appears opens the flyout on the
    // panel's first frame, which is exactly that case. Measured before this
    // existed: the gap settled at 1.84px instead of 2px, and the error scales
    // with the parent's width.
    //
    // A run of frames rather than a timeout keyed to the enter's duration: this
    // hook has no business knowing how long a panel animates, and re-measuring
    // an already-settled box is free once the equality check above holds.
    let frame = 0;
    let handle = requestAnimationFrame(function again() {
      measure();
      frame += 1;
      if (frame < SETTLE_FRAMES) handle = requestAnimationFrame(again);
    });
    return () => cancelAnimationFrame(handle);
  }, [open, measure, cancel]);

  useEffect(() => {
    if (!open || typeof window === 'undefined') return;
    // Capture phase: a scroll inside any ancestor moves both boxes, and a
    // bubbling listener never sees a scroll on an inner container.
    window.addEventListener('resize', schedule);
    window.addEventListener('scroll', schedule, true);
    return () => {
      window.removeEventListener('resize', schedule);
      window.removeEventListener('scroll', schedule, true);
    };
  }, [open, schedule]);

  return anchor;
}

interface SubFlyoutContextValue {
  open: boolean;
  setOpen: (next: boolean) => void;
  /** The trigger row's wrapper, measured to anchor the panel. */
  triggerRef: React.RefObject<ComponentRef<typeof View> | null>;
  /**
   * The flyout's scroller, so the TRIGGER can tell a pointer heading for its own
   * panel from one heading for a sibling row. Written by `MenuSubContent`; null
   * whenever the panel is closed, which is exactly when there is nothing to
   * cross to.
   */
  contentRef: React.RefObject<ComponentRef<typeof View> | null>;
  /** Cancel a scheduled close — the pointer arrived on one of the two surfaces. */
  keepOpen: () => void;
  /** Schedule a close — the pointer left one of them, and may be crossing to the other. */
  closeSoon: () => void;
  /**
   * Close immediately, WITHOUT moving focus — the pointer has already landed on
   * another row, and refocusing this trigger would take focus off it.
   */
  closeNow: () => void;
  /** Close now and put focus back on the trigger row (Left, Escape). */
  closeAndRefocus: () => void;
  /** Open and close without the panel's own motion: a takeover is animated by its travel. */
  instant: boolean;
  /** Set while this flyout is taking over from a sibling's, until it has landed. */
  traveling: boolean;
  /** The box the takeover starts from, while one is pending. */
  takeoverRect: () => DOMRect | null;
  /** The new panel is placed: close the sibling and hand back the box to travel from. */
  arrive: () => DOMRect | null;
  /** The travel is over. */
  landed: () => void;
}

const SubFlyoutContext = React.createContext<SubFlyoutContextValue | null>(null);
SubFlyoutContext.displayName = 'BloomMenuSubFlyoutContext';

function useSubFlyout(): SubFlyoutContextValue {
  const value = React.useContext(SubFlyoutContext);
  if (!value) {
    throw new Error('A menu sub trigger and sub content must be rendered inside a menu sub.');
  }
  return value;
}

/** Build one family's flyout sub trio. `prefix` is used for nothing but `displayName`. */
export function createFlyoutMenuSub(prefix: string): MenuSubParts {
  function MenuSub({ children, open, defaultOpen = false, onOpenChange }: MenuSubProps) {
    const [isOpen, setOpen] = useControllableState<boolean>({
      value: open,
      defaultValue: defaultOpen,
      onChange: onOpenChange,
    });
    const triggerRef = useRef<ComponentRef<typeof View> | null>(null);
    const contentRef = useRef<ComponentRef<typeof View> | null>(null);
    const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const cancelTimer = useCallback(() => {
      if (closeTimer.current !== null) {
        clearTimeout(closeTimer.current);
        closeTimer.current = null;
      }
    }, []);

    // A pending close outlives the component if the whole menu is dismissed
    // mid-delay, and would then call `setOpen` on an unmounted tree.
    useEffect(() => cancelTimer, [cancelTimer]);

    const id = useRef(Symbol('bloom-menu-sub')).current;
    const [instant, setInstant] = useState(false);
    const [traveling, setTraveling] = useState(false);
    const takeover = useRef<Takeover | null>(null);
    const takeoverRect = useCallback(() => takeover.current?.rect ?? null, []);
    const releaseTakeover = useCallback(() => {
      const pending = takeover.current;
      takeover.current = null;
      pending?.release();
    }, []);
    const arrive = useCallback(() => {
      const pending = takeover.current;
      if (pending) flushSync(releaseTakeover);
      return pending?.rect ?? null;
    }, [releaseTakeover]);
    const landed = useCallback(() => {
      setTraveling(false);
      setInstant(false);
    }, []);

    useEffect(() => {
      if (!isOpen) releaseTakeover();
    }, [isOpen, releaseTakeover]);

    const keepOpen = useCallback(() => {
      cancelTimer();
      if (isOpen) return;
      const parent = parentPanel(triggerRef.current);
      const sibling = parent ? openFlyouts.get(parent) : undefined;
      if (!sibling || sibling.id === id) {
        setInstant(false);
        setOpen(true);
        return;
      }
      const rect = sibling.shownRect();
      if (!rect || !canTravel()) {
        flushSync(() => {
          sibling.closeInstantly();
          setInstant(true);
          setOpen(true);
        });
        return;
      }
      takeover.current = { rect, release: sibling.closeInstantly };
      setInstant(true);
      setTraveling(true);
      setOpen(true);
    }, [cancelTimer, isOpen, setOpen, id]);

    const closeSoon = useCallback(() => {
      cancelTimer();
      closeTimer.current = setTimeout(() => {
        closeTimer.current = null;
        setOpen(false);
      }, CLOSE_DELAY_MS);
    }, [cancelTimer, setOpen]);

    const closeNow = useCallback(() => {
      cancelTimer();
      setOpen(false);
    }, [cancelTimer, setOpen]);

    const closeAndRefocus = useCallback(() => {
      cancelTimer();
      setOpen(false);
      const trigger = domNode(triggerRef.current);
      trigger?.querySelector<HTMLElement>('[role="menuitem"]')?.focus?.();
    }, [cancelTimer, setOpen]);

    useEffect(() => {
      if (!isOpen) return undefined;
      const parent = parentPanel(triggerRef.current);
      if (!parent) return undefined;
      openFlyouts.set(parent, {
        id,
        shownRect: () =>
          takeover.current?.rect ?? domNode(contentRef.current)?.getBoundingClientRect() ?? null,
        closeInstantly: () => {
          cancelTimer();
          releaseTakeover();
          setTraveling(false);
          setInstant(true);
          setOpen(false);
        },
      });
      return () => {
        if (openFlyouts.get(parent)?.id === id) openFlyouts.delete(parent);
      };
    }, [isOpen, id, cancelTimer, setOpen, releaseTakeover]);

    const context = useMemo<SubFlyoutContextValue>(
      () => ({
        open: isOpen,
        setOpen,
        triggerRef,
        contentRef,
        keepOpen,
        closeSoon,
        closeNow,
        closeAndRefocus,
        instant,
        traveling,
        takeoverRect,
        arrive,
        landed,
      }),
      [
        isOpen,
        setOpen,
        keepOpen,
        closeSoon,
        closeNow,
        closeAndRefocus,
        instant,
        traveling,
        takeoverRect,
        arrive,
        landed,
      ],
    );

    return <SubFlyoutContext.Provider value={context}>{children}</SubFlyoutContext.Provider>;
  }
  MenuSub.displayName = `${prefix}Sub`;

  function MenuSubTrigger({
    children,
    disabled = false,
    inset = false,
    leading,
    accessibilityLabel,
    className,
    style,
    testID,
  }: MenuSubTriggerProps) {
    const palette = useMenuPalette();
    const sub = useSubFlyout();
    const { title, body } = splitChildren(children);
    const [node, setNode] = useState<ComponentRef<typeof View> | null>(null);

    const attach = useCallback(
      (value: ComponentRef<typeof View> | null) => {
        setNode(value);
        sub.triggerRef.current = value;
      },
      [sub.triggerRef],
    );

    // Pointer intent and keyboard through DOM listeners on the wrapper rather
    // than RN props: `Item` renders its own `Pressable` and publishes neither
    // pointer movement nor `onKeyDown`, and widening its prop surface for one
    // web-only caller is the wrong trade. Crucially, `pointermove` needs actual
    // coordinates to change: unlike enter, layout motion cannot synthesize it
    // when a transition puts this row under a parked pointer.
    useEffect(() => {
      const element = domNode(node);
      if (!element || disabled) return;

      const onMove = (event: Event) => {
        if (isHoverPointer(event)) sub.keepOpen();
      };
      const onLeave = (event: Event) => {
        if (!isHoverPointer(event)) return;
        // A sibling sub-trigger takes this flyout over itself; anything else on
        // the parent panel is not the diagonal the delay exists for.
        if (leavesForSiblingSub(event, element)) {
          sub.closeSoon();
          return;
        }
        if (leavesForAnotherRow(event, domNode(sub.contentRef.current), element)) {
          sub.closeNow();
          return;
        }
        sub.closeSoon();
      };
      const onKeyDown = (event: Event) => {
        const key = (event as KeyboardEvent).key;
        if (key !== 'ArrowRight' && key !== 'Enter' && key !== ' ') return;
        event.preventDefault();
        sub.keepOpen();
      };

      element.addEventListener('pointermove', onMove);
      element.addEventListener('pointerleave', onLeave);
      element.addEventListener('keydown', onKeyDown);
      return () => {
        element.removeEventListener('pointermove', onMove);
        element.removeEventListener('pointerleave', onLeave);
        element.removeEventListener('keydown', onKeyDown);
      };
    }, [node, disabled, sub]);

    return (
      <View ref={attach}>
        <MenuRowShell
          role="menuitem"
          expanded={sub.open}
          hasPopup="menu"
          disabled={disabled}
          inset={inset}
          leading={leading}
          // `size-4 shrink-0 ms-auto text-fg-secondary`, pointing RIGHT: on web
          // the sub-menu is beside the row, not under it, so an up/down
          // disclosure chevron would describe a relationship the panel does not
          // have. The target paints it in the SECONDARY colour, one step back
          // from the label it sits beside.
          trailing={
            <MenuRowChevron>
              <ChevronRightIcon
                width={ROW_ICON_SIZE}
                height={ROW_ICON_SIZE}
                fill={palette.textSecondary}
              />
            </MenuRowChevron>
          }
          title={title}
          // A press toggles, so a pointer user who clicked rather than hovered
          // can shut it again, and a touch-web user can reach it at all.
          onPress={() => (sub.open ? sub.closeAndRefocus() : sub.keepOpen())}
          accessibilityLabel={accessibilityLabel}
          className={cx(SUB_TRIGGER_CLASS, className)}
          style={style}
          testID={testID}
        >
          {body}
        </MenuRowShell>
      </View>
    );
  }
  MenuSubTrigger.displayName = `${prefix}SubTrigger`;

  function MenuSubContent({
    children,
    label: labelProp,
    side = 'right',
    align = 'start',
    sideOffset = MENU_SUB_SIDE_OFFSET,
    alignOffset,
    minWidth,
    maxWidth,
    alignRows,
    className,
    style,
    testID,
  }: MenuSubContentProps) {
    const parentAlignsRows = useMenuRowsAligned();
    const { messages } = useMessages(FLOATING_MESSAGES);
    const label = labelProp ?? messages.submenu;
    const sub = useSubFlyout();
    const anchor = useFlyoutAnchor(sub.triggerRef, sub.open);
    const [node, setNode] = useState<ComponentRef<typeof View> | null>(null);

    // State for this component's own effects, a ref for the TRIGGER's leave
    // handler: that handler runs from a DOM listener, outside React's render,
    // so it needs a value it can read at event time rather than one captured
    // when the listener was attached.
    const attachContent = useCallback(
      (value: ComponentRef<typeof View> | null) => {
        setNode(value);
        sub.contentRef.current = value;
      },
      [sub.contentRef],
    );

    useEffect(() => {
      const element = domNode(node);
      if (!element || !sub.open) return;

      const onMove = (event: Event) => {
        if (isHoverPointer(event)) sub.keepOpen();
      };
      const onLeave = (event: Event) => {
        if (!isHoverPointer(event)) return;
        // Leaving the flyout for a row of the parent panel is just as
        // unambiguous as leaving the trigger for one: the pointer has arrived
        // somewhere, and it is not this sub.
        if (leavesForAnotherRow(event, element, domNode(sub.triggerRef.current))) {
          sub.closeNow();
          return;
        }
        sub.closeSoon();
      };
      const onKeyDown = (event: Event) => {
        const key = (event as KeyboardEvent).key;
        if (key !== 'ArrowLeft') return;
        event.preventDefault();
        sub.closeAndRefocus();
      };

      element.addEventListener('pointermove', onMove);
      element.addEventListener('pointerleave', onLeave);
      element.addEventListener('keydown', onKeyDown);
      return () => {
        element.removeEventListener('pointermove', onMove);
        element.removeEventListener('pointerleave', onLeave);
        element.removeEventListener('keydown', onKeyDown);
      };
    }, [node, sub]);

    // Escape closes this flyout and leaves the menu open. The flyout's panel is
    // `dismissible={false}` (a press outside it is the parent's business), so it
    // takes its own entry on the escape stack — pushed after the parent's, so it
    // is the one Escape reaches first (`escape-stack.ts`). This used to be a
    // document CAPTURE listener with `stopImmediatePropagation`, which also took
    // Escape away from any field inside the flyout.
    const { open: subOpen, closeAndRefocus } = sub;
    const closeRef = useRef(closeAndRefocus);
    closeRef.current = closeAndRefocus;
    useEffect(() => {
      if (!subOpen || typeof document === 'undefined') return undefined;
      return pushFloatingEscape(() => closeRef.current());
    }, [subOpen]);

    // Arrows (wrapping), Home/End, Space and Tab among the flyout's own rows —
    // the same keys as the menu it flew out of (`menu-keyboard.ts`). Tab closes
    // the WHOLE menu, not just this flyout: the menu is not in the tab order.
    const surface = useMenuSurface();
    useMenuPanelKeys(hostElement(node), { open: sub.open, onTab: surface.close });

    // While it takes over from a sibling, the panel stays hidden until it is
    // placed (two frames: placement, then the instant motion); then the sibling
    // closes and this panel travels from the sibling's box to its own in the same
    // frame, so there is never a frame with no panel or with two.
    const { traveling, takeoverRect, arrive, landed } = sub;
    useEffect(() => {
      const element = domNode(node);
      if (!element || !traveling || !sub.open || !anchor || !takeoverRect()) return undefined;
      element.style.visibility = 'hidden';
      let frame = requestAnimationFrame(() => {
        frame = requestAnimationFrame(() => {
          const from = arrive();
          element.style.removeProperty('visibility');
          if (!from) return landed();
          const moves = travel(element, from, element.getBoundingClientRect());
          Promise.all(moves.map((move) => move.finished)).then(landed, landed);
        });
      });
      return () => {
        cancelAnimationFrame(frame);
        element.style.removeProperty('visibility');
      };
    }, [node, traveling, sub.open, anchor, takeoverRect, arrive, landed]);

    // Move focus onto the panel once it has been placed, so Right genuinely
    // ENTERS the submenu rather than only opening it.
    useEffect(() => {
      if (!sub.open || !anchor) return;
      focusFirstItem(domNode(node));
    }, [sub.open, anchor, node]);

    return (
      <FloatingPanel
        panelRef={attachContent}
        open={sub.open}
        anchor={anchor}
        role="menu"
        label={label}
        side={side}
        // The panel's first row lines up with the trigger row it flew out of.
        align={align}
        // Measured from the PARENT PANEL's edge, not the trigger row's — see
        // `useFlyoutAnchor`.
        sideOffset={sideOffset}
        alignOffset={alignOffset}
        dismissible={false}
        modal={false}
        instant={sub.instant}
        onDismiss={sub.closeAndRefocus}
        surface="menu"
        minWidth={minWidth}
        maxWidth={maxWidth}
        // `min-w-[266px]` — the root menu's floor, sized to its rows above it
        // and capped at the viewport, so a long label with a shortcut is not
        // cut off.
        className={cx(MENU_SUB_PANEL_CLASS, className)}
        style={style}
        testID={testID}
      >
        <MenuRowAlignmentScope enabled={alignRows ?? parentAlignsRows}>
          {children}
        </MenuRowAlignmentScope>
      </FloatingPanel>
    );
  }
  MenuSubContent.displayName = `${prefix}SubContent`;

  return { Sub: MenuSub, SubTrigger: MenuSubTrigger, SubContent: MenuSubContent };
}
