import { createElement, Fragment, type ReactElement, type ReactNode } from 'react';
import { Platform, type PressableProps, StyleSheet, View } from 'react-native';

import type { ThemeColors } from '../theme/types';

/** What a row's `Pressable` takes for its press highlight: spread it, children included. */
export interface PressHighlightProps {
  /** Android: the platform ripple, bounded by the row. */
  android_ripple?: PressableProps['android_ripple'];
  /** The row's children; on iOS a function of the `Pressable`'s press. */
  children: PressableProps['children'];
}

type Colors = Pick<ThemeColors, 'contrast50'>;

const styles = StyleSheet.create({
  wash: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none' },
});

const ripples = new WeakMap<Colors, NonNullable<PressableProps['android_ripple']>>();

/**
 * Android: the ripple React Native draws for a `Pressable` (`android_ripple`),
 * one object per palette. The press reaches the view as a command and the
 * ripple animates on the render thread, with no React render.
 */
function ripple(colors: Colors, children: ReactNode, lit: boolean): PressHighlightProps {
  if (!lit) return { children };
  let config = ripples.get(colors);
  if (config === undefined) {
    config = Object.freeze({ color: colors.contrast50, borderless: false });
    ripples.set(colors, config);
  }
  return { android_ripple: config, children };
}

const washes = new WeakMap<Colors, ReactElement>();

/** The wash of a palette: one element, drawn wherever it is placed. */
function washOf(colors: Colors): ReactElement {
  let element = washes.get(colors);
  if (element === undefined) {
    element = createElement(View, {
      style: [styles.wash, { backgroundColor: colors.contrast50 }],
    });
    washes.set(colors, element);
  }
  return element;
}

/**
 * iOS: a wash under the children while the row is held, as a table cell's
 * highlight. The pressed state is the one the row's `Pressable` already holds
 * (its children as a function of it): a press re-renders that `Pressable`
 * alone, and its children, the same elements, are skipped. The wash's slot is
 * first and always there, so the children keep their places (and their state)
 * whether or not the row is `lit`.
 */
function wash(colors: Colors, children: ReactNode, lit: boolean): PressHighlightProps {
  const shown = lit ? washOf(colors) : null;
  const kids = Array.isArray(children) ? children : [children];
  return {
    children: ({ pressed }) => createElement(Fragment, null, pressed ? shown : null, ...kids),
  };
}

/**
 * A pressable row's pressed state on native, in the theme's `contrast50` (the
 * fill an unfilled Bloom control takes while held), drawn on the row's own
 * `Pressable` at no cost: no hook, no state, no effect and no component of its
 * own. Android draws its ripple; iOS lights a wash under the children from the
 * `Pressable`'s own pressed state. The web has the pointer's hover wash
 * (`SubtleHover`) and gets the children back unchanged.
 *
 * Pass `lit` false for a row that takes no press (a `Pressable` without
 * `onPress` still answers a touch); its children keep their places either way.
 *
 * ```tsx
 * const { colors } = useTheme(); // the theme the row already reads
 * <Pressable onPress={open} {...pressHighlight(colors, content, open !== undefined)} />
 * ```
 *
 * A child that takes its own press (a button, a link) holds the touch, so the
 * row does not light; a scroll that takes the touch releases it.
 */
export function pressHighlight(
  colors: Colors,
  children: ReactNode,
  lit = true,
): PressHighlightProps {
  if (Platform.OS === 'android') return ripple(colors, children, lit);
  if (Platform.OS === 'ios') return wash(colors, children, lit);
  return { children };
}
