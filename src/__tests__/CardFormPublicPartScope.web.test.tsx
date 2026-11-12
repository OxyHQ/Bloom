/** @jest-environment jsdom */
import { act } from 'react';
import { createRoot } from 'react-dom/client';
jest.mock('react-native', () => jest.requireActual('react-native-web'));
import { BloomScope } from '../appearance';
import { Button } from '../button';
import {
  CardForm,
  CardFormCountry,
  CardFormExpiry,
  CardFormHostedField,
  CardFormName,
  CardFormNumber,
  CardFormPostcode,
  CardFormSecurityCode,
} from '../card-form';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
const sizes = [
  [undefined, '36px'],
  ['xs', '28px'],
  ['sm', '32px'],
  ['md', '36px'],
  ['lg', '44px'],
] as const;
const countries = [{ value: 'US', label: 'United States' }];

function mount(size: (typeof sizes)[number][0], children: React.ReactNode) {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root = createRoot(host);
  act(() =>
    root.render(
      <BloomThemeProvider fonts={false}>
        {size ? <BloomScope size={size}>{children}</BloomScope> : children}
      </BloomThemeProvider>,
    ),
  );
  return { host, root };
}

function expectHeight(host: HTMLElement, id: string, height: string) {
  const element = host.querySelector(`[data-testid="${id}"]`);
  if (!element) throw new Error(`Missing CardForm control: ${id}`);
  expect(getComputedStyle(element).height).toBe(height);
}

function expectCountrySize(host: HTMLElement, id: string, paddingTop: string) {
  const trigger = host.querySelector(`[data-testid="${id}"]`);
  if (!trigger) throw new Error(`Missing CardForm country trigger: ${id}`);
  const field = trigger.querySelector<HTMLElement>('button > div');
  if (!field) throw new Error('Missing CardForm country Select field');
  expect(getComputedStyle(field).paddingTop).toBe(paddingTop);
}

it.each(sizes)(
  'CardForm and its fields inherit the input size at %s scope on web',
  (size, height) => {
    const mounted = mount(
      size,
      <CardForm
        testID="form"
        fields={{ name: true, country: true, postcode: true }}
        countries={countries}
      />,
    );
    try {
      for (const id of [
        'form-number-input',
        'form-expiry-input',
        'form-security-code-input',
        'form-name-input',
        'form-postcode-input',
      ]) {
        expectHeight(mounted.host, id, height);
      }
      const countryPadding =
        size === 'xs' ? '5px' : size === 'sm' ? '6px' : size === 'lg' ? '10px' : '7px';
      expectCountrySize(mounted.host, 'form-country-trigger', countryPadding);
    } finally {
      act(() => mounted.root.unmount());
      mounted.host.remove();
    }
  },
);

it.each(sizes)(
  'CardForm part exports inherit TextField size at %s scope on web',
  (size, height) => {
    const mounted = mount(
      size,
      <>
        <CardFormNumber testID="number" />
        <CardFormExpiry testID="expiry" />
        <CardFormSecurityCode testID="security" />
        <CardFormName testID="name" />
        <CardFormPostcode testID="postcode" />
        <CardFormCountry countries={countries} testID="country" />
        <CardFormHostedField label="Hosted number" focused={false} testID="hosted">
          {(control) => (
            <Button testID="hosted-control" accessibilityLabel={control.accessibilityLabel} />
          )}
        </CardFormHostedField>
      </>,
    );
    try {
      for (const id of [
        'number-input',
        'expiry-input',
        'security-input',
        'name-input',
        'postcode-input',
      ]) {
        expectHeight(mounted.host, id, height);
      }
      const countryPadding =
        size === 'xs' ? '5px' : size === 'sm' ? '6px' : size === 'lg' ? '10px' : '7px';
      expectCountrySize(mounted.host, 'country-trigger', countryPadding);
      expectHeight(mounted.host, 'hosted-control', size === 'xs' ? '24px' : height);
    } finally {
      act(() => mounted.root.unmount());
      mounted.host.remove();
    }
  },
);

it('CardForm fields and standalone parts follow the nearest nested lg scope on web', () => {
  const mounted = mount(
    'xs',
    <BloomScope size="lg">
      <CardForm testID="nested-form" fields={{ name: true, country: true }} countries={countries} />
      <CardFormNumber testID="nested-number" />
      <CardFormExpiry testID="nested-expiry" />
      <CardFormSecurityCode testID="nested-security" />
      <CardFormName testID="nested-name" />
      <CardFormPostcode testID="nested-postcode" />
      <CardFormCountry countries={countries} testID="nested-country" />
      <CardFormHostedField label="Hosted number" focused={false} testID="nested-hosted">
        {(control) => (
          <Button testID="nested-hosted-control" accessibilityLabel={control.accessibilityLabel} />
        )}
      </CardFormHostedField>
    </BloomScope>,
  );
  try {
    for (const id of [
      'nested-form-number-input',
      'nested-form-expiry-input',
      'nested-form-security-code-input',
      'nested-form-name-input',
      'nested-number-input',
      'nested-expiry-input',
      'nested-security-input',
      'nested-name-input',
      'nested-postcode-input',
    ]) {
      expectHeight(mounted.host, id, '44px');
    }
    expectCountrySize(mounted.host, 'nested-form-country-trigger', '10px');
    expectCountrySize(mounted.host, 'nested-country-trigger', '10px');
    expectHeight(mounted.host, 'nested-hosted-control', '44px');
  } finally {
    act(() => mounted.root.unmount());
    mounted.host.remove();
  }
});
