import type { CSSProperties } from 'react';
import type { TextStyle, ViewStyle } from 'react-native';

// ---------------------------------------------------------------------------
//  flattenWebStyle — StyleProp → plain CSSProperties, for raw-DOM web forks.
//
//  A handful of Bloom's `.web.tsx` forks (`Button.web.tsx`, `Fab.web.tsx`)
//  render REAL HTML elements through react-dom (`<button>`, `<span>`), NOT
//  react-native-web components. Their `style` prop is therefore a single plain
//  `CSSProperties` object that React commits straight to a live
//  `CSSStyleDeclaration`.
//
//  Callers, however, pass `style` as a React-Native `StyleProp` — most often an
//  ARRAY (`style={[base, cond && override]}`, possibly nested, with falsy holes
//  from `cond && {...}`). Spreading a raw array into an object literal produces
//  numeric keys ("0", "1", …), which React then assigns onto the DOM node's
//  `CSSStyleDeclaration`, throwing:
//    `Failed to set an indexed property [0] on 'CSSStyleDeclaration'`.
//
//  Why NOT `StyleSheet.flatten` (the convention the RNW-component forks such as
//  `list/index.web.tsx` use): these raw-DOM forks have NO other react-native
//  runtime dependency. Reaching for `StyleSheet.flatten` would couple them to
//  the `react-native` → `react-native-web` bundler alias they otherwise never
//  need — a coupling the jsdom test environment does not provide (its
//  `react-native` mock stubs `flatten` as an identity no-op, so an array would
//  pass through unflattened and the raw-DOM render would crash under test). A
//  dependency-free flatten is provably correct in every bundling/test context,
//  so it is the right convention for THIS sub-class of forks specifically.
//
//  `StyleNode` is a readonly-closed recursion type: RN's own `StyleProp` array
//  members are `readonly` and its `RegisteredStyle` members are branded numbers,
//  neither of which is assignable back to `StyleProp` for direct recursion.
//  `StyleProp<ViewStyle>` / `StyleProp<TextStyle>` ARE assignable to it, so call
//  sites pass `style` / `labelStyle` with no cast. Later entries win, mirroring
//  React-Native array-style precedence; falsy holes and unresolved registered-
//  style ids (bare numbers — not resolvable without the RN runtime, and never
//  passed to a raw-DOM fork in practice) are skipped.
// ---------------------------------------------------------------------------

type StyleNode =
  | ViewStyle
  | TextStyle
  | number
  | false
  | null
  | undefined
  | ''
  | ReadonlyArray<StyleNode>;

export function flattenWebStyle(style: StyleNode): CSSProperties {
  if (Array.isArray(style)) {
    return style.reduce<CSSProperties>(
      (merged, entry) => Object.assign(merged, flattenWebStyle(entry)),
      {},
    );
  }
  return style && typeof style === 'object' ? (style as CSSProperties) : {};
}
