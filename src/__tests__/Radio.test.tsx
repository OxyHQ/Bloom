import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { Radio, RadioGroup } from '../radio';

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
      <Radio value="daily" selected={false} onSelect={onSelect} label="Daily" />,
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
      <Radio value="daily" selected onSelect={onSelect} label="Daily" />,
    );
    fireEvent.press(getByLabelText('Daily'));
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('does not fire when disabled', () => {
    const onSelect = jest.fn();
    const { getByLabelText } = renderWithTheme(
      <Radio value="daily" selected={false} onSelect={onSelect} label="Daily" disabled />,
    );
    fireEvent.press(getByLabelText('Daily'));
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('renders its label and description', () => {
    const { getByText } = renderWithTheme(
      <Radio
        value="weekly"
        selected={false}
        onSelect={() => {}}
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
