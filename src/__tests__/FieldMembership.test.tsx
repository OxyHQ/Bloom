/**
 * EVERY control that opts into a `Field` resolves membership the same way.
 *
 * `FieldAssociation.test.tsx` proves the field PUBLISHES ids and state, on one
 * consumer. This proves the other fourteen APPLY them, and that all fifteen
 * apply them in the same directions — which is the half that rots, because each
 * family resolves it in its own file:
 *
 *   the NAME defers to the field   (`??`)  — a switch, a slider, a rating row and
 *                                            a drop zone draw no words, so the
 *                                            field's label is the only name they
 *                                            can have
 *   `disabled` COMBINES with it    (`||`)  — and cannot be undone from inside,
 *                                            which is asserted as its own case
 *                                            rather than inferred
 *
 * Both failures are silent. A control that ignores the field looks right on
 * screen — the label is above it, the error is below it and red — and announces
 * nothing; a control that re-enables itself inside a disabled field looks right
 * too, and fires.
 *
 * THE SUBJECT LIST IS THE COVERAGE. It is asserted against the set of families
 * that read the contract in `adoption-matrix.test.ts`, so a family that starts
 * reading it and is not added here fails there: a table a new component does not
 * join is the gate that quietly stops measuring anything (`aria-state-web` was
 * exactly that, and three `progressbar` siblings sat outside it).
 */
import React from 'react';
import { TextInput } from 'react-native';
import { render } from '@testing-library/react-native';

// The shared react-native mock has no `Easing`, `Animated.parallel` or
// `stopAnimation`, all three of which `FileUpload`'s native motion uses. Same
// augmentation as `FileUpload.test.tsx`; everything else in the mock is kept.
jest.mock('react-native', () => {
  const actual = jest.requireActual('react-native');
  class Value extends actual.Animated.Value {
    stopAnimation() {}
  }
  const run = { start: (cb?: () => void) => cb?.(), stop: () => {} };
  return {
    ...actual,
    Easing: { bezier: () => (t: number) => t, out: (f: unknown) => f, ease: (t: number) => t },
    Animated: { ...actual.Animated, Value, parallel: () => run },
  };
});

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { Field } from '../field';
import { CardFormNumber } from '../card-form';
import { Checkbox } from '../checkbox';
import { DeliverySlotPicker } from '../delivery-slot';
import { FileUpload } from '../file-upload';
import { InputGroup } from '../input-group';
import { InputOtp } from '../input-otp';
import { MailRecipientField } from '../mail-compose';
import { PaymentMethodList } from '../payment-method';
import { Radio, RadioGroup } from '../radio';
import { RatingInput } from '../rating';
import { SegmentedControl, SegmentedControlItem, SegmentedControlItemText } from '../segmented-control';
import { Select, SelectTrigger, SelectValue } from '../select';
import { Slider } from '../slider';
import { Stepper } from '../stepper';
import { Switch } from '../switch';
import { Textarea } from '../textarea';
import { TagField } from '../tag-field';
import { TextField, TextFieldInput } from '../text-field';
import { TimeField } from '../date-picker';

function wrap(ui: React.ReactElement) {
  return render(
    <BloomThemeProvider mode="light" colorPreset="teal">
      {ui}
    </BloomThemeProvider>,
  );
}

const TID = 'subject';

type Props = Record<string, unknown>;

interface Subject {
  /** The family, spelled as the matrix spells it. */
  name: string;
  /** Rendered inside the `Field` under test. */
  render: (props: Props) => React.ReactElement;
  /** Which prop carries a name the CALLER wrote. `null` — the family takes none. */
  ownNameProp: 'accessibilityLabel' | 'label' | null;
  /** How this family spells "inert" on the node below. */
  isInert: ((props: Props) => boolean) | null;
  /** How to find the node carrying the contract. `testID` unless stated. */
  node?: 'testID' | 'byName' | 'textInput';
  /** Whether the control node carries the field's `aria-describedby`. */
  describedBy?: boolean;
  /** Whether the control node carries `aria-invalid`. */
  invalid?: boolean;
  /** Whether the control node carries the field's id. */
  id?: boolean;
  /** The name it falls back to with neither a caller's nor a field's label. */
  lastResortName?: string;
}

const pressableInert = (props: Props) => props.disabled === true;
const viewInert = (props: Props) => props['aria-disabled'] === true;
const inputInert = (props: Props) => props.editable === false;

const SUBJECTS: Subject[] = [
  {
    name: 'switch',
    render: (p) => <Switch testID={TID} value={false} onValueChange={() => {}} {...p} />,
    ownNameProp: 'accessibilityLabel',
    isInert: pressableInert,
    describedBy: true,
    invalid: true,
    id: true,
  },
  {
    name: 'checkbox',
    render: (p) => <Checkbox testID={TID} checked={false} onCheckedChange={() => {}} {...p} />,
    ownNameProp: 'accessibilityLabel',
    isInert: pressableInert,
    describedBy: true,
    invalid: true,
    id: true,
  },
  {
    name: 'radio',
    render: (p) => <Radio testID={TID} value="a" selected={false} onSelect={() => {}} {...p} />,
    ownNameProp: 'accessibilityLabel',
    isInert: pressableInert,
    describedBy: true,
    id: true,
  },
  {
    name: 'radio-group',
    render: (p) => (
      <RadioGroup
        testID={TID}
        value="a"
        onValueChange={() => {}}
        options={[{ value: 'a', label: 'A' }]}
        {...p}
      />
    ),
    // The group names itself with `label`, which is also what a `Field` supplies.
    ownNameProp: 'label',
    isInert: null,
    describedBy: true,
    invalid: true,
  },
  {
    name: 'slider',
    render: (p) => <Slider testID={TID} value={2} onValueChange={() => {}} min={0} max={10} {...p} />,
    ownNameProp: 'accessibilityLabel',
    isInert: viewInert,
    describedBy: true,
    invalid: true,
    id: true,
  },
  {
    name: 'segmented-control',
    render: (p) => (
      <SegmentedControl testID={TID} type="radio" value="a" onChange={() => {}} {...p}>
        <SegmentedControlItem value="a" testID="segment" accessibilityLabel="A">
          <SegmentedControlItemText>A</SegmentedControlItemText>
        </SegmentedControlItem>
      </SegmentedControl>
    ),
    ownNameProp: 'label',
    isInert: viewInert,
    describedBy: true,
    invalid: true,
    id: true,
  },
  {
    name: 'stepper',
    render: (p) => <Stepper testID={TID} value={1} onValueChange={() => {}} {...p} />,
    ownNameProp: 'accessibilityLabel',
    isInert: viewInert,
    describedBy: true,
    id: true,
  },
  {
    name: 'rating',
    render: (p) => <RatingInput testID={TID} value={3} onChange={() => {}} {...p} />,
    ownNameProp: 'accessibilityLabel',
    isInert: viewInert,
    describedBy: true,
    id: true,
  },
  {
    name: 'input-otp',
    render: (p) => <InputOtp testID={TID} length={4} {...p} />,
    ownNameProp: 'accessibilityLabel',
    isInert: null,
    describedBy: true,
    lastResortName: 'One-time code',
  },
  {
    name: 'file-upload',
    render: (p) => <FileUpload testID={TID} {...p} />,
    ownNameProp: 'accessibilityLabel',
    isInert: pressableInert,
    describedBy: true,
    invalid: true,
    id: true,
    lastResortName: 'Upload a file',
  },
  {
    // A recipient row: chips plus ONE inline `TextInput`, which is the node the
    // contract lands on. Its own `label` is the "To" gutter beside the input,
    // so it is `adjacent` — the field only fills the gap when there is none.
    name: 'mail-compose',
    render: (p) => (
      <MailRecipientField recipients={[]} onRecipientsChange={() => {}} {...p} />
    ),
    ownNameProp: 'label',
    isInert: inputInert,
    node: 'textInput',
    describedBy: true,
    invalid: true,
    id: true,
  },
  {
    // Six boxes, each a member in its own right; the number is the one the
    // caller reaches for first. It resolves membership ONCE and re-publishes
    // the answer to `TextFieldInput`, so the caller's own name cannot be
    // outranked by the field's label — the direction that is silently wrong.
    name: 'card-form',
    render: (p) => <CardFormNumber testID={TID} {...p} />,
    ownNameProp: 'accessibilityLabel',
    isInert: inputInert,
    node: 'textInput',
    describedBy: true,
    invalid: true,
    id: true,
    lastResortName: 'Card number',
  },
  {
    // The picker is a `radiogroup` the way `RadioGroup` is one: the GROUP is
    // the member, each row keeps its own `aria-checked`, and a `Field` can name
    // it, describe it, mark it invalid and freeze every row in it.
    name: 'payment-method',
    render: (p) => (
      <PaymentMethodList
        testID={TID}
        variant="picker"
        methods={[{ id: 'a', scheme: 'Aurora', masked: '•••• 4417' }]}
        selectedId="a"
        onSelect={() => {}}
        {...p}
      />
    ),
    ownNameProp: 'accessibilityLabel',
    isInert: viewInert,
    describedBy: true,
    invalid: true,
    lastResortName: 'Payment methods',
  },
  {
    name: 'textarea',
    render: (p) => <Textarea testID="shell" {...p} />,
    ownNameProp: 'accessibilityLabel',
    isInert: inputInert,
    node: 'textInput',
    describedBy: true,
    invalid: true,
    id: true,
  },
  {
    name: 'time-field',
    render: (p) => <TimeField testID={TID} value={null} onChange={() => {}} {...p} />,
    ownNameProp: 'accessibilityLabel',
    isInert: inputInert,
    describedBy: true,
    invalid: true,
    id: true,
  },
  {
    name: 'tag-field',
    render: (p) => <TagField testID="shell" value={[]} onChange={() => {}} {...p} />,
    ownNameProp: 'accessibilityLabel',
    isInert: inputInert,
    node: 'textInput',
    describedBy: true,
    invalid: true,
    id: true,
  },
  {
    // The picker is TWO radio groups inside one field (the days, and the
    // windows). The windows group is the one the contract lands on; it carries
    // the name, so it is found by that rather than by a testID one node up.
    // Dropped inside a `Field` the picker renders no second field of its own.
    name: 'delivery-slot',
    render: (p) => (
      <DeliverySlotPicker
        days={[{ id: 'fri', weekday: 'Fri', day: '24' }]}
        day="fri"
        windows={[{ id: 'w1', label: '17:00 - 19:00' }]}
        value="w1"
        onValueChange={() => {}}
        {...p}
      />
    ),
    ownNameProp: 'label',
    isInert: viewInert,
    node: 'byName',
    describedBy: true,
    invalid: true,
  },
  {
    name: 'select',
    render: (p) => (
      <Select value="a" onValueChange={() => {}}>
        <SelectTrigger testID={TID} label={p.accessibilityLabel as string | undefined}>
          <SelectValue placeholder="Pick" />
        </SelectTrigger>
      </Select>
    ),
    // The name lands on the pressable `TriggerSlot` renders, not on the wrapper
    // the testID is on, so this one is found by its name.
    ownNameProp: 'accessibilityLabel',
    isInert: pressableInert,
    node: 'byName',
    describedBy: true,
    invalid: true,
    id: true,
  },
];

/** The node carrying the contract, for a subject whose name is `name`. */
function subjectProps(screen: ReturnType<typeof wrap>, subject: Subject, name: string): Props {
  if (subject.node === 'textInput') return screen.UNSAFE_getAllByType(TextInput)[0]!.props as Props;
  if (subject.node === 'byName') return screen.getByLabelText(name).props as Props;
  return screen.getByTestId(TID).props as Props;
}

const FIELD_LABEL = 'Field label';

describe.each(SUBJECTS.map((s) => [s.name, s] as const))('%s inside a Field', (_name, subject) => {
  it('takes the field label as its accessible name when it has none of its own', () => {
    const screen = wrap(<Field label={FIELD_LABEL}>{subject.render({})}</Field>);
    const props = subjectProps(screen, subject, FIELD_LABEL);
    expect([subject.name, props.accessibilityLabel ?? props['aria-label']]).toEqual([
      subject.name,
      FIELD_LABEL,
    ]);
  });

  if (subject.isInert) {
    const isInert = subject.isInert;
    it('is disabled by the field, and an explicit `disabled={false}` does not undo it', () => {
      const screen = wrap(
        <Field label={FIELD_LABEL} disabled>
          {subject.render({ disabled: false })}
        </Field>,
      );
      expect([subject.name, isInert(subjectProps(screen, subject, FIELD_LABEL))]).toEqual([
        subject.name,
        true,
      ]);
    });
  }

  if (subject.describedBy) {
    it("carries the field's error id, so the error is announced as part of the control", () => {
      const screen = wrap(
        <Field label={FIELD_LABEL} error="Too short">
          {subject.render({})}
        </Field>,
      );
      const props = subjectProps(screen, subject, FIELD_LABEL);
      const errorId = (screen.getByText('Too short').props as Props).nativeID as string;
      expect([subject.name, props['aria-describedby']]).toEqual([subject.name, errorId]);
    });

    it('describes the DESCRIPTION when there is no error, and swaps to the error when there is', () => {
      const description = wrap(
        <Field label={FIELD_LABEL} description="Two words minimum">
          {subject.render({})}
        </Field>,
      );
      const describedBy = subjectProps(description, subject, FIELD_LABEL)['aria-describedby'];
      expect([subject.name, describedBy]).toEqual([
        subject.name,
        (description.getByText('Two words minimum').props as Props).nativeID,
      ]);
    });
  }

  if (subject.invalid) {
    it('reports the field error as `aria-invalid`', () => {
      const screen = wrap(
        <Field label={FIELD_LABEL} error="Too short">
          {subject.render({})}
        </Field>,
      );
      expect([subject.name, subjectProps(screen, subject, FIELD_LABEL)['aria-invalid']]).toEqual([
        subject.name,
        true,
      ]);
    });
  }

  if (subject.id) {
    it("carries the field's id, which is the one the label points at", () => {
      const screen = wrap(<Field label={FIELD_LABEL}>{subject.render({})}</Field>);
      const props = subjectProps(screen, subject, FIELD_LABEL);
      const labelProps = screen.getByText(FIELD_LABEL).props as Props;
      expect(typeof props.nativeID).toBe('string');
      expect(props.nativeID as string).not.toHaveLength(0);
      // The label's own id is the control's plus `-label`, which is how the
      // field derives both — so this asserts they came from the same base rather
      // than that two ids happen to look alike.
      expect([subject.name, labelProps.nativeID]).toEqual([
        subject.name,
        `${props.nativeID as string}-label`,
      ]);
    });
  }

  if (subject.ownNameProp) {
    const nameProp = subject.ownNameProp;
    it('keeps a name the caller wrote — the caller always outranks the container', () => {
      const screen = wrap(
        <Field label={FIELD_LABEL}>{subject.render({ [nameProp]: 'Caller name' })}</Field>,
      );
      const props = subjectProps(screen, subject, 'Caller name');
      expect([subject.name, props.accessibilityLabel ?? props['aria-label']]).toEqual([
        subject.name,
        'Caller name',
      ]);
    });
  }

  if (subject.lastResortName) {
    const lastResort = subject.lastResortName;
    it('falls back to its own literal name only OUTSIDE a field', () => {
      // A default name here would outrank the field's label, which is the one
      // string the user can actually read.
      const screen = wrap(subject.render({}));
      const props = subjectProps(screen, subject, lastResort);
      expect([subject.name, props.accessibilityLabel]).toEqual([subject.name, lastResort]);
    });
  }
});

// ---------------------------------------------------------------------------
// The four subjects whose inertness is not on the node the table reads
// ---------------------------------------------------------------------------

describe('a disabled field reaches the controls INSIDE a composite', () => {
  it('freezes every segment of a SegmentedControl, and a segment cannot re-enable itself', () => {
    const screen = wrap(
      <Field label="View" disabled>
        <SegmentedControl label="View" type="radio" value="a" onChange={() => {}}>
          <SegmentedControlItem value="a" testID="segment" accessibilityLabel="A" disabled={false}>
            <SegmentedControlItemText>A</SegmentedControlItemText>
          </SegmentedControlItem>
        </SegmentedControl>
      </Field>,
    );
    expect(screen.getByTestId('segment').props.disabled).toBe(true);
  });

  it('freezes every box of an InputOtp', () => {
    const screen = wrap(
      <Field label="Code" multiple disabled>
        <InputOtp testID="otp" length={4} />
      </Field>,
    );
    expect(screen.getByTestId('otp-0').props.editable).toBe(false);
    expect(screen.getByTestId('otp-3').props.editable).toBe(false);
  });

  it('freezes a RadioGroup option', () => {
    const screen = wrap(
      <Field label="Plan" multiple disabled>
        <RadioGroup
          value="a"
          onValueChange={() => {}}
          options={[{ value: 'a', label: 'A', testID: 'option-a' }]}
        />
      </Field>,
    );
    expect(screen.getByTestId('option-a').props.disabled).toBe(true);
  });

  it("freezes a PhoneInput's country select, which reads no field context of its own", () => {
    // The gap this closes: the number input reads the field, the country picker
    // does not, so the picker stayed operable inside a disabled field.
    const { PhoneInput } = require('../phone-input') as typeof import('../phone-input');
    const screen = wrap(
      <Field label="Phone" disabled>
        <PhoneInput testID="phone" countrySelectLabel="Country" />
      </Field>,
    );
    const trigger = screen.getByLabelText('Country');
    expect(trigger.props.disabled ?? trigger.props['aria-disabled']).toBe(true);
  });

  it('freezes every row of a PaymentMethodList picker', () => {
    // The group reads the field; the rows read nothing, so the group has to
    // hand the constraint down — the same gap `PhoneInput`'s picker had.
    const screen = wrap(
      <Field label="Pay with" multiple disabled>
        <PaymentMethodList
          variant="picker"
          methods={[{ id: 'a', scheme: 'Aurora', masked: '•••• 4417' }]}
          selectedId="a"
          onSelect={() => {}}
        />
      </Field>,
    );
    // `Item` puts the testID on the row's content view, so the control itself
    // is found by the name it announces.
    expect(screen.getByLabelText('Aurora, •••• 4417').props.disabled).toBe(true);
  });

  it("freezes an InputGroup's addon button as well as its input", () => {
    const { Button } = require('../button') as typeof import('../button');
    const { InputGroupAddon } = require('../input-group') as typeof import('../input-group');
    const screen = wrap(
      <Field label="Domain" disabled>
        <InputGroup testID="group">
          <TextFieldInput testID="group-input" label="Domain" value="" onChangeText={() => {}} />
          <InputGroupAddon>
            <Button testID="group-button" size="small" variant="ghost" onPress={() => {}}>
              Go
            </Button>
          </InputGroupAddon>
        </InputGroup>
      </Field>,
    );
    expect(screen.getByTestId('group').props['aria-disabled']).toBe(true);
    expect(screen.getByTestId('group-input').props.editable).toBe(false);
  });

  it('freezes a Select trigger through the root, not only the trigger prop', () => {
    const screen = wrap(
      <Field label="Fruit" disabled>
        <Select value="a" onValueChange={() => {}}>
          <SelectTrigger testID="select-trigger">
            <SelectValue placeholder="Pick" />
          </SelectTrigger>
        </Select>
      </Field>,
    );
    // The trigger is a `TriggerSlot`, so `disabled` lands on the pressable it
    // renders rather than on the wrapper the testID is on.
    const pressable = screen.getByLabelText('Fruit');
    expect(pressable.props.disabled).toBe(true);
  });
});

describe('the contract is opt-IN', () => {
  it('leaves a control that reads nothing exactly as it was', () => {
    // A `Field` cannot give an arbitrary child behaviour by wrapping it: the
    // alternative — inspecting children's types — is the thing
    // `docs/composition.mdx` argues against.
    const screen = wrap(
      <Field label="Anything" disabled error="Broken">
        <TextField>
          <Switch testID="named" value={false} onValueChange={() => {}} accessibilityLabel="Own name" />
        </TextField>
      </Field>,
    );
    // The switch opts in, so it takes the constraint but keeps the name it wrote.
    expect(screen.getByTestId('named').props.accessibilityLabel).toBe('Own name');
    expect(screen.getByTestId('named').props.disabled).toBe(true);
  });

  it('changes nothing outside a Field', () => {
    const screen = wrap(<Switch testID="bare" value={false} onValueChange={() => {}} accessibilityLabel="Bare" />);
    const props = screen.getByTestId('bare').props as Props;
    expect(props.accessibilityLabel).toBe('Bare');
    expect(props.nativeID).toBeUndefined();
    expect(props['aria-describedby']).toBeUndefined();
    expect(props['aria-invalid']).toBeUndefined();
    expect(props.disabled).toBeFalsy();
  });
});
