import { ScrollArea } from '../layout/ScrollArea';
import { BloomThemeContext } from '../theme/BloomThemeProvider';
import { useMessages } from '../locale/messages';
import { ZOOMABLE_MEDIA_GALLERY_MESSAGES } from './messages';
import React, {
  type ComponentRef,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  ScrollView,
  Share,
  useWindowDimensions,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useDerivedValue,
  withSpring,
  withTiming,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { GestureHandlerRootView, Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { borderRadius } from '../styles/tokens';
import { Backdrop, OverlayRoot } from '../overlay';
import { Portal } from '../portal';
import type { ButtonProps } from '../button/types';
import type { MemoRefComponent, ViewRef } from '../styles/native-refs';
// Per glyph, not through `../icons` — see DialogHeader for why a shipped
// component must never reach the barrel.
import { RiArrowLeftLine } from '../icons/remix/RiArrowLeftLine';
import { RiArrowRightLine } from '../icons/remix/RiArrowRightLine';
import { RiUpload2Line } from '../icons/remix/RiUpload2Line';
import { WEB_POSITION_FIXED, type WebCssStyle } from '../styles/web-view-style';
import { MediaPoster, MediaSurface } from '../media-flight/MediaSurface';
import {
  getAspectRatio,
  getIntrinsicSize,
  DEFAULT_ASPECT_RATIO,
} from '../image-aspect-ratio-cache';
import { fetchAspectRatioForOwner } from '../image-aspect-ratio-cache/aspect-ratio-cache';
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
import { useCssSafeAreaInsets } from '../hooks/use-css-safe-area-insets';

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

/** The pager and the transition surface must fit the same item identically. */
function itemRatio(item: GalleryMedia, resolved: number | undefined): number {
  return resolved ?? cachedRatio(item) ?? item.aspectRatio ?? DEFAULT_ASPECT_RATIO;
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
  const uri =
    item.kind === 'video' ? item.shareUrl : item.shareUrl === undefined ? item.uri : item.shareUrl;
  return typeof uri === 'string' && uri.trim().length > 0 ? uri : undefined;
}

// Web-only interaction hints (no-ops on native): the zoom surfaces are
// tap-to-dismiss (`cursor: pointer`) and must not select text or drag the
// image. `Platform.select` keeps them off native. `cursor` is a real
// `ViewStyle` key on RN 0.83; `userSelect` is declared on `TextStyle` only,
// which is what `WebCssStyle` covers.
/** Share button inset from the top-right corner of the safe area. */
const CHROME_EDGE = 16;
/** Page indicator (and a lone caption) above the bottom of the safe area. */
const INDICATOR_BOTTOM = 48;
/** A caption lifted above the page counter + dots when the indicator shows. */
const CAPTION_BOTTOM_WITH_INDICATOR = 110;

const WEB_POINTER: WebCssStyle = { userSelect: 'none', cursor: 'pointer' };
const WEB_USER_SELECT_NONE: WebCssStyle = { userSelect: 'none' };

const webPointerStyle = Platform.select({ web: WEB_POINTER, default: undefined });
const webUserSelectNoneStyle = Platform.select({
  web: WEB_USER_SELECT_NONE,
  default: undefined,
});

/**
 * Whether the overlay's backdrop can blur. It renders through the portal in the
 * app's own window, and on Android a blur there is not drawn (and a blur target
 * there crashes; `blur/blur-target.tsx`), so the backdrop was expo-blur's
 * fallback tint plus the 0.28 dim: the conversation stayed readable behind the
 * photo (Allo, Pixel 8a). Without a blur the viewer dims to nearly opaque, as a
 * photo viewer does.
 */
function overlayCanBlur(): boolean {
  return Platform.OS !== 'android';
}
const UNBLURRED_DIM_OPACITY = 0.92;

/**
 * The overlay's chrome: the counter pill's scrim and white, whatever the theme.
 *
 * The backdrop under it is a dark dim in every theme, so a theme-coloured
 * control is wrong half the time: the share button was the light `surface`
 * material with a hard-coded white glyph, a blank disc in a light theme (Allo,
 * Android). The page appearance passes its own palette instead.
 */
const SCRIM_CHROME = { background: 'rgba(0,0,0,0.55)', foreground: '#fff' } as const;

/**
 * Calls `onCommit` from the commit that mounts it. Placed INSIDE the portaled
 * overlay, so it runs once the overlay itself is in the tree — the viewer's
 * own effects run a commit earlier, before the portal outlet has rendered the
 * content, and a flight started there would be under way before its first
 * frame was on screen.
 */
function OnCommit({ onCommit }: { onCommit: () => void }) {
  useLayoutEffect(() => {
    onCommit();
  }, [onCommit]);
  return null;
}

export function createZoomableMediaGallery(Button: MemoRefComponent<ButtonProps>) {
  function NavArrow({
    direction,
    onPress,
    label,
    pageColors,
    buttonRef,
  }: {
    direction: 'left' | 'right';
    onPress: () => void;
    label: string;
    pageColors?: { background: string; foreground: string };
    buttonRef?: React.Ref<ViewRef>;
  }) {
    const isLeft = direction === 'left';
    const chrome = pageColors ?? SCRIM_CHROME;
    return (
      <Button
        ref={buttonRef}
        onPress={onPress}
        appearance="outline"
        tone="neutral"
        size="lg"
        iconOnly
        hitSlop={8}
        accessibilityLabel={label}
        material="flat"
        colors={chrome}
        icon={
          isLeft ? (
            <RiArrowLeftLine fill={chrome.foreground} size="lg" />
          ) : (
            <RiArrowRightLine fill={chrome.foreground} size="lg" />
          )
        }
        style={[styles.navArrow, isLeft ? styles.navArrowLeft : styles.navArrowRight]}
      />
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
   * - The OPENING (tapped) item flies from its measured rect to a centered,
   *   aspect-ratio-preserving fit within {@link FIT_FRACTION} of the screen, and
   *   every dismissal flies it back. The horizontal paging `ScrollView` is
   *   mounted from the first frame, seeded at the tapped index, and the flight
   *   transforms it: the media on screen is ONE surface, the active page's, from
   *   the first frame of the open to the last frame of the close. One shared
   *   value (`flight`) drives the transform and the backdrop, on the UI thread;
   *   `hiddenThumbIndex` lets the consumer hide the thumbnail it stands in for.
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
   * (`MediaPoster`). The active page's view lives from the first frame of the
   * open to the last frame of the close, so the transition swaps nothing.
   *
   * `expo-video` is an OPTIONAL peer loaded through `media-flight/expo-video-module`.
   * Without it a video page degrades to its poster, once, with a dev warning.
   */
  const ZoomableMediaGalleryInner = React.forwardRef<
    ZoomableMediaGalleryHandle,
    ZoomableMediaGalleryProps
  >(
    (
      {
        appearance = 'overlay',
        onIndexChange,
        onOpenChange,
        renderVideoOverlay,
        measureThumb,
        cornerRadius = DEFAULT_CORNER_RADIUS,
        indicatorVariant = 'dots',
        videoControls = false,
        labels: labelsProp,
        hiddenThumbIndex,
      },
      ref,
    ) => {
      const { messages } = useMessages(ZOOMABLE_MEDIA_GALLERY_MESSAGES);
      const themeContext = React.useContext(BloomThemeContext);
      if (appearance === 'page' && !themeContext) {
        throw new Error('ZoomableMediaGallery appearance="page" requires a <BloomThemeProvider>');
      }
      // The default overlay can mount closed without a theme provider. Only the
      // opt-in page reads its palette; the default pager's controls keep their own
      // existing provider requirements.
      const pagePalette = appearance === 'page' ? themeContext?.theme.colors : undefined;
      const page = pagePalette != null;
      const pageColors = pagePalette
        ? { background: pagePalette.backgroundSecondary, foreground: pagePalette.text }
        : undefined;
      const onIndexChangeRef = useRef(onIndexChange);
      onIndexChangeRef.current = onIndexChange;
      const onOpenChangeRef = useRef(onOpenChange);
      onOpenChangeRef.current = onOpenChange;
      const openRef = useRef(false);
      // A queued callback from an earlier opening must never share its media
      // after this instance has closed and opened for another caller.
      const openingGenerationRef = useRef(0);
      const reportOpen = useCallback((next: boolean) => {
        if (openRef.current === next) return;
        openRef.current = next;
        onOpenChangeRef.current?.(next);
      }, []);
      const labels = useMemo(() => ({ ...messages, ...labelsProp }), [messages, labelsProp]);
      const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = useWindowDimensions();
      // The viewer is full-bleed, so its chrome must clear the status bar, the
      // cutout and the home indicator itself — nothing above it applies them.
      const insets = useCssSafeAreaInsets(useSafeAreaInsets());

      const radiusFor = useCallback(
        (fit: FittedSize) => resolveCornerRadius(cornerRadius, fit),
        [cornerRadius],
      );

      const [isOpen, setIsOpen] = useState(false);
      // True once the open flight has landed, until a dismissal starts: the
      // chrome (share, counter, arrows) shows and the pager may page.
      const [settled, setSettled] = useState(false);
      const [items, setItems] = useState<GalleryMedia[]>([]);
      // The accepted opening's item identities are needed by async probes even
      // before React commits the corresponding state update.
      const openedItemsRef = useRef<GalleryMedia[]>([]);
      const [activeIndex, setActiveIndex] = useState(0);
      // Whether the active media is currently pinched/double-tapped past its base
      // size. Drives the pan-while-zoomed gesture, disables the pager's horizontal
      // paging + the dismiss drag so a pan moves the zoomed media instead.
      const [isZoomed, setIsZoomed] = useState(false);
      // Ratios belong to one accepted opening. Keeping its generation in the
      // state lets a queued React update reject an older opening without reading
      // mutable refs inside a state updater.
      const [ratios, setRatios] = useState<{
        generation: number;
        pages: Record<number, number>;
      }>({ generation: 0, pages: {} });

      // Native `Share` is always available; web exposes a share button only when the
      // browser implements `navigator.share`. Computed once (capability is static).
      const [canShare] = useState(() => {
        if (Platform.OS !== 'web') return true;
        return typeof navigator !== 'undefined' && typeof navigator.share === 'function';
      });

      // The transition is ONE value: 0 is the media standing on its thumbnail,
      // 1 is the media fitted on screen. Open springs it to 1, every dismissal
      // springs it back to 0, and both ends of the media's transform and the
      // backdrop's fade are read from it — so a close started mid-open, or from
      // wherever a drag left the media, lands on the thumbnail by construction,
      // and its one completion callback is the frame the viewer has returned.
      const flight = useSharedValue(0);
      // The finger's offset while dragging to dismiss, applied at the fitted
      // end of the flight. Rest is (0, 0, 1).
      const dragX = useSharedValue(0);
      const dragY = useSharedValue(0);
      const dragScale = useSharedValue(1);
      // The media itself is opaque: only the backdrop and chrome fade. It fades
      // only where there is no thumbnail to fly to (or from), and drops to 0 on
      // the frame the fly-back lands, when the thumbnail takes its place.
      const mediaOpacity = useSharedValue(1);

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

      // Per-drag baseline captured at pan start (transient).
      const startX = useSharedValue(0);
      const startY = useSharedValue(0);
      const startScale = useSharedValue(1);
      // Scale of the fitted media at its thumbnail (thumbWidth / fittedWidth):
      // the flight's 0 end.
      const originScale = useSharedValue(1);

      const pagerRef = useRef<ComponentRef<typeof ScrollView>>(null);
      const shareButtonRef = useRef<ViewRef>(null);
      const previousButtonRef = useRef<ViewRef>(null);
      const nextButtonRef = useRef<ViewRef>(null);
      const pendingShareFocus = useRef<{ index: number; opening: number; element: Element } | null>(
        null,
      );
      // Mirror of `activeIndex` readable synchronously from callbacks/worklets
      // (`handleDismiss` runs via `runOnJS` and from `Pressable.onPress`, where the
      // state closure can be stale). Kept in lockstep by `setActiveIndexBoth`.
      const activeIndexRef = useRef(0);
      // True from the first dismiss request until the viewer is actually unmounted.
      const dismissingRef = useRef(false);

      // Nothing in the transition is a timer: the open starts from the commit
      // that mounts the overlay and ends in its spring's callback, and the close
      // ends in its own. An unmount only has to stop that callback from writing
      // (`unmountedRef`) and give the thumbnail back.
      const unmountedRef = useRef(false);
      const hiddenThumbRef = useRef(hiddenThumbIndex);
      hiddenThumbRef.current = hiddenThumbIndex;
      useEffect(() => {
        unmountedRef.current = false;
        return () => {
          unmountedRef.current = true;
          reportOpen(false);
          if (hiddenThumbRef.current) hiddenThumbRef.current.value = -1;
        };
      }, [reportOpen]);

      // Single writer for the current index: updates state (drives indicator + open
      // image) and the synchronous mirror together, and only when it changes.
      // The thumbnail the media stands in for follows the page, so a swipe
      // gives back the one it left and hides the one it reached.
      const setActiveIndexBoth = useCallback(
        (next: number, opening = false) => {
          const changed = activeIndexRef.current !== next;
          activeIndexRef.current = next;
          setActiveIndex((prev) => (prev === next ? prev : next));
          if (changed && hiddenThumbIndex && !opening && !dismissingRef.current) {
            hiddenThumbIndex.value = next;
          }
          if (changed || opening) onIndexChangeRef.current?.(next);
        },
        [hiddenThumbIndex],
      );

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
      }, [
        baseZoomScale,
        savedZoomTranslateX,
        savedZoomTranslateY,
        zoomScale,
        zoomTranslateX,
        zoomTranslateY,
      ]);

      // Box the fitted image must fit inside.
      const fitBox = useMemo<FittedSize>(
        () => ({ width: SCREEN_WIDTH * FIT_FRACTION, height: SCREEN_HEIGHT * FIT_FRACTION }),
        [SCREEN_WIDTH, SCREEN_HEIGHT],
      );

      // Largest width/height for `ratio` that fits inside `fitBox` without cropping
      // (contain), never exceeding the media's own resolution: filling the viewport
      // with a 512px avatar or a small thumbnail just renders it soft. `uri` is what
      // lets us look the intrinsic size up; without it (not measured yet) the fit
      // box wins and the clamp applies on the next frame.
      const fitForRatio = useCallback(
        (ratio: number, uri?: string): FittedSize => {
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
        },
        [fitBox],
      );

      // Fitted size of the media for the CURRENT page. On open this is
      // the opened item's fit;
      // after swiping it tracks the viewed item so the collapse-on-dismiss renders
      // and flies back the media actually on screen.
      const activeItem = items[activeIndex];
      const activeRatio = activeItem
        ? itemRatio(activeItem, ratios.pages[activeIndex])
        : DEFAULT_ASPECT_RATIO;
      const activeUri = activeItem === undefined ? undefined : posterUri(activeItem);
      const activeFit = useMemo(
        () => fitForRatio(activeRatio, activeUri),
        [fitForRatio, activeRatio, activeUri],
      );

      // Alt text (accessibility description) of the item currently on screen, shown
      // as a caption at the bottom of the viewer (Bluesky-style lightbox footer).
      const activeAlt = activeItem?.alt?.trim() || undefined;
      const videoOverlay =
        isOpen && activeItem?.kind === 'video' ? renderVideoOverlay?.(activeItem) : null;

      // Probe and cache the ratio of the page at `index`. A video with no poster has
      // nothing to probe — it keeps whatever ratio the consumer declared, or the
      // gallery default — so this is a no-op rather than a guess.
      const isCurrentRatioProbe = useCallback(
        (generation: number, index: number, item: GalleryMedia, uri: string) =>
          !unmountedRef.current &&
          !dismissingRef.current &&
          openRef.current &&
          openingGenerationRef.current === generation &&
          openedItemsRef.current[index] === item &&
          posterUri(item) === uri,
        [],
      );
      const ensureRatio = useCallback(
        (index: number, item: GalleryMedia) => {
          const uri = posterUri(item);
          if (uri === undefined) return;
          const generation = openingGenerationRef.current;
          if (!isCurrentRatioProbe(generation, index, item, uri)) return;
          const cached = getAspectRatio(uri);
          if (cached !== undefined) {
            setRatios((prev) =>
              prev.generation !== generation || prev.pages[index] === cached
                ? prev
                : { ...prev, pages: { ...prev.pages, [index]: cached } },
            );
            return;
          }
          void fetchAspectRatioForOwner(uri, () =>
            isCurrentRatioProbe(generation, index, item, uri),
          ).then((ratio) => {
            if (!isCurrentRatioProbe(generation, index, item, uri)) return;
            const currentRatio = getAspectRatio(uri) ?? ratio;
            setRatios((prev) =>
              prev.generation !== generation || prev.pages[index] === currentRatio
                ? prev
                : { ...prev, pages: { ...prev.pages, [index]: currentRatio } },
            );
          });
        },
        [isCurrentRatioProbe],
      );

      // The viewer has returned: unmount and put every value back at rest.
      const finalizeDismiss = useCallback(() => {
        if (unmountedRef.current) return;
        setIsOpen(false);
        // Keep the dismissal latch until the next open. Throttled web scroll
        // events can arrive after the pager unmounts and must not reset selection.
        flight.value = 0;
        dragX.value = 0;
        dragY.value = 0;
        dragScale.value = 1;
        resetZoom();
        reportOpen(false);
      }, [dragScale, dragX, dragY, flight, reportOpen, resetZoom]);

      // Fly the media home: back to `target` (the current item's thumbnail,
      // relative to the screen center), or, with no thumbnail to land on, into
      // the center while it fades. Both end on the same callback — the frame
      // the flight reaches 0 hides the media and gives the thumbnail back
      // together, on the UI thread, so the photo is on screen exactly once.
      const flyHome = useCallback(
        (target: { x: number; y: number; scale: number } | null) => {
          if (unmountedRef.current) return;
          const web = Platform.OS === 'web';
          if (target) {
            originX.value = target.x;
            originY.value = target.y;
            originScale.value = target.scale;
          } else {
            originX.value = 0;
            originY.value = 0;
            originScale.value = MIN_DRAG_SCALE;
            mediaOpacity.value = withTiming(0, {
              duration: web ? CLOSE_DURATION_WEB : OPACITY_DURATION,
            });
          }
          const thumb = hiddenThumbIndex;
          const landed = (finished?: boolean) => {
            'worklet';
            if (!finished) return;
            mediaOpacity.value = 0;
            if (thumb) thumb.value = -1;
            runOnJS(finalizeDismiss)();
          };
          flight.value = web
            ? withTiming(
                0,
                { duration: CLOSE_DURATION_WEB, easing: Easing.in(Easing.cubic) },
                landed,
              )
            : withSpring(0, CLOSE_SPRING, landed);
        },
        [finalizeDismiss, flight, hiddenThumbIndex, mediaOpacity, originScale, originX, originY],
      );

      const handleDismiss = useCallback(() => {
        // A press on the image reaches BOTH its tap gesture and the page beneath it
        // (which owns the dismiss for the empty area around the image), so this can
        // fire twice for one click. Latch it: a second call would start a second
        // fly-back from an already-moving image.
        if (dismissingRef.current) return;
        dismissingRef.current = true;
        pendingShareFocus.current = null;
        setSettled(false);
        // A zoomed page unzooms on the way home, in step with the flight.
        zoomScale.value = withSpring(1, CLOSE_SPRING);
        zoomTranslateX.value = withSpring(0, CLOSE_SPRING);
        zoomTranslateY.value = withSpring(0, CLOSE_SPRING);

        const index = activeIndexRef.current;
        const current = items[index];
        // The target is the CURRENT item's thumbnail, measured now: the page may
        // have changed, and the list under the viewer may have scrolled.
        if (!measureThumb || !current) {
          flyHome(null);
          return;
        }
        const centerX = SCREEN_WIDTH / 2;
        const centerY = SCREEN_HEIGHT / 2;
        void measureThumb(index).then((rect) => {
          flyHome(
            rect && rect.width > 0 && activeFit.width > 0
              ? {
                  x: rect.x + rect.width / 2 - centerX,
                  y: rect.y + rect.height / 2 - centerY,
                  scale: rect.width / activeFit.width,
                }
              : null,
          );
        });
      }, [
        activeFit,
        flyHome,
        items,
        measureThumb,
        SCREEN_HEIGHT,
        SCREEN_WIDTH,
        zoomScale,
        zoomTranslateX,
        zoomTranslateY,
      ]);

      // The open flight: from the thumbnail to the fitted center. The thumbnail
      // is hidden in the same write, so the photo is on screen exactly once. It
      // starts when the opened media shows a picture (`onPicture`) if it has a
      // preview — the thumbnail's own, already decoded URL — and otherwise as
      // soon as the overlay is committed. Started any earlier, the thumbnail
      // was hidden and the media had flown a frame or two before its first
      // pixel was drawn: a hole where the avatar was, then a photo already on
      // its way.
      const flightPendingRef = useRef(false);
      const startOpenFlight = useCallback(() => {
        if (!flightPendingRef.current) return;
        flightPendingRef.current = false;
        const generation = openingGenerationRef.current;
        const settle = () => {
          if (
            unmountedRef.current ||
            dismissingRef.current ||
            openingGenerationRef.current !== generation
          )
            return;
          setSettled(true);
        };
        const landed = (finished?: boolean) => {
          'worklet';
          if (finished) runOnJS(settle)();
        };
        if (hiddenThumbIndex) hiddenThumbIndex.value = activeIndexRef.current;
        if (mediaOpacity.value < 1) {
          mediaOpacity.value = withTiming(1, {
            duration: Platform.OS === 'web' ? OPEN_DURATION_WEB : OPACITY_DURATION,
          });
        }
        flight.value =
          Platform.OS === 'web'
            ? withTiming(
                1,
                { duration: OPEN_DURATION_WEB, easing: Easing.out(Easing.cubic) },
                landed,
              )
            : withSpring(1, OPEN_SPRING, landed);
      }, [flight, hiddenThumbIndex, mediaOpacity]);

      // The overlay is committed (see `OnCommit`). Seat the pager on the opened
      // page now that it exists: `contentOffset` alone is not honoured on web
      // for a pager mounted with the overlay (it stayed on page 0 while the
      // counter said 2 / 2), and the viewer's own layout effects run before the
      // portal has rendered the pager.
      const onOverlayCommit = useCallback(() => {
        pagerRef.current?.scrollTo({
          x: activeIndexRef.current * SCREEN_WIDTH,
          y: 0,
          animated: false,
        });
        const opened = openedItemsRef.current[activeIndexRef.current];
        const waitsForPicture =
          opened !== undefined &&
          opened.kind !== 'video' &&
          opened.previewUri !== undefined &&
          opened.previewUri !== opened.uri;
        if (!waitsForPicture) startOpenFlight();
      }, [startOpenFlight, SCREEN_WIDTH]);

      const open = useCallback(
        (nextItems: GalleryMedia[], index: number, rect?: MeasuredRect) => {
          if (openRef.current || unmountedRef.current || nextItems.length === 0) return;
          dismissingRef.current = false;
          const safeIndex = Math.min(Math.max(index, 0), nextItems.length - 1);
          const target = nextItems[safeIndex];
          if (!target) return;
          openingGenerationRef.current += 1;
          pendingShareFocus.current = null;
          openedItemsRef.current = nextItems;
          const generation = openingGenerationRef.current;
          const targetUri = posterUri(target);
          const knownRatio = target.aspectRatio ?? cachedRatio(target);
          const ratio = knownRatio ?? DEFAULT_ASPECT_RATIO;

          setItems(nextItems);
          setActiveIndexBoth(safeIndex, true);
          // Seed every page whose ratio is already known (consumer-provided metadata
          // or a previously-cached probe) so swiping never hits the same snap — only
          // a genuinely-unknown item falls through to `ensureRatio`'s async probe.
          const initialRatios: Record<number, number> = {};
          nextItems.forEach((item, i) => {
            const r = item.aspectRatio ?? cachedRatio(item);
            if (r !== undefined) initialRatios[i] = r;
          });
          setRatios((prev) =>
            prev.generation > generation ? prev : { generation, pages: initialRatios },
          );

          // Resolve the opening ratio if it was not yet known, then re-fit. A video
          // with no poster has nothing to probe and keeps the default.
          if (knownRatio === undefined && targetUri !== undefined) {
            void fetchAspectRatioForOwner(targetUri, () =>
              isCurrentRatioProbe(generation, safeIndex, target, targetUri),
            ).then((resolved) => {
              if (!isCurrentRatioProbe(generation, safeIndex, target, targetUri)) return;
              const currentRatio = getAspectRatio(targetUri) ?? resolved;
              setRatios((prev) =>
                prev.generation === generation
                  ? { ...prev, pages: { ...prev.pages, [safeIndex]: currentRatio } }
                  : prev,
              );
            });
          }

          // The media is laid out at its FINAL fitted size and the flight scales it
          // down onto the thumbnail: its 0 end is the thumbnail's center (as an
          // offset from the screen's) and width over the fitted width.
          const fitted = fitForRatio(ratio, targetUri);
          const centerX = SCREEN_WIDTH / 2;
          const centerY = SCREEN_HEIGHT / 2;
          if (rect && rect.width > 0) {
            originX.value = rect.x + rect.width / 2 - centerX;
            originY.value = rect.y + rect.height / 2 - centerY;
            originScale.value = rect.width / fitted.width;
            mediaOpacity.value = 1;
          } else {
            // Nothing to grow out of: the media appears in place and fades in.
            originX.value = 0;
            originY.value = 0;
            originScale.value = 1;
            mediaOpacity.value = 0;
          }
          flight.value = 0;
          dragX.value = 0;
          dragY.value = 0;
          dragScale.value = 1;
          flightPendingRef.current = true;

          setSettled(false);
          setIsOpen(true);
          reportOpen(true);
        },
        [
          SCREEN_WIDTH,
          SCREEN_HEIGHT,
          dragScale,
          dragX,
          dragY,
          fitForRatio,
          flight,
          isCurrentRatioProbe,
          mediaOpacity,
          originScale,
          originX,
          originY,
          reportOpen,
          setActiveIndexBoth,
        ],
      );

      // Closing from outside is the same dismissal a press on the backdrop starts.
      const close = useCallback(() => {
        if (openRef.current) handleDismiss();
      }, [handleDismiss]);

      React.useImperativeHandle(ref, () => ({ open, close }), [open, close]);

      // Drag to dismiss: the media follows the finger on the UI thread, shrinking
      // and dimming the backdrop with distance. Short of the threshold it springs
      // back carrying the finger's speed; past it, the same flight home as any
      // other dismissal, starting from wherever the finger left it.
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
              startX.value = dragX.value;
              startY.value = dragY.value;
              startScale.value = dragScale.value;
            })
            .onUpdate((event) => {
              dragX.value = startX.value + event.translationX;
              dragY.value = startY.value + event.translationY;
              const dragDistance = Math.sqrt(event.translationX ** 2 + event.translationY ** 2);
              const scaleReduction = Math.max(
                MIN_DRAG_SCALE,
                1 - dragDistance / (SCREEN_HEIGHT * SCALE_DRAG_FRACTION),
              );
              dragScale.value = startScale.value * scaleReduction;
            })
            .onEnd((event) => {
              const dragDistance = Math.sqrt(event.translationX ** 2 + event.translationY ** 2);
              if (dragDistance > SCREEN_HEIGHT * DISMISS_FRACTION) {
                runOnJS(handleDismiss)();
              } else {
                dragScale.value = withSpring(1, SNAP_BACK_SPRING);
                dragX.value = withSpring(0, { ...SNAP_BACK_SPRING, velocity: event.velocityX });
                dragY.value = withSpring(0, { ...SNAP_BACK_SPRING, velocity: event.velocityY });
              }
            }),
        [
          dragScale,
          dragX,
          dragY,
          handleDismiss,
          isOpen,
          isZoomed,
          SCREEN_HEIGHT,
          startScale,
          startX,
          startY,
        ],
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
      //
      // The backdrop (and the chrome over it) is the flight, dimmed by how far
      // the media has been dragged.
      const backdropProgress = useDerivedValue(() => {
        const dragDistance = Math.sqrt(dragX.value ** 2 + dragY.value ** 2);
        const dragDim = Math.max(0, 1 - dragDistance / (SCREEN_HEIGHT * MAX_DRAG_FRACTION));
        return flight.value * dragDim;
      }, [dragX, dragY, flight, SCREEN_HEIGHT]);
      const backdropStyle = useAnimatedStyle(
        () => ({ opacity: backdropProgress.value }),
        [backdropProgress],
      );

      // The pager — and so the active page's media, centered in it — rides the
      // flight: at 0 it stands on the thumbnail, at 1 it is where the finger
      // has it. ONE surface paints the media from the first frame of the open
      // to the last frame of the close; nothing is swapped, remounted or
      // re-decoded on the way, which is what used to flash.
      const mediaStyle = useAnimatedStyle(() => {
        const t = flight.value;
        return {
          opacity: mediaOpacity.value,
          transform: [
            { translateX: originX.value + (dragX.value - originX.value) * t },
            { translateY: originY.value + (dragY.value - originY.value) * t },
            { scale: originScale.value + (dragScale.value - originScale.value) * t },
          ],
        };
      }, [dragScale, dragX, dragY, flight, mediaOpacity, originScale, originX, originY]);

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
          if (dismissingRef.current || !settled) return;
          const lastIndex = items.length - 1;
          if (lastIndex < 0) return;
          const next = Math.min(Math.max(Math.round(offsetX / SCREEN_WIDTH), 0), lastIndex);
          if (next === activeIndexRef.current) return;
          // An intervening page change supersedes any uncommitted transfer.
          pendingShareFocus.current = null;
          const incoming = items[next];
          if (
            Platform.OS === 'web' &&
            typeof document !== 'undefined' &&
            incoming &&
            incoming.shareUrl !== undefined &&
            shareUri(incoming) === undefined &&
            document.activeElement === (shareButtonRef.current as unknown as Element)
          ) {
            pendingShareFocus.current = {
              index: next,
              opening: openingGenerationRef.current,
              element: document.activeElement,
            };
          }
          // Swiping to a new page always starts it un-zoomed (and clears the zoom on
          // the page scrolling away).
          resetZoom();
          setActiveIndexBoth(next);
          const item = items[next];
          if (item) ensureRatio(next, item);
        },
        [ensureRatio, items, resetZoom, setActiveIndexBoth, settled, SCREEN_WIDTH],
      );

      // Programmatically page to `index` (arrow buttons, keyboard, thumbnail taps).
      // Clamps into range and lets the existing scroll handlers own the index/ratio
      // state-sync — this only triggers the scroll. No-op until the pager is mounted.
      const pageTo = useCallback(
        (index: number) => {
          if (!settled) return;
          const lastIndex = items.length - 1;
          if (lastIndex < 0) return;
          const clamped = Math.min(Math.max(index, 0), lastIndex);
          resetZoom();
          pagerRef.current?.scrollTo({ x: clamped * SCREEN_WIDTH, y: 0, animated: true });
        },
        [items.length, resetZoom, settled, SCREEN_WIDTH],
      );

      const onPagerScroll = useCallback(
        (event: NativeSyntheticEvent<NativeScrollEvent>) => {
          updateIndexFromOffset(event.nativeEvent.contentOffset.x);
        },
        [updateIndexFromOffset],
      );

      // If paging disables the focused share control, move web focus to a
      // surviving navigation action. Native accessibility focus is untouched.
      useLayoutEffect(() => {
        const pending = pendingShareFocus.current;
        if (!pending) return;
        pendingShareFocus.current = null;
        if (
          pending.index !== activeIndex ||
          Platform.OS !== 'web' ||
          typeof document === 'undefined' ||
          dismissingRef.current ||
          pending.opening !== openingGenerationRef.current ||
          (document.activeElement !== pending.element && document.activeElement !== document.body)
        )
          return;
        const target = activeIndex > 0 ? previousButtonRef.current : nextButtonRef.current;
        (target as unknown as HTMLElement | null)?.focus();
      }, [activeIndex]);

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
        if (!isOpen) return;
        pagerRef.current?.scrollTo({
          x: activeIndexRef.current * SCREEN_WIDTH,
          y: 0,
          animated: false,
        });
      }, [isOpen, SCREEN_WIDTH]);

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
        [
          activeFit,
          baseZoomScale,
          resetZoom,
          savedZoomTranslateX,
          savedZoomTranslateY,
          zoomScale,
          zoomTranslateX,
          zoomTranslateY,
        ],
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
        [zoomToPoint],
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
        [handleDismiss, zoomScale],
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
        [doubleTapGesture, singleTapDismissGesture],
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
                Math.min(MAX_ZOOM_SCALE, baseZoomScale.value * (event.scale || 1)),
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
        [
          baseZoomScale,
          savedZoomTranslateX,
          savedZoomTranslateY,
          zoomScale,
          zoomTranslateX,
          zoomTranslateY,
        ],
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
        [
          isZoomed,
          savedZoomTranslateX,
          savedZoomTranslateY,
          zoomScale,
          zoomTranslateX,
          zoomTranslateY,
        ],
      );

      // Active page gesture: the tap gesture (see above) runs simultaneously with
      // pinch + pan-while-zoomed.
      const activePageGesture = useMemo(
        () => Gesture.Simultaneous(tapGesture, pinchGesture, panWhileZoomedGesture),
        [tapGesture, pinchGesture, panWhileZoomedGesture],
      );

      // Share the active item's URI: the OS share sheet on native; the Web Share API
      // on supporting browsers (the button is only rendered where it exists). A
      // video shares its own `shareUrl`; its poster is not what "share this" means.
      const openingGeneration = openingGenerationRef.current;
      const handleShare = useCallback(async () => {
        if (
          !openRef.current ||
          dismissingRef.current ||
          openingGeneration !== openingGenerationRef.current
        )
          return;
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
          if (typeof console !== 'undefined' && console.error)
            console.error('Media share failed:', err);
        }
      }, [items, openingGeneration]);

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
        // `onRequestClose`: Android back flies the media home like every other
        // dismiss. The viewer is a Portal, not an RN `Modal`, so without it nothing
        // consumed the press and back finished the whole app.
        <OverlayRoot style={styles.modalContainer} onRequestClose={handleDismiss} modal>
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
              accessibilityLabel={labels.close}
              progress={backdropProgress}
              blurIntensity={page || !overlayCanBlur() ? 0 : undefined}
              dimColor={pagePalette?.background}
              dimOpacity={page ? 1 : overlayCanBlur() ? undefined : UNBLURRED_DIM_OPACITY}
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
                {/* The transform rides the pager, so the active page's BOX moves —
                  image and video arms identically, the box's radius clipping a
                  video the way it rounds an image — and the pager clips its
                  neighbours to the one page the flight is carrying. */}
                <Animated.View style={[StyleSheet.absoluteFill, mediaStyle]}>
                  <ScrollView
                    ref={pagerRef}
                    testID="bloom-media-gallery-pager"
                    horizontal
                    pagingEnabled
                    // Frozen in flight, and while zoomed so a horizontal drag pans
                    // the zoomed image instead of paging away from it.
                    scrollEnabled={settled && !isZoomed}
                    showsHorizontalScrollIndicator={false}
                    contentOffset={{ x: activeIndexRef.current * SCREEN_WIDTH, y: 0 }}
                    onMomentumScrollEnd={onPagerScroll}
                    {...(Platform.OS === 'web' ? { onScroll: onPagerScroll } : {})}
                    scrollEventThrottle={16}
                    style={StyleSheet.absoluteFill}
                  >
                    {items.map((item, idx) => {
                      const uri = posterUri(item);
                      const ratio = itemRatio(item, ratios.pages[idx]);
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
                            accessibilityLabel={labels.close}
                            style={[
                              styles.page,
                              { width: SCREEN_WIDTH, height: SCREEN_HEIGHT },
                              webPointerStyle,
                            ]}
                          >
                            <GestureDetector gesture={activePageGesture}>
                              <Animated.View
                                style={[
                                  styles.mediaBox,
                                  {
                                    width: fit.width,
                                    height: fit.height,
                                    borderRadius: radiusFor(fit),
                                  },
                                  zoomImageStyle,
                                ]}
                              >
                                <MediaSurface
                                  content={item}
                                  contentFit="contain"
                                  nativeControls={videoControls}
                                  accessibilityLabel={item.alt}
                                  onPicture={startOpenFlight}
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
                          accessibilityLabel={labels.close}
                          style={[styles.page, { width: SCREEN_WIDTH, height: SCREEN_HEIGHT }]}
                        >
                          <MediaPoster
                            content={item}
                            contentFit="contain"
                            accessibilityLabel={item.alt}
                            style={{
                              width: fit.width,
                              height: fit.height,
                              borderRadius: radiusFor(fit),
                            }}
                          />
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                </Animated.View>

                {settled && items.length > 1 && (
                  <Animated.View
                    style={[
                      styles.indicatorWrap,
                      { bottom: INDICATOR_BOTTOM + insets.bottom },
                      backdropStyle,
                    ]}
                    pointerEvents="box-none"
                  >
                    <View
                      style={[
                        styles.counterPill,
                        pagePalette && { backgroundColor: pagePalette.backgroundSecondary },
                      ]}
                      pointerEvents="none"
                    >
                      <Text
                        style={[styles.counterText, pagePalette && { color: pagePalette.text }]}
                      >{`${activeIndex + 1} / ${items.length}`}</Text>
                    </View>
                    {indicatorVariant === 'thumbnails' ? (
                      <ScrollArea
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
                            accessibilityLabel={labels.goTo(idx + 1, items.length)}
                            style={[
                              styles.thumbTile,
                              idx === activeIndex
                                ? styles.thumbTileActive
                                : styles.thumbTileInactive,
                              pagePalette && {
                                borderColor:
                                  idx === activeIndex ? pagePalette.text : pagePalette.border,
                              },
                              webPointerStyle,
                            ]}
                          >
                            {/* A STILL, never a surface: one decoder per strip tile is
                          what mounting the real media here would cost, and for a
                          video it would be a second view on the live player. */}
                            <MediaPoster
                              content={item}
                              contentFit="cover"
                              style={styles.thumbTileImage}
                            />
                          </Pressable>
                        ))}
                      </ScrollArea>
                    ) : (
                      <View style={styles.dotsRow} pointerEvents="none">
                        {items.map((item, idx) => (
                          <View
                            key={`dot-${mediaKey(item, idx)}`}
                            style={[
                              styles.dot,
                              idx === activeIndex ? styles.dotActive : styles.dotInactive,
                              pagePalette && {
                                backgroundColor:
                                  idx === activeIndex
                                    ? pagePalette.text
                                    : pagePalette.textSecondary,
                              },
                            ]}
                          />
                        ))}
                      </View>
                    )}
                  </Animated.View>
                )}

                {Platform.OS === 'web' && settled && items.length > 1 && activeIndex > 0 && (
                  <NavArrow
                    buttonRef={previousButtonRef}
                    pageColors={pageColors}
                    direction="left"
                    label={labels.previous}
                    onPress={() => pageTo(activeIndex - 1)}
                  />
                )}

                {Platform.OS === 'web' &&
                  settled &&
                  items.length > 1 &&
                  activeIndex < items.length - 1 && (
                    <NavArrow
                      buttonRef={nextButtonRef}
                      pageColors={pageColors}
                      direction="right"
                      label={labels.next}
                      onPress={() => pageTo(activeIndex + 1)}
                    />
                  )}

                {canShare && settled && activeItem && (
                  <Button
                    ref={shareButtonRef}
                    onPress={handleShare}
                    disabled={
                      activeItem.shareUrl !== undefined && shareUri(activeItem) === undefined
                    }
                    appearance="outline"
                    tone="neutral"
                    iconOnly
                    accessibilityLabel={labels.share}
                    material="flat"
                    colors={pageColors ?? SCRIM_CHROME}
                    icon={
                      <RiUpload2Line fill={(pageColors ?? SCRIM_CHROME).foreground} size="md" />
                    }
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    style={[
                      styles.shareButton,
                      { top: CHROME_EDGE + insets.top, right: CHROME_EDGE + insets.right },
                    ]}
                  />
                )}

                {activeAlt ? (
                  <Animated.View
                    style={[
                      styles.altCaptionWrap,
                      {
                        bottom:
                          (items.length > 1 ? CAPTION_BOTTOM_WITH_INDICATOR : INDICATOR_BOTTOM) +
                          insets.bottom,
                      },
                      backdropStyle,
                    ]}
                    pointerEvents="none"
                  >
                    <View
                      style={[
                        styles.altCaptionPill,
                        pagePalette && { backgroundColor: pagePalette.backgroundSecondary },
                      ]}
                    >
                      <Text
                        style={[styles.altCaptionText, pagePalette && { color: pagePalette.text }]}
                        numberOfLines={4}
                      >
                        {activeAlt}
                      </Text>
                    </View>
                  </Animated.View>
                ) : null}
              </Animated.View>
            </GestureDetector>
            {videoOverlay != null && (
              // A sibling of the gesture/dismiss tree: retry controls must neither
              // bubble a press into the closing page nor compete with its tap/pan.
              <Animated.View
                pointerEvents="box-none"
                style={[StyleSheet.absoluteFill, styles.zoomContainer, backdropStyle]}
              >
                <View
                  pointerEvents="box-none"
                  style={{ width: activeFit.width, height: activeFit.height }}
                >
                  {videoOverlay}
                </View>
              </Animated.View>
            )}
          </GestureHandlerRootView>
          {/* LAST, so its layout effect runs after every ref above it — the
              pager's included — is attached. */}
          <OnCommit onCommit={onOverlayCommit} />
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
    },
  );

  ZoomableMediaGalleryInner.displayName = 'ZoomableMediaGallery';

  return ZoomableMediaGalleryInner;
}

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
  // `bottom` is inline: INDICATOR_BOTTOM above the bottom safe-area inset.
  indicatorWrap: {
    position: 'absolute',
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
    transform: [{ translateY: -22 }],
  },
  navArrowLeft: {
    left: 16,
  },
  navArrowRight: {
    right: 16,
  },
  shareButton: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // `bottom` is inline, above the indicator when there is one, inside the safe area.
  altCaptionWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 24,
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
