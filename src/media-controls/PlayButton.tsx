import { useBloomAppearance } from '../appearance';
import { memo, useMemo } from 'react';
import { StyleSheet } from 'react-native';

import { Button } from '../button';
import { DISABLED_OPACITY } from '../styles/tokens';
import { RiPlayFill } from '../icons/remix/RiPlayFill';
import { useTheme } from '../theme/use-theme';
import { resolveMediaControlsPaint } from './shared';
import { PauseGlyph } from './PauseGlyph';
import { SpinnerRing } from './SpinnerRing';
import type { PlayButtonProps, PlayButtonSize } from './types';
import { useMessages } from '../locale/messages';
import { MEDIA_CONTROLS_MESSAGES } from './messages';

/**
 * The round play / pause button.
 *
 *            diameter   glyph
 *   small    32         16
 *   medium   48         24
 *   large    56         28
 *
 *   accent    accent-500 fill, primaryForeground glyph; hover accent-600
 *             (dark 400), press uses the shared Button state paint
 *   inverse   text-colour fill, background-colour glyph; hover mixes 16% of
 *             the background in
 *   plain     the glyph alone in the text colour; hover turns it accent
 *
 * Colour change only — no scale. `RiPlayFill`'s triangle already sits right of
 * its box's centre (the path spans x 8..19.6 of 24), which puts its visual
 * weight on the circle's centre, so no further nudge is applied.
 *
 * The pause glyph is Bloom's own (`PauseGlyph`), not the stock media one: the
 * stock two-bar pause carries 0.59 × the triangle's ink, so the button changed
 * WEIGHT as it toggled at every size. The measurement and the widened path are
 * in `PauseGlyph.tsx`.
 *
 * Accessibility: a plain `button` whose NAME is the action ("Play Night Drive"
 * / "Pause Night Drive"). It deliberately carries no `aria-pressed`: a toggle
 * button keeps one name and flips its pressed state, whereas this names what
 * pressing does next, and a name that changes AND a pressed state would announce
 * "Pause, pressed" — two answers to one question. `loading` sets `aria-busy`
 * (React Native folds it into `accessibilityState.busy`).
 */

const SIZE_CONFIG: Record<PlayButtonSize, { box: number; glyph: number }> = {
  sm: { box: 32, glyph: 16 },
  md: { box: 48, glyph: 24 },
  lg: { box: 56, glyph: 28 },
};

function PlayButtonComponent({
  playing,
  onPress,
  onLongPress,
  interactive = true,
  size: sizeProp,
  variant = 'accent',
  loading = false,
  disabled = false,
  subject,
  playLabel,
  pauseLabel,
  accessibilityLabel,
  style,
  testID,
}: PlayButtonProps) {
  const { size: inheritedSize } = useBloomAppearance(
    { size: sizeProp },
    { size: 'md', tone: 'neutral' },
  );
  const size = inheritedSize === 'xs' ? 'sm' : inheritedSize;
  const { messages } = useMessages(MEDIA_CONTROLS_MESSAGES);
  const theme = useTheme();
  const paint = useMemo(() => resolveMediaControlsPaint(theme), [theme]);
  const { box, glyph } = SIZE_CONFIG[size];

  const custom = playing ? pauseLabel : playLabel;
  const action = custom ?? (playing ? messages.pause : messages.play);
  const withSubject = (s: string) =>
    custom !== undefined
      ? `${custom} ${s}`
      : playing
        ? messages.pauseSubject(s)
        : messages.playSubject(s);
  const name = accessibilityLabel ?? (subject ? withSubject(subject) : action);
  const plain = variant === 'plain';
  const fill = plain ? 'transparent' : variant === 'inverse' ? paint.inverse : paint.accent;
  const hoverFill = plain
    ? 'transparent'
    : variant === 'inverse'
      ? paint.inverseHover
      : paint.accentHover;
  const color = plain ? paint.text : variant === 'inverse' ? paint.onInverse : paint.onAccent;
  const authoredFill = StyleSheet.flatten(style)?.backgroundColor;
  const Glyph = playing ? PauseGlyph : RiPlayFill;

  return (
    <Button
      interactive={interactive}
      iconOnly
      icon={loading ? undefined : Glyph}
      size={box}
      iconSize={glyph}
      appearance={plain ? 'plain' : 'solid'}
      tone="neutral"
      color={color}
      hoverColor={plain ? paint.accent : color}
      fill={typeof authoredFill === 'string' ? authoredFill : fill}
      hoverFill={typeof authoredFill === 'string' ? authoredFill : hoverFill}
      ring={paint.ring}
      disabled={disabled}
      disabledOpacity={DISABLED_OPACITY}
      aria-busy={loading || undefined}
      accessibilityLabel={interactive ? name : accessibilityLabel}
      onPress={onPress}
      onLongPress={onLongPress}
      style={style}
      testID={testID}
    >
      {loading
        ? (foreground: string) => <SpinnerRing size={glyph} color={foreground} />
        : undefined}
    </Button>
  );
}

export const PlayButton = memo(PlayButtonComponent);
PlayButton.displayName = 'PlayButton';
