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
 * The gate on that is structural: the context's value type has two fields and
 * the test names them, so adding a third goes red and has to be argued.
 */
import React from 'react';
import { Text } from 'react-native';
import { render } from '@testing-library/react-native';

import {
  ControlSurface,
  useControlSurface,
  useInheritedControl,
  type ControlMaterial,
} from '../control-surface';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { TextField, TextFieldInput } from '../text-field';
import { Textarea } from '../textarea';
import { TEXT_FIELD_GEOMETRY } from '../text-field/shared';

function Probe({ explicit }: { explicit?: ControlMaterial }) {
  const material = useInheritedControl('material', explicit, 'solid');
  const density = useInheritedControl('density', undefined, 'md');
  return <Text testID="probe">{`${material}/${density}`}</Text>;
}

function RawProbe() {
  const surface = useControlSurface();
  return <Text testID="raw">{surface === null ? 'none' : `${surface.material}/${surface.density}`}</Text>;
}

describe('the control-presentation contract', () => {
  it('falls back to the component default with no container', () => {
    const { getByTestId } = render(<Probe />);
    expect(getByTestId('probe').props.children).toBe('solid/md');
  });

  it('reports NO container rather than inventing one', () => {
    // `null` is the honest answer, and it is what lets a control keep its own
    // default. A context that handed out `{ material: 'solid' }` here would
    // read identically to a real container that asked for solid.
    const { getByTestId } = render(<RawProbe />);
    expect(getByTestId('raw').props.children).toBe('none');
  });

  it('inherits the nearest container', () => {
    const { getByTestId } = render(
      <ControlSurface material="glass" density="sm">
        <Probe />
      </ControlSurface>,
    );
    expect(getByTestId('probe').props.children).toBe('glass/sm');
  });

  it('lets an explicit prop WIN over the container', () => {
    const { getByTestId } = render(
      <ControlSurface material="glass">
        <Probe explicit="solid" />
      </ControlSurface>,
    );
    expect(getByTestId('probe').props.children).toBe('solid/md');
  });

  it('inherits the field a nested container left undefined', () => {
    // The nesting rule: `undefined` defers, it does not reset. A
    // `<ControlSurface density="sm">` inside a glass island must not turn
    // the island's controls solid on its way past.
    const { getByTestId } = render(
      <ControlSurface material="glass">
        <ControlSurface density="sm">
          <Probe />
        </ControlSurface>
      </ControlSurface>,
    );
    expect(getByTestId('probe').props.children).toBe('glass/sm');
  });

  it('lets the INNER container win over the outer on a field both set', () => {
    const { getByTestId } = render(
      <ControlSurface material="glass">
        <ControlSurface material="solid">
          <Probe />
        </ControlSurface>
      </ControlSurface>,
    );
    expect(getByTestId('probe').props.children).toBe('solid/md');
  });

  it('carries presentation only — a constraint has no channel here', () => {
    // An equality, not a floor. Adding a field to this context is adding a
    // thing a descendant may override with a prop, which is the wrong contract
    // for anything that RESTRICTS a control.
    function Capture() {
      const surface = useControlSurface();
      return <Text testID="keys">{Object.keys(surface ?? {}).sort().join(',')}</Text>;
    }
    const { getByTestId } = render(
      <ControlSurface material="glass">
        <Capture />
      </ControlSurface>,
    );
    expect(getByTestId('keys').props.children).toBe('density,material');
  });
});

// ---------------------------------------------------------------------------
//  Who READS density, measured on the geometry rather than on the prop
// ---------------------------------------------------------------------------

/**
 * `density` is `'medium' | 'small'`, which is exactly the `size` vocabulary of
 * the text-field family — so those three take it from the container, and the
 * assertion is the resolved PADDING rather than the prop, because the prop
 * being passed down is not the same claim as the control drawing smaller.
 */
function themed(ui: React.ReactElement) {
  return render(
    <BloomThemeProvider mode="light" colorPreset="teal">
      {ui}
    </BloomThemeProvider>,
  );
}

/** The shell's horizontal padding, which differs per density. */
function shellPadding(screen: ReturnType<typeof themed>, testID: string): number | undefined {
  const flat = Object.assign({}, ...[screen.getByTestId(testID).props.style].flat(3).filter(Boolean)) as {
    paddingHorizontal?: number;
    paddingLeft?: number;
  };
  return flat.paddingHorizontal ?? flat.paddingLeft;
}

describe('density adoption', () => {
  const small = TEXT_FIELD_GEOMETRY.small.paddingHorizontal;
  const medium = TEXT_FIELD_GEOMETRY.medium.paddingHorizontal;

  it('is worth measuring at all: the two densities draw different geometry', () => {
    expect(small).not.toBe(medium);
  });

  it('makes a Textarea inside a small container small', () => {
    const screen = themed(
      <ControlSurface density="small">
        <Textarea testID="area" label="Bio" />
      </ControlSurface>,
    );
    // The shell is the second view; its padding is reduced by the ring width on
    // both densities, so the DIFFERENCE is what identifies the density.
    const padding = shellPadding(screen, 'area');
    expect(padding).toBeUndefined(); // the testID is on the outer box
    const shell = screen.UNSAFE_getAllByType(require('react-native').View)
      .map((node: { props: { style?: unknown } }) => Object.assign({}, ...[node.props.style].flat(3).filter(Boolean)))
      .find((style: { borderRadius?: number; paddingHorizontal?: number }) => style.paddingHorizontal !== undefined);
    expect(shell?.paddingHorizontal).toBe(small - 2);
  });

  it('lets a Textarea keep an explicit size inside a small container', () => {
    const screen = themed(
      <ControlSurface density="small">
        <Textarea testID="area" label="Bio" size="medium" />
      </ControlSurface>,
    );
    const shell = screen.UNSAFE_getAllByType(require('react-native').View)
      .map((node: { props: { style?: unknown } }) => Object.assign({}, ...[node.props.style].flat(3).filter(Boolean)))
      .find((style: { paddingHorizontal?: number }) => style.paddingHorizontal !== undefined);
    expect(shell?.paddingHorizontal).toBe(medium - 2);
  });

  it('makes a TextField inside a small container small, and an explicit prop still wins', () => {
    const inherited = themed(
      <ControlSurface density="small">
        <TextField>
          <TextFieldInput label="Email" value="" onChangeText={() => {}} testID="input" />
        </TextField>
      </ControlSurface>,
    );
    const explicit = themed(
      <ControlSurface density="small">
        <TextField size="medium">
          <TextFieldInput label="Email" value="" onChangeText={() => {}} testID="input" />
        </TextField>
      </ControlSurface>,
    );
    // Both densities share the input's type scale, so the discriminator is the
    // shell's own side padding, which the geometry table sets per density.
    const paddingOf = (screen: ReturnType<typeof themed>) =>
      screen.UNSAFE_getAllByType(require('react-native').View)
        .map((node: { props: { style?: unknown } }) => Object.assign({}, ...[node.props.style].flat(3).filter(Boolean)))
        .find((style: { paddingHorizontal?: number }) => style.paddingHorizontal !== undefined)?.paddingHorizontal;
    expect(paddingOf(inherited)).toBe(small);
    expect(paddingOf(explicit)).toBe(medium);
  });
});
