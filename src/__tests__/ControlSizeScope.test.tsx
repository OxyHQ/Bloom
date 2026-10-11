/**
 * The precedence rule, as a measurement rather than as a comment.
 *
 *     an explicit prop  >  the nearest container  >  the component's default
 *
 * Every assertion here is written so that BOTH directions fail: a context that
 * stopped reaching a control fails, and a context that started OVERRIDING an
 * explicit prop fails too. The second is the one a reader would not think to
 * check, and it is the more damaging of the two — a container that wins over
 * the caller is a container the caller cannot escape.
 *
 * The last case is the boundary this contract draws: a constraint is NOT a
 * default. Nothing that restricts a control (`disabled`, modal inertness, an
 * accessibility preference) may travel on this channel, because the rule above
 * is exactly wrong for one — a descendant would be able to re-enable itself.
 * The gate on that is structural: the visual scope carries size and tone only; Field owns constraints.
 */
import React from 'react';
import { Text } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';

import { BloomScope, useBloomAppearance, type BloomSize } from '../appearance';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { TextField, TextFieldInput } from '../text-field';
import { Textarea } from '../textarea';
import { TEXT_FIELD_GEOMETRY } from '../text-field/shared';

function Probe({ explicit }: { explicit?: BloomSize }) {
  const { size: density } = useBloomAppearance({ size: explicit }, { size: 'md', tone: 'neutral' });
  return <Text testID="probe">{density}</Text>;
}

describe('inherited control density', () => {
  it('defaults to md without a container', () => {
    expect(render(<Probe />).getByTestId('probe').props.children).toBe('md');
  });
  it('inherits and lets explicit props win', () => {
    const screen = render(
      <BloomScope size="sm">
        <Probe />
      </BloomScope>,
    );
    expect(screen.getByTestId('probe').props.children).toBe('sm');
    screen.rerender(
      <BloomScope size="sm">
        <Probe explicit="lg" />
      </BloomScope>,
    );
    expect(screen.getByTestId('probe').props.children).toBe('lg');
  });
  it('nested scopes inherit omitted density', () => {
    expect(
      render(
        <BloomScope size="sm">
          <BloomScope>
            <Probe />
          </BloomScope>
        </BloomScope>,
      ).getByTestId('probe').props.children,
    ).toBe('sm');
  });
  it('lets the nearest scope win and inherits an omitted size', () => {
    const screen = render(
      <BloomScope size="sm">
        <BloomScope size="lg">
          <BloomScope>
            <Probe />
          </BloomScope>
        </BloomScope>
      </BloomScope>,
    );
    expect(screen.getByTestId('probe').props.children).toBe('lg');
  });
});

// ---------------------------------------------------------------------------
//  Who READS density, measured on the geometry rather than on the prop
// ---------------------------------------------------------------------------

/** Geometry proves inheritance reached each actual control. */
function themed(ui: React.ReactElement) {
  return render(
    <BloomThemeProvider mode="light" colorPreset="teal">
      {ui}
    </BloomThemeProvider>,
  );
}

/** The shell's horizontal padding, which differs per density. */
function shellPadding(screen: ReturnType<typeof themed>, testID: string): number | undefined {
  const flat = Object.assign(
    {},
    ...[screen.getByTestId(testID).props.style].flat(3).filter(Boolean),
  ) as {
    paddingHorizontal?: number;
    paddingLeft?: number;
  };
  return flat.paddingHorizontal ?? flat.paddingLeft;
}

describe('density adoption', () => {
  const small = TEXT_FIELD_GEOMETRY.sm.paddingHorizontal;
  const medium = TEXT_FIELD_GEOMETRY.md.paddingHorizontal;

  it('is worth measuring at all: the two densities draw different geometry', () => {
    expect(small).not.toBe(medium);
  });

  it('makes a Textarea inside a small container small', () => {
    const screen = themed(
      <BloomScope size="sm">
        <Textarea testID="area" label="Bio" />
      </BloomScope>,
    );
    // The shell is the second view; its padding is reduced by the ring width on
    // both densities, so the DIFFERENCE is what identifies the density.
    const padding = shellPadding(screen, 'area');
    expect(padding).toBeUndefined(); // the testID is on the outer box
    const shell = screen
      .UNSAFE_getAllByType(require('react-native').View)
      .map((node: { props: { style?: unknown } }) =>
        Object.assign({}, ...[node.props.style].flat(3).filter(Boolean)),
      )
      .find(
        (style: { borderRadius?: number; paddingHorizontal?: number }) =>
          style.paddingHorizontal !== undefined,
      );
    expect(shell?.paddingHorizontal).toBe(small - 2);
  });

  it('lets a Textarea keep an explicit size inside a small container', () => {
    const screen = themed(
      <BloomScope size="sm">
        <Textarea testID="area" label="Bio" size="md" />
      </BloomScope>,
    );
    const shell = screen
      .UNSAFE_getAllByType(require('react-native').View)
      .map((node: { props: { style?: unknown } }) =>
        Object.assign({}, ...[node.props.style].flat(3).filter(Boolean)),
      )
      .find((style: { paddingHorizontal?: number }) => style.paddingHorizontal !== undefined);
    expect(shell?.paddingHorizontal).toBe(medium - 2);
  });

  it('makes a TextField inside a small container small, and an explicit prop still wins', () => {
    const inherited = themed(
      <BloomScope size="sm">
        <TextField>
          <TextFieldInput label="Email" value="" onChangeText={() => {}} testID="input" />
        </TextField>
      </BloomScope>,
    );
    const explicit = themed(
      <BloomScope size="sm">
        <TextField size="md">
          <TextFieldInput label="Email" value="" onChangeText={() => {}} testID="input" />
        </TextField>
      </BloomScope>,
    );
    // Both densities share the input's type scale, so the discriminator is the
    // shell's own side padding, which the geometry table sets per density.
    const paddingOf = (screen: ReturnType<typeof themed>) =>
      screen
        .UNSAFE_getAllByType(require('react-native').View)
        .map((node: { props: { style?: unknown } }) =>
          Object.assign({}, ...[node.props.style].flat(3).filter(Boolean)),
        )
        .find((style: { paddingHorizontal?: number }) => style.paddingHorizontal !== undefined)
        ?.paddingHorizontal;
    expect(paddingOf(inherited)).toBe(small);
    expect(paddingOf(explicit)).toBe(medium);
  });
});

import { Switch } from '../switch';
import { Button } from '../button';
import { ButtonGroup, ButtonGroupItem } from '../button-group';
import { Field } from '../field';
import { resolvedStyle } from './support/rendered-style';

it('sizes Button, Switch and joined controls from the same nearest scope', () => {
  const screen = themed(
    <BloomScope size="lg">
      <BloomScope size="sm">
        <Button testID="button">Save</Button>
        <Switch testID="switch" accessibilityLabel="Enabled" />
        <ButtonGroup>
          <ButtonGroupItem testID="item">Day</ButtonGroupItem>
        </ButtonGroup>
        <Button testID="explicit" size="lg">
          Large
        </Button>
      </BloomScope>
    </BloomScope>,
  );
  expect(resolvedStyle(screen.getByTestId('button').props.style).height).toBe(32);
  expect(resolvedStyle(screen.getByTestId('explicit').props.style).height).toBe(44);
  expect(resolvedStyle(screen.getByTestId('item').props.style).height).toBe(30);
  expect(
    screen.getByTestId('switch').findAll((node) => resolvedStyle(node.props.style).width === 36)
      .length,
  ).toBeGreaterThan(0);
});

it('supports uncontrolled Switch state and prevents a child overriding Field disabled', () => {
  const onChange = jest.fn();
  const screen = themed(
    <Switch
      defaultChecked
      testID="switch"
      accessibilityLabel="Enabled"
      onCheckedChange={onChange}
    />,
  );
  fireEvent.press(screen.getByTestId('switch'));
  expect(screen.getByTestId('switch').props['aria-checked']).toBe(false);
  expect(onChange).toHaveBeenLastCalledWith(false);
  screen.rerender(
    <BloomThemeProvider>
      <Field disabled>
        <Switch
          disabled={false}
          testID="switch"
          accessibilityLabel="Enabled"
          onCheckedChange={onChange}
        />
      </Field>
    </BloomThemeProvider>,
  );
  fireEvent.press(screen.getByTestId('switch'));
  expect(onChange).toHaveBeenCalledTimes(1);
});

import { Select, SelectTrigger, SelectIcon } from '../select';
import { SelectChevron } from '../select/shared';
it('sizes Select from the nearest scope while its explicit size wins', () => {
  const screen = themed(
    <BloomScope size="sm">
      <Select>
        <SelectTrigger label="Choose">
          <SelectIcon />
        </SelectTrigger>
      </Select>
      <Select size="md">
        <SelectTrigger label="Explicit">
          <SelectIcon />
        </SelectTrigger>
      </Select>
    </BloomScope>,
  );
  expect(screen.UNSAFE_getAllByType(SelectChevron).map((node) => node.props.size)).toEqual([
    14, 16,
  ]);
});

import { Checkbox, CheckboxCard } from '../checkbox';
import { RadioCard } from '../radio';
it('supports uncontrolled Checkbox state and canonical inherited geometry', () => {
  const change = jest.fn();
  const screen = themed(
    <BloomScope size="sm">
      <Checkbox defaultChecked accessibilityLabel="Remember" onCheckedChange={change} />
    </BloomScope>,
  );
  fireEvent.press(screen.getByLabelText('Remember'));
  expect(screen.getByLabelText('Remember').props['aria-checked']).toBe(false);
  expect(change).toHaveBeenCalledWith(false);
});

it('applies Field constraints to card-shaped checkbox and radio controls', () => {
  const change = jest.fn();
  const screen = themed(
    <Field disabled multiple>
      <CheckboxCard title="Remember" disabled={false} onCheckedChange={change} />
      <RadioCard value="weekly" title="Weekly" disabled={false} onValueChange={change} />
    </Field>,
  );
  fireEvent.press(screen.getByLabelText('Remember'));
  fireEvent.press(screen.getByLabelText('Weekly'));
  expect(change).not.toHaveBeenCalled();
  expect(screen.getByLabelText('Remember').props.disabled).toBe(true);
  expect(screen.getByLabelText('Weekly').props.disabled).toBe(true);
});

it('treats explicit undefined checked as controlled false on boolean controls', () => {
  const change = jest.fn();
  const screen = themed(
    <>
      <Switch checked={undefined} accessibilityLabel="Toggle" onCheckedChange={change} />
      <Checkbox checked={undefined} accessibilityLabel="Check" onCheckedChange={change} />
      <CheckboxCard checked={undefined} title="Card" onCheckedChange={change} />
    </>,
  );
  for (const label of ['Toggle', 'Check', 'Card']) {
    fireEvent.press(screen.getByLabelText(label));
    expect(screen.getByLabelText(label).props['aria-checked']).toBe(false);
  }
  expect(change).toHaveBeenCalledTimes(3);
});
