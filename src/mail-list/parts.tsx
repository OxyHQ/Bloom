import React, { useState } from 'react';
import {
  Linking,
  Pressable,
  StyleSheet,
  View,
  type GestureResponderEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { Chip } from '../chip';
import type { BloomIconComponent } from '../icons/icon-component';
import { RiStarFill } from '../icons/remix/RiStarFill';
import { RiStarLine } from '../icons/remix/RiStarLine';
import { webDataSet } from '../styles/web-data';
import type { WebCssStyle } from '../styles/web-view-style';
import { Text } from '../typography';
import { IS_WEB, MAIL_ROW_RADIUS, type MailPaint } from './shared';
import type { MailLabel, MailStrings } from './types';

// ---------------------------------------------------------------------------
//  The link that covers a row
// ---------------------------------------------------------------------------

export interface MailRowLinkProps {
  /** The whole row, read aloud. */
  name: string;
  onPress?: () => void;
  onLongPress?: () => void;
  href?: string;
  selected?: boolean;
  paint: MailPaint;
  /** Fires on press-in/out so the row can paint itself pressed on native. */
  onPressedChange?: (pressed: boolean) => void;
  testID?: string;
}

/**
 * A ROW'S LINK IS A SIBLING LAID UNDER ITS CONTENT, NOT A WRAPPER AROUND IT.
 *
 * It fills the row absolutely and carries the whole composed name; the avatar,
 * the text lines and the label chips are drawn over it with
 * `pointerEvents="none"`, so a press anywhere on them falls through. The star,
 * the checkbox and the hover rail are drawn over it as their OWN targets — a
 * button inside an anchor is invalid HTML, and nesting them would make every
 * "Archive" click open the message.
 */
export function MailRowLink({
  name,
  onPress,
  onLongPress,
  href,
  selected = false,
  paint,
  onPressedChange,
  testID,
}: MailRowLinkProps) {
  const handlePress = (event: GestureResponderEvent) => {
    if (onPress) {
      if (IS_WEB && href) event.preventDefault();
      onPress();
      return;
    }
    if (!IS_WEB && href) void Linking.openURL(href).catch(() => undefined);
  };
  const interactive = Boolean(onPress || href || onLongPress);
  const style: WebCssStyle = {
    ...StyleSheet.absoluteFillObject,
    borderRadius: MAIL_ROW_RADIUS,
    '--bloom-mail-ring': paint.accent,
  };
  return (
    <Pressable
      {...webDataSet({ bloomMailFocusable: '' })}
      {...(IS_WEB && href ? { href } : null)}
      {...(IS_WEB && selected ? { 'aria-current': 'true' } : null)}
      role={href ? 'link' : interactive ? 'button' : undefined}
      accessibilityLabel={name}
      // `selected` on a row is `aria-current` on web — `aria-selected` is for a
      // tab or an option, and a message row is neither. Native reads the state.
      accessibilityState={{ selected }}
      onPress={onPress || (!IS_WEB && href) ? handlePress : undefined}
      onLongPress={onLongPress}
      onPressIn={onPressedChange ? () => onPressedChange(true) : undefined}
      onPressOut={onPressedChange ? () => onPressedChange(false) : undefined}
      style={style}
      testID={testID}
    />
  );
}

// ---------------------------------------------------------------------------
//  A round glyph button
// ---------------------------------------------------------------------------

export interface MailGlyphButtonProps {
  label: string;
  icon: BloomIconComponent;
  onPress?: () => void;
  size: number;
  glyph: number;
  color: string;
  hoverFill: string;
  ring: string;
  /** A toggle emits `aria-pressed` AND the native state; a plain button emits neither. */
  pressed?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/**
 * The round icon button the hover rail, the star and the selection bar use.
 * Hover and press are a COLOUR CHANGE ONLY — nothing in this family scales.
 */
export function MailGlyphButton({
  label,
  icon: Icon,
  onPress,
  size,
  glyph,
  color,
  hoverFill,
  ring,
  pressed,
  style,
  testID,
}: MailGlyphButtonProps) {
  const [active, setActive] = useState(false);
  const buttonStyle: WebCssStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: active ? hoverFill : 'transparent',
    '--bloom-mail-ring': ring,
    ...(IS_WEB ? { transitionProperty: 'background-color', transitionDuration: '120ms' } : null),
  };
  return (
    <Pressable
      {...webDataSet({ bloomMailFocusable: '' })}
      role="button"
      accessibilityLabel={label}
      // react-native-web drops `accessibilityState` and React Native has no
      // `aria-pressed`, so a toggle spells both. A plain button spells neither:
      // `aria-pressed="false"` announces a state nobody set.
      {...(pressed === undefined
        ? null
        : { 'aria-pressed': pressed, accessibilityState: { selected: pressed } })}
      onPress={onPress}
      onHoverIn={() => setActive(true)}
      onHoverOut={() => setActive(false)}
      onPressIn={() => setActive(true)}
      onPressOut={() => setActive(false)}
      style={[buttonStyle, style]}
      testID={testID}
    >
      <Icon width={glyph} height={glyph} fill={color} />
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
//  The star
// ---------------------------------------------------------------------------

export interface MailStarProps {
  starred: boolean;
  onStarredChange?: (starred: boolean) => void;
  size: number;
  glyph: number;
  paint: MailPaint;
  strings: MailStrings;
  testID?: string;
}

/**
 * Pressable when the app can change it, a plain glyph otherwise — a star that
 * looks like a button and does nothing is worse than no button. The ON state is
 * the accent, because a star is a mark the reader made and not a status.
 */
export function MailStar({
  starred,
  onStarredChange,
  size,
  glyph,
  paint,
  strings,
  testID,
}: MailStarProps) {
  const Icon = starred ? RiStarFill : RiStarLine;
  const color = starred ? paint.accent : paint.textGraphical;
  if (onStarredChange === undefined) {
    return (
      <View aria-hidden importantForAccessibility="no-hide-descendants" testID={testID}>
        <Icon width={glyph} height={glyph} fill={color} />
      </View>
    );
  }
  return (
    <MailGlyphButton
      label={starred ? strings.starred : strings.star}
      icon={Icon}
      pressed={starred}
      onPress={() => onStarredChange(!starred)}
      size={size}
      glyph={glyph}
      color={color}
      hoverFill={paint.selected}
      ring={paint.accent}
      testID={testID}
    />
  );
}

// ---------------------------------------------------------------------------
//  Label chips
// ---------------------------------------------------------------------------

export interface MailLabelChipsProps {
  labels: readonly MailLabel[];
  overflow: number;
  surface: string;
  strings: MailStrings;
  testID?: string;
}

/**
 * The labels a row carries, as `Chip`s in the subtle fill. The tone reaches
 * `resolveAccentColors` through the chip, so nothing here picks a colour.
 *
 * Hidden from assistive technology: the row's composed name already says every
 * label, and the chips are inside the row's `pointerEvents="none"` content.
 */
export function MailLabelChips({
  labels,
  overflow,
  surface,
  strings,
  testID,
}: MailLabelChipsProps) {
  if (labels.length === 0 && overflow === 0) return null;
  return (
    <View
      aria-hidden
      importantForAccessibility="no-hide-descendants"
      style={{ flexDirection: 'row', alignItems: 'center', gap: 4, flexShrink: 0 }}
      testID={testID}
    >
      {labels.map((label) => (
        <Chip
          key={label.id}
          size="small"
          variant="subtle"
          color={label.tone ?? 'default'}
          surface={surface}
          testID={testID ? `${testID}-${label.id}` : undefined}
        >
          {label.name}
        </Chip>
      ))}
      {overflow > 0 ? (
        <Chip
          size="small"
          variant="subtle"
          color="default"
          surface={surface}
          accessibilityLabel={strings.moreLabels(overflow)}
          testID={testID ? `${testID}-overflow` : undefined}
        >
          {`+${overflow}`}
        </Chip>
      ) : null}
    </View>
  );
}

// ---------------------------------------------------------------------------
//  A section heading
// ---------------------------------------------------------------------------

export function MailSectionHeading({
  title,
  paint,
  paddingHorizontal,
  testID,
}: {
  title: string;
  paint: MailPaint;
  paddingHorizontal: number;
  testID?: string;
}) {
  return (
    <View
      role="presentation"
      style={{
        paddingLeft: paddingHorizontal,
        paddingRight: paddingHorizontal,
        paddingTop: 12,
        paddingBottom: 4,
      }}
      testID={testID}
    >
      <Text variant="caption-1-semibold" style={{ color: paint.textTertiary }}>
        {title}
      </Text>
    </View>
  );
}
