// The native hosts compiled output renders through (`@oxy.so/bloom-language/compiled`).
//
// Compiled styles hold numbers only; the colour props hold role names
// (`{ color: 'foreground' }`). A host reads the active palette and pairs each
// hoisted colour map with that palette's style object, built once per palette
// and reused. A theme switch re-renders the themed hosts that subscribe here,
// not the app above them.
//
// Spike: the palette lives in this module. In Bloom it is the palette Bloom's
// theme already resolves (`getResolvedTokens`), not a second store.
import { createElement, useSyncExternalStore } from 'react';
import { Text, View } from 'react-native';

let palette = { foreground: 'rgb(20 20 20)', primary: 'rgb(0 102 204)' };
const listeners = new Set();
let resolved = new WeakMap();

export function setPalette(next) {
  palette = next;
  resolved = new WeakMap();
  for (const listener of listeners) listener();
}

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getPalette() {
  return palette;
}

function colorStyle(colors, active) {
  let style = resolved.get(colors);
  if (!style) {
    style = {};
    for (const property in colors) style[property] = active[colors[property]];
    resolved.set(colors, style);
  }
  return style;
}

function useColorStyle(colors) {
  const active = useSyncExternalStore(subscribe, getPalette, getPalette);
  return colorStyle(colors, active);
}

export function BloomText({ colors, style, ...props }) {
  return createElement(Text, { ...props, style: [style, useColorStyle(colors)] });
}

export function BloomView({ colors, style, ...props }) {
  return createElement(View, { ...props, style: [style, useColorStyle(colors)] });
}
