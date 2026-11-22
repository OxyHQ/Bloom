import { loadTable } from '../table';
import { cleanJsxText, transformSource } from '../transform';

const table = loadTable();
const run = (source: string) =>
  transformSource(source, { table, fixtures: true, name: 'test.tsx' });

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
    const result = run(`import { View, Text } from 'react-native';
export const A = () => <View className="p-4"><Text>x</Text><Foo /></View>;
`);
    expect(result.code).toContain('VStack(Embed(<Text>x</Text>), Embed(<Foo />))');
    expect(result.unconverted.map((u) => u.reasons[0]?.code)).toEqual(['react-native-text']);
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
  it('follows React’s rule for JSX text', () => {
    expect(cleanJsxText('\n   Hello\n   world  \n')).toBe('Hello world');
    expect(cleanJsxText('  a  ')).toBe('  a  ');
  });
});
