/**
 * The structures the floating panels repeat, published as parts so a
 * popover body is composed rather than hand-measured. Platform-neutral: the web
 * panel and the native sheet body both inset their content by `p-2.5`
 * (`surface.ts`), which is what the separator bleeds through and what the
 * header/footer `px-2` is measured against — 18px from the panel edge on every
 * side ("panel p-2.5 + row px-2").
 *
 *   PopoverHeader       flex items-center gap-2 px-2 pt-1         (sidebar team menu)
 *   PopoverTitle        text-body-medium text-text-primary        (secondary: group label)
 *   PopoverDescription  text-body-regular text-text-secondary
 *   PopoverFooter       flex items-center gap-3 px-2 pb-2         (sidebar user menu actions)
 *   PopoverSeparator    -mx-2.5 my-2.5 h-px bg-border-button-default
 *
 * Popovers have no close button and no arrow, so neither is a part.
 *
 * ── HOW A CALLER'S CLASS STILL WINS ─────────────────────────────────────────
 *
 * Every default here is INLINE, because the colours are ramp stops that exist
 * as no CSS variable and the geometry has to agree with them. But an inline
 * style beats ANY class on web, so a naive inline default silently outranks
 * whatever the caller passes: `<PopoverSeparator className="bg-red-500" />`
 * painted the palette colour, and `<PopoverHeader className="px-4" />` kept
 * its 8px.
 *
 * So each part omits exactly the properties the caller's utilities NAME, using
 * the same token scan the panel uses (`classChromeOverrides` in `surface.ts`).
 * The parts previously used an all-or-nothing guard instead — drop the colour
 * default if ANY `className` is present — which failed in the other direction:
 * `<PopoverTitle className="mt-1">` lost its colour entirely.
 *
 * The trade-off is real and the panel already made it: on a web build whose
 * Tailwind/NativeWind pipeline is not wired (`AGENTS.md`, "Consumer web CSS
 * pipeline"), a named property falls back to NOTHING rather than to the
 * default. A caller who names it is asking to own it.
 */
import React from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { useMenuPalette } from '../floating/menu-palette';
import { StyledView } from '../styles/styled-primitives';
import { Text } from '../typography';
import { classChromeOverrides, POPOVER_PADDING, type PopoverChromeKey } from './surface';
import type {
  PopoverDescriptionProps,
  PopoverFooterProps,
  PopoverHeaderProps,
  PopoverSeparatorProps,
  PopoverTitleProps,
} from './types';

/**
 * `base` minus the properties the caller's `className` claims.
 *
 * It walks BASE, not the map: a property with no chrome key is one no utility
 * can name, so it is always kept. Walking the map instead would silently drop
 * whatever was added to a part's stylesheet without being classified — the
 * failure would be a missing default, with nothing to report it.
 */
function kept(base: ViewStyle, owned: ReadonlySet<PopoverChromeKey>): ViewStyle {
  if (owned.size === 0) return base;
  const out: ViewStyle = {};
  for (const [property, value] of Object.entries(base)) {
    const key = PROPERTY_KEY[property];
    if (key === undefined || !owned.has(key)) {
      Object.assign(out, { [property]: value });
    }
  }
  return out;
}

/** Which chrome key each style property belongs to. */
const PROPERTY_KEY: Record<string, PopoverChromeKey | undefined> = {
  flexDirection: 'flexDirection',
  alignItems: 'alignItems',
  gap: 'gap',
  paddingLeft: 'paddingLeft',
  paddingRight: 'paddingRight',
  paddingTop: 'paddingTop',
  paddingBottom: 'paddingBottom',
  marginLeft: 'marginLeft',
  marginRight: 'marginRight',
  marginTop: 'marginTop',
  marginBottom: 'marginBottom',
  height: 'height',
  backgroundColor: 'background',
};

export function PopoverHeader({ leading, children, className, style, testID }: PopoverHeaderProps) {
  const owned = classChromeOverrides(className);
  return (
    <StyledView className={className} style={[kept(styles.header, owned), style]} testID={testID}>
      {leading ? <View style={styles.leading}>{leading}</View> : null}
      <View style={styles.headerText}>{children}</View>
    </StyledView>
  );
}

export function PopoverTitle({
  children,
  tone = 'primary',
  numberOfLines = 1,
  className,
  style,
  testID,
}: PopoverTitleProps) {
  const palette = useMenuPalette();
  const color = tone === 'secondary' ? palette.textSecondary : palette.text;
  return (
    <Text
      variant="body-medium"
      numberOfLines={numberOfLines}
      className={className}
      style={[classChromeOverrides(className).has('color') ? null : { color }, style]}
      testID={testID}>
      {children}
    </Text>
  );
}

export function PopoverDescription({
  children,
  numberOfLines = 1,
  className,
  style,
  testID,
}: PopoverDescriptionProps) {
  const palette = useMenuPalette();
  return (
    <Text
      variant="body-regular"
      numberOfLines={numberOfLines}
      className={className}
      style={[
        classChromeOverrides(className).has('color')
          ? null
          : { color: palette.textSecondary },
        style,
      ]}
      testID={testID}>
      {children}
    </Text>
  );
}

export function PopoverFooter({ children, className, style, testID }: PopoverFooterProps) {
  const owned = classChromeOverrides(className);
  return (
    <StyledView className={className} style={[kept(styles.footer, owned), style]} testID={testID}>
      {children}
    </StyledView>
  );
}

export function PopoverSeparator({ className, style, testID }: PopoverSeparatorProps) {
  const palette = useMenuPalette();
  const owned = classChromeOverrides(className);
  return (
    <StyledView
      // Decorative: the sections it divides are announced on their own.
      aria-hidden
      className={className}
      style={[
        kept({ ...styles.separator, backgroundColor: palette.border }, owned),
        style,
      ]}
      testID={testID}
    />
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingLeft: 8,
    paddingRight: 8,
    paddingTop: 4,
  },
  leading: {
    flexShrink: 0,
  },
  headerText: {
    minWidth: 0,
    flexShrink: 1,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingLeft: 8,
    paddingRight: 8,
    paddingBottom: 8,
  },
  separator: {
    height: 1,
    marginLeft: -POPOVER_PADDING,
    marginRight: -POPOVER_PADDING,
    marginTop: 10,
    marginBottom: 10,
  },
});
