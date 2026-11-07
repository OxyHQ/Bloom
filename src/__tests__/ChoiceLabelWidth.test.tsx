/**
 * A labelled `Checkbox` or `Radio` is as wide as its label, not as wide as the
 * row it sits in. Its label's column was `flex: 1`; on a native layout (Yoga)
 * a row's child is sized to the space the row offers it, so the control took
 * the whole row and pushed its siblings out: Dropsea's Settings › Tags rows
 * on OxyOS had no room left for the tag's name or its menu. The column now
 * shrinks to what the row leaves (and wraps there) and never grows.
 */
import { StyleSheet, Text } from 'react-native';
import type { ReactTestInstance } from 'react-test-renderer';
import { render } from '@testing-library/react-native';

import { Checkbox } from '../checkbox';
import { RadioGroup } from '../radio';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

/** The flattened style of the host view holding the label's text. */
function labelColumn(root: ReactTestInstance, label: string) {
  const text = root.findAll((node) => node.type === Text && node.props.children === label)[0];
  // The nearest host view up from the text (a host element's type is its name, a string).
  let node = text?.parent ?? null;
  while (node && (node.type as unknown) !== 'View') node = node.parent;
  return StyleSheet.flatten(node?.props.style) ?? {};
}

function expectContentSized(style: Record<string, unknown>) {
  expect(style.flex).toBeUndefined();
  expect(style.flexGrow ?? 0).toBe(0);
  expect(style.flexShrink).toBe(1);
  expect(style.minWidth).toBe(0);
}

it("sizes a labelled checkbox's label to its words, never to the row", () => {
  const screen = render(
    <BloomThemeProvider mode="light">
      <Checkbox checked label="Show in Sidebar" onCheckedChange={() => {}} />
    </BloomThemeProvider>,
  );
  expectContentSized(labelColumn(screen.UNSAFE_root, 'Show in Sidebar'));
});

it("sizes a labelled radio's label to its words, never to the row", () => {
  const screen = render(
    <BloomThemeProvider mode="light">
      <RadioGroup
        value="list"
        onValueChange={() => {}}
        options={[{ value: 'list', label: 'As List' }]}
      />
    </BloomThemeProvider>,
  );
  expectContentSized(labelColumn(screen.UNSAFE_root, 'As List'));
});
