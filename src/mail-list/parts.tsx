import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';

import { Chip } from '../chip';
import type { BloomIconComponent } from '../icons/icon-component';
import { RiStarFill } from '../icons/remix/RiStarFill';
import { RiStarLine } from '../icons/remix/RiStarLine';
import { webDataSet } from '../styles/web-data';
import type { WebCssStyle } from '../styles/web-view-style';
import { MAIL_TOUCH_TARGET, type MailPaint } from './shared';
import type { MailLabel, MailStrings } from './types';
import { IS_WEB } from '../styles/platform';
import { useInteractionState } from '../hooks/use-interaction-state';

// ---------------------------------------------------------------------------
//  The link that covers a row
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
  disabled?: boolean;
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
  disabled,
  style,
  testID,
}: MailGlyphButtonProps) {
  // Hover is mirrored (Pressable reports no hover on native); PRESS is read from
  // Pressable itself, so a lost press-out cannot leave the button lit.
  const { state: hovered, onIn: onHoverIn, onOut: onHoverOut } = useInteractionState();
  // The DRAWN control and the TOUCH target are two numbers. A 44-tall button in
  // the row's right column sets the row's height — a list of two-line rows came
  // out at 88 because of it — so the glyph is drawn at `size` and the target is
  // grown back to 44 with `hitSlop`. That is safe here and nowhere near an
  // adjacent control: the star is the only button in the column, and it sits
  // ABOVE the row's link, so the slop takes the press from the link rather than
  // from another button.
  const slop = Math.max(0, Math.round((MAIL_TOUCH_TARGET - size) / 2));
  const buttonStyle = (active: boolean): WebCssStyle => ({
    width: size,
    height: size,
    borderRadius: size / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: active ? hoverFill : 'transparent',
    '--bloom-mail-ring': ring,
    ...(IS_WEB ? { transitionProperty: 'background-color', transitionDuration: '120ms' } : null),
  });
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
      disabled={disabled}
      aria-disabled={disabled || undefined}
      onPress={disabled ? undefined : onPress}
      hitSlop={{ top: slop, bottom: slop, left: slop, right: slop }}
      onHoverIn={onHoverIn}
      onHoverOut={onHoverOut}
      style={({ pressed: down }) => [buttonStyle(hovered || down), style]}
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
  disabled?: boolean;
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
  disabled,
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
      disabled={disabled}
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
          size="sm"
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
          size="sm"
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
