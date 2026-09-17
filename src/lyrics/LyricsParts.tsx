import React, { memo } from 'react';
import { Pressable, View, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native';

import { webDataSet } from '../checkbox/shared';
import { useInteractionState } from '../hooks/use-interaction-state';
import { borderRadius } from '../styles/tokens';
import type { WebCssStyle } from '../styles/web-view-style';
import { Text } from '../typography';
import type { TypeScaleVariant } from '../typography/scale';
import { IS_WEB } from './shared';
import type { LyricLine, LyricsPalette } from './types';

/** Drawn for a blank synced line. */
export const BREAK_DOTS = '•  •  •';

/** Where a line sits relative to playback. `plain` is unsynced text. */
export type LyricLineState = 'past' | 'active' | 'upcoming' | 'plain';

interface LyricsLineRowProps {
  line: LyricLine;
  index: number;
  state: LyricLineState;
  variant: TypeScaleVariant;
  palette: LyricsPalette;
  onSeekLine?: (line: LyricLine, index: number) => void;
  onLineLayout?: (index: number, event: LayoutChangeEvent) => void;
  /** Blank lines draw a gap this tall. */
  gapHeight: number;
  testID?: string;
}

/**
 * One line. Colour carries the state (past dimmed, active full, upcoming
 * secondary) and the active line takes the heavier weight. Hovering a
 * seekable line draws it in the active colour — a colour change only.
 */
function LyricsLineRowComponent({
  line,
  index,
  state,
  variant,
  palette,
  onSeekLine,
  onLineLayout,
  gapHeight,
  testID,
}: LyricsLineRowProps) {
  const { state: hovered, onIn, onOut } = useInteractionState();
  const seekable = !!onSeekLine && state !== 'plain';
  const blank = line.text.trim().length === 0;
  const color =
    state === 'active' || state === 'plain' || (seekable && hovered)
      ? palette.active
      : state === 'past'
        ? palette.past
        : palette.upcoming;

  const onLayout = onLineLayout ? (event: LayoutChangeEvent) => onLineLayout(index, event) : undefined;

  const rowStyle: StyleProp<ViewStyle> = {
    alignSelf: 'flex-start',
    maxWidth: '100%',
    minHeight: blank ? gapHeight : undefined,
    justifyContent: 'center',
    borderRadius: 8,
  };

  // A blank line is a gap — a verse break, or in synced lyrics an instrumental
  // break, which draws three dots while it is the active line.
  const content = !blank ? (
    <Text variant={variant} style={{ color }}>
      {line.text}
    </Text>
  ) : state !== 'active' ? null : (
    <Text variant="caption-1-bold" style={{ color }}>
      {BREAK_DOTS}
    </Text>
  );

  if (!seekable || blank) {
    return (
      <View
        {...webDataSet({ bloomLyricsLine: state })}
        onLayout={onLayout}
        style={rowStyle}
        testID={testID}
        {...(state === 'active' && IS_WEB ? { 'aria-current': 'true' } : null)}
      >
        {content}
      </View>
    );
  }

  return (
    <Pressable
      {...webDataSet({ bloomLyricsLine: 'seek', bloomLyricsState: state })}
      role="button"
      accessibilityLabel={line.text}
      {...(state === 'active' && IS_WEB ? { 'aria-current': 'true' } : null)}
      onPress={() => onSeekLine?.(line, index)}
      onHoverIn={onIn}
      onHoverOut={onOut}
      onLayout={onLayout}
      style={rowStyle}
      testID={testID}
    >
      {content}
    </Pressable>
  );
}

export const LyricsLineRow = memo(LyricsLineRowComponent);

interface LyricsPillProps {
  label: string;
  onPress: () => void;
  palette: LyricsPalette;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/**
 * The pill button the lyrics draw on their own background: filled in the
 * active text colour with the background as its label, so it keeps the same
 * contrast as the active line whatever `artworkColor` produced.
 */
export function LyricsPill({ label, onPress, palette, style, testID }: LyricsPillProps) {
  const { state: hovered, onIn, onOut } = useInteractionState();
  const { state: pressed, onIn: onPressIn, onOut: onPressOut } = useInteractionState();
  const pillStyle: WebCssStyle = {
    height: 36,
    paddingLeft: 16,
    paddingRight: 16,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: hovered || pressed ? palette.pillHover : palette.pill,
    '--bloom-lyrics-ring': palette.ring,
    ...(IS_WEB ? { transitionProperty: 'background-color', transitionDuration: '150ms' } : null),
  };
  return (
    <Pressable
      {...webDataSet({ bloomLyricsPill: '' })}
      role="button"
      accessibilityLabel={label}
      onPress={onPress}
      onHoverIn={onIn}
      onHoverOut={onOut}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      style={[pillStyle, style]}
      testID={testID}
    >
      <Text variant="body-semibold" numberOfLines={1} style={{ color: palette.onPill }}>
        {label}
      </Text>
    </Pressable>
  );
}
