import { render } from '@testing-library/react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
// Both forks by explicit filename: jest has no platform-extension resolution, so
// `'../select'` alone would only ever exercise the native one.
import * as WebSelect from '../select/index.web';
import * as NativeSelect from '../select/index';

const ITEMS = [
  { value: 'rock', label: 'Rock' },
  { value: 'jazz', label: 'Jazz' },
];

describe.each([
  ['web', WebSelect],
  ['native', NativeSelect],
] as const)('Select (%s fork)', (_platform, S) => {
  /**
   * `SelectValue`'s extractor is handed the chosen ITEM, never the bare value,
   * so a caller reads `item.label` without checking which shape arrived; a value
   * no item matches shows as itself on both platforms.
   */
  it('hands SelectValue the chosen item, and shows an unmatched value as itself', () => {
    const seen: unknown[] = [];
    const tree = (value: string) => (
      <BloomThemeProvider mode="light" colorPreset="teal">
        <S.Select value={value}>
          <S.SelectTrigger label="Genre">
            <S.SelectValue<(typeof ITEMS)[number]>>
              {(item) => {
                seen.push(item);
                return item.label;
              }}
            </S.SelectValue>
          </S.SelectTrigger>
          <S.SelectContent items={ITEMS} renderItem={() => <></>} />
        </S.Select>
      </BloomThemeProvider>
    );
    const view = render(tree('jazz'));
    expect(view.getByText('Jazz')).toBeTruthy();
    expect(seen.every((item) => item === ITEMS[1])).toBe(true);

    view.rerender(tree('blues'));
    expect(view.getByText('blues')).toBeTruthy();
  });

  /** A labelled select: the field's label names the trigger, its error marks it invalid. */
  it('SelectField labels its trigger and reports its error', () => {
    const view = render(
      <BloomThemeProvider mode="light" colorPreset="teal">
        <S.SelectField
          label="Genre"
          placeholder="Choose a genre"
          items={ITEMS}
          value={undefined}
          error="Pick a genre"
        />
      </BloomThemeProvider>,
    );
    const trigger = view.getByLabelText('Genre');
    expect(view.getByText('Genre')).toBeTruthy();
    expect(view.getByText('Choose a genre')).toBeTruthy();
    expect(view.getByText('Pick a genre')).toBeTruthy();
    expect(trigger.props['aria-invalid']).toBe(true);
  });
});
