import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ComponentType,
} from 'react';
import {
  Platform,
  TextInput,
  type TextInputProps,
  type View,
} from 'react-native';
import { styled } from 'react-native-css';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { useFieldMembership } from '../field/membership';
import { StyledView } from '../styles/styled-primitives';
import { useTheme } from '../theme/use-theme';
import { useAgentCreatorMessages } from './context';
import { GlossArt } from './GlossArt';
import { hexToHsv, hsvToHex, type Hsv } from './shared';
import { useTrackEvents } from './use-track-events';

const StyledTextInput: ComponentType<TextInputProps> = styled(TextInput, {
  className: 'style',
});
const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
const THUMB =
  'pointer-events-none absolute size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white bg-white/0 ' +
  'shadow-[0_2px_4px_rgb(0_0_0/0.18),inset_0_0_0_1px_rgb(0_0_0/0.06)]';

/** Source HSV picker: own two-dimensional field and 12px hue rail, rAF-throttled. */
export function CustomColorPicker({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (hex: string) => void;
  className?: string;
}) {
  const messages = useAgentCreatorMessages();
  const membership = useFieldMembership({ label: messages.hexColor });
  const { colors } = useTheme();
  const id = useId().replace(/:/g, '');
  const fieldRef = useRef<View>(null);
  const railRef = useRef<View>(null);
  const [hsv, setHsv] = useState<Hsv>(
    () => hexToHsv(value) ?? { h: 259, s: 0.83, v: 1 },
  );
  const [hexDraft, setHexDraft] = useState(() => value.toLowerCase());
  const [seenValue, setSeenValue] = useState(() => value.toLowerCase());
  const [lastEmitted, setLastEmitted] = useState(() => value.toLowerCase());
  const [width, setWidth] = useState(228);
  const [hexFocused, setHexFocused] = useState(false);
  const frame = useRef(0);
  const nextValue = value.toLowerCase();
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
  const emit = useCallback(
    (next: Hsv) => {
      if (membership.disabled) return;
      setHsv(next);
      cancelAnimationFrame(frame.current);
      frame.current = requestAnimationFrame(() => {
        const hex = hsvToHex(next);
        setLastEmitted(hex);
        setHexDraft(hex);
        onChange(hex);
      });
    },
    [onChange, membership.disabled],
  );
  useEffect(
    () => () => {
      if (frame.current) cancelAnimationFrame(frame.current);
    },
    [],
  );
  const field = Gesture.Pan()
    .enabled(!membership.disabled)
    .minDistance(0)
    .runOnJS(true)
    .onBegin((event) => {
      fieldRef.current?.focus();
      emit({
        ...hsv,
        s: clamp01(event.x / width),
        v: 1 - clamp01(event.y / ((width * 2) / 3)),
      });
    })
    .onUpdate((event) =>
      emit({
        ...hsv,
        s: clamp01(event.x / width),
        v: 1 - clamp01(event.y / ((width * 2) / 3)),
      }),
    );
  const rail = Gesture.Pan()
    .enabled(!membership.disabled)
    .minDistance(0)
    .runOnJS(true)
    .onBegin((event) => {
      railRef.current?.focus();
      emit({ ...hsv, h: Math.min(clamp01(event.x / width) * 360, 359.9) });
    })
    .onUpdate((event) =>
      emit({ ...hsv, h: Math.min(clamp01(event.x / width) * 360, 359.9) }),
    );
  useTrackEvents(fieldRef, undefined, (key, shift) => {
    const step = shift ? 0.1 : 0.02;
    const moves: Record<string, Partial<Hsv>> = {
      ArrowLeft: { s: clamp01(hsv.s - step) },
      ArrowRight: { s: clamp01(hsv.s + step) },
      ArrowUp: { v: clamp01(hsv.v + step) },
      ArrowDown: { v: clamp01(hsv.v - step) },
    };
    const move = moves[key];
    if (!move) return false;
    emit({ ...hsv, ...move });
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
    emit({ ...hsv, h: Math.min(Math.max(hsv.h + delta, 0), 359.9) });
    return true;
  });
  const commitHexDraft = () => {
    if (membership.disabled) return;
    const parsed = hexToHsv(hexDraft);
    if (!parsed) {
      setHexDraft(lastEmitted);
      return;
    }
    const hex = hsvToHex(parsed);
    setLastEmitted(hex);
    setHsv(parsed);
    setHexDraft(hex);
    onChange(hex);
  };
  const hueColor = hsvToHex({ h: hsv.h, s: 1, v: 1 });
  const current = hsvToHex(hsv);
  const thumb = {
    width: 16,
    height: 16,
    borderWidth: 1,
    borderColor: '#ffffff',
    borderRadius: 8,
    transform:
      Platform.OS === 'web'
        ? undefined
        : [{ translateX: -8 }, { translateY: -8 }],
    boxShadow: '0 2px 4px rgba(0,0,0,.18), inset 0 0 0 1px rgba(0,0,0,.06)',
  };
  return (
    <StyledView
      className={
        className
          ? `flex flex-col gap-2.5 ${className}`
          : 'flex flex-col gap-2.5'
      }
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
              ...hsv,
              v: clamp01(
                hsv.v +
                  (event.nativeEvent.actionName === 'increment' ? 0.02 : -0.02),
              ),
            })
          }
        >
          <Svg
            width="100%"
            height="100%"
            accessible={false}
            style={{ position: 'absolute', left: 0, top: 0 }}
          >
            <Defs>
              <LinearGradient id={`${id}-sat`} x1="0" x2="1" y1="0" y2="0">
                <Stop offset="0" stopColor="#ffffff" />
                <Stop offset="1" stopColor={hueColor} />
              </LinearGradient>
              <LinearGradient id={`${id}-value`} x1="0" x2="0" y1="0" y2="1">
                <Stop offset="0" stopColor="#000000" stopOpacity={0} />
                <Stop offset="1" stopColor="#000000" />
              </LinearGradient>
            </Defs>
            <Rect rx={16} width="100%" height="100%" fill={`url(#${id}-sat)`} />
            <Rect
              rx={16}
              width="100%"
              height="100%"
              fill={`url(#${id}-value)`}
            />
          </Svg>
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
              ...hsv,
              h: Math.min(
                Math.max(
                  hsv.h +
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
            accessible={false}
            style={{ position: 'absolute', left: 0, top: 0 }}
          >
            <Defs>
              <LinearGradient id={`${id}-hue`} x1="0" x2="1" y1="0" y2="0">
                {[
                  '#ff0000',
                  '#ffff00',
                  '#00ff00',
                  '#00ffff',
                  '#0000ff',
                  '#ff00ff',
                  '#ff0000',
                ].map((color, index) => (
                  <Stop
                    key={color + index}
                    offset={index / 6}
                    stopColor={color}
                  />
                ))}
              </LinearGradient>
            </Defs>
            <Rect rx={6} width="100%" height={12} fill={`url(#${id}-hue)`} />
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
                  backgroundColor: hexFocused
                    ? colors.card
                    : colors.backgroundTertiary,
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
