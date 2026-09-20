import React, { useState } from 'react';
import {
  Linking,
  Pressable,
  StyleSheet,
  View,
  type AccessibilityActionEvent,
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
import { IS_WEB, MAIL_LABEL_DOT, MAIL_ROW_RADIUS, type MailPaint } from './shared';
import type { MailAction, MailLabel, MailStrings } from './types';

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
  /** Every action the row offers, as platform accessibility actions. */
  actions?: readonly MailAction[];
  onAction?: (key: string) => void;
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
 *
 * `actions` also reaches it as `accessibilityActions`, which is the ONLY path a
 * screen-reader user has to a swipe: the rotor lists them on the row itself.
 * react-native-web drops the prop, and rightly — there the rail is in the tab
 * order and `:focus-within` reveals it.
 */
export function MailRowLink({
  name,
  onPress,
  onLongPress,
  href,
  selected = false,
  paint,
  onPressedChange,
  actions,
  onAction,
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
  const rotor =
    actions === undefined || actions.length === 0
      ? null
      : {
          accessibilityActions: actions.map((action) => ({
            name: action.key,
            label: action.label,
          })),
          onAccessibilityAction: (event: AccessibilityActionEvent) => {
            const match = actions.find((action) => action.key === event.nativeEvent.actionName);
            if (match === undefined) return;
            match.onPress?.();
            onAction?.(match.key);
          },
        };
  return (
    <Pressable
      {...webDataSet({ bloomMailFocusable: '' })}
      {...rotor}
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
  /** No handler, no star: the row draws nothing rather than a dead glyph. */
  onStarredChange?: (starred: boolean) => void;
  size: number;
  glyph: number;
  paint: MailPaint;
  strings: MailStrings;
  testID?: string;
}

/**
 * THE STAR IS DRAWN ONLY WHERE IT IS A CONTROL. With no `onStarredChange` the
 * row draws nothing at all: a star that looks like a button and does nothing is
 * worse than no button, and on a two-line row it is also the widest thing
 * competing with the subject. The state is not lost — `composeMailRowName` says
 * "Starred" either way, which is the reading a marker of that size was ever
 * going to give.
 *
 * The ON state is the accent, because a star is a mark the reader made and not
 * a status.
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
  if (onStarredChange === undefined) return null;
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
//  Label marks — one chip, then dots
// ---------------------------------------------------------------------------

export interface MailLabelMarksProps {
  /** The one label that keeps its name. */
  chip?: MailLabel;
  /** The rest, already resolved to a fill: id and colour, nothing to read. */
  dots: readonly { id: string; color: string }[];
  surface: string;
  testID?: string;
}

/**
 * What a TWO-LINE row draws for its labels: one chip and a dot per label that
 * did not fit. Which labels those are is `labelMarks`, and it is pure.
 *
 * A dot is not a smaller chip. It carries no name, so it is the row saying
 * "there is another one of these" in 8px of the label's own tone — and the
 * row's composed name is where the names are. Hidden from assistive technology
 * for exactly that reason, like every other glyph inside the row's content.
 */
export function MailLabelMarks({ chip, dots, surface, testID }: MailLabelMarksProps) {
  if (chip === undefined && dots.length === 0) return null;
  return (
    <View
      aria-hidden
      importantForAccessibility="no-hide-descendants"
      style={{ flexDirection: 'row', alignItems: 'center', gap: 4, flexShrink: 0 }}
      testID={testID}
    >
      {chip === undefined ? null : (
        <Chip
          size="small"
          variant="subtle"
          color={chip.tone ?? 'default'}
          surface={surface}
          testID={testID ? `${testID}-${chip.id}` : undefined}
        >
          {chip.name}
        </Chip>
      )}
      {dots.map((dot) => (
        <View
          key={dot.id}
          style={{
            width: MAIL_LABEL_DOT,
            height: MAIL_LABEL_DOT,
            borderRadius: MAIL_LABEL_DOT / 2,
            backgroundColor: dot.color,
          }}
          testID={testID ? `${testID}-dot-${dot.id}` : undefined}
        />
      ))}
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
