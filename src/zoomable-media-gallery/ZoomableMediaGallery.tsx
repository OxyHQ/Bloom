import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  ScrollView,
  Share,
  useWindowDimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
  type ViewStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import {
  GestureHandlerRootView,
  Gesture,
  GestureDetector,
} from 'react-native-gesture-handler';
import { borderRadius } from '../styles/tokens';
import { Backdrop, OverlayRoot } from '../overlay';
import { Portal } from '../portal';
import { useInteractionState } from '../hooks/use-interaction-state';
import {
  ArrowLeft_Stroke2_Corner0_Rounded,
  ArrowRight_Stroke2_Corner0_Rounded,
  ArrowOutOfBox_Stroke2_Corner0_Rounded,
} from '../icons';
import { WEB_POSITION_FIXED, type WebCssStyle } from '../styles/web-view-style';
import { MediaPoster, MediaSurface } from '../media-flight/MediaSurface';
import {
  getAspectRatio,
  getIntrinsicSize,
  fetchAspectRatio,
  DEFAULT_ASPECT_RATIO,
} from '../image-aspect-ratio-cache';
import {
  FIT_FRACTION,
  MAX_DRAG_FRACTION,
  SCALE_DRAG_FRACTION,
  MIN_DRAG_SCALE,
  DISMISS_FRACTION,
  AXIS_DECISION_OFFSET,
  OPEN_DURATION_WEB,
  CLOSE_DURATION_WEB,
  OPACITY_DURATION,
  OPEN_SPRING,
  CLOSE_SPRING,
  SNAP_BACK_SPRING,
  DEFAULT_CORNER_RADIUS,
  MIN_ZOOM_SCALE,
  MAX_ZOOM_SCALE,
  ZOOM_SNAP_THRESHOLD,
  DOUBLE_TAP_ZOOM_SCALE,
  ZOOM_PAN_DAMPING,
  ZOOM_PAN_MAX_BASE,
  THUMBNAIL_STRIP_TILE_SIZE,
} from './constants';
import type {
  GalleryMedia,
  MeasuredRect,
  ZoomableMediaGalleryHandle,
  ZoomableMediaGalleryProps,
} from './types';

/**
 * The still-frame URI of an item: the image itself, or a video's poster.
 * `undefined` for a video with no poster — there is nothing to probe, size
 * against or show in the strip, and every caller below handles that.
 */
function posterUri(item: GalleryMedia): string | undefined {
  return item.kind === 'video' ? item.poster : item.uri;
}

/** The aspect ratio already known for an item, from the shared probe cache. */
function cachedRatio(item: GalleryMedia): number | undefined {
  const uri = posterUri(item);
  return uri === undefined ? undefined : getAspectRatio(uri);
}

/**
 * A stable React key. An image is identified by its URI; a video is not (its
 * player is an object with no URL), which is why `GalleryVideo` carries an
 * explicit `id`. The index is folded in so a post repeating one image still
 * pages correctly.
 */
function mediaKey(item: GalleryMedia, index: number): string {
  return item.kind === 'video' ? `video-${item.id}-${index}` : `image-${item.uri}-${index}`;
}

/**
 * What the share sheet is handed. A poster is not what "share this video"
 * means, so a video shares its own `shareUrl` or nothing at all.
 */
function shareUri(item: GalleryMedia): string | undefined {
  return item.kind === 'video' ? item.shareUrl : item.uri;
}

// Web-only interaction hints (no-ops on native): the zoom surfaces are
// tap-to-dismiss (`cursor: pointer`) and must not select text or drag the
// image. `Platform.select` keeps them off native. `cursor` is a real
// `ViewStyle` key on RN 0.83; `userSelect` is declared on `TextStyle` only,
// which is what `WebCssStyle` covers.
const WEB_POINTER: WebCssStyle = { userSelect: 'none', cursor: 'pointer' };
const WEB_USER_SELECT_NONE: WebCssStyle = { userSelect: 'none' };

const webPointerStyle = Platform.select({ web: WEB_POINTER, default: undefined });
const webUserSelectNoneStyle = Platform.select({
  web: WEB_USER_SELECT_NONE,
  default: undefined,
});

/**
 * The gallery's web-only paging arrows — the ONLY hover-styled control in the
 * package, which is why the hover merge lives here rather than in a shared
 * component. Hover is a web affordance (react-native-web synthesises
 * `onHoverIn`/`onHoverOut`; native pointers have none), and these arrows are
 * already rendered behind a `Platform.OS === 'web'` guard.
 */
function NavArrow({
  direction,
  onPress,
}: {
  direction: 'left' | 'right';
  onPress: () => void;
}) {
  const { state: hovered, onIn: onHoverIn, onOut: onHoverOut } = useInteractionState();
  const isLeft = direction === 'left';

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={isLeft ? 'Previous item' : 'Next item'}
      hitSlop={8}
      onHoverIn={onHoverIn}
      onHoverOut={onHoverOut}
      style={[
        styles.navArrow,
        isLeft ? styles.navArrowLeft : styles.navArrowRight,
        webPointerStyle,
        hovered ? (isLeft ? styles.navArrowHoverLeft : styles.navArrowHoverRight) : null,
      ]}
    >
      {isLeft ? (
        <ArrowLeft_Stroke2_Corner0_Rounded fill="#fff" size="lg" />
      ) : (
        <ArrowRight_Stroke2_Corner0_Rounded fill="#fff" size="lg" />
      )}
    </Pressable>
  );
}

interface FittedSize {
  width: number;
  height: number;
}

/**
 * Resolve `cornerRadius` against the size an item is actually rendered at, so
 * `'circle'` stays a circle at every fitted size (and through the open/close
 * animation, which scales this same box).
 */
function resolveCornerRadius(cornerRadius: number | 'circle', fit: FittedSize): number {
  return cornerRadius === 'circle' ? Math.min(fit.width, fit.height) / 2 : cornerRadius;
}

/**
 * Fullscreen, swipeable MEDIA viewer — images and consumer-owned videos in one
 * pager — replicating the profile avatar's measured-origin zoom transition
 * (`ZoomableAvatar`) for rectangular post media:
 *
 * - Open/close feel is identical to the avatar (same spring configs, web
 *   timing/easing, blur backdrop, and the measure-origin technique). The viewer
 *   renders through the Bloom `Portal` on BOTH platforms (RN's `Modal` is not
 *   used on native — on the New Architecture / Fabric Android its host views
 *   mount full-screen but never composite, leaving the viewer invisible).
 * - The OPENING (tapped) item animates from its measured rect to a centered,
 *   aspect-ratio-preserving fit within {@link FIT_FRACTION} of the screen. Once
 *   the open animation settles, a horizontal paging `ScrollView` mounts seeded at
 *   the tapped index so the user can swipe between every item in the post.
 * - Gesture disambiguation: the pager owns horizontal swipes; a vertical-only
 *   `Gesture.Pan` (`activeOffsetY` + `failOffsetX`) owns drag-to-dismiss, so the
 *   two never fight.
 *
 * ## Video, and why it does not restart
 *
 * A video page is fed by a `VideoPlayer` the CONSUMER created and owns. Bloom
 * never creates or destroys one: expo-video keeps the player OBJECT separate
 * from the `VideoView` that shows it, and one player may feed several views, so
 * handing the same player to this gallery moves a playing video into fullscreen
 * without re-opening the stream. Exactly ONE view is mounted per opening — the
 * active page's — while every other page and every strip tile renders the still
 * (`MediaPoster`). The single unavoidable swap is the pre-pager open surface
 * handing over to the pager's active page once the open animation settles.
 *
 * `expo-video` is an OPTIONAL peer loaded through `media-flight/expo-video-module`.
 * Without it a video page degrades to its poster, once, with a dev warning.
 */
const ZoomableMediaGalleryInner = React.forwardRef<ZoomableMediaGalleryHandle, ZoomableMediaGalleryProps>(({ measureThumb, cornerRadius = DEFAULT_CORNER_RADIUS, indicatorVariant = 'dots', videoControls = false }, ref) => {
  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = useWindowDimensions();

  const radiusFor = useCallback(
    (fit: FittedSize) => resolveCornerRadius(cornerRadius, fit),
    [cornerRadius],
  );

  const [isOpen, setIsOpen] = useState(false);
  // Once true, the swipeable pager is mounted and the single open-surface hidden.
  const [pagerReady, setPagerReady] = useState(false);
  const [items, setItems] = useState<GalleryMedia[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  // Whether the active media is currently pinched/double-tapped past its base
  // size. Drives the pan-while-zoomed gesture, disables the pager's horizontal
  // paging + the dismiss drag so a pan moves the zoomed media instead.
  const [isZoomed, setIsZoomed] = useState(false);
  // Aspect ratio of the OPENING item (drives the open-animation fit box).
  const [openRatio, setOpenRatio] = useState<number>(DEFAULT_ASPECT_RATIO);
  // Per-item aspect ratios for the pager pages (index-aligned with `items`).
  const [pageRatios, setPageRatios] = useState<Record<number, number>>({});

  // Native `Share` is always available; web exposes a share button only when the
  // browser implements `navigator.share`. Computed once (capability is static).
  const [canShare] = useState(() => {
    if (Platform.OS !== 'web') return true;
    return typeof navigator !== 'undefined' && typeof navigator.share === 'function';
  });

  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0);

  // Zoom transform of the active media, kept SEPARATE from the open/close +
  // dismiss-drag transform above (reusing those would collide two meanings).
  // `zoom*` are the live/persisted values; `baseZoomScale` is captured at pinch
  // start and `savedZoomTranslate*` at pan start for incremental bookkeeping.
  const zoomScale = useSharedValue(1);
  const zoomTranslateX = useSharedValue(0);
  const zoomTranslateY = useSharedValue(0);
  const baseZoomScale = useSharedValue(1);
  const savedZoomTranslateX = useSharedValue(0);
  const savedZoomTranslateY = useSharedValue(0);

  // Origin (offset from screen center) of the tapped item.
  const originX = useSharedValue(0);
  const originY = useSharedValue(0);

  const startX = useSharedValue(0);
  const startY = useSharedValue(0);
  // Per-drag baseline captured at pan start (transient).
  const startScale = useSharedValue(1);
  // Persistent scale of the open-surface at its thumbnail origin (thumbWidth /
  // fittedWidth). The open animation grows from this to 1; the close animation
  // shrinks back to it. Never overwritten by the drag gesture.
  const originScale = useSharedValue(1);

  const pagerRef = useRef<ScrollView>(null);
  // Mirror of `activeIndex` readable synchronously from callbacks/worklets
  // (`handleDismiss` runs via `runOnJS` and from `Pressable.onPress`, where the
  // state closure can be stale). Kept in lockstep by `setActiveIndexBoth`.
  const activeIndexRef = useRef(0);
  // True from the first dismiss request until the viewer is actually unmounted.
  const dismissingRef = useRef(false);

  // Every deferred step of the open / dismiss choreography, so unmount can cancel
  // the ones still owing.
  //
  // Each one ends in a `setState` on THIS instance, and each is scheduled from a
  // gesture or an imperative `open()` — never from an effect — so React's own
  // teardown reaches none of them. A screen left within the ~300 ms of the open
  // transition therefore leaves a live timer holding the whole subtree, and the
  // state it eventually writes lands on a tree nobody is rendering. React makes
  // that a silent no-op rather than an error, which is exactly why it survived:
  // measured under jest, the gallery's `revealPager` timer outlives the file
  // that mounted it and fires inside the NEXT test file in the same worker
  // process, sometimes re-scheduling itself two files further on.
  const pendingRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());
  const frameRef = useRef<number | null>(null);
  const unmountedRef = useRef(false);
  const schedule = useCallback((step: () => void, delay: number) => {
    // The open transition's own frame callback schedules the step after it, so
    // this can be reached once the component is already gone — starting a timer
    // there would put one back after the cleanup has run.
    if (unmountedRef.current) return;
    const handle = setTimeout(() => {
      pendingRef.current.delete(handle);
      step();
    }, delay);
    pendingRef.current.add(handle);
  }, []);
  useEffect(
    () => () => {
      unmountedRef.current = true;
      for (const handle of pendingRef.current) clearTimeout(handle);
      pendingRef.current.clear();
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    },
    [],
  );

  // Single writer for the current index: updates state (drives indicator + open
  // image) and the synchronous mirror together, and only when it changes.
  const setActiveIndexBoth = useCallback((next: number) => {
    activeIndexRef.current = next;
    setActiveIndex((prev) => (prev === next ? prev : next));
  }, []);

  // Snap the active media back to its un-zoomed baseline (no animation) and
  // clear all zoom bookkeeping. Called on every path that changes the active
  // page so a freshly-viewed item always starts un-zoomed.
  const resetZoom = useCallback(() => {
    zoomScale.value = 1;
    zoomTranslateX.value = 0;
    zoomTranslateY.value = 0;
    savedZoomTranslateX.value = 0;
    savedZoomTranslateY.value = 0;
    baseZoomScale.value = 1;
    setIsZoomed(false);
  }, [baseZoomScale, savedZoomTranslateX, savedZoomTranslateY, zoomScale, zoomTranslateX, zoomTranslateY]);

  // Box the fitted image must fit inside.
  const fitBox = useMemo<FittedSize>(
    () => ({ width: SCREEN_WIDTH * FIT_FRACTION, height: SCREEN_HEIGHT * FIT_FRACTION }),
    [SCREEN_WIDTH, SCREEN_HEIGHT]
  );

  // Largest width/height for `ratio` that fits inside `fitBox` without cropping
  // (contain), never exceeding the media's own resolution: filling the viewport
  // with a 512px avatar or a small thumbnail just renders it soft. `uri` is what
  // lets us look the intrinsic size up; without it (not measured yet) the fit
  // box wins and the clamp applies on the next frame.
  const fitForRatio = useCallback((ratio: number, uri?: string): FittedSize => {
    const safeRatio = ratio > 0 && Number.isFinite(ratio) ? ratio : DEFAULT_ASPECT_RATIO;
    let width = fitBox.width;
    let height = width / safeRatio;
    if (height > fitBox.height) {
      height = fitBox.height;
      width = height * safeRatio;
    }
    const intrinsic = uri ? getIntrinsicSize(uri) : undefined;
    if (intrinsic && intrinsic.width > 0 && width > intrinsic.width) {
      width = intrinsic.width;
      height = width / safeRatio;
    }
    return { width, height };
  }, [fitBox]);

  // Fitted size of the single open-surface for the CURRENT page. On open this is
  // the opened item's fit (active index == opened index, ratio == `openRatio`);
  // after swiping it tracks the viewed item so the collapse-on-dismiss renders
  // and flies back the media actually on screen.
  const activeItem = items[activeIndex];
  const activeRatio = pageRatios[activeIndex] ?? openRatio;
  const activeUri = activeItem === undefined ? undefined : posterUri(activeItem);
  const activeFit = useMemo(
    () => fitForRatio(activeRatio, activeUri),
    [fitForRatio, activeRatio, activeUri],
  );

  // Alt text (accessibility description) of the item currently on screen, shown
  // as a caption at the bottom of the viewer (Bluesky-style lightbox footer).
  const activeAlt = activeItem?.alt?.trim() || undefined;

  // Probe and cache the ratio of the page at `index`. A video with no poster has
  // nothing to probe — it keeps whatever ratio the consumer declared, or the
  // gallery default — so this is a no-op rather than a guess.
  const ensureRatio = useCallback((index: number, uri: string | undefined) => {
    if (uri === undefined) return;
    const cached = getAspectRatio(uri);
    if (cached !== undefined) {
      setPageRatios((prev) => (prev[index] === cached ? prev : { ...prev, [index]: cached }));
      return;
    }
    void fetchAspectRatio(uri).then((ratio) => {
      setPageRatios((prev) => (prev[index] === ratio ? prev : { ...prev, [index]: ratio }));
    });
  }, []);

  // Unmount + reset all animation values to their neutral baseline. Shared by
  // every dismiss path (fly-back and fade-out fallback).
  const finalizeDismiss = useCallback(() => {
    setIsOpen(false);
    dismissingRef.current = false;
    scale.value = 1;
    translateX.value = 0;
    translateY.value = 0;
    opacity.value = 0;
  }, [opacity, scale, translateX, translateY]);

  // Fly the (possibly dragged) media back toward `target` — the rect of the
  // thumbnail currently being viewed — shrinking to its footprint. Uses the
  // EXACT same close spring (native) / timing (web) as the avatar transition.
  const flyBackTo = useCallback(
    (target: { x: number; y: number; scale: number }) => {
      if (Platform.OS === 'web') {
        const duration = CLOSE_DURATION_WEB;
        const easing = Easing.in(Easing.cubic);
        scale.value = withTiming(target.scale, { duration, easing });
        translateX.value = withTiming(target.x, { duration, easing });
        translateY.value = withTiming(target.y, { duration, easing });
        opacity.value = withTiming(0, { duration, easing });
        schedule(finalizeDismiss, duration + 20);
      } else {
        scale.value = withSpring(target.scale, CLOSE_SPRING);
        translateX.value = withSpring(target.x, CLOSE_SPRING);
        translateY.value = withSpring(target.y, CLOSE_SPRING);
        opacity.value = withTiming(0, { duration: OPACITY_DURATION });
        schedule(finalizeDismiss, CLOSE_DURATION_WEB);
      }
    },
    [finalizeDismiss, opacity, scale, schedule, translateX, translateY]
  );

  // Fallback when the current thumbnail cannot be measured (ref missing /
  // unmounted / virtualized): a plain center fade-out with a slight scale-down,
  // then unmount. Keeps the same web timing / native spring feel.
  const fadeOutCenter = useCallback(() => {
    if (Platform.OS === 'web') {
      const duration = CLOSE_DURATION_WEB;
      const easing = Easing.in(Easing.cubic);
      scale.value = withTiming(MIN_DRAG_SCALE, { duration, easing });
      opacity.value = withTiming(0, { duration, easing });
      schedule(finalizeDismiss, duration + 20);
    } else {
      scale.value = withSpring(MIN_DRAG_SCALE, CLOSE_SPRING);
      opacity.value = withTiming(0, { duration: OPACITY_DURATION });
      schedule(finalizeDismiss, CLOSE_DURATION_WEB);
    }
  }, [finalizeDismiss, opacity, scale, schedule]);

  const handleDismiss = useCallback(() => {
    // A press on the image reaches BOTH its tap gesture and the page beneath it
    // (which owns the dismiss for the empty area around the image), so this can
    // fire twice for one click. Latch it: a second call would start a second
    // fly-back from an already-moving image.
    if (dismissingRef.current) return;
    dismissingRef.current = true;
    // Collapse the pager back to the single open-surface so the fly-back
    // animates one item (the current one) rather than the whole scrolled strip.
    setPagerReady(false);

    const index = activeIndexRef.current;
    const current = items[index];
    // Recompute the fly-back target from the CURRENT item: the live rect of its
    // thumbnail + the same fitted box (`activeFit`) the open-surface is rendered
    // at, using the same screen-center math as `open`. Falls back to a center
    // fade-out when the thumbnail can't be measured.
    if (measureThumb && current) {
      const centerX = SCREEN_WIDTH / 2;
      const centerY = SCREEN_HEIGHT / 2;
      void measureThumb(index).then((rect) => {
        if (rect && rect.width > 0 && activeFit.width > 0) {
          flyBackTo({
            x: rect.x + rect.width / 2 - centerX,
            y: rect.y + rect.height / 2 - centerY,
            scale: rect.width / activeFit.width,
          });
        } else {
          fadeOutCenter();
        }
      });
      return;
    }

    fadeOutCenter();
  }, [
    activeFit,
    fadeOutCenter,
    flyBackTo,
    items,
    measureThumb,
    SCREEN_HEIGHT,
    SCREEN_WIDTH,
  ]);

  // Reveal the swipeable pager once the open animation has settled. The index it
  // lands on is `activeIndexRef` (set synchronously in `open`), seated by the
  // layout effect below.
  const revealPager = useCallback(() => {
    setPagerReady(true);
  }, []);

  const open = useCallback(
    (nextItems: GalleryMedia[], index: number, rect?: MeasuredRect) => {
      if (isOpen || nextItems.length === 0) return;
      dismissingRef.current = false;
      const safeIndex = Math.min(Math.max(index, 0), nextItems.length - 1);
      const target = nextItems[safeIndex];
      if (!target) return;
      const targetUri = posterUri(target);
      const knownRatio = target.aspectRatio ?? cachedRatio(target);
      const ratio = knownRatio ?? DEFAULT_ASPECT_RATIO;

      setItems(nextItems);
      setActiveIndexBoth(safeIndex);
      setOpenRatio(ratio);
      // Seed every page whose ratio is already known (consumer-provided metadata
      // or a previously-cached probe) so swiping never hits the same snap — only
      // a genuinely-unknown item falls through to `ensureRatio`'s async probe.
      const initialRatios: Record<number, number> = {};
      nextItems.forEach((item, i) => {
        const r = item.aspectRatio ?? cachedRatio(item);
        if (r !== undefined) initialRatios[i] = r;
      });
      setPageRatios(initialRatios);

      // Resolve the opening ratio if it was not yet known, then re-fit. A video
      // with no poster has nothing to probe and keeps the default.
      if (knownRatio === undefined && targetUri !== undefined) {
        void fetchAspectRatio(targetUri).then((resolved) => {
          setOpenRatio(resolved);
          setPageRatios((prev) => ({ ...prev, [safeIndex]: resolved }));
        });
      }

      // The open-surface box is rendered at its FINAL fitted size; the open
      // animation grows it from the thumbnail's footprint (scale < 1) up to 1,
      // mirroring the avatar's small→big scale. The initial scale is the ratio
      // of the thumbnail width to the fitted width.
      const fitted = fitForRatio(ratio, targetUri);
      const centerX = SCREEN_WIDTH / 2;
      const centerY = SCREEN_HEIGHT / 2;
      if (rect && rect.width > 0) {
        originX.value = rect.x + rect.width / 2 - centerX;
        originY.value = rect.y + rect.height / 2 - centerY;
        originScale.value = rect.width / fitted.width;
      } else {
        originX.value = 0;
        originY.value = 0;
        originScale.value = 1;
      }

      setIsOpen(true);
      translateX.value = originX.value;
      translateY.value = originY.value;
      scale.value = originScale.value;
      opacity.value = 0;

      if (Platform.OS === 'web') {
        frameRef.current = requestAnimationFrame(() => {
          frameRef.current = null;
          const duration = OPEN_DURATION_WEB;
          const easing = Easing.out(Easing.cubic);
          scale.value = withTiming(1, { duration, easing });
          translateX.value = withTiming(0, { duration, easing });
          translateY.value = withTiming(0, { duration, easing });
          opacity.value = withTiming(1, { duration, easing });
          schedule(revealPager, duration);
        });
      } else {
        schedule(() => {
          scale.value = withSpring(1, OPEN_SPRING);
          translateX.value = withSpring(0, OPEN_SPRING);
          translateY.value = withSpring(0, OPEN_SPRING);
          opacity.value = withTiming(1, { duration: OPACITY_DURATION });
          schedule(revealPager, OPEN_DURATION_WEB);
        }, 0);
      }
    },
    [
      isOpen,
      SCREEN_WIDTH,
      SCREEN_HEIGHT,
      fitForRatio,
      opacity,
      originScale,
      originX,
      originY,
      revealPager,
      scale,
      schedule,
      setActiveIndexBoth,
      translateX,
      translateY,
    ]
  );

  React.useImperativeHandle(ref, () => ({ open }), [open]);

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        // Disabled while zoomed so a drag pans the zoomed image (via the
        // per-page pan gesture) instead of trying to dismiss the whole viewer.
        .enabled(isOpen && !isZoomed)
        // Only claim drags that are decided to be vertical; horizontal drags
        // fall through to the pager's ScrollView so swiping changes pages.
        .activeOffsetY([-AXIS_DECISION_OFFSET, AXIS_DECISION_OFFSET])
        .failOffsetX([-AXIS_DECISION_OFFSET, AXIS_DECISION_OFFSET])
        .onStart(() => {
          startX.value = translateX.value;
          startY.value = translateY.value;
          startScale.value = scale.value;
        })
        .onUpdate((event) => {
          translateX.value = startX.value + event.translationX;
          translateY.value = startY.value + event.translationY;
          const dragDistance = Math.sqrt(event.translationX ** 2 + event.translationY ** 2);
          const maxDrag = SCREEN_HEIGHT * MAX_DRAG_FRACTION;
          opacity.value = Math.max(0, 1 - dragDistance / maxDrag);
          const scaleReduction = Math.max(
            MIN_DRAG_SCALE,
            1 - dragDistance / (SCREEN_HEIGHT * SCALE_DRAG_FRACTION)
          );
          scale.value = startScale.value * scaleReduction;
        })
        .onEnd((event) => {
          const dragDistance = Math.sqrt(event.translationX ** 2 + event.translationY ** 2);
          if (dragDistance > SCREEN_HEIGHT * DISMISS_FRACTION) {
            runOnJS(handleDismiss)();
          } else {
            scale.value = withSpring(1, SNAP_BACK_SPRING);
            translateX.value = withSpring(0, SNAP_BACK_SPRING);
            translateY.value = withSpring(0, SNAP_BACK_SPRING);
            opacity.value = withTiming(1, { duration: OPACITY_DURATION });
          }
        }),
    [handleDismiss, isOpen, isZoomed, SCREEN_HEIGHT, opacity, scale, startScale, startX, startY, translateX, translateY]
  );

  // CRITICAL — every shared value a mapper READS must be listed in its dependency
  // array. On web WITHOUT the react-native-worklets babel plugin (what every Oxy
  // RN-Web app ships), reanimated cannot auto-detect the reads, so it drives the
  // mapper off the deps array instead: with none, each mapper runs ONCE and
  // freezes at the opening frame while the shared values animate underneath it.
  // That froze the open animation, the drag-to-dismiss follow and the pinch/
  // double-tap zoom on web. Native (plugin present) auto-tracks and ignores the
  // extra deps, so listing them is correct on both platforms. Same rule as
  // `bottom-sheet/BottomSheetBase.tsx`. Do NOT strip these.
  const backdropStyle = useAnimatedStyle(
    () => ({ opacity: opacity.value }),
    [opacity],
  );

  // The single open-surface animates from origin → fitted center.
  const openImageStyle = useAnimatedStyle(
    () => ({
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
      ],
    }),
    [translateX, translateY, scale],
  );

  // While dragging to dismiss, the whole pager follows the finger + fades.
  const pagerContainerStyle = useAnimatedStyle(
    () => ({
      opacity: opacity.value,
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
      ],
    }),
    [opacity, translateX, translateY, scale],
  );

  // Pinch/double-tap zoom transform, layered on TOP of the active page image's
  // `fit`-based sizing (composed, never replacing it).
  const zoomImageStyle = useAnimatedStyle(
    () => ({
      transform: [
        { scale: zoomScale.value },
        { translateX: zoomTranslateX.value },
        { translateY: zoomTranslateY.value },
      ],
    }),
    [zoomScale, zoomTranslateX, zoomTranslateY],
  );

  // Derive the current page from the scroll offset, clamp into range, and update
  // `activeIndex` only when it actually changes (drives the live indicator + the
  // close fly-back target). Shared by `onMomentumScrollEnd` (native) and `onScroll`
  // (web, where paging may not fire a reliable momentum-end).
  const updateIndexFromOffset = useCallback(
    (offsetX: number) => {
      const lastIndex = items.length - 1;
      if (lastIndex < 0) return;
      const next = Math.min(Math.max(Math.round(offsetX / SCREEN_WIDTH), 0), lastIndex);
      if (next === activeIndexRef.current) return;
      // Swiping to a new page always starts it un-zoomed (and clears the zoom on
      // the page scrolling away).
      resetZoom();
      setActiveIndexBoth(next);
      const item = items[next];
      if (item) ensureRatio(next, posterUri(item));
    },
    [ensureRatio, items, resetZoom, setActiveIndexBoth, SCREEN_WIDTH]
  );

  // Programmatically page to `index` (arrow buttons, keyboard, thumbnail taps).
  // Clamps into range and lets the existing scroll handlers own the index/ratio
  // state-sync — this only triggers the scroll. No-op until the pager is mounted.
  const pageTo = useCallback(
    (index: number) => {
      if (!pagerReady) return;
      const lastIndex = items.length - 1;
      if (lastIndex < 0) return;
      const clamped = Math.min(Math.max(index, 0), lastIndex);
      resetZoom();
      pagerRef.current?.scrollTo({ x: clamped * SCREEN_WIDTH, y: 0, animated: true });
    },
    [items.length, pagerReady, resetZoom, SCREEN_WIDTH]
  );

  const onPagerScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      updateIndexFromOffset(event.nativeEvent.contentOffset.x);
    },
    [updateIndexFromOffset]
  );

  // Re-seat the pager on the CURRENT page, without animation, whenever it mounts
  // or the page width changes.
  //
  // Rotation is the case that needs this: the pager's retained scroll offset is
  // in PIXELS, so when `SCREEN_WIDTH` changes the page widths change underneath
  // a stale offset and the pager lands between two pages — showing the wrong
  // image while the counter and dots still point at the right one. Nothing else
  // corrects it: `contentOffset` below is only an initial value, and `pageTo`
  // runs only on an explicit page change. Reading the index from
  // `activeIndexRef` (rather than the index the viewer was opened at) is what
  // makes it land on the page the user is actually looking at.
  //
  // This is a layout EFFECT rather than the pager's `onLayout` on purpose. The
  // pages are sized from `SCREEN_WIDTH`, so the scroll offset is only meaningful
  // once React has committed a render carrying the new width. `onLayout` fires
  // from a different signal (the pager's own frame) than the one that resizes
  // the pages (`useWindowDimensions`), and the two are not ordered against each
  // other — so an `onLayout` handler can run holding the previous `SCREEN_WIDTH`
  // and re-seat the pager to the offset it already had. Keying the effect on
  // `SCREEN_WIDTH` makes the two agree by construction, and running it before
  // paint keeps the corrected offset from being visible as a jump.
  useLayoutEffect(() => {
    if (!pagerReady) return;
    pagerRef.current?.scrollTo({ x: activeIndexRef.current * SCREEN_WIDTH, y: 0, animated: false });
  }, [pagerReady, SCREEN_WIDTH]);

  // Double-tap toggles zoom: reset when already zoomed, else zoom to the tapped
  // point (biased toward it, clamped near the image center). `x`/`y` are local
  // to the active image, so its own fitted box gives the center + clamp bounds.
  const zoomToPoint = useCallback(
    (x: number, y: number) => {
      if (zoomScale.value > 1) {
        resetZoom();
        return;
      }
      const centerX = activeFit.width / 2;
      const centerY = activeFit.height / 2;
      const maxOffset = Math.max(activeFit.width, activeFit.height) * 0.2;
      const offsetX = Math.max(-maxOffset, Math.min(maxOffset, (centerX - x) * 0.5));
      const offsetY = Math.max(-maxOffset, Math.min(maxOffset, (centerY - y) * 0.5));
      zoomScale.value = withSpring(DOUBLE_TAP_ZOOM_SCALE);
      zoomTranslateX.value = withSpring(offsetX);
      zoomTranslateY.value = withSpring(offsetY);
      savedZoomTranslateX.value = offsetX;
      savedZoomTranslateY.value = offsetY;
      baseZoomScale.value = DOUBLE_TAP_ZOOM_SCALE;
      setIsZoomed(true);
    },
    [activeFit, baseZoomScale, resetZoom, savedZoomTranslateX, savedZoomTranslateY, zoomScale, zoomTranslateX, zoomTranslateY]
  );

  // Double-tap-to-zoom is a touch convention — disabled on web, where neither
  // Twitter's nor Instagram's lightbox gates its dismiss click behind tap-count
  // discrimination. Kept native-only.
  const doubleTapGesture = useMemo(
    () =>
      Gesture.Tap()
        .numberOfTaps(2)
        .enabled(Platform.OS !== 'web')
        .onEnd((event) => {
          runOnJS(zoomToPoint)(event.x, event.y);
        }),
    [zoomToPoint]
  );

  // Single tap dismisses — but only when un-zoomed (a tap while zoomed is inert;
  // double-tap/pinch own un-zooming). On native this is made exclusive with the
  // double-tap above so the first tap of a double-tap never dismisses; on web
  // (see `tapGesture` below) it fires immediately, matching standard web
  // lightbox click-to-close.
  const singleTapDismissGesture = useMemo(
    () =>
      Gesture.Tap()
        .numberOfTaps(1)
        .onEnd(() => {
          if (zoomScale.value > 1) return;
          runOnJS(handleDismiss)();
        }),
    [handleDismiss, zoomScale]
  );

  // On web, don't gate the dismiss tap behind double-tap-failure at all — that
  // coupling requires react-native-gesture-handler's web tap-exclusivity timing
  // (a ~500ms wait for the double-tap to time out) to resolve correctly for
  // every single click, which is both slower than every standard web lightbox
  // and the newest, least-exercised gesture code path here. Native keeps the
  // Exclusive composition since double-tap-to-zoom is the expected touch
  // convention there.
  const tapGesture = useMemo(
    () =>
      Platform.OS === 'web'
        ? singleTapDismissGesture
        : Gesture.Exclusive(doubleTapGesture, singleTapDismissGesture),
    [doubleTapGesture, singleTapDismissGesture]
  );

  const pinchGesture = useMemo(
    () =>
      Gesture.Pinch()
        .onStart(() => {
          baseZoomScale.value = zoomScale.value;
          runOnJS(setIsZoomed)(true);
        })
        .onUpdate((event) => {
          zoomScale.value = Math.max(
            MIN_ZOOM_SCALE,
            Math.min(MAX_ZOOM_SCALE, baseZoomScale.value * (event.scale || 1))
          );
        })
        .onEnd(() => {
          if (zoomScale.value < ZOOM_SNAP_THRESHOLD) {
            zoomScale.value = withSpring(1);
            zoomTranslateX.value = withSpring(0);
            zoomTranslateY.value = withSpring(0);
            savedZoomTranslateX.value = 0;
            savedZoomTranslateY.value = 0;
            baseZoomScale.value = 1;
            runOnJS(setIsZoomed)(false);
          } else {
            runOnJS(setIsZoomed)(true);
          }
        }),
    [baseZoomScale, savedZoomTranslateX, savedZoomTranslateY, zoomScale, zoomTranslateX, zoomTranslateY]
  );

  const panWhileZoomedGesture = useMemo(
    () =>
      Gesture.Pan()
        .enabled(isZoomed)
        .minPointers(1)
        .maxPointers(1)
        .onStart(() => {
          if (zoomScale.value <= 1) return;
          savedZoomTranslateX.value = zoomTranslateX.value;
          savedZoomTranslateY.value = zoomTranslateY.value;
        })
        .onUpdate((event) => {
          if (zoomScale.value <= 1) return;
          const nextX = savedZoomTranslateX.value + event.translationX * ZOOM_PAN_DAMPING;
          const nextY = savedZoomTranslateY.value + event.translationY * ZOOM_PAN_DAMPING;
          const maxTranslation = ZOOM_PAN_MAX_BASE * zoomScale.value;
          zoomTranslateX.value = Math.max(-maxTranslation, Math.min(maxTranslation, nextX));
          zoomTranslateY.value = Math.max(-maxTranslation, Math.min(maxTranslation, nextY));
        })
        .onEnd(() => {
          if (zoomScale.value <= 1) return;
          savedZoomTranslateX.value = zoomTranslateX.value;
          savedZoomTranslateY.value = zoomTranslateY.value;
        }),
    [isZoomed, savedZoomTranslateX, savedZoomTranslateY, zoomScale, zoomTranslateX, zoomTranslateY]
  );

  // Active page gesture: the tap gesture (see above) runs simultaneously with
  // pinch + pan-while-zoomed.
  const activePageGesture = useMemo(
    () => Gesture.Simultaneous(tapGesture, pinchGesture, panWhileZoomedGesture),
    [tapGesture, pinchGesture, panWhileZoomedGesture]
  );

  // Share the active item's URI: the OS share sheet on native; the Web Share API
  // on supporting browsers (the button is only rendered where it exists). A
  // video shares its own `shareUrl`; its poster is not what "share this" means.
  const handleShare = useCallback(async () => {
    const item = items[activeIndexRef.current];
    const uri = item === undefined ? undefined : shareUri(item);
    if (!uri) return;
    try {
      if (Platform.OS === 'web') {
        if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
          await navigator.share({ url: uri });
        }
        return;
      }
      await Share.share({ url: uri });
    } catch (err) {
      // A user-cancelled share sheet rejects (AbortError on web) — that's
      // expected, not a failure. Anything else is a real error worth surfacing.
      if (err instanceof Error && err.name === 'AbortError') return;
      if (typeof console !== 'undefined' && console.error) console.error('Media share failed:', err);
    }
  }, [items]);

  // Keyboard navigation (web only), scoped to the open lifetime like Dialog.web's
  // Escape handler. Reads the live index from the ref so it need not re-subscribe
  // on every page change. Escape flies back via `handleDismiss` (not a raw close).
  useEffect(() => {
    if (!isOpen || Platform.OS !== 'web' || typeof document === 'undefined') return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        handleDismiss();
      } else if (e.key === 'ArrowLeft') {
        e.stopPropagation();
        pageTo(activeIndexRef.current - 1);
      } else if (e.key === 'ArrowRight') {
        e.stopPropagation();
        pageTo(activeIndexRef.current + 1);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [handleDismiss, isOpen, pageTo]);

  const renderContent = () => (
    <OverlayRoot style={styles.modalContainer}>
      <GestureHandlerRootView style={StyleSheet.absoluteFill}>
        {/* Shared `Backdrop` (a Pressable) rather than a `Gesture.Tap()`: the
            viewer renders through the web Portal, whose root is
            `pointer-events: none`, and a gesture handler on a node that never
            receives pointer events simply never fires — tapping the backdrop
            did nothing on web while Escape still closed. `Backdrop` opts back
            in via the `pointerEvents` PROP, the only form that reaches the DOM
            (see `src/overlay`). */}
        {/* `progress` rather than an animated style: an opacity on the
            backdrop's root would sit ABOVE the blur layer and neutralise it —
            `backdrop-filter` samples nothing under an ancestor that composites
            in isolation. */}
        <Backdrop
          onPress={handleDismiss}
          accessibilityLabel="Close media viewer"
          progress={opacity}
        />

      <GestureDetector gesture={panGesture}>
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            styles.zoomContainer,
            { width: SCREEN_WIDTH, height: SCREEN_HEIGHT },
            webUserSelectNoneStyle,
          ]}
          pointerEvents="box-none"
        >
          {!pagerReady && activeItem !== undefined && (
            <Pressable onPress={handleDismiss} style={webPointerStyle}>
              {/* The animated transform rides the BOX, not the media, so the
                  image and video arms move identically — and so the box's
                  radius clips a video the same way it rounds an image. */}
              <Animated.View
                style={[
                  styles.mediaBox,
                  { width: activeFit.width, height: activeFit.height, borderRadius: radiusFor(activeFit) },
                  openImageStyle,
                ]}
              >
                <MediaSurface
                  content={activeItem}
                  contentFit="contain"
                  nativeControls={videoControls}
                  accessibilityLabel={activeItem.alt}
                  style={StyleSheet.absoluteFill}
                />
              </Animated.View>
            </Pressable>
          )}

          {pagerReady && (
            <Animated.View style={[StyleSheet.absoluteFill, pagerContainerStyle]}>
              <ScrollView
                ref={pagerRef}
                horizontal
                pagingEnabled
                // Frozen while zoomed so a horizontal drag pans the zoomed image
                // instead of paging away from it.
                scrollEnabled={!isZoomed}
                showsHorizontalScrollIndicator={false}
                contentOffset={{ x: activeIndexRef.current * SCREEN_WIDTH, y: 0 }}
                onMomentumScrollEnd={onPagerScroll}
                {...(Platform.OS === 'web' ? { onScroll: onPagerScroll } : {})}
                scrollEventThrottle={16}
                style={StyleSheet.absoluteFill}
              >
                {items.map((item, idx) => {
                  const uri = posterUri(item);
                  const ratio =
                    pageRatios[idx] ?? cachedRatio(item) ?? item.aspectRatio ?? DEFAULT_ASPECT_RATIO;
                  const fit = fitForRatio(ratio, uri);
                  // Only the active page is zoomable + gesture-wrapped (double-tap
                  // / single-tap dismiss / pinch / pan). It is also the ONLY page
                  // that mounts a real media surface: an off-screen page renders
                  // the still, because a second `VideoView` on the same player is
                  // exactly the duplicate surface this package exists to avoid.
                  // The active media handles its own tap-to-dismiss through the
                  // gesture, so it isn't wrapped in a Pressable.
                  if (idx === activeIndex) {
                    return (
                      <Pressable
                        key={mediaKey(item, idx)}
                        // The page fills the screen ON TOP of the backdrop (the
                        // pager below it needs pointer events to swipe), so a
                        // press on the empty area around the media can never
                        // reach the backdrop — the page dismisses it itself.
                        // Same outcome as tapping the media, which already
                        // dismisses through `singleTapDismissGesture`.
                        onPress={handleDismiss}
                        accessibilityLabel="Close media viewer"
                        style={[styles.page, { width: SCREEN_WIDTH, height: SCREEN_HEIGHT }, webPointerStyle]}
                      >
                        <GestureDetector gesture={activePageGesture}>
                          <Animated.View
                            style={[
                              styles.mediaBox,
                              { width: fit.width, height: fit.height, borderRadius: radiusFor(fit) },
                              zoomImageStyle,
                            ]}
                          >
                            <MediaSurface
                              content={item}
                              contentFit="contain"
                              nativeControls={videoControls}
                              accessibilityLabel={item.alt}
                              style={StyleSheet.absoluteFill}
                            />
                          </Animated.View>
                        </GestureDetector>
                      </Pressable>
                    );
                  }
                  return (
                    <Pressable
                      key={mediaKey(item, idx)}
                      onPress={handleDismiss}
                      accessibilityLabel="Close media viewer"
                      style={[styles.page, { width: SCREEN_WIDTH, height: SCREEN_HEIGHT }]}
                    >
                      <MediaPoster
                        content={item}
                        contentFit="contain"
                        accessibilityLabel={item.alt}
                        style={{ width: fit.width, height: fit.height, borderRadius: radiusFor(fit) }}
                      />
                    </Pressable>
                  );
                })}
              </ScrollView>
            </Animated.View>
          )}

          {pagerReady && items.length > 1 && (
            <Animated.View style={[styles.indicatorWrap, backdropStyle]} pointerEvents="box-none">
              <View style={styles.counterPill} pointerEvents="none">
                <Text style={styles.counterText}>{`${activeIndex + 1} / ${items.length}`}</Text>
              </View>
              {indicatorVariant === 'thumbnails' ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.thumbStripScroll}
                  contentContainerStyle={styles.thumbStripContent}
                >
                  {items.map((item, idx) => (
                    <Pressable
                      key={`thumb-${mediaKey(item, idx)}`}
                      onPress={() => pageTo(idx)}
                      accessibilityRole="button"
                      accessibilityLabel={`Go to item ${idx + 1} of ${items.length}`}
                      style={[
                        styles.thumbTile,
                        idx === activeIndex ? styles.thumbTileActive : styles.thumbTileInactive,
                        webPointerStyle,
                      ]}
                    >
                      {/* A STILL, never a surface: one decoder per strip tile is
                          what mounting the real media here would cost, and for a
                          video it would be a second view on the live player. */}
                      <MediaPoster content={item} contentFit="cover" style={styles.thumbTileImage} />
                    </Pressable>
                  ))}
                </ScrollView>
              ) : (
                <View style={styles.dotsRow} pointerEvents="none">
                  {items.map((item, idx) => (
                    <View
                      key={`dot-${mediaKey(item, idx)}`}
                      style={[styles.dot, idx === activeIndex ? styles.dotActive : styles.dotInactive]}
                    />
                  ))}
                </View>
              )}
            </Animated.View>
          )}

          {Platform.OS === 'web' && pagerReady && items.length > 1 && activeIndex > 0 && (
            <NavArrow direction="left" onPress={() => pageTo(activeIndex - 1)} />
          )}

          {Platform.OS === 'web' && pagerReady && items.length > 1 && activeIndex < items.length - 1 && (
            <NavArrow direction="right" onPress={() => pageTo(activeIndex + 1)} />
          )}

          {canShare && pagerReady && (
            <Pressable
              onPress={handleShare}
              accessibilityRole="button"
              accessibilityLabel="Share media"
              hitSlop={8}
              style={[styles.shareButton, webPointerStyle]}
            >
              <ArrowOutOfBox_Stroke2_Corner0_Rounded fill="#fff" size="md" />
            </Pressable>
          )}

          {activeAlt ? (
            <Animated.View
              style={[
                styles.altCaptionWrap,
                items.length > 1 && styles.altCaptionWrapWithIndicator,
                backdropStyle,
              ]}
              pointerEvents="none"
            >
              <View style={styles.altCaptionPill}>
                <Text style={styles.altCaptionText} numberOfLines={4}>{activeAlt}</Text>
              </View>
            </Animated.View>
          ) : null}
        </Animated.View>
        </GestureDetector>
      </GestureHandlerRootView>
    </OverlayRoot>
  );

  if (!isOpen) return null;

  // Both platforms render through the Bloom `Portal` so the viewer overlays the
  // whole app from the root `Outlet`. RN's `Modal` is intentionally NOT used on
  // native: on the New Architecture (Fabric) Android its host views mount
  // full-screen in the tree but never composite to the screen, leaving the
  // entire viewer (blur backdrop + zoomed image) invisible — tapping appeared to
  // "do nothing". The Portal path is the same one the working web build uses.
  return <Portal>{renderContent()}</Portal>;
});

ZoomableMediaGalleryInner.displayName = 'ZoomableMediaGallery';

export const ZoomableMediaGallery = ZoomableMediaGalleryInner;

const styles = StyleSheet.create({
  modalContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      web: {
        // Full-screen fixed overlay (web), like Bloom's Portal and Dialog.web.
        // Only ever applied on web (this is the `web` arm of Platform.select),
        // so `WEB_POSITION_FIXED` is honest here. The depth is NOT set here:
        // `OverlayRoot` above assigns it from the open-order overlay stack, so
        // a viewer opened over another surface paints above it and one opened
        // under a later surface goes behind (see `src/overlay/stack.ts`).
        position: WEB_POSITION_FIXED,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      },
      default: {
        // Mounted through the Bloom Portal `Outlet` (which renders its content
        // inline at the app root on native, NOT wrapped in a full-screen view),
        // so the gallery root must absolutely fill the screen itself to overlay
        // the app. RN's `Modal` is not used on native: on the New Architecture
        // (Fabric) Android its host views mount full-screen but never paint
        // (the entire viewer — backdrop + image — stays invisible).
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'transparent',
      },
    }),
  },
  zoomContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  page: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  // The box the media is painted into. `overflow: hidden` is what makes the
  // box's corner radius clip a VIDEO — an image would round on its own, a
  // platform video surface will not.
  mediaBox: {
    overflow: 'hidden',
  },
  indicatorWrap: {
    position: 'absolute',
    bottom: 48,
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: 10,
  },
  counterPill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  counterText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: borderRadius.full,
  },
  dotActive: {
    backgroundColor: '#fff',
  },
  dotInactive: {
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  thumbStripScroll: {
    maxWidth: '100%',
    flexGrow: 0,
  },
  // Centers the tiles when they don't fill the width, scrolls when they overflow.
  thumbStripContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
  },
  thumbTile: {
    width: THUMBNAIL_STRIP_TILE_SIZE,
    height: THUMBNAIL_STRIP_TILE_SIZE,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 2,
  },
  thumbTileActive: {
    borderColor: '#fff',
  },
  thumbTileInactive: {
    borderColor: 'rgba(255,255,255,0.25)',
  },
  thumbTileImage: {
    width: '100%',
    height: '100%',
  },
  navArrow: {
    position: 'absolute',
    top: '50%',
    width: 44,
    height: 44,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
    transform: [{ translateY: -22 }],
  },
  navArrowLeft: {
    left: 16,
  },
  navArrowRight: {
    right: 16,
  },
  // Hover styles fully replace the base `transform`, so they repeat `translateY`.
  navArrowHoverLeft: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    transform: [{ translateY: -22 }, { scale: 1.08 }],
  },
  navArrowHoverRight: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    transform: [{ translateY: -22 }, { scale: 1.08 }],
  },
  shareButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  altCaptionWrap: {
    position: 'absolute',
    bottom: 48,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  // Lifted above the page counter + dots when the multi-image indicator shows.
  altCaptionWrapWithIndicator: {
    bottom: 110,
  },
  altCaptionPill: {
    maxWidth: 600,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  altCaptionText: {
    color: '#fff',
    fontSize: 13,
    lineHeight: 18,
  },
});

export default ZoomableMediaGallery;
