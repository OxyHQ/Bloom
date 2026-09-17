import React, { memo } from 'react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../dropdown-menu';
import { RiCheckLine } from '../icons/remix/RiCheckLine';
import { RiTimerLine } from '../icons/remix/RiTimerLine';
import { useTheme } from '../theme/use-theme';
import { PlayerIconButton } from './PlayerIconButton';
import { parseSleepTimerKey, SLEEP_TIMER_MINUTES, sleepTimerKey, TRANSPORT_GEOMETRY } from './shared';
import type { SleepTimerMenuProps } from './types';

const defaultMinutes = (m: number) => (m === 60 ? '1 hour' : `${m} minutes`);
const defaultRemaining = (r: string) => `Stops in ${r}`;

/** The heading, the time left and the radio rows. */
export function SleepTimerRows({
  value,
  onValueChange,
  minutes = SLEEP_TIMER_MINUTES,
  remaining,
  label = 'Sleep timer',
  offLabel = 'Off',
  endLabel = 'End of episode',
  formatMinutes = defaultMinutes,
  formatRemaining = defaultRemaining,
  testID,
}: Omit<SleepTimerMenuProps, 'children' | 'open' | 'onOpenChange' | 'size' | 'disabled'>) {
  const theme = useTheme();
  const check = <RiCheckLine width={16} height={16} fill={theme.colors.text} />;
  const row = (key: string, text: string) => (
    <DropdownMenuRadioItem
      key={key}
      value={key}
      indicator={check}
      indicatorPosition="trailing"
      testID={testID ? `${testID}-${key}` : undefined}
    >
      {text}
    </DropdownMenuRadioItem>
  );
  const active = value !== 'off';
  return (
    <>
      <DropdownMenuLabel>
        {active && remaining ? `${label} · ${formatRemaining(remaining)}` : label}
      </DropdownMenuLabel>
      <DropdownMenuRadioGroup
        value={sleepTimerKey(value)}
        onValueChange={(key) => onValueChange(parseSleepTimerKey(key))}
      >
        {row('off', offLabel)}
        <DropdownMenuSeparator />
        {minutes.map((m) => row(sleepTimerKey(m), formatMinutes(m)))}
        {row('end', endLabel)}
      </DropdownMenuRadioGroup>
    </>
  );
}

/**
 * The sleep-timer menu: a timer glyph (accent + dot while a timer runs)
 * opening a `DropdownMenu` of Off, the minute options and "End of episode".
 * The time left arrives pre-formatted (`remaining`) and shows in the heading
 * and the trigger's name.
 */
function SleepTimerMenuComponent({
  children,
  open,
  onOpenChange,
  size = 'regular',
  disabled,
  ...rows
}: SleepTimerMenuProps) {
  const g = TRANSPORT_GEOMETRY[size];
  const label = rows.label ?? 'Sleep timer';
  const active = rows.value !== 'off';
  const name =
    active && rows.remaining
      ? `${label}, ${(rows.formatRemaining ?? defaultRemaining)(rows.remaining)}`
      : label;
  return (
    <DropdownMenu open={open} onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild label={name} disabled={disabled}>
        {children ?? (
          <PlayerIconButton
            icon={RiTimerLine}
            glyph={g.glyph}
            box={g.box}
            active={active}
            disabled={disabled}
            testID={rows.testID ? `${rows.testID}-trigger` : undefined}
          />
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent label={label} align="end" minWidth={220} testID={rows.testID}>
        <SleepTimerRows {...rows} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export const SleepTimerMenu = memo(SleepTimerMenuComponent);
SleepTimerMenu.displayName = 'SleepTimerMenu';
