import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import { useReducedMotion } from 'react-native-reanimated';

import { DANGER_TABLE, colorRamp, resolveButtonRamps } from '../button/shared';
import {
  RiFileExcel2Line,
  RiFileImageLine,
  RiFileTextLine,
  RiUploadCloud2Line,
} from '../icons/remix';
import { useInteractionState } from '../hooks/use-interaction-state';
import { useInteractiveWebCss } from '../styles/interactive-web-css';
import type { WebCssStyle } from '../styles/web-view-style';
import { webDataSet } from '../styles/web-data';
import type { Theme } from '../theme/types';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import type { FileUploadFile, FileUploadLabels, FileUploadProps } from './types';

/**
 * A file upload control, covering idle, drag-over, uploading and complete
 * states. Colours are Bloom's theme through `button/shared.ts` ramps.
 *
 *   box        164 tall, full width, radius 16
 *   idle       background/secondary fill, 2px DASHED border/checkbox border
 *              (hover or drag-over: border/button/active)
 *              ├─ 40px disc (file-upload icon bg) with a 24px upload-cloud
 *              │  icon (hover darkens it)
 *              ├─ gap 14
 *              └─ prompt  Body/Medium text/secondary + "select" in accent-500
 *                 gap 8   Body 2/Regular text/tertiary "PDF, JPG… (max 8 MB)"
 *   uploading  surface fill; the dashed border fades out and a 2px
 *              border/button/default outline fades in, with an accent-400
 *              progress stroke running CLOCKWISE from top-centre round the
 *              perimeter; an accent-400 "42%" pill (Caption 1/Medium, white,
 *              tabular) drops in over the top edge
 *              ├─ 40px bordered disc with the file-type icon
 *              ├─ 14  file name, Body/Medium text/primary, truncated to 90%
 *              └─ 4   "Uploading 2.4 MB..." / "Uploaded successfully!",
 *                     Body 2/Regular text/secondary, cross-fading in place
 *   rejection  the prompt line turns text/error for 2.6s
 *
 * Every content swap is a staggered reveal: each line rises 12px out
 * of a 3px blur over 500ms (`cubic-bezier(0.22, 1, 0.36, 1)`), 40ms apart,
 * and leaves with a 200ms fade. Web runs it as CSS on `dataSet` hooks (blur
 * included); native drives opacity + translate with `Animated` (no blur).
 * Reduced motion drops every transition.
 *
 * Picking: on web a hidden `<input type="file">` plus drag and drop; native
 * has no built-in picker, so it calls `onPickFiles`. Progress is simulated
 * unless the caller controls `progress`.
 */

const IS_WEB = Platform.OS === 'web';

const DEFAULT_MAX_BYTES = 8 * 1024 * 1024;
const DEFAULT_EXTENSIONS = ['pdf', 'jpg', 'jpeg', 'png', 'xlsx'] as const;

const BOX_HEIGHT = 164;
const BOX_RADIUS = 16;
/** The progress outline's inset and corner radius. */
const RING_INSET = 1;
const RING_RADIUS = 15;
const RING_STROKE = 2;

/** How long a rejection message replaces the prompt. */
const REJECTION_MS = 2600;
/** How long the success state holds before resetting. */
const COMPLETE_HOLD_MS = 1600;

/** `.t-stagger` */
const STAGGER_MS = 500;
const STAGGER_STEP_MS = 40;
const STAGGER_DISTANCE = 12;
const STAGGER_EASE_CSS = 'cubic-bezier(0.22, 1, 0.36, 1)';
const STAGGER_EASE = Easing.bezier(0.22, 1, 0.36, 1);
const HIDE_MS = 200;

type UploadPhase = 'idle' | 'uploading' | 'complete';
type StaggerState = 'shown' | 'hiding' | 'hidden';

import { formatFileSize } from './shared';
import { DISABLED_OPACITY } from '../styles/tokens';
import { useFieldMembership } from '../field/membership';

export { formatFileSize };

function extensionFor(fileName: string): string {
  return fileName.split('.').pop()?.toLowerCase() ?? '';
}

interface FileUploadPaint {
  idleBackground: string;
  busyBackground: string;
  dash: string;
  dashActive: string;
  ringTrack: string;
  ringFill: string;
  pillBackground: string;
  pillText: string;
  discBackground: string;
  discIcon: string;
  discIconHover: string;
  prompt: string;
  select: string;
  hint: string;
  error: string;
  fileDiscBorder: string;
  fileDiscBackground: string;
  fileIcon: string;
  fileName: string;
  status: string;
  ring: string;
}

/**
 * Every colour the upload paints. Pure.
 *
 *                              light          dark
 *   background/secondary       neutral-100    neutral-900
 *   background/primary         card           neutral-800
 *   border/checkbox/default    neutral-300    neutral-700
 *   border/button/active       neutral-400    neutral-600
 *   border/button/default      neutral-200    neutral-700
 *   file-upload icon bg        neutral-300    neutral-600
 *   file-upload icon fg        neutral-400    neutral-400  (hover 500 / 300)
 *   text/secondary             neutral-500    neutral-500
 *   text/tertiary              neutral-400    neutral-600
 *   text/error/primary         red-500        red-400
 */
export function resolveFileUploadPaint(theme: Theme): FileUploadPaint {
  const { accent, neutral: n } = resolveButtonRamps(theme);
  const red = colorRamp(theme.colors.negative, DANGER_TABLE);
  const dark = theme.isDark;
  return {
    idleBackground: dark ? n[900] : n[100],
    busyBackground: dark ? n[800] : theme.colors.card,
    dash: dark ? n[700] : n[300],
    dashActive: dark ? n[600] : n[400],
    ringTrack: dark ? n[700] : n[200],
    ringFill: accent[400],
    pillBackground: accent[400],
    pillText: '#FFFFFF',
    discBackground: dark ? n[600] : n[300],
    discIcon: n[400],
    discIconHover: dark ? n[300] : n[500],
    prompt: n[500],
    select: accent[500],
    hint: dark ? n[600] : n[400],
    error: dark ? red[400] : red[500],
    fileDiscBorder: dark ? n[700] : n[200],
    fileDiscBackground: dark ? n[800] : theme.colors.card,
    fileIcon: n[500],
    fileName: theme.colors.text,
    status: n[500],
    ring: accent[500],
  };
}

/** Rounded-rect path beginning at top-centre and running clockwise. */
function ringPath(width: number, height: number, inset: number, radius: number): string {
  const x0 = inset;
  const y0 = inset;
  const x1 = width - inset;
  const y1 = height - inset;
  const arc = (endX: number, endY: number) => `A ${radius} ${radius} 0 0 1 ${endX} ${endY}`;
  return [
    `M ${width / 2} ${y0}`,
    `H ${x1 - radius}`,
    arc(x1, y0 + radius),
    `V ${y1 - radius}`,
    arc(x1 - radius, y1),
    `H ${x0 + radius}`,
    arc(x0, y1 - radius),
    `V ${y0 + radius}`,
    arc(x0 + radius, y0),
    'Z',
  ].join(' ');
}

/**
 * The length of {@link ringPath}, computed in real units rather than
 * normalised, since react-native-svg does not support `pathLength` on every
 * platform.
 */
function ringLength(width: number, height: number, inset: number, radius: number): number {
  const straight = 2 * (width - 2 * inset - 2 * radius) + 2 * (height - 2 * inset - 2 * radius);
  return Math.max(0, straight) + 2 * Math.PI * radius;
}

/** Drives the stagger states: a line that stops being shown fades for 200ms, then resets. */
function useStaggerState(active: boolean): StaggerState {
  const [prevActive, setPrevActive] = useState(active);
  const [hiding, setHiding] = useState(false);

  if (prevActive !== active) {
    setPrevActive(active);
    setHiding(!active);
  }

  useEffect(() => {
    if (!hiding) return;
    const timer = setTimeout(() => setHiding(false), HIDE_MS);
    return () => clearTimeout(timer);
  }, [hiding]);

  return active ? 'shown' : hiding ? 'hiding' : 'hidden';
}

// ---------------------------------------------------------------------------
//  Web CSS — the transitions, the blur and the focus ring, none of which has an
//  inline-style spelling. Hung off `dataSet` attributes; `adoptStyleSheet`
//  no-ops without a `document`.
// ---------------------------------------------------------------------------

const STYLE_ID = 'bloom-file-upload-web-css';
const ROOT = '[data-bloom-file-upload]';
const LINE = '[data-bloom-file-upload-line]';
const SUB = '[data-bloom-file-upload-sub]';

const BLOOM_FILE_UPLOAD_CSS = `
${ROOT} {
  outline: none;
  transition: background-color 300ms ease-out;
}
${ROOT}[data-bloom-file-upload="idle"] {
  cursor: pointer;
}
${ROOT}[data-bloom-file-upload="busy"] {
  cursor: default;
}
${ROOT}:focus-visible {
  outline: 2px solid var(--bloom-file-upload-ring, currentColor);
  outline-offset: 2px;
}
[data-bloom-file-upload-dash] {
  transition: opacity 300ms ease-out, border-color 300ms ease-out;
}
[data-bloom-file-upload-ring] {
  transition: opacity 300ms ease-out;
}
[data-bloom-file-upload-ring] path {
  transition: stroke-dasharray 200ms linear;
}
[data-bloom-file-upload-icon] path {
  transition: fill 150ms ease;
}
[data-bloom-file-upload-pill] {
  transition: opacity 160ms ease-out, filter 160ms ease-out, transform 300ms ease-out;
}
[data-bloom-file-upload-pill="hidden"] {
  opacity: 0;
  transform: translateY(-10px);
  filter: blur(2px);
}
[data-bloom-file-upload-pill="shown"] {
  opacity: 1;
  transform: translateY(0);
  filter: blur(0);
}
${LINE} {
  opacity: 0;
  transform: translateY(${STAGGER_DISTANCE}px);
  filter: blur(3px);
  transition: opacity ${STAGGER_MS}ms ${STAGGER_EASE_CSS}, transform ${STAGGER_MS}ms ${STAGGER_EASE_CSS}, filter ${STAGGER_MS}ms ${STAGGER_EASE_CSS};
  will-change: transform, opacity, filter;
}
${LINE}[data-bloom-file-upload-line="2"] {
  transition-delay: ${STAGGER_STEP_MS}ms;
}
${LINE}[data-bloom-file-upload-line="3"] {
  transition-delay: ${STAGGER_STEP_MS * 2}ms;
}
${LINE}[data-bloom-file-upload-state="shown"] {
  opacity: 1;
  transform: translateY(0);
  filter: blur(0);
}
${LINE}[data-bloom-file-upload-state="hiding"] {
  opacity: 0;
  transform: translateY(0);
  filter: blur(0);
  transition: opacity ${HIDE_MS}ms ease, transform 0s linear, filter 0s linear;
  transition-delay: 0s;
}
${SUB}[data-bloom-file-upload-sub="shown"] {
  opacity: 1;
  transform: translateY(0);
  filter: blur(0);
  transition: opacity ${STAGGER_MS}ms ${STAGGER_EASE_CSS}, transform ${STAGGER_MS}ms ${STAGGER_EASE_CSS}, filter ${STAGGER_MS}ms ${STAGGER_EASE_CSS};
}
${SUB}[data-bloom-file-upload-sub="hiding"] {
  opacity: 0;
  transform: translateY(0);
  filter: blur(0);
  transition: opacity ${HIDE_MS}ms ease;
}
${SUB}[data-bloom-file-upload-sub="hidden"] {
  opacity: 0;
  transform: translateY(${STAGGER_DISTANCE}px);
  filter: blur(3px);
  transition: none;
}
@media (prefers-reduced-motion: reduce) {
${ROOT}, [data-bloom-file-upload-dash], [data-bloom-file-upload-ring],
[data-bloom-file-upload-ring] path, [data-bloom-file-upload-icon] path,
[data-bloom-file-upload-pill], ${LINE}, ${SUB} {
  transition: none !important;
}
}
`;

// ---------------------------------------------------------------------------
//  Motion primitives
// ---------------------------------------------------------------------------

/**
 * One staggered line. `kind="line"` is delayed by its order; `kind="sub"` is
 * the in-place status swap, which has no delay and resets instantly when
 * hidden.
 */
function StaggerLine({
  state,
  kind,
  order = 1,
  reducedMotion,
  style,
  children,
}: {
  state: StaggerState;
  kind: 'line' | 'sub';
  order?: 1 | 2 | 3;
  reducedMotion: boolean;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}) {
  const opacity = useRef(new Animated.Value(state === 'shown' ? 1 : 0)).current;
  const translateY = useRef(new Animated.Value(state === 'hidden' ? STAGGER_DISTANCE : 0)).current;

  useEffect(() => {
    if (IS_WEB) return;
    opacity.stopAnimation();
    translateY.stopAnimation();
    if (state === 'hidden') {
      opacity.setValue(0);
      translateY.setValue(STAGGER_DISTANCE);
      return;
    }
    if (reducedMotion) {
      opacity.setValue(state === 'shown' ? 1 : 0);
      translateY.setValue(0);
      return;
    }
    if (state === 'hiding') {
      translateY.setValue(0);
      Animated.timing(opacity, { toValue: 0, duration: HIDE_MS, useNativeDriver: true }).start();
      return;
    }
    const delay = kind === 'line' ? (order - 1) * STAGGER_STEP_MS : 0;
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: STAGGER_MS, delay, easing: STAGGER_EASE, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: STAGGER_MS, delay, easing: STAGGER_EASE, useNativeDriver: true }),
    ]).start();
  }, [state, kind, order, reducedMotion, opacity, translateY]);

  if (IS_WEB) {
    return (
      <View
        {...webDataSet(
          kind === 'line'
            ? { bloomFileUploadLine: String(order), bloomFileUploadState: state }
            : { bloomFileUploadSub: state },
        )}
        pointerEvents="none"
        style={style}
      >
        {children}
      </View>
    );
  }
  return (
    <Animated.View pointerEvents="none" style={[style, { opacity, transform: [{ translateY }] }]}>
      {children}
    </Animated.View>
  );
}

/** A 0 → 1 value that follows `on` over `duration` on native (web uses CSS). */
function useNativeFade(on: boolean, duration: number, reducedMotion: boolean): Animated.Value {
  const value = useRef(new Animated.Value(on ? 1 : 0)).current;
  useEffect(() => {
    if (IS_WEB) return;
    if (reducedMotion) {
      value.setValue(on ? 1 : 0);
      return;
    }
    Animated.timing(value, {
      toValue: on ? 1 : 0,
      duration,
      easing: Easing.out(Easing.ease),
      // Also drives `backgroundColor`, which the native driver cannot animate.
      useNativeDriver: false,
    }).start();
  }, [on, duration, reducedMotion, value]);
  return value;
}

function DefaultFileIcon({ file, color }: { file: FileUploadFile; color: string }) {
  const extension = extensionFor(file.name);
  const Icon =
    extension === 'xlsx'
      ? RiFileExcel2Line
      : ['jpg', 'jpeg', 'png'].includes(extension)
        ? RiFileImageLine
        : RiFileTextLine;
  return <Icon width={24} height={24} fill={color} />;
}

function normalizeDomFile(file: { name: string; size: number; type: string }): FileUploadFile {
  return { name: file.name, size: file.size, mimeType: file.type || undefined, raw: file };
}

// ---------------------------------------------------------------------------
//  FileUpload
// ---------------------------------------------------------------------------

const FileUploadComponent = function FileUpload({
  onFileSelected,
  onUploadComplete,
  onReject,
  progress: controlledProgress,
  file: controlledFile,
  onPickFiles,
  allowedExtensions = DEFAULT_EXTENSIONS,
  maxBytes = DEFAULT_MAX_BYTES,
  renderFileIcon,
  labels: labelOverrides,
  disabled: disabledProp = false,
  accessibilityLabel,
  style,
  testID,
}: FileUploadProps) {
  const theme = useTheme();
  // The drop zone draws a prompt but names itself with a prop, so a `Field`
  // around it is the other place the name can come from — and the field's
  // `disabled` blocks the picker whatever the caller passed. `'Upload a file'`
  // stays the last resort rather than a default that would outrank a label the
  // user can read.
  const field = useFieldMembership({ accessibilityLabel, disabled: disabledProp });
  const disabled = field.disabled;
  useInteractiveWebCss(STYLE_ID, BLOOM_FILE_UPLOAD_CSS);
  const reducedMotion = useReducedMotion();
  const paint = useMemo(() => resolveFileUploadPaint(theme), [theme]);

  const labels: FileUploadLabels = {
    prompt: IS_WEB ? 'Drag and drop to upload or' : 'Tap to',
    select: IS_WEB ? 'select' : 'select a file',
    uploading: (size) => `Uploading ${size}...`,
    uploaded: 'Uploaded successfully!',
    unsupported: (extensions) => `Only ${extensions} files are supported`,
    tooLarge: (max) => `That file is larger than ${max}`,
    ...labelOverrides,
  };

  const fileControlled = controlledFile !== undefined;
  const controlled = fileControlled || controlledProgress !== undefined;
  const [phaseState, setPhase] = useState<UploadPhase>('idle');
  const [simulatedProgress, setSimulatedProgress] = useState(0);
  const [fileState, setFile] = useState<FileUploadFile | null>(null);
  const [rejection, setRejection] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [box, setBox] = useState({ width: 533, height: BOX_HEIGHT });
  const { state: hovered, onIn: onHoverIn, onOut: onHoverOut } = useInteractionState();

  const rootRef = useRef<View>(null);
  const inputRef = useRef<{ click: () => void } | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach(clearTimeout);
  }, []);

  const progress = Math.round(
    Math.min(100, Math.max(0, controlled ? (controlledProgress ?? 0) : simulatedProgress)),
  );
  const file = fileControlled ? controlledFile : fileState;
  const phase: UploadPhase = fileControlled
    ? controlledFile
      ? progress >= 100
        ? 'complete'
        : 'uploading'
      : 'idle'
    : phaseState;
  const busy = phase !== 'idle';

  const onUploadCompleteRef = useRef(onUploadComplete);
  onUploadCompleteRef.current = onUploadComplete;

  const finish = useCallback((done: FileUploadFile) => {
    setPhase('complete');
    timers.current.push(
      setTimeout(() => {
        onUploadCompleteRef.current?.(done);
        setPhase('idle');
        setFile(null);
      }, COMPLETE_HOLD_MS),
    );
  }, []);

  // Controlled progress: the caller's value reaching 100 is what completes it.
  useEffect(() => {
    if (!fileControlled && controlled && phase === 'uploading' && file && progress >= 100) finish(file);
  }, [fileControlled, controlled, phase, file, progress, finish]);

  // Fully controlled: hold the success state, then report; the caller clears `file`.
  useEffect(() => {
    if (!fileControlled || phase !== 'complete' || !file) return;
    const timer = setTimeout(() => onUploadCompleteRef.current?.(file), COMPLETE_HOLD_MS);
    return () => clearTimeout(timer);
  }, [fileControlled, phase, file]);

  const reject = (message: string, rejected: FileUploadFile) => {
    setRejection(message);
    onReject?.(message, rejected);
    timers.current.push(setTimeout(() => setRejection(null), REJECTION_MS));
  };

  const startUpload = (next: FileUploadFile) => {
    const extension = extensionFor(next.name);
    if (!allowedExtensions.map((value) => value.toLowerCase()).includes(extension)) {
      reject(labels.unsupported(allowedExtensions.map((value) => value.toUpperCase()).join(', ')), next);
      return;
    }
    if (next.size > maxBytes) {
      reject(labels.tooLarge(formatFileSize(maxBytes)), next);
      return;
    }

    onFileSelected?.(next);
    if (fileControlled) return;
    setFile(next);
    setPhase('uploading');
    if (controlled) return;

    setSimulatedProgress(0);
    let value = 0;
    const tick = () => {
      value = Math.min(100, value + 2 + Math.random() * 5);
      setSimulatedProgress(Math.round(value));
      if (value < 100) {
        timers.current.push(setTimeout(tick, 90));
        return;
      }
      finish(next);
    };
    timers.current.push(setTimeout(tick, 250));
  };

  const startUploadRef = useRef(startUpload);
  startUploadRef.current = startUpload;
  const blocked = busy || disabled;
  const blockedRef = useRef(blocked);
  blockedRef.current = blocked;

  // Drag and drop (web). The Pressable's ref IS its DOM node under react-native-web.
  useEffect(() => {
    if (!IS_WEB) return;
    const node = rootRef.current as unknown as HTMLElement | null;
    if (!node || typeof node.addEventListener !== 'function') return;
    const onDragOver = (event: DragEvent) => {
      event.preventDefault();
      if (!blockedRef.current) setDragOver(true);
    };
    const onDragLeave = () => setDragOver(false);
    const onDrop = (event: DragEvent) => {
      event.preventDefault();
      setDragOver(false);
      const dropped = event.dataTransfer?.files?.[0];
      if (dropped && !blockedRef.current) startUploadRef.current(normalizeDomFile(dropped));
    };
    node.addEventListener('dragover', onDragOver);
    node.addEventListener('dragleave', onDragLeave);
    node.addEventListener('drop', onDrop);
    return () => {
      node.removeEventListener('dragover', onDragOver);
      node.removeEventListener('dragleave', onDragLeave);
      node.removeEventListener('drop', onDrop);
    };
  }, []);

  const handlePress = async () => {
    if (blocked) return;
    if (onPickFiles) {
      const picked = await onPickFiles();
      const first = Array.isArray(picked) ? picked[0] : (picked as FileUploadFile | null | undefined);
      if (first) startUpload(first);
      return;
    }
    if (IS_WEB) inputRef.current?.click();
  };

  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    if (width > 0) setBox({ width, height });
  };

  const idleReveal = useStaggerState(!busy);
  const busyReveal = useStaggerState(busy);
  const uploadingLine = useStaggerState(phase === 'uploading');
  const completeLine = useStaggerState(phase === 'complete');

  const busyFade = useNativeFade(busy, 300, reducedMotion);
  const pillFade = useNativeFade(busy, 160, reducedMotion);
  const pillDrop = useNativeFade(busy, 300, reducedMotion);

  const allowedLabel = allowedExtensions
    .filter((extension) => extension.toLowerCase() !== 'jpeg')
    .map((extension) => extension.toUpperCase())
    .join(', ');

  const length = ringLength(box.width, box.height, RING_INSET, RING_RADIUS);
  const dash = busy ? (progress >= 100 ? length * 1.02 : (length * progress) / 100) : 0;
  const dashActive = dragOver || (hovered && !blocked);

  const rootStyle: WebCssStyle = {
    position: 'relative',
    height: BOX_HEIGHT,
    width: '100%',
    flexShrink: 0,
    borderRadius: BOX_RADIUS,
    ...(IS_WEB ? { backgroundColor: busy ? paint.busyBackground : paint.idleBackground } : null),
    opacity: disabled ? DISABLED_OPACITY : 1,
    '--bloom-file-upload-ring': paint.ring,
  };

  const fill: ViewStyle = { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 };

  return (
    <Pressable
      ref={rootRef}
      {...webDataSet({ bloomFileUpload: busy ? 'busy' : 'idle' })}
      accessibilityRole="button"
      nativeID={field.nativeID}
      accessibilityLabel={field.accessibilityLabel ?? 'Upload a file'}
      aria-describedby={field.describedBy}
      aria-invalid={field.invalid || undefined}
      aria-busy={busy}
      disabled={disabled}
      focusable={!blocked}
      // `tabIndex={busy ? -1 : 0}`: react-native-web's Pressable
      // does not map `focusable={false}` to a negative tab index.
      {...(IS_WEB ? { tabIndex: blocked ? -1 : 0 } : {})}
      onPress={handlePress}
      onHoverIn={onHoverIn}
      onHoverOut={onHoverOut}
      onLayout={onLayout}
      style={[rootStyle, style]}
      testID={testID}
    >
      {IS_WEB ? (
        <input
          ref={(node) => {
            inputRef.current = node;
          }}
          type="file"
          tabIndex={-1}
          accept={allowedExtensions.map((extension) => `.${extension}`).join(',')}
          // A programmatic `click()` bubbles; without this the Pressable reads
          // it as a keyboard activation and opens the picker a second time.
          onClick={(event) => event.stopPropagation()}
          onChange={(event) => {
            const selected = event.target.files?.[0];
            event.target.value = '';
            if (selected) startUpload(normalizeDomFile(selected));
          }}
          style={{
            position: 'absolute',
            width: 1,
            height: 1,
            padding: 0,
            margin: -1,
            overflow: 'hidden',
            clipPath: 'inset(50%)',
            whiteSpace: 'nowrap',
            border: 0,
          }}
        />
      ) : null}

      {/* Native: the fill cross-fade (web transitions the root's own background). */}
      {IS_WEB ? null : (
        <Animated.View
          pointerEvents="none"
          style={[
            fill,
            {
              borderRadius: BOX_RADIUS,
              backgroundColor: busyFade.interpolate({
                inputRange: [0, 1],
                outputRange: [paint.idleBackground, paint.busyBackground],
              }),
            },
          ]}
        />
      )}

      {/* Dashed idle border. */}
      <Animated.View
        {...webDataSet({ bloomFileUploadDash: '' })}
        pointerEvents="none"
        style={[
          fill,
          {
            borderRadius: BOX_RADIUS,
            borderWidth: 2,
            borderStyle: 'dashed',
            borderColor: dashActive ? paint.dashActive : paint.dash,
            opacity: IS_WEB ? (busy ? 0 : 1) : busyFade.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
          },
        ]}
      />

      {/* Progress outline. */}
      <Animated.View
        {...webDataSet({ bloomFileUploadRing: '' })}
        pointerEvents="none"
        style={[fill, { opacity: IS_WEB ? (busy ? 1 : 0) : busyFade }]}
      >
        <Svg width={box.width} height={box.height} viewBox={`0 0 ${box.width} ${box.height}`}>
          <Rect
            x={RING_INSET}
            y={RING_INSET}
            width={Math.max(0, box.width - RING_INSET * 2)}
            height={Math.max(0, box.height - RING_INSET * 2)}
            rx={RING_RADIUS}
            fill="none"
            stroke={paint.ringTrack}
            strokeWidth={RING_STROKE}
          />
          <Path
            d={ringPath(box.width, box.height, RING_INSET, RING_RADIUS)}
            fill="none"
            stroke={paint.ringFill}
            strokeWidth={RING_STROKE}
            strokeLinecap="round"
            strokeDasharray={`${dash} ${length * 2}`}
          />
        </Svg>
      </Animated.View>

      {/* Percentage pill over the top edge. */}
      <View
        pointerEvents="none"
        style={{ position: 'absolute', top: -9.5, left: 0, right: 0, alignItems: 'center' }}
      >
        <Animated.View
          {...webDataSet({ bloomFileUploadPill: busy ? 'shown' : 'hidden' })}
          style={[
            {
              borderRadius: 6,
              paddingHorizontal: 6,
              paddingVertical: 2,
              backgroundColor: paint.pillBackground,
            },
            IS_WEB
              ? null
              : {
                  opacity: pillFade,
                  transform: [
                    { translateY: pillDrop.interpolate({ inputRange: [0, 1], outputRange: [-10, 0] }) },
                  ],
                },
          ]}
        >
          <Text
            variant="caption-1-medium"
            numberOfLines={1}
            style={{ color: paint.pillText, fontVariant: ['tabular-nums'] }}
          >
            {progress}%
          </Text>
        </Animated.View>
      </View>

      {/* Idle content. */}
      <View
        pointerEvents="none"
        style={[fill, { alignItems: 'center', justifyContent: 'center', gap: 14 }]}
      >
        <StaggerLine
          state={idleReveal}
          kind="line"
          order={1}
          reducedMotion={reducedMotion}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: paint.discBackground,
          }}
        >
          <View {...webDataSet({ bloomFileUploadIcon: '' })}>
            <RiUploadCloud2Line
              width={24}
              height={24}
              fill={hovered && !blocked ? paint.discIconHover : paint.discIcon}
            />
          </View>
        </StaggerLine>
        <View style={{ alignItems: 'center', gap: 8 }}>
          <StaggerLine state={idleReveal} kind="line" order={2} reducedMotion={reducedMotion}>
            <Text
              variant="body-medium"
              style={{ color: rejection ? paint.error : paint.prompt, textAlign: 'center' }}
            >
              {rejection ?? (
                <>
                  {labels.prompt} <Text variant="body-medium" style={{ color: paint.select }}>{labels.select}</Text>
                </>
              )}
            </Text>
          </StaggerLine>
          <StaggerLine state={idleReveal} kind="line" order={3} reducedMotion={reducedMotion}>
            <Text variant="body-2-regular" style={{ color: paint.hint, textAlign: 'center' }}>
              {allowedLabel} (max {formatFileSize(maxBytes)})
            </Text>
          </StaggerLine>
        </View>
      </View>

      {/* Uploading / complete content. */}
      <View pointerEvents="none" style={[fill, { alignItems: 'center', justifyContent: 'center' }]}>
        <StaggerLine
          state={busyReveal}
          kind="line"
          order={1}
          reducedMotion={reducedMotion}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: paint.fileDiscBorder,
            backgroundColor: paint.fileDiscBackground,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {file ? (renderFileIcon ? renderFileIcon(file) : <DefaultFileIcon file={file} color={paint.fileIcon} />) : null}
        </StaggerLine>
        <StaggerLine
          state={busyReveal}
          kind="line"
          order={2}
          reducedMotion={reducedMotion}
          style={{ marginTop: 14, maxWidth: '90%' }}
        >
          <Text variant="body-medium" numberOfLines={1} style={{ color: paint.fileName }}>
            {file?.name}
          </Text>
        </StaggerLine>
        <StaggerLine
          state={busyReveal}
          kind="line"
          order={3}
          reducedMotion={reducedMotion}
          style={{ marginTop: 4, height: 18, width: '100%' }}
        >
          <StaggerLine
            state={uploadingLine}
            kind="sub"
            reducedMotion={reducedMotion}
            style={{ position: 'absolute', left: 0, right: 0 }}
          >
            <Text variant="body-2-regular" style={{ color: paint.status, textAlign: 'center' }}>
              {labels.uploading(file ? formatFileSize(file.size) : '')}
            </Text>
          </StaggerLine>
          <StaggerLine
            state={completeLine}
            kind="sub"
            reducedMotion={reducedMotion}
            style={{ position: 'absolute', left: 0, right: 0 }}
          >
            <Text variant="body-2-regular" style={{ color: paint.status, textAlign: 'center' }}>
              {labels.uploaded}
            </Text>
          </StaggerLine>
        </StaggerLine>
      </View>
    </Pressable>
  );
};

export const FileUpload = memo(FileUploadComponent);
FileUpload.displayName = 'FileUpload';
