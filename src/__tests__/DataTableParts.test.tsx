import React from 'react';
import { Text, TextInput, View } from 'react-native';
import { act, fireEvent, render } from '@testing-library/react-native';

import {
  DataTableFilter,
  DataTableRowActions,
  DataTableSearch,
  DataTableSelect,
  type DataTableSelectOption,
} from '../data-table';
import { RiDeleteBin6Line, RiEditLine, RiFileCopyLine } from '../icons/remix';
// Both forks by explicit filename — jest has no platform-extension resolution.
import * as NativeSelect from '../select/index';
import * as WebSelect from '../select/index.web';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { pressHost } from './support/press-host';

function wrap(node: React.ReactElement) {
  return render(
    <BloomThemeProvider mode="light" colorPreset="blue">
      {node}
    </BloomThemeProvider>,
  );
}

function MarkIcon() {
  return <View testID="option-icon" />;
}

const DOT_OPTIONS: DataTableSelectOption[] = [
  { value: 'completed', label: 'Completed', dot: 'success' },
  { value: 'waiting', label: 'Waiting', dot: 'warning' },
];

describe('DataTableRowActions', () => {
  it('draws one named button per action, forwarding its press, then the named menu trigger', () => {
    const onDelete = jest.fn();
    const { getByLabelText } = wrap(
      <DataTableRowActions
        name="John Clarkson"
        actions={[
          { icon: RiDeleteBin6Line, label: 'Delete', onPress: onDelete },
          { icon: RiEditLine, label: 'Edit' },
        ]}
        menu={[{ icon: RiFileCopyLine, label: 'Duplicate row' }]}
      />,
    );
    act(() => pressHost(getByLabelText('Delete')));
    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(getByLabelText('Edit')).toBeTruthy();
    expect(getByLabelText('More actions for John Clarkson')).toBeTruthy();
  });

  it('draws no menu trigger without menu entries', () => {
    const { queryByLabelText } = wrap(
      <DataTableRowActions name="Row" actions={[{ icon: RiEditLine, label: 'Edit' }]} />,
    );
    expect(queryByLabelText('Edit')).toBeTruthy();
    expect(queryByLabelText('More actions for Row')).toBeNull();
  });

  it('names the menu trigger from `menuLabel`', () => {
    const { getByLabelText } = wrap(
      <DataTableRowActions name="Row" menuLabel="Options" menu={[{ icon: RiEditLine, label: 'Edit' }]} />,
    );
    expect(getByLabelText('Options for Row')).toBeTruthy();
  });
});

describe('DataTableSelect', () => {
  it("shows the chosen option's label behind its mark, and follows a controlled value", () => {
    const options: DataTableSelectOption[] = [
      { value: 'in', label: 'Inpatient', icon: MarkIcon },
      { value: 'out', label: 'Outpatient', icon: MarkIcon },
    ];
    const utils = wrap(<DataTableSelect label="Admission for Ann" value="out" options={options} width={150} />);
    expect(utils.getByLabelText('Admission for Ann')).toBeTruthy();
    expect(utils.getByText('Outpatient')).toBeTruthy();
    expect(utils.getAllByTestId('option-icon').length).toBeGreaterThan(0);
    utils.rerender(
      <BloomThemeProvider mode="light" colorPreset="blue">
        <DataTableSelect label="Admission for Ann" value="in" options={options} width={150} />
      </BloomThemeProvider>,
    );
    expect(utils.getByText('Inpatient')).toBeTruthy();
  });

  it('starts from `defaultValue` uncontrolled', () => {
    const { getByText } = wrap(<DataTableSelect label="Purchase" defaultValue="waiting" options={DOT_OPTIONS} width={142} />);
    expect(getByText('Waiting')).toBeTruthy();
  });
});

describe('DataTableFilter', () => {
  it("shows the selected option's label, defaulting to the first option", () => {
    const options = [
      { value: 'all', label: 'All regions' },
      { value: 'eu', label: 'Europe' },
    ];
    const first = wrap(<DataTableFilter label="Filter by region" options={options} />);
    expect(first.getByLabelText('Filter by region')).toBeTruthy();
    expect(first.getByText('All regions')).toBeTruthy();
    const controlled = wrap(<DataTableFilter label="Region" value="eu" options={options} />);
    expect(controlled.getByText('Europe')).toBeTruthy();
  });
});

describe('DataTableSearch', () => {
  it('is a labelled input that reports its text', () => {
    const onChangeText = jest.fn();
    const { UNSAFE_getByType } = wrap(<DataTableSearch label="Search customers" value="" onValueChange={onChangeText} />);
    const input = UNSAFE_getByType(TextInput);
    expect(input.props.placeholder).toBe('Search');
    fireEvent.changeText(input, 'ann');
    expect(onChangeText).toHaveBeenCalledWith('ann');
  });
});

describe.each([
  ['native', NativeSelect],
  ['web', WebSelect],
] as const)('SelectValue / SelectItem `leading` (%s fork)', (_platform, S) => {
  const items = [
    { value: 'a', label: 'Alpha', mark: 'mark-a' },
    { value: 'b', label: 'Beta', mark: 'mark-b' },
  ];

  it('renders a static leading node before the value', () => {
    const { getByTestId } = wrap(
      <S.Select value="a">
        <S.SelectTrigger label="Pick">
          <S.SelectValue leading={<View testID="static-mark" />} />
        </S.SelectTrigger>
      </S.Select>,
    );
    expect(getByTestId('static-mark')).toBeTruthy();
  });

  it('hands a function `leading` the selected item', () => {
    const { getByTestId, queryByTestId } = wrap(
      <S.Select value="b">
        <S.SelectTrigger label="Pick">
          <S.SelectValue
            leading={(item) => (item ? <Text testID={(item as (typeof items)[number]).mark}>•</Text> : null)}
          />
        </S.SelectTrigger>
        <S.SelectContent
          items={items}
          renderItem={(item) => (
            <S.SelectItem value={item.value} label={item.label} leading={<View testID={`row-${item.value}`} />}>
              <S.SelectItemText>{item.label}</S.SelectItemText>
            </S.SelectItem>
          )}
        />
      </S.Select>,
    );
    expect(getByTestId('mark-b')).toBeTruthy();
    expect(queryByTestId('mark-a')).toBeNull();
  });

  it('renders an item `leading` inside the option', () => {
    const { getByLabelText, getByTestId } = wrap(
      <S.Select value="a">
        <S.SelectItem value="a" label="Alpha" leading={<View testID="item-mark" />}>
          <S.SelectItemText>Alpha</S.SelectItemText>
        </S.SelectItem>
      </S.Select>,
    );
    const option = getByLabelText('Alpha');
    const mark = getByTestId('item-mark');
    let node: typeof mark | null = mark;
    while (node && node !== option) node = node.parent;
    expect(node).toBe(option);
  });
});
