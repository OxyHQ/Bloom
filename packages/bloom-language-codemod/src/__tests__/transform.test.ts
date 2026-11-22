import { loadTable } from '../table';
import { cleanJsxText, transformSource } from '../transform';

const table = loadTable();
const run = (source: string) =>
  transformSource(source, { table, fixtures: true, name: 'test.tsx' });
/** The code with its whitespace runs as one space, as recast breaks a long call over lines. */
const flat = (code: string) => code.replace(/\s+/g, ' ').replace(/\( /g, '(').replace(/ \)/g, ')');

describe('transformSource', () => {
  it('converts a View tree and swaps the imports', () => {
    const result = run(`import { View } from 'react-native';
import { Text } from '@oxy.so/bloom/typography';
export const A = () => <View className="flex-row gap-2"><Text variant="body-semibold">Hi {name}</Text></View>;
`);
    expect(result.code).toContain(
      "import { HStack, Text as LText, toElement } from '@oxy.so/bloom-language';",
    );
    expect(result.code).toContain(
      'toElement(HStack(LText("Hi ", name).font("body").weight("semibold")).spacing("sm"))',
    );
    expect(result.code).not.toContain("from 'react-native'");
    expect(result.converted).toBe(2);
  });
  it('embeds what it cannot convert, and reports it', () => {
    const result = run(`import { View, Image } from 'react-native';
export const A = () => <View className="p-4"><Image source={s} /><Foo /></View>;
`);
    expect(result.code).toContain('VStack(Embed(<Image source={s} />), Embed(<Foo />))');
    expect(result.unconverted.map((u) => u.reasons[0]?.code)).toEqual(['react-native-image']);
  });
  it('draws React Native’s Text as RawText', () => {
    const result = run(`import { Text } from 'react-native';
export const A = () => <Text className="text-sm">a <Text className="font-bold">b</Text></Text>;
`);
    expect(result.code).toContain(
      'RawText("a ", RawText("b").weight("bold")).font("14").leading("20px")',
    );
  });
  it('leaves an element with an unmapped prop as it is', () => {
    const source = `import { View } from 'react-native';
export const A = () => <View className="p-4" style={s} />;
`;
    expect(run(source).code).toBe(source);
  });
  it('passes a root key to toElement and a child key to .id()', () => {
    const result = run(`import { View } from 'react-native';
export const A = () => items.map((i) => <View key={i}><View key="a" /></View>);
`);
    expect(result.code).toContain('toElement(VStack(VStack().id("a")), i)');
  });
  it('writes a fixture whose holes match on both sides', () => {
    const [fixture] = run(`import { Pressable } from 'react-native';
export const A = () => <Pressable onPress={go} className="p-2">{child}</Pressable>;
`).fixtures;
    expect(fixture?.before).toBe(
      '<Pressable onPress={() => {}} className="p-2">{<Hole n="0" />}</Pressable>',
    );
    expect(fixture?.after).toBe(
      `toElement(VStack(Embed(<Hole n="0" />)).padding('all', 'sm').onPress(() => {}))`,
    );
  });
  it('maps a Bloom component by its rule: its children, an optional argument, a view prop', () => {
    const result = run(`import { SettingsSection } from '@oxy.so/bloom/settings-modal';
import { GroupedSection, GroupedSectionItem } from '@oxy.so/bloom/grouped-section';
import { Switch } from '@oxy.so/bloom/switch';
export const A = () => (
  <SettingsSection>
    <GroupedSection title={t('a')}>
      <GroupedSectionItem title="B" rightElement={<Switch checked={on} onCheckedChange={setOn} />} />
    </GroupedSection>
  </SettingsSection>
);
`);
    expect(flat(result.code)).toContain(
      'toElement(LSettingsSection(undefined, LGroupedSection(LGroupedSectionItem("B").trailing(Toggle([on, setOn]))).title(t("a"))))',
    );
  });
  it('takes a binding from either setter Bloom reads, and an options object', () => {
    const result = run(`import { TextFieldInput } from '@oxy.so/bloom/text-field';
import { ChatEmptyState } from '@oxy.so/bloom/chat-screen';
export const A = () => <TextFieldInput label="Name" value={name} onChangeText={setName} autoCorrect />;
export const B = () => <ChatEmptyState title="None" illustration={<Art />} />;
`);
    expect(result.code).toContain(
      'toElement(TextField([name, setName], "Name").autocorrect(true))',
    );
    expect(flat(result.code)).toContain(
      'toElement(LChatEmptyState({ title: "None", illustration: Embed(<Art />) }))',
    );
  });
  it('keeps a prop it cannot map, and a kept component, with their reasons', () => {
    const result = run(`import { GroupedSectionItem } from '@oxy.so/bloom/grouped-section';
import { Screen } from '@oxy.so/bloom/screen';
export const A = () => <Screen><GroupedSectionItem title="B" wrapControl /></Screen>;
`);
    expect(result.changed).toBe(false);
    expect(result.unconverted.map((u) => u.reasons[0]?.code)).toEqual([
      'kept:Screen',
      'GroupedSectionItem:wrapControl',
    ]);
  });
  it('keeps an input that reads an enclosing shell’s context', () => {
    const result = run(`import { TextField, TextFieldInput } from '@oxy.so/bloom/text-field';
export const A = () => <TextField><TextFieldInput label="A" value={a} onChangeText={setA} /></TextField>;
`);
    expect(result.unconverted.map((u) => u.reasons[0]?.code)).toEqual([
      'TextField:inside-TextField',
    ]);
  });
  it('reads a second prop as a modifier’s next argument, and a typography component as a text style', () => {
    const result = run(`import { Textarea } from '@oxy.so/bloom/textarea';
import { Muted } from '@oxy.so/bloom/typography';
export const A = () => <Textarea value={a} onValueChange={setA} autoResize maxRows={6} />;
export const B = () => <Muted numberOfLines={1}>{note}</Muted>;
export const C = () => <Textarea value={a} onValueChange={setA} maxRows={6} />;
`);
    expect(result.code).toContain('toElement(TextEditor([a, setA]).autoResize(6))');
    expect(result.code).toContain('toElement(Text(note).textStyle("muted").lines(1))');
    expect(result.unconverted.map((u) => u.reasons[0]?.code)).toEqual(['TextEditor:maxRows']);
  });
  it('follows React’s rule for JSX text', () => {
    expect(cleanJsxText('\n   Hello\n   world  \n')).toBe('Hello world');
    expect(cleanJsxText('  a  ')).toBe('  a  ');
  });
});
