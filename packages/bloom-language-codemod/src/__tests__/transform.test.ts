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
      "toElement(HStack(LText('Hi ', name).font('body').weight('semibold')).spacing('sm'))",
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
      "RawText('a ', RawText('b').weight('bold')).font('14').leading('20px')",
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
      "toElement(LSettingsSection(undefined, LGroupedSection(LGroupedSectionItem('B').trailing(Toggle([on, setOn]))).title(t('a'))))",
    );
  });
  it('takes a binding from either setter Bloom reads, and an options object', () => {
    const result = run(`import { TextFieldInput } from '@oxy.so/bloom/text-field';
import { ChatEmptyState } from '@oxy.so/bloom/chat-screen';
export const A = () => <TextFieldInput label="Name" value={name} onChangeText={setName} autoCorrect />;
export const B = () => <ChatEmptyState title="None" illustration={<Art />} />;
`);
    expect(result.code).toContain(
      "toElement(TextField([name, setName], 'Name').autocorrect(true))",
    );
    expect(flat(result.code)).toContain(
      "toElement(LChatEmptyState({ title: 'None', illustration: Embed(<Art />) }))",
    );
  });
  it('keeps a prop it cannot map, and a kept component, with their reasons', () => {
    const result = run(`import { GroupedSectionItem } from '@oxy.so/bloom/grouped-section';
import { Screen } from '@oxy.so/bloom/screen';
import { DropdownMenu } from '@oxy.so/bloom/dropdown-menu';
export const A = () => <Screen><GroupedSectionItem title="B" leftInset={8} /></Screen>;
export const B = () => <DropdownMenu />;
`);
    expect(result.changed).toBe(false);
    expect(result.unconverted.map((u) => u.reasons[0]?.code)).toEqual([
      'kept:Screen',
      'GroupedSectionItem:leftInset',
      'kept:DropdownMenu',
    ]);
  });
  it('keeps an input that reads an enclosing shell’s context', () => {
    const result = run(`import { TextField, TextFieldInput } from '@oxy.so/bloom/text-field';
export const A = () => <TextField style={s}><TextFieldInput label="A" value={a} onChangeText={setA} /></TextField>;
`);
    expect(result.unconverted.map((u) => u.reasons[0]?.code)).toEqual([
      'TextField:style',
      'TextField:inside-TextField',
    ]);
  });
  it('draws a shell and its input as the input’s node', () => {
    const result =
      run(`import { TextField, TextFieldIcon, TextFieldInput } from '@oxy.so/bloom/text-field';
import { RiMailLine } from '@oxy.so/bloom/icons';
export const A = () => (
  <TextField size="sm"><TextFieldIcon icon={RiMailLine} /><TextFieldInput label="A" value={a} onChangeText={setA} /></TextField>
);
export const B = () => <TextField style={s}><TextFieldInput label="B" value={b} onChangeText={setB} /></TextField>;
`);
    expect(flat(result.code)).toContain(
      "toElement(LTextField([a, setA], 'A').size('sm').icon(RiMailLine))",
    );
    expect(result.converted).toBe(2);
    expect(result.unconverted.map((u) => u.reasons[0]?.code)).toEqual([
      'TextField:style',
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
    expect(result.code).toContain("toElement(Text(note).textStyle('muted').lines(1))");
    expect(result.unconverted.map((u) => u.reasons[0]?.code)).toEqual(['TextEditor:maxRows']);
  });
  it('reads an icon’s theme fill and side, a role, and a static style', () => {
    const result = run(`import { StyleSheet, View } from 'react-native';
import { useTheme } from '@oxy.so/bloom/theme';
import { RiHeart3Line } from '@oxy.so/bloom/icons';
export function A() {
  const theme = useTheme();
  return (
    <View style={styles.row} accessibilityRole="header">
      <RiHeart3Line width={20} height={20} fill={theme.colors.textSecondary} />
    </View>
  );
}
export function B({ theme }) { return <RiHeart3Line fill={theme.colors.text} />; }
const styles = StyleSheet.create({ row: { flexDirection: 'row', gap: 8 } });
`);
    expect(flat(result.code)).toContain(
      "toElement(HStack(Icon(RiHeart3Line).size('md').foreground('muted')).spacing('sm').role('header'))",
    );
    expect(result.unconverted.map((u) => u.reasons[0]?.code)).toEqual(['icon-fill']);
    expect(result.fixtures[0]?.before).toContain(
      '<View style={{ flexDirection: \'row\', gap: 8 }} accessibilityRole="header">',
    );
    expect(result.fixtures[0]?.before).toContain('fill={parityTheme.colors.textSecondary}');
  });
  it('reads a RefreshControl as a pull to refresh, and an indicator’s boolean on its axis', () => {
    const result = run(`import { RefreshControl } from 'react-native';
import { ScreenScrollView } from '@oxy.so/bloom/screen';
import { useTheme } from '@oxy.so/bloom/theme';
export function A() {
  const theme = useTheme();
  return (
    <ScreenScrollView
      refreshControl={<RefreshControl refreshing={busy} onRefresh={reload} tintColor={theme.colors.primary} colors={[theme.colors.primary]} />}
      showsVerticalScrollIndicator={false}
    />
  );
}
export const B = () => <ScreenScrollView refreshControl={<RefreshControl refreshing={busy} onRefresh={() => { reload(); }} />} showsHorizontalScrollIndicator />;
export function C() {
  const theme = useTheme();
  return <ScreenScrollView refreshControl={<RefreshControl refreshing={busy} onRefresh={reload} tintColor={theme.colors.primary} />} />;
}
`);
    expect(flat(result.code)).toContain(
      "toElement(ScrollView().refreshable([busy, () => reload()], 'primary').scrollIndicators('hidden', 'vertical'))",
    );
    expect(flat(result.code)).toContain(
      "toElement(ScrollView().refreshable([busy, () => { reload(); }]).scrollIndicators('visible', 'horizontal'))",
    );
    // A tintColor alone tints iOS only; the language's tint paints Android's colours too.
    expect(result.unconverted.map((u) => u.reasons[0]?.code)).toEqual([
      'ScrollView:refreshControl',
    ]);
  });
  it('reads a static content container style as content margins, and keeps a content className', () => {
    const result = run(`import { StyleSheet } from 'react-native';
import { ScreenScrollView } from '@oxy.so/bloom/screen';
export const A = () => <ScreenScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40, gap: 12 }} />;
export const B = () => <ScreenScrollView contentContainerStyle={styles.content} />;
export const C = () => <ScreenScrollView contentContainerClassName="px-4" />;
export const D = () => <ScreenScrollView contentContainerStyle={{ flexGrow: 1 }} />;
const styles = StyleSheet.create({ content: { padding: 16 } });
`);
    expect(result.code).toContain(
      "toElement(ScrollView().contentMargins('horizontal', 'lg').contentMargins('bottom', '4xl').spacing('md'))",
    );
    expect(result.code).toContain("toElement(ScrollView().contentMargins('lg'))");
    expect(result.fixtures[1]?.before).toContain('contentContainerStyle={{ padding: 16 }}');
    expect(result.unconverted.map((u) => u.reasons[0]?.code)).toEqual([
      'ScrollView:contentContainerClassName',
      'ScrollView:contentContainerStyle',
    ]);
  });
  it('chooses a value by a className’s condition, and proves both branches', () => {
    const result = run(`import { View } from 'react-native';
import { Text } from '@oxy.so/bloom/typography';
export const A = () => (
  <View className={active ? 'rounded-full bg-primary px-3' : 'rounded-full bg-muted px-3'}>
    <Text className={\`text-sm \${unread ? 'font-semibold' : 'font-medium'}\`}>a</Text>
  </View>
);
export const B = () => <View className={open ? 'p-2 opacity-50' : 'p-2'} />;
export const C = () => <View className={isOpen() ? 'p-2' : 'p-4'} />;
`);
    expect(flat(result.code)).toContain(
      "toElement(VStack(LText('a').font('14').leading('20px').weight(unread ? 'semibold' : 'medium')).padding('horizontal', 'md').background(active ? 'primary' : 'mutedFill').corner('infinite'))",
    );
    expect(result.unconverted.map((u) => u.reasons[0]?.code)).toEqual([
      'dynamic-className',
      'dynamic-className',
    ]);
    expect(result.fixtures.map((f) => f.name)).toEqual(['test.tsx:4 (false)', 'test.tsx:4']);
    expect(result.fixtures[0]?.before).toContain("className={false ? 'rounded-full");
    expect(result.fixtures[0]?.classes).toEqual(
      expect.arrayContaining(['bg-primary', 'bg-muted', 'font-semibold', 'font-medium']),
    );
  });
  it('makes a route whose every return is a Screen a screen() body', () => {
    const result = run(`import { Screen } from '@oxy.so/bloom/screen';
import { PageHeader } from '@oxy.so/bloom/page-header';
import { View } from 'react-native';
export default function Route({ id }) {
  if (!id) return <Screen><View className="p-4" /></Screen>;
  const header = <PageHeader title="A" />;
  return <Screen header={header} scroll="content"><View /></Screen>;
}
`);
    expect(flat(result.code)).toContain(
      "export default screen(function Route({ id }) { if (!id) return VStack().padding('all', 'lg').header(false); const header = toElement(Header('A').inPage()); return VStack().header(Embed(header)).screenScroll('content'); });",
    );
    expect(result.code).toContain("import { screen } from '@oxy.so/bloom-language/router';");
    expect(result.fixtures.filter((f) => f.screen)).toHaveLength(2);
  });
  it('keeps a route JSX when one of its Screens cannot convert, or its name is read', () => {
    const result = run(`import { Screen } from '@oxy.so/bloom/screen';
import { View } from 'react-native';
export default function Route({ id }) {
  if (!id) return <Screen footer={x}><View /></Screen>;
  return <Screen><View /></Screen>;
}
`);
    expect(result.unconverted.map((u) => u.reasons[0]?.code)).toEqual([
      'screen:footer',
      'screen:route',
    ]);
    const named = run(`import { Screen } from '@oxy.so/bloom/screen';
export default function Route() { return <Screen />; }
Route.options = {};
`);
    expect(named.unconverted.map((u) => u.reasons[0]?.code)).toEqual(['kept:Screen']);
  });
  it('carries a JSX comment into the chain where it is', () => {
    const result = run(`import { View } from 'react-native';
export const A = () => <View className="gap-2">{/* head */}<View className="p-2" />{/* end */}</View>;
`);
    expect(result.code).toContain(
      "VStack(/* head */ VStack().padding('all', 'sm') /* end */).spacing('sm')",
    );
  });
  it('converts a compound element with its parts as one node, a `.map()` of parts included', () => {
    const result = run(`import { Tabs, TabsTrigger } from '@oxy.so/bloom/tabs';
import {
  SegmentedControl,
  SegmentedControlItem,
  SegmentedControlItemText,
} from '@oxy.so/bloom/segmented-control';
export const A = () => (
  <Tabs value={tab} onValueChange={setTab} variant="underline">
    {TABS.map((item) => <TabsTrigger key={item.id} value={item.id} label={item.label} count={item.count} />)}
  </Tabs>
);
export const B = () => (
  <SegmentedControl label="Range" type="tabs" value={v} onChange={setV}>
    <SegmentedControlItem value="day"><SegmentedControlItemText>{t('day')}</SegmentedControlItemText></SegmentedControlItem>
    <SegmentedControlItem value="week" disabled><SegmentedControlItemText>Week</SegmentedControlItemText></SegmentedControlItem>
  </SegmentedControl>
);
`);
    expect(flat(result.code)).toContain(
      "toElement(LTabs([tab, setTab], TABS.map((item) => TabItem(item.id, item.label).count(item.count))).style('underline'))",
    );
    expect(flat(result.code)).toContain(
      "toElement(Segmented([v, setV], Option('day', t('day')), Option('week', 'Week').disabled()).label('Range').tabs())",
    );
    expect(result.converted).toBe(5);
    expect(result.fixtures[0]?.before).toContain('{ITEMS.map((item) => <TabsTrigger key={');
    expect(result.fixtures[0]?.after).toContain("ITEMS.map((item) => TabItem('⟨");
  });
  it('keeps a compound element whose parts do not all map, and its parts with it', () => {
    const result = run(`import { Tabs, TabsTrigger } from '@oxy.so/bloom/tabs';
export const A = () => (
  <Tabs value={tab} onValueChange={setTab} pressOpenTab="reselect"><TabsTrigger value="a" label="A" /></Tabs>
);
export const B = () => (
  <Tabs value={tab} onValueChange={setTab}><TabsTrigger value="a" label="A" textStyle={s} /><Extra /></Tabs>
);
`);
    expect(result.changed).toBe(false);
    expect(result.unconverted.map((u) => u.reasons.map((r) => r.code))).toEqual([
      ['Tabs:pressOpenTab'],
      ['TabItem:part'],
      ['TabItem:textStyle', 'not-a-part'],
      ['TabItem:part'],
    ]);
  });
  it('carries an array of data as it is, its parity drawn with the sample items', () => {
    const result = run(`import { SettingsSelect } from '@oxy.so/bloom/settings-modal/select';
import { AvatarGroup } from '@oxy.so/bloom/avatar-group';
import { List } from '@oxy.so/bloom/list';
export const A = () => (
  <SettingsSelect label={t('a')} value={mode} onChange={setMode} items={[{ value: 'x', label: t('x') }]} />
);
export const B = () => <AvatarGroup items={members} size={32} showInitials total={count} />;
export const C = () => <List items={rows} separator="none" empty={<Empty />} />;
export const D = () => <AvatarGroup items={members} size={56} />;
`);
    expect(flat(result.code)).toContain(
      "toElement(LSettingsSelect(t('a'), [mode, setMode], [{ value: 'x', label: t('x') }]))",
    );
    expect(result.code).toContain(
      "toElement(LAvatarGroup(members).size('md').initials().total(count))",
    );
    expect(result.code).toContain(
      "toElement(LList(rows).separator('none').emptyState(Embed(<Empty />)))",
    );
    expect(result.fixtures[0]?.before).toContain('items={ITEMS}');
    expect(result.fixtures[0]?.after).toContain("['⟨1⟩', () => {}], ITEMS)");
    expect(result.unconverted.map((u) => u.reasons[0]?.code)).toEqual(['AvatarGroup:size']);
  });
  it('follows React’s rule for JSX text', () => {
    expect(cleanJsxText('\n   Hello\n   world  \n')).toBe('Hello world');
    expect(cleanJsxText('  a  ')).toBe('  a  ');
  });
});
