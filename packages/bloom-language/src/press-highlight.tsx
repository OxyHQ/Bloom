import { createElement, type ComponentType, type ReactElement, type ReactNode } from 'react';
import { Pressable } from 'react-native';

import { animatedHost } from '@oxy.so/bloom/motion';
import { pressHighlight } from '@oxy.so/bloom/subtle-hover';
import { useThemePaint } from '@oxy.so/bloom/theme';

type HostProps = { children?: ReactNode; [prop: string]: unknown };

/**
 * `host` (a `Pressable`) with Bloom's press highlight (`pressHighlight`), on
 * the host itself: Android's ripple prop, iOS's wash from the host's own
 * pressed state. A view whose press handler is absent takes no highlight, as
 * it takes no press; its children keep their places either way.
 */
function highlighted(host: ComponentType<Record<string, unknown>>) {
  return function PressHighlighted({ children, ...props }: HostProps): ReactElement {
    const lit = props.onPress !== undefined || props.onLongPress !== undefined;
    return createElement(host, { ...props, ...pressHighlight(useThemePaint(), children, lit) });
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
