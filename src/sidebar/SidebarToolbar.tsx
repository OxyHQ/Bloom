import React, { useEffect, useRef, useState } from 'react';
import type { TextInput } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Button, CloseButton } from '../button';
import { useDirectionProps, useIsRtl } from '../hooks/use-is-rtl';
import { RiSearchLine } from '../icons/remix/RiSearchLine';
import { useCommonMessages } from '../locale/common-messages';
import { StyledView } from '../styles/styled-primitives';
import { TextField, TextFieldInput } from '../text-field';
import { useSidebarPalette } from './palette';
import { IS_WEB } from './parts';
import type { SidebarToolbarProps } from './types';

const AnimatedView = Animated.createAnimatedComponent(StyledView);

/** Search and fixed action slots share one row; the sidebar owns its viewport. */
export function SidebarToolbar({
  actions = [],
  search,
  style,
  testID,
}: SidebarToolbarProps) {
  const common = useCommonMessages();
  const palette = useSidebarPalette();
  const direction = useDirectionProps();
  const rtl = useIsRtl();
  const input = useRef<TextInput>(null);
  const trigger = useRef<React.ComponentRef<typeof Button>>(null);
  const [width, setWidth] = useState(0);
  const reduced = useReducedMotion();
  const progress = useSharedValue(Number(search.open));
  useEffect(() => {
    progress.value = reduced
      ? Number(search.open)
      : withTiming(Number(search.open), {
          duration: 300,
          easing: Easing.bezier(0.42, 0, 0.58, 1),
        });
    if (search.open) {
      const frame = requestAnimationFrame(() => input.current?.focus());
      return () => cancelAnimationFrame(frame);
    }
    return undefined;
  }, [search.open, reduced, progress]);
  const slots = actions.length + 1;
  const collapsedWidth = width > 0 ? (width - 8 * (slots - 1)) / slots : 76;
  const searchWidth = useAnimatedStyle(
    () => ({
      width:
        width > 0
          ? collapsedWidth + (width - collapsedWidth) * progress.value
          : progress.value > 0
            ? '100%'
            : collapsedWidth,
    }),
    [width, collapsedWidth, progress],
  );
  const actionsStyle = useAnimatedStyle(() => {
    const hidden = Math.min(1, progress.value * 1.5);
    return {
      opacity: 1 - hidden,
      transform: [{ translateX: (rtl ? -8 : 8) * hidden }, { scale: 1 - 0.05 * hidden }],
    };
  }, [progress, rtl]);
  const close = () => {
    search.onValueChange('');
    search.onOpenChange(false);
    requestAnimationFrame(() => trigger.current?.focus?.());
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
        className="grid h-full grid-cols-3 gap-2"
        style={{ flexDirection: 'row', gap: 8 }}
      >
        <StyledView aria-hidden style={{ flex: 1 }} />
        {actions.map((action, index) => (
          <AnimatedView
            key={index}
            className={`flex transition-[opacity,transform] duration-200 motion-reduce:transition-none ${search.open ? `pointer-events-none ${rtl ? '-translate-x-2' : 'translate-x-2'} scale-95 opacity-0` : 'translate-x-0 scale-100 opacity-100'}`}
            style={[{ flex: 1 }, actionsStyle]}
            pointerEvents={search.open ? 'none' : 'auto'}
            aria-hidden={search.open}
            accessibilityElementsHidden={search.open}
            importantForAccessibility={
              search.open ? 'no-hide-descendants' : 'auto'
            }
            {...(IS_WEB && search.open ? { inert: true } : {})}
          >
            {action}
          </AnimatedView>
        ))}
      </StyledView>
      <AnimatedView
        className="absolute inset-y-0 start-0 z-10 overflow-hidden rounded-full bg-background-tertiary-default transition-[width] duration-300 ease-in-out motion-reduce:transition-none"
        style={[
          {
            position: 'absolute',
            top: 0,
            bottom: 0,
            insetInlineStart: 0,
            borderRadius: 999,
            backgroundColor: palette.tertiary,
          },
          searchWidth,
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
              <TextFieldInput
                inputRef={input}
                label={label}
                placeholder={search.placeholder ?? label}
                value={search.value}
                onChangeText={search.onValueChange}
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
