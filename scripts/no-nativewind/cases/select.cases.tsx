import { Text } from 'react-native';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectIcon,
  SelectItem,
  SelectItemIndicator,
  SelectItemText,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@bloom/select';
import type { Cases } from '../support/cases';

const ITEMS = [
  { value: 'a', label: 'Apple' },
  { value: 'b', label: 'Banana' },
];

function Field({ size }: { size?: 'xs' | 'sm' | 'md' | 'lg' }) {
  return (
    <Select value="a" onValueChange={() => {}} size={size}>
      <SelectTrigger label="Fruit" testID="trigger">
        <SelectValue placeholder="Pick" />
        <SelectIcon />
      </SelectTrigger>
      <SelectContent
        label="Fruit"
        items={ITEMS}
        renderItem={(item) => (
          <SelectItem value={item.value} label={item.label}>
            <SelectItemText>{item.label}</SelectItemText>
            <SelectItemIndicator />
          </SelectItem>
        )}
      />
    </Select>
  );
}

export const CASES: Cases = {
  'trigger md': () => <Field />,
  'trigger xs': () => <Field size="xs" />,
  'trigger sm': () => <Field size="sm" />,
  'trigger lg': () => <Field size="lg" />,
  'trigger placeholder, disabled, styled': () => (
    <Select onValueChange={() => {}} disabled>
      <SelectTrigger label="Fruit" style={{ margin: 1 }} fieldStyle={{ paddingLeft: 8 }}>
        <SelectValue placeholder="Pick" leading={<Text>L</Text>} style={{ marginTop: 1 }} />
        <SelectIcon />
      </SelectTrigger>
      <SelectContent label="Fruit" items={ITEMS} renderItem={() => <Text>x</Text>} />
    </Select>
  ),
  'parts in a list': () => (
    <Select value="a" onValueChange={() => {}}>
      <SelectGroup style={{ marginTop: 1 }}>
        <SelectLabel>Fruit</SelectLabel>
        <SelectItem value="a" label="Apple" leading={<Text>A</Text>}>
          <SelectItemText>Apple</SelectItemText>
          <SelectItemIndicator />
        </SelectItem>
        <SelectItem value="b" label="Banana" disabled style={{ marginTop: 2 }}>
          <SelectItemText style={{ marginLeft: 1 }}>Banana</SelectItemText>
        </SelectItem>
      </SelectGroup>
      <SelectSeparator />
    </Select>
  ),
};
