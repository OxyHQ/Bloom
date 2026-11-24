import { RiHeart3Line } from '@bloom/icons/remix/RiHeart3Line';
import { AvatarGroup } from '@bloom/avatar-group';
import { ChoiceList } from '@bloom/choice-list';
import { ColorSwatchPicker } from '@bloom/color-swatch-picker';
import { ExpandableText } from '@bloom/expandable-text';
import { IconCircle } from '@bloom/icon-circle';
import { Kbd } from '@bloom/kbd';
import { List, ListItem } from '@bloom/list';
import { PhoneInput } from '@bloom/phone-input';
import { Text } from '@bloom/typography';
import type { Cases } from '../support/cases';

const set = () => {};
const ENTRIES = [
  { id: 'a', title: 'Ana Lima', supporting: 'Design' },
  { id: 'b', title: 'Rui Costa', supporting: 'Support' },
];
const OPTIONS = [
  { value: 'ana', label: 'Ana' },
  { value: 'ben', label: 'Ben' },
  { value: 'cy', label: 'Cy', disabled: true },
];

export const CASES: Cases = {
  List: () => <List items={ENTRIES} />,
  'ListItem person': () => (
    <ListItem person={{ name: 'Ana Lima', subtitle: '@ana', actionLabel: 'Add', onAction: set }} />
  ),
  ChoiceList: () => (
    <ChoiceList
      label="Accounts"
      value="ben"
      onValueChange={set}
      options={OPTIONS}
      renderContent={(option) => <Text>{option.label}</Text>}
    />
  ),
  AvatarGroup: () => (
    <AvatarGroup
      items={[
        { id: 'b', name: 'Bo Chen' },
        { id: 'c', initials: 'CL' },
        { id: 'e', name: 'Eli' },
      ]}
    />
  ),
  Kbd: () => <Kbd>⌘K</Kbd>,
  IconCircle: () => <IconCircle icon={RiHeart3Line} />,
  ExpandableText: () => (
    <ExpandableText>
      A calm flat near the park, with morning light in every room and a quiet street outside.
    </ExpandableText>
  ),
  PhoneInput: () => <PhoneInput value="612 345 678" onValueChange={set} label="Phone" />,
  ColorSwatchPicker: () => (
    <ColorSwatchPicker
      label="Brand colour"
      value="#10b981"
      onValueChange={set}
      colors={['#ef4444', '#f59e0b', '#10b981', '#3b82f6']}
    />
  ),
};
