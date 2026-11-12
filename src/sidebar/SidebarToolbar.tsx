import React, { type ComponentRef, useEffect, useRef, useState } from 'react';
import type { TextInput } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Button, CloseButton } from '../button';
import { useDirectionProps, useIsRtl } from '../hooks/use-is-rtl';
import { RiSearchLine } from '../icons/remix/RiSearchLine';
import { useCommonMessages } from '../locale/common-messages';
import { StyledView } from '../styles/styled-primitives';
import { TextField, TextFieldIcon, TextFieldInput } from '../text-field';
import { useSidebarPalette } from './palette';

import type { SidebarToolbarProps } from './types';
import { IS_WEB } from '../styles/platform';
import { usePrefersReducedMotion } from '../hooks/use-prefers-reduced-motion';

const AnimatedView = Animated.createAnimatedComponent(StyledView);

/** How long after the field loses focus the empty search closes. */
const BLUR_CLOSE_MS = 150;
/** Between two slots of the row. */
const SLOT_GAP = 8;

/**
 * The search's slot and one per action share the row in equal parts, however many actions there
 * are; the closed search covers the first slot and opens across all of them. The sidebar owns its
 * viewport.
 */
export function SidebarToolbar({ actions = [], search, style, testID }: SidebarToolbarProps) {
  const common = useCommonMessages();
  const palette = useSidebarPalette();
  const direction = useDirectionProps();
  const rtl = useIsRtl();
  const input = useRef<ComponentRef<typeof TextInput>>(null);
  const trigger = useRef<React.ComponentRef<typeof Button>>(null);
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
    if (search.open) {
      const frame = requestAnimationFrame(() => input.current?.focus());
      return () => cancelAnimationFrame(frame);
    }
    return undefined;
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
  const close = () => {
    search.onValueChange('');
    search.onOpenChange(false);
    requestAnimationFrame(() => trigger.current?.focus?.());
  };
  // Leaving the field leaves the search when nothing was typed: an empty field open on its own is
  // only in the way. With text it stays, so the filter it applies is never hidden. The decision waits
  // a moment so that a press on the field's own clear button (which blurs the field first) is
  // that button's, and the value it reads is the latest one.
  const value = useRef(search.value);
  value.current = search.value;
  const onBlur = () => {
    setTimeout(() => {
      if (value.current === '') search.onOpenChange(false);
    }, BLUR_CLOSE_MS);
  };
  const label = search.accessibilityLabel ?? common.search;
  return (
    <StyledView
      {...direction}
      testID={testID}
      className="relative h-9 shrink-0"
      style={[{ height: 36 }, style]}
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
    >
      <StyledView
        testID={testID ? `${testID}-slots` : undefined}
        className="h-full flex-row gap-2"
        style={{ height: '100%', flexDirection: 'row', gap: SLOT_GAP }}
      >
        <StyledView aria-hidden style={{ flex: 1, minWidth: 0 }} />
        {actions.map((action, index) => (
          <AnimatedView
            key={index}
            className={`flex ${IS_WEB ? `transition-[opacity,transform] duration-200 motion-reduce:transition-none ${search.open ? `pointer-events-none ${rtl ? '-translate-x-2' : 'translate-x-2'} scale-95 opacity-0` : 'translate-x-0 scale-100 opacity-100'}` : ''}`}
            style={[{ flex: 1, minWidth: 0 }, !IS_WEB && actionsStyle]}
            pointerEvents={search.open ? 'none' : 'auto'}
            aria-hidden={search.open}
            accessibilityElementsHidden={search.open}
            importantForAccessibility={search.open ? 'no-hide-descendants' : 'auto'}
            {...(IS_WEB && search.open ? { inert: true } : {})}
          >
            {action}
          </AnimatedView>
        ))}
      </StyledView>
      <AnimatedView
        testID={testID ? `${testID}-search` : undefined}
        className={`absolute inset-y-0 start-0 z-10 overflow-hidden rounded-full bg-background-tertiary-default ${IS_WEB ? 'transition-[width] duration-300 ease-in-out motion-reduce:transition-none' : ''}`}
        style={[
          {
            position: 'absolute',
            top: 0,
            bottom: 0,
            insetInlineStart: 0,
            borderRadius: 999,
            backgroundColor: palette.tertiary,
          },
          IS_WEB ? { width: search.open ? '100%' : webCollapsedWidth } : searchWidth,
        ]}
      >
        {!search.open ? (
          <Button
            ref={trigger}
            appearance="subtle"
            tone="neutral"
            iconOnly
            leadingIcon={RiSearchLine}
            accessibilityLabel={label}
            aria-expanded={false}
            className="absolute inset-0 w-full min-w-0 rounded-full border-0 bg-background-tertiary-default text-foreground-icon-secondary shadow-none transition-opacity duration-150 hover:bg-background-tertiary-hover active:bg-background-tertiary-hover motion-reduce:transition-none"
            style={{
              borderWidth: 0,
              borderRadius: 999,
              width: '100%',
              height: 36,
            }}
            onPress={() => search.onOpenChange(true)}
          />
        ) : (
          <StyledView
            className="relative transition-opacity duration-150 motion-reduce:transition-none"
            style={{ flex: 1 }}
          >
            <TextField
              radius={999}
              style={{
                height: 36,
                borderWidth: 0,
                backgroundColor: palette.tertiary,
                paddingInlineStart: 12,
                paddingInlineEnd: 36,
              }}
            >
              <TextFieldIcon icon={RiSearchLine} />
              <TextFieldInput
                inputRef={input}
                label={label}
                placeholder={search.placeholder ?? label}
                value={search.value}
                onChangeText={search.onValueChange}
                onBlur={onBlur}
                onKeyPress={(event) => {
                  if (event.nativeEvent.key === 'Escape') close();
                }}
              />
            </TextField>
            <StyledView
              className="absolute end-2 top-2"
              style={{ position: 'absolute', insetInlineEnd: 8, top: 8 }}
            >
              <CloseButton
                accessibilityLabel={search.closeLabel ?? common.close}
                size="xs"
                onPress={close}
              />
            </StyledView>
          </StyledView>
        )}
      </AnimatedView>
    </StyledView>
  );
}
