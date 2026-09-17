import React, { useCallback, useMemo } from 'react';

import { resolveButtonRamps } from '../button/shared';
import { useControllableState } from '../hooks/use-controllable-state';
import {
  Select,
  SelectContent,
  SelectIcon,
  SelectItem,
  SelectItemText,
  SelectTrigger,
  SelectValue,
} from '../select';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { CountryFlag } from './CountryFlag';
import { COUNTRIES } from './countries';
import { findCountry } from './find-country';
import type { Country, CountryCodeSelectProps } from './types';

/**
 * The trigger inside a field: `rounded-lg px-1.5 py-1` over the select
 * trigger's own chrome (border, fill, xs shadow, `gap-1.5`). A control INSIDE
 * an input, so an 8px corner rather than a pill. Longhands, which is
 * what outranks the trigger's `px-[10px] py-2` classes on web.
 */
export const COUNTRY_CODE_TRIGGER_STYLE = {
  borderRadius: 8,
  paddingLeft: 6,
  paddingRight: 6,
  paddingTop: 4,
  paddingBottom: 4,
} as const;

/** `popoverClassName="w-[220px]"`. */
export const COUNTRY_CODE_LIST_WIDTH = 220;

/**
 * The select rows carry a 32px right gutter for a selection tick; these rows
 * have no tick (the highlight marks the chosen country) and end in the dial
 * code, so they take the listbox item's plain `p-2` instead.
 */
const ROW_STYLE = { paddingRight: 8 } as const;

const iso2Of = (country: Country) => country.iso2;

/**
 * The country-code select inside `PhoneInput`: a flag and
 * `+dial` in the trigger, and a 220px list of `flag · name · +dial` rows.
 * Built on Bloom's `Select`, so the list is the anchored dropdown on web and
 * the bottom sheet on native.
 */
export function CountryCodeSelect({
  value,
  defaultValue = 'US',
  onValueChange,
  countries = COUNTRIES,
  label = 'Country code',
  disabled,
}: CountryCodeSelectProps) {
  const theme = useTheme();
  const { neutral: n } = resolveButtonRamps(theme);
  // `text-text-secondary` (value) and `text-text-tertiary` (row dial codes).
  const secondary = n[500];
  const tertiary = theme.isDark ? n[600] : n[400];

  const onChange = useCallback(
    (next: string) => {
      const country = findCountry(next, countries);
      if (country) onValueChange?.(country.iso2, country);
    },
    [countries, onValueChange],
  );
  const [iso2, setIso2] = useControllableState({ value, defaultValue, onChange });
  const selected = useMemo(() => findCountry(iso2, countries), [iso2, countries]);

  return (
    <Select value={selected?.iso2 ?? iso2} onValueChange={setIso2} disabled={disabled}>
      <SelectTrigger label={label} fieldStyle={COUNTRY_CODE_TRIGGER_STYLE}>
        <SelectValue
          leading={selected ? <CountryFlag iso2={selected.iso2} /> : null}
          style={{ color: secondary }}>
          {() => (selected ? `+${selected.dial}` : '')}
        </SelectValue>
        <SelectIcon />
      </SelectTrigger>
      <SelectContent
        label={label}
        items={countries}
        valueExtractor={iso2Of}
        width={COUNTRY_CODE_LIST_WIDTH}
        renderItem={(country) => (
          <SelectItem
            value={country.iso2}
            label={country.name}
            leading={<CountryFlag iso2={country.iso2} />}
            style={ROW_STYLE}>
            <SelectItemText>{country.name}</SelectItemText>
            <Text variant="body-medium" style={{ flexShrink: 0, color: tertiary }}>
              {`+${country.dial}`}
            </Text>
          </SelectItem>
        )}
      />
    </Select>
  );
}
