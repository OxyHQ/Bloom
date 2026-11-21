import {
  ChoiceList,
  type ChoiceListOption,
  type ChoiceListOptionState,
} from '@oxy.so/bloom/choice-list';
import { Text } from '@oxy.so/bloom/typography';

import { ENUMS } from '../src/generated/spec.generated';
import * as L from '../src/index';
import { toElement } from '../src/render';
import type { ParityCase } from './support/cases';

const set = () => {};
const OPTIONS: readonly ChoiceListOption[] = [
  { value: 'ana', label: 'Ana', testID: 'account-ana' },
  { value: 'ben', label: 'Ben' },
  { value: 'cy', label: 'Cy', disabled: true },
];

const language = (option: Readonly<ChoiceListOption>, { selected }: ChoiceListOptionState) =>
  selected ? L.Text(option.label).weight('semibold') : L.Text(option.label);
const bloom = (option: Readonly<ChoiceListOption>, { selected }: ChoiceListOptionState) =>
  selected ? (
    <Text style={{ fontWeight: '600' }}>{option.label}</Text>
  ) : (
    <Text>{option.label}</Text>
  );

export const CHOICE_LIST_CASES: readonly ParityCase[] = [
  {
    name: 'three accounts, one chosen',
    language: () => toElement(L.ChoiceList('Accounts', ['ben', set], OPTIONS, language)),
    bloom: () => (
      <ChoiceList
        label="Accounts"
        value="ben"
        onValueChange={set}
        options={OPTIONS}
        renderContent={bloom}
      />
    ),
  },
  ...ENUMS.axis.map((axis) => ({
    name: `${axis} options`,
    language: () => toElement(L.ChoiceList('Accounts', ['ana', set], OPTIONS, language).axis(axis)),
    bloom: () => (
      <ChoiceList
        label="Accounts"
        value="ana"
        onValueChange={set}
        options={OPTIONS}
        renderContent={bloom}
        orientation={axis}
      />
    ),
  })),
  {
    name: 'spaced options with a box of their own',
    language: () =>
      toElement(
        L.ChoiceList('Accounts', ['ana', set], OPTIONS, language)
          .spacing('28')
          .optionBox({ padding: { horizontal: '6', vertical: 'xs' }, corner: 'md' }),
      ),
    bloom: () => (
      <ChoiceList
        label="Accounts"
        value="ana"
        onValueChange={set}
        options={OPTIONS}
        renderContent={bloom}
        style={{ gap: 28 }}
        optionStyle={{
          paddingStart: 6,
          paddingEnd: 6,
          paddingTop: 4,
          paddingBottom: 4,
          borderRadius: 12,
        }}
      />
    ),
  },
  {
    name: 'stretched rows, every edge padded, the list boxed',
    language: () =>
      toElement(
        L.ChoiceList('Devices', ['ben', set], OPTIONS, language)
          .axis('vertical')
          .optionBox({ padding: { all: 'none', horizontal: 'xs' }, corner: '10', align: 'stretch' })
          .spacing('none')
          .padding('sm')
          .testID('devices'),
      ),
    bloom: () => (
      <ChoiceList
        label="Devices"
        value="ben"
        onValueChange={set}
        options={OPTIONS}
        renderContent={bloom}
        orientation="vertical"
        optionStyle={{
          paddingTop: 0,
          paddingBottom: 0,
          paddingStart: 4,
          paddingEnd: 4,
          borderRadius: 10,
          alignItems: 'stretch',
        }}
        testID="devices"
        style={[{ gap: 0 }, { paddingTop: 8, paddingBottom: 8, paddingStart: 8, paddingEnd: 8 }]}
      />
    ),
  },
  {
    name: 'a disabled list',
    language: () => toElement(L.ChoiceList('Accounts', ['ana', set], OPTIONS, language).disabled()),
    bloom: () => (
      <ChoiceList
        label="Accounts"
        value="ana"
        onValueChange={set}
        options={OPTIONS}
        renderContent={bloom}
        disabled
      />
    ),
  },
];
