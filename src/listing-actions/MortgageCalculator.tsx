import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';

import { ActionCardShell } from '../booking/ActionCard';
import { useControllableState } from '../hooks/use-controllable-state';
import { Slider } from '../slider';
import { TextField, TextFieldInput, TextFieldLabel, TextFieldSuffix } from '../text-field';
import { Text } from '../typography';
import { MORTGAGE_LABELS, MORTGAGE_SPLIT_FROM, MORTGAGE_TERM_OPTIONS } from './constants';
import { computeMortgage, formatPlainAmount, parseAmount, parseRate } from './mortgage';
import { PrincipalDonut, SelectChip, resolveDonutTones, useActionPalette } from './parts';
import type { MortgageCalculatorProps } from './types';

/**
 * A mortgage estimate from four inputs. The ONE component in this family that
 * computes: `computeMortgage` (exported, pure) turns price, down payment, term
 * and rate into the instalment and totals; `formatCurrency` turns numbers into
 * text.
 *
 *   inputs     price field; down payment amount + percent fields in sync, a
 *              `Slider` (0–100%) under them; term as radio chips (10…30
 *              years); interest rate field with a "%" suffix
 *   result     "Monthly payment" body-2-medium text-secondary over the amount
 *              title-1-semibold; a 136 donut of principal (chart-6) and
 *              interest (chart-2) with a legend; loan amount, total interest
 *              and total cost rows; the disclaimer caption-1-regular
 *   layout     stacked, or inputs | result side by side from 640 wide
 *              (`layout="auto"`), 32 apart
 */

function NumberField({
  label,
  caption,
  value,
  format,
  parse,
  onChange,
  suffix,
  testID,
}: {
  label: string;
  /** The visible label; default `label`, which always names the input. */
  caption?: string;
  value: number;
  format: (value: number) => string;
  parse: (text: string) => number;
  onChange: (value: number) => void;
  suffix?: string;
  testID?: string;
}) {
  const [text, setText] = useState(() => format(value));
  // Follow the value from outside (slider, chips, parent), but leave the
  // text alone while it already says that number — "3." stays "3." mid-typing.
  useEffect(() => {
    setText((current) => (parse(current) === value ? current : format(value)));
  }, [value, format, parse]);

  return (
    <View style={{ flex: 1, minWidth: 0 }}>
      <TextFieldLabel>{caption ?? label}</TextFieldLabel>
      <TextField>
        <TextFieldInput
          label={label}
          value={text}
          inputMode="decimal"
          keyboardType="decimal-pad"
          onChangeText={(next) => {
            setText(next);
            onChange(parse(next));
          }}
          onBlur={() => setText(format(value))}
          testID={testID}
        />
        {suffix ? <TextFieldSuffix label={suffix}>{suffix}</TextFieldSuffix> : null}
      </TextField>
    </View>
  );
}

const formatPercent = (value: number) => String(Math.round(value * 10) / 10);
const formatRate = (value: number) => String(Math.round(value * 100) / 100);

function MortgageCalculatorComponent({
  price: priceProp,
  defaultPrice = 350000,
  onPriceChange,
  downPayment: downProp,
  defaultDownPayment,
  onDownPaymentChange,
  years: yearsProp,
  defaultYears = 25,
  onYearsChange,
  annualRate: rateProp,
  defaultAnnualRate = 3.5,
  onAnnualRateChange,
  termOptions = MORTGAGE_TERM_OPTIONS,
  formatCurrency = formatPlainAmount,
  labels: labelsProp,
  disclaimer,
  layout = 'auto',
  maxWidth = null,
  style,
  testID,
}: MortgageCalculatorProps) {
  const palette = useActionPalette();
  const labels = useMemo(() => ({ ...MORTGAGE_LABELS, ...labelsProp }), [labelsProp]);
  const tones = useMemo(() => resolveDonutTones(palette.theme), [palette.theme]);
  const id = (part: string) => (testID ? `${testID}-${part}` : undefined);

  const [price, setPrice] = useControllableState<number>({
    value: priceProp,
    defaultValue: defaultPrice,
    onChange: onPriceChange,
  });
  const [down, setDown] = useControllableState<number>({
    value: downProp,
    defaultValue: defaultDownPayment ?? Math.round(defaultPrice * 0.2),
    onChange: onDownPaymentChange,
  });
  const [years, setYears] = useControllableState<number>({
    value: yearsProp,
    defaultValue: defaultYears,
    onChange: onYearsChange,
  });
  const [rate, setRate] = useControllableState<number>({
    value: rateProp,
    defaultValue: defaultAnnualRate,
    onChange: onAnnualRateChange,
  });

  const [width, setWidth] = useState<number | null>(null);
  const onLayout = useCallback((e: LayoutChangeEvent) => {
    setWidth(Math.round(e.nativeEvent.layout.width));
  }, []);
  const split = layout === 'split' || (layout === 'auto' && width != null && width >= MORTGAGE_SPLIT_FROM);

  const result = useMemo(
    () => computeMortgage({ price, downPayment: down, years, annualRate: rate }),
    [price, down, years, rate],
  );
  const percent = price > 0 ? (Math.min(down, price) / price) * 100 : 0;
  const setPercent = (pct: number) => setDown(Math.round((price * Math.min(100, Math.max(0, pct))) / 100));
  const shownDisclaimer =
    disclaimer === undefined
      ? 'An estimate, not an offer. It leaves out fees, taxes and insurance, and assumes a fixed rate for the whole term.'
      : disclaimer;

  const inputs = (
    <View style={{ gap: 16, flex: split ? 1 : undefined, minWidth: 0 }}>
      <NumberField
        label={labels.price}
        value={price}
        format={formatPlainAmount}
        parse={parseAmount}
        onChange={(next) => {
          setPrice(next);
          if (down > next) setDown(next);
        }}
        testID={id('price')}
      />
      <View style={{ gap: 12 }}>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <NumberField
            label={labels.downPayment}
            value={Math.min(down, price)}
            format={formatPlainAmount}
            parse={parseAmount}
            onChange={(next) => setDown(Math.min(next, price))}
            testID={id('down-payment')}
          />
          <View style={{ width: 96 }}>
            <NumberField
              label={labels.downPaymentPercent}
              caption={labels.percent}
              value={Math.round(percent * 10) / 10}
              format={formatPercent}
              parse={parseRate}
              onChange={setPercent}
              suffix="%"
              testID={id('down-payment-percent')}
            />
          </View>
        </View>
        <Slider
          value={Math.round(percent)}
          onValueChange={setPercent}
          min={0}
          max={100}
          step={1}
          showTooltip={false}
          accessibilityLabel={labels.downPaymentPercent}
          testID={id('down-payment-slider')}
        />
      </View>
      <View>
        <TextFieldLabel>{`${labels.term} (${labels.years})`}</TextFieldLabel>
        <View
          accessibilityLabel={labels.term}
          role="radiogroup"
          testID={id('terms')}
          style={{ flexDirection: 'row', gap: 8 }}
        >
          {termOptions.map((option) => (
            <SelectChip
              key={option}
              shape="slot"
              selected={years === option}
              onPress={() => setYears(option)}
              accessibilityLabel={`${option} ${labels.years}`}
              style={{ flex: 1, minWidth: 0, paddingLeft: 4, paddingRight: 4 }}
              testID={id(`term-${option}`)}
            >
              {(ink) => (
                <Text variant="body-2-medium" style={{ color: ink, fontVariant: ['tabular-nums'] }}>
                  {String(option)}
                </Text>
              )}
            </SelectChip>
          ))}
        </View>
      </View>
      <NumberField
        label={labels.rate}
        value={rate}
        format={formatRate}
        parse={parseRate}
        onChange={setRate}
        suffix="%"
        testID={id('rate')}
      />
    </View>
  );

  const rows: [string, string, string][] = [
    ['loan', labels.loanAmount, formatCurrency(result.loanAmount)],
    ['interest', labels.totalInterest, formatCurrency(result.totalInterest)],
    ['total', labels.totalCost, formatCurrency(result.totalCost)],
  ];

  const legend = (color: string, label: string, amount: number) => (
    <View style={{ gap: 2 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <View style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: color }} />
        <Text variant="caption-1-regular" style={{ color: palette.textSecondary }}>
          {label}
        </Text>
      </View>
      <Text variant="body-2-semibold" style={{ color: palette.text, fontVariant: ['tabular-nums'] }}>
        {formatCurrency(amount)}
      </Text>
    </View>
  );

  const output = (
    <View
      testID={id('result')}
      style={[
        { gap: 16, minWidth: 0 },
        split ? { flex: 1 } : { borderTopWidth: 1, borderTopColor: palette.border, paddingTop: 20 },
      ]}
    >
      <View style={{ gap: 2 }}>
        <Text variant="body-2-medium" style={{ color: palette.textSecondary }}>
          {labels.monthlyPayment}
        </Text>
        <Text
          variant="title-1-semibold"
          accessibilityLiveRegion="polite"
          aria-live="polite"
          testID={id('monthly')}
          style={{ color: palette.text, fontVariant: ['tabular-nums'] }}
        >
          {formatCurrency(result.monthlyPayment)}
        </Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 20 }}>
        <PrincipalDonut
          principal={result.loanAmount}
          interest={result.totalInterest}
          accessibilityLabel={`${labels.principal} ${formatCurrency(result.loanAmount)}, ${labels.interest} ${formatCurrency(result.totalInterest)}`}
          testID={id('donut')}
        />
        <View style={{ gap: 12, flex: 1, minWidth: 0 }}>
          {legend(tones.principal, labels.principal, result.loanAmount)}
          {legend(tones.interest, labels.interest, result.totalInterest)}
        </View>
      </View>
      <View>
        {rows.map(([key, label, value], index) => (
          <View
            key={key}
            testID={id(`row-${key}`)}
            style={{
              flexDirection: 'row',
              alignItems: 'baseline',
              gap: 12,
              paddingTop: 10,
              paddingBottom: 10,
              borderTopWidth: index === 0 ? 0 : 1,
              borderTopColor: palette.border,
            }}
          >
            <Text variant="body-2-regular" style={{ flex: 1, color: palette.textSecondary }}>
              {label}
            </Text>
            <Text
              variant={index === rows.length - 1 ? 'body-2-semibold' : 'body-2-medium'}
              style={{ color: palette.text, fontVariant: ['tabular-nums'] }}
            >
              {value}
            </Text>
          </View>
        ))}
      </View>
      {shownDisclaimer != null ? (
        typeof shownDisclaimer === 'string' ? (
          <Text variant="caption-1-regular" testID={id('disclaimer')} style={{ color: palette.textSecondary }}>
            {shownDisclaimer}
          </Text>
        ) : (
          shownDisclaimer
        )
      ) : null}
    </View>
  );

  return (
    <ActionCardShell testID={testID} maxWidth={maxWidth} onLayout={onLayout} style={style}>
      <Text variant="headline-semibold" accessibilityRole="header" style={{ color: palette.text, marginBottom: 20 }}>
        {labels.title}
      </Text>
      <View style={split ? { flexDirection: 'row', gap: 32, alignItems: 'flex-start' } : { gap: 24 }}>
        {inputs}
        {output}
      </View>
    </ActionCardShell>
  );
}

export const MortgageCalculator = memo(MortgageCalculatorComponent);
MortgageCalculator.displayName = 'MortgageCalculator';
