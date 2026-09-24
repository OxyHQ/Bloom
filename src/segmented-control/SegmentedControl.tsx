import { normalizeBloomSize } from '../appearance/legacy';
import { useBloomAppearance, type BloomSize } from '../appearance';
import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  type GestureResponderEvent,
  Platform,
  Pressable,
  type PressableProps,
  type StyleProp,
  type TextStyle,
  View,
  type ViewStyle,
} from 'react-native';
import Animated, { Easing, ReduceMotion, runOnJS, useAnimatedStyle, useSharedValue, withTiming, type SharedValue } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import type { TypeScaleFamily } from '../typography';
import type { Theme } from '../theme/types';
import { useInteractionState } from '../hooks/use-interaction-state';
import { borderRadius, DISABLED_OPACITY } from '../styles/tokens';
import { NOT_DISABLED, interactiveWebCss, useInteractiveWebCss } from '../styles/interactive-web-css';
import type { WebCssStyle } from '../styles/web-view-style';
import { mixColor, resolveButtonRamps } from '../button/shared';
import { useFieldMembership } from '../field/membership';
import { handleRovingKeyDown, useRovingTabIndex } from '../hooks/roving-focus';
import { webDataSet } from '../styles/web-data';

/**
 * A segmented control using Bloom's canonical surface and text roles.
 *
 *              small    medium   large
 *   segment h  24       28       36
 *   padding-x  8        10       12
 *   text       body-2   body     body     (-medium selected, -regular not)
 *   control h  32       36       44       (4px track padding, 2px gap)
 *
 *   track      backgroundSecondary
 *   thumb      card, shadow-2xs, slides under the
 *              selected segment over 200ms `ease`
 *   selected   medium weight, primary text
 *   unselected regular weight, textSecondary; hover → primary text (200ms)
 *   disabled   50% opacity
 *   focus      2px accent ring on the segment
 *
 * The track and the thumb are full pills, matching `Button`.
 *
 * `variant="plain"` draws no track, no padding and no thumb — the selected
 * segment reads through its text weight and colour alone.
 */

type SegmentedControlSize = BloomSize | 'small' | 'medium' | 'large';
type SegmentedControlVariant = 'solid' | 'plain';

const GEOMETRY = {
  xs: { height: 20, paddingHorizontal: 6, type: 'caption-1' },
  sm: { height: 24, paddingHorizontal: 8, type: 'body-2' },
  md: { height: 28, paddingHorizontal: 10, type: 'body' },
  lg: { height: 36, paddingHorizontal: 12, type: 'body' },
} as const satisfies Record<BloomSize, { height: number; paddingHorizontal: number; type: TypeScaleFamily }>;

/** Track padding. */
const TRACK_PADDING = 4;
/** Gap between segments. */
const SEGMENT_GAP = 2;
/** Transition duration (ease), for the thumb and the segment text. */
const TRANSITION_MS = 200;

const IS_WEB = Platform.OS === 'web';

interface SegmentedPalette {
  track: string;
  thumb: string;
  thumbShadow: string;
  selectedText: string;
  text: string;
  ring: string;
}

function resolveSegmentedPalette(theme: Theme): SegmentedPalette {
  return {
    track: theme.colors.backgroundSecondary,
    thumb: theme.colors.card,
    thumbShadow: theme.isDark ? '0 1px 0 0 rgba(0, 0, 0, 0.16)' : '0 1px 0 0 rgba(0, 0, 0, 0.05)',
    selectedText: theme.colors.text,
    text: theme.colors.textSecondary,
    ring: theme.colors.primary,
  };
}

// ---------------------------------------------------------------------------
//  Keyboard focus on web — a `focus-visible:ring-2` on the segment. The
//  segments are react-native-web `Pressable`s, so the rules hang off a `dataSet`
//  attribute (a class never reaches the DOM; see `chip/Chip.tsx`). Hover and
//  selection paint come from state, so they match on native.
// ---------------------------------------------------------------------------

const STYLE_ID = 'bloom-segmented-control-web-css';
const SEGMENT = '[data-bloom-segmented-item]';
/** The group node — the owner a segment's keyboard walks within. */
const GROUP = '[data-bloom-segmented-group]';

/** The attribute that says a segment is the chosen one, per role. */
function isChosenSegment(element: HTMLElement): boolean {
  return (
    element.getAttribute('aria-checked') === 'true' ||
    element.getAttribute('aria-selected') === 'true'
  );
}

const SEGMENTED_CSS = interactiveWebCss({
  selector: SEGMENT,
  varPrefix: 'bloom-segmented',
  base: `
    flex-direction: row;
    border: none;
    box-sizing: border-box;
  `,
  transition: 'none',
  hover: { declarations: 'cursor: pointer;' },
  outlineOffset: 0,
  extraRules: `${SEGMENT}:disabled,
${SEGMENT}[aria-disabled="true"] {
  cursor: not-allowed;
}
${SEGMENT}${NOT_DISABLED}:focus-visible {
  z-index: 1;
}`,
});

type SegmentPosition = { value: string; x: number; width: number; disabled: boolean };

const InternalContext = createContext<{
  register: (segment: SegmentPosition) => () => void;
  suppressPress: () => boolean;
  allowKeyboardPress: () => void;
  type: 'tabs' | 'radio';
  size: BloomSize;
  variant: SegmentedControlVariant;
  palette: SegmentedPalette;
  /** The group's disabled state. An item ORs it with its own. */
  disabled: boolean;
  selectedValue: string;
  selectedPosition: { width: number; x: number } | null;
  onSelectValue: (
    value: string,
    position: { width: number; x: number } | null,
  ) => void;
  updatePosition: (position: { width: number; x: number }) => void;
} | null>(null);

/**
 * Segmented control component.
 *
 * @example
 * ```tsx
 * <SegmentedControl label="Example" type="radio" value={value} onValueChange={setValue}>
 *   <SegmentedControlItem value="one">
 *     <SegmentedControlItemText>One</SegmentedControlItemText>
 *   </SegmentedControlItem>
 *   <SegmentedControlItem value="two">
 *     <SegmentedControlItemText>Two</SegmentedControlItemText>
 *   </SegmentedControlItem>
 * </SegmentedControl>
 * ```
 */
export function SegmentedControl<T extends string>({
  label,
  type = 'radio',
  size: sizeProp,
  variant = 'solid',
  value,
  onValueChange: onValueChangeProp,
  onChange,
  children,
  style,
  disabled = false,
  accessibilityHint,
  nativeID,
  testID,
}: {
  /**
   * The control's accessible name — it is a `radiogroup`/`tablist`, and the
   * segment texts name the OPTIONS rather than the choice. Inside a `Field` the
   * field's label supplies it.
   */
  label?: string;
  type: 'tabs' | 'radio';
  /** `medium` (default); `small` and `large` step around it. */
  size?: SegmentedControlSize;
  /** `solid` (default) draws the track and sliding thumb; `plain` draws neither. */
  variant?: SegmentedControlVariant;
  value: T;
  onValueChange?: (value: T) => void;
  onChange?: (value: T) => void;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /**
   * Disables every segment.
   *
   * A CONSTRAINT the group owns: an item combines it with `||`, so a segment
   * cannot re-enable itself, and a `Field disabled` around the control reaches
   * the segments through it.
   */
  disabled?: boolean;
  accessibilityHint?: string;
  /** The group's id. Supplied by an enclosing `Field` when there is one. */
  nativeID?: string;
  testID?: string;
}) {
  const onValueChange = onValueChangeProp ?? onChange ?? (() => {});
  const theme = useTheme();
  const {size} = useBloomAppearance({size: normalizeBloomSize(sizeProp)}, {size: 'md', tone: 'neutral'});
  useInteractiveWebCss(STYLE_ID, SEGMENTED_CSS);
  // The group is ONE control made of several segments, so a `Field` names the
  // group and disables all of it. `label` is the group's name rather than
  // rendered text, so the field's label only fills in what is missing.
  // `label` is a NAME rather than rendered text (the segments carry the words),
  // so it goes in as the caller's own name and outranks the field's.
  const field = useFieldMembership({ accessibilityLabel: label, disabled, nativeID });
  const isDisabled = field.disabled;
  const palette = useMemo(() => resolveSegmentedPalette(theme), [theme]);
  const [selectedPosition, setSelectedPosition] = useState<{
    width: number;
    x: number;
  } | null>(null);

  const segments = useSharedValue<SegmentPosition[]>([]);
  const dragging = useSharedValue(false);
  const originEnabled = useSharedValue(false);
  const thumbX = useSharedValue(0);
  const thumbWidth = useSharedValue(0);
  const candidate = useSharedValue('');
  const suppressUntil = useRef(0);
  const [release, setRelease] = useState(0);
  // Web: ONE tab stop for the whole group — the chosen segment — as the ARIA
  // radio-group and tab patterns require (`hooks/roving-focus.ts`).
  const groupRef = useRef<View | null>(null);
  useRovingTabIndex(
    () => groupRef.current as unknown as Element | null,
    SEGMENT,
    isChosenSegment,
    GROUP,
  );
  const register = useCallback((segment: SegmentPosition) => {
    segments.value = [...segments.value.filter(item => item.value !== segment.value), segment].sort((a, b) => a.x - b.x);
    return () => { segments.value = segments.value.filter(item => item.value !== segment.value); };
  }, [segments]);
  useLayoutEffect(() => {
    if (!selectedPosition || dragging.value) return;
    const config = { duration: TRANSITION_MS, easing: Easing.bezier(0.25, 0.1, 0.25, 1), reduceMotion: ReduceMotion.System };
    thumbX.value = withTiming(selectedPosition.x, config);
    thumbWidth.value = withTiming(selectedPosition.width, config);
  }, [selectedPosition, release, dragging, thumbX, thumbWidth]);
  const markDrag = useCallback(() => { suppressUntil.current = Date.now() + 500; }, []);
  const finishDrag = useCallback((next: string, commit: boolean) => {
    suppressUntil.current = Date.now() + 250;
    if (commit && next !== value && segments.value.some(item => item.value === next && !item.disabled)) onValueChange(next as T);
    // Also settle when a controlled parent rejects the proposed value.
    setRelease(count => count + 1);
  }, [onValueChange, segments, value]);
  const gesture = useMemo(() => Gesture.Pan()
    .activeOffsetX([-6, 6])
    .failOffsetY([-14, 14])
    .onBegin(event => {
      const origin = segments.value.find(item => event.x >= item.x && event.x <= item.x + item.width);
      originEnabled.value = !!origin && !origin.disabled;
    })
    .onStart(() => {
      if (!originEnabled.value) return;
      dragging.value = true;
      candidate.value = '';
      runOnJS(markDrag)();
    })
    .onUpdate(event => {
      if (!dragging.value) return;
      const enabled = segments.value.filter(item => !item.disabled);
      if (!enabled.length) return;
      let left = enabled[0]!;
      let right = enabled[enabled.length - 1]!;
      for (let index = 0; index < enabled.length; index++) {
        const item = enabled[index]!;
        const center = item.x + item.width / 2;
        if (center <= event.x) left = item;
        if (center >= event.x) { right = item; break; }
      }
      const start = left.x + left.width / 2;
      const end = right.x + right.width / 2;
      const progress = end === start ? 0 : Math.max(0, Math.min(1, (event.x - start) / (end - start)));
      thumbX.value = left.x + (right.x - left.x) * progress;
      thumbWidth.value = left.width + (right.width - left.width) * progress;
      candidate.value = progress < 0.5 ? left.value : right.value;
    })
    .onEnd((_event, success) => {
      if (!dragging.value) return;
      dragging.value = false;
      runOnJS(finishDrag)(candidate.value, success);
    })
    .onFinalize(() => {
      if (!dragging.value) return;
      dragging.value = false;
      runOnJS(finishDrag)('', false);
    }), [segments, originEnabled, dragging, candidate, thumbX, thumbWidth, markDrag, finishDrag]);

  const contextValue = useMemo(() => {
    return {
      register,
      suppressPress: () => dragging.value || Date.now() < suppressUntil.current,
      allowKeyboardPress: () => { suppressUntil.current = 0; },
      type,
      size,
      variant,
      palette,
      disabled: isDisabled,
      selectedValue: value,
      selectedPosition,
      onSelectValue: (
        val: string,
        position: { width: number; x: number } | null,
      ) => {
        onValueChange(val as T);
        // Selection geometry follows the controlled value's item layout effect.
      },
      updatePosition: (position: { width: number; x: number }) => {
        setSelectedPosition(currPos => {
          if (
            currPos &&
            currPos.width === position.width &&
            currPos.x === position.x
          ) {
            return currPos;
          }
          return position;
        });
      },
    };
  }, [value, selectedPosition, setSelectedPosition, onValueChange, type, size, variant, palette, register, dragging, isDisabled]);

  const solid = variant === 'solid';
  const padding = solid ? TRACK_PADDING : 0;
  // The control's height is LOCKED to the segment height plus the track
  // padding. Without it, a parent column flex context (the default on a
  // `<View>`) lets the root stretch vertically and the segments inherit that
  // height, blowing the control up into a giant block on native.
  const height = GEOMETRY[size].height + padding * 2;

  return (
    <GestureDetector gesture={gesture} touchAction="pan-y">
    <View
      ref={groupRef}
      {...webDataSet({ bloomSegmentedGroup: '' })}
      testID={testID}
      nativeID={field.nativeID}
      accessibilityLabel={field.accessibilityLabel}
      accessibilityHint={accessibilityHint ?? ''}
      aria-describedby={field.describedBy}
      aria-invalid={field.invalid || undefined}
      // A `View`, so `aria-disabled` is the only spelling that reaches web —
      // there is no `disabled` prop for react-native-web to derive it from.
      aria-disabled={isDisabled || undefined}
      style={[
        {
          position: 'relative',
          flexDirection: 'row',
          alignItems: 'stretch',
          alignSelf: 'flex-start',
          gap: SEGMENT_GAP,
          height,
          padding,
          borderRadius: borderRadius.full,
          backgroundColor: solid ? palette.track : 'transparent',
        },
        style,
      ]}
      role={type === 'tabs' ? 'tablist' : 'radiogroup'}>
      {solid && selectedPosition !== null && (
        <SegmentedThumb
          x={thumbX}
          width={thumbWidth}
          palette={palette}
        />
      )}
      <InternalContext.Provider value={contextValue}>
        {children}
      </InternalContext.Provider>
    </View>
    </GestureDetector>
  );
}

const InternalItemContext = createContext<{
  active: boolean;
  hovered: boolean;
} | null>(null);

export function SegmentedControlItem({
  value,
  style,
  children,
  onPress: onPressProp,
  accessibilityLabel,
  accessibilityHint,
  testID,
  disabled,
}: {
  value: string;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  testID?: string;
  disabled?: PressableProps['disabled'];
}) {
  const [position, setPosition] = useState<{ x: number; width: number } | null>(
    null,
  );
  const { state: hovered, onIn: onHoverIn, onOut: onHoverOut } =
    useInteractionState();

  const ctx = useContext(InternalContext);
  if (!ctx) {
    throw new Error(
      'SegmentedControlItem must be used within a SegmentedControl',
    );
  }

  const active = ctx.selectedValue === value;

  const needsUpdate =
    active &&
    position &&
    (ctx.selectedPosition?.x !== position.x ||
      ctx.selectedPosition?.width !== position.width);

  // Use a ref to avoid re-running the layout effect when updatePosition changes
  const updatePositionRef = useRef(ctx.updatePosition);
  updatePositionRef.current = ctx.updatePosition;

  const positionRef = useRef(position);
  positionRef.current = position;

  useLayoutEffect(() => {
    if (needsUpdate && positionRef.current) {
      updatePositionRef.current(positionRef.current);
    }
  }, [needsUpdate]);

  const isDisabled = ctx.disabled || disabled === true;

  useLayoutEffect(() => {
    if (position) return ctx.register({ value, ...position, disabled: isDisabled });
  }, [ctx.register, value, position, isDisabled]);

  const onPress = useCallback((event?: GestureResponderEvent) => {
    if (isDisabled || ((event?.nativeEvent as { detail?: number } | undefined)?.detail !== 0 && ctx.suppressPress())) return;
    ctx.onSelectValue(value, position);
    onPressProp?.();
  }, [ctx, value, position, onPressProp, isDisabled]);

  // We render the segment as a flat `Pressable` (not Bloom's `Button`)
  // for two reasons:
  //   1. Layout: the touch target participates directly in the root's row flex
  //      layout, so a caller that stretches the control (`width: '100%'`)
  //      shares the extra space out between the segments.
  //   2. Semantics: the Root carries `role="tablist"`/`"radiogroup"` and
  //      each item carries `role="tab"`/`"radio"`. Bloom Button always
  //      adds `accessibilityRole="button"` — that overrides the correct
  //      a11y role for tablist children.
  const itemRole = ctx.type === 'tabs' ? 'tab' : 'radio';
  const geometry = GEOMETRY[ctx.size];

  // Web keyboard, per the ARIA pattern the group's role names. A radio group
  // answers all four arrows and has no Home/End; a tab strip answers
  // Left/Right plus Home/End. Both select as focus moves — the control is a
  // controlled value with nothing expensive behind a change — and both take
  // Space, which react-native-web only synthesises for `role="button"`. Enter
  // stays with react-native-web's own press. `allowKeyboardPress` first, so a
  // drag's click suppression can never swallow a key.
  const onKeyDown = useCallback(
    (event: { key: string; currentTarget: unknown; preventDefault: () => void }) => {
      ctx.allowKeyboardPress();
      handleRovingKeyDown(event, {
        selector: SEGMENT,
        owner: GROUP,
        orientation: ctx.type === 'tabs' ? 'horizontal' : 'both',
        homeEnd: ctx.type === 'tabs',
        activate: 'follow',
      });
    },
    [ctx],
  );

  const itemStyle: WebCssStyle = {
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    height: geometry.height,
    paddingHorizontal: geometry.paddingHorizontal,
    borderRadius: borderRadius.full,
    opacity: isDisabled ? DISABLED_OPACITY : 1,
    '--bloom-segmented-ring': ctx.palette.ring,
  };

  const itemContext = useMemo(
    () => ({ active, hovered: hovered && !isDisabled }),
    [active, hovered, isDisabled],
  );

  return (
    <View
      style={{ flexGrow: 1, flexDirection: 'row', alignItems: 'stretch' }}
      onLayout={evt => {
        const measuredPosition = {
          x: evt.nativeEvent.layout.x,
          width: evt.nativeEvent.layout.width,
        };
        if (!ctx.selectedPosition && active) {
          ctx.updatePosition(measuredPosition);
        }
        setPosition(measuredPosition);
      }}>
      <Pressable
        {...(IS_WEB ? ({ dataSet: { bloomSegmentedItem: '' }, onKeyDown } as Record<string, unknown>) : {})}
        onPress={onPress}
        onHoverIn={onHoverIn}
        onHoverOut={onHoverOut}
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        // The active state has to be spelled as an `aria-*` prop, because
        // react-native-web never reads `accessibilityState` (React Native folds
        // these back into it, so native is unaffected) — and WHICH prop depends
        // on the role: ARIA gives `tab` a selected state and `radio` a checked
        // one, so a single spelling would be invalid for one of the two modes.
        {...(itemRole === 'tab'
          ? { 'aria-selected': active }
          : { 'aria-checked': active })}
        role={itemRole}
        disabled={isDisabled}
        testID={testID}
        style={[itemStyle, style]}>
        <InternalItemContext.Provider value={itemContext}>
          {children}
        </InternalItemContext.Provider>
      </Pressable>
    </View>
  );
}

export function SegmentedControlItemText({
  style,
  children,
  ...props
}: { children: React.ReactNode; style?: StyleProp<TextStyle> } & Omit<
  React.ComponentProps<typeof Text>,
  'style' | 'children' | 'variant'
>) {
  const ctx = useContext(InternalItemContext);
  const control = useContext(InternalContext);
  if (!ctx || !control) {
    throw new Error(
      'SegmentedControlItemText must be used within a SegmentedControlItem',
    );
  }
  const geometry = GEOMETRY[control.size];
  const emphasised = ctx.active || ctx.hovered;

  const textStyle: TextStyle & WebCssStyle = {
    textAlign: 'center',
    color: emphasised ? control.palette.selectedText : control.palette.text,
    ...(IS_WEB
      ? {
          transitionProperty: 'color',
          transitionDuration: `${TRANSITION_MS}ms`,
          transitionTimingFunction: 'ease',
        }
      : null),
  };

  return (
    <Text
      variant={`${geometry.type}-${ctx.active ? 'medium' : 'regular'}`}
      numberOfLines={1}
      {...props}
      style={[textStyle, style]}>
      {children}
    </Text>
  );
}

/** The selected segment's surface, sliding between segments. */
function SegmentedThumb({
  x,
  width,
  palette,
}: {
  x: SharedValue<number>;
  width: SharedValue<number>;
  palette: SegmentedPalette;
}) {
  const base: ViewStyle = {
    position: 'absolute',
    top: TRACK_PADDING,
    bottom: TRACK_PADDING,
    left: 0,
    borderRadius: borderRadius.full,
    backgroundColor: palette.thumb,
    boxShadow: palette.thumbShadow,
  };

  const animatedStyle = useAnimatedStyle(() => ({
    width: width.value,
    transform: [{ translateX: x.value }],
  }), [x, width]);
  return <Animated.View pointerEvents="none" style={[base, animatedStyle]} />;
}
