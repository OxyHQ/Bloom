import {
  CardForm as BloomCardForm,
  CardFormCountry as BloomCardFormCountry,
  type CardFormCountryOption,
  type CardFormCountryProps,
  CardFormHostedField as BloomCardFormHostedField,
  type CardFormHostedFieldControl,
  type CardFormHostedFieldProps,
  CardFormPostcode as BloomCardFormPostcode,
  type CardFormPostcodeProps,
  type CardFormProps,
  type CardFormValue,
} from '@oxy.so/bloom/card-form';

import type { Binding } from '../binding';
import { type Child, Node, type ViewModifiers } from '../node';
import type { ControlRenderer } from './draw';
import { product } from './product';

/** The card form and the parts an app lays out itself. */
export type CardFormKind =
  | 'cardForm'
  | 'cardFormCountry'
  | 'cardFormPostcode'
  | 'cardFormHostedField';

type Drawn = 'style' | 'testID' | 'accessibilityLabel';
type Edited = 'value' | 'defaultValue' | 'onValueChange' | 'disabled';

/** Bloom `CardForm`'s data; a payment provider's hosted fields are language children. */
export type CardFormOptions = Omit<CardFormProps, Drawn | Edited | 'hostedFields'> & {
  readonly hostedFields?: {
    readonly number: Child;
    readonly expiry: Child;
    readonly securityCode: Child;
  };
};
export type CardFormCountryOptions = Omit<CardFormCountryProps, Drawn | Edited | 'countries'>;
export type CardFormPostcodeOptions = Omit<CardFormPostcodeProps, Drawn | Edited>;
/** Bloom `CardFormHostedField`'s data; `content` draws the provider's field from its control. */
export type CardFormHostedFieldOptions = Omit<
  CardFormHostedFieldProps,
  'testID' | 'accessibilityLabel' | 'label' | 'focused' | 'children' | 'disabled'
> & { readonly content: (control: CardFormHostedFieldControl) => Child };

/** Bloom `CardForm`: a card's number, expiry, code, name, postcode and country. */
export interface CardFormView extends ViewModifiers<CardFormView> {
  disabled(value?: boolean): CardFormView;
}
export interface CardFormCountryView extends ViewModifiers<CardFormCountryView> {
  disabled(value?: boolean): CardFormCountryView;
}
export interface CardFormPostcodeView extends ViewModifiers<CardFormPostcodeView> {
  disabled(value?: boolean): CardFormPostcodeView;
}
export interface CardFormHostedFieldView extends ViewModifiers<CardFormHostedFieldView> {
  disabled(value?: boolean): CardFormHostedFieldView;
}

/** Bloom `CardForm`, editing the card the binding holds. */
export function CardForm(
  card: Binding<Partial<CardFormValue>>,
  options: CardFormOptions = {},
): CardFormView {
  return new Node('cardForm', { binding: card, options }, []);
}
export function CardFormCountry(
  country: Binding<string>,
  countries: readonly CardFormCountryOption[],
  options: CardFormCountryOptions = {},
): CardFormCountryView {
  return new Node('cardFormCountry', { binding: country, countries, options }, []);
}
export function CardFormPostcode(
  postcode: Binding<string>,
  options: CardFormPostcodeOptions = {},
): CardFormPostcodeView {
  return new Node('cardFormPostcode', { binding: postcode, options }, []);
}
/** Bloom `CardFormHostedField`: a provider's field framed as the form's, labelled `label`. */
export function CardFormHostedField(
  label: string,
  focused: boolean,
  options: CardFormHostedFieldOptions,
): CardFormHostedFieldView {
  return new Node('cardFormHostedField', { label, focused, options }, []);
}

const edited = ['value', 'onValueChange'] as const;
const disabled = (d: Parameters<ControlRenderer>[0]) => ({ disabled: d.own('disabled')?.value });

export const CARD_FORMS: Record<CardFormKind, ControlRenderer> = {
  cardForm: product(BloomCardForm, {
    binding: edited,
    own: (d) => {
      const { hostedFields } = (d.node.props as { options: CardFormOptions }).options;
      return {
        ...disabled(d),
        hostedFields:
          hostedFields === undefined
            ? undefined
            : {
                number: d.render(hostedFields.number),
                expiry: d.render(hostedFields.expiry),
                securityCode: d.render(hostedFields.securityCode),
              },
      };
    },
  }),
  cardFormCountry: product(BloomCardFormCountry, { binding: edited, own: disabled }),
  cardFormPostcode: product(BloomCardFormPostcode, { binding: edited, own: disabled }),
  cardFormHostedField: (d) => {
    const { label, focused, options } = d.node.props as {
      label: string;
      focused: boolean;
      options: CardFormHostedFieldOptions;
    };
    const { content, ...rest } = options;
    return d.pressAround((props) =>
      d.component(BloomCardFormHostedField, {
        ...props,
        ...rest,
        label,
        focused,
        disabled: d.own('disabled')?.value,
        children: (control: CardFormHostedFieldControl) => d.render(content(control)),
      }),
    );
  },
};
