import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { Radio, RadioCard, RadioGroup, RadioChip } from '../radio';

function renderWithTheme(ui: React.ReactElement) {
  return render(
    <BloomThemeProvider mode="light" colorPreset="teal">
      {ui}
    </BloomThemeProvider>,
  );
}

interface TestNode {
  type: unknown;
  props: Record<string, unknown>;
}

/**
 * The option HOST nodes, read by PROP.
 *
 * Host only: `findAll` walks composites too, so the `Radio` element and the
 * `Pressable` it renders both carry the role and the count comes back doubled.
 *
 * By prop rather than by rendered attribute because this suite runs under the
 * repo-wide react-native mock, which reads props as written — which is exactly
 * why it is not the aria gate. What react-native-web emits is asserted against
 * the real DOM in `aria-state-web.test.tsx`.
 */
function radioNodes(root: {
  findAll: (predicate: (node: TestNode) => boolean) => TestNode[];
}): TestNode[] {
  return root.findAll(
    (node) => typeof node.type === 'string' && node.props.accessibilityRole === 'radio',
  );
}

const OPTIONS = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly', description: 'Every Monday' },
  { value: 'never', label: 'Never', disabled: true },
] as const;

// `radio-indicator` was the indicator alone — no press target, no label, no
// group — while `checkbox` was a whole control. Anyone who wanted a radio had to
// build one, and the two families drew the boundary at different levels.
describe('Radio', () => {
  it('reports its value when chosen', () => {
    const onSelect = jest.fn();
    const { getByLabelText } = renderWithTheme(
      <Radio value="daily" checked={false} onValueChange={onSelect} label="Daily" />,
    );
    fireEvent.press(getByLabelText('Daily'));
    expect(onSelect).toHaveBeenCalledWith('daily');
  });

  it('does NOT fire when the already-chosen option is pressed', () => {
    // The property that separates a radio from a checkbox: it has no "off", so
    // re-pressing must not report a change that did not happen. A group wired to
    // a reducer would otherwise re-run its effects on every stray tap.
    const onSelect = jest.fn();
    const { getByLabelText } = renderWithTheme(
      <Radio value="daily" checked onValueChange={onSelect} label="Daily" />,
    );
    fireEvent.press(getByLabelText('Daily'));
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('does not fire when disabled', () => {
    const onSelect = jest.fn();
    const { getByLabelText } = renderWithTheme(
      <Radio value="daily" checked={false} onValueChange={onSelect} label="Daily" disabled />,
    );
    fireEvent.press(getByLabelText('Daily'));
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('renders its label and description', () => {
    const { getByText } = renderWithTheme(
      <Radio
        value="weekly"
        checked={false}
        onValueChange={() => {}}
        label="Weekly"
        description="Every Monday"
      />,
    );
    expect(getByText('Weekly')).toBeTruthy();
    expect(getByText('Every Monday')).toBeTruthy();
  });
});

describe('RadioGroup', () => {
  it('marks exactly one option as chosen', () => {
    const { UNSAFE_root } = renderWithTheme(
      <RadioGroup
        label="Digest"
        value="weekly"
        onValueChange={() => {}}
        options={[...OPTIONS]}
      />,
    );
    const radios = radioNodes(UNSAFE_root);
    expect(radios).toHaveLength(3);
    expect(radios.filter((r) => r.props['aria-checked'] === true)).toHaveLength(1);
  });

  it('reports the newly chosen value', () => {
    const onValueChange = jest.fn();
    const { getByLabelText } = renderWithTheme(
      <RadioGroup
        label="Digest"
        value="weekly"
        onValueChange={onValueChange}
        options={[...OPTIONS]}
      />,
    );
    fireEvent.press(getByLabelText('Daily'));
    expect(onValueChange).toHaveBeenCalledWith('daily');
  });

  it('honours a per-option disabled flag and a group-wide one', () => {
    const onValueChange = jest.fn();
    const { getByLabelText, rerender } = renderWithTheme(
      <RadioGroup
        label="Digest"
        value="weekly"
        onValueChange={onValueChange}
        options={[...OPTIONS]}
      />,
    );
    fireEvent.press(getByLabelText('Never'));
    expect(onValueChange).not.toHaveBeenCalled();

    rerender(
      <BloomThemeProvider mode="light" colorPreset="teal">
        <RadioGroup
          label="Digest"
          value="weekly"
          onValueChange={onValueChange}
          options={[...OPTIONS]}
          disabled
        />
      </BloomThemeProvider>,
    );
    fireEvent.press(getByLabelText('Daily'));
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('carries its own accessible name', () => {
    // A `radiogroup` with no name announces a list of options and nothing about
    // what is being chosen.
    const { getByLabelText } = renderWithTheme(
      <RadioGroup
        label="Digest frequency"
        value={undefined}
        onValueChange={() => {}}
        options={[...OPTIONS]}
      />,
    );
    expect(getByLabelText('Digest frequency')).toBeTruthy();
  });

  it('accepts a group with nothing chosen yet', () => {
    const { UNSAFE_root } = renderWithTheme(
      <RadioGroup
        label="Digest"
        value={undefined}
        onValueChange={() => {}}
        options={[...OPTIONS]}
      />,
    );
    const radios = radioNodes(UNSAFE_root);
    expect(radios).toHaveLength(3);
    expect(radios.filter((r) => r.props['aria-checked'] === true)).toHaveLength(0);
  });
});

describe('RadioCard', () => {
  it('selects its value when pressed, and re-choosing is a no-op', () => {
    const onSelect = jest.fn();
    const { getByLabelText, rerender } = renderWithTheme(
      <RadioCard value="pro" title="Pro" description="Unlimited." checked={false} onValueChange={onSelect} />,
    );
    const card = getByLabelText('Pro');
    expect(card.props.accessibilityRole).toBe('radio');
    expect(card.props['aria-checked']).toBe(false);
    fireEvent.press(card);
    expect(onSelect).toHaveBeenCalledWith('pro');

    onSelect.mockClear();
    rerender(
      <BloomThemeProvider mode="light" colorPreset="teal">
        <RadioCard value="pro" title="Pro" checked onValueChange={onSelect} />
      </BloomThemeProvider>,
    );
    fireEvent.press(getByLabelText('Pro'));
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('is what a card-variant group renders, one per option', () => {
    const onValueChange = jest.fn();
    const { root, getByText, getByLabelText } = renderWithTheme(
      <RadioGroup
        label="Plan"
        variant="card"
        value="daily"
        onValueChange={onValueChange}
        options={[
          { value: 'daily', label: 'Daily', description: 'Every day.' },
          { value: 'weekly', label: 'Weekly' },
        ]}
      />,
    );
    expect(radioNodes(root)).toHaveLength(2);
    expect(getByText('Every day.')).toBeTruthy();
    fireEvent.press(getByLabelText('Weekly'));
    expect(onValueChange).toHaveBeenCalledWith('weekly');
  });
});


it('supports uncontrolled group selection and does not clear the chosen option', () => {
  const onChange = jest.fn();
  const screen = renderWithTheme(<RadioGroup defaultValue="daily" onValueChange={onChange} label="Frequency" options={[{value:'daily',label:'Daily'}, {value:'weekly',label:'Weekly'}]} />);
  fireEvent.press(screen.getByLabelText('Weekly'));
  expect(screen.getByLabelText('Weekly').props['aria-checked']).toBe(true);
  expect(screen.getByLabelText('Daily').props['aria-checked']).toBe(false);
  expect(onChange).toHaveBeenLastCalledWith('weekly');
  fireEvent.press(screen.getByLabelText('Weekly'));
  expect(onChange).toHaveBeenCalledTimes(1);
});


it('keeps an explicitly undefined selection controlled until the parent updates it', () => {
  const change = jest.fn();
  const options = [{value:'daily',label:'Daily'}, {value:'weekly',label:'Weekly'}];
  const ui = (value: string | undefined) => <BloomThemeProvider><RadioGroup value={value} onValueChange={change} label="Frequency" options={options} /></BloomThemeProvider>;
  const screen = render(ui(undefined));
  fireEvent.press(screen.getByLabelText('Weekly'));
  expect(change).toHaveBeenCalledWith('weekly');
  expect(screen.getByLabelText('Weekly').props['aria-checked']).toBe(false);
  screen.rerender(ui('weekly'));
  expect(screen.getByLabelText('Weekly').props['aria-checked']).toBe(true);
  screen.rerender(ui(undefined));
  expect(screen.getByLabelText('Weekly').props['aria-checked']).toBe(false);
});
it('publishes each actual native radio host to renderOption without moving selection ownership', () => {
  const refs = new Map<string, import('../radio').RadioOptionState['controlRef']>();
  const hosts = new Map<string, { focus: jest.Mock }>();
  const change = jest.fn();
  const api = render(<BloomThemeProvider><RadioGroup label="Delivery" options={OPTIONS} defaultValue="daily" onValueChange={change}
    renderOption={(option, control, state) => { refs.set(option.value,state.controlRef); return control; }} /></BloomThemeProvider>, {
    createNodeMock: element => {
      const props = element.props as { accessibilityRole?: string; accessibilityLabel?: string };
      if (props.accessibilityRole !== 'radio') return null;
      const label=props.accessibilityLabel as string;
      const host=hosts.get(label) ?? {focus:jest.fn()}; hosts.set(label,host); return host;
    },
  });
  expect(refs.get('daily')?.current).toBe(hosts.get('Daily'));
  expect(refs.get('weekly')?.current).toBe(hosts.get('Weekly'));
  fireEvent.press(api.getByLabelText('Weekly'));expect(change).toHaveBeenCalledWith('weekly');
  fireEvent.press(api.getByLabelText('Never'));expect(change).toHaveBeenCalledTimes(1);
});


describe('RadioChip', () => {
  it('owns native presses with no indicator, retains checked state and blocks disabled changes', () => {
    const onChange = jest.fn();
    const api = renderWithTheme(<RadioGroup label="Size" variant="chip" options={OPTIONS} defaultValue="daily" onValueChange={onChange} />);
    expect(api.UNSAFE_queryAllByType(require('../radio-indicator').RadioIndicator)).toHaveLength(0);
    fireEvent.press(api.getByLabelText('Weekly'));
    expect(onChange).toHaveBeenCalledWith('weekly');
    expect(api.getByLabelText('Weekly').props['aria-checked']).toBe(true);
    fireEvent.press(api.getByLabelText('Weekly'));
    fireEvent.press(api.getByLabelText('Never'));
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('uses the explicit name for decorative content and preserves standalone ownership', () => {
    const onChange = jest.fn();
    const api = renderWithTheme(<RadioChip value="blue" labelContent={<></>} accessibilityLabel="Blue" onValueChange={onChange} />);
    fireEvent.press(api.getByLabelText('Blue'));
    expect(onChange).toHaveBeenCalledWith('blue');
    expect(api.getByLabelText('Blue').props['aria-checked']).toBe(false);
  });
});
