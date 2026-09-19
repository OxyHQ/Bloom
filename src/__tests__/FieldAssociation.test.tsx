/**
 * `Field` ASSOCIATES its label, description and error with the control — it does
 * not only stack them.
 *
 * The defect this replaces is the quietest kind there is. A field that merely
 * stacks renders identically to one that associates: the label is above, the
 * error is below and red, and a sighted reviewer sees a correct form. What is
 * missing only shows up in a screen reader, where the control has no name, no
 * description, and an error that is announced as a stray paragraph somewhere
 * else on the page.
 *
 * So every assertion here reads an ATTRIBUTE off the rendered control rather
 * than a prop off the wrapper, and the negative cases are included: an explicit
 * id must still win, a description must stop being described once an error
 * replaces it, and a `multiple` field must NOT hand one id to several controls.
 */
import React from 'react';
import { render } from '@testing-library/react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { Field } from '../field';
import { useFieldControl } from '../field/context';
import { TextField, TextFieldInput } from '../text-field';

function wrap(ui: React.ReactElement) {
  return render(
    <BloomThemeProvider mode="light" colorPreset="teal">
      {ui}
    </BloomThemeProvider>,
  );
}

/** A control that opts in, so the contract can be read without a real input. */
function Probe({ testID = 'probe' }: { testID?: string }) {
  const field = useFieldControl();
  return (
    <TextField>
      <TextFieldInput testID={testID} label="fallback" value="" onChangeText={() => {}} />
      {field ? null : null}
    </TextField>
  );
}

describe('Field association', () => {
  it('gives the control the id the label points at', () => {
    const screen = wrap(
      <Field label="Full name" testID="field">
        <Probe />
      </Field>,
    );
    const input = screen.getByTestId('probe');
    const label = screen.getByText('Full name');
    expect(typeof input.props.nativeID).toBe('string');
    expect(input.props.nativeID).not.toHaveLength(0);
    // The visible label points AT the control, and carries its own id so a
    // `multiple` field can reference it instead.
    expect(label.props.htmlFor ?? label.props.nativeID).toContain(input.props.nativeID);
  });

  it('names the control with the field label, so the two cannot disagree', () => {
    // `aria-label` OVERRIDES a `<label for>` on web, and on native there is no
    // association at all — so the control's own label prop must yield to the
    // field's, or the announced name and the visible one drift apart.
    const screen = wrap(
      <Field label="Full name">
        <Probe />
      </Field>,
    );
    expect(screen.getByTestId('probe').props.accessibilityLabel).toBe('Full name');
  });

  it('keeps its own name with no field around it (control)', () => {
    const screen = wrap(<Probe />);
    expect(screen.getByTestId('probe').props.accessibilityLabel).toBe('fallback');
  });

  it('describes the control by the DESCRIPTION, and by the ERROR once there is one', () => {
    const described = wrap(
      <Field label="Email" description="We never share it.">
        <Probe />
      </Field>,
    );
    const descriptionId = described.getByTestId('probe').props['aria-describedby'];
    expect(descriptionId).toBeTruthy();
    expect(described.getByText('We never share it.').props.nativeID).toBe(descriptionId);
    described.unmount();

    const errored = wrap(
      <Field label="Email" description="We never share it." error="That address is taken.">
        <Probe />
      </Field>,
    );
    const input = errored.getByTestId('probe');
    const errorId = input.props['aria-describedby'];
    expect(errorId).toBeTruthy();
    expect(errored.getByText('That address is taken.').props.nativeID).toBe(errorId);
    // The description is not merely hidden — it is gone, so nothing describes
    // the control twice.
    expect(errored.queryByText('We never share it.')).toBeNull();
    expect(input.props['aria-invalid']).toBe(true);
  });

  it('marks the control required when the field is', () => {
    const screen = wrap(
      <Field label="Email" required>
        <Probe />
      </Field>,
    );
    expect(screen.getByTestId('probe').props['aria-required']).toBe(true);
  });

  it('disables the control — a constraint the control cannot refuse', () => {
    const screen = wrap(
      <Field label="Email" disabled>
        <Probe />
      </Field>,
    );
    const input = screen.getByTestId('probe');
    expect(input.props.editable).toBe(false);
    expect(input.props['aria-disabled']).toBe(true);
  });

  it('lets an explicit nativeID own every derived id', () => {
    const screen = wrap(
      <Field label="Email" nativeID="signup-email" description="Work address.">
        <Probe />
      </Field>,
    );
    const input = screen.getByTestId('probe');
    expect(input.props.nativeID).toBe('signup-email');
    expect(input.props['aria-describedby']).toBe('signup-email-description');
  });

  it('a MULTIPLE field is a labelled group and hands out no control id', () => {
    // One id on three inputs is invalid HTML, and an error described by three
    // inputs is read three times.
    const screen = wrap(
      <Field label="Date of birth" multiple error="Enter a full date." testID="field">
        <Probe testID="day" />
        <Probe testID="month" />
      </Field>,
    );
    const group = screen.getByTestId('field');
    expect(group.props.role).toBe('group');
    expect(group.props['aria-labelledby']).toBeTruthy();
    expect(group.props['aria-describedby']).toBe(screen.getByText('Enter a full date.').props.nativeID);
    // Neither control took the field's id, and neither is described by the
    // group's error.
    expect(screen.getByTestId('day').props.nativeID).toBeUndefined();
    expect(screen.getByTestId('month').props.nativeID).toBeUndefined();
    expect(screen.getByTestId('day').props['aria-describedby']).toBeUndefined();
  });

  it('gives two fields on one page different ids', () => {
    const screen = wrap(
      <>
        <Field label="First">
          <Probe testID="a" />
        </Field>
        <Field label="Last">
          <Probe testID="b" />
        </Field>
      </>,
    );
    expect(screen.getByTestId('a').props.nativeID).not.toBe(screen.getByTestId('b').props.nativeID);
  });
});
