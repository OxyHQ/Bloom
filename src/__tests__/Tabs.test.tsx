import React from 'react';
import type { ReactTestInstance } from 'react-test-renderer';
import { fireEvent, render } from '@testing-library/react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { Tabs, TabsTrigger } from '../tabs';

function renderWithTheme(ui: React.ReactElement) {
  return render(
    <BloomThemeProvider mode="light" colorPreset="teal">
      {ui}
    </BloomThemeProvider>,
  );
}

// Flatten a (possibly nested / conditional) RN style prop into one object.
function flattenStyle(style: unknown): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const visit = (s: unknown): void => {
    if (Array.isArray(s)) s.forEach(visit);
    else if (s && typeof s === 'object') Object.assign(out, s);
  };
  visit(style);
  return out;
}

// Walk up from a label's Text node to the trigger Pressable (role="tab").
function triggerFor(node: ReactTestInstance): ReactTestInstance {
  let current: ReactTestInstance | null = node;
  while (current && current.props?.accessibilityRole !== 'tab') {
    current = current.parent;
  }
  if (!current) throw new Error('No trigger ancestor with role "tab" found');
  return current;
}

function Bar({
  value,
  onValueChange = () => {},
  ...props
}: {
  value: string;
  onValueChange?: (v: string) => void;
} & Partial<React.ComponentProps<typeof Tabs>>) {
  return (
    <Tabs value={value} onValueChange={onValueChange} testID="tabs" {...props}>
      <TabsTrigger value="a" label="First" />
      <TabsTrigger value="b" label="Second" />
    </Tabs>
  );
}

describe('Tabs', () => {
  it('renders trigger labels', () => {
    const { getByText } = renderWithTheme(<Bar value="a" />);
    expect(getByText('First')).toBeTruthy();
    expect(getByText('Second')).toBeTruthy();
  });

  it('calls onValueChange when a trigger is pressed', () => {
    const onValueChange = jest.fn();
    const { getByText } = renderWithTheme(
      <Bar value="a" onValueChange={onValueChange} />,
    );
    fireEvent.press(getByText('Second'));
    expect(onValueChange).toHaveBeenCalledWith('b');
  });

  it('renders exactly one shared underline indicator, not per-trigger borders', () => {
    const { getByTestId, getByText } = renderWithTheme(<Bar value="a" />);
    // One shared indicator element...
    expect(getByTestId('tabs-indicator')).toBeTruthy();
    // ...and no trigger draws the old static active bottom border.
    for (const label of ['First', 'Second']) {
      const trigger = triggerFor(getByText(label));
      expect(flattenStyle(trigger.props.style).borderBottomWidth).toBeUndefined();
    }
  });

  it('does not render the underline indicator for the filled variant', () => {
    const { queryByTestId } = renderWithTheme(<Bar value="a" variant="filled" />);
    expect(queryByTestId('tabs-indicator')).toBeNull();
  });

  it('stretches each trigger to equal width when fullWidth is set', () => {
    const { getByText } = renderWithTheme(<Bar value="a" fullWidth />);
    for (const label of ['First', 'Second']) {
      expect(flattenStyle(triggerFor(getByText(label)).props.style).flex).toBe(1);
    }
  });

  it('keeps triggers content-sized (no flex) by default', () => {
    const { getByText } = renderWithTheme(<Bar value="a" />);
    for (const label of ['First', 'Second']) {
      expect(
        flattenStyle(triggerFor(getByText(label)).props.style).flex,
      ).toBeUndefined();
    }
  });

  it('marks the active trigger as selected for accessibility', () => {
    const { getByText } = renderWithTheme(<Bar value="b" />);
    expect(
      triggerFor(getByText('First')).props.accessibilityState.selected,
    ).toBe(false);
    expect(
      triggerFor(getByText('Second')).props.accessibilityState.selected,
    ).toBe(true);
  });
});
