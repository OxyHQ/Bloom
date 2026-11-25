import { loadTable } from '../table';
import { cleanJsxText, transformSource } from '../transform';

const table = loadTable();
const run = (source: string) =>
  transformSource(source, { table, fixtures: true, name: 'test.tsx' });
/** The code with its whitespace runs as one space, as recast breaks a long call over lines. */
const flat = (code: string) => code.replace(/\s+/g, ' ').replace(/\( /g, '(').replace(/ \)/g, ')');

describe('transformSource', () => {
  it('maps a row press chosen at render, a spinner in an app colour, a platform monospace, a 5% fill', () => {
    const { code } = run(`import { Item } from '@oxy.so/bloom/item';
import { SpinnerIcon } from '@oxy.so/bloom/loading';
import { useTheme, withAlpha } from '@oxy.so/bloom/theme';
import { Text } from 'react-native';
import { View } from 'react-native';
export function A({ full, add }) {
  const theme = useTheme();
  return (
    <View style={{ backgroundColor: withAlpha(theme.colors.primary, 0.05) }}>
      <Item title="Add" onPress={full ? undefined : add} />
      <SpinnerIcon size={32} color="#FFFFFF" />
      <Text style={{ fontFamily: 'monospace' }}>spam</Text>
    </View>
  );
}
`);
    expect(flat(code)).toContain('.onPress(full ? undefined : add)');
    expect(flat(code)).toContain('.tint(');
    expect(flat(code)).toContain(".font('system-mono')");
    expect(flat(code)).toContain(".background('primary/5')");
  });
  it('maps accessible, tabIndex, collapsable and a long press delay', () => {
    const { code } = run(`import { Pressable, View } from 'react-native';
import { Text } from '@oxy.so/bloom/typography';
export const A = ({ go, hold }) => (
  <View collapsable={false}>
    <Pressable onPress={go} accessible={false} tabIndex={-1}><Text>a</Text></Pressable>
    <Pressable onLongPress={hold} delayLongPress={500}><Text>b</Text></Pressable>
  </View>
);
`);
    expect(flat(code)).toContain('.onPress(go).accessibilityElement(false).focusable(false)');
    expect(flat(code)).toContain(".onLongPress(hold, '500')");
    expect(flat(code)).toContain('.collapsable(false)');
  });
  it('keeps a long press delay that is no duration token, or has no long press', () => {
    const result = run(`import { Pressable } from 'react-native';
import { Text } from '@oxy.so/bloom/typography';
export const A = ({ hold }) => <Pressable onLongPress={hold} delayLongPress={600}><Text>a</Text></Pressable>;
export const B = ({ go }) => <Pressable onPress={go} delayLongPress={500}><Text>b</Text></Pressable>;
`);
    expect(result.unconverted.map((u) => u.reasons[0]?.code)).toEqual([
      'prop:delayLongPress',
      'prop:delayLongPress',
    ]);
  });
  it('maps a text shadow written out, inline insets and a web sticky bar', () => {
    const { code } = run(`import { Text, View } from 'react-native';
export const A = () => (
  <View className="w-full z-10 web:sticky web:top-0">
    <Text style={{ position: 'absolute', insetInline: 0, textShadowColor: 'rgba(0, 0, 0, 0.8)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 }}>a</Text>
  </View>
);
`);
    expect(flat(code)).toContain(".position({ horizontal: 'none' })");
    expect(flat(code)).toContain(".textShadow('0 1px 3px rgb(0 0 0 / 0.8)')");
    expect(flat(code)).toContain(".sticky('top')");
  });
  it('names a style the caller hands in as its own reason', () => {
    const result = run(`import { View } from 'react-native';
const styles = { row: { padding: 12 } };
export const A = ({ style }) => <View style={[styles.row, style]} />;
export function B(props) {
  return <View style={props.containerStyle} />;
}
export const C = ({ style }) => {
  const { gutter } = style;
  return <View style={gutter} />;
};
export const D = ({ size }) => <View style={{ width: size }} />;
`);
    expect(result.unconverted.map((u) => u.reasons[0]?.code)).toEqual([
      'caller-style',
      'caller-style',
      'caller-style',
    ]);
  });
  it('maps a Button’s glyph drawn in the ink Bloom hands it', () => {
    const result = run(`import { Button } from '@oxy.so/bloom/button';
import { RiLinksLine } from '@oxy.so/bloom/icons/RiLinksLine';
export const A = ({ go, md }) => (
  <Button appearance="plain" iconOnly accessibilityLabel="Link" onPress={go}>
    {(color) => <RiLinksLine width={20} height={20} fill={color} />}
  </Button>
);
export const B = ({ go }) => (
  <Button iconOnly accessibilityLabel="Link" onPress={go}>
    {(color) => <RiLinksLine size="lg" fill={color} />}
  </Button>
);
export const C = ({ go }) => (
  <Button iconOnly accessibilityLabel="Link" onPress={go}>
    {(color) => <RiLinksLine size="lg" fill={color} style={{ opacity: 0.5 }} />}
  </Button>
);
`);
    expect(flat(result.code)).toContain(
      "Button(Group(Icon(RiLinksLine))).shape('circle').style('plain')",
    );
    expect(flat(result.code)).toContain("Button(Group(Icon(RiLinksLine).size('lg')))");
    // A glyph with more than its fill and side stays JSX, the function with it.
    expect(result.unconverted.map((u) => u.reasons[0]?.code)).toEqual([
      'render-children',
      'prop:style',
    ]);
  });
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
export const A = () => <Scope><Screen><GroupedSectionItem title="B" leftInset={8} /></Screen></Scope>;
export const B = () => <DropdownMenu />;
`);
    expect(result.changed).toBe(false);
    expect(result.unconverted.map((u) => u.reasons[0]?.code)).toEqual([
      'screen:wrapped',
      'GroupedSectionItem:leftInset',
      'DropdownMenu:children',
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
    expect(result.unconverted.map((u) => u.reasons[0]?.code)).toEqual([
      'icon-fill:theme-handed-in',
    ]);
    expect(result.fixtures[0]?.before).toContain(
      '<View style={{ flexDirection: \'row\', gap: 8 }} accessibilityRole="header">',
    );
    expect(result.fixtures[0]?.before).toContain('fill={parityTheme.colors.textSecondary}');
  });
  it('reads a style’s flex: 1 as .grow() and a theme colour as its role, and keeps a style a variant would override', () => {
    const result = run(`import { View } from 'react-native';
import { Text } from '@oxy.so/bloom/typography';
import { useTheme } from '@oxy.so/bloom/theme';
export function A() {
  const theme = useTheme();
  return (
    <View className="p-2" style={{ flex: 1, backgroundColor: theme.colors.backgroundSecondary }}>
      <Text style={{ color: theme.colors.textTertiary }}>a</Text>
    </View>
  );
}
export const B = () => <View className="md:p-4" style={{ padding: 8 }} />;
export const C = () => <View className="bg-muted" style={{ flex: 1, backgroundColor: theme.colors.primary }} />;
`);
    expect(flat(result.code)).toContain(
      "toElement(VStack(LText('a').foreground('textTertiary')).padding('all', 'sm').background('surface').grow())",
    );
    expect(result.unconverted.map((u) => u.reasons.map((r) => r.code))).toEqual([
      ['style-variant'],
      ['style'],
    ]);
    expect(result.fixtures[0]?.before).toContain(
      'style={{ flex: 1, backgroundColor: parityTheme.colors.backgroundSecondary }}',
    );
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
      "toElement(ScrollView().refreshable({ refreshing: busy, onRefresh: reload }, 'primary').scrollIndicators('hidden', 'vertical'))",
    );
    expect(flat(result.code)).toContain(
      "toElement(ScrollView().refreshable({ refreshing: busy, onRefresh: () => { reload(); } }).scrollIndicators('visible', 'horizontal'))",
    );
    // A tintColor alone tints iOS only: the tint of that platform.
    expect(flat(result.code)).toContain(
      "toElement(ScrollView().refreshable({ refreshing: busy, onRefresh: reload }, { ios: 'primary' }))",
    );
    expect(result.unconverted).toEqual([]);
  });
  it('reads a static content container style as content margins', () => {
    const result = run(`import { StyleSheet } from 'react-native';
import { ScreenScrollView } from '@oxy.so/bloom/screen';
export const A = () => <ScreenScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40, gap: 12 }} />;
export const B = () => <ScreenScrollView contentContainerStyle={styles.content} />;
export const D = () => <ScreenScrollView contentContainerStyle={{ flexGrow: 1 }} />;
export const E = () => <ScreenScrollView contentContainerStyle={{ flexGrow: 2 }} />;
const styles = StyleSheet.create({ content: { padding: 16 } });
`);
    expect(result.code).toContain(
      "toElement(ScrollView().contentMargins('horizontal', 'lg').contentMargins('bottom', '4xl').spacing('md'))",
    );
    expect(result.code).toContain("toElement(ScrollView().contentMargins('lg'))");
    expect(result.fixtures[1]?.before).toContain('contentContainerStyle={{ padding: 16 }}');
    expect(result.code).toContain('toElement(ScrollView().contentGrows())');
    expect(result.unconverted.map((u) => u.reasons[0]?.code)).toEqual([
      'ScrollView:contentContainerStyle',
    ]);
  });
  it('lays a content className out as the scroll view’s content view', () => {
    const result = run(`import { ScreenScrollView } from '@oxy.so/bloom/screen';
export const A = () => <ScreenScrollView contentContainerClassName="gap-4 px-4 pb-8" />;
export const B = () => <ScreenScrollView contentContainerClassName="flex-1 items-center justify-center" contentContainerStyle={{ padding: 16 }} />;
export const C = () => <ScreenScrollView contentContainerClassName="flex-row gap-2" />;
export const D = () => <ScreenScrollView contentContainerClassName="bg-card p-4" />;
export const E = () => <ScreenScrollView contentContainerClassName="p-4 md:p-8" />;
export const F = () => <ScreenScrollView contentContainerClassName={cls} />;
`);
    expect(result.code).toContain(
      "toElement(ScrollView().contentView((v) => v.padding('horizontal', 'lg').padding('bottom', '3xl').spacing('lg')))",
    );
    expect(result.code).toContain(
      "toElement(ScrollView().contentView((v) => v.flex('1').align('center').justify('center')).contentMargins('lg'))",
    );
    expect(result.code).toContain(
      "toElement(ScrollView().contentView((v) => v.axis('horizontal').spacing('sm')))",
    );
    expect(result.fixtures[0]?.classes).toEqual(['gap-4', 'px-4', 'pb-8']);
    expect(result.unconverted.map((u) => u.reasons[0]?.code)).toEqual([
      'contentView:background',
      'contentView:variant',
      'ScrollView:contentContainerClassName',
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
export const D = () => <View className={index > 0 ? 'border-t border-border px-4' : 'px-4 py-2'} />;
export const E = () => <View className={wide ? 'flex-row' : ''} />;
`);
    expect(flat(result.code)).toContain(
      "toElement(VStack(LText('a').font('14').leading('20px').weight(unread ? 'semibold' : 'medium')).padding('horizontal', 'md').background(active ? 'primary' : 'mutedFill').corner('infinite'))",
    );
    // Branches that write different modifiers: what each adds alone is a variant of its condition.
    expect(flat(result.code)).toContain(
      "toElement(VStack().padding('all', 'sm').when(Boolean(open), (v) => v.opacity('half')))",
    );
    expect(flat(result.code)).toContain(
      "toElement(VStack().padding('horizontal', 'lg').when(index > 0, (v) => v.border('border', 'thin', 'top')).when(!(index > 0), (v) => v.padding('vertical', 'sm')))",
    );
    expect(result.unconverted.map((u) => u.reasons[0]?.code)).toEqual([
      'dynamic-className',
      'dynamic-className',
    ]);
    expect(result.fixtures.map((f) => f.name)).toEqual([
      'test.tsx:4 (false)',
      'test.tsx:4',
      'test.tsx:8 (false)',
      'test.tsx:8',
      'test.tsx:10 (false)',
      'test.tsx:10',
    ]);
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
  if (!id) return <Screen header={<PageHeader title="B" />}><View className="p-4" /></Screen>;
  const header = <PageHeader title="A" />;
  return <Screen header={header} scroll="content"><View /></Screen>;
}
`);
    expect(flat(result.code)).toContain(
      "export default screen(function Route({ id }) { if (!id) return VStack().padding('all', 'lg').header(Header('B').inPage()); const header = toElement(Header('A').inPage()); return VStack().header(Embed(header)).screenScroll('content'); });",
    );
    expect(result.code).toContain("import { screen } from '@oxy.so/bloom-language/router';");
    expect(result.fixtures.filter((f) => f.screen)).toHaveLength(2);
  });
  it('makes a Screen of several views a Group, and its bottom bar the screen’s footer', () => {
    const result = run(`import { Screen } from '@oxy.so/bloom/screen';
import { View } from 'react-native';
export default function Route({ id, reply }) {
  if (!id)
    return (
      <Screen bottomBar={<View className="p-2" />} bottomBarPlacement="overlay" bottomBarKeyboardBehavior="follow">
        <Seo />
        {/* the thread */}
        <View className="p-4" />
      </Screen>
    );
  if (id === 'x') return <Screen><>{id ? <View /> : null}<View /></></Screen>;
  return <Screen>{id ? <View /> : null}</Screen>;
}
`);
    expect(flat(result.code)).toContain(
      "if (!id) return Group(Embed(<Seo />), /* the thread */ VStack().padding('all', 'lg')).header(false).footer(VStack().padding('all', 'sm'), { placement: 'overlay', keyboard: 'follow' });",
    );
    // A fragment's children are the Screen's; a condition is a Group of one.
    expect(flat(result.code)).toContain(
      "if (id === 'x') return Group(id ? VStack() : null, VStack()).header(false);",
    );
    expect(flat(result.code)).toContain('return Group(id ? VStack() : null).header(false);');
    expect(result.unconverted).toEqual([]);
    const lone = run(`import { Screen } from '@oxy.so/bloom/screen';
export default function Route() { return <Screen bottomBarPlacement="overlay" />; }
`);
    expect(lone.unconverted.map((u) => u.reasons.map((r) => r.code))).toEqual([
      ['screen:bottomBarPlacement'],
    ]);
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
    const mixed = run(`import { Screen } from '@oxy.so/bloom/screen';
export default function Route({ id }) { if (!id) return null; return <Screen />; }
`);
    expect(mixed.unconverted.map((u) => u.reasons[0]?.code)).toEqual(['screen:returns']);
    const early = run(`import { Screen } from '@oxy.so/bloom/screen';
const Routes = [Route];
function Route() { return <Screen />; }
`);
    expect(early.unconverted.map((u) => u.reasons[0]?.code)).toEqual(['screen:read-early']);
    const around = run(`import { Screen } from '@oxy.so/bloom/screen';
export default function Route() { return <><Seo /><Screen /></>; }
export function Other() { return <Scope><Screen /></Scope>; }
`);
    expect(around.unconverted.map((u) => u.reasons[0]?.code)).toEqual([
      'screen:beside',
      'screen:wrapped',
    ]);
  });
  it('reads StyleSheet.absoluteFill, alone or spread in a style, as a view pinned to every edge', () => {
    const result = run(`import { Pressable, StyleSheet, View } from 'react-native';
export const A = () => <View style={StyleSheet.absoluteFill} pointerEvents="box-none" />;
export const B = () => <Pressable style={styles.tap} onPress={go} />;
const styles = StyleSheet.create({ tap: { ...StyleSheet.absoluteFill, zIndex: 2 } });
`);
    expect(result.unconverted).toEqual([]);
    expect(flat(result.code)).toContain(
      "VStack().position({ top: 'none', right: 'none', bottom: 'none', left: 'none' })",
    );
    // The before side draws React Native's fill written out, with no StyleSheet in scope.
    const tap = result.fixtures.find((f) => f.before.includes('Pressable'));
    expect(tap?.before).toContain(
      "position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, zIndex: 2",
    );
  });
  it('reads a style chosen by a condition as the className choice it writes', () => {
    const result = run(`import { StyleSheet, View } from 'react-native';
export const A = ({ compact }) => <View style={compact ? styles.tight : styles.loose} />;
export const B = ({ open }) => <View style={[styles.row, open && styles.pad]} />;
const styles = StyleSheet.create({
  tight: { flexDirection: 'row', gap: 4 },
  loose: { flexDirection: 'row', gap: 8 },
  row: { flexDirection: 'row' },
  pad: { padding: 16 },
});
`);
    expect(result.unconverted).toEqual([]);
    expect(flat(result.code)).toContain("HStack().spacing(compact ? 'xs' : 'sm')");
    expect(flat(result.code)).toContain(
      "HStack().when(Boolean(open), (v) => v.padding('all', 'lg'))",
    );
    expect(result.fixtures.filter((f) => f.name.endsWith('(false)'))).toHaveLength(2);
  });
  it('reads a Pressable’s style of its press state as its pressed variant', () => {
    const result = run(`import { Pressable, StyleSheet } from 'react-native';
export const A = () => <Pressable onPress={go} style={({ pressed }) => [styles.option, pressed && styles.down]} />;
export const B = () => <Pressable onPress={go} style={({ pressed }) => [styles.option, pressed || held ? styles.down : null]} />;
const styles = StyleSheet.create({ option: { paddingVertical: 8 }, down: { paddingVertical: 16 } });
`);
    expect(flat(result.code)).toContain(".when('pressed', (v) => v.padding('vertical', 'lg'))");
    expect(result.unconverted.map((u) => u.reasons[0]?.code)).toEqual(['style']);
  });
  it('reads a colour from useColorTokens() as its role', () => {
    const result = run(`import { Text, View } from 'react-native';
import { useColorTokens } from '@oxy.so/bloom/theme';
export function A({ active }) {
  const colorTokens = useColorTokens();
  return <View style={{ backgroundColor: colorTokens.muted }}><Text style={{ color: colorTokens.mutedForeground }}>a</Text></View>;
}
`);
    expect(result.unconverted).toEqual([]);
    expect(flat(result.code)).toContain(".foreground('muted')");
    expect(flat(result.code)).toContain(".background('mutedFill')");
    expect(result.fixtures[0]?.before).toContain('parityTokens.muted');
  });
  it('reads Bloom’s tokens and a style constant in a style', () => {
    const result = run(`import { View } from 'react-native';
import { tokens } from '@oxy.so/bloom/styles';
const ROW = { flexDirection: 'row', gap: tokens.space.sm, paddingHorizontal: tokens.space._2xl, borderRadius: tokens.borderRadius.xs } satisfies object;
export const A = () => <View style={ROW} />;
`);
    expect(result.unconverted).toEqual([]);
    expect(flat(result.code)).toContain(
      "HStack().padding('horizontal', '2xl').corner('xs').spacing('sm')",
    );
  });
  it('reads a text’s fontSize and lineHeight as its size and line tokens', () => {
    const result = run(`import { Text } from 'react-native';
import { StyleSheet } from 'react-native';
export const A = () => <Text style={{ fontSize: 15, lineHeight: 20 }}>a</Text>;
export const B = () => <Text style={styles.day}>b</Text>;
export const C = () => <Text style={{ fontSize: 17.5 }}>c</Text>;
export const D = () => <Text style={{ lineHeight: 19 }}>d</Text>;
const styles = StyleSheet.create({ day: { fontSize: 28, lineHeight: 32, fontWeight: '700' } });
`);
    expect(flat(result.code)).toContain("RawText('a').font('md').leading('20px')");
    expect(flat(result.code)).toContain("RawText('b').weight('bold').font('28').leading('32px')");
    expect(result.unconverted.map((u) => u.reasons[0]?.subject)).toEqual([
      'fontSize',
      'lineHeight',
    ]);
  });
  it('reads a growing content container and an empty state a render function or a condition draws', () => {
    const result = run(`import { VirtualList } from '@oxy.so/bloom/list';
import { ScreenScrollView } from '@oxy.so/bloom/screen';
import { Text } from '@oxy.so/bloom/typography';
const EMPTY_CONTENT = { flexGrow: 1 } as const;
export const A = ({ items, renderEmpty }) => (
  <VirtualList
    data={items}
    renderItem={({ item }) => <Text>{item}</Text>}
    contentContainerStyle={items.length === 0 ? EMPTY_CONTENT : undefined}
    ListEmptyComponent={renderEmpty()}
    ListFooterComponent={loading ? <Text>More</Text> : null}
  />
);
export const B = () => <ScreenScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 24 }}><Text>a</Text></ScreenScrollView>;
`);
    const code = flat(result.code);
    expect(code).toContain('.contentGrows(items.length === 0)');
    expect(code).toContain('.emptyState(Embed(renderEmpty()))');
    expect(code).toContain(".footerContent(loading ? LText('More') : null)");
    expect(code).toContain(".contentGrows().contentMargins('bottom', '2xl')");
    expect(result.unconverted).toEqual([]);
  });
  it('reads a list’s end, sticky rows and refresh chosen at render, none included', () => {
    const result = run(`import { VirtualList } from '@oxy.so/bloom/list';
import { Text } from '@oxy.so/bloom/typography';
export const A = ({ items, hasMore, loadMore, tabBar, signedIn, refresh, refetching }) => (
  <VirtualList
    data={items}
    renderItem={({ item }) => <Text>{item}</Text>}
    onEndReached={hasMore ? loadMore : undefined}
    stickyHeaderIndices={tabBar ? [0] : undefined}
    refreshing={refetching}
    onRefresh={signedIn ? refresh : undefined}
  />
);
`);
    const code = flat(result.code);
    expect(code).toContain('.onEndReached(hasMore ? loadMore : undefined)');
    expect(code).toContain('.stickyIndices(tabBar ? [0] : undefined)');
    expect(code).toContain(
      '.refreshable({ refreshing: refetching, onRefresh: signedIn ? refresh : undefined })',
    );
    expect(result.unconverted).toEqual([]);
  });
  it('leaves a Pressable whose children are a render function of its press state', () => {
    const result = run(`import { Pressable, View } from 'react-native';
export const A = () => (
  <Pressable onPress={go} className="flex-row">
    {({ pressed }) => <View className={pressed ? 'opacity-50' : undefined} />}
  </Pressable>
);
`);
    expect(result.code).toContain('<Pressable onPress={go}');
    expect(result.unconverted.flatMap((u) => u.reasons.map((r) => r.code))).toContain(
      'render-children',
    );
  });
  it('reads a tab’s style and textStyle as its box and label', () => {
    const result = run(`import { Tabs, TabsTrigger } from '@oxy.so/bloom/tabs';
export const A = ({ tab, setTab }) => (
  <Tabs value={tab} onValueChange={setTab} variant="underline" style={{ height: 38 }}>
    <TabsTrigger
      value="posts"
      label="Posts"
      style={{ height: 38, minWidth: 76, paddingLeft: 12, paddingRight: 12, paddingTop: 0, paddingBottom: 0 }}
      textStyle={{ fontSize: 15, lineHeight: 18, fontWeight: tab === 'posts' ? '700' : '500' }}
    />
  </Tabs>
);
`);
    expect(result.unconverted).toEqual([]);
    const code = flat(result.code);
    expect(code).toContain(
      ".font('md').leading('18px').weight(tab === 'posts' ? 'bold' : 'medium')",
    );
    expect(code).toContain("frame({ height: '38', minWidth: '76' })");
    expect(code).toContain(".frame({ height: '38' })");
  });
  it('makes Bloom’s Fab a FAB with no glass, its icon and label its content', () => {
    const result = run(`import { Fab } from '@oxy.so/bloom/fab';
import { RiAddLine } from '@oxy.so/bloom/icons';
export const A = () => <Fab size="md" onPress={create} icon={RiAddLine} accessibilityLabel={t('create')} />;
export const B = () => <Fab icon={RiAddLine} label="Compose" collapsed={hidden} />;
export const C = () => <Fab icon={RiAddLine} iconSize={20} />;
`);
    const code = flat(result.code);
    expect(code).toContain(
      "FAB(Icon(RiAddLine)).size('md').onPress(create).label(t('create')).glass(identity)",
    );
    expect(code).toContain(
      "FAB(Icon(RiAddLine), Text('Compose')).collapsed(hidden).glass(identity)",
    );
    expect(result.unconverted.map((u) => u.reasons[0]?.code)).toEqual(['Fab:iconSize']);
  });
  it('makes Bloom’s PageFooter a PageFooter, its actions its toolbar', () => {
    const result = run(`import { PageFooter } from '@oxy.so/bloom/page-footer';
import { Text } from '@oxy.so/bloom/typography';
export const A = () => <PageFooter scrim="always" actions={<Text>Save</Text>}><Text>2 selected</Text></PageFooter>;
`);
    expect(result.unconverted).toEqual([]);
    expect(flat(result.code)).toContain(
      "LPageFooter(LText('2 selected')).scrollEdge('always').toolbar(LText('Save'))",
    );
  });
  it('reads a Chip’s colour chosen at render, none a branch of it', () => {
    const result = run(`import { Chip } from '@oxy.so/bloom/chip';
export const A = ({ on }) => <Chip size="xl" color={on ? 'error' : undefined}>Sensitive</Chip>;
export const B = ({ on }) => <Chip size={on ? 'lg' : undefined}>B</Chip>;
`);
    const code = flat(result.code);
    expect(code).toContain(".size('xl').tint(on ? 'danger' : undefined)");
    expect(result.unconverted.map((u) => u.reasons[0]?.code)).toEqual(['Chip:size']);
  });
  it('resolves a side’s margin over its axis’s, and removes the styles it leaves unread', () => {
    const result = run(`import { StyleSheet, View } from 'react-native';
const ROW = { flexDirection: 'row' } as const;
export const A = () => <View style={styles.box} />;
export const B = () => <View style={ROW} />;
export const C = ({ s }) => <View style={[styles.kept, s]} />;
const styles = StyleSheet.create({
  box: { marginHorizontal: 8, marginLeft: 4, marginVertical: 12 },
  kept: { padding: 4 },
  never: { padding: 8 },
});
`);
    const code = flat(result.code);
    expect(code).toContain(
      "VStack().margin('right', 'sm').margin('left', 'xs').margin('vertical', 'md')",
    );
    expect(code).not.toContain('box:');
    expect(code).not.toContain('const ROW');
    expect(code).toContain('kept: { padding: 4 }');
    expect(code).toContain('never: { padding: 8 }');
  });
  it('removes a StyleSheet the conversion leaves empty, and its import', () => {
    const result = run(`import { StyleSheet, View } from 'react-native';
export const A = () => <View style={styles.box} />;
const styles = StyleSheet.create({ box: { padding: 4 } });
`);
    expect(result.code).not.toContain('StyleSheet');
  });
  it('reads a pointerEvents chosen at render as the hit testing it chooses', () => {
    const result = run(`import { View } from 'react-native';
export const A = ({ split }) => <View pointerEvents={split ? 'box-none' : undefined} className="p-2" />;
export const B = ({ on }) => <View pointerEvents={on ? 'none' : 'auto'} />;
`);
    const code = flat(result.code);
    expect(code).toContain(".allowsHitTesting(split ? 'children' : undefined)");
    expect(code).toContain('.allowsHitTesting(on ? false : true)');
    expect(result.unconverted).toEqual([]);
  });
  it('reads a theme colour at an opacity as the role at that opacity token', () => {
    const result = run(`import { View } from 'react-native';
import { useTheme, withAlpha } from '@oxy.so/bloom/theme';
export function A({ on }) {
  const theme = useTheme();
  return <View style={{ backgroundColor: withAlpha(theme.colors.primary, 0.1), borderColor: withAlpha(theme.colors.primary, 0.33), borderWidth: 1 }} />;
}
export function B() {
  const theme = useTheme();
  return <View style={{ backgroundColor: withAlpha(theme.colors.primary, 0.1) }} />;
}
`);
    const code = flat(result.code);
    expect(code).toContain(".background('primary/10')");
    expect(result.fixtures.at(-1)?.bindings.withAlpha?.module).toBe('@oxy.so/bloom/theme');
    // 0.33 is no opacity token: the element stays.
    expect(result.unconverted).toHaveLength(1);
  });
  it('writes out overflow: visible as .clipped(false), in a style and a class', () => {
    const result = run(`import { View } from 'react-native';
export const A = () => <View style={{ marginTop: 12, overflow: 'visible' }} />;
export const B = () => <View className="overflow-visible p-2" />;
`);
    expect(flat(result.code)).toContain("VStack().clipped(false).margin('top', 'md')");
    expect(flat(result.code)).toContain("VStack().padding('all', 'sm').clipped(false)");
  });
  it('reads Bloom’s fontFamilyStyle spread in a style as the face, beside a numeric size', () => {
    const result = run(`import { StyleSheet } from 'react-native';
import { Text, fontFamilyStyle } from '@oxy.so/bloom/typography';
export const A = () => <Text style={styles.countdown}>3</Text>;
export const B = () => <Text style={{ ...fontFamilyStyle('serif'), fontSize: 96 }}>b</Text>;
const styles = StyleSheet.create({
  countdown: { ...fontFamilyStyle('display'), fontSize: 96, lineHeight: 96, fontWeight: '700' },
});
`);
    expect(flat(result.code)).toContain(".font('display').font('96').leading('96px')");
    expect(result.unconverted.map((u) => u.reasons[0]?.why)).toEqual(['a style built at runtime']);
    expect(result.fixtures[0]?.bindings.fontFamilyStyle?.module).toBe('@oxy.so/bloom/typography');
  });
  it('draws what a route wraps its Screen in as screen modifiers, innermost first', () => {
    const result = run(`import { Screen } from '@oxy.so/bloom/screen';
import { BloomColorScope } from '@oxy.so/bloom/theme';
import { KeyboardAvoidingView, Platform } from 'react-native';
import { HeaderDockProvider } from '@/components/HeaderDock';
export default function Saved() {
  return (
    <HeaderDockProvider>
      <BloomColorScope mode={dark ? 'dark' : undefined} asChild>
        <Screen scroll="auto"><Hole /></Screen>
      </BloomColorScope>
    </HeaderDockProvider>
  );
}
export function Boost() {
  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <Screen><Hole /></Screen>
    </KeyboardAvoidingView>
  );
}
`);
    expect(result.unconverted).toEqual([]);
    expect(flat(result.code)).toContain(
      ".header(false).screenScroll('auto').colorScope(dark ? 'dark' : undefined).provider(HeaderDockProvider)",
    );
    expect(flat(result.code)).toContain('.header(false).keyboardAvoiding()');
    const tailwind = run(`import { Screen } from '@oxy.so/bloom/screen';
import { KeyboardAvoidingView, Platform } from 'react-native';
const FILL = { flexGrow: 1, flexShrink: 1, flexBasis: '0%' } satisfies object;
export default function Boost() {
  return <KeyboardAvoidingView style={FILL} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}><Screen><Hole /></Screen></KeyboardAvoidingView>;
}
`);
    expect(flat(tailwind.code)).toContain(".keyboardAvoiding('1')");
    // Their imports go: nothing else reads them.
    expect(result.code).not.toMatch(/BloomColorScope|KeyboardAvoidingView|Platform/);
    // The before side draws React Native's own Platform, and the scope's mode is a hole on both sides.
    const boost = result.fixtures.find((f) => f.before.includes('KeyboardAvoidingView'));
    expect(boost?.before).toContain("RN.Platform.OS === 'ios'");
    const kept = run(`import { Screen } from '@oxy.so/bloom/screen';
import { BloomColorScope } from '@oxy.so/bloom/theme';
import { KeyboardAvoidingView } from 'react-native';
import { DockProvider } from './dock';
const FILL = { flexGrow: 1, flexShrink: 1, flexBasis: '0%' };
export function A() { return <KeyboardAvoidingView style={FILL} behavior="padding"><Screen /></KeyboardAvoidingView>; }
export function B() { return <BloomColorScope colorPreset="teal" asChild><Screen /></BloomColorScope>; }
export function C() { return <DockProvider value={1}><Screen /></DockProvider>; }
`);
    expect(
      kept.unconverted.map((u) => [
        u.reasons[0]?.code,
        u.reasons[0]?.why.split(':')[1]?.trim().slice(0, 24),
      ]),
    ).toEqual([
      ['screen:wrapped', 'a behavior other than Re'],
      ['screen:wrapped', 'a colour scope is `.colo'],
      ['screen:wrapped', 'a provider with props'],
    ]);
  });
  it('draws a Button’s, a Card’s and a Tabs’ static style as the node’s box', () => {
    const result = run(`import { Button } from '@oxy.so/bloom/button';
import { Card } from '@oxy.so/bloom/card';
import { Tabs, TabsTrigger } from '@oxy.so/bloom/tabs';
import { StyleSheet } from 'react-native';
export const A = () => <Button style={{ alignSelf: 'flex-start', marginTop: 8 }}>Follow</Button>;
export const B = () => <Card style={{ padding: 16, gap: 12, flexDirection: 'row' }}><Hole /></Card>;
export const C = () => <Tabs value={t} onValueChange={setT} style={styles.strip}><TabsTrigger value="a" label="A" /></Tabs>;
export const D = () => <Button style={{ gap: 4 }}>Gap</Button>;
export const E = () => <Card style={{ padding: 17 }} />;
const styles = StyleSheet.create({ strip: { height: 44 } });
`);
    const code = flat(result.code);
    expect(code).toContain(".alignSelf('start').margin('top', 'sm')");
    expect(code).toContain(".axis('horizontal').padding('all', 'lg').spacing('md')");
    expect(code).toContain(".frame({ height: '44' })");
    expect(result.unconverted.map((u) => u.reasons[0]?.code)).toEqual(['Button:style', 'unknown']);
  });
  it('draws a Chip’s leading and trailing views, by either of Bloom’s names, around its label', () => {
    const result = run(`import { Chip } from '@oxy.so/bloom/chip';
import { RiArrowDownSLine } from '@oxy.so/bloom/icons';
import { Icon, toElement } from '@oxy.so/bloom-language';
export const A = () => <Chip startIcon={on ? toElement(Icon(A).size('sm')) : toElement(Icon(B).size('sm'))} trailingIcon={RiArrowDownSLine}>Later</Chip>;
export const B = () => <Chip leading={<Art />} endIcon={<Art />}>Site</Chip>;
export const C = () => <Chip leadingIcon={RiArrowDownSLine} startIcon={<Art />}>Both</Chip>;
`);
    const code = flat(result.code);
    expect(code).toContain(
      "LChip(Embed(on ? toElement(Icon(A).size('sm')) : toElement(Icon(B).size('sm'))), Text('Later'), Icon(RiArrowDownSLine))",
    );
    expect(code).toContain("LChip(Embed(<Art />), Text('Site'), Embed(<Art />))");
    expect(result.unconverted.map((u) => u.reasons[0]?.code)).toEqual(['Chip:startIcon']);
  });
  it('pads by the device’s insets as .safeAreaPadding(), a padding beyond it on the same view', () => {
    const result = run(`import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
export function A() {
  const insets = useSafeAreaInsets();
  return <View style={{ paddingTop: insets.top + 24, paddingBottom: insets.bottom }} />;
}
export function B({ insets }) {
  return <View style={{ paddingTop: insets.top }} />;
}
export function C() {
  const insets = useSafeAreaInsets();
  return <View style={{ paddingTop: insets.top + 5 }} />;
}
`);
    expect(flat(result.code)).toContain(
      "toElement(VStack().safeAreaPadding('top').padding('top', '2xl').safeAreaPadding('bottom'))",
    );
    expect(result.unconverted.map((u) => u.reasons[0]?.code)).toEqual(['style', 'style']);
    expect(result.fixtures[0]?.insets).toBe(true);
    expect(result.fixtures[0]?.before).toContain('PARITY_INSETS.top + 24');
  });
  it('carries geometry computed at render as points, through the frames and edges it joins', () => {
    const result = run(`import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
const SIZE = 48;
export function A({ itemSize, count, index }) {
  const insets = useSafeAreaInsets();
  return (
    <View>
      <View className="w-12" style={{ height: itemSize / 2 }} />
      <View className="absolute right-4" style={{ top: insets.top + 8, zIndex: count - index }} />
      <View style={{ width: SIZE }} />
      <View style={{ width: 45 }} />
    </View>
  );
}
`);
    const code = flat(result.code);
    expect(code).toContain("VStack().frame({ width: '48', height: itemSize / 2 })");
    expect(code).toContain(".zIndex(count - index).position({ right: 'lg', top: insets.top + 8 })");
    // A module's constant and a number written out are tokens, never points.
    expect(result.unconverted.map((u) => u.reasons[0]?.subject)).toEqual(['width', 'w-11.25']);
    const [fixture] = result.fixtures;
    expect(fixture?.before).toContain('style={{ top: 49, zIndex: 43 }}');
    expect(fixture?.after).toContain(".zIndex(43).position({ right: 'lg', top: 49 })");
    expect(fixture?.insets).toBe(false);
  });
  it('fills a Screen with a role or an app colour, and says where a reel’s top is', () => {
    const result = run(`import { Screen } from '@oxy.so/bloom/screen';
import { BloomColorScope, useTheme } from '@oxy.so/bloom/theme';
import { Text } from '@oxy.so/bloom/typography';
export default function Reel({ empty, toTop, retry }) {
  const theme = useTheme();
  return (
    <Screen
      reselect={{ isAtTop: () => true, scrollToTop: toTop, refresh: retry }}
      style={{ backgroundColor: empty ? theme.colors.background : '#000000' }}
    >
      <Text>Reel</Text>
    </Screen>
  );
}
export function Half({ toTop }) {
  return (
    <Screen reselect={{ scrollToTop: toTop }}>
      <Text>Half</Text>
    </Screen>
  );
}
export function Scoped() {
  const theme = useTheme();
  return (
    <BloomColorScope mode="dark" asChild>
      <Screen style={{ backgroundColor: theme.colors.background }}>
        <Text>Scoped</Text>
      </Screen>
    </BloomColorScope>
  );
}
`);
    const code = flat(result.code);
    expect(code).toContain(
      ".onReselect(retry).reselectTop(() => true, toTop).screenBackground(empty ? 'background' : appColors.color.hex000000)",
    );
    expect(code).toContain("defineTokens({ color: { hex000000: '#000000' } })");
    // Where the top is without how to go there, and a role read outside the scope it paints in.
    expect(result.unconverted.map((u) => u.reasons[0]?.code)).toEqual([
      'screen:reselect',
      'screen:style',
    ]);
  });
  it('paints the surface fill read with useSurfaceFill() as its role, outside a Bloom component', () => {
    const result = run(`import { Card } from '@oxy.so/bloom/card';
import { useSurfaceFill } from '@oxy.so/bloom/styles';
import { View } from 'react-native';
export function A() {
  const surfaceFill = useSurfaceFill();
  return (
    <View>
      <View style={{ backgroundColor: surfaceFill }} />
      <Card>
        <View style={{ backgroundColor: surfaceFill }} />
      </Card>
    </View>
  );
}
`);
    expect(flat(result.code)).toContain("VStack().background('surfaceFill')");
    expect(result.unconverted.map((u) => u.reasons[0]?.subject)).toEqual(['backgroundColor']);
    expect(result.fixtures[0]?.before).toContain('style={{ backgroundColor: paritySurface }}');
    expect(result.fixtures[0]?.themed).toBe(true);
  });
  it('names a percentage of the parent by its length or edge token', () => {
    const result = run(`import { View } from 'react-native';
export const A = () => (
  <View style={{ maxHeight: '90%', width: '50%' }}>
    <View style={{ position: 'absolute', bottom: 0, left: '25%', right: '25%' }} />
    <View style={{ width: '45%' }} />
  </View>
);
`);
    const code = flat(result.code);
    expect(code).toContain(".frame({ maxHeight: '90%', width: '1/2' })");
    expect(code).toContain(".position({ bottom: 'none', left: '25%', right: '25%' })");
    expect(result.unconverted.map((u) => u.reasons[0]?.subject)).toEqual(['width']);
  });
  it('grows a Field by React Native’s flex: 1, which .grow() writes itself', () => {
    const result = run(`import { Field } from '@oxy.so/bloom/field';
import { Text } from '@oxy.so/bloom/typography';
export const A = () => (
  <Field label="Date" style={{ flex: 1 }}>
    <Text>a</Text>
  </Field>
);
`);
    expect(flat(result.code)).toContain("LField('Date', LText('a')).grow()");
  });
  it('writes a shorthand property’s hole beside its key', () => {
    const [fixture] = run(`import { View } from 'react-native';
export function A({ width, height }) {
  return <View style={{ width, height }} />;
}
`).fixtures;
    expect(fixture?.before).toBe('<View style={{ width: 37, height: 43 }} />');
  });
  it('rounds a radius of half a square’s side as full', () => {
    const result = run(`import { View } from 'react-native';
export function A({ size, w }) {
  return (
    <View>
      <View style={{ width: size, height: size, borderRadius: size / 2 }} />
      <View style={{ width: w, height: size, borderRadius: size / 2 }} />
    </View>
  );
}
`);
    expect(flat(result.code)).toContain(
      "VStack().frame({ width: size, height: size }).corner('full')",
    );
    expect(result.unconverted.map((u) => u.reasons[0]?.subject)).toEqual(['borderRadius']);
    expect(result.fixtures[0]?.before).toContain(
      'style={{ width: 37, height: 37, borderRadius: 37 / 2 }}',
    );
  });
  it('follows a Button’s ink held in a const back to the theme’s roles', () => {
    const result = run(`import { Button } from '@oxy.so/bloom/button';
import { useTheme } from '@oxy.so/bloom/theme';
export function A({ invalid, active }) {
  const theme = useTheme();
  const tint = invalid ? theme.colors.error : active ? theme.colors.primary : undefined;
  return <Button color={tint} hoverColor={tint}>Go</Button>;
}
`);
    expect(flat(result.code)).toContain(
      ".foreground(invalid ? 'error' : active ? 'primary' : undefined).hoverForeground(invalid ? 'error' : active ? 'primary' : undefined)",
    );
    expect(result.fixtures.map((f) => f.before).join()).toContain(
      'color={(true ? parityTheme.colors.error',
    );
  });
  it('rounds a radius of 999 as full, a corner’s own radius on its side', () => {
    const result = run(`import { View } from 'react-native';
import { Button } from '@oxy.so/bloom/button';
export const A = () => <View style={{ borderRadius: 999 }} />;
export const B = () => <Button style={{ borderRadius: 999 }}>Go</Button>;
export const C = () => <View style={{ borderTopLeftRadius: 999, borderBottomEndRadius: 12 }} />;
`);
    const code = flat(result.code);
    expect(code).toContain("toElement(VStack().corner('full'))");
    expect(code).toContain("toElement(LButton(Text('Go')).corner('full'))");
    expect(code).toContain(
      "toElement(VStack().corner('full', 'top-left').corner('md', 'bottom-trailing'))",
    );
    expect(result.unconverted).toEqual([]);
  });
  it('makes a DropdownMenu tree a Menu drawn as Bloom’s dropdown', () => {
    const result = run(`import { Button } from '@oxy.so/bloom/button';
import { RiMoreFill, RiShareLine } from '@oxy.so/bloom/icons';
import { Icon, toElement } from '@oxy.so/bloom-language';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@oxy.so/bloom/dropdown-menu';
export const A = () => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild label={t('more')}>
      <Button iconOnly appearance="plain" leadingIcon={RiMoreFill} accessibilityLabel={t('more')} />
    </DropdownMenuTrigger>
    <DropdownMenuContent label={t('more')}>
      <DropdownMenuItem leading={toElement(Icon(RiShareLine).size('sm').foreground('primary'))} onPress={share}>
        {t('share')}
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem variant="destructive" onPress={block}>Block</DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
);
export const B = () => <DropdownMenu open={open} onOpenChange={setOpen}><DropdownMenuTrigger asChild label="x"><Button iconOnly appearance="plain" leadingIcon={RiMoreFill} accessibilityLabel="x" /></DropdownMenuTrigger><DropdownMenuContent label="x"><DropdownMenuItem onPress={share}>Share</DropdownMenuItem></DropdownMenuContent></DropdownMenu>;
export const C = () => <DropdownMenu open={open} onOpenChange={setOpen} modal><DropdownMenuTrigger asChild label="x"><Button /></DropdownMenuTrigger><DropdownMenuContent label="x" /></DropdownMenu>;
`);
    expect(flat(result.code)).toContain(
      "toElement(Menu(LButton(Icon(RiMoreFill)).shape('circle').style('plain').label(t('more')), Item(t('share')).icon(RiShareLine).iconSize('sm').iconForeground('primary').onPress(share), Divider(), Item('Block').destructive().onPress(block)).label(t('more')).menuStyle('dropdown'))",
    );
    expect(flat(result.code)).toContain(
      ".label('x').menuStyle('dropdown').presented([open, setOpen])",
    );
    expect(result.unconverted.map((u) => u.reasons[0]?.code)).toEqual(['DropdownMenu:props']);
  });
  it('makes a label over a radio group a Section of choices', () => {
    const result = run(`import { Button } from '@oxy.so/bloom/button';
import { RiMoreFill } from '@oxy.so/bloom/icons';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@oxy.so/bloom/dropdown-menu';
export const A = () => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild label="Audience">
      <Button iconOnly appearance="plain" leadingIcon={RiMoreFill} accessibilityLabel="Audience" />
    </DropdownMenuTrigger>
    <DropdownMenuContent label="Audience">
      <DropdownMenuLabel>{t('who')}</DropdownMenuLabel>
      <DropdownMenuRadioGroup value={audience} onValueChange={(value) => setAudience(value)}>
        <DropdownMenuRadioItem value="public">Everyone</DropdownMenuRadioItem>
        <DropdownMenuRadioItem value="direct" keepOpen>{t('direct')}</DropdownMenuRadioItem>
      </DropdownMenuRadioGroup>
    </DropdownMenuContent>
  </DropdownMenu>
);
`);
    expect(result.unconverted).toEqual([]);
    expect(flat(result.code)).toContain(
      "Section(Item('Everyone').tag('public'), Item(t('direct')).tag('direct').keepOpen()).title(t('who')).selection([audience, (value) => setAudience(value)])",
    );
    expect(result.code).not.toContain('DropdownMenuRadioItem');
  });
  it('takes a language view placed with toElement() as a Screen’s header', () => {
    const result = run(`import { Screen } from '@oxy.so/bloom/screen';
import { Header, toElement } from '@oxy.so/bloom-language';
import { View } from 'react-native';
export function Edit({ loading }) {
  const header = toElement(Header('Edit').inPage());
  if (loading) return <Screen header={header}><View /></Screen>;
  return <Screen header={toElement(Header('Edit').inPage())}><View /></Screen>;
}
`);
    const code = flat(result.code);
    expect(code).toContain('if (loading) return VStack().header(Embed(header));');
    expect(code).toContain("return VStack().header(Header('Edit').inPage());");
    expect(result.unconverted).toEqual([]);
  });
  it('makes any component whose every return is a Screen a screen(), wherever it is declared', () => {
    const result = run(`import { Screen } from '@oxy.so/bloom/screen';
import { View } from 'react-native';
/** The list, behind its gate. */
function ListScreen({ id }: { id: string }) {
  if (!id) return <Screen><View /></Screen>;
  return <Screen scroll="content"><View /></Screen>;
}
export default function Route() { return <Gate><ListScreen id="a" /></Gate>; }
export const Sheet = () => <Screen><View /></Screen>;
const Saved = () => {
  return <Screen><View /></Screen>;
};
export default Saved;
export default function Named() { return <Screen><View /></Screen>; }
Named.options = {};
`);
    const code = flat(result.code);
    expect(code).toContain(
      "/** The list, behind its gate. */ const ListScreen = screen(function ListScreen({ id }: { id: string }) { if (!id) return VStack().header(false); return VStack().header(false).screenScroll('content'); });",
    );
    expect(code).toContain(
      'export const Sheet = screen(function Sheet() { return VStack().header(false); });',
    );
    expect(code).toContain(
      'const Saved = screen(function Saved() { return VStack().header(false); }); export default Saved;',
    );
    expect(code).toContain(
      'const Named = screen(function Named() { return VStack().header(false); }); export default Named; Named.options = {};',
    );
    expect(result.unconverted).toEqual([]);
  });
  it('paints a static colour fill as an app colour, declared once after the constants it reads', () => {
    const result = run(`import { View } from 'react-native';
import { BloomColorScope, useTheme } from '@oxy.so/bloom/theme';
import { RiHeart3Line, RiPlayFill } from '@oxy.so/bloom/icons';
const LIKE = '#FF3040';
const MUTED = 'rgba(255,255,255,0.72)';
export function A() {
  const theme = useTheme();
  return (
    <View className="flex-row gap-2">
      <RiHeart3Line size="sm" fill={LIKE} />
      <RiPlayFill fill="#fff" />
      <RiPlayFill fill="white" />
      <RiPlayFill fill={MUTED} />
      <RiPlayFill fill="currentColor" />
      <BloomColorScope mode="dark"><RiPlayFill fill={theme.colors.text} /></BloomColorScope>
    </View>
  );
}
`);
    expect(result.code).toContain(
      "const MUTED = 'rgba(255,255,255,0.72)';\nconst appColors = defineTokens({ color: { LIKE, hexfff: '#fff', white: 'white', MUTED } });",
    );
    expect(flat(result.code)).toContain(
      "HStack(Icon(RiHeart3Line).size('sm').foreground(appColors.color.LIKE), Icon(RiPlayFill).foreground(appColors.color.hexfff), Icon(RiPlayFill).foreground(appColors.color.white), Icon(RiPlayFill).foreground(appColors.color.MUTED),",
    );
    expect(result.unconverted.map((u) => u.reasons[0]?.code)).toEqual([
      'icon-fill:not-a-colour',
      'icon-fill:color-scope',
    ]);
    // The before side reads the constant's hex; the corpus declares the table the chain reads.
    expect(result.fixtures[0]?.before).toContain("fill={'#FF3040'}");
    expect(result.fixtures[0]?.appColors).toEqual({
      table: 'appColors',
      color: { LIKE: '#FF3040', hexfff: '#fff', white: 'white', MUTED: 'rgba(255,255,255,0.72)' },
    });
  });
  it('draws a PressableScale as a pressable stack that scales', () => {
    const result = run(`import { PressableScale } from '@oxy.so/bloom/pressable-scale';
import { Text } from '@oxy.so/bloom/typography';
export const A = ({ go }) => (
  <PressableScale onPress={go} className="flex-row gap-3"><Text>Open</Text></PressableScale>
);
export const B = ({ go }) => <PressableScale onPress={go} targetScale={0.9} />;
`);
    expect(flat(result.code)).toContain(
      "toElement(HStack(LText('Open')).spacing('md').onPress(go).pressScale())",
    );
    expect(result.unconverted.map((u) => u.reasons[0]?.code)).toEqual(['prop:targetScale']);
  });
  it('draws ChatSearchField as its node, and keeps an AppShell as a layout route’s', () => {
    const result = run(`import { ChatSearchField } from '@oxy.so/bloom/chat-list';
import { AppShell, AppShellPanel } from '@oxy.so/bloom/app-shell';
export const A = ({ q, setQ }) => (
  <ChatSearchField value={q} onChangeText={setQ} onClear={() => setQ('')} placeholder="Search" autoFocus />
);
export const B = () => <AppShell><AppShellPanel id="list" /></AppShell>;
`);
    expect(flat(result.code)).toContain(
      "toElement(LChatSearchField([q, setQ], { placeholder: 'Search', onClear: () => setQ(''), autoFocus: true }))",
    );
    expect(result.unconverted.map((u) => u.reasons[0]?.code)).toEqual([
      'kept:AppShell',
      'kept:AppShellPanel',
    ]);
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
  <Tabs value={tab} onValueChange={setTab} style={s}><TabsTrigger value="a" label="A" /></Tabs>
);
export const B = () => (
  <Tabs value={tab} onValueChange={setTab}><TabsTrigger value="a" label="A" textStyle={s} /><Extra /></Tabs>
);
`);
    expect(result.changed).toBe(false);
    expect(result.unconverted.map((u) => u.reasons.map((r) => r.code))).toEqual([
      ['Tabs:style'],
      ['TabItem:part'],
      ['TabItem:textStyle', 'not-a-part'],
      ['TabItem:part'],
    ]);
  });
  it('carries an array of data as it is, its parity drawn with the sample items', () => {
    const result = run(`import { SettingsSelect } from '@oxy.so/bloom/settings-modal/select';
import { AvatarGroup } from '@oxy.so/bloom/avatar-group';
import { List } from '@oxy.so/bloom/list';
import { View } from 'react-native';
export const A = () => (
  <SettingsSelect label={t('a')} value={mode} onChange={setMode} items={[{ value: 'x', label: t('x') }]} />
);
export const B = () => <AvatarGroup items={members} size={32} showInitials total={count} />;
export const C = () => <List items={rows} separator="none" empty={<Empty />} />;
export const D = () => <AvatarGroup items={members} size={56} />;
export const E = () => <List items={rows.map((r) => ({ id: r.id, trailing: <View className="p-2" /> }))} />;
`);
    expect(flat(result.code)).toContain(
      "toElement(LList(rows.map((r) => ({ id: r.id, trailing: toElement(VStack().padding('all', 'sm')) }))))",
    );
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
  it('draws a virtual list’s renderItem as its row, handed FlashList’s argument as Bloom hands it', () => {
    const result = run(`import { VirtualList } from '@oxy.so/bloom/list';
export const A = () => (
  <VirtualList data={posts} renderItem={({ item: post }) => <Post post={post} />} ListFooterComponent={<Footer />} />
);
export const B = () => <VirtualList data={posts} renderItem={renderPost} />;
export const C = () => <VirtualList data={posts} renderItem={({ item }) => <Post post={item} />} ListHeaderComponent={Header} />;
export const D = () => <VirtualList data={posts} renderItem={(row) => <Post post={row.item} />} />;
export const E = () => <VirtualList data={posts} renderItem={info} />;
export const F = () => <VirtualList data={rows} renderItem={({ item }) => (item.kind === 'tabs' ? tabs : renderRow(item))} />;
export const G = () => <VirtualList data={rows} renderItem={({ item }) => { return renderRow(item); }} />;
`);
    expect(result.code).toContain(
      "toElement(LVirtualList(rows, ({ item }) => Embed((item.kind === 'tabs' ? tabs : renderRow(item)))))",
    );
    expect(flat(result.code)).toContain(
      'toElement(LVirtualList(posts, ({ item: post }) => Embed(<Post post={post} />)).footerContent(Embed(<Footer />)))',
    );
    // A named renderItem is the row itself: a new arrow per render would redraw FlashList's memoised rows.
    expect(result.code).toContain('toElement(LVirtualList(posts, renderPost))');
    expect(result.code).toContain(
      'toElement(LVirtualList(posts, (row) => Embed(<Post post={row.item} />)))',
    );
    expect(result.fixtures[1]?.before).toContain(
      "renderItem={((info) => <Hole n={'1-' + info.index} />)}",
    );
    expect(result.fixtures[1]?.after).toContain(
      "LVirtualList(ITEMS, ((info) => <Hole n={'1-' + info.index} />))",
    );
    // A function named as the row's own parameter is carried as it is too: nothing shadows it.
    expect(result.code).toContain('toElement(LVirtualList(posts, info))');
    expect(result.unconverted.map((u) => u.reasons[0]?.code)).toEqual([
      'VirtualList:ListHeaderComponent',
      'VirtualList:renderItem',
    ]);
  });
  it('draws a row that returns a language root as that view (no boundary of its own), and its sticky rows', () => {
    const result = run(`import { VirtualList } from '@oxy.so/bloom/list';
import { VStack, toElement } from '@oxy.so/bloom-language';
export const A = () => (
  <VirtualList
    data={cells}
    renderItem={({ item }) => toElement(VStack(Cell(item)).padding('xs'))}
    stickyHeaderIndices={sticky ? [0] : undefined}
  />
);
`);
    expect(flat(result.code)).toContain(
      "toElement(LVirtualList(cells, ({ item }) => VStack(Cell(item)).padding('xs')).stickyIndices(sticky ? [0] : undefined))",
    );
    expect(result.unconverted).toEqual([]);
  });
  it('reads a grid’s item layout and a header kept to its content', () => {
    const result = run(`import { VirtualList } from '@oxy.so/bloom/list';
const HEADER_FITS = { flexShrink: 0, alignSelf: 'stretch', flexGrow: 0 };
export const A = () => (
  <VirtualList
    data={rows}
    renderItem={renderRow}
    numColumns={3}
    overrideItemLayout={spanRow}
    ListHeaderComponent={renderHeader()}
    ListHeaderComponentStyle={{ flexGrow: 0, flexShrink: 0, alignSelf: 'stretch' }}
  />
);
export const B = () => <VirtualList data={rows} renderItem={renderRow} ListHeaderComponentStyle={HEADER_FITS} />;
export const C = () => <VirtualList data={rows} renderItem={renderRow} ListHeaderComponentStyle={{ flexGrow: 0 }} />;
export const D = () => <VirtualList data={rows} renderItem={renderRow} ListHeaderComponentStyle={{ flexGrow: 0, flexShrink: 0, alignSelf: 'center' }} />;
`);
    const code = flat(result.code);
    expect(code).toContain(
      'toElement(LVirtualList(rows, renderRow).columns(3).itemLayout(spanRow).headerContent(Embed(renderHeader())).headerFitsContent())',
    );
    expect(code).toContain('toElement(LVirtualList(rows, renderRow).headerFitsContent())');
    // Any other header style keeps the list JSX.
    expect(result.unconverted.map((u) => u.reasons[0]?.code)).toEqual([
      'VirtualList:ListHeaderComponentStyle',
      'VirtualList:ListHeaderComponentStyle',
    ]);
  });
  it('binds a virtual list to its screen and gathers the engine’s knobs into its tuning', () => {
    const result = run(`import { VirtualList } from '@oxy.so/bloom/list';
export const A = () => (
  <VirtualList
    data={posts}
    renderItem={renderPost}
    screen={{}}
    scrollbar="never"
    keyboardShouldPersistTaps="handled"
    keyboardDismissMode="on-drag"
    overscan={OVERSCAN_ROWS}
    removeClippedSubviews
    windowSize={10}
    maintainVisibleContentPosition={false}
  />
);
export const B = () => <VirtualList data={posts} renderItem={renderPost} screen={{ active }} />;
`);
    expect(flat(result.code)).toContain(
      "toElement(LVirtualList(posts, renderPost).tuning({ overscan: OVERSCAN_ROWS, removeClippedSubviews: true, windowSize: 10, maintainVisibleContentPosition: false }).screen().scrollbar('never').keyboardTaps('handled').scrollDismissesKeyboard('immediately'))",
    );
    expect(result.unconverted.map((u) => u.reasons[0]?.code)).toEqual(['VirtualList:screen']);
  });
  it('lets touches through a view of pointerEvents none, box-none and box-only', () => {
    const result = run(`import { View } from 'react-native';
export const A = () => <View pointerEvents="none" className="p-2" />;
export const B = () => <View pointerEvents="box-none" />;
export const C = () => <View pointerEvents="box-only" />;
export const D = () => <View pointerEvents={mode} />;
`);
    expect(result.code).toContain(
      "toElement(VStack().padding('all', 'sm').allowsHitTesting(false))",
    );
    expect(result.code).toContain("toElement(VStack().allowsHitTesting('children'))");
    expect(result.code).toContain("toElement(VStack().allowsHitTesting('self'))");
    expect(result.unconverted.map((u) => u.reasons[0]?.code)).toEqual(['prop:pointerEvents']);
  });
  it('draws a Dialog opened by its open and onClose as a presented dialog, and keeps an imperative one', () => {
    const result = run(`import { Dialog } from '@oxy.so/bloom/dialog';
import { View } from 'react-native';
export function A({ open, onClose }) {
  return (
    <Dialog open={open} onClose={onClose} title="Post as" maxWidth={400} contentPadding={0} placement={{ base: 'bottom', md: 'center' }}>
      <View className="p-4" />
    </Dialog>
  );
}
export const B = ({ open, done }) => <Dialog open={open} onClose={() => { done(); }} label="Done" placement="center" />;
export const C = ({ control, onClose }) => <Dialog control={control} onClose={onClose} label="C" />;
export const D = ({ open, close }) => <Dialog open={open} onClose={(reason) => close(reason)} label="D" />;
export const E = ({ open }) => <Dialog open={open} label="E" />;
`);
    expect(flat(result.code)).toContain(
      "toElement(LDialog(VStack().padding('all', 'lg')).title('Post as').frame({ maxWidth: '400' }).padding('none').presentAt('bottom', { md: 'center' }).presented([open, () => onClose()]))",
    );
    expect(flat(result.code)).toContain(
      "toElement(LDialog().label('Done').presentAt('center').presented([open, () => { done(); }]))",
    );
    // The language's Dialog beside Bloom's, which the dialogs kept JSX still draw.
    expect(result.code).toContain(
      "import { Dialog as LDialog, VStack, toElement } from '@oxy.so/bloom-language';",
    );
    // A control's close handler, a handler that may read an argument, and an open no one closes stay JSX.
    expect(result.unconverted.map((u) => u.reasons.map((r) => r.code))).toEqual([
      ['Dialog:onClose'],
      ['Dialog:open'],
      ['Dialog:open'],
    ]);
  });
  it('maps a dialog its control opens, detached, its panel kept to a width', () => {
    const { code } = run(`import { Dialog } from '@oxy.so/bloom/dialog';
import { Text } from '@oxy.so/bloom/typography';
export const A = ({ control }) => (
  <Dialog control={control} placement="bottom" detached panelStyle={{ maxWidth: 540 }} contentPadding={0}>
    <Text>a</Text>
  </Dialog>
);
`);
    expect(flat(code)).toContain(
      ".presentAt('bottom').detached().panelFrame({ maxWidth: '540' }).padding('none').control(control)",
    );
  });
  it('maps an avatar’s corner radius, a group’s ring, rendition and action, a search’s editable', () => {
    const { code } = run(`import { Avatar } from '@oxy.so/bloom/avatar';
import { AvatarGroup } from '@oxy.so/bloom/avatar-group';
import { Search } from '@oxy.so/bloom/search';
import { useTheme } from '@oxy.so/bloom/theme';
import { Text } from '@oxy.so/bloom/typography';
export function A({ uri, members, value, set, full }) {
  const theme = useTheme();
  return (
    <>
      <Avatar source={uri} size={36} style={{ borderRadius: 12 }} />
      <AvatarGroup items={members} ringColor={theme.colors.background} variant="small" renderItemAction={(item) => <Text>Follow</Text>} />
      <Search value={value} onValueChange={set} editable={!full} />
    </>
  );
}
`);
    expect(flat(code)).toContain(".cornerRadius('md')");
    expect(flat(code)).toContain(".ringColor('background')");
    expect(flat(code)).toContain(".variant('small')");
    expect(flat(code)).toContain(".itemAction((item) => LText('Follow'))");
    expect(flat(code)).toContain('.editable(!full)');
  });
  it('moves a dialog’s onDismissed and a virtual list’s content padding and gap', () => {
    const result = run(`import { Dialog } from '@oxy.so/bloom/dialog';
import { VirtualList } from '@oxy.so/bloom/list';
export const A = ({ open, onClose, gone }) => <Dialog open={open} onClose={onClose} onDismissed={gone} label="A" />;
export const B = () => <VirtualList data={posts} renderItem={renderPost} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24, gap: 8 }} />;
export const C = () => <VirtualList data={posts} renderItem={renderPost} contentContainerStyle={{ flexShrink: 1 }} />;
`);
    expect(flat(result.code)).toContain(
      "toElement(LDialog().onDismissed(gone).label('A').presented([open, () => onClose()]))",
    );
    expect(flat(result.code)).toContain(
      "toElement(LVirtualList(posts, renderPost).contentMargins('horizontal', 'lg').contentMargins('bottom', '2xl').spacing('sm'))",
    );
    // What is no padding or gap stays: the language's content margins are only those.
    expect(result.unconverted.map((u) => u.reasons[0]?.code)).toEqual([
      'VirtualList:contentContainerStyle',
    ]);
  });
  it('moves a Button’s glyph size, press, spinner, open state and inks, a tab strip’s open-tab press, a field’s lines and a header’s title view', () => {
    const result = run(`import { Button } from '@oxy.so/bloom/button';
import { Tabs, TabsTrigger } from '@oxy.so/bloom/tabs';
import { TextFieldInput } from '@oxy.so/bloom/text-field';
import { PageHeader } from '@oxy.so/bloom/page-header';
import { Text } from '@oxy.so/bloom/typography';
import { RiMoreFill } from '@oxy.so/bloom/icons';
import { useTheme } from '@oxy.so/bloom/theme';
export function A({ open, busy, on, tab, setTab, bio, setBio, can }) {
  const theme = useTheme();
  return (
    <>
      <Button appearance={on ? 'solid' : 'subtle'} leadingIcon={RiMoreFill} iconOnly iconSize={28} stopPropagation loading={busy} loadingIndicator={null} aria-expanded={open} color={theme.colors.error} hoverColor={theme.colors.error} accessibilityLabel="More" />
      <Tabs value={tab} onValueChange={setTab} pressOpenTab="reselect"><TabsTrigger value="a" label="A" /></Tabs>
      <TextFieldInput label="Bio" value={bio} onValueChange={setBio} multiline editable={can} />
      <PageHeader title={<Text>Home</Text>} />
    </>
  );
}
`);
    const code = flat(result.code);
    expect(code).toContain(".style(on ? 'solid' : 'subtle')");
    expect(code).toContain(".iconSize('xl')");
    expect(code).toContain('.stopPropagation()');
    expect(code).toContain('.loadingIndicator(null)');
    expect(code).toContain('.accessibilityState({ expanded: open })');
    expect(code).toContain(".foreground('error').hoverForeground('error')");
    expect(code).toContain(".pressOpenTab('reselect')");
    expect(code).toContain('.multiline().editable(can)');
    expect(code).toContain("Header(LText('Home')).inPage()");
  });

  it('moves a VirtualList’s refreshing and onRefresh as one query-driven refresh', () => {
    const result = run(`import { VirtualList } from '@oxy.so/bloom/list';
import { ListItem } from '@oxy.so/bloom/list';
export const A = ({ rows, q }) => (
  <VirtualList data={rows} renderItem={({ item }) => <ListItem title={item} />} refreshing={q.isRefetching} onRefresh={q.refetch} />
);
`);
    expect(flat(result.code)).toContain(
      '.refreshable({ refreshing: q.isRefetching, onRefresh: q.refetch })',
    );
  });

  it('moves a Field of several controls and a Chip coloured by an accent tone', () => {
    const result = run(`import { Field } from '@oxy.so/bloom/field';
import { Chip } from '@oxy.so/bloom/chip';
export const A = () => (
  <Field label="Type" multiple>
    <Chip variant="subtle" color="error">Remote</Chip>
  </Field>
);
`);
    expect(flat(result.code)).toContain(
      "toElement(LField('Type', LChip(Text('Remote')).style('subtle').tint('danger')).multiple())",
    );
  });

  it('reads a radius, a stacking level and an aspect ratio by value, overflow: visible written out and inset as its edges', () => {
    const result = run(`import { View } from 'react-native';
export const A = () => <View style={{ borderRadius: 999, zIndex: 6, aspectRatio: 1, overflow: 'visible' }} />;
export const B = () => <View style={{ borderRadius: 15, zIndex: -1 }} />;
export const C = () => <View style={{ position: 'absolute', inset: 0, borderRadius: 7 }} />;
export const D = () => <View style={{ borderRadius: 13 }} />;
`);
    const code = flat(result.code);
    expect(code).toContain(
      "toElement(VStack().aspectRatio(1).clipped(false).corner('full').zIndex('6'))",
    );
    expect(code).toContain("toElement(VStack().corner('15').zIndex('-1'))");
    expect(code).toContain(
      "toElement(VStack().corner('7').position({ top: 'none', right: 'none', bottom: 'none', left: 'none' }))",
    );
    expect(result.unconverted.map((u) => u.reasons[0]?.subject)).toEqual(['borderRadius']);
  });

  it('moves a hit slop per side, an accessibility value, a ref and a layout handler', () => {
    const result = run(`import { Pressable, View, Text } from 'react-native';
import { tokens } from '@oxy.so/bloom/styles';
export const A = ({ open, r, f }) => (
  <Pressable onPress={open} hitSlop={tokens.hitSlop.md} ref={r} onLayout={f}>
    <Text accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: 4 }}>a</Text>
  </Pressable>
);
export const B = ({ open }) => <Pressable onPress={open} hitSlop={{ top: 5, bottom: 5, left: 5, right: 0 }}><Text>b</Text></Pressable>;
export const C = ({ open }) => <Pressable onPress={open} hitSlop={{ top: 8, bottom: 8 }}><Text>c</Text></Pressable>;
export const D = ({ open }) => <Pressable onPress={open} hitSlop={10}><Text>d</Text></Pressable>;
`);
    const code = flat(result.code);
    expect(code).toContain(".onPress(open).hitSlop('md').ref(r).onLayout(f)");
    expect(code).toContain('.accessibilityValue({ min: 0, max: 100, now: 4 })');
    expect(code).toContain(
      "toElement(VStack(RawText('b')).onPress(open).hitSlop('vertical', '5').hitSlop('left', '5').hitSlop('right', 'none'))",
    );
    expect(code).toContain(
      "toElement(VStack(RawText('c')).onPress(open).hitSlop('vertical', 'md'))",
    );
    expect(result.unconverted.map((u) => u.reasons[0]?.code)).toEqual(['prop:hitSlop']);
  });

  it('draws a TouchableOpacity as a pressable stack whose press fades it, with its accessibility state and live region', () => {
    const result = run(`import { TouchableOpacity, Text } from 'react-native';
export const A = ({ open, on }) => (
  <TouchableOpacity className="flex-row p-4" onPress={open} activeOpacity={0.7} accessibilityState={{ selected: on }}>
    <Text accessibilityLiveRegion="polite">a</Text>
  </TouchableOpacity>
);
export const B = ({ open }) => <TouchableOpacity onPress={open}><Text>b</Text></TouchableOpacity>;
export const C = ({ open, o }) => <TouchableOpacity onPress={open} activeOpacity={o}><Text>c</Text></TouchableOpacity>;
`);
    expect(flat(result.code)).toContain(
      "toElement(HStack(RawText('a').liveRegion('polite')).padding('all', 'lg').onPress(open).accessibilityState({ selected: on }).pressFade('70'))",
    );
    expect(flat(result.code)).toContain(
      "toElement(VStack(RawText('b')).onPress(open).pressFade())",
    );
    expect(result.unconverted.map((u) => u.reasons[0]?.code)).toEqual(['prop:activeOpacity']);
  });
  it('moves auto margins, a gap per axis and a dashed border, from a class or a style', () => {
    const result = run(`import { View } from 'react-native';
export const A = () => <View className="flex-row flex-wrap gap-x-4 gap-y-1"><View className="ml-auto" /></View>;
export const B = () => <View style={{ marginLeft: 'auto', rowGap: 8 }} />;
export const C = () => <View className="border-dashed" />;
`);
    expect(flat(result.code)).toContain(
      "toElement(HStack(VStack().margin('left', 'auto')).wrap().horizontalSpacing('lg').verticalSpacing('xs'))",
    );
    expect(flat(result.code)).toContain(
      "toElement(VStack().margin('left', 'auto').verticalSpacing('sm'))",
    );
    expect(flat(result.code)).toContain("toElement(VStack().borderStyle('dashed'))");
  });
  it('follows React’s rule for JSX text', () => {
    expect(cleanJsxText('\n   Hello\n   world  \n')).toBe('Hello world');
    expect(cleanJsxText('  a  ')).toBe('  a  ');
  });
});
