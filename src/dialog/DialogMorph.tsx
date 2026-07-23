import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
} from 'react';
import type { LayoutChangeEvent, StyleProp, ViewStyle } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

// ---------------------------------------------------------------------------
//  Size morphing — the panel reshapes across an IN-PLACE content swap.
//
//  A surface has two axes. DEPTH: a new surface is presented on top (its own
//  backdrop / z-layer) — untouched by this module. NAV-WITHIN: the content
//  INSIDE one surface is swapped for another screen. Without morphing that swap
//  hard-cuts: the panel jumps from the outgoing screen's size to the incoming
//  one's in a single frame. Morphing animates the panel between the two sizes
//  while the incoming content fades in, so navigating within a surface reads as
//  ONE container reshaping.
//
//  The Dialog cannot see a nav-within swap from its props: the content that
//  changes lives deep inside `children` (a host that subscribes to its own
//  route store), so the Dialog re-renders nothing. The content therefore
//  DECLARES its identity through {@link useDialogFrame} — the same
//  external-channel bridge `useDialogHeader` uses for the nav bar — and the
//  surface runs the morph when that identity changes.
//
//  Geometry, per placement:
//    - centered card  — height grows/shrinks about its centre (the backdrop
//      centres it), and `maxWidth` morphs too when the surface changes it.
//    - bottom sheet   — height grows/shrinks from its anchored bottom edge.
//    - side sheet     — fixed geometry (pinned top/bottom, fixed width), so
//      there is nothing to morph; those placements never mount this.
// ---------------------------------------------------------------------------

/** Panel reshape duration (ms) between two content frames. */
export const DIALOG_MORPH_DURATION = 260;

/**
 * Incoming-frame fade-in (ms). Deliberately shorter than the reshape so the new
 * content has landed by the time the panel finishes settling.
 */
export const DIALOG_MORPH_FADE_DURATION = 150;

/**
 * How long the panel stays pinned at the outgoing size waiting for the incoming
 * frame to report its own. A frame whose content measures IDENTICALLY never
 * re-reports (nothing resized), so the pin is released on this timeout — there
 * was no size change to morph.
 */
const MORPH_MEASURE_TIMEOUT_MS = 200;

/** Reshape easing — matches the ease-out the rest of the Dialog motion uses. */
const MORPH_EASING = Easing.out(Easing.cubic);

/**
 * Largest plausible gap between the panel box and its content (borders, the
 * scroll container's padding). A bigger difference means the sample is not
 * chrome — the panel is capped, or the content wrapper is being stretched — so
 * it is dropped rather than baked into the next reshape target.
 */
const MAX_PANEL_CHROME = 96;

/**
 * Below this, an incoming frame is treated as having NO natural height rather
 * than a tiny one: content that fills the space it is given (a list that flexes
 * to its container) measures ~0 inside a content-sized wrapper, and reshaping
 * the panel down to that would collapse the surface. Such a frame keeps the
 * panel's normal sizing instead.
 */
const MIN_MEASURABLE_CONTENT = 40;

/**
 * The identity of the content currently rendered inside a Dialog surface,
 * declared by that content via {@link useDialogFrame}.
 */
export interface DialogFrame {
  /**
   * Stable identity of the current content. A CHANGE while the surface stays
   * open is what marks an in-place swap and triggers the morph.
   */
  key: string;
  /**
   * Opt this frame OUT of the size morph — the panel keeps its normal sizing
   * and the swap hard-cuts (the incoming content still fades in). Defaults to
   * `true`. Use it for content that must not be resized into, e.g. a full-bleed
   * picker that always fills the surface.
   */
  morph?: boolean;
  /**
   * An EXPLICIT target size the panel morphs TO for this frame, instead of the
   * measured natural height / the surface `maxWidth`. This is what lets an
   * own-scroller frame (whose content owns its own scroll, so the panel cannot
   * measure it) still GROW its container to a large declared size — the panel
   * animates up to `height`/`maxWidth` on entry and back down when the next frame
   * declares (or measures) a smaller size, while the frame's own list scrolls
   * within. Both fields are px; either may be omitted (the omitted axis keeps its
   * normal behaviour). `height` is clamped to the viewport; `maxWidth` is honoured
   * only on width-varying placements (the centered card).
   */
  size?: { height?: number; maxWidth?: number };
}

type FrameHandler = (next: DialogFrame, previous: DialogFrame) => void;

/**
 * The bridge between a surface's content (which knows WHEN it swapped) and the
 * surface (which owns the panel). Deliberately not a React store: the surface
 * does not need to re-render on a frame change — it drives shared values.
 */
export interface DialogFrameChannel {
  /** Declare the frame currently rendered. Called from the content's layout phase. */
  setFrame: (frame: DialogFrame) => void;
  /** Register the surface's morph runner (fires on a KEY CHANGE — the animation). */
  setHandler: (handler: FrameHandler) => () => void;
  /**
   * Register a listener that fires on EVERY `setFrame` (every render/layout, not
   * only a key change). The surface uses it to keep the active frame's declared
   * target size (its `size`) as DERIVED state, so the panel re-settles at that
   * size after a placement swap re-lays it out (a swap does not change the key,
   * so the key-change handler never re-runs). Fires immediately with the current
   * frame on register so a freshly-mounted surface (a placement swap remounts it)
   * picks up the active frame's size without waiting for the next render.
   */
  setFrameListener: (listener: (frame: DialogFrame) => void) => () => void;
}

function createFrameChannel(): DialogFrameChannel {
  let last: DialogFrame | null = null;
  let handler: FrameHandler | null = null;
  let frameListener: ((frame: DialogFrame) => void) | null = null;
  return {
    setFrame: (frame) => {
      const previous = last;
      last = frame;
      frameListener?.(frame);
      if (previous && previous.key !== frame.key) handler?.(frame, previous);
    },
    setHandler: (next) => {
      handler = next;
      return () => {
        if (handler === next) handler = null;
      };
    },
    setFrameListener: (next) => {
      frameListener = next;
      if (last) next(last);
      return () => {
        if (frameListener === next) frameListener = null;
      };
    },
  };
}

const DialogFrameContext = createContext<DialogFrameChannel | null>(null);

/**
 * Declare the identity of the content currently rendered inside a Dialog
 * surface. When the `key` changes while the surface stays open, the surface
 * MORPHS its panel from the outgoing content's size to the incoming one's
 * instead of hard-cutting.
 *
 * Called by the host that owns the surface's content (the SDK's `SurfaceScreen`
 * declares `route#step`). No-op outside a morph-capable Dialog surface — a side
 * sheet, or a plain confirm dialog — so a host can call it unconditionally.
 *
 * EXACTLY ONE host per surface may declare frames: two writers with different
 * identities would each read the other's key as a swap and morph on every
 * render. A screen that wants its own sub-views to morph must fold them into
 * the surface host's key rather than declaring a second frame.
 */
export function useDialogFrame(frame: DialogFrame | null | undefined): void {
  const channel = useContext(DialogFrameContext);
  const key = frame?.key;
  const morph = frame?.morph;
  const sizeHeight = frame?.size?.height;
  const sizeMaxWidth = frame?.size?.maxWidth;
  // Declared in the commit's layout phase, BEFORE the browser paints the new
  // content: that is what lets the surface pin the panel at the outgoing size
  // in the same frame the swap commits (the panel's own layout for the incoming
  // content is not reported until after this). Depend on the size PRIMITIVES (not
  // the object) so a fresh `size` object each render does not re-fire the effect.
  useLayoutEffect(() => {
    if (!channel || key === undefined) return;
    const size =
      sizeHeight !== undefined || sizeMaxWidth !== undefined
        ? { height: sizeHeight, maxWidth: sizeMaxWidth }
        : undefined;
    channel.setFrame({ key, morph, size });
  }, [channel, key, morph, sizeHeight, sizeMaxWidth]);
}

/** Options a surface passes when it wires up morphing for its panel. */
export interface DialogMorphOptions {
  /** Surface-level enable — the `Dialog` `morph` prop (defaults to `true`). */
  enabled: boolean;
  /**
   * Whether this surface can measure the NATURAL height of its content, i.e.
   * whether the Dialog owns the scroll container (`scrollable !== false`). A
   * surface whose content owns its own scroller also owns its own size, so
   * there is nothing for the panel to measure — those surfaces cross-fade the
   * incoming frame but never pin/resize the panel.
   */
  measurable: boolean;
  /**
   * Hard upper bound (px) for the reshape target — pass the viewport height.
   *
   * This is deliberately NOT the panel's exact size cap: that cap is a
   * percentage/inset mix which resolves differently per platform, and guessing
   * it low leaves a visible snap when the pin is released. The panel's own
   * `maxHeight` style already clamps the RENDERED height at every frame, so a
   * target above the cap simply lands on the cap and releases onto it — the
   * bound here only keeps the animation from chasing a runaway content height.
   */
  maxHeight: number;
  /**
   * The panel's `maxWidth` (px) when the placement lets width vary (the centered
   * card). A surface that changes it per frame gets a width morph alongside the
   * height one. `undefined` on placements whose width is fixed.
   */
  maxWidth?: number;
}

/**
 * Wire size morphing into one Dialog surface. Returns the panel/content styles
 * and the two measurement callbacks the surface must attach.
 *
 * While idle the panel style resolves to `height: 'auto'` — byte-for-byte the
 * natural sizing every placement had before morphing existed — so first open,
 * dismissal, and a responsive placement swap are untouched. The height is only
 * driven for the ~260ms of an actual reshape, then released back to natural.
 *
 * A frame that declares an explicit `size` is different: that size is DERIVED
 * state the panel rests at at EVERY layout (`declaredHeight`/`declaredMaxWidth`),
 * not a one-shot animation target — so a placement swap (which re-lays the panel
 * out WITHOUT a key change, so the animation never re-runs) still settles at the
 * declared size instead of falling back to natural.
 */
export function useDialogMorph({
  enabled,
  measurable,
  maxHeight,
  maxWidth,
}: DialogMorphOptions) {
  const channel = useMemo(() => createFrameChannel(), []);

  /** 1 while the panel height is driven by an in-flight morph animation. */
  const pinned = useSharedValue(0);
  const height = useSharedValue(0);
  /** 1 while `maxWidth` is driven by an in-flight morph animation. */
  const widthPinned = useSharedValue(0);
  const width = useSharedValue(0);
  /**
   * The ACTIVE frame's declared explicit size (0 = none) — the panel's RESTING
   * size, re-derived on every `setFrame` so it survives a placement swap. `height`
   * is clamped to the viewport; `maxWidth` widens the centered card.
   */
  const declaredHeight = useSharedValue(0);
  const declaredMaxWidth = useSharedValue(0);
  /** Incoming-frame opacity. Rests at 1; dips to 0 and fades back on a swap. */
  const fade = useSharedValue(1);

  /** Last laid-out panel height — the size a morph starts FROM. */
  const panelHeight = useRef(0);
  /** Last laid-out height of the content wrapper — the content's NATURAL height. */
  const contentHeight = useRef(0);
  /**
   * Panel box height MINUS its scroll content height, sampled while idle and
   * unclamped: the panel's own chrome (borders, scroll-container padding).
   * Self-calibrating, so no placement has to hard-code its own box math.
   */
  const chrome = useRef(0);
  /** True between a frame change and the moment the incoming size arrives. */
  const awaitingSize = useRef(false);
  const releaseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Mirrors of render-time values the (stable) callbacks below need to read. */
  const maxHeightRef = useRef(maxHeight);
  maxHeightRef.current = maxHeight;
  const measurableRef = useRef(measurable);
  measurableRef.current = measurable;
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;
  /**
   * The EFFECTIVE `maxWidth` of the CURRENT frame — its explicit `size.maxWidth`
   * if it declared one, else the surface `maxWidth`. Held so the next frame change
   * knows the width to morph FROM. The handler owns it (not a passive effect) so a
   * per-frame width is not clobbered mid-flow.
   */
  const activeMaxWidth = useRef(maxWidth);

  // Keep the active frame's DECLARED size current on every render/layout — this
  // is the panel's resting size, so it survives a placement swap (which remounts
  // this surface and fires the listener immediately with the current frame). A
  // frame with no explicit size resets these to 0 (natural sizing). A LAYOUT
  // effect so the seed lands BEFORE paint on a placement-swap remount (the child
  // `SurfaceScreen`'s `setFrame` layout-effect runs first, setting the channel's
  // last frame; registering here then fires immediately with it — no small-size
  // flash). NOTE: must NOT touch `activeMaxWidth` — the listener runs BEFORE the
  // key-change handler in the same `setFrame`, and the handler needs the PREVIOUS
  // frame's width as the animation's FROM.
  useLayoutEffect(() => {
    return channel.setFrameListener((frame) => {
      declaredHeight.value = frame.size?.height ?? 0;
      declaredMaxWidth.value = frame.size?.maxWidth ?? 0;
    });
  }, [channel, declaredHeight, declaredMaxWidth]);

  const clearReleaseTimer = useCallback(() => {
    if (releaseTimer.current === null) return;
    clearTimeout(releaseTimer.current);
    releaseTimer.current = null;
  }, []);

  /** Hand the panel back to natural sizing. */
  const release = useCallback(() => {
    awaitingSize.current = false;
    clearReleaseTimer();
    cancelAnimation(height);
    pinned.value = 0;
  }, [clearReleaseTimer, height, pinned]);

  /** Start the reshape once the incoming frame's natural height is known. */
  const settle = useCallback(
    (naturalContentHeight: number) => {
      if (!awaitingSize.current) return;
      awaitingSize.current = false;
      clearReleaseTimer();
      if (naturalContentHeight < MIN_MEASURABLE_CONTENT) {
        release();
        return;
      }
      const from = height.value;
      const to = Math.max(
        0,
        Math.min(naturalContentHeight + chrome.current, maxHeightRef.current),
      );
      if (Math.abs(to - from) < 1) {
        release();
        return;
      }
      height.value = withTiming(
        to,
        { duration: DIALOG_MORPH_DURATION, easing: MORPH_EASING },
        (finished) => {
          'worklet';
          // Release only on a clean finish — a cancel means a newer morph has
          // already taken the pin over.
          if (finished) pinned.value = 0;
        },
      );
    },
    [clearReleaseTimer, height, pinned, release],
  );

  // The morph runner. Registered on the channel the content writes into.
  useEffect(() => {
    return channel.setHandler((next) => {
      if (!enabledRef.current) return;

      // The incoming frame always fades in, morph or not — a hard content cut
      // inside a surface that stays put is the jarring part.
      cancelAnimation(fade);
      fade.value = 0;
      fade.value = withTiming(1, {
        duration: DIALOG_MORPH_FADE_DURATION,
        easing: MORPH_EASING,
      });

      if (next.morph === false) {
        release();
        return;
      }

      // Pin at the size the panel is CURRENTLY painted at. `panelHeight` is
      // still the outgoing frame's: this runs in the swap's layout phase, before
      // the incoming content's layout is reported.
      const from = panelHeight.current;

      // Width, where the placement allows it: ANIMATE the panel's maxWidth from
      // the outgoing frame's effective width to the incoming one's (its explicit
      // `size.maxWidth`, else the surface `maxWidth`). The resting width is the
      // DERIVED `declaredMaxWidth`, so we release `widthPinned` on finish — nothing
      // snaps, and a placement swap re-settles at the declared width on its own.
      const fromWidth = activeMaxWidth.current;
      const toWidth = next.size?.maxWidth ?? maxWidth;
      activeMaxWidth.current = toWidth;
      if (fromWidth !== undefined && toWidth !== undefined && fromWidth !== toWidth) {
        cancelAnimation(width);
        width.value = fromWidth;
        widthPinned.value = 1;
        width.value = withTiming(
          toWidth,
          { duration: DIALOG_MORPH_DURATION, easing: MORPH_EASING },
          (finished) => {
            'worklet';
            if (finished) widthPinned.value = 0;
          },
        );
      }

      // Height. An EXPLICIT `size.height` animates the panel DIRECTLY to it (grows
      // or shrinks even a non-measurable / own-scroller frame to a big declared
      // size); otherwise the panel can only reshape when the surface owns the
      // scroll container (`measurable`) and we measure the incoming content. The
      // resting height is the DERIVED `declaredHeight`, so we release the pin on
      // finish — no snap to 'auto', and a placement swap re-settles there itself.
      if (next.size?.height !== undefined) {
        if (from <= 0) return;
        cancelAnimation(height);
        height.value = from;
        pinned.value = 1;
        const to = Math.max(0, Math.min(next.size.height, maxHeightRef.current));
        height.value = withTiming(
          to,
          { duration: DIALOG_MORPH_DURATION, easing: MORPH_EASING },
          (finished) => {
            'worklet';
            if (finished) pinned.value = 0;
          },
        );
        return;
      }

      if (!measurableRef.current) {
        release();
        return;
      }
      if (from <= 0) return;
      cancelAnimation(height);
      height.value = from;
      pinned.value = 1;
      awaitingSize.current = true;
      clearReleaseTimer();
      releaseTimer.current = setTimeout(release, MORPH_MEASURE_TIMEOUT_MS);
    });
  }, [
    channel,
    clearReleaseTimer,
    fade,
    height,
    maxWidth,
    pinned,
    release,
    width,
    widthPinned,
  ]);

  useEffect(
    () => () => {
      clearReleaseTimer();
      cancelAnimation(height);
      cancelAnimation(width);
      cancelAnimation(fade);
    },
    [clearReleaseTimer, fade, height, width],
  );

  /** Re-derive the panel's own chrome height whenever it can be sampled cleanly. */
  const calibrate = useCallback(() => {
    if (!measurableRef.current) return;
    if (pinned.value === 1 || awaitingSize.current) return;
    if (panelHeight.current <= 0 || contentHeight.current <= 0) return;
    const delta = panelHeight.current - contentHeight.current;
    // A panel SHORTER than its content is capped, and one far taller is not
    // reporting chrome at all — neither says anything usable.
    if (delta < 0 || delta > MAX_PANEL_CHROME) return;
    chrome.current = delta;
  }, [pinned]);

  /** Attach to the panel: tracks the size a morph starts from. */
  const onPanelLayout = useCallback(
    (event: LayoutChangeEvent) => {
      panelHeight.current = event.nativeEvent.layout.height;
      calibrate();
    },
    [calibrate],
  );

  /**
   * Attached to the content wrapper, which lives INSIDE the surface's scroll
   * container and is sized by its own content — so it reports the natural height
   * of the incoming frame even while the panel is pinned at the outgoing one,
   * which is exactly what a pinned panel cannot measure for itself.
   */
  const onContentLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const natural = event.nativeEvent.layout.height;
      contentHeight.current = natural;
      if (awaitingSize.current) {
        settle(natural);
        return;
      }
      calibrate();
    },
    [calibrate, settle],
  );

  const panelStyle = useAnimatedStyle<ViewStyle>(() => {
    // Height: the in-flight animation while pinned, else the RESTING size — the
    // active frame's `declaredHeight` when it has one (survives a placement swap),
    // else natural (`'auto'`).
    const resolvedHeight: ViewStyle['height'] =
      pinned.value === 1
        ? height.value
        : declaredHeight.value > 0
          ? declaredHeight.value
          : 'auto';
    // Width only varies on a placement that HAS a `maxWidth` (the centered card).
    // A full-bleed placement (bottom sheet, `maxWidth === undefined`) is never
    // width-capped — only height matters there. On the centered card the width is
    // the in-flight animation while pinned, else the frame's declared width (which
    // survives a placement swap), else the surface `maxWidth`.
    if (maxWidth === undefined) return { height: resolvedHeight };
    const resolvedMaxWidth =
      widthPinned.value === 1
        ? width.value
        : declaredMaxWidth.value > 0
          ? declaredMaxWidth.value
          : maxWidth;
    return { height: resolvedHeight, maxWidth: resolvedMaxWidth };
    // RN-Web has no worklets babel plugin: every shared value the mapper READS
    // must be listed here or it runs once and freezes at the first frame.
  }, [pinned, height, declaredHeight, widthPinned, width, declaredMaxWidth, maxWidth]);

  const contentStyle = useAnimatedStyle<ViewStyle>(
    () => ({ opacity: fade.value }),
    [fade],
  );

  return {
    channel,
    onPanelLayout,
    onContentLayout,
    panelStyle,
    contentStyle,
  };
}

export type DialogMorph = ReturnType<typeof useDialogMorph>;

/**
 * Wraps a surface's content: publishes the frame channel to it (so it can
 * declare swaps via {@link useDialogFrame}), measures the content's natural
 * height, and carries the incoming-frame fade.
 *
 * MUST be rendered inside the surface's scroll content and MUST NOT be given a
 * growing/stretching style: it is sized by its own content, which is what lets
 * it report the incoming frame's natural height while the panel is still pinned
 * at the outgoing one.
 */
export function DialogMorphContent({
  morph,
  style,
  children,
}: {
  morph: DialogMorph;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <DialogFrameContext.Provider value={morph.channel}>
      <Animated.View onLayout={morph.onContentLayout} style={[style, morph.contentStyle]}>
        {children}
      </Animated.View>
    </DialogFrameContext.Provider>
  );
}
