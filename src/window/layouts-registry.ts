/**
 * The zoom control's layouts (`WindowLayouts`) as the platform's adapter registered them, by
 * importing `@oxy.so/bloom/window/layouts` (`layouts.ts`). `WindowControls` reads it here and
 * never imports the menu itself: a window's controls on every other platform (a web page, a
 * settings modal, a phone's screen) must not link Bloom's `DropdownMenu` and what a phone's sheet
 * needs, which only a platform that lays windows out (`window-layout`) uses.
 *
 * `globalThis`-anchored, as `kbd/window-keys` is, so two copies of Bloom share it.
 */
import type { ComponentType } from 'react';

import type { WindowLayoutsProps } from './types';

declare global {
  var __oxy_so_bloom_window_layouts__: ComponentType<WindowLayoutsProps> | undefined;
}

/** Makes `component` the zoom control's layouts (`@oxy.so/bloom/window/layouts` calls it). */
export function registerWindowLayouts(component: ComponentType<WindowLayoutsProps>): void {
  globalThis.__oxy_so_bloom_window_layouts__ = component;
}

/** The registered layouts, or null when nothing imported `@oxy.so/bloom/window/layouts`. */
export function registeredWindowLayouts(): ComponentType<WindowLayoutsProps> | null {
  return globalThis.__oxy_so_bloom_window_layouts__ ?? null;
}
