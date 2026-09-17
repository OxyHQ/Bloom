import React, { memo, useMemo, useState } from 'react';
import { View } from 'react-native';

import { DatePicker } from '../date-picker';
import { RiExchangeLine } from '../icons/remix/RiExchangeLine';
import { RiKey2Line } from '../icons/remix/RiKey2Line';
import { RiPriceTag3Line } from '../icons/remix/RiPriceTag3Line';
import { RiSuitcaseLine } from '../icons/remix/RiSuitcaseLine';
import { FilterChip } from '../stay-filters/FilterChip';
import { StepperRow } from '../stepper';
import { TextField, TextFieldHint, TextFieldInput, TextFieldLabel } from '../text-field';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { resolveSelectionPaint, SelectionCard } from './SelectionCard';
import type {
  ListingEditorIcon,
  OfferingEditorLabels,
  OfferingEditorProps,
  OfferingKind,
  OfferingValue,
  RentOffering,
  SaleOffering,
  StayOffering,
  SwapMode,
  SwapOffering,
} from './types';

/**
 * How a home is offered: four large selectable cards — for rent, for sale,
 * vacation rental, swap — any number of them at once. A selected card opens
 * its fields underneath its head:
 *
 *   rent   monthly amount (currency before the input), deposit in months
 *          (pills), available from (Bloom's `DatePicker`), minimum stay in
 *          months (`StepperRow`)
 *   sale   asking price, and the price per area COMPUTED from it and `area`
 *          (read-only, on a neutral-50 / dark neutral-900 panel)
 *   stay   nightly rate and cleaning fee side by side from 480 wide, minimum
 *          nights (`StepperRow`)
 *   swap   the exchange mode (pills): swap, host, or both
 *
 * Controlled: `value` holds the kinds and each kind's fields; deselecting a
 * kind keeps its fields in `value`, so re-selecting restores them. Money fields
 * keep digits only. Validation is the app's: pass `errors` keyed by field and
 * each message sits under its field (the `kinds` one under the cards), painted
 * in the error colour.
 *
 * Accessibility: the cards are a `group` of `checkbox`es (`aria-checked`),
 * each named by its title with its description as the hint; the pill rows are
 * `radiogroup`s named by their label.
 */

const DEFAULT_LABELS: OfferingEditorLabels = {
  rent: { title: 'For rent', description: 'Long-term tenancy, priced by the month.' },
  sale: { title: 'For sale', description: 'Sell the home outright.' },
  stay: { title: 'Vacation rental', description: 'Short stays, priced by the night.' },
  swap: { title: 'Home swap', description: 'Exchange homes with other members.' },
  monthlyRent: 'Monthly rent',
  deposit: 'Deposit',
  depositOption: (months) => (months === 0 ? 'None' : `${months} ${months === 1 ? 'month' : 'months'}`),
  availableFrom: 'Available from',
  minimumStay: 'Minimum stay',
  months: (months) => `${months} ${months === 1 ? 'month' : 'months'}`,
  askingPrice: 'Asking price',
  pricePerArea: 'Price per m²',
  pricePerAreaEmpty: 'Add a price',
  nightlyRate: 'Nightly rate',
  cleaningFee: 'Cleaning fee',
  minimumNights: 'Minimum nights',
  nights: (nights) => `${nights} ${nights === 1 ? 'night' : 'nights'}`,
  swapMode: 'How would you like to exchange?',
  swapModes: { swap: 'Swap homes', host: 'Host only', both: 'Either' },
  group: 'How is the home offered?',
};

const ICONS: Record<OfferingKind, ListingEditorIcon> = {
  rent: RiKey2Line,
  sale: RiPriceTag3Line,
  stay: RiSuitcaseLine,
  swap: RiExchangeLine,
};

const ALL_KINDS: ReadonlyArray<OfferingKind> = ['rent', 'sale', 'stay', 'swap'];
const SWAP_MODES: ReadonlyArray<SwapMode> = ['swap', 'host', 'both'];

/** Digits only — what a money field keeps of what was typed. */
export function sanitizeAmount(text: string): string {
  return text.replace(/\D+/g, '');
}

/** The sale price per unit of area, or `null` without a positive price and area. Pure. */
export function pricePerArea(price: string | undefined, area: number | undefined): number | null {
  const amount = Number(sanitizeAmount(price ?? ''));
  if (!amount || !area || area <= 0) return null;
  return amount / area;
}

function groupThousands(value: number): string {
  return String(Math.round(value)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

/** Toggles `kind` in `value.kinds`, keeping every kind's fields. Pure. */
export function toggleOfferingKind(value: OfferingValue, kind: OfferingKind): OfferingValue {
  const on = value.kinds.includes(kind);
  return { ...value, kinds: on ? value.kinds.filter((k) => k !== kind) : [...value.kinds, kind] };
}

function OfferingEditorComponent({
  value,
  onValueChange,
  kinds = ALL_KINDS,
  currencySymbol = '€',
  area,
  areaUnit = 'm²',
  formatPricePerArea,
  depositOptions = [0, 1, 2, 3],
  errors = {},
  labels: labelsProp,
  disabled = false,
  style,
  testID,
}: OfferingEditorProps) {
  const theme = useTheme();
  const paint = useMemo(() => resolveSelectionPaint(theme), [theme]);
  const labels = useMemo(() => ({ ...DEFAULT_LABELS, ...labelsProp }), [labelsProp]);
  const [width, setWidth] = useState(0);
  const wide = width >= 480;
  const tid = (suffix: string) => (testID ? `${testID}-${suffix}` : undefined);

  const rent = value.rent ?? {};
  const sale = value.sale ?? {};
  const stay = value.stay ?? {};
  const swap = value.swap ?? {};
  const setRent = (patch: Partial<RentOffering>) => onValueChange({ ...value, rent: { ...rent, ...patch } });
  const setSale = (patch: Partial<SaleOffering>) => onValueChange({ ...value, sale: { ...sale, ...patch } });
  const setStay = (patch: Partial<StayOffering>) => onValueChange({ ...value, stay: { ...stay, ...patch } });
  const setSwap = (patch: Partial<SwapOffering>) => onValueChange({ ...value, swap: { ...swap, ...patch } });

  const perArea = pricePerArea(sale.price, area);
  const perAreaText =
    perArea == null
      ? labels.pricePerAreaEmpty
      : formatPricePerArea
        ? formatPricePerArea(perArea)
        : `${currencySymbol}${groupThousands(perArea)} / ${areaUnit}`;

  const fields: Record<OfferingKind, () => React.ReactNode> = {
    rent: () => (
      <>
        <MoneyField
          label={labels.monthlyRent}
          currencySymbol={currencySymbol}
          value={rent.amount ?? ''}
          onChangeText={(amount) => setRent({ amount })}
          error={errors['rent.amount']}
          disabled={disabled}
          testID={tid('rent-amount')}
        />
        <ChoiceRow
          label={labels.deposit}
          options={depositOptions.map((months) => ({ value: months, label: labels.depositOption(months) }))}
          value={rent.depositMonths ?? null}
          onChange={(depositMonths) => setRent({ depositMonths })}
          error={errors['rent.depositMonths']}
          disabled={disabled}
          testID={tid('rent-deposit')}
        />
        <FieldShell label={labels.availableFrom} error={errors['rent.availableFrom']}>
          <DatePicker
            value={rent.availableFrom ?? null}
            onChange={(availableFrom) => setRent({ availableFrom })}
            accessibilityLabel={labels.availableFrom}
            disabled={disabled}
            testID={tid('rent-available')}
          />
        </FieldShell>
        <FieldShell error={errors['rent.minimumMonths']}>
          <StepperRow
            title={labels.minimumStay}
            value={rent.minimumMonths ?? 12}
            onValueChange={(minimumMonths) => setRent({ minimumMonths })}
            min={1}
            max={60}
            formatValue={labels.months}
            size="small"
            disabled={disabled}
            style={{ paddingTop: 0, paddingBottom: 0 }}
            testID={tid('rent-minimum')}
          />
        </FieldShell>
      </>
    ),
    sale: () => (
      <>
        <MoneyField
          label={labels.askingPrice}
          currencySymbol={currencySymbol}
          value={sale.price ?? ''}
          onChangeText={(price) => setSale({ price })}
          error={errors['sale.price']}
          disabled={disabled}
          testID={tid('sale-price')}
        />
        <View
          testID={tid('sale-per-area')}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            paddingTop: 12,
            paddingBottom: 12,
            paddingLeft: 16,
            paddingRight: 16,
            borderRadius: 12,
            backgroundColor: paint.wash,
          }}
        >
          <Text variant="body-regular" style={{ color: paint.textSecondary }}>
            {labels.pricePerArea}
          </Text>
          <Text
            variant="body-semibold"
            style={{ color: perArea == null ? paint.textSecondary : paint.text, fontVariant: ['tabular-nums'] }}
          >
            {perAreaText}
          </Text>
        </View>
      </>
    ),
    stay: () => (
      <>
        <View style={{ flexDirection: wide ? 'row' : 'column', gap: 16 }}>
          <MoneyField
            label={labels.nightlyRate}
            currencySymbol={currencySymbol}
            value={stay.nightlyRate ?? ''}
            onChangeText={(nightlyRate) => setStay({ nightlyRate })}
            error={errors['stay.nightlyRate']}
            disabled={disabled}
            style={wide ? { flex: 1 } : undefined}
            testID={tid('stay-nightly')}
          />
          <MoneyField
            label={labels.cleaningFee}
            currencySymbol={currencySymbol}
            value={stay.cleaningFee ?? ''}
            onChangeText={(cleaningFee) => setStay({ cleaningFee })}
            error={errors['stay.cleaningFee']}
            disabled={disabled}
            style={wide ? { flex: 1 } : undefined}
            testID={tid('stay-cleaning')}
          />
        </View>
        <FieldShell error={errors['stay.minimumNights']}>
          <StepperRow
            title={labels.minimumNights}
            value={stay.minimumNights ?? 1}
            onValueChange={(minimumNights) => setStay({ minimumNights })}
            min={1}
            max={90}
            formatValue={labels.nights}
            size="small"
            disabled={disabled}
            style={{ paddingTop: 0, paddingBottom: 0 }}
            testID={tid('stay-minimum')}
          />
        </FieldShell>
      </>
    ),
    swap: () => (
      <ChoiceRow
        label={labels.swapMode}
        options={SWAP_MODES.map((mode) => ({ value: mode, label: labels.swapModes[mode] }))}
        value={swap.mode ?? null}
        onChange={(mode) => setSwap({ mode })}
        error={errors['swap.mode']}
        disabled={disabled}
        testID={tid('swap-mode')}
      />
    ),
  };

  return (
    <View testID={testID} style={style} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      <View role="group" accessibilityLabel={labels.group} style={{ gap: 12 }}>
        {kinds.map((kind) => {
          const selected = value.kinds.includes(kind);
          return (
            <SelectionCard
              key={kind}
              selection="multiple"
              selected={selected}
              onPress={() => onValueChange(toggleOfferingKind(value, kind))}
              title={labels[kind].title}
              description={labels[kind].description}
              icon={ICONS[kind]}
              compact={width > 0 && width < 400}
              disabled={disabled}
              testID={tid(kind)}
            >
              {selected ? fields[kind]() : null}
            </SelectionCard>
          );
        })}
      </View>
      {errors.kinds ? (
        <Text
          variant="body-2-regular"
          accessibilityLiveRegion="polite"
          testID={tid('kinds-error')}
          style={{ color: paint.error, marginTop: 8 }}
        >
          {errors.kinds}
        </Text>
      ) : null}
    </View>
  );
}

// ---------------------------------------------------------------------------
//  Field parts
// ---------------------------------------------------------------------------

function FieldShell({ label, error, children }: { label?: string; error?: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 6 }}>
      {label ? <TextFieldLabel>{label}</TextFieldLabel> : null}
      {children}
      {error ? <TextFieldHint isInvalid>{error}</TextFieldHint> : null}
    </View>
  );
}

function MoneyField({
  label,
  currencySymbol,
  value,
  onChangeText,
  error,
  disabled,
  style,
  testID,
}: {
  label: string;
  currencySymbol: string;
  value: string;
  onChangeText: (value: string) => void;
  error?: string;
  disabled: boolean;
  style?: { flex: number };
  testID?: string;
}) {
  const theme = useTheme();
  return (
    <View style={[{ gap: 6 }, style]}>
      <TextFieldLabel>{label}</TextFieldLabel>
      <TextField isInvalid={!!error} disabled={disabled}>
        <Text
          variant="body-regular"
          aria-hidden
          // Above the field's chrome, which the input paints behind its siblings.
          style={{ zIndex: 20, color: disabled ? theme.colors.textTertiary : theme.colors.textSecondary, marginRight: 2 }}
        >
          {currencySymbol}
        </Text>
        <TextFieldInput
          label={label}
          placeholder={null}
          value={value}
          onChangeText={(text) => onChangeText(sanitizeAmount(text))}
          keyboardType="number-pad"
          inputMode="numeric"
          isInvalid={!!error}
          disabled={disabled}
          testID={testID}
        />
      </TextField>
      {error ? (
        <TextFieldHint isInvalid>{error}</TextFieldHint>
      ) : null}
    </View>
  );
}

function ChoiceRow<T extends string | number>({
  label,
  options,
  value,
  onChange,
  error,
  disabled,
  testID,
}: {
  label: string;
  options: ReadonlyArray<{ value: T; label: string }>;
  value: T | null;
  onChange: (value: T) => void;
  error?: string;
  disabled: boolean;
  testID?: string;
}) {
  return (
    <FieldShell label={label} error={error}>
      <View
        role="radiogroup"
        accessibilityLabel={label}
        testID={testID}
        style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}
      >
        {options.map((option) => (
          <FilterChip
            key={String(option.value)}
            mode="radio"
            label={option.label}
            selected={value === option.value}
            onPress={() => onChange(option.value)}
            disabled={disabled}
            testID={testID ? `${testID}-${option.value}` : undefined}
          />
        ))}
      </View>
    </FieldShell>
  );
}

export const OfferingEditor = memo(OfferingEditorComponent);
OfferingEditor.displayName = 'OfferingEditor';
