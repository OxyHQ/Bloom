import { createElement, type ComponentType, type ReactElement, type ReactNode } from 'react';
import { Pressable } from 'react-native';

import { animatedHost } from '@oxy.so/bloom/motion';
import { SubtleHover, usePressHighlight } from '@oxy.so/bloom/subtle-hover';

type Handler = ((event: unknown) => void) | undefined;
type HostProps = {
  children?: ReactNode;
  onPressIn?: Handler;
  onPressOut?: Handler;
  [prop: string]: unknown;
};

/**
 * `host` (a `Pressable`) with Bloom's press highlight (`usePressHighlight`):
 * Android's ripple, iOS's wash under the children. A view whose press handler
 * is absent takes no highlight, as it takes no press. The host's own press
 * handlers (a variant's state, a press scale) run after the highlight's.
 */
function highlighted(host: ComponentType<Record<string, unknown>>) {
  return function PressHighlighted({
    children,
    onPressIn,
    onPressOut,
    ...props
  }: HostProps): ReactElement {
    const { hostProps, pressed } = usePressHighlight();
    const kids = Array.isArray(children) ? children : [children];
    // The wash's slot is always first, so the children keep their places
    // (and their state) when a press handler comes or goes.
    if (props.onPress === undefined && props.onLongPress === undefined)
      return createElement(host, { ...props, onPressIn, onPressOut }, null, ...kids);
    const lightIn = hostProps.onPressIn;
    const lightOut = hostProps.onPressOut;
    return createElement(
      host,
      {
        ...props,
        android_ripple: hostProps.android_ripple,
        onPressIn:
          lightIn === undefined
            ? onPressIn
            : (event: unknown) => {
                lightIn();
                onPressIn?.(event);
              },
        onPressOut:
          lightOut === undefined
            ? onPressOut
            : (event: unknown) => {
                lightOut();
                onPressOut?.(event);
              },
      },
      pressed === undefined ? null : createElement(SubtleHover, { pressed }),
      ...kids,
    );
  };
}

/**
 * The press host of a hover group on Android and iOS (`.hoverGroup()` on a
 * view that takes a press): React Native's `Pressable`, highlighted.
 */
export const PressHighlighted = highlighted(Pressable as ComponentType<Record<string, unknown>>);

/** `PressHighlighted` on the animated `Pressable`: a moving or press-scaled hover group. */
export const AnimatedPressHighlighted = highlighted(
  animatedHost(Pressable) as ComponentType<Record<string, unknown>>,
);
