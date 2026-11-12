import { render } from '@testing-library/react-native';
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
import { resolvedStyle } from './support/rendered-style';

const sizes = [
  [undefined, 36],
  ['xs', 28],
  ['sm', 32],
  ['md', 36],
  ['lg', 44],
] as const;
const countries = [{ value: 'US', label: 'United States' }];

function expectCountrySize(tree: ReturnType<typeof render>, id: string, paddingTop: number) {
  const trigger = tree.getByTestId(id);
  const fields = trigger.findAll(
    (node) => resolvedStyle(node.props.style).paddingTop !== undefined,
  );
  expect(fields.map((node) => resolvedStyle(node.props.style).paddingTop)).toContain(paddingTop);
}

it.each(sizes)('CardForm and its fields inherit the input size at %s scope', (size, height) => {
  const form = (
    <CardForm
      testID="form"
      fields={{ name: true, country: true, postcode: true }}
      countries={countries}
    />
  );
  const tree = render(
    <BloomThemeProvider fonts={false}>
      {size ? <BloomScope size={size}>{form}</BloomScope> : form}
    </BloomThemeProvider>,
  );
  for (const id of [
    'form-number-input',
    'form-expiry-input',
    'form-security-code-input',
    'form-name-input',
    'form-postcode-input',
  ]) {
    expect(resolvedStyle(tree.getByTestId(id).props.style).height).toBe(height);
  }
  const countryPadding = size === 'xs' ? 5 : size === 'sm' ? 6 : size === 'lg' ? 10 : 7;
  expectCountrySize(tree, 'form-country-trigger', countryPadding);
});

it.each(sizes)('CardForm part exports inherit TextField size at %s scope', (size, height) => {
  const parts = (
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
    </>
  );
  const tree = render(
    <BloomThemeProvider fonts={false}>
      {size ? <BloomScope size={size}>{parts}</BloomScope> : parts}
    </BloomThemeProvider>,
  );
  for (const id of [
    'number-input',
    'expiry-input',
    'security-input',
    'name-input',
    'postcode-input',
  ]) {
    expect(resolvedStyle(tree.getByTestId(id).props.style).height).toBe(height);
  }
  const countryPadding = size === 'xs' ? 5 : size === 'sm' ? 6 : size === 'lg' ? 10 : 7;
  expectCountrySize(tree, 'country-trigger', countryPadding);
  expect(resolvedStyle(tree.getByTestId('hosted-control').props.style).height).toBe(
    size === 'xs' ? 24 : height,
  );
});

it('CardForm fields and standalone parts follow the nearest nested lg scope', () => {
  const parts = (
    <>
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
    </>
  );
  const tree = render(
    <BloomThemeProvider fonts={false}>
      <BloomScope size="xs">
        <BloomScope size="lg">{parts}</BloomScope>
      </BloomScope>
    </BloomThemeProvider>,
  );
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
    expect(resolvedStyle(tree.getByTestId(id).props.style).height).toBe(44);
  }
  expectCountrySize(tree, 'nested-form-country-trigger', 10);
  expectCountrySize(tree, 'nested-country-trigger', 10);
  expect(resolvedStyle(tree.getByTestId('nested-hosted-control').props.style).height).toBe(44);
});
