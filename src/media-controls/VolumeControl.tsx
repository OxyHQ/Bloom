import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';

import { RiVolumeDownLine } from '../icons/remix/RiVolumeDownLine';
import { RiVolumeMuteLine } from '../icons/remix/RiVolumeMuteLine';
import { RiVolumeUpLine } from '../icons/remix/RiVolumeUpLine';
import { adoptStyleSheet } from '../styles/adopt-style-sheet';
import { borderRadius, DISABLED_OPACITY } from '../styles/tokens';
import type { WebCssStyle } from '../styles/web-view-style';
import { webDataSet } from '../styles/web-data';
import { clamp } from '../styles/clamp';
import { useTheme } from '../theme/use-theme';
import { MediaTrack } from './MediaTrack';
import {
  IS_WEB,
  MEDIA_CONTROLS_CSS,
  MEDIA_CONTROLS_STYLE_ID,
  resolveMediaControlsPaint,
} from './shared';
import type { VolumeControlProps } from './types';

/** The speaker glyph for a level: muted or 0 → mute, under 0.5 → down, else up. */
export function volumeIconFor(volume: number, muted: boolean) {
  if (muted || volume <= 0) return RiVolumeMuteLine;
  return volume < 0.5 ? RiVolumeDownLine : RiVolumeUpLine;
}

/**
 * A speaker button that mutes, beside a short volume slider.
 *
 *   button   32 round, 20px glyph, muted neutral; hover: text colour on a
 *            neutral-100 (dark neutral-800) wash
 *   slider   the family's 4px rail, `sliderWidth` wide (96), 4px after the button
 *
 * The glyph follows the level: `RiVolumeMuteLine` (muted or 0),
 * `RiVolumeDownLine` (under 50%), `RiVolumeUpLine`. While muted the slider draws
 * 0; moving it calls `onMutedChange(false)` as well as `onVolumeChange`.
 *
 * `sliderVisibility="hover"` hides the slider on web until the control is
 * hovered or holds keyboard focus (its width stays reserved, so nothing moves);
 * a device without hover, and native, always shows it.
 *
 * Accessibility: the button is named by the action ("Mute" / "Unmute"); the
 * slider is a `slider` named "Volume" with `aria-valuetext` "40%". Arrows step
 * 5%.
 */
function VolumeControlComponent({
  volume,
  onVolumeChange,
  muted = false,
  onMutedChange,
  sliderWidth = 96,
  sliderVisibility = 'always',
  disabled = false,
  muteLabel = 'Mute',
  unmuteLabel = 'Unmute',
  accessibilityLabel = 'Volume',
  style,
  testID,
}: VolumeControlProps) {
  const theme = useTheme();
  useEffect(() => {
    adoptStyleSheet(MEDIA_CONTROLS_STYLE_ID, MEDIA_CONTROLS_CSS);
  }, []);
  const paint = useMemo(() => resolveMediaControlsPaint(theme), [theme]);
  const [hovered, setHovered] = useState(false);

  const level = clamp(volume, 0, 1);
  const drawn = muted ? 0 : level;
  const Glyph = volumeIconFor(level, muted);

  const change = useCallback(
    (next: number) => {
      const rounded = Math.round(clamp(next, 0, 1) * 100) / 100;
      if (muted && rounded > 0) onMutedChange?.(false);
      onVolumeChange(rounded);
    },
    [muted, onMutedChange, onVolumeChange],
  );
  const valueText = useCallback((v: number) => `${Math.round(v * 100)}%`, []);

  const buttonStyle: WebCssStyle = {
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: hovered && !disabled ? paint.wash : undefined,
    '--bloom-media-ring': paint.ring,
  };

  return (
    <View
      {...webDataSet({
        bloomVolumeControl: '',
        bloomVolumeReveal: IS_WEB ? sliderVisibility : 'always',
      })}
      style={[
        { flexDirection: 'row', alignItems: 'center', gap: 4, opacity: disabled ? DISABLED_OPACITY : 1 },
        style,
      ]}
      testID={testID}
    >
      <Pressable
        {...webDataSet({ bloomMediaFocusable: '' })}
        role="button"
        accessibilityLabel={muted ? unmuteLabel : muteLabel}
        aria-disabled={disabled || undefined}
        accessibilityState={{ disabled }}
        disabled={disabled}
        onHoverIn={() => setHovered(true)}
        onHoverOut={() => setHovered(false)}
        onPress={() => onMutedChange?.(!muted)}
        style={buttonStyle}
        testID={testID ? `${testID}-mute` : undefined}
      >
        <View pointerEvents="none" style={{ width: 20, height: 20 }}>
          <Glyph width={20} height={20} fill={hovered && !disabled ? paint.text : paint.textMuted} />
        </View>
      </Pressable>
      <View {...webDataSet({ bloomVolumeSlider: '' })} style={{ width: sliderWidth, flexDirection: 'row' }}>
        <MediaTrack
          value={drawn}
          max={1}
          onPreview={change}
          onCommit={change}
          step={0.05}
          disabled={disabled}
          accessibilityLabel={accessibilityLabel}
          valueText={valueText}
          style={{ flexGrow: 1 }}
          testID={testID ? `${testID}-slider` : undefined}
        />
      </View>
    </View>
  );
}

export const VolumeControl = memo(VolumeControlComponent);
VolumeControl.displayName = 'VolumeControl';
