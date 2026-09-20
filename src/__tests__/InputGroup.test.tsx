import React from 'react';
import { Text } from 'react-native';
import { render } from '@testing-library/react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { InputGroup, InputGroupAddon } from '../input-group';
import { TextFieldInput } from '../text-field';

function renderWithTheme(ui: React.ReactElement) {
  return render(
    <BloomThemeProvider mode="light" colorPreset="teal">
      {ui}
    </BloomThemeProvider>,
  );
}

describe('InputGroup', () => {
  it('renders addons and the input', () => {
    const { getByText } = renderWithTheme(
      <InputGroup>
        <InputGroupAddon>https://</InputGroupAddon>
        <Text>field</Text>
        <InputGroupAddon divider>
          <Text>Go</Text>
        </InputGroupAddon>
      </InputGroup>,
    );
    expect(getByText('https://')).toBeTruthy();
    expect(getByText('field')).toBeTruthy();
    expect(getByText('Go')).toBeTruthy();
  });

  it('exposes Addon as a static member', () => {
    expect(InputGroupAddon).toBeTruthy();
  });

  it('marks disabled state for accessibility', () => {
    const { getByTestId } = renderWithTheme(
      <InputGroup disabled testID="group">
        <Text>field</Text>
      </InputGroup>,
    );
    // `aria-disabled`, not `accessibilityState`: the group is a `View`, so
    // react-native-web has no `disabled` prop to derive the attribute from and
    // never reads `accessibilityState`. React Native folds this back into it.
    expect(getByTestId('group').props['aria-disabled']).toBe(true);
  });

  it('renders a field inside it bare: one shell, the group\'s', () => {
    const { toJSON } = renderWithTheme(
      <InputGroup invalid testID="group">
        <InputGroupAddon>https://</InputGroupAddon>
        <TextFieldInput label="Domain" value="" onValueChange={() => {}} />
      </InputGroup>,
    );
    // Count every node painting the 2px ring border: only the group's own shell.
    const ringed: unknown[] = [];
    const walk = (node: unknown) => {
      if (!node || typeof node !== 'object') return;
      if (Array.isArray(node)) return node.forEach(walk);
      const n = node as { props?: { style?: unknown }; children?: unknown };
      const flat = ([] as unknown[]).concat(n.props?.style ?? []).flat(Infinity) as Array<Record<string, unknown> | null>;
      if (flat.some((s) => s && s.borderWidth === 2)) ringed.push(node);
      walk(n.children);
    };
    walk(toJSON());
    expect(ringed).toHaveLength(1);
  });
});
