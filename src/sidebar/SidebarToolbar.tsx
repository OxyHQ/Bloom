import { useTouchInput } from '../styles/pointer';
import { BUTTON_GEOMETRY, BUTTON_TOUCH_TARGET } from '../button/shared';
import { useEffect, useState } from 'react';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Search } from '../search';
import { useDirectionProps, useIsRtl } from '../hooks/use-is-rtl';
import { useCommonMessages } from '../locale/common-messages';
import { View, type ViewStyle } from 'react-native';

import type { SidebarToolbarProps } from './types';
import { IS_WEB } from '../styles/platform';
import { usePrefersReducedMotion } from '../hooks/use-prefers-reduced-motion';

const AnimatedView = Animated.createAnimatedComponent(View);

/** Tailwind's default ease, `cubic-bezier(0.4, 0, 0.2, 1)`. */
const EASE = 'cubic-bezier(0.4, 0, 0.2, 1)';

/** The web's actions fade and slide aside as the search opens (CSS transitions). */
function webActionStyle(open: boolean, rtl: boolean, reduced: boolean): ViewStyle {
  return {
    transitionProperty: reduced ? 'none' : 'opacity,transform',
    transitionDuration: '200ms',
    transitionTimingFunction: EASE,
    ...(open
      ? { translate: rtl ? '-8px' : '8px', scale: '95% 95%', opacity: 0 }
      : { translate: '0px', scale: '100% 100%', opacity: 1 }),
  } as unknown as ViewStyle;
}

/** The web's search widens across the row in CSS. */
function webSearchTransition(reduced: boolean): ViewStyle {
  return {
    transitionProperty: reduced ? 'none' : 'width',
    transitionDuration: '300ms',
    transitionTimingFunction: EASE,
  } as unknown as ViewStyle;
}

/** Between two slots of the row. */
const SLOT_GAP = 8;

/**
 * The search's slot and one per action share the row in equal parts, however many actions there
 * are; the closed search covers the first slot and opens across all of them. The sidebar owns its
 * viewport.
 */
export function SidebarToolbar({ actions = [], search, style, testID }: SidebarToolbarProps) {
  const common = useCommonMessages();
  const touch = useTouchInput();
  const height = Math.max(BUTTON_GEOMETRY.md.height, touch ? BUTTON_TOUCH_TARGET : 0);
  const direction = useDirectionProps();
  const rtl = useIsRtl();
  const [width, setWidth] = useState(0);
  const reduced = usePrefersReducedMotion();
  const progress = useSharedValue(Number(search.open));
  const actionsProgress = useSharedValue(Number(search.open));
  useEffect(() => {
    // The browser owns its CSS transition. Feeding intermediate Reanimated
    // widths into it restarts that transition every frame and doubles the lag.
    if (!IS_WEB) {
      const easing = Easing.bezier(0.4, 0, 0.2, 1);
      progress.value = reduced
        ? Number(search.open)
        : withTiming(Number(search.open), { duration: 300, easing });
      actionsProgress.value = reduced
        ? Number(search.open)
        : withTiming(Number(search.open), { duration: 200, easing });
    }
  }, [search.open, reduced, progress, actionsProgress]);
  const slots = actions.length + 1;
  const gaps = SLOT_GAP * (slots - 1);
  // The first slot's width. Web states it in CSS, so it holds before any layout and through
  // resizes; native animates between numbers, so it measures the row (a share of it until then).
  const webCollapsedWidth = slots === 1 ? '100%' : `calc((100% - ${gaps}px) / ${slots})`;
  const collapsedWidth = width > 0 ? (width - gaps) / slots : null;
  const searchWidth = useAnimatedStyle(
    () => ({
      width:
        collapsedWidth != null
          ? collapsedWidth + (width - collapsedWidth) * progress.value
          : progress.value > 0
            ? '100%'
            : `${100 / slots}%`,
    }),
    [width, collapsedWidth, slots, progress],
  );
  const actionsStyle = useAnimatedStyle(() => {
    const hidden = actionsProgress.value;
    return {
      opacity: 1 - hidden,
      transform: [{ translateX: (rtl ? -8 : 8) * hidden }, { scale: 1 - 0.05 * hidden }],
    };
  }, [actionsProgress, rtl]);
  const label = search.accessibilityLabel ?? common.search;
  return (
    <View
      {...direction}
      testID={testID}
      style={[{ position: 'relative', flexShrink: 0, height }, style]}
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
    >
      <View
        testID={testID ? `${testID}-slots` : undefined}
        style={{ height: '100%', flexDirection: 'row', gap: SLOT_GAP }}
      >
        <View aria-hidden style={{ flex: 1, minWidth: 0 }} />
        {actions.map((action, index) => (
          <AnimatedView
            key={index}
            style={[
              { flex: 1, minWidth: 0 },
              IS_WEB ? webActionStyle(search.open, rtl, reduced) : actionsStyle,
            ]}
            pointerEvents={search.open ? 'none' : 'auto'}
            aria-hidden={search.open}
            accessibilityElementsHidden={search.open}
            importantForAccessibility={search.open ? 'no-hide-descendants' : 'auto'}
            {...(IS_WEB && search.open ? { inert: true } : {})}
          >
            {action}
          </AnimatedView>
        ))}
      </View>
      <AnimatedView
        testID={testID ? `${testID}-search` : undefined}
        style={[
          {
            position: 'absolute',
            insetBlock: 0,
            zIndex: 10,
            overflow: 'hidden',
            top: 0,
            bottom: 0,
            insetInlineStart: 0,
            borderRadius: 999,
          },
          IS_WEB ? webSearchTransition(reduced) : null,
          IS_WEB ? { width: search.open ? '100%' : webCollapsedWidth } : searchWidth,
        ]}
      >
        <Search
          presentation="collapsible"
          open={search.open}
          onOpenChange={search.onOpenChange}
          value={search.value}
          onValueChange={search.onValueChange}
          onClearText={() => search.onValueChange('')}
          clearOnClose
          label={label}
          placeholder={search.placeholder ?? label}
          closeLabel={search.closeLabel ?? common.close}
          triggerProps={{ style: { width: '100%' } }}
        />
      </AnimatedView>
    </View>
  );
}
