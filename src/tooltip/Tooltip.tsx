import { useTooltipSize } from './use-tooltip-size';
import { resolveSurfaceMaterial } from '../surface/resolve-surface-material';
import { SurfaceLevelProvider, surfaceFillVars, useSurfaceFill } from '../styles/surface-levels';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ComponentRef,
} from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { Easing, ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SurfacePaint } from '../surface/SurfacePaint';
import { usePopupSurface } from '../platform-surface/context';
import type { PopupSurfaceProps } from '../platform-surface/types';
import { useMenuPalette } from '../floating/menu-palette';
import { atoms as a } from '../styles';
import { OverlayRoot } from '../overlay';
import { Portal } from '../portal';
import {
  ARROW_DEPTH,
  ARROW_HALF_SIZE,
  BUBBLE_MAX_WIDTH,
  MIN_EDGE_SPACE,
  TOOLTIP_OFFSET,
  TOOLTIP_SIZES,
  type TooltipSize,
} from './constants';
import { createTextBubble } from './TextBubble';
import type { TooltipProps } from './types';
import { useDelayedVisibility } from './use-delayed-visibility';
import { TooltipCaret } from './TooltipCaret';
import { useCssSafeAreaInsets } from '../hooks/use-css-safe-area-insets';
import { TooltipDescriptionContext } from '../hooks/use-described-by-hint';

type TooltipContextType = {
  position: 'top' | 'bottom';
  visible: boolean;
  onVisibleChange: (visible: boolean) => void;
  /** `TooltipContent` names its text, so the trigger can say it as its help. */
  setDescription: (description: string | undefined) => void;
};

type TargetMeasurements = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type TargetContextType = {
  targetMeasurements: TargetMeasurements | undefined;
  setTargetMeasurements: (measurements: TargetMeasurements) => void;
  shouldMeasure: boolean;
  /** The trigger's view: a platform popup is anchored to it. */
  targetRef: React.RefObject<ComponentRef<typeof View> | null>;
  /** The tooltip's text, which the trigger's control says after itself on native. */
  description: string | undefined;
};

const TooltipContext = createContext<TooltipContextType>({
  position: 'bottom',
  visible: false,
  onVisibleChange: () => {},
  setDescription: () => {},
});
TooltipContext.displayName = 'TooltipContext';

const TargetContext = createContext<TargetContextType>({
  targetMeasurements: undefined,
  setTargetMeasurements: () => {},
  shouldMeasure: false,
  targetRef: { current: null },
  description: undefined,
});
TargetContext.displayName = 'TargetContext';

export function Tooltip({
  children,
  position = 'bottom',
  visible: visibleProp,
  delay = 0,
  onVisibleChange,
}: TooltipProps) {
  const requestVisible = useDelayedVisibility(visibleProp, delay);
  /**
   * Lagging state to track the externally-controlled visibility of the
   * tooltip, which needs to wait for the target to be measured before
   * actually being shown.
   */
  const [visible, setVisible] = useState<boolean>(false);
  const [targetMeasurements, setTargetMeasurements] = useState<TargetMeasurements | undefined>(
    undefined,
  );
  const targetRef = useRef<ComponentRef<typeof View>>(null);
  // What the tooltip says, as `TooltipContent` names it even while hidden: a
  // Mac's help tag is its control's help, said after the control, so the
  // trigger's control takes it as its hint (`hooks/use-described-by-hint.ts`),
  // unless it is the control's own name (a dock icon's tooltip is its name).
  const [description, setDescription] = useState<string | undefined>(undefined);
  // In the platform's popup the platform places the bubble against the trigger: nothing to measure,
  // so a request is shown at once, in the render that asks for it.
  const placedByPlatform = usePopupSurface() !== null;

  if (requestVisible && !visible && (targetMeasurements || placedByPlatform)) {
    setVisible(true);
  } else if (!requestVisible && visible) {
    setVisible(false);
    setTargetMeasurements(undefined);
  }

  const ctx = useMemo(
    () => ({ position, visible, onVisibleChange, setDescription }),
    [position, visible, onVisibleChange],
  );
  const targetCtx = useMemo(
    () => ({
      targetMeasurements,
      setTargetMeasurements,
      shouldMeasure: requestVisible && !placedByPlatform,
      targetRef,
      description,
    }),
    [requestVisible, placedByPlatform, targetMeasurements, setTargetMeasurements, description],
  );

  return (
    <TooltipContext.Provider value={ctx}>
      <TargetContext.Provider value={targetCtx}>{children}</TargetContext.Provider>
    </TooltipContext.Provider>
  );
}

export function TooltipTrigger({ children }: { children: React.ReactNode }) {
  const { shouldMeasure, setTargetMeasurements, targetRef, description } =
    useContext(TargetContext);
  const [hasLayedOut, setHasLayedOut] = useState(false);

  useEffect(() => {
    if (!shouldMeasure || !hasLayedOut) return;

    targetRef.current?.measure((_x, _y, width, height, x, y) => {
      if (x !== undefined && y !== undefined && width && height) {
        setTargetMeasurements({ x, y, width, height });
      }
    });
  }, [shouldMeasure, setTargetMeasurements, hasLayedOut]);

  return (
    <View collapsable={false} ref={targetRef} onLayout={() => setHasLayedOut(true)}>
      <TooltipDescriptionContext.Provider value={description}>
        {children}
      </TooltipDescriptionContext.Provider>
    </View>
  );
}

export function TooltipContent({
  children,
  label,
  size: sizeProp,
}: {
  children: React.ReactNode;
  label: string;
  /** Explicit size overrides BloomScope; standalone `sm`. Inherited xs/lg clamp to sm/md. */
  size?: TooltipSize;
}) {
  const size = useTooltipSize(sizeProp);
  const { position, visible, onVisibleChange, setDescription } = useContext(TooltipContext);
  const { targetMeasurements, targetRef } = useContext(TargetContext);
  // Named while hidden too: the trigger says it whenever it is reached.
  useLayoutEffect(() => {
    setDescription(label);
    return () => setDescription(undefined);
  }, [setDescription, label]);
  const PopupSurface = usePopupSurface();
  const requestClose = useCallback(() => {
    onVisibleChange(false);
  }, [onVisibleChange]);

  // The platform's popups (a desktop: OxyOS's compositor popup): the bubble in a popup of its own
  // anchored to the trigger, which may extend beyond the trigger's window or panel (a dock's icon
  // in a strip as tall as the dock). It takes no input: presses and the pointer pass through it,
  // as a desktop's tooltip, so it has no backdrop.
  if (PopupSurface) {
    if (!visible) return null;
    return (
      <PopupTooltip
        PopupSurface={PopupSurface}
        anchorRef={targetRef}
        label={label}
        size={size}
        position={position}
        requestClose={requestClose}
      >
        {children}
      </PopupTooltip>
    );
  }

  if (!visible || !targetMeasurements) return null;

  return (
    <Portal>
      {/* `OverlayRoot` takes the tooltip's place in the open-order overlay
          stack, so a tooltip opened over another surface paints above it (see
          `src/overlay/stack.ts`). It mounts past the `visible` guard, so the
          rank tracks opening. */}
      <OverlayRoot>
        <Bubble
          label={label}
          size={size}
          position={position}
          targetMeasurements={targetMeasurements}
          requestClose={requestClose}
        >
          {children}
        </Bubble>
      </OverlayRoot>
    </Portal>
  );
}

function Bubble({
  children,
  label,
  size,
  position,
  requestClose,
  targetMeasurements,
}: {
  children: React.ReactNode;
  label: string;
  size: TooltipSize;
  position: TooltipContextType['position'];
  requestClose: () => void;
  targetMeasurements: TargetMeasurements;
}) {
  const { palette, publishedFill, style: bubbleStyle } = useBubbleStyle(size);
  const insets = useCssSafeAreaInsets(useSafeAreaInsets());
  const dimensions = useWindowDimensions();
  const [bubbleMeasurements, setBubbleMeasurements] = useState<
    | {
        width: number;
        height: number;
      }
    | undefined
  >(undefined);

  const coords = useMemo(() => {
    if (!bubbleMeasurements)
      return {
        computedPosition: position,
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        tipTop: 0,
        tipLeft: 0,
      };

    const { width: ww, height: wh } = dimensions;
    const maxTop = insets.top;
    const maxBottom = wh - insets.bottom;
    const { width: cw, height: ch } = bubbleMeasurements;
    const minLeft = MIN_EDGE_SPACE;
    const maxLeft = ww - minLeft;

    let computedPosition: 'top' | 'bottom' = position;
    let top = targetMeasurements.y + targetMeasurements.height;
    let left = Math.max(minLeft, targetMeasurements.x + targetMeasurements.width / 2 - cw / 2);
    // The caret sits OUTSIDE the bubble and overlaps its 1px border, so its
    // fill covers the border where the two join.
    const tipTranslate = -(ARROW_DEPTH - 1);
    let tipTop = tipTranslate;

    if (left + cw > maxLeft) {
      left -= left + cw - maxLeft;
    }

    const tipLeft = targetMeasurements.x - left + targetMeasurements.width / 2 - ARROW_HALF_SIZE;

    let bottom = top + ch;

    function positionTop() {
      top = top - ch - targetMeasurements.height;
      bottom = top + ch;
      tipTop = ch - 1;
      computedPosition = 'top';
    }

    function positionBottom() {
      top = targetMeasurements.y + targetMeasurements.height;
      bottom = top + ch;
      tipTop = tipTranslate;
      computedPosition = 'bottom';
    }

    if (position === 'top') {
      positionTop();
      if (top < maxTop) {
        positionBottom();
      }
    } else {
      if (bottom > maxBottom) {
        positionTop();
      }
    }

    // A 10px gap (`offset={10}`) between the trigger and the bubble's edge.
    if (computedPosition === 'bottom') {
      top += TOOLTIP_OFFSET;
      bottom += TOOLTIP_OFFSET;
    } else {
      top -= TOOLTIP_OFFSET;
      bottom -= TOOLTIP_OFFSET;
    }

    return {
      computedPosition,
      top,
      bottom,
      left,
      right: left + cw,
      tipTop,
      tipLeft,
    };
  }, [position, targetMeasurements, bubbleMeasurements, insets, dimensions]);

  const requestCloseWrapped = useCallback(() => {
    setBubbleMeasurements(undefined);
    requestClose();
  }, [requestClose]);

  return (
    <>
      {/* Backdrop to close on outside tap */}
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={requestCloseWrapped}
        accessibilityRole="none"
      />
      {/* A `tooltip`, not an `alert`: its text is already the trigger's help
          (said after the control), so the bubble must not interrupt to say it
          again. It stays one element a reader can move to while it is open. */}
      <View
        accessible
        role="tooltip"
        accessibilityHint=""
        accessibilityLabel={label}
        importantForAccessibility="yes"
        accessibilityViewIsModal
        style={[
          a.absolute,
          a.align_start,
          {
            width: BUBBLE_MAX_WIDTH,
            opacity: bubbleMeasurements ? 1 : 0,
            top: coords.top,
            left: coords.left,
          },
        ]}
      >
        <Animated.View
          entering={ZoomIn.easing(Easing.out(Easing.exp))}
          style={{ transformOrigin: opposite(coords.computedPosition) }}
        >
          {/* A light-surface tooltip: `bg-background-primary-default`,
              1px `border-button-default`, `shadow-dropdown`, `sm` 10/6 padding
              on an 8px corner or `md` 12/8 on 10px. */}
          <View
            style={bubbleStyle}
            onLayout={(e) => {
              setBubbleMeasurements({
                width: e.nativeEvent.layout.width,
                height: e.nativeEvent.layout.height,
              });
            }}
          >
            <SurfacePaint
              floating
              fill={palette.surface}
              radius={TOOLTIP_SIZES[size].borderRadius}
            />
            <SurfaceLevelProvider level={1} fill={publishedFill}>
              {children}
            </SurfaceLevelProvider>
          </View>
          {/* After the bubble, so it paints over the border it overlaps. */}
          <TooltipCaret
            position={coords.computedPosition}
            fill={palette.surface}
            stroke={palette.border}
            style={{ position: 'absolute', top: coords.tipTop, left: coords.tipLeft }}
          />
        </Animated.View>
      </View>
    </>
  );
}

/** The bubble's surface, its border and shadow: the same in a portal and in a platform popup. */
function useBubbleStyle(size: TooltipSize) {
  const parentFill = useSurfaceFill();
  const palette = useMenuPalette();
  const publishedFill = resolveSurfaceMaterial({
    fill: palette.surface,
    parentFill: parentFill,
  }).publishedFill;
  return {
    palette,
    publishedFill,
    style: {
      paddingHorizontal: TOOLTIP_SIZES[size].paddingHorizontal,
      paddingVertical: TOOLTIP_SIZES[size].paddingVertical,
      borderRadius: TOOLTIP_SIZES[size].borderRadius,
      borderWidth: 1,
      borderColor: palette.border,
      backgroundColor: 'transparent',
      ...surfaceFillVars(publishedFill),
      boxShadow: palette.shadow,
    },
  };
}

/**
 * The bubble in the platform's popup, `TOOLTIP_OFFSET` from its trigger on the requested side,
 * centred on it, its caret pointing at it. The platform keeps the popup on screen.
 */
function PopupTooltip({
  PopupSurface,
  anchorRef,
  children,
  label,
  size,
  position,
  requestClose,
}: {
  PopupSurface: React.ComponentType<PopupSurfaceProps>;
  anchorRef: React.RefObject<ComponentRef<typeof View> | null>;
  children: React.ReactNode;
  label: string;
  size: TooltipSize;
  position: TooltipContextType['position'];
  requestClose: () => void;
}) {
  const { palette, publishedFill, style } = useBubbleStyle(size);
  // The caret is outside the bubble, overlapping its 1px border; the popup holds both, the caret
  // centred under (or over) the centred bubble.
  const caret = (
    <View style={POPUP_CARET}>
      <TooltipCaret
        position={position}
        fill={palette.surface}
        stroke={palette.border}
        style={{ marginTop: position === 'top' ? -1 : 1 }}
      />
    </View>
  );
  return (
    <PopupSurface
      anchorRef={anchorRef}
      side={position}
      align="center"
      sideOffset={TOOLTIP_OFFSET - ARROW_DEPTH}
      alignOffset={0}
      role="tooltip"
      label={label}
      onDismiss={requestClose}
    >
      {/* As wide as the widest bubble, the bubble centred in it and hugging its text: the popup's
          content is laid out where its trigger is, which may be narrower than the text. */}
      <View style={POPUP_TOOLTIP} accessible accessibilityLabel={label}>
        {position === 'bottom' && caret}
        <View style={style}>
          <SurfacePaint floating fill={palette.surface} radius={TOOLTIP_SIZES[size].borderRadius} />
          <SurfaceLevelProvider level={1} fill={publishedFill}>
            {children}
          </SurfaceLevelProvider>
        </View>
        {position === 'top' && caret}
      </View>
    </PopupSurface>
  );
}

const POPUP_TOOLTIP = { width: BUBBLE_MAX_WIDTH, alignItems: 'center' } as const;
const POPUP_CARET = { height: ARROW_DEPTH, alignSelf: 'stretch', alignItems: 'center' } as const;

function opposite(position: 'top' | 'bottom'): string {
  switch (position) {
    case 'top':
      return 'center bottom';
    case 'bottom':
      return 'center top';
    default:
      return 'center';
  }
}

export const TooltipTextBubble = createTextBubble(TooltipContent);
