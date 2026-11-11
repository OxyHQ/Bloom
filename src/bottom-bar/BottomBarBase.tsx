import { ScrollArea } from '../layout/ScrollArea';
import {
  type ComponentRef,
  useContext,
  useRef,
  useState,
  useCallback,
  useInsertionEffect,
  type ComponentType,
} from 'react';
import { View, Platform } from 'react-native';
import { useKeyboardVisible } from '../hooks/use-keyboard-visible';
import { useEffect } from 'react';
import Animated, {
  useAnimatedReaction,
  useAnimatedStyle,
  interpolate,
  runOnJS,
  useSharedValue,
  useDerivedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDirectionProps } from '../hooks/use-is-rtl';
import { BottomBarSlotContext } from '../layout/bottom-bar-slot';
import { ScreenFooterContext } from '../screen/context';
import { adoptStyleSheet } from '../styles/adopt-style-sheet';
import { dataHook } from '../styles/data-hook';
import { useClaimBottomEdge, useMeasuredBottomEdgeClaim } from '../layout/bottom-edge';
import { FAB_METRICS } from '../fab/constants';
import { windowEdgeGap } from '../layout/edge';
import { useMinimizeState } from '../tab-bar/context';
import {
  EXPANDED_HEIGHT,
  MINIMIZED_HEIGHT,
  BLUR_BLEED,
  MAX_EXPANDED_ITEM_WIDTH,
  ROW_PAD_H,
} from '../tab-bar/shared';
import type { TabBarProps, TabBarButtonProps } from '../tab-bar/types';
import type { ProgressiveBlurProps } from '../progressive-blur/types';
import type { BottomBarProps } from './types';
import { useCssSafeAreaInsets } from '../hooks/use-css-safe-area-insets';
import { UNSET } from '../styles/animated-style';
import { useBorderBoxSize } from '../hooks/use-border-box-size';
import { useWindowWidthClass } from '../hooks/use-width-class';
import { BREAKPOINTS } from '../styles/breakpoints';
import { usePrefersReducedMotion } from '../hooks/use-prefers-reduced-motion';

interface Props extends BottomBarProps {
  Navigation: ComponentType<TabBarProps>;
  Item: ComponentType<TabBarButtonProps>;
  Blur: ComponentType<ProgressiveBlurProps>;
}
export function BottomBarBase({
  Navigation,
  Item,
  Blur,
  items,
  value,
  onValueChange,
  activeProgress,
  onValueLongPress,
  action,
  actionPlacement = 'auto',
  actionBehavior = 'hide',
  navigationVisibility = 'always',
  minimizeProgress,
  hideProgress,
  blur = false,
  maxWidth = 560,
  horizontalInset = 12,
  style,
  testID,
}: Props) {
  const inset = Math.max(0, Number.isFinite(horizontalInset) ? horizontalInset : 12);
  const insets = useCssSafeAreaInsets(useSafeAreaInsets());
  // Logical insets below; react-native-web needs the direction handed to it.
  const dirProps = useDirectionProps();
  const minimize = useMinimizeState();
  const progress = minimizeProgress ?? minimize.progress;
  const reducedMotion = usePrefersReducedMotion();
  const dock = actionBehavior === 'dock' && action != null;
  const sizeClass = useWindowWidthClass(COMPACT_THRESHOLDS);
  const keyboardVisible = useKeyboardVisible();
  const showNavigation =
    navigationVisibility !== 'never' &&
    (navigationVisibility !== 'compact' || sizeClass < BREAKPOINTS.md) &&
    !(dock && keyboardVisible);
  const selected = items.some((item) => item.name === value);
  const dockNavigation = dock && showNavigation && items.length > 0;
  // Folding frees the horizontal lane before the editor descends into it.
  // Both phases are reversible projections of the same scroll signal.
  const navigationProgress = useDerivedValue(() => {
    const amount = reducedMotion ? Number(progress.value > 0.01) : progress.value;
    return dock ? (selected ? Math.min(1, Math.max(0, amount / 0.6)) : 0) : amount;
  }, [dock, reducedMotion, progress, selected]);
  const hideAction = actionBehavior === 'hide' && items.length > 0;
  const [actionHidden, setActionHidden] = useState(() => hideAction && progress.value > 0.01);
  const actionRef = useRef<ComponentRef<typeof View>>(null);
  const [actionWidth, setActionWidth] = useState<number | null>(null);
  const [actionHeight, setActionHeight] = useState<number>(FAB_METRICS.md.diameter);
  const [rowWidth, setRowWidth] = useState(0);
  const actionSpace = action ? (actionWidth ?? FAB_METRICS.md.diameter) + 10 : 0;
  const above = Boolean(
    !dock &&
      action &&
      items.length &&
      (actionPlacement === 'above' ||
        (actionPlacement === 'auto' &&
          rowWidth > 0 &&
          rowWidth - inset * 2 - actionSpace < items.length * 56 + ROW_PAD_H * 2)),
  );
  const footprint =
    EXPANDED_HEIGHT +
    (above ? actionHeight + 10 : Math.max(0, action ? actionHeight - EXPANDED_HEIGHT : 0));
  const navigationWidth = Math.max(
    0,
    Math.min(
      rowWidth - inset * 2 - (above ? 0 : actionSpace),
      items.length * MAX_EXPANDED_ITEM_WIDTH + ROW_PAD_H * 2,
    ),
  );
  // The browser can distribute the row before JavaScript measures it. Keep
  // the comfortable width as the flex basis, shrinking beside the action;
  // a measured zero must not hide navigation in the server-rendered page.
  const navigationStyle =
    Platform.OS === 'web'
      ? {
          width: items.length * MAX_EXPANDED_ITEM_WIDTH + ROW_PAD_H * 2,
          flexShrink: 1,
          minWidth: 0,
        }
      : { width: navigationWidth, minWidth: 0 };
  // Only interaction eligibility crosses to JS; all motion stays on the shared UI signal.
  useAnimatedReaction(
    () => hideAction && progress.value > 0.01,
    (hidden, previous) => {
      if (hidden !== previous) runOnJS(setActionHidden)(hidden);
    },
    [hideAction, progress, setActionHidden],
  );
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const node = actionRef.current as unknown as HTMLElement | null;
    if (!node) return;
    if (actionHidden && node.contains(document.activeElement))
      (document.activeElement as HTMLElement | null)?.blur?.();
    node.inert = actionHidden;
  }, [actionHidden]);
  // Presence follows the same split as the action: the motion stays on the UI
  // signal, and only the halfway crossing reaches JS to drop interaction. An
  // unsupplied `hideProgress` is stood in for by a value nothing writes, because
  // a reaction cannot be registered conditionally.
  const shown = useSharedValue(0);
  const hide = hideProgress ?? shown;
  const rootRef = useRef<ComponentRef<typeof View>>(null);
  const [barHidden, setBarHidden] = useState(() => hide.value > 0.5);
  useAnimatedReaction(
    () => hide.value > 0.5,
    (hidden, previous) => {
      if (hidden !== previous) runOnJS(setBarHidden)(hidden);
    },
    [hide, setBarHidden],
  );
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const node = rootRef.current as unknown as HTMLElement | null;
    if (!node) return;
    if (barHidden && node.contains(document.activeElement))
      (document.activeElement as HTMLElement | null)?.blur?.();
    node.inert = barHidden;
  }, [barHidden]);
  const suppliedBottomInset = useContext(BottomBarSlotContext);
  const bottom = keyboardVisible
    ? 0
    : Math.max(0, windowEdgeGap(insets.bottom) - (suppliedBottomInset ?? 0));
  useClaimBottomEdge(
    dock || keyboardVisible || suppliedBottomInset !== undefined ? 0 : bottom + footprint,
  );
  const footerOwner = useContext(ScreenFooterContext);
  const claimMeasured = useMeasuredBottomEdgeClaim(
    dock && footerOwner == null && suppliedBottomInset === undefined,
  );
  const naturalFootprint = useSharedValue(0);
  const rootMeasurement = useBorderBoxSize(({ height }) => {
    if (dock) {
      naturalFootprint.value = height;
      claimMeasured(height);
    }
  });
  const attachRoot = useCallback(
    (node: ComponentRef<typeof View> | null) => {
      rootRef.current = node;
      rootMeasurement.ref?.(node);
    },
    [rootMeasurement.ref],
  );
  useInsertionEffect(() => {
    if (Platform.OS === 'web') adoptStyleSheet('bloom-bottom-bar-dock', DOCK_CSS);
  }, []);
  const rowStyle = useAnimatedStyle(
    () => ({
      height: dock
        ? UNSET
        : interpolate(
            reducedMotion ? Number(progress.value > 0.01) : progress.value,
            [0, 1],
            [EXPANDED_HEIGHT, MINIMIZED_HEIGHT],
            'clamp',
          ),
    }),
    [progress, reducedMotion, dock, footprint],
  );
  // Not `items.length` in the mapper: a worklet copies `items` whole to the UI
  // runtime, icon elements and all (`worklet-captures.test.ts`).
  const hasItems = items.length > 0;
  const fallbackNavigationWidth = navigationStyle.width;
  const dockNavigationStyle = useAnimatedStyle(() => {
    const amount = navigationProgress.value;
    return {
      width: !dock
        ? fallbackNavigationWidth
        : Platform.OS === 'web'
          ? (`calc(${(1 - amount) * 100}% + ${amount * MINIMIZED_HEIGHT - (1 - amount) * inset * 2}px)` as `${number}%`)
          : amount === 0
            ? UNSET
            : Math.max(MINIMIZED_HEIGHT, rowWidth - inset * 2) * (1 - amount) +
              MINIMIZED_HEIGHT * amount,
      alignSelf: dock ? ('flex-end' as const) : ('auto' as const),
    };
  }, [dock, navigationProgress, rowWidth, inset, fallbackNavigationWidth]);
  const minimumNavigationWidth = items.length * 44 + ROW_PAD_H * 2;
  const navigationMinimumStyle = useAnimatedStyle(
    () => ({
      minWidth: dock
        ? minimumNavigationWidth * (1 - navigationProgress.value) +
          MINIMIZED_HEIGHT * navigationProgress.value
        : UNSET,
    }),
    [dock, minimumNavigationWidth, navigationProgress],
  );
  const actionMeasurement = useBorderBoxSize(({ width, height }) => {
    if (!dock) {
      setActionWidth(width);
      setActionHeight(height);
    }
  });
  const rowMeasurement = useBorderBoxSize(({ width }) => {
    if (!dock || Platform.OS !== 'web') setRowWidth(width);
  });
  const actionStyle = useAnimatedStyle(() => {
    if (dock) {
      const amount =
        dockNavigation && selected
          ? Math.min(1, Math.max(0, reducedMotion ? Number(progress.value > 0.01) : progress.value))
          : 0;
      return {
        width: 'auto' as const,
        opacity: 1,
        marginInlineStart: dockNavigation ? (MINIMIZED_HEIGHT + 10) * navigationProgress.value : 0,
        transform: [
          {
            translateY: dockNavigation
              ? (EXPANDED_HEIGHT + 10) * Math.min(1, Math.max(0, (amount - 0.6) / 0.4))
              : 0,
          },
        ],
      };
    }
    const amount = hideAction
      ? Math.min(1, Math.max(0, reducedMotion ? Number(progress.value > 0.01) : progress.value))
      : 0;
    return {
      width: actionWidth == null ? UNSET : actionWidth * (1 - amount),
      // Logical, and the CSS name rather than RN's `marginStart`: reanimated's
      // web writer hands a mapper's result to RNW's `createReactDOMStyle`,
      // which never rewrites `marginStart`, so the browser would drop it.
      marginInlineStart: hasItems && !above ? 10 * (1 - amount) : 0,
      opacity: 1 - amount,
      transform: [{ scale: 1 - amount * 0.15 }],
    };
  }, [
    progress,
    hideAction,
    reducedMotion,
    actionWidth,
    hasItems,
    above,
    dock,
    dockNavigation,
    navigationProgress,
    selected,
  ]);
  const presenceStyle = useAnimatedStyle(() => {
    const amount = Math.min(1, Math.max(0, reducedMotion ? Number(hide.value > 0.5) : hide.value));
    // The whole footprint, so a gone bar leaves no sliver above the edge.
    return {
      opacity: 1 - amount,
      transform: [{ translateY: amount * (dock ? naturalFootprint.value : bottom + footprint) }],
    };
  }, [hide, reducedMotion, bottom, footprint, dock, naturalFootprint]);
  if ((keyboardVisible && !dock) || (!items.length && !action)) return null;
  return (
    <Animated.View
      {...dirProps}
      ref={dock ? attachRoot : rootRef}
      onLayout={dock ? rootMeasurement.onLayout : undefined}
      {...dataHook('bloomBottomBarDock', dock ? navigationVisibility : undefined)}
      testID={testID}
      pointerEvents={barHidden ? 'none' : 'box-none'}
      accessibilityElementsHidden={barHidden}
      importantForAccessibility={barHidden ? 'no-hide-descendants' : 'auto'}
      aria-hidden={barHidden}
      style={[
        { height: dock ? undefined : bottom + footprint, justifyContent: 'flex-end' },
        style,
        presenceStyle,
      ]}
    >
      {blur && (
        <Blur
          direction="bottom"
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: dock ? '100%' : bottom + footprint + BLUR_BLEED,
          }}
        />
      )}
      <Animated.View
        testID={testID ? `${testID}-row` : undefined}
        {...rowMeasurement}
        {...dataHook('bloomBottomBarRow')}
        pointerEvents="box-none"
        style={[
          {
            justifyContent: dock ? 'flex-start' : items.length ? 'center' : 'flex-end',
            alignSelf: 'center',
            width: '100%',
            maxWidth,
            paddingLeft: inset,
            paddingRight: inset,
            marginBottom: bottom,
            flexDirection: dock ? 'column' : 'row',
            paddingBottom: dockNavigation ? EXPANDED_HEIGHT + 10 : 0,
            alignItems: dock ? 'stretch' : 'center',
          },
          rowStyle,
        ]}
      >
        {items.length > 0 && (
          <Animated.View
            testID={testID ? `${testID}-navigation` : undefined}
            {...dataHook('bloomBottomBarNavigation')}
            style={[
              dock
                ? {
                    position: 'absolute',
                    bottom: 0,
                    insetInlineStart: inset,
                    insetInlineEnd: inset,
                    minWidth: MINIMIZED_HEIGHT,
                    flexShrink: 0,
                  }
                : navigationStyle,
              !showNavigation ? { display: 'none' } : undefined,
              dockNavigationStyle,
            ]}
          >
            <ScrollArea
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={dock ? { width: '100%', minWidth: 0 } : { minWidth: '100%' }}
              scrollbar="never"
            >
              <Animated.View
                style={[
                  dock
                    ? { width: '100%' }
                    : Platform.OS === 'web'
                      ? { width: '100%', minWidth: items.length * 44 + 8 }
                      : { width: Math.max(navigationWidth, items.length * 44 + 8) },
                  dock ? navigationMinimumStyle : undefined,
                ]}
              >
                <Navigation
                  minimizeBehavior={dock ? 'active' : 'compact'}
                  scrollable={
                    !dock && navigationWidth > 0 && navigationWidth < items.length * 44 + 8
                  }
                  embedded
                  blur={false}
                  minimizeProgress={dock && !selected ? shown : progress}
                  activeProgress={activeProgress}
                  onIndexLongPress={
                    onValueLongPress
                      ? (index) => {
                          if (items[index]) onValueLongPress(items[index].name);
                        }
                      : undefined
                  }
                  activeIndex={items.findIndex((item) => item.name === value)}
                  onIndexChange={(index) => {
                    if (items[index]) onValueChange(items[index].name);
                  }}
                >
                  {items.map((item, index) => (
                    <Item key={item.name} item={item} index={index} />
                  ))}
                </Navigation>
              </Animated.View>
            </ScrollArea>
          </Animated.View>
        )}
        {action && (
          <Animated.View
            ref={actionRef}
            pointerEvents={actionHidden ? 'none' : 'auto'}
            accessibilityElementsHidden={actionHidden}
            importantForAccessibility={actionHidden ? 'no-hide-descendants' : 'auto'}
            aria-hidden={actionHidden}
            testID={testID ? `${testID}-action` : undefined}
            {...dataHook('bloomBottomBarAction')}
            style={[
              {
                flexShrink: 0,
                alignItems: dock ? 'stretch' : 'flex-start',
                justifyContent: 'center',
              },

              above
                ? { position: 'absolute', insetInlineEnd: inset, bottom: '100%', marginBottom: 10 }
                : undefined,
              actionStyle,
            ]}
          >
            <View
              testID={testID ? `${testID}-action-content` : undefined}
              {...(dock ? {} : actionMeasurement)}
              style={{
                flexShrink: 0,
                ...(dock || actionWidth == null ? {} : { width: actionWidth }),
              }}
            >
              {action}
            </View>
          </Animated.View>
        )}
      </Animated.View>
    </Animated.View>
  );
}

const COMPACT_THRESHOLDS = [BREAKPOINTS.md] as const;

const DOCK_CSS = `
@media (min-width: ${BREAKPOINTS.md}px) {
  [data-bloom-bottom-bar-dock="compact"] [data-bloom-bottom-bar-navigation] { display: none !important; }
  [data-bloom-bottom-bar-dock="compact"] [data-bloom-bottom-bar-row] { padding-bottom: 0 !important; }
  [data-bloom-bottom-bar-dock="compact"] [data-bloom-bottom-bar-action] { margin-inline-start: 0 !important; transform: none !important; }
}
`;
