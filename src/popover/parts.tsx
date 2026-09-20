/**
 * The structures BoardUI's floating panels repeat, published as parts so a
 * popover body is composed rather than hand-measured. Platform-neutral: the web
 * panel and the native sheet body both inset their content by `p-2.5`
 * (`surface.ts`), which is what the separator bleeds through and what the
 * header/footer `px-2` is measured against — 18px from the panel edge on every
 * side, BoardUI's own arithmetic ("panel p-2.5 + row px-2").
 *
 *   PopoverHeader       flex items-center gap-2 px-2 pt-1         (dashboard team menu)
 *   PopoverTitle        text-body-medium text-text-primary        (secondary: group label)
 *   PopoverDescription  text-body-regular text-text-secondary
 *   PopoverFooter       flex items-center gap-3 px-2 pb-2         (user menu actions)
 *   PopoverSeparator    -mx-2.5 my-2.5 h-px bg-border-button-default
 *
 * BoardUI has no close button and no arrow on any popover, so neither is a part.
 *
 * Colours are resolved inline from `menu-palette.ts`; a text colour default is
 * applied only when the caller passes no `className`, so a `text-*` utility is
 * never outranked (AGENTS.md, "Style and `className`").
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { useMenuPalette } from '../floating/menu-palette';
import { StyledView } from '../styles/styled-primitives';
import { Text } from '../typography';
import { POPOVER_PADDING } from './surface';
import type {
  PopoverDescriptionProps,
  PopoverFooterProps,
  PopoverHeaderProps,
  PopoverSeparatorProps,
  PopoverTitleProps,
} from './types';

export function PopoverHeader({ leading, children, className, style, testID }: PopoverHeaderProps) {
  return (
    <StyledView className={className} style={[styles.header, style]} testID={testID}>
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
      style={[className ? null : { color }, style]}
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
      style={[className ? null : { color: palette.textSecondary }, style]}
      testID={testID}>
      {children}
    </Text>
  );
}

export function PopoverFooter({ children, className, style, testID }: PopoverFooterProps) {
  return (
    <StyledView className={className} style={[styles.footer, style]} testID={testID}>
      {children}
    </StyledView>
  );
}

export function PopoverSeparator({ className, style, testID }: PopoverSeparatorProps) {
  const palette = useMenuPalette();
  return (
    <StyledView
      // Decorative: the sections it divides are announced on their own.
      aria-hidden
      className={className}
      style={[styles.separator, { backgroundColor: palette.border }, style]}
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
