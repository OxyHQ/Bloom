import type { BloomSize } from '@oxy.so/bloom/appearance';
import { PhoneInput as BloomPhoneInput, type Country } from '@oxy.so/bloom/phone-input';

import type { Binding } from '../binding';
import { Node, type IconComponent, type ViewModifiers } from '../node';
import type { ControlRenderer } from './draw';

/** A phone number with its country-code select (Bloom `phone-input`). */
export type PhoneInputKind = 'phoneInput';

/** Wording of your own (Bloom speaks it in the locale). */
export interface PhoneInputLabels {
  /** The country-code select's name (`Country code`). */
  readonly countrySelect?: string;
}

/** Bloom `PhoneInput`: the binding's number, as typed, without the dial code. */
export interface PhoneInputView extends ViewModifiers<PhoneInputView> {
  /** The chosen country's ISO code (`US` by default), and what choosing one sets. */
  country(value: Binding<string>): PhoneInputView;
  /** The choosable countries: every one Bloom carries, by name, by default. */
  countries(value: readonly Country[]): PhoneInputView;
  placeholder(value: string): PhoneInputView;
  /** The caption under the field. */
  description(value: string): PhoneInputView;
  /** The required asterisk after the title. */
  required(value?: boolean): PhoneInputView;
  /** The info glyph after the title. */
  showsInfo(): PhoneInputView;
  size(value: BloomSize): PhoneInputView;
  invalid(value?: boolean): PhoneInputView;
  disabled(value?: boolean): PhoneInputView;
  /** A 20px icon after the input. */
  trailingIcon(value: IconComponent): PhoneInputView;
  labels(value: PhoneInputLabels): PhoneInputView;
}

/** Bloom `PhoneInput`: the binding holds the number; `title` is its visible label (and name). */
export function PhoneInput(number: Binding<string>, title?: string): PhoneInputView {
  return new Node('phoneInput', { number, title }, []);
}

export const PHONE_INPUTS: Record<PhoneInputKind, ControlRenderer> = {
  phoneInput: (d) => {
    const { number, title } = d.node.props as { number: Binding<string>; title?: string };
    const country = d.own('country')?.value;
    const labels = d.own('labels')?.value as PhoneInputLabels | undefined;
    const props = d.props();
    Object.assign(props, {
      value: number[0],
      onValueChange: number[1],
      label: title,
      country: country?.[0],
      onCountryChange: country?.[1],
      countries: d.own('countries')?.value,
      placeholder: d.own('placeholder')?.value,
      hint: d.own('description')?.value,
      required: d.own('required')?.value,
      tooltip: d.own('showsInfo') === undefined ? undefined : true,
      size: d.own('size')?.value,
      invalid: d.own('invalid')?.value,
      disabled: d.own('disabled')?.value,
      trailingIcon: d.own('trailingIcon')?.value,
      countrySelectLabel: labels?.countrySelect,
    });
    return d.component(BloomPhoneInput, props);
  },
};
