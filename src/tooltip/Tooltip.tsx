import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, { Easing, ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
import { TooltipCaret } from './TooltipCaret';

type TooltipContextType = {
  position: 'top' | 'bottom';
  visible: boolean;
  onVisibleChange: (visible: boolean) => void;
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
};

const TooltipContext = createContext<TooltipContextType>({
  position: 'bottom',
  visible: false,
  onVisibleChange: () => {},
});
TooltipContext.displayName = 'TooltipContext';

const TargetContext = createContext<TargetContextType>({
  targetMeasurements: undefined,
  setTargetMeasurements: () => {},
  shouldMeasure: false,
});
TargetContext.displayName = 'TargetContext';

export function Tooltip({
  children,
  position = 'bottom',
  visible: requestVisible,
  onVisibleChange,
}: {
  children: React.ReactNode;
  position?: 'top' | 'bottom';
  visible: boolean;
  onVisibleChange: (visible: boolean) => void;
}) {
  /**
   * Lagging state to track the externally-controlled visibility of the
   * tooltip, which needs to wait for the target to be measured before
   * actually being shown.
   */
  const [visible, setVisible] = useState<boolean>(false);
  const [targetMeasurements, setTargetMeasurements] = useState<
    TargetMeasurements | undefined
  >(undefined);

  if (requestVisible && !visible && targetMeasurements) {
    setVisible(true);
  } else if (!requestVisible && visible) {
    setVisible(false);
    setTargetMeasurements(undefined);
  }

  const ctx = useMemo(
    () => ({ position, visible, onVisibleChange }),
    [position, visible, onVisibleChange],
  );
  const targetCtx = useMemo(
    () => ({
      targetMeasurements,
      setTargetMeasurements,
      shouldMeasure: requestVisible,
    }),
    [requestVisible, targetMeasurements, setTargetMeasurements],
  );

  return (
    <TooltipContext.Provider value={ctx}>
      <TargetContext.Provider value={targetCtx}>
        {children}
      </TargetContext.Provider>
    </TooltipContext.Provider>
  );
}

export function TooltipTrigger({ children }: { children: React.ReactNode }) {
  const { shouldMeasure, setTargetMeasurements } = useContext(TargetContext);
  const [hasLayedOut, setHasLayedOut] = useState(false);
  const targetRef = useRef<View>(null);

  useEffect(() => {
    if (!shouldMeasure || !hasLayedOut) return;

    targetRef.current?.measure((_x, _y, width, height, x, y) => {
      if (x !== undefined && y !== undefined && width && height) {
        setTargetMeasurements({ x, y, width, height });
      }
    });
  }, [shouldMeasure, setTargetMeasurements, hasLayedOut]);

  return (
    <View
      collapsable={false}
      ref={targetRef}
      onLayout={() => setHasLayedOut(true)}>
      {children}
    </View>
  );
}

export function TooltipContent({
  children,
  label,
  size = 'sm',
}: {
  children: React.ReactNode;
  label: string;
  /** `sm` (default) or `md` surface — padding and corner. */
  size?: TooltipSize;
}) {
  const { position, visible, onVisibleChange } = useContext(TooltipContext);
  const { targetMeasurements } = useContext(TargetContext);
  const requestClose = useCallback(() => {
    onVisibleChange(false);
  }, [onVisibleChange]);

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
          requestClose={requestClose}>
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
  const palette = useMenuPalette();
  const insets = useSafeAreaInsets();
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
    let left = Math.max(
      minLeft,
      targetMeasurements.x + targetMeasurements.width / 2 - cw / 2,
    );
    // The caret sits OUTSIDE the bubble and overlaps its 1px border, so its
    // fill covers the border where the two join.
    const tipTranslate = -(ARROW_DEPTH - 1);
    let tipTop = tipTranslate;

    if (left + cw > maxLeft) {
      left -= left + cw - maxLeft;
    }

    const tipLeft =
      targetMeasurements.x -
      left +
      targetMeasurements.width / 2 -
      ARROW_HALF_SIZE;

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
      <View
        accessible
        role="alert"
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
        ]}>
        <Animated.View
          entering={ZoomIn.easing(Easing.out(Easing.exp))}
          style={{ transformOrigin: opposite(coords.computedPosition) }}>
          {/* A light-surface tooltip: `bg-background-primary-default`,
              1px `border-button-default`, `shadow-dropdown`, `sm` 10/6 padding
              on an 8px corner or `md` 12/8 on 10px. */}
          <View
            style={{
              paddingHorizontal: TOOLTIP_SIZES[size].paddingHorizontal,
              paddingVertical: TOOLTIP_SIZES[size].paddingVertical,
              borderRadius: TOOLTIP_SIZES[size].borderRadius,
              borderWidth: 1,
              borderColor: palette.border,
              backgroundColor: palette.surface,
              boxShadow: palette.shadow,
            }}
            onLayout={(e) => {
              setBubbleMeasurements({
                width: e.nativeEvent.layout.width,
                height: e.nativeEvent.layout.height,
              });
            }}>
            {children}
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
