import {
  type ComponentRef,
  type ComponentType,
  type ReactNode,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Platform,
  TextInput,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
  type View,
} from 'react-native';
import { styled } from 'react-native-css';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Svg, { ClipPath, Defs, G, LinearGradient, Rect, Stop } from 'react-native-svg';
import { normalizeAvatarSkinColor } from '../agent-avatar/skin-color';
import { useFieldMembership } from '../field/membership';
import { StyledView } from '../styles/styled-primitives';
import { useSvgIdPrefix } from '../styles/svg-id';
import { useTheme } from '../theme/use-theme';
import { useAgentCreatorMessages } from './context';
import { GlossArt } from './GlossArt';
import { hexToHsv, hsvToHex, type Hsv } from './shared';
import { useTrackEvents } from './use-track-events';
import { svgA11yProps } from '../styles/svg-a11y';

// `styled()` is told only about `style`: a dot-path union over React Native
// 0.88's whole `TextInputProps` overflows the checker (TS2590). The annotation
// is the real contract — `styles/styled-primitives.ts` does the same.
const StyledTextInput: ComponentType<TextInputProps> = styled(
  TextInput as (props: { style?: StyleProp<TextStyle> }) => ReactNode,
  { className: 'style' },
);
const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
const THUMB =
  'pointer-events-none absolute size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white bg-white/0 ' +
  'shadow-[0_2px_4px_rgb(0_0_0/0.18),inset_0_0_0_1px_rgb(0_0_0/0.06)]';

const SkinColorField = memo(function SkinColorField({ hue, id }: { hue: number; id: string }) {
  // Hue changes rebuild this small vector field. Saturation/value dragging only
  // moves the thumb; every displayed stop uses the same policy as saved skin.
  const fieldColors = useMemo(
    () =>
      Array.from({ length: 32 }, (_, x) =>
        Array.from({ length: 13 }, (_, y) =>
          normalizeAvatarSkinColor(hsvToHex({ h: hue, s: (x + 0.5) / 32, v: 1 - y / 12 })),
        ),
      ),
    [hue],
  );
  return (
    <Svg
      testID="avatar-skin-color-field"
      width="100%"
      height="100%"
      {...svgA11yProps()}
      style={{ position: 'absolute', left: 0, top: 0, borderRadius: 16, overflow: 'hidden' }}
    >
      <Defs>
        <ClipPath id={`${id}-field-clip`}>
          <Rect rx={16} width="100%" height="100%" />
        </ClipPath>
        {fieldColors.map((stops, column) => (
          <LinearGradient key={column} id={`${id}-field-${column}`} x1="0" x2="0" y1="0" y2="1">
            {stops.map((color, row) => (
              <Stop key={row} offset={row / 12} stopColor={color} />
            ))}
          </LinearGradient>
        ))}
      </Defs>
      <G clipPath={`url(#${id}-field-clip)`}>
        {fieldColors.map((_, column) => (
          <Rect
            key={column}
            x={`${(column * 100) / 32}%`}
            width={`${100 / 32 + 0.5}%`}
            height="100%"
            fill={`url(#${id}-field-${column})`}
          />
        ))}
      </G>
    </Svg>
  );
});

/** Source HSV picker: own two-dimensional field and 12px hue rail, rAF-throttled. */
export function CustomColorPicker({
  value,
  onChange,
  onInteractionStart,
  onInteractionEnd,
  className,
}: {
  value: string;
  onChange: (hex: string) => void;
  onInteractionStart?: () => void;
  onInteractionEnd?: () => void;
  className?: string;
}) {
  const messages = useAgentCreatorMessages();
  const membership = useFieldMembership({ label: messages.hexColor });
  const { colors } = useTheme();
  const id = useSvgIdPrefix('bloom-color-picker');
  const fieldRef = useRef<ComponentRef<typeof View>>(null);
  const railRef = useRef<ComponentRef<typeof View>>(null);
  const [hsv, setHsv] = useState<Hsv>(
    () => hexToHsv(normalizeAvatarSkinColor(value)) ?? { h: 259, s: 0.83, v: 1 },
  );
  const [hexDraft, setHexDraft] = useState(() => normalizeAvatarSkinColor(value));
  const [seenValue, setSeenValue] = useState(() => normalizeAvatarSkinColor(value));
  const [lastEmitted, setLastEmitted] = useState(() => normalizeAvatarSkinColor(value));
  const [width, setWidth] = useState(228);
  const [hexFocused, setHexFocused] = useState(false);
  const frame = useRef(0);
  const nextValue = normalizeAvatarSkinColor(value);
  if (nextValue !== seenValue) {
    setSeenValue(nextValue);
    if (nextValue !== lastEmitted) {
      const parsed = hexToHsv(nextValue);
      if (parsed) {
        setLastEmitted(nextValue);
        setHsv(parsed);
        setHexDraft(nextValue);
      }
    }
  }
  const pendingHsv = useRef<Hsv | undefined>(undefined);
  const interacting = useRef(false);
  const latest = useRef({ onChange, onInteractionEnd, disabled: membership.disabled });
  latest.current = { onChange, onInteractionEnd, disabled: membership.disabled };
  const flush = useCallback(() => {
    if (frame.current) cancelAnimationFrame(frame.current);
    frame.current = 0;
    const next = pendingHsv.current;
    pendingHsv.current = undefined;
    if (!next || latest.current.disabled) return;
    const hex = normalizeAvatarSkinColor(hsvToHex(next));
    setHsv(next);
    setLastEmitted(hex);
    setHexDraft(hex);
    latest.current.onChange(hex);
  }, []);
  const emit = useCallback(
    (next: Hsv) => {
      if (latest.current.disabled) return;
      pendingHsv.current = next;
      if (!frame.current) frame.current = requestAnimationFrame(flush);
    },
    [flush],
  );
  useEffect(
    () => () => {
      if (frame.current) cancelAnimationFrame(frame.current);
      if (interacting.current) latest.current.onInteractionEnd?.();
    },
    [],
  );
  const field = Gesture.Pan()
    .enabled(!membership.disabled)
    .minDistance(0)
    .runOnJS(true)
    .onFinalize(() => {
      flush();
      interacting.current = false;
      latest.current.onInteractionEnd?.();
    })
    .onBegin((event) => {
      interacting.current = true;
      onInteractionStart?.();
      fieldRef.current?.focus();
      emit({
        ...(pendingHsv.current ?? hsv),
        s: clamp01(event.x / width),
        v: 1 - clamp01(event.y / ((width * 2) / 3)),
      });
    })
    .onUpdate((event) =>
      emit({
        ...(pendingHsv.current ?? hsv),
        s: clamp01(event.x / width),
        v: 1 - clamp01(event.y / ((width * 2) / 3)),
      }),
    );
  const rail = Gesture.Pan()
    .enabled(!membership.disabled)
    .minDistance(0)
    .runOnJS(true)
    .onFinalize(() => {
      flush();
      interacting.current = false;
      latest.current.onInteractionEnd?.();
    })
    .onBegin((event) => {
      interacting.current = true;
      onInteractionStart?.();
      railRef.current?.focus();
      emit({
        ...(pendingHsv.current ?? hsv),
        h: Math.min(clamp01(event.x / width) * 360, 359.9),
      });
    })
    .onUpdate((event) =>
      emit({
        ...(pendingHsv.current ?? hsv),
        h: Math.min(clamp01(event.x / width) * 360, 359.9),
      }),
    );
  useTrackEvents(fieldRef, undefined, (key, shift) => {
    const step = shift ? 0.1 : 0.02;
    const moves: Record<string, Partial<Hsv>> = {
      ArrowLeft: { s: clamp01((pendingHsv.current ?? hsv).s - step) },
      ArrowRight: { s: clamp01((pendingHsv.current ?? hsv).s + step) },
      ArrowUp: { v: clamp01((pendingHsv.current ?? hsv).v + step) },
      ArrowDown: { v: clamp01((pendingHsv.current ?? hsv).v - step) },
    };
    const move = moves[key];
    if (!move) return false;
    emit({ ...(pendingHsv.current ?? hsv), ...move });
    return true;
  });
  useTrackEvents(railRef, undefined, (key, shift) => {
    const step = shift ? 15 : 3;
    const delta =
      key === 'ArrowLeft' || key === 'ArrowDown'
        ? -step
        : key === 'ArrowRight' || key === 'ArrowUp'
          ? step
          : null;
    if (delta === null) return false;
    emit({
      ...(pendingHsv.current ?? hsv),
      h: Math.min(Math.max((pendingHsv.current ?? hsv).h + delta, 0), 359.9),
    });
    return true;
  });
  const commitHexDraft = () => {
    if (membership.disabled) return;
    if (frame.current) cancelAnimationFrame(frame.current);
    frame.current = 0;
    pendingHsv.current = undefined;
    const parsed = hexToHsv(hexDraft);
    if (!parsed) {
      setHexDraft(lastEmitted);
      return;
    }
    const hex = normalizeAvatarSkinColor(hsvToHex(parsed));
    setLastEmitted(hex);
    setHsv(hexToHsv(hex)!);
    setHexDraft(hex);
    onChange(hex);
  };
  const hueColor = hsvToHex({ h: hsv.h, s: 1, v: 1 });
  const current = normalizeAvatarSkinColor(hsvToHex(hsv));
  const thumb = {
    width: 16,
    height: 16,
    borderWidth: 1,
    borderColor: '#ffffff',
    borderRadius: 8,
    transform: Platform.OS === 'web' ? undefined : [{ translateX: -8 }, { translateY: -8 }],
    boxShadow: '0 2px 4px rgba(0,0,0,.18), inset 0 0 0 1px rgba(0,0,0,.06)',
  };
  return (
    <StyledView
      className={className ? `flex flex-col gap-2.5 ${className}` : 'flex flex-col gap-2.5'}
    >
      <GestureDetector gesture={field}>
        <StyledView
          ref={fieldRef}
          onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
          role="slider"
          tabIndex={membership.disabled ? -1 : 0}
          aria-disabled={membership.disabled || undefined}
          aria-invalid={membership.invalid || undefined}
          aria-describedby={membership.describedBy}
          accessibilityHint={membership.accessibilityHint}
          accessibilityLabel={messages.saturationBrightness}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(hsv.v * 100)}
          aria-valuetext={messages.saturationBrightnessValue(
            Math.round(hsv.s * 100),
            Math.round(hsv.v * 100),
          )}
          className="relative aspect-[3/2] w-full cursor-crosshair touch-none rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-border-focus-ring focus-visible:ring-offset-2"
          accessibilityActions={[
            { name: 'increment', label: messages.increaseBrightness },
            { name: 'decrement', label: messages.decreaseBrightness },
          ]}
          onAccessibilityAction={(event) =>
            emit({
              ...(pendingHsv.current ?? hsv),
              v: clamp01(
                (pendingHsv.current ?? hsv).v +
                  (event.nativeEvent.actionName === 'increment' ? 0.02 : -0.02),
              ),
            })
          }
        >
          <SkinColorField hue={hsv.h} id={id} />
          <StyledView
            pointerEvents="none"
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-2xl shadow-[inset_0_0_0_1px_rgb(0_0_0/0.06),inset_0_1px_0_rgb(255_255_255/0.12)]"
          />
          <StyledView
            pointerEvents="none"
            aria-hidden
            className={THUMB}
            style={[
              thumb,
              {
                position: 'absolute',
                left: `${hsv.s * 100}%`,
                top: `${(1 - hsv.v) * 100}%`,
                backgroundColor: current,
              },
            ]}
          />
        </StyledView>
      </GestureDetector>
      <GestureDetector gesture={rail}>
        <StyledView
          ref={railRef}
          role="slider"
          tabIndex={membership.disabled ? -1 : 0}
          aria-disabled={membership.disabled || undefined}
          aria-invalid={membership.invalid || undefined}
          aria-describedby={membership.describedBy}
          accessibilityHint={membership.accessibilityHint}
          accessibilityLabel={messages.hue}
          aria-valuemin={0}
          aria-valuemax={360}
          aria-valuenow={Math.round(hsv.h)}
          className="relative h-3 w-full cursor-pointer touch-none rounded-full outline-none focus-visible:ring-2 focus-visible:ring-border-focus-ring focus-visible:ring-offset-2"
          accessibilityActions={[
            { name: 'increment', label: messages.increaseHue },
            { name: 'decrement', label: messages.decreaseHue },
          ]}
          onAccessibilityAction={(event) =>
            emit({
              ...(pendingHsv.current ?? hsv),
              h: Math.min(
                Math.max(
                  (pendingHsv.current ?? hsv).h +
                    (event.nativeEvent.actionName === 'increment' ? 3 : -3),
                  0,
                ),
                359.9,
              ),
            })
          }
        >
          <Svg
            width="100%"
            height={12}
            {...svgA11yProps()}
            style={{ position: 'absolute', left: 0, top: 0 }}
          >
            <Defs>
              <LinearGradient id={`${id}hue`} x1="0" x2="1" y1="0" y2="0">
                {['#ff0000', '#ffff00', '#00ff00', '#00ffff', '#0000ff', '#ff00ff', '#ff0000'].map(
                  (color, index) => (
                    <Stop key={color + index} offset={index / 6} stopColor={color} />
                  ),
                )}
              </LinearGradient>
            </Defs>
            <Rect rx={6} width="100%" height={12} fill={`url(#${id}hue)`} />
          </Svg>
          <StyledView
            pointerEvents="none"
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-full shadow-[inset_0_0_0_1px_rgb(0_0_0/0.06)]"
          />
          <StyledView
            pointerEvents="none"
            aria-hidden
            className={`${THUMB} top-1/2`}
            style={[
              thumb,
              {
                position: 'absolute',
                left: `${(hsv.h / 360) * 100}%`,
                top: '50%',
                backgroundColor: hueColor,
              },
            ]}
          />
        </StyledView>
      </GestureDetector>
      <StyledView className="flex items-center gap-2 flex-row">
        <StyledView
          aria-hidden
          className="relative size-8 shrink-0 overflow-hidden rounded-full shadow-[inset_0_0_0_1px_rgb(0_0_0/0.06)]"
        >
          <GlossArt center={current} edge={current} size={32} />
        </StyledView>
        <StyledTextInput
          value={hexDraft}
          onChangeText={setHexDraft}
          autoCorrect={false}
          autoCapitalize="none"
          accessibilityLabel={membership.accessibilityLabel}
          nativeID={membership.nativeID}
          aria-describedby={membership.describedBy}
          accessibilityHint={membership.accessibilityHint}
          aria-invalid={membership.invalid || undefined}
          aria-disabled={membership.disabled || undefined}
          editable={!membership.disabled}
          onFocus={() => setHexFocused(true)}
          onBlur={() => {
            setHexFocused(false);
            commitHexDraft();
          }}
          onSubmitEditing={commitHexDraft}
          className="h-8 w-full min-w-0 rounded-2lg bg-background-tertiary-default px-2.5 font-mono text-[13px] text-text-primary uppercase outline-none ring-2 ring-transparent ring-inset transition-[background-color,box-shadow] duration-150 ease placeholder:text-text-placeholder focus:bg-background-primary-default focus:ring-border-focus-ring"
          style={[
            { flex: 1, direction: 'ltr' },
            Platform.OS === 'web'
              ? undefined
              : {
                  height: 32,
                  borderRadius: 10,
                  paddingHorizontal: 10,
                  backgroundColor: hexFocused ? colors.card : colors.backgroundTertiary,
                  color: colors.text,
                  fontFamily: 'monospace',
                  fontSize: 13,
                },
          ]}
        />
      </StyledView>
    </StyledView>
  );
}
