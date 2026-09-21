/**
 * @jest-environment jsdom
 *
 * `card-form`, in two halves.
 *
 * The first half is the caret rule, and it is measured on the PURE functions
 * because no test of a controlled input can see it: when a formatter re-groups
 * behind the caret the value is still right, and only the selection is wrong.
 * So the property has to be stated as "an edit that is not at the end comes
 * back exactly as it was typed", and asserted there.
 *
 * The second half is what the boxes EMIT through the real react-native-web: the
 * announced name and who outranks whom for it, the error wired into
 * `aria-describedby`, the disabled state reaching the input, and — the claim
 * this family is loudest about — that the mark draws the scheme's NAME and no
 * artwork.
 */
import React, { useState } from 'react';

jest.mock('react-native', () => jest.requireActual('react-native-web'));

import {
  CARD_FORM_EMPTY_VALUE,
  CardForm,
  CardFormExpiry,
  CardFormNumber,
  CardFormSecurityCode,
  applyCardExpiryEdit,
  applyCardNumberEdit,
  cardDigits,
  cardExpiryIsWellFormed,
  cardNumberIsWellFormed,
  cardSecurityCodeIsWellFormed,
  groupCardDigits,
  luhnCheck,
  matchCardScheme,
  normaliseCardExpiry,
  normaliseCardNumber,
  schemeGroups,
  schemeMaxDigits,
  schemeSecurityCodeLength,
} from '../card-form';
import type { CardFormValue, CardScheme } from '../card-form';
import { Field } from '../field';
import { byLabel, byTestId, mount, queryTestId, root$, setupHarness } from './support/commerce-harness';

setupHarness();

/** INVENTED schemes. Bloom ships none; these exist only in this file. */
const AURORA: CardScheme = { id: 'aurora', name: 'Aurora', prefixes: ['7'], lengths: [16] };
const MERIDIAN: CardScheme = {
  id: 'meridian',
  name: 'Meridian',
  prefixes: [['81', '85']],
  lengths: [15],
  groups: [4, 6, 5],
  securityCodeLength: 4,
  securityCodeLabel: 'Card code',
};
const HOUSE: CardScheme = { id: 'house', name: 'House', prefixes: ['81'], lengths: [16] };
const SCHEMES = [AURORA, MERIDIAN];

// ---------------------------------------------------------------------------
//  Grouping and the caret
// ---------------------------------------------------------------------------

describe('grouping', () => {
  it('groups the digits and leaves everything else out', () => {
    expect(groupCardDigits('7000111122223339')).toBe('7000 1111 2222 3339');
    expect(cardDigits('7000 1111-2222/3339')).toBe('7000111122223339');
  });

  it('never emits a trailing separator', () => {
    // A group that ended in a space would need two backspaces to lose one
    // digit, because the first would delete a separator the formatter puts
    // straight back.
    expect(groupCardDigits('7000')).toBe('7000');
    expect(groupCardDigits('70001111')).toBe('70001111'.slice(0, 4) + ' ' + '70001111'.slice(4));
    expect(groupCardDigits('7000').endsWith(' ')).toBe(false);
    expect(groupCardDigits('70001111').endsWith(' ')).toBe(false);
  });

  it('follows a scheme that groups differently, and runs the overflow into one last group', () => {
    expect(groupCardDigits('810011111122229', schemeGroups(MERIDIAN))).toBe('8100 111111 22229');
    expect(groupCardDigits('70001111222233394')).toBe('7000 1111 2222 3339 4');
  });
});

describe('the caret rule', () => {
  it('re-groups an edit at the END — typing on', () => {
    expect(applyCardNumberEdit('7000', '70001')).toBe('7000 1');
    expect(applyCardNumberEdit('7000 111', '7000 1111')).toBe('7000 1111');
  });

  it('re-groups an edit at the END — backspacing off, taking the orphan separator with it', () => {
    // "7000 1" minus its last character is "7000 ", whose digits are "7000":
    // one backspace, one digit, and the separator goes too.
    expect(applyCardNumberEdit('7000 1', '7000 ')).toBe('7000');
    expect(applyCardNumberEdit('7000', '700')).toBe('700');
  });

  it('hands an INTERIOR edit back exactly as typed, so the caret cannot move', () => {
    // A digit deleted from the middle of a full number. Re-grouping here would
    // change the string ahead of the caret and the platform would put the caret
    // at the end.
    expect(applyCardNumberEdit('7000 1111 2222 3339', '7000 111 2222 3339')).toBe('7000 111 2222 3339');
    // …and a digit inserted in the middle.
    expect(applyCardNumberEdit('7000 1111 2222 3339', '7000 11151 2222 333')).toBe('7000 11151 2222 333');
  });

  it('refuses an edit past the accepted length instead of truncating it', () => {
    // Truncating would move the caret too. The case that tells the two apart is
    // a PASTE: a truncating formatter would land on a different string from the
    // one the box already held, and the caret would jump.
    const full = '7000 1111 2222 3339';
    expect(applyCardNumberEdit(full, `${full}5`, schemeGroups(AURORA), schemeMaxDigits(AURORA))).toBe(full);
    expect(applyCardNumberEdit('7000 1111 2222 333', '7000 1111 2222 333999', schemeGroups(AURORA), 16)).toBe(
      '7000 1111 2222 333',
    );
  });

  it('tidies up only when the box is LEFT', () => {
    expect(normaliseCardNumber('70001111 22223339')).toBe('7000 1111 2222 3339');
    // Fifteen digits after an interior deletion close up rather than keeping
    // the gap the typing left.
    expect(normaliseCardNumber('7000 111 2222 3339')).toBe('7000 1112 2223 339');
    expect(normaliseCardNumber('8100 111111 22229', schemeGroups(MERIDIAN))).toBe('8100 111111 22229');
  });
});

describe('the expiry', () => {
  it('inserts the slash while typing at the end, and takes it back out on the way back', () => {
    expect(applyCardExpiryEdit('0', '09')).toBe('09');
    expect(applyCardExpiryEdit('09', '092')).toBe('09/2');
    expect(applyCardExpiryEdit('09/2', '09/')).toBe('09');
  });

  it('hands an interior edit back as typed', () => {
    expect(applyCardExpiryEdit('09/29', '0/29')).toBe('0/29');
  });

  it('gives a lone month of 2-9 its leading zero on blur, and leaves a lone 1 alone', () => {
    // Nobody means September when they type "9" and tab away. A "1" is as
    // likely to be the start of October.
    expect(normaliseCardExpiry('9')).toBe('09');
    expect(normaliseCardExpiry('1')).toBe('1');
    expect(normaliseCardExpiry('0929')).toBe('09/29');
  });

  it('is well formed on four digits and a real month, and NEVER reads a clock', () => {
    expect(cardExpiryIsWellFormed('09/29')).toBe(true);
    expect(cardExpiryIsWellFormed('13/29')).toBe(false);
    expect(cardExpiryIsWellFormed('00/29')).toBe(false);
    expect(cardExpiryIsWellFormed('09/2')).toBe(false);
    // A date long past is still WELL FORMED. Whether it has expired is the
    // app's finding, because only the app knows what "now" means for its
    // billing.
    expect(cardExpiryIsWellFormed('01/00')).toBe(true);
  });
});

describe('the two arithmetic checks, and nothing more', () => {
  it('runs Luhn', () => {
    expect(luhnCheck('79927398713')).toBe(true);
    expect(luhnCheck('79927398714')).toBe(false);
    expect(luhnCheck('')).toBe(false);
    expect(luhnCheck('7')).toBe(false);
  });

  it('accepts a number only at an accepted length AND with a passing check digit', () => {
    expect(cardNumberIsWellFormed('7992 7398 7139 5648', AURORA)).toBe(luhnCheck('7992739871395648'));
    // Right check digit, wrong length for the scheme.
    expect(cardNumberIsWellFormed('79927398713', AURORA)).toBe(false);
  });

  it('counts the security code and nothing else about it', () => {
    expect(cardSecurityCodeIsWellFormed('123')).toBe(true);
    expect(cardSecurityCodeIsWellFormed('12')).toBe(false);
    expect(cardSecurityCodeIsWellFormed('1234', MERIDIAN)).toBe(true);
    expect(schemeSecurityCodeLength(MERIDIAN)).toBe(4);
    expect(schemeSecurityCodeLength()).toBe(3);
  });
});

describe('the scheme table is the caller’s', () => {
  it('recognises a scheme from the FIRST digit, before the prefix is complete', () => {
    expect(matchCardScheme('7', SCHEMES)?.id).toBe('aurora');
    expect(matchCardScheme('8', SCHEMES)?.id).toBe('meridian');
  });

  it('reads a [from, to] pair as an inclusive range', () => {
    expect(matchCardScheme('81', SCHEMES)?.id).toBe('meridian');
    expect(matchCardScheme('85', SCHEMES)?.id).toBe('meridian');
    expect(matchCardScheme('86', SCHEMES)).toBeUndefined();
  });

  it('lets the caller order the table — the first match wins', () => {
    expect(matchCardScheme('81', [HOUSE, MERIDIAN])?.id).toBe('house');
    expect(matchCardScheme('81', [MERIDIAN, HOUSE])?.id).toBe('meridian');
  });

  it('matches NOTHING when the caller ships no table', () => {
    expect(matchCardScheme('7000111122223339')).toBeUndefined();
    expect(matchCardScheme('', SCHEMES)).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
//  What the boxes emit
// ---------------------------------------------------------------------------

function Controlled({ schemes }: { schemes?: readonly CardScheme[] }) {
  const [value, setValue] = useState<CardFormValue>(CARD_FORM_EMPTY_VALUE);
  return <CardForm value={value} onValueChange={setValue} schemes={schemes} testID="form" />;
}

function type(input: HTMLInputElement, text: string): void {
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
  setter?.call(input, text);
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

describe('CardFormNumber', () => {
  it('names itself, and lets the caller outrank both the label and a Field', () => {
    mount(<CardFormNumber testID="n" />);
    expect((byTestId('n-input') as HTMLInputElement).getAttribute('aria-label')).toBe('Card number');

    mount(
      <Field label="Field label">
        <CardFormNumber testID="n" />
      </Field>,
    );
    expect(byTestId('n-input').getAttribute('aria-label')).toBe('Field label');

    mount(
      <Field label="Field label">
        <CardFormNumber accessibilityLabel="Caller name" testID="n" />
      </Field>,
    );
    // The caller always outranks the container. `TextFieldInput` alone would
    // have given the field's label here, which is the direction that is wrong.
    expect(byTestId('n-input').getAttribute('aria-label')).toBe('Caller name');
  });

  it('wires its OWN message into aria-describedby', () => {
    mount(<CardFormNumber error="That is one digit short." testID="n" />);
    const describedBy = byTestId('n-input').getAttribute('aria-describedby');
    expect(describedBy).not.toBeNull();
    expect(document.getElementById(describedBy!)?.textContent).toBe('That is one digit short.');
    expect(byTestId('n-input').getAttribute('aria-invalid')).toBe('true');
  });

  it('JOINS its own message with the field’s rather than replacing it', () => {
    mount(
      <Field label="Card number" error="The field says so">
        <CardFormNumber error="The box says so" testID="n" />
      </Field>,
    );
    const ids = byTestId('n-input').getAttribute('aria-describedby')!.split(' ');
    expect(ids).toHaveLength(2);
    const said = ids.map((id) => document.getElementById(id)?.textContent);
    expect(said).toContain('The box says so');
    expect(said).toContain('The field says so');
  });

  it('is frozen by a disabled Field and cannot re-enable itself', () => {
    mount(
      <Field label="Card number" disabled>
        <CardFormNumber disabled={false} testID="n" />
      </Field>,
    );
    expect((byTestId('n-input') as HTMLInputElement).disabled).toBe(true);
  });

  it('groups as it is typed', () => {
    function Demo() {
      const [value, setValue] = useState('');
      return <CardFormNumber value={value} onValueChange={setValue} testID="n" />;
    }
    mount(<Demo />);
    const input = byTestId('n-input') as HTMLInputElement;
    type(input, '70001');
    expect((byTestId('n-input') as HTMLInputElement).value).toBe('7000 1');
  });
});

describe('CardForm', () => {
  it('draws the three boxes a card always needs, and the name', () => {
    mount(<Controlled />);
    expect(byLabel('Card number')).not.toBeNull();
    expect(byLabel('Expiry date')).not.toBeNull();
    expect(byLabel('Security code')).not.toBeNull();
    expect(byLabel('Name on card')).not.toBeNull();
  });

  it('leaves the billing boxes out until they are asked for', () => {
    mount(<Controlled />);
    expect(queryTestId('form-postcode')).toBeNull();
    expect(queryTestId('form-country')).toBeNull();

    mount(
      <CardForm
        value={CARD_FORM_EMPTY_VALUE}
        fields={{ postcode: true }}
        testID="form"
      />,
    );
    expect(queryTestId('form-postcode')).not.toBeNull();
  });

  it('draws NO placeholder in the number box', () => {
    // A placeholder there is a string of digits that looks like a card number.
    mount(<Controlled />);
    expect((byTestId('form-number-input') as HTMLInputElement).placeholder).toBe('');
  });

  it('shows the detected scheme as the mark’s NAME — text, never artwork', () => {
    mount(
      <CardForm value={{ ...CARD_FORM_EMPTY_VALUE, number: '7000 1111' }} schemes={SCHEMES} testID="form" />,
    );
    expect(byTestId('form-mark-scheme').textContent).toBe('Aurora');
    expect(root$().querySelector('img')).toBeNull();

    mount(
      <CardForm value={{ ...CARD_FORM_EMPTY_VALUE, number: '8100 11' }} schemes={SCHEMES} testID="form" />,
    );
    expect(byTestId('form-mark-scheme').textContent).toBe('Meridian');

    mount(<CardForm value={CARD_FORM_EMPTY_VALUE} schemes={SCHEMES} testID="form" />);
    expect(queryTestId('form-mark-scheme')).toBeNull();
  });

  it('takes the security code’s length and its NAME from the detected scheme', () => {
    mount(
      <CardForm value={{ ...CARD_FORM_EMPTY_VALUE, number: '8100' }} schemes={SCHEMES} testID="form" />,
    );
    expect(byLabel('Card code')).not.toBeNull();
    expect((byTestId('form-security-code-input') as HTMLInputElement).maxLength).toBe(4);

    mount(<CardForm value={{ ...CARD_FORM_EMPTY_VALUE, number: '7000' }} schemes={SCHEMES} testID="form" />);
    expect((byTestId('form-security-code-input') as HTMLInputElement).maxLength).toBe(3);
  });

  it('reports the detected scheme up, once, by id', () => {
    const seen: Array<string | undefined> = [];
    function Demo() {
      const [value, setValue] = useState<CardFormValue>(CARD_FORM_EMPTY_VALUE);
      return (
        <CardForm
          value={value}
          onValueChange={setValue}
          // A FRESH array every render — the case an effect keyed on the match
          // object would report over and over.
          schemes={[...SCHEMES]}
          onSchemeChange={(scheme) => seen.push(scheme?.id)}
          testID="form"
        />
      );
    }
    mount(<Demo />);
    type(byTestId('form-number-input') as HTMLInputElement, '7');
    expect(seen).toEqual(['aurora']);
    type(byTestId('form-number-input') as HTMLInputElement, '70');
    expect(seen).toEqual(['aurora']);
  });

  it('puts a message under the box the caller named', () => {
    mount(
      <CardForm
        value={CARD_FORM_EMPTY_VALUE}
        errors={{ expiry: 'There is no thirteenth month.' }}
        testID="form"
      />,
    );
    const describedBy = byTestId('form-expiry-input').getAttribute('aria-describedby');
    expect(document.getElementById(describedBy!)?.textContent).toBe('There is no thirteenth month.');
    expect(byTestId('form-number-input').getAttribute('aria-invalid')).toBeNull();
  });

  it('disables every box at once', () => {
    mount(<CardForm value={CARD_FORM_EMPTY_VALUE} disabled testID="form" />);
    for (const id of ['form-number-input', 'form-expiry-input', 'form-security-code-input', 'form-name-input']) {
      expect((byTestId(id) as HTMLInputElement).disabled).toBe(true);
    }
  });

  it('keeps the security code unmasked by default and masks it on request', () => {
    mount(<CardForm value={CARD_FORM_EMPTY_VALUE} testID="form" />);
    expect((byTestId('form-security-code-input') as HTMLInputElement).type).not.toBe('password');
    mount(<CardForm value={CARD_FORM_EMPTY_VALUE} secureSecurityCode testID="form" />);
    expect((byTestId('form-security-code-input') as HTMLInputElement).type).toBe('password');
  });
});

describe('CardFormExpiry and CardFormSecurityCode stand alone', () => {
  it('each name themselves when nothing else does', () => {
    mount(<CardFormExpiry testID="e" />);
    expect(byTestId('e-input').getAttribute('aria-label')).toBe('Expiry date');
    mount(<CardFormSecurityCode testID="s" />);
    expect(byTestId('s-input').getAttribute('aria-label')).toBe('Security code');
  });

  it('keeps the security code to digits, at the length it was given', () => {
    function Demo() {
      const [code, setCode] = useState('');
      return <CardFormSecurityCode value={code} onValueChange={setCode} length={4} testID="s" />;
    }
    mount(<Demo />);
    type(byTestId('s-input') as HTMLInputElement, 'ab12cd345');
    expect((byTestId('s-input') as HTMLInputElement).value).toBe('1234');
  });
});
