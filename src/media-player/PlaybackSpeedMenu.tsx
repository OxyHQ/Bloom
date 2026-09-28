import React, { memo } from 'react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '../dropdown-menu';
import { RiCheckLine } from '../icons/remix/RiCheckLine';
import { useTheme } from '../theme/use-theme';
import { PlayerIconButton } from './PlayerIconButton';
import { formatPlaybackRate, PLAYBACK_RATES, TRANSPORT_GEOMETRY } from './shared';
import type { PlaybackSpeedMenuProps } from './types';
import { useMessages } from '../locale/messages';
import { MEDIA_PLAYER_MESSAGES } from './messages';

/** The heading and radio rows, shared by the menu and anything that hosts them in its own menu. */
export function PlaybackSpeedRows({
  rate,
  onRateChange,
  rates = PLAYBACK_RATES,
  formatRate: formatRateProp,
  label: labelProp,
  testID,
}: Pick<PlaybackSpeedMenuProps, 'rate' | 'onRateChange' | 'rates' | 'formatRate' | 'label' | 'testID'>) {
  const { locale, messages } = useMessages(MEDIA_PLAYER_MESSAGES);
  const formatRate = formatRateProp ?? ((rate: number) => formatPlaybackRate(rate, locale));
  const label = labelProp ?? messages.playbackSpeed;
  const theme = useTheme();
  return (
    <>
      <DropdownMenuLabel>{label}</DropdownMenuLabel>
      <DropdownMenuRadioGroup value={String(rate)} onValueChange={(v) => onRateChange(Number(v))}>
        {rates.map((r) => (
          <DropdownMenuRadioItem
            key={r}
            value={String(r)}
            indicator={<RiCheckLine width={16} height={16} fill={theme.colors.text} />}
            indicatorPosition="trailing"
            testID={testID ? `${testID}-rate-${r}` : undefined}
          >
            {formatRate(r)}
          </DropdownMenuRadioItem>
        ))}
      </DropdownMenuRadioGroup>
    </>
  );
}

/**
 * The playback-speed menu: a text trigger showing the rate ("1.5×", accent +
 * dot when not 1×) opening a `DropdownMenu` of radio rows with a trailing
 * check — an anchored dropdown on web, a bottom sheet on native.
 */
function PlaybackSpeedMenuComponent({
  rate,
  onRateChange,
  rates,
  formatRate: formatRateProp,
  label: labelProp,
  children,
  open,
  onOpenChange,
  size = 'md',
  disabled,
  testID,
}: PlaybackSpeedMenuProps) {
  const { locale, messages } = useMessages(MEDIA_PLAYER_MESSAGES);
  const formatRate = formatRateProp ?? ((rate: number) => formatPlaybackRate(rate, locale));
  const label = labelProp ?? messages.playbackSpeed;
  const g = TRANSPORT_GEOMETRY[size];
  return (
    <DropdownMenu open={open} onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild label={`${label}, ${formatRate(rate)}`} disabled={disabled}>
        {children ?? (
          <PlayerIconButton
            text={formatRate(rate)}
            glyph={g.glyph}
            box={g.box}
            active={rate !== 1}
            disabled={disabled}
            testID={testID ? `${testID}-trigger` : undefined}
          />
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent label={label} align="center" minWidth={180} testID={testID}>
        <PlaybackSpeedRows
          rate={rate}
          onRateChange={onRateChange}
          rates={rates}
          formatRate={formatRate}
          label={label}
          testID={testID}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export const PlaybackSpeedMenu = memo(PlaybackSpeedMenuComponent);
PlaybackSpeedMenu.displayName = 'PlaybackSpeedMenu';
