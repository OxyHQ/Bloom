use crate::compile;

const IMPORTS: &str =
    "import { HStack, Icon, Image, Text, VStack, view, defineTokens, regular, Header, Menu, Item } from '@oxy.so/bloom-language';
import { RiMoreFill } from '@oxy.so/bloom/icons/RiMoreFill';
";

fn compiled(body: &str) -> crate::Output {
    compile(&format!("{IMPORTS}{body}"), "row.tsx")
}

#[test]
fn a_static_chain_inside_a_function_is_hoisted_to_module_scope() {
    let output =
        compiled("export function Hello() {\n  return HStack(Text('x').font('body')).padding('md');\n}\n");
    assert!(output.changed && output.diagnostics.is_empty());
    assert_eq!(output.hoisted, 1);
    let code = output.code;
    assert!(
        code.contains("const _bloomStatic0 = HStack(Text(\"x\").font(\"body\")).padding(\"md\");"),
        "{code}"
    );
    assert!(code.contains("return _bloomStatic0;"), "{code}");
    assert!(output.map.is_some());
}

#[test]
fn module_scope_chains_already_run_once_and_are_left_alone() {
    let output = compiled("export const Row = HStack(Text('x'));\n");
    assert!(!output.changed);
}

#[test]
fn a_dynamic_chain_keeps_its_runtime_parts_and_hoists_its_static_ones() {
    let output = compiled(
        "export function Row(label) {\n  return VStack(Text(label), Icon(RiMoreFill).size('md')).spacing('sm');\n}\n",
    );
    let code = output.code;
    assert!(code.contains("const _bloomStatic0 = Icon(RiMoreFill).size(\"md\");"), "{code}");
    assert!(code.contains("return VStack(Text(label), _bloomStatic0).spacing(\"sm\");"), "{code}");
}

#[test]
fn a_static_prefix_of_a_dynamic_chain_is_hoisted() {
    let code =
        compiled("export function Row(gap) {\n  return HStack(Text('a')).padding('md').spacing(gap);\n}\n")
            .code;
    assert!(code.contains("const _bloomStatic0 = HStack(Text(\"a\")).padding(\"md\");"), "{code}");
    assert!(code.contains("return _bloomStatic0.spacing(gap);"), "{code}");
}

#[test]
fn a_frozen_token_table_is_static_and_the_hoist_follows_its_declaration() {
    let source = "export function Menu() {\n  return Icon(RiMoreFill).size(row.iconSize.menu);\n}\nconst row = defineTokens({ iconSize: { menu: 18 } });\n";
    let code = compiled(source).code;
    let table = code.find("const row = defineTokens").unwrap();
    let hoist = code.find("const _bloomStatic0 = Icon(RiMoreFill).size(row.iconSize.menu);").expect(&code);
    assert!(hoist > table, "declared after the table it reads:\n{code}");
}

#[test]
fn a_local_that_shadows_an_import_is_not_the_import() {
    let code = compiled("export function Row(Text) {\n  return Text('x').font('body');\n}\n").code;
    assert!(!code.contains("_bloomStatic"), "{code}");
}

#[test]
fn a_mutable_or_later_value_is_never_hoisted() {
    // Only the static prefix moves; the modifier reading a `let` stays where it runs.
    let code =
        compiled("let size = 'md';\nexport function Row() {\n  return Text('x').font(size);\n}\n").code;
    assert!(
        code.contains("const _bloomStatic0 = Text(\"x\");")
            && code.contains("return _bloomStatic0.font(size);"),
        "{code}"
    );
    let code =
        compiled("const style = { a: 1 };\nexport function Row() {\n  return Text('x').label(style.a);\n}\n")
            .code;
    assert!(
        code.contains("return _bloomStatic0.label(style.a);"),
        "a plain object can change after module init:\n{code}"
    );
}

#[test]
fn view_bodies_opt_in_to_the_react_compiler() {
    let source = "export const Name = view((props) => Text(props.name).font('body'));
function PostRow(props) {
  return Text(props.title);
}
export const PostRowView = view(PostRow);
export function helper(text) {
  return Text(text);
}
";
    let code = compiled(source).code;
    assert!(
        code.contains("view((props) => {\n\t\"use memo\";\n\treturn Text(props.name).font(\"body\");\n})"),
        "{code}"
    );
    assert!(code.contains("function PostRow(props) {\n\t\"use memo\";"), "{code}");
    assert!(code.contains("function helper(text) {\n\treturn"), "not a view body:\n{code}");
}

#[test]
fn a_wrong_token_is_a_readable_error() {
    let output = compiled("export function Hello() {\n  return HStack(Text('x')).padding('mdd');\n}\n");
    assert!(!output.changed);
    let [diagnostic] = output.diagnostics.as_slice() else { panic!("one diagnostic") };
    assert_eq!((diagnostic.line, diagnostic.column), (4, 36));
    assert!(
        diagnostic
            .rendered
            .starts_with("error[bloom]: Unknown padding token 'mdd' for .padding()\n --> row.tsx:4:36"),
        "{}",
        diagnostic.rendered
    );
    assert!(diagnostic.rendered.contains("= help: did you mean 'md'?"), "{}", diagnostic.rendered);
}

#[test]
fn a_wrong_modifier_names_the_valid_ones() {
    let output = compiled("export const x = () => Text('x').fnt('body');\n");
    let diagnostic = &output.diagnostics[0];
    assert_eq!(diagnostic.message, "Text has no modifier .fnt()");
    assert!(diagnostic.help.as_deref().unwrap().starts_with("did you mean 'font'? Text modifiers: padding,"));
}

#[test]
fn image_options_are_checked_against_the_spec() {
    let valid = compiled(
        "export const x = (src) => Image(src).contentFit('contain').tint('primary').transition('fast');\n",
    );
    assert!(valid.diagnostics.is_empty());
    let fit = compiled("export const x = (src) => Image(src).contentFit('stretch');\n");
    assert_eq!(fit.diagnostics[0].message, "Unknown contentFit token 'stretch' for .contentFit()");
    let tint = compiled("export const x = (src) => Image(src).tint('neutral');\n");
    assert_eq!(tint.diagnostics[0].message, "Unknown color token 'neutral' for .tint()");
    let size = compiled("export const x = (src) => Image(src).size('lg');\n");
    assert_eq!(size.diagnostics[0].message, "Image has no modifier .size()");
}

#[test]
fn a_modifier_from_another_node_is_rejected() {
    let output = compiled("export const x = () => HStack().lines(2);\n");
    assert_eq!(output.diagnostics[0].message, "HStack has no modifier .lines()");
}

#[test]
fn per_node_scales_and_glass_are_checked() {
    let output = compiled("export const x = () => Icon(RiMoreFill).size('huge');\n");
    assert_eq!(output.diagnostics[0].message, "Unknown iconSize token 'huge' for .size()");
    let output = compiled("export const x = () => HStack().glass(regular.tint('primary', 'loud'));\n");
    assert_eq!(output.diagnostics[0].message, "Unknown glassOpacity token 'loud' for .tint()");
    let output = compiled("export const x = () => HStack().glass(regular.tint('primary', 'subtle'));\n");
    assert!(output.diagnostics.is_empty() && output.hoisted == 1);
}

#[test]
fn frame_keys_and_values_are_checked() {
    let output = compiled("export const x = () => HStack().frame({ hieght: 'md' });\n");
    assert_eq!(output.diagnostics[0].message, ".frame() has no 'hieght'");
    let output = compiled("export const x = () => HStack().frame({ height: 'mdd' });\n");
    assert_eq!(output.diagnostics[0].message, "Unknown length token 'mdd' for .frame()");
    let output = compiled("export const x = () => HStack().frame({ width: 'full', maxWidth: '1/2' });\n");
    assert!(output.diagnostics.is_empty());
}

#[test]
fn placement_keys_and_tokens_are_checked() {
    let output = compiled("export const x = () => HStack().position({ top: 'none', trailing: '-sm' });\n");
    assert!(output.diagnostics.is_empty());
    let output = compiled("export const x = () => HStack().position({ right: 'sm' });\n");
    assert_eq!(output.diagnostics[0].message, ".position() has no 'right'");
    let output = compiled("export const x = () => HStack().offset({ x: '2xs', y: 'big' });\n");
    assert_eq!(output.diagnostics[0].message, "Unknown padding token 'big' for .offset()");
    let output = compiled("export const x = () => HStack().zIndex(10);\n");
    assert!(output.diagnostics.is_empty(), "a number is the runtime's to reject");
    let output = compiled("export const x = () => HStack().zIndex('top');\n");
    assert_eq!(output.diagnostics[0].message, "Unknown zIndex token 'top' for .zIndex()");
    let output = compiled("export const x = () => HStack().justify('middle');\n");
    assert_eq!(output.diagnostics[0].message, "Unknown justify token 'middle' for .justify()");
    let output = compiled("export const x = () => Text('a').justify('center');\n");
    assert_eq!(output.diagnostics[0].message, "Text has no modifier .justify()");
}

#[test]
fn elevation_rings_and_overlays_are_checked() {
    let ok = compiled(
        "export const x = () => HStack().shadow('m').ring('primary', 'thick', '2xs').overlay(Text('x'), 'top-trailing').background(Text('y'), 'bottom');\n",
    );
    assert!(ok.diagnostics.is_empty());
    let output = compiled("export const x = () => HStack().shadow('lg');\n");
    assert_eq!(output.diagnostics[0].message, "Unknown shadow token 'lg' for .shadow()");
    let output = compiled("export const x = () => HStack().ring('none');\n");
    assert!(output.diagnostics.is_empty());
    let output = compiled("export const x = () => HStack().overlay(Text('x'), 'top-right');\n");
    assert_eq!(output.diagnostics[0].message, "Unknown overlayAlignment token 'top-right' for .overlay()");
}

#[test]
fn files_without_the_language_are_untouched() {
    let source = "import { View } from 'react-native';\nexport const x = 1;\n";
    let output = compile(source, "plain.ts");
    assert!(!output.changed);
    assert_eq!(output.code, source);
}

#[test]
fn the_platform_components_are_checked_against_the_spec() {
    let header = compiled("export const H = () => Header('Home').titleDisplay('huge');\n");
    assert_eq!(header.diagnostics[0].message, "Unknown titleDisplay token 'huge' for .titleDisplay()");
    // A menu row is not a view: it takes no box modifier.
    let row = compiled(
        "export const M = (copy) => Menu(Icon(RiMoreFill), Item('Copy').padding('md').onPress(copy));\n",
    );
    assert_eq!(row.diagnostics[0].message, "Item has no modifier .padding()");
    let fine = compiled(
        "export const M = (copy) => Menu(Icon(RiMoreFill), Item('Copy').icon(RiMoreFill).onPress(copy)).label('More');\n",
    );
    assert!(fine.diagnostics.is_empty(), "{:?}", fine.diagnostics.first().map(|d| &d.message));
}

#[test]
fn chains_nested_in_a_hoisted_chain_are_checked() {
    // The whole chain is static, so it is hoisted; the chain inside it is still checked.
    let modifier =
        compiled("export function Row() {\n  return HStack(Text('x').fnt('body')).padding('md');\n}\n");
    assert!(!modifier.changed);
    assert_eq!(modifier.diagnostics[0].message, "Text has no modifier .fnt()");
    // Only the static prefix is hoisted; the chain inside that prefix is still checked.
    let token = compiled(
        "export function Row(gap) {\n  return HStack(Text('x').font('bodyy')).padding('md').spacing(gap);\n}\n",
    );
    assert!(!token.changed);
    assert_eq!(token.diagnostics[0].message, "Unknown font token 'bodyy' for .font()");
}

#[test]
fn text_styles_truncation_and_links_are_checked() {
    let valid = compiled(
        "export const x = (href) => Text('x').textStyle('h2').lines(2).truncation('middle').selectable().link(href).textAlign('center').italic().underline().strikethrough().textCase('uppercase');\n",
    );
    assert!(valid.diagnostics.is_empty(), "{:?}", valid.diagnostics.first().map(|d| &d.message));
    let style = compiled("export const x = () => Text('x').textStyle('h7');\n");
    assert_eq!(style.diagnostics[0].message, "Unknown textStyle token 'h7' for .textStyle()");
    let cut = compiled("export const x = () => Text('x').truncation('end');\n");
    assert_eq!(cut.diagnostics[0].message, "Unknown truncation token 'end' for .truncation()");
    let align = compiled("export const x = () => Text('x').textAlign('left');\n");
    assert_eq!(align.diagnostics[0].message, "Unknown textAlign token 'left' for .textAlign()");
    // Text's own modifiers stay on text.
    let stack = compiled("export const x = () => VStack().italic();\n");
    assert_eq!(stack.diagnostics[0].message, "VStack has no modifier .italic()");
    let arity = compiled("export const x = () => Text('x').underline('double');\n");
    assert_eq!(arity.diagnostics[0].message, ".underline() takes 0 argument(s), not 1");
}

#[test]
fn material_avatar_and_small_piece_modifiers_are_checked() {
    let imports = "import { Avatar, AvatarGroup, Badge, Divider, Grid, Loading, VStack } from '@oxy.so/bloom-language';\n";
    let check = |body: &str| compile(&format!("{imports}{body}"), "row.tsx");
    let valid = check(
        "export const x = (src, items) => VStack(Divider().lineStyle('double').tint('border'), Grid().flow('columns').columns(3), Avatar(src).size('lg').tint('lime').shape('squircle').presence('busy').badge(Badge(3).style('onMedia').size('label-small').placement('bottom-left')), AvatarGroup(items).layout('cluster').shape('heart'), Loading().style('inline').size('sm').tint('accent')).corner('concentric').cornerCurve('smooth');\n",
    );
    assert!(valid.diagnostics.is_empty(), "{:?}", valid.diagnostics.first().map(|d| &d.message));
    let cases = [
        ("Divider().lineStyle('dashed')", "Unknown dividerStyle token 'dashed' for .lineStyle()"),
        ("VStack().corner('concentrik')", "Unknown corner token 'concentrik' for .corner()"),
        ("VStack().cornerCurve('squircle')", "Unknown cornerCurve token 'squircle' for .cornerCurve()"),
        ("Avatar(null).tint('primary')", "Unknown avatarColor token 'primary' for .tint()"),
        ("Avatar(null).shape('pill-ish')", "Unknown shapeName token 'pill-ish' for .shape()"),
        ("Avatar(null).presence('away')", "Unknown presence token 'away' for .presence()"),
        ("Badge(1).style('outline')", "Unknown badgeStyle token 'outline' for .style()"),
        ("Badge(1).size('label-large')", "Unknown badgeSize token 'label-large' for .size()"),
        ("Loading().style('bar')", "Unknown loadingStyle token 'bar' for .style()"),
        ("Grid().flow('masonry')", "Unknown gridFlow token 'masonry' for .flow()"),
    ];
    for (chain, message) in cases {
        let output = check(&format!("export const x = () => {chain};\n"));
        assert_eq!(output.diagnostics[0].message, message, "{chain}");
    }
}

#[test]
fn a_colour_at_a_named_opacity_checks_both_halves() {
    let valid = compiled(
        "export const x = () => HStack().background('primary/10').border('border/60').foreground('muted/70').blur();\n",
    );
    assert!(valid.diagnostics.is_empty() && valid.hoisted == 1);
    let opacity = compiled("export const x = () => HStack().foreground('muted/65');\n");
    assert_eq!(opacity.diagnostics[0].message, "Unknown opacity token '65' for .foreground()");
    let role = compiled("export const x = () => HStack().background('grey/faint');\n");
    assert_eq!(role.diagnostics[0].message, "Unknown color token 'grey/faint' for .background()");
}

#[test]
fn tracking_and_the_mono_face_are_checked() {
    let valid =
        compiled("export const x = () => Text('x').font('mono').font('caption-1').tracking('wider');\n");
    assert!(valid.diagnostics.is_empty() && valid.hoisted == 1);
    let tracking = compiled("export const x = () => Text('x').tracking('loose');\n");
    assert_eq!(tracking.diagnostics[0].message, "Unknown tracking token 'loose' for .tracking()");
    let font = compiled("export const x = () => Text('x').font('serif');\n");
    assert_eq!(font.diagnostics[0].message, "Unknown font token 'serif' for .font()");
}

#[test]
fn a_variant_is_checked_against_what_a_variant_changes() {
    let ok = compiled(
        "export const x = () => HStack().padding('sm').when('md', (v) => v.padding('lg').justify('center')).when('dark', v => { return v.background('surface'); });\n",
    );
    assert!(ok.diagnostics.is_empty(), "{:?}", ok.diagnostics.iter().map(|d| &d.message).collect::<Vec<_>>());
    let output = compiled("export const x = () => HStack().when('tablet', (v) => v.padding('lg'));\n");
    assert_eq!(output.diagnostics[0].message, "Unknown condition token 'tablet' for .when()");
    let output = compiled("export const x = () => HStack().when('md', (v) => v.padding('huge'));\n");
    assert_eq!(output.diagnostics[0].message, "Unknown padding token 'huge' for .padding()");
    let output = compiled("export const x = () => HStack().when('hovered', (v) => v.onPress(go));\n");
    assert_eq!(output.diagnostics[0].message, "A variant cannot change .onPress()");
    let output = compiled("export const x = () => Text('a').when('md', (v) => v.justify('center'));\n");
    assert_eq!(output.diagnostics[0].message, "A variant cannot change .justify()");
}
