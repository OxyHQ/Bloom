/** @jest-environment jsdom */
import React from 'react';
import { act } from 'react';
jest.mock('react-native', () => jest.requireActual('react-native-web'));
import { Field } from '../field';
import { PaymentMethodList } from '../payment-method';
import { GlyphButton } from '../button/GlyphButton';
import { Select, SelectTrigger } from '../select/Select.web';
import { LocaleProvider } from '../locale';
import { byLabel, mount, setupHarness } from './support/commerce-harness';
setupHarness();

it('keeps busy glyph controls focusable without accepting presses', () => {
  const onPress = jest.fn();
  mount(<GlyphButton busy accessibilityLabel="Locate" onPress={onPress} />);
  const control = byLabel('Locate');
  expect(control.getAttribute('aria-busy')).toBe('true');
  expect(control.getAttribute('aria-disabled')).not.toBe('true');
  expect(control.getAttribute('tabindex')).toBe('0');
  act(() => { control.focus(); control.click(); });
  expect(document.activeElement).toBe(control);
  expect(onPress).not.toHaveBeenCalled();
});

const methods = [
  { id: 'ok', scheme: 'Ready' },
  { id: 'expired', scheme: 'Expired', state: 'expired' as const },
  { id: 'declined', scheme: 'Declined', state: 'declined' as const },
];
it('blocks unusable picker options but keeps management rows available', () => {
  const onSelect = jest.fn();
  mount(<PaymentMethodList variant="picker" methods={methods} onSelect={onSelect} />);
  const rows = Array.from(document.querySelectorAll<HTMLElement>('[role="radio"]'));
  expect(rows.map(row => row.getAttribute('aria-disabled'))).toEqual([null, 'true', 'true']);
  act(() => rows.forEach(row => row.click()));
  expect(onSelect.mock.calls).toEqual([['ok']]);
  onSelect.mockClear();
  mount(<PaymentMethodList methods={[methods[1]!]} onSelect={onSelect} />);
  act(() => document.querySelector<HTMLElement>('[role="button"]')!.click());
  expect(onSelect).toHaveBeenCalledWith('expired');
});
it('publishes checked states without a selection handler and required on the group', () => {
  mount(<Field label="Pay with" required><PaymentMethodList variant="picker" methods={methods} selectedId="ok" /></Field>);
  expect(document.querySelector('[role="radiogroup"]')?.getAttribute('aria-required')).toBe('true');
  expect(Array.from(document.querySelectorAll('[role="radio"]')).map(row => row.getAttribute('aria-checked'))).toEqual(['true', 'false', 'false']);
});
it('announces required Select as a localized description while keeping valid button semantics', () => {
  mount(<LocaleProvider locale="es"><Field label="Country" required description="Choose billing country">
    <Select><SelectTrigger label="Country" /></Select>
  </Field></LocaleProvider>);
  const control = byLabel('Country');
  expect(control.getAttribute('role')).toBe('button');
  expect(control.hasAttribute('aria-required')).toBe(false);
  const descriptions = control.getAttribute('aria-describedby')!.split(' ').map(id => document.getElementById(id)?.textContent);
  expect(descriptions).toContain('obligatorio');
  expect(descriptions).toContain('Choose billing country');
});
