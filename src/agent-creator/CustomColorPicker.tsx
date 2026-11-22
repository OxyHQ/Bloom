import { type ComponentRef, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, StyleSheet, TextInput, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { cubicBezier } from 'react-native-reanimated';
import Svg, { ClipPath, Defs, G, LinearGradient, Rect, Stop } from 'react-native-svg';
import { normalizeAvatarSkinColor } from '../agent-avatar/skin-color';
import { useFieldMembership } from '../field/membership';
import { ROUNDED_FULL } from '../styles/rounded-full';
import { useSvgIdPrefix } from '../styles/svg-id';
import { useColorTokens } from '../theme/color-tokens';
import { useTheme } from '../theme/use-theme';
import { useAgentCreatorMessages } from './context';
import { GlossArt } from './GlossArt';
import { hexToHsv, hsvToHex, type Hsv } from './shared';
import { useTrackEvents } from './use-track-events';
import { AGENT_CREATOR_HOOKS, twShadow, useAgentCreatorWebCss } from './web-css';
import { svgA11yProps } from '../styles/svg-a11y';

// Native eases the hex field's fill as it takes and loses focus (150ms, Tailwind's default
// curve); the web transitions it from the editor's sheet.
const HexInput = Platform.OS === 'web' ? TextInput : Animated.createAnimatedComponent(TextInput);
const HEX_MOTION = {
  transitionProperty: ['backgroundColor', 'boxShadow'],
  transitionDuration: [150],
  transitionTimingFunction: cubicBezier(0.4, 0, 0.2, 1),
};
const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

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
}: {
  value: string;
  onChange: (hex: string) => void;
  onInteractionStart?: () => void;
  onInteractionEnd?: () => void;
}) {
  useAgentCreatorWebCss();
  const messages = useAgentCreatorMessages();
  const membership = useFieldMembership({ label: messages.hexColor });
  const { colors } = useTheme();
  const tokens = useColorTokens();
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
    <View style={styles.picker}>
      <GestureDetector gesture={field}>
        <View
          {...AGENT_CREATOR_HOOKS.colorField}
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
          style={styles.field}
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
          <View pointerEvents="none" aria-hidden style={styles.fieldEdge} />
          <View
            pointerEvents="none"
            aria-hidden
            style={[
              styles.thumb,
              thumb,
              {
                position: 'absolute',
                left: `${hsv.s * 100}%`,
                top: `${(1 - hsv.v) * 100}%`,
                backgroundColor: current,
              },
            ]}
          />
        </View>
      </GestureDetector>
      <GestureDetector gesture={rail}>
        <View
          {...AGENT_CREATOR_HOOKS.hueRail}
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
          style={styles.rail}
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
          <View pointerEvents="none" aria-hidden style={styles.railEdge} />
          <View
            pointerEvents="none"
            aria-hidden
            style={[
              styles.thumb,
              styles.railThumb,
              thumb,
              {
                position: 'absolute',
                left: `${(hsv.h / 360) * 100}%`,
                top: '50%',
                backgroundColor: hueColor,
              },
            ]}
          />
        </View>
      </GestureDetector>
      <View style={styles.hexRow}>
        <View aria-hidden style={styles.preview}>
          <GlossArt center={current} edge={current} size={32} />
        </View>
        <HexInput
          {...AGENT_CREATOR_HOOKS.hex}
          {...(Platform.OS === 'web' ? null : { placeholderTextColor: tokens.mutedForeground })}
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
          style={[
            { flex: 1, direction: 'ltr' },
            Platform.OS === 'web'
              ? undefined
              : {
                  ...styles.hexNative,
                  ...HEX_MOTION,
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
      </View>
    </View>
  );
}

/** The web draws the inset edges in Tailwind's computed shadow form. */
const edge = (native: object, web: string) =>
  Platform.OS === 'web' ? { boxShadow: twShadow(web) } : native;
const styles = StyleSheet.create({
  picker: { flexDirection: 'column', gap: 10 },
  field: { position: 'relative', aspectRatio: '3/2', width: '100%', borderRadius: 16 },
  fieldEdge: {
    pointerEvents: 'none',
    position: 'absolute',
    inset: 0,
    borderRadius: 16,
    ...edge(
      {
        boxShadow: [
          {
            inset: true,
            offsetX: 0,
            offsetY: 0,
            blurRadius: 0,
            spreadDistance: 1,
            color: '#0000000f',
          },
          { inset: true, offsetX: 0, offsetY: 1, blurRadius: 0, color: '#ffffff1f' },
        ],
      },
      'inset 0 0 0 1px rgb(0 0 0/0.06), inset 0 1px 0 rgb(255 255 255/0.12)',
    ),
  },
  thumb: {
    pointerEvents: 'none',
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: ROUNDED_FULL,
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#fff',
    // `-translate-x-1/2 -translate-y-1/2`: the web centres with `translate`; native with its transform.
    ...(Platform.OS === 'web' ? ({ translate: '-50% -50%' } as object) : null),
  },
  railThumb: { top: '50%' },
  rail: { position: 'relative', height: 12, width: '100%', borderRadius: ROUNDED_FULL },
  railEdge: {
    pointerEvents: 'none',
    position: 'absolute',
    inset: 0,
    borderRadius: ROUNDED_FULL,
    ...edge(
      {
        boxShadow: [
          {
            inset: true,
            offsetX: 0,
            offsetY: 0,
            blurRadius: 0,
            spreadDistance: 1,
            color: '#0000000f',
          },
        ],
      },
      'inset 0 0 0 1px rgb(0 0 0/0.06)',
    ),
  },
  hexRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  preview: {
    position: 'relative',
    width: 32,
    height: 32,
    flexShrink: 0,
    overflow: 'hidden',
    borderRadius: ROUNDED_FULL,
    ...edge(
      {
        boxShadow: [
          {
            inset: true,
            offsetX: 0,
            offsetY: 0,
            blurRadius: 0,
            spreadDistance: 1,
            color: '#0000000f',
          },
        ],
      },
      'inset 0 0 0 1px rgb(0 0 0/0.06)',
    ),
  },
  hexNative: {
    width: '100%',
    minWidth: 0,
    paddingInline: 10,
    textTransform: 'uppercase',
    boxShadow: [],
  },
});
