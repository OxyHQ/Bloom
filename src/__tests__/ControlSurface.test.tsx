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

function Probe({ explicit }: { explicit?: ControlMaterial }) {
  const material = useInheritedControl('material', explicit, 'solid');
  const density = useInheritedControl('density', undefined, 'medium');
  return <Text testID="probe">{`${material}/${density}`}</Text>;
}

function RawProbe() {
  const surface = useControlSurface();
  return <Text testID="raw">{surface === null ? 'none' : `${surface.material}/${surface.density}`}</Text>;
}

describe('the control-presentation contract', () => {
  it('falls back to the component default with no container', () => {
    const { getByTestId } = render(<Probe />);
    expect(getByTestId('probe').props.children).toBe('solid/medium');
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
      <ControlSurface material="glass" density="small">
        <Probe />
      </ControlSurface>,
    );
    expect(getByTestId('probe').props.children).toBe('glass/small');
  });

  it('lets an explicit prop WIN over the container', () => {
    const { getByTestId } = render(
      <ControlSurface material="glass">
        <Probe explicit="solid" />
      </ControlSurface>,
    );
    expect(getByTestId('probe').props.children).toBe('solid/medium');
  });

  it('inherits the field a nested container left undefined', () => {
    // The nesting rule: `undefined` defers, it does not reset. A
    // `<ControlSurface density="small">` inside a glass island must not turn
    // the island's controls solid on its way past.
    const { getByTestId } = render(
      <ControlSurface material="glass">
        <ControlSurface density="small">
          <Probe />
        </ControlSurface>
      </ControlSurface>,
    );
    expect(getByTestId('probe').props.children).toBe('glass/small');
  });

  it('lets the INNER container win over the outer on a field both set', () => {
    const { getByTestId } = render(
      <ControlSurface material="glass">
        <ControlSurface material="solid">
          <Probe />
        </ControlSurface>
      </ControlSurface>,
    );
    expect(getByTestId('probe').props.children).toBe('solid/medium');
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
