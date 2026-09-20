import React from 'react';
import { View } from 'react-native';
import { act, fireEvent, render } from '@testing-library/react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { TextField, TextFieldInput } from '../text-field';
import { TEXT_FIELD_ADDON_PADDING, TEXT_FIELD_GEOMETRY } from '../text-field/shared';
import { COUNTRIES, CountryCodeSelect, CountryFlag, PhoneInput, findCountry } from '../phone-input';
import { COUNTRY_FLAGS } from '../phone-input/flags';
import {
  COUNTRY_CODE_LIST_WIDTH,
  COUNTRY_CODE_TRIGGER_STYLE,
} from '../phone-input/CountryCodeSelect';
import { resolvedStyle } from './support/rendered-style';

function renderLight(ui: React.ReactElement) {
  return render(
    <BloomThemeProvider mode="light" colorPreset="teal">
      {ui}
    </BloomThemeProvider>,
  );
}

type Root = ReturnType<typeof render>;

/** The trigger's value text (`+dial`). */
function triggerText(root: Root): string {
  const trigger = root.getByLabelText('Country code');
  const texts = trigger.findAll(
    (node) => typeof node.type === 'string' && typeof node.props.children === 'string',
  );
  return texts.map((node) => node.props.children as string).join('');
}

/** The trigger draws exactly this country's flag (`UM` shares `US`'s artwork). */
function triggerDrawsFlag(root: Root, iso2: string): boolean {
  const trigger = root.getByLabelText('Country code');
  const svg = trigger.findAll((node) => (node.type as unknown) === 'Svg')[0];
  if (!svg) return false;
  const drawn = svg
    .findAll((node) => (node.type as unknown) === 'Path')
    .map((node) => `${node.props.fill as string} ${node.props.d as string}`)
    .join('|');
  const art = COUNTRY_FLAGS[iso2]![1]
    .filter((shape) => shape[0] === 0)
    .map((shape) => `${shape[1]} ${shape[2] as string}`)
    .join('|');
  return drawn === art;
}

/** The field shell: the row that holds the addon and the input. */
function shellStyle(root: Root) {
  const input = root.getByLabelText('Phone Number');
  let node = input.parent;
  while (node) {
    const s = resolvedStyle(node.props.style);
    if (node.type === View && s.flexDirection === 'row' && s.width === '100%') return s;
    node = node.parent;
  }
  throw new Error('field shell not found');
}

describe('country data', () => {
  it('vendors every country with a flag and a dial code, sorted by name', () => {
    expect(COUNTRIES.length).toBe(252);
    const names = COUNTRIES.map((c) => c.name);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
    for (const country of COUNTRIES) {
      expect(COUNTRY_FLAGS[country.iso2]).toBeDefined();
      expect(country.dial).toMatch(/^\d+$/);
    }
    expect(Object.keys(COUNTRY_FLAGS).sort()).toEqual(COUNTRIES.map((c) => c.iso2).sort());
  });

  it.each([
    ['US', '1'],
    ['GB', '44'],
    ['ES', '34'],
    ['JP', '81'],
    ['IN', '91'],
    ['DO', '1809'],
    ['XK', '377'],
  ])('%s dials +%s (the first calling code)', (iso2, dial) => {
    expect(findCountry(iso2)?.dial).toBe(dial);
    expect(findCountry(iso2.toLowerCase())?.iso2).toBe(iso2);
  });
});

describe('CountryFlag', () => {
  it('is 18 × 12 with a 2px clip, and decorative by default', () => {
    const root = renderLight(<CountryFlag iso2="FR" />);
    const box = root.UNSAFE_getAllByType(View).find((v) => resolvedStyle(v.props.style).width === 18)!;
    expect(resolvedStyle(box.props.style)).toMatchObject({
      width: 18,
      height: 12,
      borderRadius: 2,
      overflow: 'hidden',
      flexShrink: 0,
    });
    expect(box.props['aria-hidden']).toBe(true);
    expect(box.props.accessibilityElementsHidden).toBe(true);
    expect(box.props.importantForAccessibility).toBe('no-hide-descendants');
  });

  it('draws the flag shapes (circles and ellipses included) and names itself on request', () => {
    const root = renderLight(<CountryFlag iso2="br" size={30} accessibilityLabel="Brazil" />);
    const named = root.getByLabelText('Brazil');
    expect(named.props.role).toBe('img');
    expect(resolvedStyle(named.props.style)).toMatchObject({ width: 30, height: 20 });
    expect(root.UNSAFE_getAllByType('Circle' as never)).toHaveLength(1);
    expect(root.UNSAFE_getAllByType('Path' as never).length).toBeGreaterThan(1);
  });

  it('renders nothing for an unknown code', () => {
    const root = renderLight(<CountryFlag iso2="ZZ" />);
    expect(root.UNSAFE_queryAllByType('Svg' as never)).toHaveLength(0);
  });
});

describe('TextField leadingAddon', () => {
  it.each(['md', 'sm'] as const)('%s: pl-1 and the size’s right padding, addon 2px before the input', (size) => {
    const root = renderLight(
      <TextField size={size} leadingAddon={<View testID="addon" />}>
        <TextFieldInput label="Phone Number" value="" onValueChange={() => {}} />
      </TextField>,
    );
    const shell = shellStyle(root);
    expect(shell.paddingLeft).toBe(4);
    expect(shell.paddingRight).toBe(size === 'md' ? 8 : 6);
    expect(shell.paddingHorizontal).toBeUndefined();
    expect(TEXT_FIELD_ADDON_PADDING).toEqual({
      xs: { paddingLeft: 4, paddingRight: 4 },
      lg: { paddingLeft: 4, paddingRight: 10 },
      md: { paddingLeft: 4, paddingRight: 8 },
      sm: { paddingLeft: 4, paddingRight: 6 },
      small: { paddingLeft: 4, paddingRight: 6 },
      medium: { paddingLeft: 4, paddingRight: 8 },
    });
    let slot = root.getByTestId('addon').parent!;
    while (resolvedStyle(slot.props.style).marginRight === undefined) slot = slot.parent!;
    expect(resolvedStyle(slot.props.style)).toMatchObject({ flexShrink: 0, marginRight: 2 });
    // The input keeps the shell height (h-9 / h-8).
    expect(resolvedStyle(root.getByLabelText('Phone Number').props.style).height).toBe(
      TEXT_FIELD_GEOMETRY[size].height,
    );
  });

  it('keeps the plain side padding without an addon', () => {
    const root = renderLight(
      <TextField>
        <TextFieldInput label="Phone Number" value="" onValueChange={() => {}} />
      </TextField>,
    );
    expect(shellStyle(root).paddingHorizontal).toBe(8);
  });
});

describe('PhoneInput', () => {
  it('names the select "Country code" and the input by its label', () => {
    const root = renderLight(<PhoneInput label="Phone Number" placeholder="(123) 000-0000" />);
    const trigger = root.getByLabelText('Country code');
    expect(trigger.props.accessibilityRole).toBe('button');
    const input = root.getByLabelText('Phone Number');
    expect(input.props.placeholder).toBe('(123) 000-0000');
    expect(input.props.keyboardType).toBe('phone-pad');
  });

  it('falls back to "Phone number" as the input name without a label', () => {
    const root = renderLight(<PhoneInput />);
    expect(root.getByLabelText('Phone number')).toBeTruthy();
  });

  it('shows the default country (US) as flag + "+1"', () => {
    const root = renderLight(<PhoneInput label="Phone Number" />);
    expect(triggerText(root)).toBe('+1');
    expect(triggerDrawsFlag(root, 'US')).toBe(true);
  });

  it('a controlled country change updates the trigger text and flag', () => {
    const root = renderLight(<PhoneInput label="Phone Number" country="GB" />);
    expect(triggerText(root)).toBe('+44');
    expect(triggerDrawsFlag(root, 'GB')).toBe(true);
    expect(triggerDrawsFlag(root, 'JP')).toBe(false);
    root.rerender(
      <BloomThemeProvider mode="light" colorPreset="teal">
        <PhoneInput label="Phone Number" country="JP" />
      </BloomThemeProvider>,
    );
    expect(triggerText(root)).toBe('+81');
    expect(triggerDrawsFlag(root, 'JP')).toBe(true);
  });

  it('picking a country from the list updates the trigger and reports it', () => {
    const onCountryChange = jest.fn();
    const root = renderLight(<PhoneInput label="Phone Number" onCountryChange={onCountryChange} />);
    act(() => {
      fireEvent.press(root.getByLabelText('Country code'));
    });
    const spain = root.getByLabelText('Spain');
    expect(spain.props.accessibilityRole).toBe('radio');
    act(() => {
      fireEvent.press(spain);
    });
    act(() => {
      jest.runOnlyPendingTimers?.();
    });
    expect(onCountryChange).toHaveBeenCalledWith('ES', { iso2: 'ES', name: 'Spain', dial: '34' });
    expect(triggerText(root)).toBe('+34');
    expect(triggerDrawsFlag(root, 'ES')).toBe(true);
  });

  it('types into an uncontrolled value and reports it', () => {
    const onChangeText = jest.fn();
    const root = renderLight(<PhoneInput label="Phone Number" onValueChange={onChangeText} />);
    fireEvent.changeText(root.getByLabelText('Phone Number'), '415 555 0132');
    expect(onChangeText).toHaveBeenCalledWith('415 555 0132');
    expect(root.getByLabelText('Phone Number').props.value).toBe('415 555 0132');
  });

  it('draws the trigger as a control inside the field: rounded-lg px-1.5 py-1, 220px list', () => {
    expect(COUNTRY_CODE_TRIGGER_STYLE).toEqual({
      borderRadius: 8,
      paddingLeft: 6,
      paddingRight: 6,
      paddingTop: 4,
      paddingBottom: 4,
    });
    expect(COUNTRY_CODE_LIST_WIDTH).toBe(220);
    const root = renderLight(<CountryCodeSelect />);
    const trigger = root.getByLabelText('Country code');
    const field = trigger.findAll(
      (node) => node.type === View && resolvedStyle(node.props.style).borderRadius === 8,
    )[0];
    expect(field).toBeDefined();
    expect(resolvedStyle(field!.props.style)).toMatchObject(COUNTRY_CODE_TRIGGER_STYLE);
  });

  it('disables the select with the field', () => {
    const root = renderLight(<PhoneInput label="Phone Number" disabled />);
    const trigger = root.getByLabelText('Country code');
    expect(trigger.props.disabled ?? trigger.props['aria-disabled'] ?? trigger.props.accessibilityState?.disabled).toBeTruthy();
  });
});
