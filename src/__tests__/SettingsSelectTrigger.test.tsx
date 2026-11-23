import { StyleSheet } from 'react-native';
import { render } from '@testing-library/react-native';

import { SettingsSelect } from '../settings-modal/SettingsSelect';
import { BloomThemeProvider } from '../theme';

/**
 * The compact trigger's sides are the select size's own: 12 at `md`, as Bloom
 * 22 drew them on Android (its size class's start and end outranked the 8 the
 * compact style set as left and right). Its top, bottom and gap stay compact.
 */
it("draws the compact trigger's sides at the size's 12, its top and bottom at 5", () => {
  const { toJSON } = render(
    <BloomThemeProvider fonts={false}>
      <SettingsSelect
        label="Mode"
        value="a"
        onChange={() => {}}
        items={[{ value: 'a', label: 'A' }]}
        testID="mode"
      />
    </BloomThemeProvider>,
  );
  const fields: Record<string, unknown>[] = [];
  const walk = (node: unknown) => {
    if (node === null || typeof node !== 'object') return;
    if (Array.isArray(node)) return void node.forEach(walk);
    const { props, children } = node as { props: { style?: unknown }; children: unknown };
    const style = StyleSheet.flatten(props.style as object) as Record<string, unknown> | undefined;
    if (style?.minHeight !== undefined && style.borderWidth === 1) fields.push(style);
    walk(children);
  };
  walk(toJSON());
  expect(fields).toHaveLength(1);
  const [field] = fields as [Record<string, unknown>];
  expect([field.paddingLeft, field.paddingRight]).toEqual([12, 12]);
  expect([field.paddingTop, field.paddingBottom, field.gap]).toEqual([5, 5, 4]);
  expect(field.paddingStart ?? field.paddingEnd ?? field.paddingHorizontal).toBeUndefined();
});
