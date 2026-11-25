// A language picker's options in a listbox, a row whose hover group holds its
// press, and a search that follows its caret.
import { Item } from '@oxy.so/bloom/item';
import { Search } from '@oxy.so/bloom/search';
import { hoverGroupProps } from '@oxy.so/bloom/subtle-hover';
import { TextFieldInput } from '@oxy.so/bloom/text-field';
import { Text } from '@oxy.so/bloom/typography';
import { Pressable, View } from 'react-native';

export function LanguageOptions({ chosen, pick }: { chosen: boolean; pick: () => void }) {
  return (
    <View role="listbox">
      <Item title="English" role="option" selected={chosen} onPress={pick} />
      <Item title="Català" role="option" onPress={pick} />
    </View>
  );
}

export function HoverRow({ open }: { open: () => void }) {
  return (
    <View {...hoverGroupProps}>
      <Pressable onPress={open}>
        <Text>Row</Text>
      </Pressable>
    </View>
  );
}

export function CaretSearch({
  query,
  setQuery,
  onCaret,
}: {
  query: string;
  setQuery: (value: string) => void;
  onCaret: () => void;
}) {
  return (
    <View>
      <Search value={query} onChangeText={setQuery} onSelectionChange={onCaret} />
      <TextFieldInput label="Seats" value={query} onValueChange={setQuery} inputMode="numeric" />
    </View>
  );
}
