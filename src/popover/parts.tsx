import { useMenuDensity } from '../floating/use-menu-density';
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
 * Every default here is inline, because the colours are ramp stops that exist
 * as no CSS variable and the geometry has to agree with them. A caller's
 * `style` goes over it.
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { useMenuPalette } from '../floating/menu-palette';
import { Text } from '../typography';
import { POPOVER_PADDING } from './surface';
import type {
  PopoverDescriptionProps,
  PopoverFooterProps,
  PopoverHeaderProps,
  PopoverSeparatorProps,
  PopoverTitleProps,
} from './types';

export function PopoverHeader({ leading, children, style, testID }: PopoverHeaderProps) {
  return (
    <View style={[styles.header, style]} testID={testID}>
      {leading ? <View style={styles.leading}>{leading}</View> : null}
      <View style={styles.headerText}>{children}</View>
    </View>
  );
}

export function PopoverTitle({
  children,
  tone = 'primary',
  numberOfLines = 1,
  style,
  testID,
}: PopoverTitleProps) {
  const palette = useMenuPalette();
  const color = tone === 'secondary' ? palette.textSecondary : palette.text;
  return (
    <Text
      variant="body-medium"
      numberOfLines={numberOfLines}
      style={[{ color }, style]}
      testID={testID}
    >
      {children}
    </Text>
  );
}

export function PopoverDescription({
  children,
  numberOfLines = 1,
  style,
  testID,
}: PopoverDescriptionProps) {
  const palette = useMenuPalette();
  return (
    <Text
      variant="body-regular"
      numberOfLines={numberOfLines}
      style={[{ color: palette.textSecondary }, style]}
      testID={testID}
    >
      {children}
    </Text>
  );
}

export function PopoverFooter({ children, style, testID }: PopoverFooterProps) {
  return (
    <View style={[styles.footer, style]} testID={testID}>
      {children}
    </View>
  );
}

export function PopoverSeparator({ style, testID }: PopoverSeparatorProps) {
  const density = useMenuDensity();
  const palette = useMenuPalette();
  return (
    <View
      // Decorative: the sections it divides are announced on their own.
      aria-hidden
      style={[
        {
          ...styles.separator,
          marginLeft: -density.panelPadding,
          marginRight: -density.panelPadding,
          marginTop: density.separatorMargin,
          marginBottom: density.separatorMargin,
          backgroundColor: palette.border,
        },
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
