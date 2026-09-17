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
  Platform,
  Pressable,
  type PressableProps,
  type StyleProp,
  type TextStyle,
  View,
  type ViewStyle,
} from 'react-native';
import Animated, { Easing, LinearTransition } from 'react-native-reanimated';

import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import type { TypeScaleFamily } from '../typography';
import type { Theme } from '../theme/types';
import { useInteractionState } from '../hooks/use-interaction-state';
import { borderRadius } from '../styles/tokens';
import { NOT_DISABLED, interactiveWebCss, useInteractiveWebCss } from '../styles/interactive-web-css';
import type { WebCssStyle } from '../styles/web-view-style';
import { mixColor, resolveButtonRamps } from '../button/shared';

/**
 * A segmented control. Colours come from Bloom's theme through
 * `button/shared.ts` ramps.
 *
 *              small    medium   large
 *   segment h  24       28       36
 *   padding-x  8        10       12
 *   text       body-2   body     body     (-medium selected, -regular not)
 *   control h  32       36       44       (4px track padding, 2px gap)
 *
 *   track      neutral-100 (dark: neutral-925)
 *   thumb      surface (dark: neutral-800), shadow-2xs, slides under the
 *              selected segment over 200ms `ease`
 *   selected   medium weight, primary text
 *   unselected regular weight, neutral-500; hover → primary text (200ms)
 *   disabled   50% opacity
 *   focus      2px accent ring on the segment
 *
 * The track and the thumb are full pills, matching `Button`.
 *
 * `variant="plain"` draws no track, no padding and no thumb — the selected
 * segment reads through its text weight and colour alone.
 */

type SegmentedControlSize = 'small' | 'medium' | 'large';
type SegmentedControlVariant = 'solid' | 'plain';

const GEOMETRY = {
  small: { height: 24, paddingHorizontal: 8, type: 'body-2' },
  medium: { height: 28, paddingHorizontal: 10, type: 'body' },
  large: { height: 36, paddingHorizontal: 12, type: 'body' },
} as const satisfies Record<SegmentedControlSize, { height: number; paddingHorizontal: number; type: TypeScaleFamily }>;

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
  const { accent, neutral: n } = resolveButtonRamps(theme);
  return theme.isDark
    ? {
        // `neutral-925` (#121212), between the 900 and 950 stops.
        track: mixColor(n[900], n[950], 0.4),
        thumb: n[800],
        thumbShadow: '0 1px 0 0 rgba(0, 0, 0, 0.16)',
        selectedText: theme.colors.text,
        text: n[500],
        ring: accent[500],
      }
    : {
        track: n[100],
        thumb: theme.colors.card,
        thumbShadow: '0 1px 0 0 rgba(0, 0, 0, 0.05)',
        selectedText: theme.colors.text,
        text: n[500],
        ring: accent[500],
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

const InternalContext = createContext<{
  type: 'tabs' | 'radio';
  size: SegmentedControlSize;
  variant: SegmentedControlVariant;
  palette: SegmentedPalette;
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
 * <SegmentedControl label="Example" type="radio" value={value} onChange={setValue}>
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
  size = 'medium',
  variant = 'solid',
  value,
  onChange,
  children,
  style,
  accessibilityHint,
}: {
  label: string;
  type: 'tabs' | 'radio';
  /** `medium` (default); `small` and `large` step around it. */
  size?: SegmentedControlSize;
  /** `solid` (default) draws the track and sliding thumb; `plain` draws neither. */
  variant?: SegmentedControlVariant;
  value: T;
  onChange: (value: T) => void;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  accessibilityHint?: string;
}) {
  const theme = useTheme();
  useInteractiveWebCss(STYLE_ID, SEGMENTED_CSS);
  const palette = useMemo(() => resolveSegmentedPalette(theme), [theme]);
  const [selectedPosition, setSelectedPosition] = useState<{
    width: number;
    x: number;
  } | null>(null);

  const contextValue = useMemo(() => {
    return {
      type,
      size,
      variant,
      palette,
      selectedValue: value,
      selectedPosition,
      onSelectValue: (
        val: string,
        position: { width: number; x: number } | null,
      ) => {
        onChange(val as T);
        if (position) setSelectedPosition(position);
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
  }, [value, selectedPosition, setSelectedPosition, onChange, type, size, variant, palette]);

  const solid = variant === 'solid';
  const padding = solid ? TRACK_PADDING : 0;
  // The control's height is LOCKED to the segment height plus the track
  // padding. Without it, a parent column flex context (the default on a
  // `<View>`) lets the root stretch vertically and the segments inherit that
  // height, blowing the control up into a giant block on native.
  const height = GEOMETRY[size].height + padding * 2;

  return (
    <View
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint ?? ''}
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
          x={selectedPosition.x}
          width={selectedPosition.width}
          palette={palette}
        />
      )}
      <InternalContext.Provider value={contextValue}>
        {children}
      </InternalContext.Provider>
    </View>
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

  const onPress = useCallback(() => {
    ctx.onSelectValue(value, position);
    onPressProp?.();
  }, [ctx, value, position, onPressProp]);

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

  const itemStyle: WebCssStyle = {
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    height: geometry.height,
    paddingHorizontal: geometry.paddingHorizontal,
    borderRadius: borderRadius.full,
    opacity: disabled ? 0.5 : 1,
    '--bloom-segmented-ring': ctx.palette.ring,
  };

  const itemContext = useMemo(
    () => ({ active, hovered: hovered && !disabled }),
    [active, hovered, disabled],
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
          ctx.onSelectValue(value, measuredPosition);
        }
        setPosition(measuredPosition);
      }}>
      <Pressable
        {...(IS_WEB ? ({ dataSet: { bloomSegmentedItem: '' } } as Record<string, unknown>) : {})}
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
        disabled={disabled}
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
  x: number;
  width: number;
  palette: SegmentedPalette;
}) {
  const base: ViewStyle = {
    position: 'absolute',
    top: TRACK_PADDING,
    bottom: TRACK_PADDING,
    left: 0,
    width,
    borderRadius: borderRadius.full,
    backgroundColor: palette.thumb,
    boxShadow: palette.thumbShadow,
  };

  if (IS_WEB) {
    const webStyle: WebCssStyle = {
      ...base,
      transform: [{ translateX: x }],
      transitionProperty: 'transform, width',
      transitionDuration: `${TRANSITION_MS}ms`,
      transitionTimingFunction: 'ease',
    };
    return <View pointerEvents="none" style={webStyle} />;
  }

  return (
    <Animated.View
      pointerEvents="none"
      layout={LinearTransition.duration(TRANSITION_MS).easing(Easing.bezier(0.25, 0.1, 0.25, 1))}
      style={[base, { left: x }]}
    />
  );
}
