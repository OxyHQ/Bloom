import { ScrollArea } from '../layout/ScrollArea';
import {
  type ComponentRef,
  useContext,
  useRef,
  useState,
  useCallback,
  useMemo,
  useInsertionEffect,
  useLayoutEffect,
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
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDirectionProps, useIsRtl } from '../hooks/use-is-rtl';
import { BottomBarSlotContext } from '../layout/bottom-bar-slot';
import { ScreenFooterContext } from '../screen/context';
import { adoptStyleSheet } from '../styles/adopt-style-sheet';
import { IS_WEB } from '../styles/platform';
import { dataHook } from '../styles/data-hook';
import { useClaimBottomEdge, useMeasuredBottomEdgeClaim } from '../layout/bottom-edge';
import { FAB_METRICS } from '../fab/constants';
import { windowEdgeGap } from '../layout/edge';
import { useMinimizeState } from '../tab-bar/context';
import {
  EXPANDED_HEIGHT,
  MINIMIZED_HEIGHT,
  DOCK_NAVIGATION_PHASE,
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
import { cssLength, type WebCssStyle } from '../styles/web-view-style';
import { DEFAULT_COLLAPSIBLE_TRANSITION } from '../collapsible/use-collapsible-motion';
import { resolveSurfaceTransition } from '../motion/surface-transition';
import { animateWithSpec, motionCss } from '../motion/spec';
import { SearchPresentationContext, SEARCH_EXPAND } from '../search/context';

const DOCK_PRESENCE = '--bloom-dock-navigation-presence';
const SEARCH_LIFT = '--bloom-bottom-search-lift';
const DOCK_TRANSITION = resolveSurfaceTransition(DEFAULT_COLLAPSIBLE_TRANSITION);

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
  actionSizing = 'intrinsic',
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
  const rtl = useIsRtl();
  const minimize = useMinimizeState();
  const progress = minimizeProgress ?? minimize.progress;
  const reducedMotion = usePrefersReducedMotion();
  const dock = actionBehavior === 'dock' && action != null;
  const adaptiveAction = actionSizing === 'adaptive' && !dock;
  const [searchActive, setSearchActive] = useState(false);
  const fillAction = actionSizing === 'fill' || (adaptiveAction && searchActive);
  const searchHost = useMemo(() => ({ compact: true, onActiveChange: setSearchActive }), []);
  const searchLift = useSharedValue(0);
  useLayoutEffect(() => {
    if (!IS_WEB)
      animateWithSpec(
        searchLift,
        adaptiveAction && searchActive ? 1 : 0,
        SEARCH_EXPAND,
        reducedMotion,
      );
  }, [adaptiveAction, searchActive, searchLift, reducedMotion]);
  const searchMotion = motionCss(SEARCH_EXPAND, reducedMotion);
  const searchMotionStyle: WebCssStyle | undefined =
    adaptiveAction && IS_WEB
      ? {
          [SEARCH_LIFT]: searchActive ? '1' : '0',
          transitionProperty: SEARCH_LIFT,
          transitionDuration: searchMotion.duration,
          transitionTimingFunction: searchMotion.easing,
        }
      : undefined;
  const sizeClass = useWindowWidthClass(COMPACT_THRESHOLDS);
  const keyboardVisible = useKeyboardVisible();
  const showNavigation =
    navigationVisibility !== 'never' &&
    (navigationVisibility !== 'compact' || sizeClass < BREAKPOINTS.md) &&
    !(dock && keyboardVisible);
  const present = action != null || (showNavigation && items.length > 0);
  const selected = items.some((item) => item.name === value);
  const dockNavigation = dock && showNavigation && items.length > 0;
  // This is semantic visibility, separate from the scroll folding signal. It
  // releases the navigation footprint continuously while a natural-height
  // editor expands, instead of dropping its entire reserved row in one commit.
  const navigationPresence = useSharedValue(dockNavigation ? 1 : 0);
  useLayoutEffect(() => {
    if (IS_WEB) return;
    const target = dockNavigation ? 1 : 0;
    navigationPresence.value = reducedMotion
      ? target
      : withTiming(target, {
          duration: DOCK_TRANSITION.duration,
          easing: Easing.bezier(...DOCK_TRANSITION.easing),
        });
  }, [dockNavigation, reducedMotion, navigationPresence]);
  const navigationPresenceStyle: WebCssStyle | undefined =
    dock && IS_WEB
      ? {
          [DOCK_PRESENCE]: dockNavigation ? '1' : '0',
          transitionProperty: DOCK_PRESENCE,
          transitionDuration: `${reducedMotion ? 0 : DOCK_TRANSITION.duration}ms`,
          transitionTimingFunction: DOCK_TRANSITION.cssEasing,
        }
      : undefined;
  // Folding frees the horizontal lane before the editor descends into it.
  // Both phases are reversible projections of the same scroll signal.
  const navigationProgress = useDerivedValue(() => {
    const amount = reducedMotion ? Number(progress.value > 0.01) : progress.value;
    return dock
      ? selected
        ? Math.min(1, Math.max(0, amount / DOCK_NAVIGATION_PHASE))
        : 0
      : amount;
  }, [dock, reducedMotion, progress, selected]);
  const hideAction =
    actionBehavior === 'hide' && items.length > 0 && !(adaptiveAction && searchActive);
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
      (adaptiveAction
        ? searchActive
        : actionPlacement === 'above' ||
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
  const footerOwner = useContext(ScreenFooterContext);
  const bottom = keyboardVisible
    ? 0
    : Math.max(0, windowEdgeGap(insets.bottom) - (suppliedBottomInset ?? 0));
  // Screen measures its footer itself. Publishing that same footprint would
  // make the owner mistake its own bar for outer navigation and lift it twice.
  useClaimBottomEdge(
    dock || !present || keyboardVisible || suppliedBottomInset !== undefined || footerOwner != null
      ? 0
      : bottom + footprint,
  );
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
      paddingBottom: !dock
        ? 0
        : IS_WEB
          ? cssLength(`calc(var(--bloom-dock-navigation-presence) * ${EXPANDED_HEIGHT + 10}px)`)
          : (EXPANDED_HEIGHT + 10) * navigationPresence.value,
      height: dock
        ? ('auto' as const)
        : interpolate(
            reducedMotion ? Number(progress.value > 0.01) : progress.value,
            [0, 1],
            [EXPANDED_HEIGHT, MINIMIZED_HEIGHT],
            'clamp',
          ),
    }),
    [progress, reducedMotion, dock, footprint, navigationPresence],
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
        : IS_WEB
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
        : minimumNavigationWidth,
    }),
    [dock, minimumNavigationWidth, navigationProgress],
  );
  const actionMeasurement = useBorderBoxSize(({ width, height }) => {
    if (!dock) {
      if (!fillAction) setActionWidth(width);
      setActionHeight(height);
    }
  });
  const rowMeasurement = useBorderBoxSize(({ width }) => {
    if (!dock || Platform.OS !== 'web') setRowWidth(width);
  });
  const searchShiftX =
    (rtl ? -1 : 1) * Math.max(0, (rowWidth - inset * 2 - navigationWidth - actionSpace) / 2);
  const searchShiftY = (EXPANDED_HEIGHT + actionHeight) / 2 + 10;
  const actionStyle = useAnimatedStyle(() => {
    if (dock) {
      const amount = selected
        ? Math.min(1, Math.max(0, reducedMotion ? Number(progress.value > 0.01) : progress.value))
        : 0;
      return {
        width: 'auto' as const,
        opacity: 1,
        marginInlineStart: IS_WEB
          ? cssLength(
              `calc(var(--bloom-dock-navigation-presence) * ${(MINIMIZED_HEIGHT + 10) * navigationProgress.value}px)`,
            )
          : (MINIMIZED_HEIGHT + 10) * navigationProgress.value * navigationPresence.value,
        transform: [
          {
            translateY: IS_WEB
              ? (`calc(var(--bloom-dock-navigation-presence) * ${(EXPANDED_HEIGHT + 10) * Math.min(1, Math.max(0, (amount - DOCK_NAVIGATION_PHASE) / (1 - DOCK_NAVIGATION_PHASE)))}px)` as `${number}%`)
              : (EXPANDED_HEIGHT + 10) *
                navigationPresence.value *
                Math.min(
                  1,
                  Math.max(0, (amount - DOCK_NAVIGATION_PHASE) / (1 - DOCK_NAVIGATION_PHASE)),
                ),
          },
        ],
      };
    }
    const amount = hideAction
      ? Math.min(1, Math.max(0, reducedMotion ? Number(progress.value > 0.01) : progress.value))
      : 0;
    return {
      width: fillAction
        ? ('auto' as const)
        : actionWidth == null
          ? UNSET
          : actionWidth * (1 - amount),
      // Logical, and the CSS name rather than RN's `marginStart`: reanimated's
      // web writer hands a mapper's result to RNW's `createReactDOMStyle`,
      // which never rewrites `marginStart`, so the browser would drop it.
      marginInlineStart: hasItems && !above ? 10 * (1 - amount) : 0,
      opacity: 1 - amount,
      transform: [
        { scale: 1 - amount * 0.15 },
        {
          translateX: adaptiveAction
            ? IS_WEB
              ? (`calc((var(--bloom-bottom-search-lift) - ${searchActive ? 1 : 0}) * ${searchShiftX}px)` as `${number}%`)
              : (searchLift.value - (searchActive ? 1 : 0)) * searchShiftX
            : 0,
        },
        {
          translateY: adaptiveAction
            ? IS_WEB
              ? (`calc((${searchActive ? 1 : 0} - var(--bloom-bottom-search-lift)) * ${searchShiftY}px)` as `${number}%`)
              : ((searchActive ? 1 : 0) - searchLift.value) * searchShiftY
            : 0,
        },
      ],
    };
  }, [
    progress,
    hideAction,
    reducedMotion,
    actionWidth,
    fillAction,
    adaptiveAction,
    searchActive,
    searchLift,
    searchShiftX,
    searchShiftY,
    hasItems,
    above,
    dock,
    navigationPresence,
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
  // Only explicitly editable actions survive the native keyboard. Existing
  // intrinsic actions retain their previous keyboard dismissal behavior.
  const retainsEditor = dock || (action != null && actionSizing !== 'intrinsic');
  if ((keyboardVisible && !retainsEditor) || !present) return null;
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
        {...(dock && IS_WEB ? {} : rowMeasurement)}
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
            alignItems: dock ? 'stretch' : 'center',
          },
          rowStyle,
          navigationPresenceStyle,
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
                  navigationMinimumStyle,
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
                flexShrink: fillAction ? 1 : 0,
                flexGrow: fillAction && !above && !dock ? 1 : 0,
                minWidth: 0,
                alignItems: dock || fillAction ? 'stretch' : 'flex-start',
                justifyContent: 'center',
              },

              above
                ? {
                    position: 'absolute',
                    insetInlineStart: fillAction ? inset : undefined,
                    insetInlineEnd: inset,
                    bottom: '100%',
                    marginBottom: 10,
                  }
                : undefined,
              actionStyle,
              searchMotionStyle,
            ]}
          >
            <View
              testID={testID ? `${testID}-action-content` : undefined}
              {...(dock ? {} : actionMeasurement)}
              style={{
                flexShrink: 0,
                ...(dock || fillAction || actionWidth == null ? {} : { width: actionWidth }),
              }}
            >
              <SearchPresentationContext.Provider value={adaptiveAction ? searchHost : null}>
                {action}
              </SearchPresentationContext.Provider>
            </View>
          </Animated.View>
        )}
      </Animated.View>
    </Animated.View>
  );
}

const COMPACT_THRESHOLDS = [BREAKPOINTS.md] as const;

const DOCK_CSS = `
@property --bloom-bottom-search-lift {
  syntax: '<number>';
  inherits: true;
  initial-value: 0;
}
@property --bloom-dock-navigation-presence {
  syntax: '<number>';
  inherits: true;
  initial-value: 0;
}
@media (prefers-reduced-motion: reduce) {
  [data-bloom-bottom-bar-row] { transition-duration: 0ms !important; }
}

@media (min-width: ${BREAKPOINTS.md}px) {
  [data-bloom-bottom-bar-dock="compact"] [data-bloom-bottom-bar-navigation] { display: none !important; }
  [data-bloom-bottom-bar-dock="compact"] [data-bloom-bottom-bar-row] { padding-bottom: 0 !important; }
  [data-bloom-bottom-bar-dock="compact"] [data-bloom-bottom-bar-action] { margin-inline-start: 0 !important; transform: none !important; }
}
`;
