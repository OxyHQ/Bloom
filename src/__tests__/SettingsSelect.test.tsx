import { StyleSheet } from 'react-native';
import { render } from '@testing-library/react-native';

import { SettingsSelect } from '../settings-modal/SettingsSelect';

let mockTrigger: Record<string, unknown>;
jest.mock('../select', () => ({
  Select: ({ children }: { children: React.ReactNode }) => children,
  SelectTrigger: (props: Record<string, unknown>) => {
    mockTrigger = props;
    return null;
  },
  SelectContent: () => null,
  SelectIcon: () => null,
  SelectItem: () => null,
  SelectItemIndicator: () => null,
  SelectItemText: () => null,
  SelectValue: () => null,
}));

/**
 * A trigger with a pinned height clips its value on Android: a fixed `h-8` left
 * 15.5dp for a 20dp line (OxyHQ/Mention#1126). The value's own line must set
 * the height, so the compact trigger is sized by padding alone.
 */
it('sizes the compact trigger by its padding, never a fixed height', () => {
  render(
    <SettingsSelect
      label="Mode"
      value="a"
      onChange={() => {}}
      items={[{ value: 'a', label: 'A' }]}
    />,
  );
  expect(String(mockTrigger.className ?? '')).not.toMatch(/(^|\s)(h|min-h|max-h)-/);
  const field = StyleSheet.flatten(mockTrigger.fieldStyle as object) as Record<string, unknown>;
  expect(field.height).toBeUndefined();
  expect(field.paddingTop).toBeGreaterThan(0);
});
