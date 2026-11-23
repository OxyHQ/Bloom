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
fn an_app_colour_is_a_static_token_where_a_role_goes() {
    let source = "const brand = defineTokens({ color: { blue: '#1877f2' } });\nexport function Row() {\n  return HStack(Text('a')).background(brand.color.blue).foreground(brand.color.blue);\n}\n";
    let output = compiled(source);
    assert!(output.diagnostics.is_empty(), "{:?}", output.diagnostics.first().map(|d| &d.message));
    assert!(
        output.code.contains(
            "const _bloomStatic0 = HStack(Text(\"a\")).background(brand.color.blue).foreground(brand.color.blue);"
        ),
        "{}",
        output.code
    );
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
        "export const x = (src) => Image(src).contentFit('contain').tint('primary').crossFade('fast');\n",
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
    // A physical side is a placement key too (`right-0`, as NativeWind writes it).
    let output = compiled("export const x = () => HStack().position({ right: 'sm', left: 'none' });\n");
    assert!(output.diagnostics.is_empty(), "{:?}", output.diagnostics);
    let output = compiled("export const x = () => HStack().position({ rihgt: 'sm' });\n");
    assert_eq!(output.diagnostics[0].message, ".position() has no 'rihgt'");
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
    // Hit testing is a boolean, or what alone takes touches: the content or the view.
    let output = compiled(
        "export const x = () => HStack().allowsHitTesting(false).when('md', (v) => v.allowsHitTesting('children'));\n",
    );
    assert!(output.diagnostics.is_empty(), "{:?}", output.diagnostics);
    let output = compiled("export const x = () => HStack().allowsHitTesting('box-none');\n");
    assert_eq!(output.diagnostics[0].message, "Unknown hitTesting token 'box-none' for .allowsHitTesting()");
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
fn the_small_modifiers_and_numeric_tokens_are_checked() {
    let ok = compiled(
        "export const x = () => VStack(Text('1').monospacedDigit().wordBreak('all')).corner('3xl', 'top').corner('sm', 'bottom-trailing').basis('none').scale('105').allowsHitTesting(false).accessibilityOnly().zIndex('50').shadow('0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)').ring('primary', '3').frame({ width: 'fit' }).listMarker('disc');\n",
    );
    assert!(ok.diagnostics.is_empty(), "{:?}", ok.diagnostics);
    // A physical corner is a corner side too (`rounded-tl-lg`).
    let output = compiled("export const x = () => HStack().corner('lg', 'top-left');\n");
    assert!(output.diagnostics.is_empty(), "{:?}", output.diagnostics);
    let output = compiled("export const x = () => HStack().corner('lg', 'top-lft');\n");
    assert_eq!(output.diagnostics[0].message, "Unknown cornerSide token 'top-lft' for .corner()");
    let output = compiled("export const x = () => HStack().scale('1.05');\n");
    assert_eq!(output.diagnostics[0].message, "Unknown scale token '1.05' for .scale()");
    let output = compiled("export const x = () => HStack().shadow('0 1px 3px 0 rgb(0 0 0 / 0.2)');\n");
    assert_eq!(
        output.diagnostics[0].message,
        "Unknown shadow token '0 1px 3px 0 rgb(0 0 0 / 0.2)' for .shadow()"
    );
    // The leftovers apps write in two or more places are numeric tokens; a level no app uses is not.
    let ok = compiled(
        "export const x = () => HStack().zIndex('60').border('border', '4').opacity('45').rotation('45');\n",
    );
    assert!(ok.diagnostics.is_empty(), "{:?}", ok.diagnostics);
    let output = compiled("export const x = () => HStack().zIndex('61');\n");
    assert_eq!(output.diagnostics[0].message, "Unknown zIndex token '61' for .zIndex()");
    let output = compiled("export const x = () => HStack().monospacedDigit();\n");
    assert_eq!(output.diagnostics[0].message, "HStack has no modifier .monospacedDigit()");
    let output = compiled("export const x = () => Text('a').wordBreak('anywhere');\n");
    assert_eq!(output.diagnostics[0].message, "Unknown wordBreak token 'anywhere' for .wordBreak()");
    let output = compiled("export const x = () => Text('a').listMarker('disc');\n");
    assert_eq!(output.diagnostics[0].message, "Text has no modifier .listMarker()");
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
    // A physical alignment is a text alignment too (`text-left`, as NativeWind writes it).
    let align = compiled("export const x = () => Text('x').textAlign('left');\n");
    assert!(align.diagnostics.is_empty(), "{:?}", align.diagnostics);
    let align = compiled("export const x = () => Text('x').textAlign('middle');\n");
    assert_eq!(align.diagnostics[0].message, "Unknown textAlign token 'middle' for .textAlign()");
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
fn a_content_view_takes_the_layout_of_one_view() {
    let ok = chrome(
        "export const x = () => ScrollView(Text('a')).contentView((v) => v.padding('horizontal', 'lg').spacing('md').flex('1').align('center'));\n",
    );
    assert!(ok.diagnostics.is_empty(), "{:?}", ok.diagnostics.iter().map(|d| &d.message).collect::<Vec<_>>());
    let output =
        chrome("export const x = () => ScrollView(Text('a')).contentView((v) => v.padding('huge'));\n");
    assert_eq!(output.diagnostics[0].message, "Unknown padding token 'huge' for .padding()");
    let output =
        chrome("export const x = () => ScrollView(Text('a')).contentView((v) => v.background('surface'));\n");
    assert_eq!(output.diagnostics[0].message, "A content view cannot take .background()");
    let output = chrome(
        "export const x = () => ScrollView(Text('a')).contentView((v) => v.when('md', (w) => w.padding('lg')));\n",
    );
    assert_eq!(output.diagnostics[0].message, "A content view cannot take .when()");
    let output = chrome("export const x = () => Sidebar(Text('a')).contentView((v) => v.padding('lg'));\n");
    assert!(!output.diagnostics.is_empty());
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
    // The app's own boolean is a condition too: its variant is checked the same.
    let output = compiled(
        "export const x = (active) => HStack().padding('sm').when(active, (v) => v.padding('lg').background('primary')).when(!active && wide, (v) => v.opacity('half'));\n",
    );
    assert!(output.diagnostics.is_empty(), "{:?}", output.diagnostics);
    let output = compiled("export const x = (active) => HStack().when(active, (v) => v.padding('huge'));\n");
    assert_eq!(output.diagnostics[0].message, "Unknown padding token 'huge' for .padding()");
    // A variant inside a variant is checked as one.
    let output = compiled(
        "export const x = () => HStack().when('md', (v) => v.when('hovered', (h) => h.padding('lg')));\n",
    );
    assert!(output.diagnostics.is_empty(), "{:?}", output.diagnostics);
    let output = compiled(
        "export const x = () => HStack().when('md', (v) => v.when('hover', (h) => h.padding('lg')));\n",
    );
    assert_eq!(output.diagnostics[0].message, "Unknown condition token 'hover' for .when()");
    let output = compiled(
        "export const x = () => HStack().when('md', (v) => v.when('dark', (d) => d.onPress(go)));\n",
    );
    assert_eq!(output.diagnostics[0].message, "A variant cannot change .onPress()");
}

#[test]
fn the_button_leftovers_are_checked() {
    let check = |body: &str| {
        compile(&format!("import {{ Button, Text }} from '@oxy.so/bloom-language';\n{body}"), "row.tsx")
    };
    let ok = check(
        "export const x = () => Button(Text('a')).colors('primary', 'onPrimary/70').linkTone('text').inverted().density('compact').shape('fit');\n",
    );
    assert!(ok.diagnostics.is_empty());
    let output = check("export const x = () => Button(Text('a')).linkTone('accent');\n");
    assert_eq!(output.diagnostics[0].message, "Unknown linkTone token 'accent' for .linkTone()");
    let output = check("export const x = () => Button(Text('a')).colors('#1877f2', 'white');\n");
    assert_eq!(output.diagnostics[0].message, "Unknown color token '#1877f2' for .colors()");
    // A button's densities are Bloom's control densities, not a row's content ones.
    let output = check("export const x = () => Button(Text('a')).density('comfortable');\n");
    assert_eq!(output.diagnostics[0].message, "Unknown density token 'comfortable' for .density()");
    assert_eq!(output.diagnostics[0].help.as_deref(), Some("density tokens: default, compact"));
}

#[test]
fn a_shape_is_checked() {
    let check = |body: &str| {
        compile(&format!("import {{ Shape }} from '@oxy.so/bloom-language';\n{body}"), "row.tsx")
    };
    let ok = check(
        "export const x = () => Shape('heart').size('4xl').stroke('primary', 'thick').fill('muted/70');\n",
    );
    assert!(ok.diagnostics.is_empty());
    let output = check("export const x = () => Shape('heart').size('huge');\n");
    assert_eq!(output.diagnostics[0].message, "Unknown space token 'huge' for .size()");
    let output = check("export const x = () => Shape('heart').tint('primary');\n");
    assert_eq!(output.diagnostics[0].message, "Shape has no modifier .tint()");
}

#[test]
fn a_zstack_takes_an_alignment_and_only_a_zstack_does() {
    let check = |body: &str| {
        compile(&format!("import {{ HStack, Text, ZStack }} from '@oxy.so/bloom-language';\n{body}"), "z.tsx")
    };
    let ok = check(
        "export const x = () => ZStack(Text('a'), Text('b')).alignment('top-leading').padding('md');\n",
    );
    assert!(ok.diagnostics.is_empty(), "{:?}", ok.diagnostics.first().map(|d| &d.message));
    let output = check("export const x = () => ZStack(Text('a')).alignment('top-left');\n");
    assert_eq!(output.diagnostics[0].message, "Unknown overlayAlignment token 'top-left' for .alignment()");
    let output = check("export const x = () => HStack(Text('a')).alignment('top');\n");
    assert_eq!(output.diagnostics[0].message, "HStack has no modifier .alignment()");
    // A ZStack has no axis to space or justify along.
    let output = check("export const x = () => ZStack(Text('a')).spacing('md');\n");
    assert_eq!(output.diagnostics[0].message, "ZStack has no modifier .spacing()");
}

const MOTION_IMPORTS: &str = "import { HStack, Text, VStack, opacity, move, asymmetric, defineKeyframes, regular } from '@oxy.so/bloom-language';
";

fn motion(body: &str) -> crate::Output {
    compile(&format!("{MOTION_IMPORTS}{body}"), "motion.tsx")
}

#[test]
fn a_static_transition_is_a_static_value_and_its_chain_hoists() {
    let output = motion(
        "export function Toast(id) {\n  return Text('Saved').transition(asymmetric(move('top', 'xl').combined(opacity), opacity)).id(id);\n}\n",
    );
    assert!(output.diagnostics.is_empty());
    let code = output.code;
    assert!(
        code.contains(
            "const _bloomStatic0 = Text(\"Saved\").transition(asymmetric(move(\"top\", \"xl\").combined(opacity), opacity));"
        ),
        "{code}"
    );
    assert!(code.contains("return _bloomStatic0.id(id);"), "{code}");
}

#[test]
fn module_constants_holding_motion_values_are_static() {
    let source = "const pop = defineKeyframes([{ at: 0, scale: 1 }, { at: 1, scale: 1.2 }], 'pop');\nexport function Glyph(on) {\n  return Text('x').keyframes(pop, on);\n}\n";
    let code = motion(source).code;
    assert!(code.contains("const _bloomStatic0 = Text(\"x\");"), "{code}");
    assert!(
        code.contains("return _bloomStatic0.keyframes(pop, on);"),
        "the trigger is a runtime value:\n{code}"
    );
}

#[test]
fn motion_tokens_and_offsets_are_checked() {
    let output = motion("export const x = () => Text('x').animation('slid');\n");
    assert_eq!(output.diagnostics[0].message, "Unknown motion token 'slid' for .animation()");
    assert!(output.diagnostics[0].help.as_deref().unwrap().starts_with("did you mean 'slide'?"));
    let output = motion("export const x = () => Text('x').offset({ z: 'md' });\n");
    assert_eq!(output.diagnostics[0].message, ".offset() has no 'z'");
    let output = motion("export const x = () => Text('x').offset({ y: '-mdd' });\n");
    assert_eq!(output.diagnostics[0].message, "Unknown padding token '-mdd' for .offset()");
    let output = motion("export const x = () => Text('x').scale('tiny');\n");
    assert_eq!(output.diagnostics[0].message, "Unknown scale token 'tiny' for .scale()");
    let output =
        motion("export const x = (n) => Text(n).contentTransition('numeric', n).animation('roll', n);\n");
    assert!(output.diagnostics.is_empty());
    let output = motion("export const x = () => Text('x').contentTransition('flip');\n");
    assert_eq!(
        output.diagnostics[0].message,
        "Unknown contentTransition token 'flip' for .contentTransition()"
    );
}

#[test]
fn a_transition_is_a_value_not_a_name() {
    let output = motion("export const x = () => Text('x').transition('opacity');\n");
    assert_eq!(output.diagnostics[0].message, ".transition() takes a transition value, not 'opacity'");
}

#[test]
fn fading_a_view_that_holds_glass_is_an_error() {
    let output =
        motion("export const x = (id) => VStack(Text('t').glass(regular)).transition(opacity).id(id);\n");
    assert_eq!(output.diagnostics[0].message, ".transition() fades a view that holds glass");
    let output = motion(
        "export const x = () => VStack(HStack(Text('t').glass())).keyframes(defineKeyframes([{ at: 0, opacity: 0 }, { at: 1, opacity: 1 }]), 1);\n",
    );
    assert_eq!(output.diagnostics[0].message, ".keyframes() fades a view that holds glass");
    let output = motion("export const x = () => VStack(Text('t').glass()).opacity('half');\n");
    assert_eq!(output.diagnostics[0].message, ".opacity() fades a view that holds glass");
    // On the glass view itself the renderer routes the fade through the material.
    let output =
        motion("export const x = (id) => VStack(Text('t')).glass(regular).transition(opacity).id(id);\n");
    assert!(output.diagnostics.is_empty());
    // A move is not a fade.
    let output =
        motion("export const x = (id) => VStack(Text('t').glass()).transition(move('top', 'xl')).id(id);\n");
    assert!(output.diagnostics.is_empty());
}

const GESTURE_IMPORTS: &str =
    "import { Text, VStack, useMappedValue, useMotionValue } from '@oxy.so/bloom-language';
";

fn gesture(body: &str) -> crate::Output {
    compile(&format!("{GESTURE_IMPORTS}{body}"), "gesture.tsx")
}

#[test]
fn geometry_follows_a_motion_value_and_gestures_take_one() {
    let output = gesture(
        "export function Sheet() {\n  const y = useMotionValue(0);\n  const r = useMotionValue(0);\n  return VStack(Text('t')).offset({ x: 'md', y }).rotation(r).scale(y).drag(y, { axis: 'y', min: 0 }).swipe('down', () => {});\n}\n",
    );
    assert!(output.diagnostics.is_empty(), "{:?}", output.diagnostics.first().map(|d| &d.message));
}

#[test]
fn a_pinch_moves_a_motion_value_and_two_taps_take_an_action() {
    let output = gesture(
        "export function Photo(open) {\n  const s = useMotionValue(1);\n  return VStack(Text('t')).scale(s).pinch(s, { min: 1, max: 4 }).onDoubleTap(open);\n}\n",
    );
    assert!(output.diagnostics.is_empty(), "{:?}", output.diagnostics.first().map(|d| &d.message));
    let output = gesture("export const x = () => VStack(Text('t')).pinch(2);\n");
    assert_eq!(output.diagnostics[0].message, ".pinch() takes a MotionValue");
    let output = gesture("export const x = (f) => VStack(Text('t')).onDoubleTap(f, 2);\n");
    assert_eq!(output.diagnostics[0].message, ".onDoubleTap() takes 1 argument(s), not 2");
}

#[test]
fn a_mapped_value_is_followed_and_never_driven() {
    let output = gesture(
        "export function Sheet() {\n  const y = useMotionValue(0);\n  const s = useMappedValue(y, [0, 300], [1, 0.9]);\n  return VStack(Text('t')).offset({ y }).scale(s).drag(y);\n}\n",
    );
    assert!(output.diagnostics.is_empty(), "{:?}", output.diagnostics.first().map(|d| &d.message));
    let output = gesture(
        "export function Sheet() {\n  const y = useMotionValue(0);\n  const s = useMappedValue(y, [0, 300], [1, 0.9]);\n  return VStack(Text('t')).scale(s).drag(s);\n}\n",
    );
    assert_eq!(
        output.diagnostics[0].message,
        ".drag() moves a MotionValue; a mapped one only follows another"
    );
    let output = gesture(
        "export function Sheet() {\n  const y = useMotionValue(0);\n  const s = useMappedValue(y, [0, 300], [1, 0.9]);\n  return Text('t').padding(s);\n}\n",
    );
    assert_eq!(output.diagnostics[0].message, ".padding() takes padding tokens, not a MotionValue");
}

#[test]
fn a_motion_value_where_a_token_goes_is_an_error() {
    let output = gesture(
        "export function Row() {\n  const y = useMotionValue(0);\n  return Text('t').padding(y);\n}\n",
    );
    assert_eq!(output.diagnostics[0].message, ".padding() takes padding tokens, not a MotionValue");
    let output = gesture(
        "export function Row() {\n  const y = useMotionValue(0);\n  return Text('t').opacity(y);\n}\n",
    );
    assert_eq!(output.diagnostics[0].message, ".opacity() takes opacity tokens, not a MotionValue");
}

#[test]
fn geometry_varies_by_token_never_by_a_motion_value() {
    let output = gesture(
        "export const x = () => Text('t').when('pressed', (v) => v.scale('95').offset({ y: '-xs' }).rotation('45'));\n",
    );
    assert!(output.diagnostics.is_empty(), "{:?}", output.diagnostics.first().map(|d| &d.message));
    let output = gesture("export const x = () => Text('t').when('hovered', (v) => v.scale('104'));\n");
    assert_eq!(output.diagnostics[0].message, "Unknown scale token '104' for .scale()");
    let output = gesture(
        "export function Row() {\n  const y = useMotionValue(0);\n  return Text('t').when('pressed', (v) => v.offset({ y }));\n}\n",
    );
    assert_eq!(output.diagnostics[0].message, ".offset() inside when() takes tokens, not a MotionValue");
    let output = gesture(
        "export function Row() {\n  const s = useMotionValue(1);\n  return Text('t').when('md', (v) => v.scale(s));\n}\n",
    );
    assert_eq!(output.diagnostics[0].message, ".scale() inside when() takes tokens, not a MotionValue");
}

#[test]
fn colours_animate_only_by_name() {
    let output =
        motion("export const x = () => Text('t').foreground('accent').animation('fade').animatesColors();\n");
    assert!(output.diagnostics.is_empty(), "{:?}", output.diagnostics.first().map(|d| &d.message));
    // One way to say it: the modifier takes nothing, and .animation() takes no colour switch.
    let output = motion("export const x = () => Text('t').animation('fade').animatesColors(true);\n");
    assert_eq!(output.diagnostics[0].message, ".animatesColors() takes 0 argument(s), not 1");
    let output = motion("export const x = () => Text('t').animation('fade', 1, true);\n");
    assert_eq!(output.diagnostics[0].message, ".animation() takes 1 to 2 argument(s), not 3");
    // It is the view's own, never a variant's.
    let output = motion("export const x = () => Text('t').when('hovered', (v) => v.animatesColors());\n");
    assert_eq!(output.diagnostics[0].message, "A variant cannot change .animatesColors()");
}

#[test]
fn loops_delays_and_anchors_are_tokens() {
    let output = motion(
        "export const x = () => Text('t').repeatForever('spin').delay('fast').anchor('top-leading');\n",
    );
    assert!(output.diagnostics.is_empty(), "{:?}", output.diagnostics.first().map(|d| &d.message));
    let output = motion("export const x = () => Text('t').delay('slow').repeatForever('pulse');\n");
    assert!(output.diagnostics.is_empty(), "{:?}", output.diagnostics.first().map(|d| &d.message));
    // A delay is one of Bloom's durations: no app writes Tailwind's others (delay-75, delay-700…).
    let output = motion("export const x = () => Text('t').delay('700');\n");
    assert_eq!(output.diagnostics[0].message, "Unknown duration token '700' for .delay()");
    let output = motion("export const x = () => Text('t').repeatForever('spinn');\n");
    assert_eq!(output.diagnostics[0].message, "Unknown loop token 'spinn' for .repeatForever()");
    assert!(output.diagnostics[0].help.as_deref().unwrap().starts_with("did you mean 'spin'?"));
    let output = motion("export const x = () => Text('t').delay('150');\n");
    assert_eq!(output.diagnostics[0].message, "Unknown duration token '150' for .delay()");
    let output = motion("export const x = () => Text('t').anchor('top-left');\n");
    assert_eq!(output.diagnostics[0].message, "Unknown anchor token 'top-left' for .anchor()");
    // Keyframes of the app's own loop too; a pulse above glass fades it.
    let output = motion(
        "const wobble = defineKeyframes([{ at: 0, rotate: 0 }, { at: 1, rotate: 45 }], 'spin');\nexport const x = () => Text('t').repeatForever(wobble);\n",
    );
    assert!(output.diagnostics.is_empty(), "{:?}", output.diagnostics.first().map(|d| &d.message));
    let output = motion("export const x = () => VStack(Text('t').glass()).repeatForever('pulse');\n");
    assert_eq!(output.diagnostics[0].message, ".repeatForever() fades a view that holds glass");
    let output = motion("export const x = () => VStack(Text('t').glass()).repeatForever('spin');\n");
    assert!(output.diagnostics.is_empty());
}

#[test]
fn a_drag_takes_a_motion_value_and_a_swipe_a_direction() {
    let output = gesture("export const x = () => Text('t').drag(0);\n");
    assert_eq!(output.diagnostics[0].message, ".drag() takes a MotionValue");
    let output = gesture("export const x = () => Text('t').swipe('sideways', () => {});\n");
    assert_eq!(output.diagnostics[0].message, "Unknown swipeDirection token 'sideways' for .swipe()");
}

#[test]
fn wave_two_controls_are_checked() {
    let imports = "import { Chip, ChipRow, Dialog, GroupedSectionIcon, Option, Popover, RadioGroup, Row, SelectionCard, TextField, VStack } from '@oxy.so/bloom-language';\n";
    let check = |body: &str| compile(&format!("{imports}{body}"), "row.tsx");
    let valid = check(
        "export const x = (text, open, on) => VStack(TextField(text, 'Name').trailingIcon(I).completion('so').focused(on), RadioGroup(on, Option('a', 'A').tint('success').foreground('white')).style('swatch'), ChipRow(Chip().style('inverted').role('radio')).role('radiogroup').spacing('xs').contentInset('lg').ringInset('2xs').keyboardTaps('always'), Row('Ana').density('compact'), GroupedSectionIcon(I).tint('vivid'), SelectionCard('Pro').indicator('check').density('compact')).dialog(open, Dialog().presentAt('bottom', { lg: 'end' }).frame({ width: '560', maxWidth: '720' }).padding('none').sideGutter('none').maxHeightRatio(0.9)).popover(open, Popover().sideOffset('xs').alignOffset('-sm'));\n",
    );
    assert!(valid.diagnostics.is_empty(), "{:?}", valid.diagnostics.first().map(|d| &d.message));
    let cases = [
        ("RadioGroup(on).style('grid')", "Unknown radioStyle token 'grid' for .style()"),
        ("Option('a', 'A').tint('lime')", "Unknown color token 'lime' for .tint()"),
        ("Chip().style('ghost')", "Unknown chipStyle token 'ghost' for .style()"),
        ("Chip().role('switch')", "Unknown role token 'switch' for .role()"),
        ("GroupedSectionIcon(I).tint('lime')", "Unknown accentTone token 'lime' for .tint()"),
        ("SelectionCard('Pro').indicator('dot')", "Unknown selectionIndicator token 'dot' for .indicator()"),
        ("Row('Ana').density('cozy')", "Unknown density token 'cozy' for .density()"),
        // A row's densities are Bloom's content densities, not a button's control ones.
        ("Row('Ana').density('default')", "Unknown density token 'default' for .density()"),
        (
            "Dialog().presentAt('bottom', { lg: 'top' })",
            "Unknown dialogPlacement token 'top' for .presentAt()",
        ),
        ("Popover().sideOffset('huge')", "Unknown space token 'huge' for .sideOffset()"),
        ("ChipRow().keyboardTaps('sometimes')", "Unknown keyboardTaps token 'sometimes' for .keyboardTaps()"),
        ("Dialog().sideGutter('wide')", "Unknown space token 'wide' for .sideGutter()"),
        ("Dialog().frame({ maxWidth: '561' })", "Unknown length token '561' for .frame()"),
    ];
    for (chain, message) in cases {
        let output = check(&format!("export const x = (on) => {chain};\n"));
        assert_eq!(output.diagnostics.first().map(|d| d.message.as_str()), Some(message), "{chain}");
    }
}

#[test]
fn a_presented_dialog_is_checked_against_the_spec() {
    let imports = "import { Dialog, Text } from '@oxy.so/bloom-language';\n";
    let check = |body: &str| compile(&format!("{imports}{body}"), "dialog.tsx");
    let fine = check(
        "export const D = (open, close) => Dialog(Text('a')).title('Edit').label('Edit').frame({ maxWidth: '400' }).padding('none').presentAt('bottom', { md: 'center' }).presented([open, close]);\n",
    );
    assert!(fine.diagnostics.is_empty(), "{:?}", first_message(&fine));
    let bare = check("export const D = () => Dialog(Text('a')).presented();\n");
    assert_eq!(first_message(&bare), Some(".presented() takes 1 argument(s), not 0"));
    // A dialog's modifiers are its own: a box modifier of a view is none of them.
    let box_ = check("export const D = (b) => Dialog(Text('a')).background('card').presented(b);\n");
    assert_eq!(first_message(&box_), Some("Dialog has no modifier .background()"));
}

#[test]
fn a_group_takes_the_screen_s_chrome_and_no_box() {
    let imports = "import { Group, Text } from '@oxy.so/bloom-language';\n";
    let check = |body: &str| compile(&format!("{imports}{body}"), "group.tsx");
    let fine = check(
        "export const G = (reply) => Group(Text('a'), Text('b')).title('Home').header(false).footer(reply, { placement: 'overlay' }).screenScroll('content').testID('home').id('g');\n",
    );
    assert!(fine.diagnostics.is_empty(), "{:?}", first_message(&fine));
    // A group draws no view of its own, so nothing boxes it.
    let padded = check("export const G = () => Group(Text('a')).padding('lg');\n");
    assert_eq!(first_message(&padded), Some("Group has no modifier .padding()"));
    let scroll = check("export const G = () => Group(Text('a')).screenScroll('page');\n");
    assert_eq!(first_message(&scroll), Some("Unknown screenScroll token 'page' for .screenScroll()"));
}

/// The app chrome's constructors, imported as a screen file imports them.
const CHROME: &str = "import { SettingsSection, SettingsValue, SettingsSelect, SettingsTextField, SettingsDateField, SidebarMode, AutoHideBar, ResizeHandle, ScrollArea, ScrollSurface, StickySection, Toolbar, AppLayout, Destination, Panel, Stack, BottomSheet, Command, CommandGroup, CommandItem, NavItem, SettingsGroup, SettingsItem, SettingsModal, PageFooter, Rail, RailItem, ScrollView, Sidebar, Text, TreeFolder, TreeItem, TreeSection } from '@oxy.so/bloom-language';\n";

fn chrome(body: &str) -> crate::Output {
    compile(&format!("{CHROME}{body}"), "chrome.tsx")
}

fn first_message(output: &crate::Output) -> Option<&str> {
    output.diagnostics.first().map(|d| d.message.as_str())
}

#[test]
fn a_refresh_tint_is_one_colour_or_each_platform_s() {
    for tint in
        ["'primary'", "'muted/70'", "{ ios: 'primary' }", "{ ios: 'primary', android: 'muted' }", "color"]
    {
        let fine = chrome(&format!(
            "export const S = (r, color) => ScrollView(Text('a')).refreshable(r, {tint});\n"
        ));
        assert!(fine.diagnostics.is_empty(), "{tint}: {:?}", first_message(&fine));
    }
    let token = chrome("export const S = (r) => ScrollView(Text('a')).refreshable(r, 'blue');\n");
    assert_eq!(first_message(&token), Some("Unknown color token 'blue' for .refreshable()"));
    let value = chrome("export const S = (r) => ScrollView(Text('a')).refreshable(r, { ios: 'blue' });\n");
    assert_eq!(first_message(&value), Some("Unknown color token 'blue' for .refreshable()"));
    let key = chrome("export const S = (r) => ScrollView(Text('a')).refreshable(r, { web: 'primary' });\n");
    assert_eq!(first_message(&key), Some(".refreshable() has no 'web'"));
}

#[test]
fn the_screen_and_its_scroll_view_are_checked_against_the_spec() {
    let fine = chrome(
        "export const S = (more, refresh) => ScrollView(Text('a')).contentMargins('horizontal', 'lg').contentMargins('md').spacing('md').keyboardTaps('handled').scrollDismissesKeyboard('interactively').scrollIndicators('hidden').onEndReached(more, 3).refreshable([false, refresh]).padding('sm').title('Feed').scrollEdge('always').screenKind('collection').screenScroll('content').documentScroll().headerPlacement('overlay').contentClearance('2xl').navigationScope('isolated');\n",
    );
    assert!(fine.diagnostics.is_empty(), "{:?}", first_message(&fine));
    let indicators = chrome("export const S = () => ScrollView(Text('a')).scrollIndicators('never');\n");
    assert_eq!(
        first_message(&indicators),
        Some("Unknown scrollIndicators token 'never' for .scrollIndicators()")
    );
    let scroll = chrome("export const S = () => Text('a').screenScroll('page');\n");
    assert_eq!(first_message(&scroll), Some("Unknown screenScroll token 'page' for .screenScroll()"));
    let margin = chrome("export const S = () => ScrollView(Text('a')).contentMargins('sideways', 'md');\n");
    assert_eq!(first_message(&margin), Some("Unknown edge token 'sideways' for .contentMargins()"));
    // A scroll view's own modifiers stay on it.
    let stack = chrome("export const S = () => Text('a').keyboardTaps('handled');\n");
    assert_eq!(first_message(&stack), Some("Text has no modifier .keyboardTaps()"));
    // Pull to refresh is one binding and an optional tint, a colour token.
    let tinted = chrome("export const S = (r) => ScrollView(Text('a')).refreshable(r, 'primary');\n");
    assert!(tinted.diagnostics.is_empty(), "{:?}", first_message(&tinted));
    let tint = chrome("export const S = (r) => ScrollView(Text('a')).refreshable(r, 'red');\n");
    assert_eq!(first_message(&tint), Some("Unknown color token 'red' for .refreshable()"));
    let three = chrome("export const S = (r) => ScrollView(Text('a')).refreshable(false, r, 'primary');\n");
    assert_eq!(first_message(&three), Some(".refreshable() takes 1 to 2 argument(s), not 3"));
    // Scroll indicators on one axis.
    let axis =
        chrome("export const S = () => ScrollView(Text('a')).scrollIndicators('hidden', 'sideways');\n");
    assert_eq!(first_message(&axis), Some("Unknown axis token 'sideways' for .scrollIndicators()"));
}

#[test]
fn a_nodes_other_editable_values_are_binding_modifiers() {
    let check = |body: &str| {
        compile(
            &format!(
                "import {{ AvailabilityFilter, NowPlayingBar, ReviewCard, Sidebar, NavItem }} from '@oxy.so/bloom-language';\n{body}"
            ),
            "row.tsx",
        )
    };
    let valid = check(
        "export const x = (r, t, now, day, open, liked, mode, I) => [ReviewCard('Ana', 'Lovely', r).expanded(open), NowPlayingBar(t, {}).liked(liked).volume([0.6, (v) => {}]).devicePickerOpen(open), AvailabilityFilter(now).date(day), Sidebar(NavItem('Home', I)).mode(mode).collapsed(open)];\n",
    );
    assert!(valid.diagnostics.is_empty(), "{:?}", valid.diagnostics.first().map(|d| &d.message));
    let cases = [
        // The value and its handler are one binding, not two modifiers.
        ("Sidebar(NavItem('Home', I)).onModeChange(f)", "Sidebar has no modifier .onModeChange()"),
        ("Sidebar(NavItem('Home', I)).onCollapsedChange(f)", "Sidebar has no modifier .onCollapsedChange()"),
        // A binding belongs to the node that edits that value.
        ("ReviewCard('Ana', 'Lovely', r).liked(f)", "ReviewCard has no modifier .liked()"),
    ];
    for (chain, message) in cases {
        let output = check(&format!("export const x = (r, f, I) => {chain};\n"));
        assert_eq!(output.diagnostics[0].message, message, "{chain}");
    }
}

#[test]
fn a_bottom_sheet_is_checked_against_the_spec() {
    let fine = chrome(
        "export const S = (open, keep, apply) => Text('a').sheet(open, () => BottomSheet(Text('b')).detached().dragIndicator('hidden').material('flat').scrollable(false).sizing('fill').interactiveDismissDisabled().onDismissAttempt(keep).manualActivation().footer(apply, { behavior: 'viewport' }).label('Filters'));\n",
    );
    assert!(fine.diagnostics.is_empty(), "{:?}", first_message(&fine));
    let sizing = chrome("export const S = () => BottomSheet(Text('b')).sizing('half');\n");
    assert_eq!(first_message(&sizing), Some("Unknown sheetSizing token 'half' for .sizing()"));
    // A sheet is not a view: it takes no box modifier.
    let padded = chrome("export const S = () => BottomSheet(Text('b')).padding('md');\n");
    assert_eq!(first_message(&padded), Some("BottomSheet has no modifier .padding()"));
}

#[test]
fn the_sidebar_rail_and_page_footer_are_checked_against_the_spec() {
    let fine = chrome(
        "export const S = (Home, select) => Sidebar(NavItem('Home', Home).id('home').link('/').badge(3).shortcut('⌘1').secondary(), TreeSection('Projects', TreeFolder('Archive', TreeItem('Old')).expanded([true, select]), TreeItem('Roadmap').subtitle('Q1').meta('3').disabled()).collapsible().loading().emptyLabel('None')).selection(['home', select]).variant('rail').surface('docked').size('lg').collapsed().searchable(false).themeToggle(false).label('Navigation');\n",
    );
    assert!(fine.diagnostics.is_empty(), "{:?}", first_message(&fine));
    let rail = chrome(
        "export const R = (icon, select) => Rail(RailItem('Home', icon).id('home').activeIcon(icon)).selection(['home', select]).width('96');\n",
    );
    assert!(rail.diagnostics.is_empty(), "{:?}", first_message(&rail));
    let footer = chrome(
        "export const F = () => PageFooter(Text('a')).toolbar(Text('b')).pinning('sticky').scrollEdge('auto').ignoresSafeArea();\n",
    );
    assert!(footer.diagnostics.is_empty(), "{:?}", first_message(&footer));
    let size = chrome("export const S = () => Sidebar().size('xl');\n");
    assert_eq!(first_message(&size), Some("Unknown sidebarSize token 'xl' for .size()"));
    let surface = chrome("export const S = () => Sidebar().surface('glass');\n");
    assert_eq!(first_message(&surface), Some("Unknown sidebarSurface token 'glass' for .surface()"));
    let pinning = chrome("export const F = () => PageFooter().pinning('fixed');\n");
    assert_eq!(first_message(&pinning), Some("Unknown footerPinning token 'fixed' for .pinning()"));
    let row = chrome("export const S = () => TreeItem('a').padding('md');\n");
    assert_eq!(first_message(&row), Some("TreeItem has no modifier .padding()"));
    // A selection is one binding: no handler of its own beside it.
    let handler = chrome("export const S = (select) => Sidebar().onSelect(select);\n");
    assert_eq!(first_message(&handler), Some("Sidebar has no modifier .onSelect()"));
    let rail = chrome("export const R = (select) => Rail().onSelect(select);\n");
    assert_eq!(first_message(&rail), Some("Rail has no modifier .onSelect()"));
}

#[test]
fn the_command_palette_and_the_settings_are_checked_against_the_spec() {
    let fine = chrome(
        "export const C = (open, set, q, onQ, run, Icon, page) => [Command(CommandItem('New').icon(Icon).subtitle('a').keywords('x', 'y').shortcut('⌘N').disabled().onPress(run), CommandGroup('Go', CommandItem('B'))).presented([open, set]).placeholder('Search').emptyLabel('None').query([q, onQ]).testID('c'), SettingsModal(SettingsGroup('Account', SettingsItem('Profile', Icon).id('p').content(page).title('You').fullBleed(), SettingsItem('Out', Icon).onPress(run)).id('a')).presented([open, set]).selection(['p', set]).initialView('page').presentation('floating')];\n",
    );
    assert!(fine.diagnostics.is_empty(), "{:?}", first_message(&fine));
    let view = chrome("export const S = () => SettingsModal().initialView('list');\n");
    assert_eq!(first_message(&view), Some("Unknown settingsView token 'list' for .initialView()"));
    let group = chrome("export const C = () => CommandGroup('Go').title('x');\n");
    assert_eq!(first_message(&group), Some("CommandGroup has no modifier .title()"));
}

#[test]
fn the_app_layout_panels_and_destinations_are_checked_against_the_spec() {
    let fine = chrome(
        "export const A = (open, set, Icon, again) => AppLayout(Stack()).shellLayout('deck').shellPresentation('floating').panels(Panel('main').panelRole('main'), Panel('details', Text('d')).panelRole('inspector').label('Details').presented([open, set]).width('320').minWidth('280').maxWidth('448').resizable().hidden().keepMounted()).destinations(Destination('index', '/').label('Home').icon(Icon).activeIcon(Icon).badge(2).bar().page().preload().sidebar(false).sidebarAfter('x')).onReselect(again);\n",
    );
    assert!(fine.diagnostics.is_empty(), "{:?}", first_message(&fine));
    let layout = chrome("export const A = () => AppLayout(Stack()).shellLayout('grid');\n");
    assert_eq!(first_message(&layout), Some("Unknown shellLayout token 'grid' for .shellLayout()"));
    let role = chrome("export const P = () => Panel('a').panelRole('sidebar');\n");
    assert_eq!(first_message(&role), Some("Unknown panelRole token 'sidebar' for .panelRole()"));
}

#[test]
fn the_toolbar_and_the_sticky_section_are_checked_against_the_spec() {
    let fine = chrome(
        "export const T = () => [Toolbar(Text('a')).trailing(Text('b')).accessory(Text('c')).size('sm').testID('t'), StickySection(Text('d')).testID('s')];\n",
    );
    assert!(fine.diagnostics.is_empty(), "{:?}", first_message(&fine));
    let size = chrome("export const T = () => Toolbar().size('xl');\n");
    assert_eq!(first_message(&size), Some("Unknown controlSize token 'xl' for .size()"));
}

#[test]
fn a_screen_s_colour_activity_and_starting_heights_are_checked_against_the_spec() {
    let fine = chrome(
        "export const S = (seed) => Text('a').colorPreset('rose').seed(seed).screenActive(false).screenActive().initialHeaderHeight('64').initialFooterHeight('96');\n",
    );
    assert!(fine.diagnostics.is_empty(), "{:?}", first_message(&fine));
    let preset = chrome("export const S = () => Text('a').colorPreset('magenta');\n");
    assert_eq!(first_message(&preset), Some("Unknown colorPreset token 'magenta' for .colorPreset()"));
    let height = chrome("export const S = () => Text('a').initialHeaderHeight('65');\n");
    assert_eq!(first_message(&height), Some("Unknown space token '65' for .initialHeaderHeight()"));
}

#[test]
fn the_rest_of_the_layout_family_is_checked_against_the_spec() {
    let fine = chrome(
        "export const L = (reveal, resize) => [ScrollArea(Text('a')).contentMargins('horizontal', 'lg').spacing('sm').axis('horizontal').scrollbar('hover').scrollbarSide('start').size('md').keyboardTaps('handled').frame({ height: '48' }), ScrollSurface(Text('b')).stickyHeader(Text('h')).stickyFooter(Text('f')).fadeHeight('lg').fadeBottom(false).matchSurfacePaint().style('secondary').label('Messages'), AutoHideBar(Text('bar'), Text('body')).summary('oxy.so').collapsed().onReveal(reveal).peek(false).barHeight('44').collapsedHeight('xl').label('Show').testID('c'), ResizeHandle(resize).axis('horizontal').style('pill').thickness('14').onResizeStart(reveal).onResizeEnd(reveal).onNudge(resize).label('Resize').testID('r')];\n",
    );
    assert!(fine.diagnostics.is_empty(), "{:?}", first_message(&fine));
    let bar = chrome("export const L = () => ScrollArea(Text('a')).scrollbar('auto');\n");
    assert_eq!(first_message(&bar), Some("Unknown scrollbarVisibility token 'auto' for .scrollbar()"));
    let size = chrome("export const L = () => ScrollArea(Text('a')).size('lg');\n");
    assert_eq!(first_message(&size), Some("Unknown scrollbarSize token 'lg' for .size()"));
    let surface = chrome("export const L = () => ScrollSurface(Text('a')).style('tertiary');\n");
    assert_eq!(first_message(&surface), Some("Unknown scrollSurfaceStyle token 'tertiary' for .style()"));
    let handle = chrome("export const L = (r) => ResizeHandle(r).style('bar');\n");
    assert_eq!(first_message(&handle), Some("Unknown resizeHandleStyle token 'bar' for .style()"));
    // A bar and a handle take only their own modifiers.
    let boxed = chrome("export const L = (r) => ResizeHandle(r).padding('md');\n");
    assert!(first_message(&boxed).is_some_and(|m| m.contains(".padding()")), "{:?}", first_message(&boxed));
}

#[test]
fn a_bars_band_and_a_surfaces_fade_are_colours_and_its_timings_tokens() {
    let fine = chrome(
        "export const L = (brand) => [ScrollSurface(Text('a')).fade('background'), ScrollSurface(Text('a')).fade('card/half'), ScrollSurface(Text('a')).fade(brand), AutoHideBar(Text('bar')).band('card').band(brand).peekDelay('fast').unpeekDelay('250').hideMotion('dismiss').showMotion('expand')];\n",
    );
    assert!(fine.diagnostics.is_empty(), "{:?}", first_message(&fine));
    let cases = [
        (
            "ScrollSurface(Text('a')).fade('backgrond')",
            "Unknown color token 'backgrond' for .fade()",
            Some("background"),
        ),
        ("AutoHideBar(Text('a')).band('#ffffff')", "Unknown color token '#ffffff' for .band()", None),
        (
            "AutoHideBar(Text('a')).peekDelay('fats')",
            "Unknown duration token 'fats' for .peekDelay()",
            Some("fast"),
        ),
        (
            "AutoHideBar(Text('a')).unpeekDelay('25')",
            "Unknown duration token '25' for .unpeekDelay()",
            Some("250"),
        ),
        (
            "AutoHideBar(Text('a')).hideMotion('dismis')",
            "Unknown motion token 'dismis' for .hideMotion()",
            Some("dismiss"),
        ),
        (
            "AutoHideBar(Text('a')).showMotion('reveal')",
            "Unknown motion token 'reveal' for .showMotion()",
            None,
        ),
    ];
    for (chain, message, suggestion) in cases {
        let output = chrome(&format!("export const L = () => {chain};\n"));
        assert_eq!(first_message(&output), Some(message), "{chain}");
        if let Some(token) = suggestion {
            let help = output.diagnostics[0].help.as_deref().unwrap();
            assert!(help.starts_with(&format!("did you mean '{token}'?")), "{help}");
        }
    }
}

#[test]
fn the_sidebar_s_modes_identities_search_and_drops_are_checked_against_the_spec() {
    let fine = chrome(
        "export const S = (Glyph, choose, team, plan, typed, dropped) => Sidebar(SidebarMode('Search', Glyph).id('search').shortcut('k'), TreeSection('Private', TreeItem('Notes').draggable().droppable(false).dropBeside(false)).droppable(false)).mode(['search', choose]).modePresentation('toggle').modesLabel('Mode').team(team).teamPlacement('header').plan(plan).onboarding({ title: 'Start', steps: [] }).query(['ho', typed]).onDrop(dropped);\n",
    );
    assert!(fine.diagnostics.is_empty(), "{:?}", first_message(&fine));
    let presentation = chrome("export const S = () => Sidebar().modePresentation('tabs');\n");
    assert_eq!(
        first_message(&presentation),
        Some("Unknown modePresentation token 'tabs' for .modePresentation()")
    );
    let placement = chrome("export const S = () => Sidebar().teamPlacement('top');\n");
    assert_eq!(first_message(&placement), Some("Unknown teamPlacement token 'top' for .teamPlacement()"));
    let mode = chrome("export const S = (G) => SidebarMode('Search', G).badge(3);\n");
    assert!(first_message(&mode).is_some_and(|m| m.contains(".badge()")), "{:?}", first_message(&mode));
}

#[test]
fn the_settings_pages_rows_are_checked_against_the_spec() {
    let fine = chrome(
        "export const S = (Glyph, choice, text, date, items, low, high, format) => SettingsSection('Account', SettingsValue('Ana').icon(Glyph).muted(), SettingsSelect('Autoplay', choice, items).compact(false).size('sm').disabled().width('200').frame({ maxWidth: '160' }), SettingsTextField('Email', text).icon(Glyph).placeholder('you').keyboard('email-address').contentType('email').disabled().savedToast(false).testID('e'), SettingsDateField('Birthday', date).minDate(low).maxDate(high).dateFormat(format).savedToast(false).testID('b')).description('Yours').trailing(Text('Manage')).inset('sm').padding('md');\n",
    );
    assert!(fine.diagnostics.is_empty(), "{:?}", first_message(&fine));
    let keyboard = chrome("export const S = (t) => SettingsTextField('Email', t).keyboard('email');\n");
    assert_eq!(first_message(&keyboard), Some("Unknown keyboard token 'email' for .keyboard()"));
    let size = chrome("export const S = (c, i) => SettingsSelect('A', c, i).size('xl');\n");
    assert_eq!(first_message(&size), Some("Unknown controlSize token 'xl' for .size()"));
    // A field takes only its own modifiers: it has no box (Bloom's takes no style).
    let boxed = chrome("export const S = (d) => SettingsDateField('B', d).padding('md');\n");
    assert!(first_message(&boxed).is_some_and(|m| m.contains(".padding()")), "{:?}", first_message(&boxed));
}

#[test]
fn date_and_time_pickers_are_checked() {
    let imports = "import { DatePicker, DateRangePicker, Calendar, RangeCalendar, TimeField, VStack } from '@oxy.so/bloom-language';\n";
    let check = |body: &str| compile(&format!("{imports}{body}"), "row.tsx");
    let valid = check(
        "export const x = (day, range, time, set) => VStack(DatePicker([day, set]).bounds(day, null).weekStart(1).locale('fr').placeholder('Day').presented([true, set]).labels({}), DateRangePicker([range, set]).quickSelect(false).disabled(), Calendar([day, set]).initialMonth(day).unavailable(() => false), RangeCalendar([range, set]).months(2), TimeField([time, set]).bounds('09:00', '18:00').step(15).hourFormat('12h').size('sm'));\n",
    );
    assert!(valid.diagnostics.is_empty(), "{:?}", valid.diagnostics.first().map(|d| &d.message));
    let cases = [
        ("TimeField([t, s]).hourFormat('am')", "Unknown hourFormat token 'am' for .hourFormat()"),
        ("TimeField([t, s]).size('lg')", "Unknown timeFieldSize token 'lg' for .size()"),
        ("Calendar([t, s]).quickSelect(false)", "Calendar has no modifier .quickSelect()"),
        ("DatePicker([t, s]).months(2)", "DatePicker has no modifier .months()"),
    ];
    for (chain, message) in cases {
        let output = check(&format!("export const x = (t, s) => {chain};\n"));
        assert_eq!(output.diagnostics[0].message, message, "{chain}");
    }
}

#[test]
fn ratings_are_checked() {
    let imports =
        "import { Rating, RatingInput, RatingBar, RatingSummary, VStack } from '@oxy.so/bloom-language';\n";
    let check = |body: &str| compile(&format!("{imports}{body}"), "row.tsx");
    let valid = check(
        "export const x = (r, set) => VStack(Rating(4.5).count('1.2k').countStyle('reviews').size('sm').style('stars').showsValue(false).starSize('xl').tint('white').starTint('warning').countTint('muted/half').emptyTint('border').fillValue(4.5).labels({}), RatingInput([r, set]).max(10).size('lg').disabled().starLabel(String), RatingBar('Value', 3).max(1).valueLabel('72%').labelWidth('56').reveal({ visible: true, once: true }).revealMotion('enter'), RatingSummary(4.4, 128, {}).labels({}));\n",
    );
    assert!(valid.diagnostics.is_empty(), "{:?}", valid.diagnostics.first().map(|d| &d.message));
    let cases = [
        ("Rating(4).style('row')", "Unknown ratingStyle token 'row' for .style()"),
        ("Rating(4).size('lg')", "Unknown ratingSize token 'lg' for .size()"),
        ("Rating(4).countStyle('brackets')", "Unknown ratingCountStyle token 'brackets' for .countStyle()"),
        ("Rating(4).starTint('gold')", "Unknown color token 'gold' for .starTint()"),
        ("RatingInput([1, s]).size('xl')", "Unknown ratingInputSize token 'xl' for .size()"),
        ("RatingBar('a', 1).labelWidth('wide')", "Unknown space token 'wide' for .labelWidth()"),
    ];
    for (chain, message) in cases {
        let output = check(&format!("export const x = (s) => {chain};\n"));
        assert_eq!(output.diagnostics[0].message, message, "{chain}");
    }
}

#[test]
fn meters_and_progress_bars_are_checked() {
    let imports = "import { Meter, ProgressBar, MeterRing, ProgressRing, StatBar, SplitBar, Text, VStack } from '@oxy.so/bloom-language';\n";
    let check = |body: &str| compile(&format!("{imports}{body}"), "row.tsx");
    let valid = check(
        "export const x = (stop, share) => VStack(Meter(3, 5).valueText('3 of 5').tint('success').trackTint('muted/20').thickness('10').barCorner('2xs').fillDuration('slow').reveal({ visible: true, delay: 'fast' }).revealMotion('slide'), ProgressBar(0).indeterminate().decorative(), MeterRing(0.9).size('80').cap('butt').backdrop('black/half').content(Text('9')), ProgressRing(0.3).onStop(stop, 'Stop').progress(share), StatBar('Level', 40, 100).rangeLabels('0', '100').trailing(Text('!')), SplitBar('Wins', 30, '3', '7').tint('info'));\n",
    );
    assert!(valid.diagnostics.is_empty(), "{:?}", valid.diagnostics.first().map(|d| &d.message));
    let cases = [
        ("MeterRing(1).cap('square')", "Unknown meterCap token 'square' for .cap()"),
        ("Meter(1).fillDuration('slower')", "Unknown duration token 'slower' for .fillDuration()"),
        ("Meter(1).thickness('thick')", "Unknown space token 'thick' for .thickness()"),
        ("MeterRing(1).backdrop('scrim')", "Unknown color token 'scrim' for .backdrop()"),
        ("Meter(1).onStop(s, 'Stop')", "Meter has no modifier .onStop()"),
        ("StatBar('a', 1, 2).barCorner('xs')", "StatBar has no modifier .barCorner()"),
    ];
    for (chain, message) in cases {
        let output = check(&format!("export const x = (s) => {chain};\n"));
        assert_eq!(output.diagnostics[0].message, message, "{chain}");
    }
}

#[test]
fn a_sticker_is_checked() {
    let imports = "import { Lottie, Image } from '@oxy.so/bloom-language';\n";
    let check = |body: &str| compile(&format!("{imports}{body}"), "row.tsx");
    let valid = check(
        "export const x = (u, s) => Lottie(u).loop().paused(false).fallback(Image(s, 'Party')).frame({ width: '96' }).decorative();\n",
    );
    assert!(valid.diagnostics.is_empty(), "{:?}", valid.diagnostics.first().map(|d| &d.message));
    let output = check("export const x = (u) => Lottie(u).decorative(true);\n");
    assert_eq!(output.diagnostics[0].message, ".decorative() takes 0 argument(s), not 1");
}

#[test]
fn tables_are_checked() {
    let imports = "import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Text } from '@oxy.so/bloom-language';\n";
    let check = |body: &str| compile(&format!("{imports}{body}"), "row.tsx");
    let valid = check(
        "export const x = (sort, box) => Table(TableHeader(TableColumn('Name').width('160').minWidth('96').sort('ascending', sort).prefix(box), TableColumn('Score').share(2).align('end'), TableColumn('').width('fit')), TableBody(TableRow(TableCell('Ana'), TableCell(42).align('center')).selected(true)).emptyState(Text('None'))).size('sm').minWidth('640');\n",
    );
    assert!(valid.diagnostics.is_empty(), "{:?}", valid.diagnostics.first().map(|d| &d.message));
    let cases = [
        ("Table().size('lg')", "Unknown tableSize token 'lg' for .size()"),
        ("TableColumn('a').sort('up', s)", "Unknown tableSort token 'up' for .sort()"),
        ("TableColumn('a').width('auto')", "Unknown columnWidth token 'auto' for .width()"),
        ("TableCell('a').sort('none', s)", "TableCell has no modifier .sort()"),
        ("TableRow().emptyState('x')", "TableRow has no modifier .emptyState()"),
    ];
    for (chain, message) in cases {
        let output = check(&format!("export const x = (s) => {chain};\n"));
        assert_eq!(output.diagnostics[0].message, message, "{chain}");
    }
}

#[test]
fn rows_and_lists_are_checked() {
    let imports = "import { ListItem, PersonRow, List, SectionedList, VirtualList, ListSelectionBar, Text, VStack } from '@oxy.so/bloom-language';\n";
    let check = |body: &str| compile(&format!("{imports}{body}"), "row.tsx");
    let valid = check(
        "export const x = (p, items, sections, data, row, set, actions) => VStack(ListItem('Ana').supporting('Design').supportingLines(2).prefix(Text('A')).trailing(Text('>')).footnote(Text('f')).attachments(Text('a')).density('compact').compactPadding('xs').active(true).disabled().link('/a').onPrefetch(set).checkable([true, set]).selecting(true).selectionLabel('Select').rowActions(actions, set).swipeActions({}, undefined).swipeEnabled(false).contextMenu(Text('m')), PersonRow(p), List(items).separator('line').scrollable().scrollHeight('320').stickyHeaders().headerContent(Text('h')).footerContent(Text('f')).emptyState(Text('e')).loading().loadingRows(3), SectionedList(sections).sectionIndex({}), VirtualList(data, row).itemKey(String).itemType(String).estimatedItemSize(56).columns(2).onEndReached(set, 0.5).refreshable([false, set]).stickyIndices([0]).restorationKey('k').tuning({}), ListSelectionBar(1, 2).selecting(true).onSelectAll(set).onClear(set).rowActions(actions, set).labels({}));\n",
    );
    assert!(valid.diagnostics.is_empty(), "{:?}", valid.diagnostics.first().map(|d| &d.message));
    let cases = [
        ("List([]).separator('dashed')", "Unknown separator token 'dashed' for .separator()"),
        ("ListItem('a').compactPadding('tight')", "Unknown space token 'tight' for .compactPadding()"),
        ("ListItem('a').density('cozy')", "Unknown density token 'cozy' for .density()"),
        ("ListItem('a').density('default')", "Unknown density token 'default' for .density()"),
        ("ListItem('a').tuning({})", "ListItem has no modifier .tuning()"),
        ("VirtualList([], s).separator('line')", "VirtualList has no modifier .separator()"),
    ];
    for (chain, message) in cases {
        let output = check(&format!("export const x = (s) => {chain};\n"));
        assert_eq!(output.diagnostics[0].message, message, "{chain}");
    }
}

#[test]
fn carousels_are_checked() {
    let imports = "import { Carousel, CarouselItem, CarouselDots, Text } from '@oxy.so/bloom-language';\n";
    let check = |body: &str| compile(&format!("{imports}{body}"), "row.tsx");
    let valid = check(
        "export const x = (page, dot) => [Carousel(CarouselItem(Text('a')).width('256')).headerContent(Text('h')).footerContent(Text('f')).loop().groupSize(2).arrows('header').arrowsVisibility('hover').arrowsInset('sm').hidesUnavailableArrows().dots().align('center').spacing('md').contentInset('lg').page(page).labels({ dot }), CarouselDots(5, page).shape('dot').style('onMedia').max(5)];\n",
    );
    assert!(valid.diagnostics.is_empty(), "{:?}", valid.diagnostics.first().map(|d| &d.message));
    let cases = [
        (
            "Carousel().arrowsVisibility('never')",
            "Unknown arrowsVisibility token 'never' for .arrowsVisibility()",
        ),
        ("CarouselDots(1, p).shape('square')", "Unknown dotsShape token 'square' for .shape()"),
        ("CarouselDots(1, p).style('solid')", "Unknown dotsStyle token 'solid' for .style()"),
        ("Carousel().contentInset('wide')", "Unknown space token 'wide' for .contentInset()"),
        ("CarouselItem().loop()", "CarouselItem has no modifier .loop()"),
    ];
    for (chain, message) in cases {
        let output = check(&format!("export const x = (p) => {chain};\n"));
        assert_eq!(output.diagnostics[0].message, message, "{chain}");
    }
}

#[test]
fn markdown_is_checked() {
    let imports = "import { Markdown, Text } from '@oxy.so/bloom-language';\n";
    let check = |body: &str| compile(&format!("{imports}{body}"), "row.tsx");
    let valid = check(
        "export const x = (s, open) => Markdown(s).streaming().size('lg').onLinkPress(open).codeBlock((code) => Text(code));\n",
    );
    assert!(valid.diagnostics.is_empty(), "{:?}", valid.diagnostics.first().map(|d| &d.message));
    let output = check("export const x = (s) => Markdown(s).size('xl');\n");
    assert_eq!(output.diagnostics[0].message, "Unknown markdownSize token 'xl' for .size()");
}

#[test]
fn sliders_are_checked() {
    let imports = "import { Slider, RangeSlider } from '@oxy.so/bloom-language';\n";
    let check = |body: &str| compile(&format!("{imports}{body}"), "row.tsx");
    let valid = check(
        "export const x = (v, r, f) => [Slider(v, 'Volume').size('sm').tint('accent').bounds(0, 100).step(5).keyboardStep(10).disabled().thickness('6').thumbSize('xl').fillTint('success').trackTint('muted/20').thumbTint('white').showsValue(false).onCommit(f).valueFormat(f), RangeSlider(r).labels({ lower: 'From', upper: 'To' })];\n",
    );
    assert!(valid.diagnostics.is_empty(), "{:?}", valid.diagnostics.first().map(|d| &d.message));
    let cases = [
        ("Slider(v).tint('primary')", "Unknown tone token 'primary' for .tint()"),
        ("Slider(v).thumbTint('gold')", "Unknown color token 'gold' for .thumbTint()"),
        ("Slider(v).labels({})", "Slider has no modifier .labels()"),
    ];
    for (chain, message) in cases {
        let output = check(&format!("export const x = (v) => {chain};\n"));
        assert_eq!(output.diagnostics[0].message, message, "{chain}");
    }
}

#[test]
fn accordions_are_checked() {
    let imports = "import { Accordion, AccordionItem, AccordionTrigger, AccordionContent, Text } from '@oxy.so/bloom-language';\n";
    let check = |body: &str| compile(&format!("{imports}{body}"), "row.tsx");
    let valid = check(
        "export const x = (open) => Accordion(open, AccordionItem('a', AccordionTrigger('A').indicator(Text('+')), AccordionContent(Text('more'))).disabled()).size('sm').allowsMultiple().revealMotion('slide');\n",
    );
    assert!(valid.diagnostics.is_empty(), "{:?}", valid.diagnostics.first().map(|d| &d.message));
    let cases = [
        ("Accordion(o).size('xl')", "Unknown controlSize token 'xl' for .size()"),
        ("Accordion(o).allowsMultiple(true)", ".allowsMultiple() takes 0 argument(s), not 1"),
        ("AccordionContent().indicator(o)", "AccordionContent has no modifier .indicator()"),
    ];
    for (chain, message) in cases {
        let output = check(&format!("export const x = (o) => {chain};\n"));
        assert_eq!(output.diagnostics[0].message, message, "{chain}");
    }
}

#[test]
fn code_is_checked() {
    let imports = "import { Code, Pre, CodeLines, CodeBlock, Text } from '@oxy.so/bloom-language';\n";
    let check = |body: &str| compile(&format!("{imports}{body}"), "row.tsx");
    let valid = check(
        "export const x = (s, copy) => [Code(s), Pre(s).language('ts').lineNumbers(), CodeLines(s).highlight(['+2']).wrap().size('sm'), CodeBlock(s).languageLabel('TS').filename('a.ts').diff(3, 1).copyable(false).onCopy(copy).headerContent(Text('v2')).labels({})];\n",
    );
    assert!(valid.diagnostics.is_empty(), "{:?}", valid.diagnostics.first().map(|d| &d.message));
    let cases = [
        ("CodeLines(s).size('lg')", "Unknown codeLinesSize token 'lg' for .size()"),
        ("CodeBlock(s).diff(3)", ".diff() takes 2 argument(s), not 1"),
        ("Pre(s).highlight([])", "Pre has no modifier .highlight()"),
    ];
    for (chain, message) in cases {
        let output = check(&format!("export const x = (s) => {chain};\n"));
        assert_eq!(output.diagnostics[0].message, message, "{chain}");
    }
}

#[test]
fn steppers_are_checked() {
    let imports = "import { Stepper, StepperRow, Text } from '@oxy.so/bloom-language';\n";
    let check = |body: &str| compile(&format!("{imports}{body}"), "row.tsx");
    let valid = check(
        "export const x = (v, f) => [Stepper(v).bounds(0, 10).step(2).disabled().size('sm').style('outline').valueFormat(f).onRemove(f).labels({}), StepperRow(v, 'Adults').supporting(Text('13+')).dividers()];\n",
    );
    assert!(valid.diagnostics.is_empty(), "{:?}", valid.diagnostics.first().map(|d| &d.message));
    let cases = [
        ("Stepper(v).size('lg')", "Unknown stepperSize token 'lg' for .size()"),
        ("Stepper(v).style('solid')", "Unknown stepperStyle token 'solid' for .style()"),
        ("Stepper(v).dividers()", "Stepper has no modifier .dividers()"),
    ];
    for (chain, message) in cases {
        let output = check(&format!("export const x = (v) => {chain};\n"));
        assert_eq!(output.diagnostics[0].message, message, "{chain}");
    }
}

#[test]
fn tooltips_breadcrumbs_and_heatmaps_are_checked() {
    let imports = "import { Tooltip, Breadcrumb, BreadcrumbItem, ActivityHeatmap, Text, VStack } from '@oxy.so/bloom-language';\n";
    let check = |body: &str| compile(&format!("{imports}{body}"), "row.tsx");
    let valid = check(
        "export const x = (open, icon, data, f, menu) => VStack(Tooltip(Text('i'), 'About').presented(open).side('top').openDelay('0').size('md'), Breadcrumb(BreadcrumbItem('Home').link('/').icon(icon).prefix(Text('a')).active(true).disabled().hoverMenu(menu).size('sm')).size('sm').collapses().separatorView(Text('/')).labels({}), ActivityHeatmap(data).days(56).endDate('2026-11-21').levels([1]).emptyTint('mutedFill').cellSize('10').spacing('2xs').weekStart(1).labels({}).onPressDay(f));\n",
    );
    assert!(valid.diagnostics.is_empty(), "{:?}", valid.diagnostics.first().map(|d| &d.message));
    let cases = [
        ("Tooltip(t, 'a').side('middle')", "Unknown floatingSide token 'middle' for .side()"),
        ("Tooltip(t, 'a').size('lg')", "Unknown tooltipSize token 'lg' for .size()"),
        ("ActivityHeatmap(t).cellSize('big')", "Unknown space token 'big' for .cellSize()"),
        ("Breadcrumb().side('top')", "Breadcrumb has no modifier .side()"),
    ];
    for (chain, message) in cases {
        let output = check(&format!("export const x = (t) => {chain};\n"));
        assert_eq!(output.diagnostics[0].message, message, "{chain}");
    }
}

#[test]
fn tag_fields_file_uploads_and_videos_are_checked() {
    let imports = "import { TagField, FileUpload, Video, Text, VStack } from '@oxy.so/bloom-language';\n";
    let check = |body: &str| compile(&format!("{imports}{body}"), "row.tsx");
    let valid = check(
        "export const x = (tags, q, f, file, player) => VStack(TagField(tags, 'Topics').placeholder('Add').tagSuggestions([], 3).allowsCreate(false).max(3).onMaxReached(f).normalize(f).query(q).tint('vivid').size('sm').disabled().invalid().labels({}), FileUpload().file(file).uploadProgress(40).onFileSelected(f).onUploadComplete(f).onReject(f).picker(f).allowedExtensions(['pdf']).maxBytes(5).fileIcon(() => Text('f')).disabled().labels({}), Video(player).contentFit('contain').nativeControls(true).allowsPictureInPicture(false));\n",
    );
    assert!(valid.diagnostics.is_empty(), "{:?}", valid.diagnostics.first().map(|d| &d.message));
    let cases = [
        ("TagField(t).tint('danger')", "Unknown accentTone token 'danger' for .tint()"),
        ("Video(t).contentFit('stretch')", "Unknown contentFit token 'stretch' for .contentFit()"),
        ("FileUpload().nativeControls(true)", "FileUpload has no modifier .nativeControls()"),
    ];
    for (chain, message) in cases {
        let output = check(&format!("export const x = (t) => {chain};\n"));
        assert_eq!(output.diagnostics[0].message, message, "{chain}");
    }
}

#[test]
fn one_time_codes_are_checked() {
    let imports = "import { InputOtp } from '@oxy.so/bloom-language';\n";
    let check = |body: &str| compile(&format!("{imports}{body}"), "row.tsx");
    let valid = check(
        "export const x = (code, f) => InputOtp(code).length(4).characters('alphanumeric').onComplete(f).invalid().disabled().groupSize(3).autoFocus();\n",
    );
    assert!(valid.diagnostics.is_empty(), "{:?}", valid.diagnostics.first().map(|d| &d.message));
    let cases = [
        ("InputOtp(t).characters('hex')", "Unknown otpCharacters token 'hex' for .characters()"),
        ("InputOtp(t).placeholder('0')", "InputOtp has no modifier .placeholder()"),
    ];
    for (chain, message) in cases {
        let output = check(&format!("export const x = (t) => {chain};\n"));
        assert_eq!(output.diagnostics[0].message, message, "{chain}");
    }
}

#[test]
fn colour_swatch_pickers_are_checked() {
    let imports = "import { ColorSwatchPicker } from '@oxy.so/bloom-language';\n";
    let check = |body: &str| compile(&format!("{imports}{body}"), "row.tsx");
    let valid = check(
        "export const x = (color) => ColorSwatchPicker('Brand colour', color, ['#fff']).labels({}).size('3xl').disabled();\n",
    );
    assert!(valid.diagnostics.is_empty(), "{:?}", valid.diagnostics.first().map(|d| &d.message));
    let cases = [
        ("ColorSwatchPicker('C', t, []).size('huge')", "Unknown space token 'huge' for .size()"),
        ("ColorSwatchPicker('C', t, []).tint('primary')", "ColorSwatchPicker has no modifier .tint()"),
    ];
    for (chain, message) in cases {
        let output = check(&format!("export const x = (t) => {chain};\n"));
        assert_eq!(output.diagnostics[0].message, message, "{chain}");
    }
}

#[test]
fn animated_checks_are_checked() {
    let imports = "import { AnimatedCheck } from '@oxy.so/bloom-language';\n";
    let check = |body: &str| compile(&format!("{imports}{body}"), "row.tsx");
    let valid = check("export const x = (t) => AnimatedCheck(t).size('64').tint('success').padding('md');\n");
    assert!(valid.diagnostics.is_empty(), "{:?}", valid.diagnostics.first().map(|d| &d.message));
    let cases = [
        ("AnimatedCheck().size('huge')", "Unknown space token 'huge' for .size()"),
        ("AnimatedCheck().tint('red')", "Unknown color token 'red' for .tint()"),
        ("AnimatedCheck().placeholder('x')", "AnimatedCheck has no modifier .placeholder()"),
    ];
    for (chain, message) in cases {
        let output = check(&format!("export const x = () => {chain};\n"));
        assert_eq!(output.diagnostics[0].message, message, "{chain}");
    }
}

#[test]
fn context_menus_are_checked() {
    let imports = "import { ContextMenu, Item, Divider, Text } from '@oxy.so/bloom-language';\n";
    let check = |body: &str| compile(&format!("{imports}{body}"), "row.tsx");
    let valid = check(
        "export const x = (at, acts, f) => ContextMenu(Text('Hold'), Item('Copy').onPress(f), Divider(), Item('Delete').tag('remove')).actions(acts).presentedAt(at).disabled(false).label('Options').padding('md');\n",
    );
    assert!(valid.diagnostics.is_empty(), "{:?}", valid.diagnostics.first().map(|d| &d.message));
    let cases = [
        ("ContextMenu(Text('a')).presentedAt()", ".presentedAt() takes 1 argument(s), not 0"),
        ("ContextMenu(Text('a')).side('top')", "ContextMenu has no modifier .side()"),
    ];
    for (chain, message) in cases {
        let output = check(&format!("export const x = (t) => {chain};\n"));
        assert_eq!(output.diagnostics[0].message, message, "{chain}");
    }
}

#[test]
fn collapsibles_are_checked() {
    let imports = "import { Collapsible, Text } from '@oxy.so/bloom-language';\n";
    let check = |body: &str| compile(&format!("{imports}{body}"), "row.tsx");
    let valid = check(
        "export const x = (open, motion) => Collapsible(open, Text('a')).revealMotion(motion).revealsOnAppear().keepsMounted(false).padding('md');\n",
    );
    assert!(valid.diagnostics.is_empty(), "{:?}", valid.diagnostics.first().map(|d| &d.message));
    let cases = [
        ("Collapsible(t).keepsMounted()", ".keepsMounted() takes 1 argument(s), not 0"),
        ("Collapsible(t).collapses()", "Collapsible has no modifier .collapses()"),
    ];
    for (chain, message) in cases {
        let output = check(&format!("export const x = (t) => {chain};\n"));
        assert_eq!(output.diagnostics[0].message, message, "{chain}");
    }
}

#[test]
fn a_reveal_takes_a_timed_motion_token() {
    let imports =
        "import { Accordion, Collapsible, Meter, RatingBar, Text, VStack } from '@oxy.so/bloom-language';\n";
    let check = |body: &str| compile(&format!("{imports}{body}"), "row.tsx");
    // Bloom's timed motions by name, an app's own by its token; a bar's wait is a duration token.
    let valid = check(
        "export const x = (open, app, seen) => VStack(Accordion(open).revealMotion('fade'), Collapsible(true, Text('a')).revealMotion(app), Meter(1).reveal({ visible: seen, once: true, delay: '0' }).revealMotion('pop'), RatingBar('a', 1).reveal({ visible: seen }).revealMotion(app));\n",
    );
    assert!(valid.diagnostics.is_empty(), "{:?}", valid.diagnostics.first().map(|d| &d.message));
    let cases = [
        // A reveal eases and never springs: Bloom's springs are not timed motions.
        (
            "Collapsible(t).revealMotion('expand')",
            "Unknown timedMotion token 'expand' for .revealMotion()",
            None,
        ),
        (
            "Accordion(t).revealMotion('spring')",
            "Unknown timedMotion token 'spring' for .revealMotion()",
            None,
        ),
        (
            "Meter(1).revealMotion('slid')",
            "Unknown timedMotion token 'slid' for .revealMotion()",
            Some("slide"),
        ),
        ("Meter(1).reveal({ visible: t, duration: 600 })", ".reveal() has no 'duration'", None),
        (
            "RatingBar('a', 1).reveal({ visible: t, delay: 'fsat' })",
            "Unknown duration token 'fsat' for .reveal()",
            Some("fast"),
        ),
    ];
    for (chain, message, suggestion) in cases {
        let output = check(&format!("export const x = (t) => {chain};\n"));
        assert_eq!(output.diagnostics[0].message, message, "{chain}");
        if let Some(token) = suggestion {
            let help = output.diagnostics[0].help.as_deref().unwrap();
            assert!(help.starts_with(&format!("did you mean '{token}'?")), "{help}");
        }
    }
}

#[test]
fn drop_zones_are_checked() {
    let imports = "import { DropZone, Text } from '@oxy.so/bloom-language';\n";
    let check = |body: &str| compile(&format!("{imports}{body}"), "row.tsx");
    let valid = check(
        "export const x = (f) => DropZone(['files'], f, Text('a')).fileTypes(['image/*']).dragActions(['copy', 'move'], 'move').folder('Inbox').disabled().onDragEnter(f).onDragOver(f).onDragLeave(f).padding('md');\n",
    );
    assert!(valid.diagnostics.is_empty(), "{:?}", valid.diagnostics.first().map(|d| &d.message));
    let cases = [
        ("DropZone(t, t).dragActions(t, 'drag')", "Unknown dragAction token 'drag' for .dragActions()"),
        ("DropZone(t, t).keepsMounted(false)", "DropZone has no modifier .keepsMounted()"),
    ];
    for (chain, message) in cases {
        let output = check(&format!("export const x = (t) => {chain};\n"));
        assert_eq!(output.diagnostics[0].message, message, "{chain}");
    }
}

#[test]
fn media_inset_borders_are_checked() {
    let imports = "import { MediaInsetBorder, Text } from '@oxy.so/bloom-language';\n";
    let check = |body: &str| compile(&format!("{imports}{body}"), "row.tsx");
    let valid = check(
        "export const x = () => MediaInsetBorder(Text('a')).opaque().mediaCorner('lg').frame({ width: '160', height: '96' });\n",
    );
    assert!(valid.diagnostics.is_empty(), "{:?}", valid.diagnostics.first().map(|d| &d.message));
    let cases = [
        ("MediaInsetBorder().mediaCorner('huge')", "Unknown corner token 'huge' for .mediaCorner()"),
        ("MediaInsetBorder().contentFit('cover')", "MediaInsetBorder has no modifier .contentFit()"),
    ];
    for (chain, message) in cases {
        let output = check(&format!("export const x = (t) => {chain};\n"));
        assert_eq!(output.diagnostics[0].message, message, "{chain}");
    }
}

#[test]
fn fact_strips_are_checked() {
    let imports = "import { FactStrip, Fact, Text } from '@oxy.so/bloom-language';\n";
    let check = |body: &str| compile(&format!("{imports}{body}"), "row.tsx");
    let valid = check(
        "export const x = (f) => FactStrip(Fact('Ratings', '4.7').caption(Text('x')).onPress(f).label('a').id('r')).minItemWidth('96').contentInset('lg').padding('md');\n",
    );
    assert!(valid.diagnostics.is_empty(), "{:?}", valid.diagnostics.first().map(|d| &d.message));
    let cases = [
        ("FactStrip().minItemWidth('wide')", "Unknown space token 'wide' for .minItemWidth()"),
        ("Fact('a', 'b').padding('md')", "Fact has no modifier .padding()"),
        ("FactStrip().caption('x')", "FactStrip has no modifier .caption()"),
    ];
    for (chain, message) in cases {
        let output = check(&format!("export const x = () => {chain};\n"));
        assert_eq!(output.diagnostics[0].message, message, "{chain}");
    }
}

#[test]
fn photo_grids_are_checked() {
    let imports = "import { SortablePhotoGrid } from '@oxy.so/bloom-language';\n";
    let check = |body: &str| compile(&format!("{imports}{body}"), "row.tsx");
    let valid = check(
        "export const x = (photos, f) => SortablePhotoGrid(photos).onRemove(f).onRetry(f).onAdd(f).max(6).addHint('Up to 6').columns(4).imageVariant('thumb').disabled().labels({});\n",
    );
    assert!(valid.diagnostics.is_empty(), "{:?}", valid.diagnostics.first().map(|d| &d.message));
    let cases = [
        ("SortablePhotoGrid(t).onAdd()", ".onAdd() takes 1 argument(s), not 0"),
        ("SortablePhotoGrid(t).placeholder('x')", "SortablePhotoGrid has no modifier .placeholder()"),
    ];
    for (chain, message) in cases {
        let output = check(&format!("export const x = (t) => {chain};\n"));
        assert_eq!(output.diagnostics[0].message, message, "{chain}");
    }
}

#[test]
fn choice_lists_are_checked() {
    let imports = "import { ChoiceList, Text } from '@oxy.so/bloom-language';\n";
    let check = |body: &str| compile(&format!("{imports}{body}"), "row.tsx");
    let valid = check(
        "export const x = (choice, options) => ChoiceList('Accounts', choice, options, (o) => Text(o.label)).axis('vertical').spacing('28').optionBox({ corner: 'md' }).disabled();\n",
    );
    assert!(valid.diagnostics.is_empty(), "{:?}", valid.diagnostics.first().map(|d| &d.message));
    let cases = [
        ("ChoiceList('A', t, [], f).axis('depth')", "Unknown axis token 'depth' for .axis()"),
        ("ChoiceList('A', t, [], f).spacing('huge')", "Unknown space token 'huge' for .spacing()"),
        ("ChoiceList('A', t, [], f).size('sm')", "ChoiceList has no modifier .size()"),
    ];
    for (chain, message) in cases {
        let output = check(&format!("export const x = (t, f) => {chain};\n"));
        assert_eq!(output.diagnostics[0].message, message, "{chain}");
    }
}

#[test]
fn video_playback_is_checked() {
    let imports = "import { VideoPlayback, VideoViewability, VideoViewabilityScope, Text } from '@oxy.so/bloom-language';\n";
    let check = |body: &str| compile(&format!("{imports}{body}"), "row.tsx");
    let valid = check(
        "export const x = (keys) => VideoPlayback(VideoViewability(keys, VideoViewabilityScope('a', Text('Post')))).autoplay(false);\n",
    );
    assert!(valid.diagnostics.is_empty(), "{:?}", valid.diagnostics.first().map(|d| &d.message));
    let cases = [
        ("VideoPlayback(t).padding('md')", "VideoPlayback has no modifier .padding()"),
        ("VideoPlayback(t).autoplay()", ".autoplay() takes 1 argument(s), not 0"),
        ("VideoViewabilityScope('a', t).autoplay(true)", "VideoViewabilityScope has no modifier .autoplay()"),
    ];
    for (chain, message) in cases {
        let output = check(&format!("export const x = (t) => {chain};\n"));
        assert_eq!(output.diagnostics[0].message, message, "{chain}");
    }
}

#[test]
fn hover_cards_are_checked() {
    let imports = "import { HoverCard, Text } from '@oxy.so/bloom-language';\n";
    let check = |body: &str| compile(&format!("{imports}{body}"), "row.tsx");
    let valid = check(
        "export const x = (open) => HoverCard(Text('@nate'), Text('Card')).presented(open).openDelay('0').closeDelay('slow').side('top').align('end').padded(false).disabled().label('Nate').padding('xs');\n",
    );
    assert!(valid.diagnostics.is_empty(), "{:?}", valid.diagnostics.first().map(|d| &d.message));
    let cases = [
        ("HoverCard(Text('a'), Text('b')).side('middle')", "Unknown floatingSide token 'middle' for .side()"),
        ("HoverCard(Text('a'), Text('b')).actions(t)", "HoverCard has no modifier .actions()"),
    ];
    for (chain, message) in cases {
        let output = check(&format!("export const x = (t) => {chain};\n"));
        assert_eq!(output.diagnostics[0].message, message, "{chain}");
    }
}

#[test]
fn a_components_waits_are_duration_tokens() {
    let imports = "import { ConnectionStatus, HoverCard, Notification, Text, Tooltip } from '@oxy.so/bloom-language';\n";
    let check = |body: &str| compile(&format!("{imports}{body}"), "row.tsx");
    let valid = check(
        "export const x = [HoverCard(Text('a'), Text('b')).openDelay('400').closeDelay('fast'), Tooltip(Text('i'), 'About').openDelay('1000'), Notification('a').autoDismiss('4000').introDelay('0'), ConnectionStatus().reconnectingDelay('3000').restoredDuration('2500')];\n",
    );
    assert!(valid.diagnostics.is_empty(), "{:?}", valid.diagnostics.first().map(|d| &d.message));
    let cases = [
        (
            "HoverCard(Text('a'), Text('b')).openDelay('later')",
            "Unknown duration token 'later' for .openDelay()",
            None,
        ),
        (
            "HoverCard(Text('a'), Text('b')).closeDelay('fats')",
            "Unknown duration token 'fats' for .closeDelay()",
            Some("fast"),
        ),
        (
            "Tooltip(Text('i'), 'a').openDelay('1200')",
            "Unknown duration token '1200' for .openDelay()",
            Some("1000"),
        ),
        (
            "Notification('a').autoDismiss('40000')",
            "Unknown duration token '40000' for .autoDismiss()",
            Some("4000"),
        ),
        ("Notification('a').introDelay('0.2')", "Unknown duration token '0.2' for .introDelay()", Some("0")),
        (
            "ConnectionStatus().reconnectingDelay('slower')",
            "Unknown duration token 'slower' for .reconnectingDelay()",
            Some("slow"),
        ),
        (
            "ConnectionStatus().restoredDuration('25000')",
            "Unknown duration token '25000' for .restoredDuration()",
            Some("2500"),
        ),
    ];
    for (chain, message, suggestion) in cases {
        let output = check(&format!("export const x = {chain};\n"));
        assert_eq!(output.diagnostics[0].message, message, "{chain}");
        let help = output.diagnostics[0].help.as_deref().unwrap();
        match suggestion {
            Some(token) => assert!(help.starts_with(&format!("did you mean '{token}'?")), "{help}"),
            None => assert!(help.starts_with("duration tokens: 0,"), "{help}"),
        }
    }
}

#[test]
fn expandable_text_is_checked() {
    let imports = "import { ExpandableText } from '@oxy.so/bloom-language';\n";
    let check = |body: &str| compile(&format!("{imports}{body}"), "row.tsx");
    let valid = check(
        "export const x = (open) => ExpandableText('Long', open).lines(2).style('inline').labels({}).font('caption-1').foreground('muted');\n",
    );
    assert!(valid.diagnostics.is_empty(), "{:?}", valid.diagnostics.first().map(|d| &d.message));
    let cases = [
        ("ExpandableText('a').style('outline')", "Unknown expandableTextStyle token 'outline' for .style()"),
        ("ExpandableText('a').placeholder('b')", "ExpandableText has no modifier .placeholder()"),
    ];
    for (chain, message) in cases {
        let output = check(&format!("export const x = () => {chain};\n"));
        assert_eq!(output.diagnostics[0].message, message, "{chain}");
    }
}

#[test]
fn category_bars_are_checked() {
    let imports = "import { CategoryBar, Text } from '@oxy.so/bloom-language';\n";
    let check = |body: &str| compile(&format!("{imports}{body}"), "row.tsx");
    let valid = check(
        "export const x = (items, type) => CategoryBar('Categories', items, type).trailing(Text('Filters')).spacing('2xl').backdrop('surface').labels({});\n",
    );
    assert!(valid.diagnostics.is_empty(), "{:?}", valid.diagnostics.first().map(|d| &d.message));
    let cases = [
        ("CategoryBar('C', [], t).backdrop('paper')", "Unknown color token 'paper' for .backdrop()"),
        ("CategoryBar('C', [], t).loading()", "CategoryBar has no modifier .loading()"),
    ];
    for (chain, message) in cases {
        let output = check(&format!("export const x = (t) => {chain};\n"));
        assert_eq!(output.diagnostics[0].message, message, "{chain}");
    }
}

#[test]
fn a_heatmaps_colour_scale_is_checked() {
    let imports = "import { ActivityHeatmap } from '@oxy.so/bloom-language';\n";
    let check = |body: &str| compile(&format!("{imports}{body}"), "row.tsx");
    let valid = check(
        "export const x = (days) => ActivityHeatmap(days).levels([2, 5]).colorScale(['info', 'warning', 'error']);\n",
    );
    assert!(valid.diagnostics.is_empty(), "{:?}", valid.diagnostics.first().map(|d| &d.message));
    let output = check("export const x = (days) => ActivityHeatmap(days).colorScale();\n");
    assert_eq!(output.diagnostics[0].message, ".colorScale() takes 1 argument(s), not 0");
}

#[test]
fn menubars_are_checked() {
    let imports = "import { Menubar, MenubarMenu, Item, Divider } from '@oxy.so/bloom-language';\n";
    let check = |body: &str| compile(&format!("{imports}{body}"), "row.tsx");
    let valid = check(
        "export const x = (open, acts, f) => Menubar(MenubarMenu('File', Item('New').shortcut('Mod+N').onPress(f), Divider()).id('file').disabled(false).testID('file')).openMenu(open).actions(acts).label('App').padding('xs');\n",
    );
    assert!(valid.diagnostics.is_empty(), "{:?}", valid.diagnostics.first().map(|d| &d.message));
    let cases = [
        ("MenubarMenu('File').padding('xs')", "MenubarMenu has no modifier .padding()"),
        ("Menubar().openMenu()", ".openMenu() takes 1 argument(s), not 0"),
    ];
    for (chain, message) in cases {
        let output = check(&format!("export const x = (t) => {chain};\n"));
        assert_eq!(output.diagnostics[0].message, message, "{chain}");
    }
}

#[test]
fn composition_bars_are_checked() {
    let imports = "import { CompositionBar } from '@oxy.so/bloom-language';\n";
    let check = |body: &str| compile(&format!("{imports}{body}"), "row.tsx");
    let valid = check(
        "export const x = (segments, chosen, f) => CompositionBar(segments, chosen, 'Tap a segment').readoutFormat(f).padding('lg');\n",
    );
    assert!(valid.diagnostics.is_empty(), "{:?}", valid.diagnostics.first().map(|d| &d.message));
    let cases = [
        ("CompositionBar(s, c, 'h').valueFormat(f)", "CompositionBar has no modifier .valueFormat()"),
        ("CompositionBar(s, c, 'h').readoutFormat()", ".readoutFormat() takes 1 argument(s), not 0"),
    ];
    for (chain, message) in cases {
        let output = check(&format!("export const x = (s, c, f) => {chain};\n"));
        assert_eq!(output.diagnostics[0].message, message, "{chain}");
    }
}

#[test]
fn phone_inputs_are_checked() {
    let imports = "import { PhoneInput } from '@oxy.so/bloom-language';\n";
    let check = |body: &str| compile(&format!("{imports}{body}"), "row.tsx");
    let valid = check(
        "export const x = (phone, country, list, icon) => PhoneInput(phone, 'Phone').country(country).countries(list).placeholder('5').description('d').required().showsInfo().size('sm').invalid().disabled().trailingIcon(icon).labels({});\n",
    );
    assert!(valid.diagnostics.is_empty(), "{:?}", valid.diagnostics.first().map(|d| &d.message));
    let cases = [
        ("PhoneInput(t).size('xl')", "Unknown controlSize token 'xl' for .size()"),
        ("PhoneInput(t).showsInfo(true)", ".showsInfo() takes 0 argument(s), not 1"),
        ("PhoneInput(t).keyboard('numeric')", "PhoneInput has no modifier .keyboard()"),
    ];
    for (chain, message) in cases {
        let output = check(&format!("export const x = (t) => {chain};\n"));
        assert_eq!(output.diagnostics[0].message, message, "{chain}");
    }
}

#[test]
fn media_flights_are_checked() {
    let imports = "import { MediaFlightLayer, MediaFlightHost, MediaSurface, MediaPoster, EmptyMediaSurface, Text, VStack } from '@oxy.so/bloom-language';\n";
    let check = |body: &str| compile(&format!("{imports}{body}"), "row.tsx");
    let valid = check(
        "export const x = (c) => VStack(MediaFlightLayer(), MediaFlightHost('a', c).contentFit('contain').nativeControls(true).surfaceType('surfaceView').flightId('a').videoSlot(() => Text('v')), MediaSurface(c).contentFit('cover'), MediaPoster(c).contentFit('contain'), EmptyMediaSurface().padding('md'));\n",
    );
    assert!(valid.diagnostics.is_empty(), "{:?}", valid.diagnostics.first().map(|d| &d.message));
    let cases = [
        ("MediaSurface(t).surfaceType('glView')", "Unknown videoSurface token 'glView' for .surfaceType()"),
        ("MediaPoster(t).nativeControls(true)", "MediaPoster has no modifier .nativeControls()"),
        ("MediaFlightLayer().padding('md')", "MediaFlightLayer has no modifier .padding()"),
    ];
    for (chain, message) in cases {
        let output = check(&format!("export const x = (t) => {chain};\n"));
        assert_eq!(output.diagnostics[0].message, message, "{chain}");
    }
}

#[test]
fn avatar_flights_are_checked() {
    let imports = "import { AvatarAnchor, AvatarFlightLayer, Text, VStack } from '@oxy.so/bloom-language';\n";
    let check = |body: &str| compile(&format!("{imports}{body}"), "row.tsx");
    let valid = check(
        "export const x = (f) => VStack(AvatarAnchor(f, 'a', Text('A')).frame({ width: '44', height: '44' }), AvatarFlightLayer(f));\n",
    );
    assert!(valid.diagnostics.is_empty(), "{:?}", valid.diagnostics.first().map(|d| &d.message));
    let cases = [
        ("AvatarFlightLayer(t).padding('md')", "AvatarFlightLayer has no modifier .padding()"),
        ("AvatarAnchor(t, 'a').contentFit('cover')", "AvatarAnchor has no modifier .contentFit()"),
    ];
    for (chain, message) in cases {
        let output = check(&format!("export const x = (t) => {chain};\n"));
        assert_eq!(output.diagnostics[0].message, message, "{chain}");
    }
}

#[test]
fn input_groups_are_checked() {
    let imports = "import { InputGroup, InputGroupAddon, TextField } from '@oxy.so/bloom-language';\n";
    let check = |body: &str| compile(&format!("{imports}{body}"), "row.tsx");
    let valid = check(
        "export const x = (text) => InputGroup(InputGroupAddon('https://').divider().flush(false), TextField(text, 'Domain')).size('sm').invalid().disabled();\n",
    );
    assert!(valid.diagnostics.is_empty(), "{:?}", valid.diagnostics.first().map(|d| &d.message));
    let cases = [
        ("InputGroup().size('xl')", "Unknown controlSize token 'xl' for .size()"),
        ("InputGroupAddon('@').size('sm')", "InputGroupAddon has no modifier .size()"),
        ("InputGroup().divider()", "InputGroup has no modifier .divider()"),
    ];
    for (chain, message) in cases {
        let output = check(&format!("export const x = () => {chain};\n"));
        assert_eq!(output.diagnostics[0].message, message, "{chain}");
    }
}

#[test]
fn notifications_are_checked() {
    let imports = "import { Notification } from '@oxy.so/bloom-language';\n";
    let check = |body: &str| compile(&format!("{imports}{body}"), "row.tsx");
    let valid = check(
        "export const x = (f, icon, who) => Notification('Saved').description('3 files').timestamp('2m').status('success').icon(icon).avatar(who).buttons([]).dismissible(false).onDismiss(f).autoDismiss('4000').introDelay('normal').liveRole('alert').labels({});\n",
    );
    assert!(valid.diagnostics.is_empty(), "{:?}", valid.diagnostics.first().map(|d| &d.message));
    let cases = [
        ("Notification('a').status('danger')", "Unknown notificationStatus token 'danger' for .status()"),
        ("Notification('a').liveRole('polite')", "Unknown liveRole token 'polite' for .liveRole()"),
        ("Notification('a').placeholder('b')", "Notification has no modifier .placeholder()"),
    ];
    for (chain, message) in cases {
        let output = check(&format!("export const x = () => {chain};\n"));
        assert_eq!(output.diagnostics[0].message, message, "{chain}");
    }
}

#[test]
fn link_previews_are_checked() {
    let imports = "import { LinkPreview } from '@oxy.so/bloom-language';\n";
    let check = |body: &str| compile(&format!("{imports}{body}"), "row.tsx");
    let valid =
        check("export const x = (p, f) => LinkPreview(p).coverFill().onPress(f).frame({ width: '320' });\n");
    assert!(valid.diagnostics.is_empty(), "{:?}", valid.diagnostics.first().map(|d| &d.message));
    let output = check("export const x = (p) => LinkPreview(p).streaming();\n");
    assert_eq!(output.diagnostics[0].message, "LinkPreview has no modifier .streaming()");
}

#[test]
fn social_buttons_are_checked() {
    let imports = "import { SocialButton } from '@oxy.so/bloom-language';\n";
    let check = |body: &str| compile(&format!("{imports}{body}"), "row.tsx");
    let valid = check(
        "export const x = (f) => SocialButton('google', 'Use Google').size('sm').style('white').iconOnly().fullWidth().intent('signUp').link('/oauth').disabled().onPress(f);\n",
    );
    assert!(valid.diagnostics.is_empty(), "{:?}", valid.diagnostics.first().map(|d| &d.message));
    let cases = [
        ("SocialButton('oxy').style('solid')", "Unknown socialButtonStyle token 'solid' for .style()"),
        ("SocialButton('oxy').size('lg')", "Unknown socialButtonSize token 'lg' for .size()"),
        ("SocialButton('oxy').intent('login')", "Unknown socialIntent token 'login' for .intent()"),
    ];
    for (chain, message) in cases {
        let output = check(&format!("export const x = () => {chain};\n"));
        assert_eq!(output.diagnostics[0].message, message, "{chain}");
    }
}

#[test]
fn media_galleries_are_checked() {
    let imports = "import { Gallery, Image, Text } from '@oxy.so/bloom-language';\n";
    let check = |body: &str| compile(&format!("{imports}{body}"), "row.tsx");
    let valid = check(
        "export const x = (open, page, items, f) => Image('a').fullScreenCover(open, Gallery(items).page(page).style('page').pageIndicator('thumbnails').mediaCorner('full').nativeControls(true).videoOverlay(() => Text('v')).sourceAnchors(['a']).labels({}));\n",
    );
    assert!(valid.diagnostics.is_empty(), "{:?}", valid.diagnostics.first().map(|d| &d.message));
    let cases = [
        ("Gallery(t).style('sheet')", "Unknown galleryStyle token 'sheet' for .style()"),
        ("Gallery(t).pageIndicator('bars')", "Unknown galleryIndicator token 'bars' for .pageIndicator()"),
        ("Gallery(t).padding('md')", "Gallery has no modifier .padding()"),
        ("Text('a').fullScreenCover(t)", ".fullScreenCover() takes 2 argument(s), not 1"),
    ];
    for (chain, message) in cases {
        let output = check(&format!("export const x = (t) => {chain};\n"));
        assert_eq!(output.diagnostics[0].message, message, "{chain}");
    }
}

#[test]
fn meeting_schedulers_are_checked() {
    let imports = "import { MeetingScheduler } from '@oxy.so/bloom-language';\n";
    let check = |body: &str| compile(&format!("{imports}{body}"), "row.tsx");
    let valid = check(
        "export const x = (b, host, meeting, f, open) => MeetingScheduler(b, host, meeting, 'Amsterdam').bounds(null).unavailable(f).weekStart(1).locale('en').labels({}).timeSlots(['09:00']).hourFormat('12h').onTimezonePress(f).triggerTitle('Book').disabled().presented(open);\n",
    );
    assert!(valid.diagnostics.is_empty(), "{:?}", valid.diagnostics.first().map(|d| &d.message));
    let cases = [
        (
            "MeetingScheduler(b, h, m, 'A').hourFormat('am')",
            "Unknown hourFormat token 'am' for .hourFormat()",
        ),
        (
            "MeetingScheduler(b, h, m, 'A').placeholder('x')",
            "MeetingScheduler has no modifier .placeholder()",
        ),
    ];
    for (chain, message) in cases {
        let output = check(&format!("export const x = (b, h, m) => {chain};\n"));
        assert_eq!(output.diagnostics[0].message, message, "{chain}");
    }
}

#[test]
fn inline_markdown_is_checked() {
    let imports = "import { InlineMarkdown, Text } from '@oxy.so/bloom-language';\n";
    let check = |body: &str| compile(&format!("{imports}{body}"), "row.tsx");
    let valid = check(
        "export const x = (s, f, g, h) => Text(InlineMarkdown(s).streaming().onLinkPress(f).plainRun(g).linkView(h).suffix(Text(' more')));\n",
    );
    assert!(valid.diagnostics.is_empty(), "{:?}", valid.diagnostics.first().map(|d| &d.message));
    let output = check("export const x = (s) => InlineMarkdown(s).codeBlock(s);\n");
    assert_eq!(output.diagnostics[0].message, "InlineMarkdown has no modifier .codeBlock()");
}

#[test]
fn data_tables_are_checked() {
    let imports = "import { DataTable, DataColumn, DataTableFilter, DataTableSearch, DataTableSelect, Text } from '@oxy.so/bloom-language';\n";
    let check = |body: &str| compile(&format!("{imports}{body}"), "row.tsx");
    let valid = check(
        "export const x = (rows, id, f, v, s, p, o) => DataTable(rows, id, DataColumn('a', 'A', f).label('A').width('160').share(2).minWidth('96').basis('120').align('end').cell(() => DataTableSelect(v, 'S', o, '120').size('sm').disabled()).sortable(false).sortsDescendingFirst()).title('T').summary('3').toolbar(DataTableFilter(v, 'F', o).disabled(), DataTableSearch(v, 'Q').placeholder('Search')).sorting(s).rowSelection(s).pageSize(8).page(p).size('sm').sizeToggle(s).bordered(false).emptyState('None').minWidth('640').style('inset').labels({});\n",
    );
    assert!(valid.diagnostics.is_empty(), "{:?}", valid.diagnostics.first().map(|d| &d.message));
    let cases = [
        ("DataTable(r, i).style('grid')", "Unknown dataTableStyle token 'grid' for .style()"),
        ("DataTable(r, i).size('lg')", "Unknown tableSize token 'lg' for .size()"),
        ("DataTableSearch(r, 'Q').loading()", "DataTableSearch has no modifier .loading()"),
    ];
    for (chain, message) in cases {
        let output = check(&format!("export const x = (r, i) => {chain};\n"));
        assert_eq!(output.diagnostics[0].message, message, "{chain}");
    }
}

#[test]
fn sortable_chip_rows_are_checked() {
    let imports = "import { SortableChipRow, SortableChip, Text, Button } from '@oxy.so/bloom-language';\n";
    let check = |body: &str| compile(&format!("{imports}{body}"), "row.tsx");
    let valid = check(
        "export const x = (f, g) => SortableChipRow(SortableChip('a', 'A', Text('A'))).onReorder(f).onDragChange(g).trailing(Button(Text('Add'))).disabled().label('Links');\n",
    );
    assert!(valid.diagnostics.is_empty(), "{:?}", valid.diagnostics.first().map(|d| &d.message));
    let cases = [
        ("SortableChipRow().columns(2)", "SortableChipRow has no modifier .columns()"),
        ("SortableChip('a', 'A', Text('A')).padding('md')", "SortableChip has no modifier .padding()"),
    ];
    for (chain, message) in cases {
        let output = check(&format!("export const x = () => {chain};\n"));
        assert_eq!(output.diagnostics[0].message, message, "{chain}");
    }
}

#[test]
fn viewports_are_checked() {
    let imports = "import { Viewport, Text } from '@oxy.so/bloom-language';\n";
    let check = |body: &str| compile(&format!("{imports}{body}"), "row.tsx");
    let valid = check("export const x = () => Viewport(Viewport(Text('A')).root());\n");
    assert!(valid.diagnostics.is_empty(), "{:?}", valid.diagnostics.first().map(|d| &d.message));
    let cases = [
        ("Viewport(Text('A')).padding('md')", "Viewport has no modifier .padding()"),
        ("Viewport(Text('A')).root(true)", ".root() takes 0 argument(s), not 1"),
    ];
    for (chain, message) in cases {
        let output = check(&format!("export const x = () => {chain};\n"));
        assert_eq!(output.diagnostics[0].message, message, "{chain}");
    }
}

#[test]
fn agent_avatars_are_checked() {
    let imports = "import { AgentAvatar } from '@oxy.so/bloom-language';\n";
    let check = |body: &str| compile(&format!("{imports}{body}"), "row.tsx");
    let valid = check(
        "export const x = (c) => AgentAvatar(c, { reactionKey: 1 }).size('xl').mood('sad').paused(true).interactive().portrait(false).label('Ana');\n",
    );
    assert!(valid.diagnostics.is_empty(), "{:?}", valid.diagnostics.first().map(|d| &d.message));
    let cases = [
        ("AgentAvatar(c).mood('happy')", "Unknown agentMood token 'happy' for .mood()"),
        ("AgentAvatar(c).size('huge')", "Unknown avatarSize token 'huge' for .size()"),
        ("AgentAvatar(c).tint('lime')", "AgentAvatar has no modifier .tint()"),
    ];
    for (chain, message) in cases {
        let output = check(&format!("export const x = (c) => {chain};\n"));
        assert_eq!(output.diagnostics[0].message, message, "{chain}");
    }
}

#[test]
fn the_chat_composer_family_is_checked() {
    let imports = "import { AttachmentMenu, ChatComposer, ComposerBanner, ComposerIconButton, EmojiPicker, ReactionPicker, SuggestionList, VStack } from '@oxy.so/bloom-language';\n";
    let check = |body: &str| compile(&format!("{imports}{body}"), "row.tsx");
    let valid = check(
        "export const x = (t, i, s, g, m) => VStack(ChatComposer(t).disabled(), ComposerBanner('reply', 'Ana').tint('success/half'), ComposerIconButton(i, 'Send').tint('accent').size('4xl').iconSize('lg').disabled(), SuggestionList('mention', s).size('sm').loading(), AttachmentMenu(m).style('list').columns(3), EmojiPicker(g).size('lg'), ReactionPicker().size('sm').surface(false));\n",
    );
    assert!(valid.diagnostics.is_empty(), "{:?}", valid.diagnostics.first().map(|d| &d.message));
    let cases = [
        (
            "ComposerIconButton(i, 'a').tint('primary')",
            "Unknown composerButtonTone token 'primary' for .tint()",
        ),
        ("ComposerIconButton(i, 'a').size('huge')", "Unknown space token 'huge' for .size()"),
        ("ComposerIconButton(i, 'a').iconSize('big')", "Unknown iconSize token 'big' for .iconSize()"),
        ("ComposerBanner('reply', 'a').tint('gold')", "Unknown color token 'gold' for .tint()"),
        ("AttachmentMenu(i).style('tiles')", "Unknown attachmentLayout token 'tiles' for .style()"),
        ("ReactionPicker().size('lg')", "Unknown reactionPickerSize token 'lg' for .size()"),
        ("SuggestionList('mention', i).size('xl')", "Unknown controlSize token 'xl' for .size()"),
        ("ChatComposer(i).tint('accent')", "ChatComposer has no modifier .tint()"),
    ];
    for (chain, message) in cases {
        let output = check(&format!("export const x = (i) => {chain};\n"));
        assert_eq!(output.diagnostics[0].message, message, "{chain}");
    }
}

#[test]
fn chart_cards_are_checked() {
    let imports = "import { AreaChartCard, BarListCard, ChartCardSurface, ChartStatTiles, LineChartCard, RadarChartCard, Sparkline, StepsCard, VStack } from '@oxy.so/bloom-language';\n";
    let check = |body: &str| compile(&format!("{imports}{body}"), "row.tsx");
    let valid = check(
        "export const x = (d) => VStack(AreaChartCard({ data: d }).style('percent').shape('sharp'), BarListCard().tint('success'), ChartCardSurface(d).spacing('sm'), LineChartCard().shape('curved').tint('primary').activeTint('error/half'), RadarChartCard().style('score'), Sparkline(d).tint('negative'), StepsCard(d).tint('info').activeTint('primary'), ChartStatTiles(d).activeIndex([1, d]));\n",
    );
    assert!(valid.diagnostics.is_empty(), "{:?}", valid.diagnostics.first().map(|d| &d.message));
    let cases = [
        ("AreaChartCard().style('stream')", "Unknown areaVariant token 'stream' for .style()"),
        ("AreaChartCard().shape('step')", "Unknown chartShape token 'step' for .shape()"),
        ("RadarChartCard().style('filled-dots')", "Unknown radarVariant token 'filled-dots' for .style()"),
        ("Sparkline(d).tint('primary')", "Unknown sparklineTone token 'primary' for .tint()"),
        ("LineChartCard().activeTint('gold')", "Unknown color token 'gold' for .activeTint()"),
        ("ChartCardSurface(d).spacing('roomy')", "Unknown space token 'roomy' for .spacing()"),
        ("RadarChartCard().tint('primary')", "RadarChartCard has no modifier .tint()"),
    ];
    for (chain, message) in cases {
        let output = check(&format!("export const x = (d) => {chain};\n"));
        assert_eq!(output.diagnostics[0].message, message, "{chain}");
    }
}

#[test]
fn the_composer_panel_is_checked() {
    let imports = "import { ComposerPanel, ComposerPanelStatusTab, ComposerPill, VStack } from '@oxy.so/bloom-language';\n";
    let check = |body: &str| compile(&format!("{imports}{body}"), "row.tsx");
    let valid = check(
        "export const x = (p) => VStack(ComposerPanel(p, { busy: true }).disabled(), ComposerPill(p).surface(false).disabled(), ComposerPanelStatusTab({ branch: 'main' }));\n",
    );
    assert!(valid.diagnostics.is_empty(), "{:?}", valid.diagnostics.first().map(|d| &d.message));
    let cases = [
        ("ComposerPanel(p).surface(false)", "ComposerPanel has no modifier .surface()"),
        ("ComposerPill(p).size('sm')", "ComposerPill has no modifier .size()"),
        ("ComposerPanelStatusTab().loading()", "ComposerPanelStatusTab has no modifier .loading()"),
    ];
    for (chain, message) in cases {
        let output = check(&format!("export const x = (p) => {chain};\n"));
        assert_eq!(output.diagnostics[0].message, message, "{chain}");
    }
}

#[test]
fn the_ai_chat_is_checked() {
    let imports = "import { AiChatAssistantMessage, AiChatContainer, AiChatMessageLine, AiChatThread, AiChatUserMessage } from '@oxy.so/bloom-language';\n";
    let check = |body: &str| compile(&format!("{imports}{body}"), "row.tsx");
    let valid = check(
        "export const x = (t) => AiChatContainer(AiChatThread([AiChatUserMessage(AiChatMessageLine(t)).id('u'), AiChatAssistantMessage(AiChatMessageLine(t).tint('secondary').selectable(false)).id('a')]), { title: 'Trip' });\n",
    );
    assert!(valid.diagnostics.is_empty(), "{:?}", valid.diagnostics.first().map(|d| &d.message));
    let cases = [
        ("AiChatMessageLine(t).tint('muted')", "Unknown aiChatLineTone token 'muted' for .tint()"),
        ("AiChatUserMessage(t).tint('primary')", "AiChatUserMessage has no modifier .tint()"),
    ];
    for (chain, message) in cases {
        let output = check(&format!("export const x = (t) => {chain};\n"));
        assert_eq!(output.diagnostics[0].message, message, "{chain}");
    }
}

#[test]
fn stat_cards_and_media_controls_are_checked() {
    let imports = "import { PlaybackProgress, PlayButton, StatCard, StatCards, VStack } from '@oxy.so/bloom-language';\n";
    let check = |body: &str| compile(&format!("{imports}{body}"), "row.tsx");
    let valid = check(
        "export const x = (s, p) => VStack(StatCard(s).style('footer'), StatCards(s).style('plain').columns(3), PlayButton(p).size('lg').style('inverse').loading().disabled(), PlaybackProgress(1, 2).style('below').disabled());\n",
    );
    assert!(valid.diagnostics.is_empty(), "{:?}", valid.diagnostics.first().map(|d| &d.message));
    let cases = [
        ("StatCards(s).style('tiles')", "Unknown statCardsVariant token 'tiles' for .style()"),
        ("PlayButton(s).size('xl')", "Unknown playButtonSize token 'xl' for .size()"),
        ("PlayButton(s).style('solid')", "Unknown playButtonStyle token 'solid' for .style()"),
        ("PlaybackProgress(1, 2).style('above')", "Unknown playbackTimes token 'above' for .style()"),
        ("StatCard(s).columns(2)", "StatCard has no modifier .columns()"),
    ];
    for (chain, message) in cases {
        let output = check(&format!("export const x = (s) => {chain};\n"));
        assert_eq!(output.diagnostics[0].message, message, "{chain}");
    }
}

#[test]
fn the_agent_families_are_checked() {
    let imports = "import { AgentLogToolCall, AgentProgressLoadingText, AgentThinking, ComposerLoader, Questionnaire, VStack } from '@oxy.so/bloom-language';\n";
    let check = |body: &str| compile(&format!("{imports}{body}"), "row.tsx");
    let valid = check(
        "export const x = (c, q) => VStack(AgentThinking(c).style('stars').tint('accent'), AgentProgressLoadingText('a').lines(1), AgentLogToolCall('read', 'done'), ComposerLoader(c, { phase: 'streaming' }), Questionnaire(q));\n",
    );
    assert!(valid.diagnostics.is_empty(), "{:?}", valid.diagnostics.first().map(|d| &d.message));
    let cases = [
        ("AgentThinking(c).style('dots')", "Unknown agentThinkingStyle token 'dots' for .style()"),
        ("AgentThinking(c).tint('success')", "Unknown agentThinkingTone token 'success' for .tint()"),
        ("ComposerLoader(c).tint('primary')", "ComposerLoader has no modifier .tint()"),
        ("AgentProgressLoadingText('a').size('sm')", "AgentProgressLoadingText has no modifier .size()"),
    ];
    for (chain, message) in cases {
        let output = check(&format!("export const x = (c) => {chain};\n"));
        assert_eq!(output.diagnostics[0].message, message, "{chain}");
    }
}

#[test]
fn the_chat_families_are_checked() {
    let imports = "import { ChatBackground, ChatDateHeader, ChatHeader, ChatInfoPanel, FileMessage, ImageMessage, SharedMediaGrid, TypingDots, VideoMessage, VStack } from '@oxy.so/bloom-language';\n";
    let check = |body: &str| compile(&format!("{imports}{body}"), "row.tsx");
    let valid = check(
        "export const x = (s) => VStack(ChatBackground().style('gradient').tint('primary/half'), ChatDateHeader('Today').style('inline'), ChatHeader('Ana').tint('accent'), ChatInfoPanel().style('screen'), FileMessage('a').style('compact').tint('outgoing').bubbleTint('primary').contentTint('onPrimary'), ImageMessage(s).placeholderTint('mutedFill'), SharedMediaGrid(s).columns(3).spacing('2xs'), TypingDots().tint('muted'), VideoMessage(s).style('videoNote'));\n",
    );
    assert!(valid.diagnostics.is_empty(), "{:?}", valid.diagnostics.first().map(|d| &d.message));
    let cases = [
        ("ChatBackground().style('photo')", "Unknown chatBackgroundStyle token 'photo' for .style()"),
        ("ChatDateHeader('a').style('sticky')", "Unknown chatDateHeaderStyle token 'sticky' for .style()"),
        ("ChatHeader('a').tint('primary')", "Unknown chatStatusTone token 'primary' for .tint()"),
        ("ChatInfoPanel().style('sheet')", "Unknown chatInfoPanelStyle token 'sheet' for .style()"),
        ("FileMessage('a').tint('left')", "Unknown messageTone token 'left' for .tint()"),
        ("FileMessage('a').style('card')", "Unknown fileMessageStyle token 'card' for .style()"),
        ("VideoMessage(s).style('round')", "Unknown videoMessageStyle token 'round' for .style()"),
        ("ImageMessage(s).bubbleTint('blue')", "Unknown color token 'blue' for .bubbleTint()"),
    ];
    for (chain, message) in cases {
        let output = check(&format!("export const x = (s) => {chain};\n"));
        assert_eq!(output.diagnostics[0].message, message, "{chain}");
    }
}

#[test]
fn listings_and_media_are_checked() {
    let imports = "import { FollowButton, ListingHeader, ListingPhotoGrid, MapPriceMarker, ReviewCard, Shelf, VStack } from '@oxy.so/bloom-language';\n";
    let check = |body: &str| compile(&format!("{imports}{body}"), "row.tsx");
    let valid = check(
        "export const x = (b, p) => VStack(FollowButton(b).style('outline').tint('neutral').size('lg').loading(), ListingHeader('a').size('medium'), ListingPhotoGrid(p).style('carousel'), MapPriceMarker('€1').style('visited').size('compact'), ReviewCard('a', 'b').lines(3), Shelf('a', p).style('paged').spacing('md'));\n",
    );
    assert!(valid.diagnostics.is_empty(), "{:?}", valid.diagnostics.first().map(|d| &d.message));
    let cases = [
        ("FollowButton(b).size('xl')", "Unknown followButtonSize token 'xl' for .size()"),
        ("ListingHeader('a').size('small')", "Unknown listingHeaderSize token 'small' for .size()"),
        ("ListingPhotoGrid(b).style('mosaic')", "Unknown listingPhotoLayout token 'mosaic' for .style()"),
        ("MapPriceMarker('a').style('selected')", "Unknown mapMarkerState token 'selected' for .style()"),
        ("MapPriceMarker('a').size('large')", "Unknown mapPriceMarkerSize token 'large' for .size()"),
        ("Shelf('a', b).style('list')", "Unknown shelfLayout token 'list' for .style()"),
    ];
    for (chain, message) in cases {
        let output = check(&format!("export const x = (b) => {chain};\n"));
        assert_eq!(output.diagnostics[0].message, message, "{chain}");
    }
}

#[test]
fn the_card_form_is_checked() {
    let imports =
        "import { CardForm, CardFormCountry, CardFormPostcode, VStack } from '@oxy.so/bloom-language';\n";
    let check = |body: &str| compile(&format!("{imports}{body}"), "row.tsx");
    let valid = check(
        "export const x = (c, s, l) => VStack(CardForm(c).disabled(), CardFormCountry(s, l).disabled(false), CardFormPostcode(s));\n",
    );
    assert!(valid.diagnostics.is_empty(), "{:?}", valid.diagnostics.first().map(|d| &d.message));
    let output = check("export const x = (c) => CardForm(c).size('sm');\n");
    assert_eq!(output.diagnostics[0].message, "CardForm has no modifier .size()");
}

#[test]
fn the_checkout_sheet_is_checked() {
    let imports = "import { CheckoutSheet } from '@oxy.so/bloom-language';\n";
    let check = |body: &str| compile(&format!("{imports}{body}"), "row.tsx");
    let valid = check("export const x = (o) => CheckoutSheet(o).label('Checkout');\n");
    assert!(valid.diagnostics.is_empty(), "{:?}", valid.diagnostics.first().map(|d| &d.message));
    let output = check("export const x = (o) => CheckoutSheet(o).style('solid');\n");
    assert_eq!(output.diagnostics[0].message, "CheckoutSheet has no modifier .style()");
}

#[test]
fn a_gradient_is_checked_colour_by_colour() {
    let imports =
        "import { ChatBackground, ComposerLoader, StoryRing, VStack } from '@oxy.so/bloom-language';\n";
    let check = |body: &str| compile(&format!("{imports}{body}"), "row.tsx");
    let valid = check(
        "export const x = (c, brand) => VStack(ComposerLoader(c).gradient(['primary', 'accent', brand.color.sky, 'info/half']), ChatBackground().style('gradient').gradient(['primary', 'secondary']), StoryRing(c, { size: 'xl' }).gradient(['accent']));\n",
    );
    assert!(valid.diagnostics.is_empty(), "{:?}", valid.diagnostics.first().map(|d| &d.message));
    for (call, message) in [
        (
            "StoryRing(c, { size: 'xl' }).gradient(['accent', 'pink'])",
            "Unknown color token 'pink' for .gradient()",
        ),
        ("ChatBackground().gradient(['primary/12'])", "Unknown opacity token '12' for .gradient()"),
        ("ComposerLoader(c).gradient('primary')", ".gradient() takes a list of colours, not 'primary'"),
        ("ChatBackground().gradient(['primary'], 'accent')", ".gradient() takes 1 argument(s), not 2"),
        ("ChatHeader('Ana').gradient(['primary'])", "ChatHeader has no modifier .gradient()"),
    ] {
        let output = check(&format!(
            "import {{ ChatHeader }} from '@oxy.so/bloom-language';\nexport const x = (c) => {call};\n"
        ));
        assert_eq!(output.diagnostics.first().map(|d| d.message.as_str()), Some(message), "{call}");
    }
}

#[test]
fn the_stay_filters_are_checked() {
    let imports =
        "import { FeatureFilter, FilterTriggerButton, PriceRangeFilter } from '@oxy.so/bloom-language';\n";
    let check = |body: &str| compile(&format!("{imports}{body}"), "row.tsx");
    let valid = check(
        "export const x = (s, r) => [FeatureFilter(s).style('checkboxes'), \
         FilterTriggerButton(2).size('lg').disabled(), PriceRangeFilter(r, { min: 0, max: 9 }).style('log')];\n",
    );
    assert!(valid.diagnostics.is_empty(), "{:?}", valid.diagnostics.first().map(|d| &d.message));
    let output = check("export const x = (s) => FeatureFilter(s).style('grid');\n");
    assert_eq!(output.diagnostics[0].message, "Unknown featureFilterStyle token 'grid' for .style()");
    let output = check("export const x = () => FilterTriggerButton(1).size('xl');\n");
    assert_eq!(output.diagnostics[0].message, "Unknown filterTriggerSize token 'xl' for .size()");
    let output = check("export const x = (r) => PriceRangeFilter(r, {}).tint('accent');\n");
    assert_eq!(output.diagnostics[0].message, "PriceRangeFilter has no modifier .tint()");
}

#[test]
fn the_stay_search_is_checked() {
    let imports = "import { GuestPicker, StaySearchStep } from '@oxy.so/bloom-language';\n";
    let check = |body: &str| compile(&format!("{imports}{body}"), "row.tsx");
    let valid = check("export const x = (g) => GuestPicker(g).size('sm').label('Guests');\n");
    assert!(valid.diagnostics.is_empty(), "{:?}", valid.diagnostics.first().map(|d| &d.message));
    let output = check("export const x = (g) => GuestPicker(g).size('lg');\n");
    assert_eq!(output.diagnostics[0].message, "Unknown guestPickerSize token 'lg' for .size()");
    let output = check("export const x = (c) => StaySearchStep('Where', c, {}).style('solid');\n");
    assert_eq!(output.diagnostics[0].message, "StaySearchStep has no modifier .style()");
}

#[test]
fn the_tenancy_eviction_and_review_families_are_checked() {
    let imports = "import { DocumentList, EvictionReportCard, LeaseSummaryCard, RentPaymentList, TenancyTimeline, VStack, WriteReviewPrompt } from '@oxy.so/bloom-language';\n";
    let check = |body: &str| compile(&format!("{imports}{body}"), "row.tsx");
    let valid = check(
        "export const x = (o, p, d, e) => VStack(TenancyTimeline(e).density('compact'), LeaseSummaryCard(o).style('wide'), RentPaymentList(p).style('narrow').tint('error'), DocumentList(d).style('auto'), EvictionReportCard(o).lines(3), WriteReviewPrompt('Tilos 27', o).label('Review'));\n",
    );
    assert!(valid.diagnostics.is_empty(), "{:?}", valid.diagnostics.first().map(|d| &d.message));
    for (call, message) in [
        ("LeaseSummaryCard(o).style('grid')", "Unknown tenancyLayout token 'grid' for .style()"),
        ("RentPaymentList(o).tint('warning')", "Unknown rentOutstandingTone token 'warning' for .tint()"),
        ("TenancyTimeline(o).density('cozy')", "Unknown density token 'cozy' for .density()"),
        ("EvictionReportCard(o).style('solid')", "EvictionReportCard has no modifier .style()"),
    ] {
        let output = check(&format!("export const x = (o) => {call};\n"));
        assert_eq!(output.diagnostics.first().map(|d| d.message.as_str()), Some(message), "{call}");
    }
}

#[test]
fn the_project_board_and_the_activity_feed_are_checked() {
    let imports =
        "import { ProjectBoard, BoardDragHandle, ActivityFeed, Text } from '@oxy.so/bloom-language';\n";
    let check = |body: &str| compile(&format!("{imports}{body}"), "row.tsx");
    let valid = check(
        "export const x = (c, o, e) => [ProjectBoard(c, o).label('Board'), BoardDragHandle(Text('Move')).onPress(() => {}), ActivityFeed(e).style('none').density('compact').lines(2)];\n",
    );
    assert!(valid.diagnostics.is_empty(), "{:?}", valid.diagnostics.first().map(|d| &d.message));
    let output = check("export const x = (e) => ActivityFeed(e).style('week');\n");
    assert_eq!(output.diagnostics[0].message, "Unknown activityFeedGrouping token 'week' for .style()");
    let output = check("export const x = (c, o) => ProjectBoard(c, o).size('sm');\n");
    assert_eq!(output.diagnostics[0].message, "ProjectBoard has no modifier .size()");
}

#[test]
fn the_call_screens_are_checked() {
    let imports = "import { CallScreen, IncomingCallScreen } from '@oxy.so/bloom-language';\n";
    let check = |body: &str| compile(&format!("{imports}{body}"), "row.tsx");
    let valid =
        check("export const x = (n) => CallScreen(n, 'active').style('video').size('md').tint('primary');\n");
    assert!(valid.diagnostics.is_empty(), "{:?}", valid.diagnostics.first().map(|d| &d.message));
    let output = check("export const x = (n) => IncomingCallScreen(n).answerStyle('swipe');\n");
    assert_eq!(output.diagnostics[0].message, "Unknown incomingCallAnswer token 'swipe' for .answerStyle()");
    let output = check("export const x = (n) => CallScreen(n, 'active').style('audio');\n");
    assert_eq!(output.diagnostics[0].message, "Unknown callMode token 'audio' for .style()");
}

#[test]
fn the_people_beside_a_chat_are_checked() {
    let imports =
        "import { NewGroupForm, SelectedChipsRow, StoryViewer, VStack } from '@oxy.so/bloom-language';\n";
    let check = |body: &str| compile(&format!("{imports}{body}"), "row.tsx");
    let valid = check(
        "export const x = (p, s, n) => VStack(SelectedChipsRow(p).style('wrap'), StoryViewer(s, 0, { name: 'Ana', time: '2h' }).label('Story'), NewGroupForm(n));\n",
    );
    assert!(valid.diagnostics.is_empty(), "{:?}", valid.diagnostics.first().map(|d| &d.message));
    let output = check("export const x = (p) => SelectedChipsRow(p).style('grid');\n");
    assert_eq!(output.diagnostics[0].message, "Unknown selectedChipsLayout token 'grid' for .style()");
    let output = check("export const x = (n) => NewGroupForm(n).style('wrap');\n");
    assert_eq!(output.diagnostics[0].message, "NewGroupForm has no modifier .style()");
}

#[test]
fn the_message_bubbles_are_checked() {
    let imports =
        "import { MessageBubble, MessageList, TypingBubble, VStack } from '@oxy.so/bloom-language';\n";
    let check = |body: &str| compile(&format!("{imports}{body}"), "row.tsx");
    let valid = check(
        "export const x = (t, items) => VStack(MessageBubble('outgoing', t).groupPosition('last').mediaFit('inset').tail().metaOverlay(false).senderTint('success/half'), TypingBubble().label('Ana is typing'), MessageList(items));\n",
    );
    assert!(valid.diagnostics.is_empty(), "{:?}", valid.diagnostics.first().map(|d| &d.message));
    for (call, message) in [
        (
            "MessageBubble('incoming', t).groupPosition('top')",
            "Unknown messagePosition token 'top' for .groupPosition()",
        ),
        (
            "MessageBubble('incoming', t).mediaFit('cover')",
            "Unknown messageMediaFit token 'cover' for .mediaFit()",
        ),
        ("MessageBubble('incoming', t).senderTint('pink')", "Unknown color token 'pink' for .senderTint()"),
        ("TypingBubble().tail()", "TypingBubble has no modifier .tail()"),
    ] {
        let output = check(&format!("export const x = (t) => {call};\n"));
        assert_eq!(output.diagnostics.first().map(|d| d.message.as_str()), Some(message), "{call}");
    }
}

#[test]
fn the_order_status_the_lockup_and_the_ambient_photo_are_checked() {
    let imports = "import { OrderStatusBar, OrderStatusTimeline, Lockup, LockupSkeleton, AmbientPhoto, VStack } from '@oxy.so/bloom-language';\n";
    let check = |body: &str| compile(&format!("{imports}{body}"), "row.tsx");
    let valid = check(
        "export const x = (s, u) => VStack(OrderStatusBar('Cooking').style('plain').tint('tertiary'), OrderStatusTimeline(s).axis('horizontal').density('compact'), Lockup('Atlas').size('lg').shape('circle').divider().lines(2), LockupSkeleton().size('sm').divider(false), AmbientPhoto(u));\n",
    );
    assert!(valid.diagnostics.is_empty(), "{:?}", valid.diagnostics.first().map(|d| &d.message));
    for (call, message) in [
        ("OrderStatusBar('a').tint('danger')", "Unknown accentTone token 'danger' for .tint()"),
        ("OrderStatusBar('a').style('solid')", "Unknown orderStatusBarStyle token 'solid' for .style()"),
        ("Lockup('a').size('xl')", "Unknown lockupSize token 'xl' for .size()"),
        ("Lockup('a').shape('blob')", "Unknown shapeName token 'blob' for .shape()"),
        ("AmbientPhoto(u).style('plain')", "AmbientPhoto has no modifier .style()"),
    ] {
        let output = check(&format!("export const x = (u) => {call};\n"));
        assert_eq!(output.diagnostics.first().map(|d| d.message.as_str()), Some(message), "{call}");
    }
}

#[test]
fn the_map_chrome_is_checked() {
    let imports = "import { MapScaleBar, MapControls, LocationPuck } from '@oxy.so/bloom-language';\n";
    let check = |body: &str| compile(&format!("{imports}{body}"), "row.tsx");
    let valid = check(
        "export const x = (s, o) => [MapScaleBar(s).style('inline'), MapControls(o).axis('horizontal').align('start'), \
         LocationPuck(o).style('navigating')];\n",
    );
    assert!(valid.diagnostics.is_empty(), "{:?}", valid.diagnostics.first().map(|d| &d.message));
    let output = check("export const x = (s) => MapScaleBar(s).style('floating');\n");
    assert_eq!(output.diagnostics[0].message, "Unknown mapAttributionStyle token 'floating' for .style()");
    let output = check("export const x = (o) => LocationPuck(o).size('sm');\n");
    assert_eq!(output.diagnostics[0].message, "LocationPuck has no modifier .size()");
}

#[test]
fn the_places_are_checked() {
    let imports =
        "import { PlaceCard, PlaceListCard, DirectionsSteps, PlacePicker } from '@oxy.so/bloom-language';\n";
    let check = |body: &str| compile(&format!("{imports}{body}"), "row.tsx");
    let valid = check(
        "export const x = (l, p, q, o) => [PlaceCard('Forner').style('detail').loading(), \
         PlaceListCard('Saved').tint('primary'), DirectionsSteps(l).size('compact'), \
         PlacePicker('Address', p, o).query(q).size('sm').disabled()];\n",
    );
    assert!(valid.diagnostics.is_empty(), "{:?}", valid.diagnostics.first().map(|d| &d.message));
    let output = check("export const x = () => PlaceCard('Forner').style('compact');\n");
    assert_eq!(output.diagnostics[0].message, "Unknown placeCardStyle token 'compact' for .style()");
    let output = check("export const x = (l) => DirectionsSteps(l).size('md');\n");
    assert_eq!(output.diagnostics[0].message, "Unknown directionsDensity token 'md' for .size()");
    let output = check("export const x = (p, o) => PlacePicker('Address', p, o).style('plain');\n");
    assert_eq!(output.diagnostics[0].message, "PlacePicker has no modifier .style()");
}

#[test]
fn mail_and_the_note_toolbar_are_checked() {
    let imports = "import { MailComposeSurface, MailRecipientField, NoteEditorToolbar } from '@oxy.so/bloom-language';\n";
    let check = |body: &str| compile(&format!("{imports}{body}"), "row.tsx");
    let valid = check(
        "export const x = (b, r, a) => [MailComposeSurface(b).style('sheet').loading(), \
         MailRecipientField(r).disabled(), NoteEditorToolbar('Formatting', a).size('sm').disabled()];\n",
    );
    assert!(valid.diagnostics.is_empty(), "{:?}", valid.diagnostics.first().map(|d| &d.message));
    let output = check("export const x = (b) => MailComposeSurface(b).style('floating');\n");
    assert_eq!(output.diagnostics[0].message, "Unknown mailComposeStyle token 'floating' for .style()");
    let output = check("export const x = (a) => NoteEditorToolbar('Formatting', a).size('lg');\n");
    assert_eq!(output.diagnostics[0].message, "Unknown noteToolbarSize token 'lg' for .size()");
    let output = check("export const x = (r) => MailRecipientField(r).size('sm');\n");
    assert_eq!(output.diagnostics[0].message, "MailRecipientField has no modifier .size()");
}

#[test]
fn the_booking_family_is_checked() {
    let imports = "import { BookingBar, BookingCard, PriceBreakdown, TripCard, VStack } from '@oxy.so/bloom-language';\n";
    let check = |body: &str| compile(&format!("{imports}{body}"), "row.tsx");
    let valid = check(
        "export const x = (r) => VStack(TripCard('Cabin').style('vertical'), BookingCard('$1', '2').loading().disabled(), BookingBar('$1').loading(), PriceBreakdown(r));\n",
    );
    assert!(valid.diagnostics.is_empty(), "{:?}", valid.diagnostics.first().map(|d| &d.message));
    let cases = [
        ("TripCard('a').style('wide')", "Unknown tripCardOrientation token 'wide' for .style()"),
        ("BookingBar('a').size('sm')", "BookingBar has no modifier .size()"),
        ("PriceBreakdown(r).loading()", "PriceBreakdown has no modifier .loading()"),
    ];
    for (chain, message) in cases {
        let output = check(&format!("export const x = (r) => {chain};\n"));
        assert_eq!(output.diagnostics[0].message, message, "{chain}");
    }
}

#[test]
fn the_home_search_family_is_checked() {
    let imports = "import { HomeSearchBar, PropertyTypePicker, SavedSearchCard, SearchModeTabs, VStack } from '@oxy.so/bloom-language';\n";
    let check = |body: &str| compile(&format!("{imports}{body}"), "row.tsx");
    let valid = check(
        "export const x = (s, m, t) => VStack(HomeSearchBar(s, m), SearchModeTabs(m).style('segmented'), PropertyTypePicker(t).columns(2).disabled(), SavedSearchCard('Flats').label('Open'));\n",
    );
    assert!(valid.diagnostics.is_empty(), "{:?}", valid.diagnostics.first().map(|d| &d.message));
    let cases = [
        ("SearchModeTabs(m).style('pill')", "Unknown searchModeTabsStyle token 'pill' for .style()"),
        ("HomeSearchBar(s, m).style('tabs')", "HomeSearchBar has no modifier .style()"),
        ("SavedSearchCard('a').loading()", "SavedSearchCard has no modifier .loading()"),
    ];
    for (chain, message) in cases {
        let output = check(&format!("export const x = (s, m) => {chain};\n"));
        assert_eq!(output.diagnostics[0].message, message, "{chain}");
    }
}

#[test]
fn the_listing_actions_are_checked() {
    let imports = "import { ListingActionBar, MortgageCalculator, RentalActionCard, SaleActionCard, VStack } from '@oxy.so/bloom-language';\n";
    let check = |body: &str| compile(&format!("{imports}{body}"), "row.tsx");
    let valid = check(
        "export const x = () => VStack(ListingActionBar('$1', 'Apply').loading().disabled(), MortgageCalculator().style('split'), RentalActionCard('$1').loading(), SaleActionCard('$1').loading());\n",
    );
    assert!(valid.diagnostics.is_empty(), "{:?}", valid.diagnostics.first().map(|d| &d.message));
    let cases = [
        ("MortgageCalculator().style('wide')", "Unknown mortgageLayout token 'wide' for .style()"),
        ("RentalActionCard('a').pressed(true)", "RentalActionCard has no modifier .pressed()"),
        ("ListingActionBar('a', 'b').style('auto')", "ListingActionBar has no modifier .style()"),
    ];
    for (chain, message) in cases {
        let output = check(&format!("export const x = () => {chain};\n"));
        assert_eq!(output.diagnostics[0].message, message, "{chain}");
    }
}

#[test]
fn the_listing_cards_are_checked() {
    let imports =
        "import { ListingCard, ListingCardGrid, WishlistCard, VStack } from '@oxy.so/bloom-language';\n";
    let check = |body: &str| compile(&format!("{imports}{body}"), "row.tsx");
    let valid = check(
        "export const x = (p, c) => VStack(ListingCard('Flat', p).style('horizontal').density('compact').loading(), ListingCardGrid(c).density('results'), WishlistCard('Summer', p).tint('primary/half'));\n",
    );
    assert!(valid.diagnostics.is_empty(), "{:?}", valid.diagnostics.first().map(|d| &d.message));
    let cases = [
        ("ListingCard('a', p).style('grid')", "Unknown listingCardLayout token 'grid' for .style()"),
        // A density is the node's own: the grid's comfortable one is Bloom's `results`.
        ("ListingCardGrid(c).density('comfortable')", "Unknown density token 'comfortable' for .density()"),
        ("ListingCard('a', p).density('results')", "Unknown density token 'results' for .density()"),
        ("WishlistCard('a', p).tint('pink')", "Unknown color token 'pink' for .tint()"),
    ];
    for (chain, message) in cases {
        let output = check(&format!("export const x = (p, c) => {chain};\n"));
        assert_eq!(output.diagnostics[0].message, message, "{chain}");
    }
}

#[test]
fn the_listing_editor_and_the_offering_badge_are_checked() {
    let imports = "import { ListingPreviewPane, ListingQualityMeter, OfferingBadge, PropertyTypeSelector, VStack } from '@oxy.so/bloom-language';\n";
    let check = |body: &str| compile(&format!("{imports}{body}"), "row.tsx");
    let valid = check(
        "export const x = (l, i, t) => VStack(ListingPreviewPane(l), ListingQualityMeter(i).label('Quality'), PropertyTypeSelector(t).columns(3).disabled(), OfferingBadge('sale').size('sm').style('onMedia'));\n",
    );
    assert!(valid.diagnostics.is_empty(), "{:?}", valid.diagnostics.first().map(|d| &d.message));
    let cases = [
        ("OfferingBadge('sale').size('lg')", "Unknown offeringBadgeSize token 'lg' for .size()"),
        ("OfferingBadge('sale').style('solid')", "Unknown offeringBadgeStyle token 'solid' for .style()"),
        ("ListingQualityMeter(i).loading()", "ListingQualityMeter has no modifier .loading()"),
    ];
    for (chain, message) in cases {
        let output = check(&format!("export const x = (i) => {chain};\n"));
        assert_eq!(output.diagnostics[0].message, message, "{chain}");
    }
}

#[test]
fn the_price_insights_are_checked() {
    let imports = "import { PriceEstimate, PricePerAreaComparison, VStack } from '@oxy.so/bloom-language';\n";
    let check = |body: &str| compile(&format!("{imports}{body}"), "row.tsx");
    let valid = check(
        "export const x = (r) => VStack(PriceEstimate(1, 2, 'high').padding('md'), PricePerAreaComparison(r).label('Price per m²'));\n",
    );
    assert!(valid.diagnostics.is_empty(), "{:?}", valid.diagnostics.first().map(|d| &d.message));
    let output = check("export const x = (r) => PricePerAreaComparison(r).style('bars');\n");
    assert_eq!(output.diagnostics[0].message, "PricePerAreaComparison has no modifier .style()");
}

#[test]
fn the_month_calendar_is_checked() {
    let imports = "import { CalendarView, CalendarViewHeader, CalendarViewMonthGrid, VStack } from '@oxy.so/bloom-language';\n";
    let check = |body: &str| compile(&format!("{imports}{body}"), "row.tsx");
    let valid = check(
        "export const x = (e, m, o) => VStack(CalendarView(e).density('compact'), CalendarViewHeader(m, o).label('Month'), CalendarViewMonthGrid(m, e).density('default'));\n",
    );
    assert!(valid.diagnostics.is_empty(), "{:?}", valid.diagnostics.first().map(|d| &d.message));
    let output = check("export const x = (e) => CalendarView(e).density('cozy');\n");
    assert_eq!(output.diagnostics[0].message, "Unknown density token 'cozy' for .density()");
    let output = check("export const x = (m, o) => CalendarViewHeader(m, o).density('compact');\n");
    assert_eq!(output.diagnostics[0].message, "CalendarViewHeader has no modifier .density()");
}

#[test]
fn the_action_bars_orientation_and_tone_are_checked() {
    let imports = "import { Action, ActionBar } from '@oxy.so/bloom-language';\n";
    let check = |body: &str| compile(&format!("{imports}{body}"), "row.tsx");
    let valid = check(
        "export const x = (i) => ActionBar(Action(i, 'Like')).axis('vertical').size('lg').tint('onImage').showZeroCounts();\n",
    );
    assert!(valid.diagnostics.is_empty(), "{:?}", valid.diagnostics.first().map(|d| &d.message));
    let output = check("export const x = (i) => ActionBar(Action(i, 'Like')).tint('accent');\n");
    assert_eq!(output.diagnostics[0].message, "Unknown engagementBarTone token 'accent' for .tint()");
    let output = check("export const x = (i) => Action(i, 'Like').showZeroCounts();\n");
    assert_eq!(output.diagnostics[0].message, "Action has no modifier .showZeroCounts()");
}

#[test]
fn the_chat_screens_secondary_looks_are_checked() {
    let imports =
        "import { ChatHeader, DocumentGrid, PinnedMessageBar, VStack } from '@oxy.so/bloom-language';\n";
    let check = |body: &str| compile(&format!("{imports}{body}"), "row.tsx");
    let valid = check(
        "export const x = (p, d) => VStack(ChatHeader('Ana').presentation('bar').titleAlign('center').titleLayout('stacked').titleAppearance('capsule').density('compact').dividers(false), PinnedMessageBar(p).dismissIcon('unpin'), DocumentGrid(d).dividers());\n",
    );
    assert!(valid.diagnostics.is_empty(), "{:?}", valid.diagnostics.first().map(|d| &d.message));
    let cases = [
        ("ChatHeader('a').titleLayout('rows')", "Unknown titleLayout token 'rows' for .titleLayout()"),
        ("ChatHeader('a').titleAlign('end')", "Unknown titleAlign token 'end' for .titleAlign()"),
        (
            "ChatHeader('a').titleAppearance('pill')",
            "Unknown titleAppearance token 'pill' for .titleAppearance()",
        ),
        (
            "ChatHeader('a').presentation('sheet')",
            "Unknown headerPresentation token 'sheet' for .presentation()",
        ),
        ("PinnedMessageBar(b).dismissIcon('trash')", "Unknown dismissIcon token 'trash' for .dismissIcon()"),
        ("DocumentGrid(b).titleLayout('inline')", "DocumentGrid has no modifier .titleLayout()"),
    ];
    for (chain, message) in cases {
        let output = check(&format!("export const x = (b) => {chain};\n"));
        assert_eq!(output.diagnostics[0].message, message, "{chain}");
    }
}

#[test]
fn the_agent_families_secondary_looks_are_checked() {
    let imports = "import { AgentProgressLoadingText, ComposerLoader, ConversationSidebar, VStack } from '@oxy.so/bloom-language';\n";
    let check = |body: &str| compile(&format!("{imports}{body}"), "row.tsx");
    let valid = check(
        "export const x = (c, s) => VStack(AgentProgressLoadingText('Searching').textVariant('caption-1-medium'), ComposerLoader(c).blend('screen').bloomOnly().surface(false), ConversationSidebar(s, [c, s], {}).destination([c, s]).style('rail').size('sm').sidebarSurface('docked').contentAlignment('center').primaryActionPlacement('top').railLabels('hidden').railSelection('icon').modesPresentation('toggle').scrollbarSide('start').teamPlacement('header'));\n",
    );
    assert!(valid.diagnostics.is_empty(), "{:?}", valid.diagnostics.first().map(|d| &d.message));
    let cases = [
        (
            "AgentProgressLoadingText('a').textVariant('body')",
            "Unknown typeRamp token 'body' for .textVariant()",
        ),
        ("ComposerLoader(c).blend('add')", "Unknown blend token 'add' for .blend()"),
        ("ConversationSidebar(c, {}).style('drawer')", "Unknown sidebarVariant token 'drawer' for .style()"),
        ("ConversationSidebar(c, {}).size('xl')", "Unknown sidebarSize token 'xl' for .size()"),
        (
            "ConversationSidebar(c, {}).sidebarSurface('glass')",
            "Unknown sidebarSurface token 'glass' for .sidebarSurface()",
        ),
        (
            "ConversationSidebar(c, {}).railSelection('dot')",
            "Unknown railSelection token 'dot' for .railSelection()",
        ),
        ("ComposerLoader(c).teamPlacement('header')", "ComposerLoader has no modifier .teamPlacement()"),
    ];
    for (chain, message) in cases {
        let output = check(&format!("export const x = (c) => {chain};\n"));
        assert_eq!(output.diagnostics[0].message, message, "{chain}");
    }
}

#[test]
fn the_other_secondary_looks_are_checked() {
    let imports = "import { AiChatContainer, AiChatShell, BarListCard, CheckoutSheet, ComposerPill, FollowButton, ListingHeaderAction, RadarChartCard, ShelfSkeleton, Sparkline, StageBarsCard, VStack } from '@oxy.so/bloom-language';\n";
    let check = |body: &str| compile(&format!("{imports}{body}"), "row.tsx");
    let valid = check(
        "export const x = (b, c, o, s) => VStack(FollowButton(b).material('lens').iconOnly(), ListingHeaderAction('Save').iconOnly(), ShelfSkeleton().round().eyebrow(), AiChatShell(c, s).sidebarSurface('docked').sidebarScrollbarSide('start').surface(false), AiChatContainer(c).surface(false).floatingChrome(), RadarChartCard(o).legend('overlay'), Sparkline(s).shape('sharp').filled(), BarListCard(o).mono(), StageBarsCard(o).mono(), CheckoutSheet(o).methodTitleAlign('center').methodTitleVariant('title-2-bold'), ComposerPill(b).frosted());\n",
    );
    assert!(valid.diagnostics.is_empty(), "{:?}", valid.diagnostics.first().map(|d| &d.message));
    let cases = [
        ("FollowButton(b).material('glass')", "Unknown buttonMaterial token 'glass' for .material()"),
        ("RadarChartCard(b).legend('left')", "Unknown radarLegend token 'left' for .legend()"),
        ("Sparkline(b).shape('round')", "Unknown chartShape token 'round' for .shape()"),
        (
            "CheckoutSheet(b).methodTitleAlign('start')",
            "Unknown methodTitleAlign token 'start' for .methodTitleAlign()",
        ),
        (
            "CheckoutSheet(b).methodTitleVariant('title-2')",
            "Unknown typeRamp token 'title-2' for .methodTitleVariant()",
        ),
        (
            "AiChatShell(b, {}).sidebarScrollbarSide('left')",
            "Unknown scrollbarSide token 'left' for .sidebarScrollbarSide()",
        ),
        ("StageBarsCard(b).legend('top')", "StageBarsCard has no modifier .legend()"),
    ];
    for (chain, message) in cases {
        let output = check(&format!("export const x = (b) => {chain};\n"));
        assert_eq!(output.diagnostics[0].message, message, "{chain}");
    }
}

#[test]
fn the_task_list_web_search_and_voice_controls_are_checked() {
    let imports = "import { TaskList, WebSearch, VoiceControls } from '@oxy.so/bloom-language';\n";
    let check = |body: &str| compile(&format!("{imports}{body}"), "row.tsx");
    let valid = check(
        "export const x = (t, s) => [TaskList(t).padding('md'), WebSearch(s), VoiceControls('listening').size('sm').disabled()];\n",
    );
    assert!(valid.diagnostics.is_empty(), "{:?}", valid.diagnostics.first().map(|d| &d.message));
    let output = check("export const x = () => VoiceControls().size('xs');\n");
    assert_eq!(output.diagnostics[0].message, "Unknown voiceSize token 'xs' for .size()");
    let output = check("export const x = (t) => TaskList(t).style('plain');\n");
    assert_eq!(output.diagnostics[0].message, "TaskList has no modifier .style()");
}

#[test]
fn the_agent_editor_identity_and_profile_card_are_checked() {
    let imports =
        "import { AgentCreatorField, AgentProfile, AiProfileCard, Text } from '@oxy.so/bloom-language';\n";
    let check = |body: &str| compile(&format!("{imports}{body}"), "row.tsx");
    let valid = check(
        "export const x = (a) => [AgentCreatorField('Name', Text('A')).multiline().divider(false), AgentProfile(a).label('Team'), AiProfileCard('Maya').tint('success/half')];\n",
    );
    assert!(valid.diagnostics.is_empty(), "{:?}", valid.diagnostics.first().map(|d| &d.message));
    let output = check("export const x = () => AiProfileCard('Maya').tint('violet');\n");
    assert_eq!(output.diagnostics[0].message, "Unknown color token 'violet' for .tint()");
    let output = check("export const x = (a) => AgentProfile(a).multiline();\n");
    assert_eq!(output.diagnostics[0].message, "AgentProfile has no modifier .multiline()");
}

#[test]
fn the_agent_chats_are_checked() {
    let imports = "import { AgentChat, AgentChatHistory, MultiAgentChat, SelectedAgentPreview } from '@oxy.so/bloom-language';\n";
    let check = |body: &str| compile(&format!("{imports}{body}"), "row.tsx");
    let valid = check(
        "export const x = (m, t, a, f) => [AgentChat(m).titleAlign('center').selection([a, f]), AgentChatHistory(t).surface(false).selection([a, f]), MultiAgentChat(), SelectedAgentPreview(a, { flights: f, anchor: 'p' })];\n",
    );
    assert!(valid.diagnostics.is_empty(), "{:?}", valid.diagnostics.first().map(|d| &d.message));
    let output = check("export const x = (m) => AgentChat(m).titleAlign('end');\n");
    assert_eq!(output.diagnostics[0].message, "Unknown titleAlign token 'end' for .titleAlign()");
    let output = check("export const x = (t) => AgentChatHistory(t).titleAlign('start');\n");
    assert_eq!(output.diagnostics[0].message, "AgentChatHistory has no modifier .titleAlign()");
}

#[test]
fn route_stops_note_cards_and_the_share_sheet_are_checked() {
    let imports = "import { NoteCard, NoteCardSkeleton, RouteStops, ShareSheet, VStack } from '@oxy.so/bloom-language';\n";
    let check = |body: &str| compile(&format!("{imports}{body}"), "row.tsx");
    let valid = check(
        "export const x = (s) => VStack(RouteStops(s).density('compact'), NoteCard('a').style('row').tint('warning').loading(), NoteCardSkeleton().style('grid').lines(2), ShareSheet().size('lg'));\n",
    );
    assert!(valid.diagnostics.is_empty(), "{:?}", valid.diagnostics.first().map(|d| &d.message));
    let cases = [
        ("NoteCard('a').style('list')", "Unknown noteCardLayout token 'list' for .style()"),
        ("NoteCard('a').tint('rose')", "Unknown accentTone token 'rose' for .tint()"),
        ("ShareSheet().size('xl')", "Unknown shareSheetSize token 'xl' for .size()"),
        ("RouteStops(b).size('sm')", "RouteStops has no modifier .size()"),
    ];
    for (chain, message) in cases {
        let output = check(&format!("export const x = (b) => {chain};\n"));
        assert_eq!(output.diagnostics[0].message, message, "{chain}");
    }
}

#[test]
fn the_generic_components_are_checked() {
    let imports = "import { ConnectionDots, OutlineNav, Pagination, ProgressiveBlur, Text, VStack } from '@oxy.so/bloom-language';\n";
    let check = |body: &str| compile(&format!("{imports}{body}"), "row.tsx");
    let valid = check(
        "export const x = (h, p) => VStack(ConnectionDots(Text('a'), Text('b')).label('Linking'), OutlineNav(h).style('compact'), Pagination(p, 4), ProgressiveBlur().frame({ height: '64' }));\n",
    );
    assert!(valid.diagnostics.is_empty(), "{:?}", valid.diagnostics.first().map(|d| &d.message));
    let cases = [
        ("OutlineNav(b).style('short')", "Unknown outlineNavStyle token 'short' for .style()"),
        ("Pagination(b, 4).size('sm')", "Pagination has no modifier .size()"),
        ("ProgressiveBlur().style('top')", "ProgressiveBlur has no modifier .style()"),
    ];
    for (chain, message) in cases {
        let output = check(&format!("export const x = (b) => {chain};\n"));
        assert_eq!(output.diagnostics[0].message, message, "{chain}");
    }
}

#[test]
fn addresses_and_payment_methods_are_checked() {
    let imports = "import { AddressList, AddressRow, PaymentMethodList, PaymentMethodRow, VStack } from '@oxy.so/bloom-language';\n";
    let check = |body: &str| compile(&format!("{imports}{body}"), "row.tsx");
    let valid = check(
        "export const x = (s, m) => VStack(AddressRow('Home').size('sm').density('compact').disabled(), AddressList(s).style('picker').density('comfortable').loading(), PaymentMethodRow().density('compact').disabled(), PaymentMethodList(m).style('list').loading());\n",
    );
    assert!(valid.diagnostics.is_empty(), "{:?}", valid.diagnostics.first().map(|d| &d.message));
    let cases = [
        ("AddressList(s).style('grid')", "Unknown choiceListStyle token 'grid' for .style()"),
        ("PaymentMethodList(s).style('menu')", "Unknown choiceListStyle token 'menu' for .style()"),
        ("AddressRow('a').density('cozy')", "Unknown density token 'cozy' for .density()"),
        ("AddressRow('a').density('default')", "Unknown density token 'default' for .density()"),
        ("AddressRow('a').tint('accent')", "AddressRow has no modifier .tint()"),
    ];
    for (chain, message) in cases {
        let output = check(&format!("export const x = (s) => {chain};\n"));
        assert_eq!(output.diagnostics[0].message, message, "{chain}");
    }
}

#[test]
fn the_price_breakdown_and_payment_status_are_checked() {
    let imports = "import { PaymentStatusBar, PaymentStatusBlock, PriceSummary, PriceSummaryLine, VStack } from '@oxy.so/bloom-language';\n";
    let check = |body: &str| compile(&format!("{imports}{body}"), "row.tsx");
    let valid = check(
        "export const x = (l) => VStack(PriceSummary(l).label('Price'), PriceSummaryLine('Promo').tint('discount'), PaymentStatusBar('paid').style('plain'), PaymentStatusBlock('failed').style('surface'));\n",
    );
    assert!(valid.diagnostics.is_empty(), "{:?}", valid.diagnostics.first().map(|d| &d.message));
    let cases = [
        ("PriceSummaryLine('a').tint('success')", "Unknown priceLineTone token 'success' for .tint()"),
        ("PaymentStatusBar('paid').style('card')", "Unknown paymentStatusStyle token 'card' for .style()"),
        ("PriceSummary(l).style('plain')", "PriceSummary has no modifier .style()"),
    ];
    for (chain, message) in cases {
        let output = check(&format!("export const x = (l) => {chain};\n"));
        assert_eq!(output.diagnostics[0].message, message, "{chain}");
    }
}

#[test]
fn the_crm_families_are_checked() {
    let imports =
        "import { ContactProfileCard, DealCard, PipelineBoard, VStack } from '@oxy.so/bloom-language';\n";
    let check = |body: &str| compile(&format!("{imports}{body}"), "row.tsx");
    let valid = check(
        "export const x = (s, r) => VStack(ContactProfileCard('a').density('compact'), DealCard('b'), PipelineBoard(s, r).style('single').stage([s, r]));\n",
    );
    assert!(valid.diagnostics.is_empty(), "{:?}", valid.diagnostics.first().map(|d| &d.message));
    let cases = [
        ("PipelineBoard(s, r).style('kanban')", "Unknown pipelineLayout token 'kanban' for .style()"),
        ("ContactProfileCard('a').density('cozy')", "Unknown density token 'cozy' for .density()"),
        ("DealCard('a').size('sm')", "DealCard has no modifier .size()"),
        ("DealCard('a').stage([s, r])", "DealCard has no modifier .stage()"),
    ];
    for (chain, message) in cases {
        let output = check(&format!("export const x = (s, r) => {chain};\n"));
        assert_eq!(output.diagnostics[0].message, message, "{chain}");
    }
}

#[test]
fn the_dashboard_cards_are_checked() {
    let imports = "import { ImportantAlertsCard, RecentHiresCard } from '@oxy.so/bloom-language';\n";
    let check = |body: &str| compile(&format!("{imports}{body}"), "row.tsx");
    let valid = check("export const x = (a, h) => RecentHiresCard(h, 4).padding('md');\n");
    assert!(valid.diagnostics.is_empty(), "{:?}", valid.diagnostics.first().map(|d| &d.message));
    let output = check("export const x = (a) => ImportantAlertsCard(a, 2).style('rose');\n");
    assert_eq!(output.diagnostics[0].message, "ImportantAlertsCard has no modifier .style()");
}

#[test]
fn the_cart_menu_items_and_vendor_card_are_checked() {
    let imports = "import { CartLine, CartPanel, CartPromoField, CartTipPicker, MenuItemOptions, MenuItemRow, VendorCard, VStack } from '@oxy.so/bloom-language';\n";
    let check = |body: &str| compile(&format!("{imports}{body}"), "row.tsx");
    let valid = check(
        "export const x = (o, l, b, t, g) => VStack(CartLine('a', o).density('compact'), CartPanel('a', l).density('comfortable'), CartPromoField(b, o).disabled(), CartTipPicker(b, t).disabled(), MenuItemRow('a', o).density('compact'), MenuItemOptions(g, o).disabled(), VendorCard('a').density('compact').loading());\n",
    );
    assert!(valid.diagnostics.is_empty(), "{:?}", valid.diagnostics.first().map(|d| &d.message));
    let cases = [
        ("CartLine('a', o).density('cozy')", "Unknown density token 'cozy' for .density()"),
        ("CartPanel('a', o).loading()", "CartPanel has no modifier .loading()"),
        ("VendorCard('a').tint('success')", "VendorCard has no modifier .tint()"),
    ];
    for (chain, message) in cases {
        let output = check(&format!("export const x = (o) => {chain};\n"));
        assert_eq!(output.diagnostics[0].message, message, "{chain}");
    }
}

#[test]
fn the_media_cards_are_checked() {
    let imports = "import { AlbumCard, GenreCard, MediaCard, QuickAccessTile, VStack } from '@oxy.so/bloom-language';\n";
    let check = |body: &str| compile(&format!("{imports}{body}"), "row.tsx");
    let valid = check(
        "export const x = (o) => VStack(MediaCard('a', o).size('small').style('row').loading(), AlbumCard('a').size('large').style('tile'), GenreCard('a').size('medium'), QuickAccessTile('a').loading());\n",
    );
    assert!(valid.diagnostics.is_empty(), "{:?}", valid.diagnostics.first().map(|d| &d.message));
    let cases = [
        ("MediaCard('a').size('xl')", "Unknown mediaCardSize token 'xl' for .size()"),
        ("AlbumCard('a').style('grid')", "Unknown mediaCardLayout token 'grid' for .style()"),
        ("GenreCard('a').style('row')", "GenreCard has no modifier .style()"),
        ("QuickAccessTile('a').size('small')", "QuickAccessTile has no modifier .size()"),
    ];
    for (chain, message) in cases {
        let output = check(&format!("export const x = (b) => {chain};\n"));
        assert_eq!(output.diagnostics[0].message, message, "{chain}");
    }
}

#[test]
fn the_lyrics_are_checked() {
    let imports = "import { LyricsPreviewCard, LyricsView, VStack } from '@oxy.so/bloom-language';\n";
    let check = |body: &str| compile(&format!("{imports}{body}"), "row.tsx");
    let valid = check(
        "export const x = (l) => VStack(LyricsView(l).size('small').label('Lyrics'), LyricsPreviewCard(l).lines(4));\n",
    );
    assert!(valid.diagnostics.is_empty(), "{:?}", valid.diagnostics.first().map(|d| &d.message));
    let cases = [
        ("LyricsView(b).size('xl')", "Unknown lyricsSize token 'xl' for .size()"),
        ("LyricsPreviewCard(b).size('small')", "LyricsPreviewCard has no modifier .size()"),
    ];
    for (chain, message) in cases {
        let output = check(&format!("export const x = (b) => {chain};\n"));
        assert_eq!(output.diagnostics[0].message, message, "{chain}");
    }
}

#[test]
fn the_creator_studio_is_checked() {
    let imports = "import { ArtworkUploader, IsrcField, ReleaseCard, ReleaseStatusBadge, ReleaseTimeline, VStack } from '@oxy.so/bloom-language';\n";
    let check = |body: &str| compile(&format!("{imports}{body}"), "row.tsx");
    let valid = check(
        "export const x = (r, b) => VStack(ReleaseCard(r).style('row'), ReleaseStatusBadge('live').size('sm'), ReleaseTimeline(r).axis('horizontal'), IsrcField(b).disabled(), ArtworkUploader(null).disabled());\n",
    );
    assert!(valid.diagnostics.is_empty(), "{:?}", valid.diagnostics.first().map(|d| &d.message));
    let cases = [
        ("ReleaseCard(b).style('list')", "Unknown releaseCardLayout token 'list' for .style()"),
        ("ReleaseStatusBadge('live').size('lg')", "Unknown releaseStatusBadgeSize token 'lg' for .size()"),
        ("IsrcField(b).size('sm')", "IsrcField has no modifier .size()"),
    ];
    for (chain, message) in cases {
        let output = check(&format!("export const x = (b) => {chain};\n"));
        assert_eq!(output.diagnostics[0].message, message, "{chain}");
    }
}

#[test]
fn the_checkout_summary_delivery_slots_and_order_confirmation_are_checked() {
    let imports = "import { CheckoutConfirm, CheckoutSummary, CheckoutSummaryRow, DeliverySlotDays, DeliverySlotOption, DeliverySlotPicker, OrderConfirmation, VStack } from '@oxy.so/bloom-language';\n";
    let check = |body: &str| compile(&format!("{imports}{body}"), "row.tsx");
    let valid = check(
        "export const x = (b, d, w) => VStack(CheckoutSummaryRow('a').disabled(), CheckoutSummary().label('Review'), CheckoutConfirm().loading().disabled(), DeliverySlotDays(b, d).tint('primary').disabled(), DeliverySlotOption('a').disabled(), DeliverySlotPicker(b, d, w).loading().tint('surface'), OrderConfirmation().density('compact'));\n",
    );
    assert!(valid.diagnostics.is_empty(), "{:?}", valid.diagnostics.first().map(|d| &d.message));
    let cases = [
        ("DeliverySlotDays(b, d).tint('teal')", "Unknown color token 'teal' for .tint()"),
        ("OrderConfirmation().density('cozy')", "Unknown density token 'cozy' for .density()"),
        ("CheckoutSummary().loading()", "CheckoutSummary has no modifier .loading()"),
    ];
    for (chain, message) in cases {
        let output = check(&format!("export const x = (b, d) => {chain};\n"));
        assert_eq!(output.diagnostics[0].message, message, "{chain}");
    }
}

#[test]
fn the_media_player_is_checked() {
    let imports = "import { MiniPlayer, PlaybackSpeedMenu, SleepTimerMenu, TransportControls, VStack } from '@oxy.so/bloom-language';\n";
    let check = |body: &str| compile(&format!("{imports}{body}"), "row.tsx");
    let valid = check(
        "export const x = (o, r) => VStack(TransportControls(true, o).size('lg').style('podcast').loading().disabled(), PlaybackSpeedMenu(r).size('sm').disabled(), SleepTimerMenu(r).size('md'), MiniPlayer(o, o).onPress(o));\n",
    );
    assert!(valid.diagnostics.is_empty(), "{:?}", valid.diagnostics.first().map(|d| &d.message));
    let cases = [
        ("TransportControls(true, b).size('xl')", "Unknown transportSize token 'xl' for .size()"),
        ("TransportControls(true, b).style('video')", "Unknown transportStyle token 'video' for .style()"),
        ("PlaybackSpeedMenu(b).style('music')", "PlaybackSpeedMenu has no modifier .style()"),
        ("MiniPlayer(b, b).size('sm')", "MiniPlayer has no modifier .size()"),
    ];
    for (chain, message) in cases {
        let output = check(&format!("export const x = (b) => {chain};\n"));
        assert_eq!(output.diagnostics[0].message, message, "{chain}");
    }
}

#[test]
fn the_logistics_families_are_checked() {
    let imports = "import { CarrierQuoteCard, JobBoard, SignaturePad, ProofOfDelivery, VehiclePicker, VStack } from '@oxy.so/bloom-language';\n";
    let check = |body: &str| compile(&format!("{imports}{body}"), "row.tsx");
    let valid = check(
        "export const x = (q, j, v) => VStack(CarrierQuoteCard(q).density('compact').disabled(), JobBoard(j).loading(), SignaturePad().tint('primary').strokeWidth('2.5'), SignaturePad().strokeWidth('thick'), ProofOfDelivery().loading().disabled(), VehiclePicker(v).disabled());\n",
    );
    assert!(valid.diagnostics.is_empty(), "{:?}", valid.diagnostics.first().map(|d| &d.message));
    let cases = [
        ("CarrierQuoteCard(q).density('cozy')", "Unknown density token 'cozy' for .density()"),
        ("SignaturePad().tint('ink')", "Unknown color token 'ink' for .tint()"),
        ("SignaturePad().strokeWidth('2')", "Unknown borderWidth token '2' for .strokeWidth()"),
        ("JobBoard(q).style('grid')", "JobBoard has no modifier .style()"),
        ("ProofOfDelivery().strokeWidth('thin')", "ProofOfDelivery has no modifier .strokeWidth()"),
    ];
    for (chain, message) in cases {
        let output = check(&format!("export const x = (q) => {chain};\n"));
        assert_eq!(output.diagnostics[0].message, message, "{chain}");
    }
    // A signature's stroke is a line width: a near miss names the width it meant.
    let output = check("export const x = SignaturePad().strokeWidth('thickk');\n");
    assert!(output.diagnostics[0].help.as_deref().unwrap().starts_with("did you mean 'thick'?"));
}

#[test]
fn row_actions_the_swipe_row_and_the_theme_toggle_are_checked() {
    let imports = "import { RowActionButton, RowActions, SwipeRow, Text, ThemeToggle, VStack } from '@oxy.so/bloom-language';\n";
    let check = |body: &str| compile(&format!("{imports}{body}"), "row.tsx");
    let valid = check(
        "export const x = (i, a) => VStack(RowActions('a').style('outline'), RowActionButton(i, 'Edit').style('outline').active(true).disabled(), SwipeRow(Text('a'), a).tint('card'), ThemeToggle().style('bare-segmented').collapsed());\n",
    );
    assert!(valid.diagnostics.is_empty(), "{:?}", valid.diagnostics.first().map(|d| &d.message));
    let cases = [
        ("RowActions('a').style('solid')", "Unknown rowActionStyle token 'solid' for .style()"),
        ("RowActionButton(b, 'a').size('sm')", "RowActionButton has no modifier .size()"),
        ("SwipeRow(Text('a'), b).tint('rose')", "Unknown color token 'rose' for .tint()"),
        ("ThemeToggle().style('switch')", "Unknown themeToggleStyle token 'switch' for .style()"),
    ];
    for (chain, message) in cases {
        let output = check(&format!("export const x = (b) => {chain};\n"));
        assert_eq!(output.diagnostics[0].message, message, "{chain}");
    }
}

#[test]
fn the_music_library_is_checked() {
    let imports =
        "import { BrowseGrid, LibraryItem, LibraryPanel, SearchField } from '@oxy.so/bloom-language';\n";
    let check = |body: &str| compile(&format!("{imports}{body}"), "row.tsx");
    let valid = check(
        "export const x = (i, e, q) => [LibraryPanel(i), LibraryItem(e).style('rail'), SearchField(q).label('Search'), BrowseGrid(i).spacing('lg')];\n",
    );
    assert!(valid.diagnostics.is_empty(), "{:?}", valid.diagnostics.first().map(|d| &d.message));
    let cases = [
        ("LibraryItem(e).style('tile')", "Unknown libraryItemStyle token 'tile' for .style()"),
        ("LibraryPanel(e).style('grid')", "LibraryPanel has no modifier .style()"),
    ];
    for (chain, message) in cases {
        let output = check(&format!("export const x = (e) => {chain};\n"));
        assert_eq!(output.diagnostics[0].message, message, "{chain}");
    }
}

#[test]
fn the_queue_panel_is_checked() {
    let imports = "import { QueuePanel, QueuePanelRow } from '@oxy.so/bloom-language';\n";
    let check = |body: &str| compile(&format!("{imports}{body}"), "row.tsx");
    let valid =
        check("export const x = (o, t) => [QueuePanel(o).style('sheet'), QueuePanelRow(t).label('Play')];\n");
    assert!(valid.diagnostics.is_empty(), "{:?}", valid.diagnostics.first().map(|d| &d.message));
    let cases = [
        ("QueuePanel(o).style('drawer')", "Unknown queuePanelStyle token 'drawer' for .style()"),
        ("QueuePanelRow(o).style('panel')", "QueuePanelRow has no modifier .style()"),
    ];
    for (chain, message) in cases {
        let output = check(&format!("export const x = (o) => {chain};\n"));
        assert_eq!(output.diagnostics[0].message, message, "{chain}");
    }
}

#[test]
fn the_track_list_is_checked() {
    let imports =
        "import { SelectionBar, TrackList, TrackListHeader, TrackRow } from '@oxy.so/bloom-language';\n";
    let check = |body: &str| compile(&format!("{imports}{body}"), "row.tsx");
    let valid = check(
        "export const x = (t, c, a) => [TrackList(t).density('compact').tint('surface'), TrackListHeader(c).density('comfortable'), TrackRow(t, 0).density('compact'), SelectionBar(2, a, {}).style('inline')];\n",
    );
    assert!(valid.diagnostics.is_empty(), "{:?}", valid.diagnostics.first().map(|d| &d.message));
    let cases = [
        (
            "SelectionBar(1, a, {}).style('docked')",
            "Unknown selectionBarPlacement token 'docked' for .style()",
        ),
        ("TrackList(a).density('cozy')", "Unknown density token 'cozy' for .density()"),
        ("TrackRow(a, 0).tint('surface')", "TrackRow has no modifier .tint()"),
    ];
    for (chain, message) in cases {
        let output = check(&format!("export const x = (a) => {chain};\n"));
        assert_eq!(output.diagnostics[0].message, message, "{chain}");
    }
}

#[test]
fn values_inside_blooms_own_data_are_bindings() {
    let imports = "import { CallScreen, CartPanel, EpisodeRow, FullScreenPlayer, ListItem, MailRow, MapControls, NowPlayingBar, ShareSheet, TrackRow, TrackRowSkeleton, VStack } from '@oxy.so/bloom-language';\n";
    let check = |body: &str| compile(&format!("{imports}{body}"), "row.tsx");
    let valid = check(
        "export const x = (v, s, c, d) => VStack(CartPanel('a', c).tip([v, s], c, { label: 'Tip' }).promo([v, s], { onApply: s }), ShareSheet().search([v, s], { placeholder: 'Search' }), CallScreen('a', 'active').muted([v, s]).speaker([v, s]).videoOn([v, s]).screenSharing([v, s]).localVideoCorner([v, s]), MailRow(d).starred([v, s]), MapControls().tilted([v, s]), NowPlayingBar(d, {}).lyricsActive([v, s]).queueActive([v, s]).shuffle([v, s]).repeat([v, s]).playbackRate([v, s]), FullScreenPlayer(d, {}).shuffle([v, s]), TrackRow(d, 0).liked([v, s]), EpisodeRow(d).saved([v, s]).downloaded([v, s]));\n",
    );
    assert!(valid.diagnostics.is_empty(), "{:?}", valid.diagnostics.first().map(|d| &d.message));
    let cases = [
        ("CartPanel('a', c).tip([v, s])", ".tip() takes 2 to 3 argument(s), not 1"),
        ("CartPanel('a', c).promo([v, s])", ".promo() takes 2 argument(s), not 1"),
        ("ListItem('a').starred([v, s])", "ListItem has no modifier .starred()"),
        ("ShareSheet().query([v, s])", "ShareSheet has no modifier .query()"),
        ("TrackRowSkeleton().liked([v, s])", "TrackRowSkeleton has no modifier .liked()"),
    ];
    for (chain, message) in cases {
        let output = check(&format!("export const x = (v, s, c) => {chain};\n"));
        assert_eq!(output.diagnostics[0].message, message, "{chain}");
    }
}

const GLASS_IMPORTS: &str = "import { Button, FAB, GlassGroup, HStack, Icon, ScrollView, Text, VStack, regular, identity, useNamespace } from '@oxy.so/bloom-language';
import { RiShareLine } from '@oxy.so/bloom/icons/RiShareLine';
";

fn glass(body: &str) -> crate::Output {
    compile(&format!("{GLASS_IMPORTS}{body}"), "glass.tsx")
}

fn messages(diagnostics: &[crate::Diagnostic]) -> Vec<&str> {
    diagnostics.iter().map(|d| d.message.as_str()).collect()
}

#[test]
fn glass_on_glass_is_an_error() {
    let output = glass("export const x = () => VStack(HStack(Text('a')).glass()).glass();\n");
    assert_eq!(messages(&output.diagnostics), ["glass on glass: this glass is inside another glass"]);
    assert!(output.diagnostics[0].rendered.starts_with("error[bloom]"));
    // `identity` draws no glass, and a glass beside another is not on it.
    let fine = glass("export const x = () => VStack(HStack(Text('a')).glass()).glass(identity);\n");
    assert!(fine.diagnostics.is_empty());
    // A FAB is always on glass.
    let fab = glass("export const x = () => HStack(FAB(Icon(RiShareLine)).label('Share')).glass();\n");
    assert_eq!(messages(&fab.diagnostics), ["glass on glass: this glass is inside another glass"]);
}

#[test]
fn glass_in_scrolling_content_is_a_warning_unless_it_says_so() {
    let output = glass("export const x = () => ScrollView(HStack(Text('a')).glass());\n");
    assert!(output.diagnostics.is_empty());
    assert_eq!(
        messages(&output.warnings),
        ["glass in scrolling content: glass belongs to the navigation layer"]
    );
    assert!(output.warnings[0].rendered.starts_with("warning[bloom]"));
    let opted = glass("export const x = () => ScrollView(HStack(Text('a')).glass().inContent());\n");
    assert!(opted.warnings.is_empty());
}

#[test]
fn glass_side_by_side_belongs_in_a_glass_group() {
    let loose = glass(
        "export const x = () => HStack(Button(Text('a')).glass(), Button(Text('b')).glass(regular.interactive(false)));\n",
    );
    assert!(loose.diagnostics.is_empty());
    assert_eq!(messages(&loose.warnings), ["2 glasses side by side outside a GlassGroup"]);
    let grouped = glass(
        "export function X() {\n  const ns = useNamespace();\n  return GlassGroup(HStack(Button(Text('a')).glass().glassID('a', ns), Button(Text('b')).glass().glassID('b', ns))).blend('xl');\n}\n",
    );
    assert!(grouped.diagnostics.is_empty(), "{:?}", messages(&grouped.diagnostics));
    assert!(grouped.warnings.is_empty(), "{:?}", messages(&grouped.warnings));
}

#[test]
fn an_icon_only_control_needs_a_label() {
    let output = glass("export const x = () => Button(Icon(RiShareLine)).style('subtle');\n");
    assert_eq!(messages(&output.diagnostics), ["an icon-only Button has no .label()"]);
    let fab = glass("export const x = () => FAB(Icon(RiShareLine));\n");
    assert_eq!(messages(&fab.diagnostics), ["an icon-only FAB has no .label()"]);
    let labelled = glass("export const x = () => Button(Icon(RiShareLine)).label('Share');\n");
    assert!(labelled.diagnostics.is_empty());
    let worded = glass("export const x = () => Button(Icon(RiShareLine), Text('Share'));\n");
    assert!(worded.diagnostics.is_empty());
}

#[test]
fn a_glass_value_is_checked_through_its_methods_and_hoists() {
    let output = glass(
        "export function X() {\n  return HStack(Text('a')).glass(regular.interactive(false).tint('primary', 'subtle'));\n}\n",
    );
    assert!(output.diagnostics.is_empty(), "{:?}", messages(&output.diagnostics));
    assert_eq!(output.hoisted, 1);
    let wrong = glass("export const x = () => HStack().glass(regular.interactive(false).tint('blue'));\n");
    assert_eq!(messages(&wrong.diagnostics), ["Unknown color token 'blue' for .tint()"]);
}

const ENVIRONMENT_IMPORTS: &str =
    "import { Button, HStack, Text, VStack, defineEnvironment } from '@oxy.so/bloom-language';
";

fn environment(body: &str) -> crate::Output {
    compile(&format!("{ENVIRONMENT_IMPORTS}{body}"), "environment.tsx")
}

#[test]
fn environment_values_are_checked() {
    let fine = environment(
        "const Compact = defineEnvironment('compact', false);\nexport const x = () => VStack(Text('a')).environment(Compact, true).disabled().controlSize('sm').buttonStyle('glass');\n",
    );
    assert!(fine.diagnostics.is_empty(), "{:?}", messages(&fine.diagnostics));
    let wrong = environment(
        "const Compact = defineEnvironment('compact', false);\nexport const x = () => VStack().environment(Compact, 'yes');\n",
    );
    assert_eq!(messages(&wrong.diagnostics), [".environment() sets a boolean value to a string"]);
    let named = environment("const name = 'c';\nexport const Compact = defineEnvironment(name, false);\n");
    assert_eq!(messages(&named.diagnostics), ["defineEnvironment() takes its name as a string literal"]);
    let object = environment("export const Theme = defineEnvironment('theme', { dark: true });\n");
    assert_eq!(
        messages(&object.diagnostics),
        ["defineEnvironment() takes a literal default: a string, a number, a boolean, null or undefined"]
    );
    let size = environment("export const x = () => HStack().controlSize('xxl');\n");
    assert_eq!(messages(&size.diagnostics), ["Unknown controlSize token 'xxl' for .controlSize()"]);
    let style = environment("export const x = () => HStack().buttonStyle('shiny');\n");
    assert_eq!(messages(&style.diagnostics), ["Unknown buttonStyle token 'shiny' for .buttonStyle()"]);
}

#[test]
fn a_glass_button_style_is_glass() {
    let fine = environment("export const x = () => Button(Text('Done')).style('glassProminent');\n");
    assert!(fine.diagnostics.is_empty(), "{:?}", messages(&fine.diagnostics));
    let nested = environment("export const x = () => HStack(Button(Text('Done')).style('glass')).glass();\n");
    assert_eq!(messages(&nested.diagnostics), ["glass on glass: this glass is inside another glass"]);
}

#[test]
fn an_environment_key_is_static() {
    let output = environment(
        "const Compact = defineEnvironment('compact', false);\nexport function X() {\n  return VStack(Text('a')).environment(Compact, true);\n}\n",
    );
    assert!(output.diagnostics.is_empty(), "{:?}", messages(&output.diagnostics));
    assert_eq!(output.hoisted, 1);
}

const MODIFIER_IMPORTS: &str =
    "import { HStack, Text, VStack, defineModifier } from '@oxy.so/bloom-language';
";

fn modifier(body: &str) -> crate::Output {
    compile(&format!("{MODIFIER_IMPORTS}{body}"), "modifier.tsx")
}

#[test]
fn a_custom_modifier_is_checked_where_it_is_defined() {
    let fine = modifier(
        "export const card = defineModifier((v) => v.padding('md').background('card').corner('lg').when('md', (w) => w.padding('lg')));\nexport const tag = defineModifier((v, tone) => v.padding('horizontal', 'xs').background(tone));\n",
    );
    assert!(fine.diagnostics.is_empty(), "{:?}", messages(&fine.diagnostics));
    let token = modifier("export const card = defineModifier((v) => v.padding('mdd'));\n");
    assert_eq!(messages(&token.diagnostics), ["Unknown padding token 'mdd' for .padding()"]);
    let text = modifier("export const two = defineModifier((v) => v.padding('md').lines(2));\n");
    assert_eq!(messages(&text.diagnostics), ["A modifier cannot chain .lines(): it applies to any view"]);
}

#[test]
fn a_chain_that_applies_a_custom_modifier_hoists_like_the_chain_it_stands_for() {
    let output = modifier(
        "const card = defineModifier((v) => v.padding('md').corner('lg'));\nexport function Storage() {\n  return VStack(Text('Storage')).modifier(card);\n}\n",
    );
    assert!(output.diagnostics.is_empty(), "{:?}", messages(&output.diagnostics));
    assert_eq!(output.hoisted, 1);
    assert!(
        output.code.contains("const _bloomStatic0 = VStack(Text(\"Storage\")).modifier(card);"),
        "{}",
        output.code
    );
}

const TOOLBAR_IMPORTS: &str =
    "import { Button, Header, Icon, Text, ToolbarGroup, ToolbarSpacer } from '@oxy.so/bloom-language';
import { RiShareLine } from '@oxy.so/bloom/icons/RiShareLine';
";

fn toolbar(body: &str) -> crate::Output {
    compile(&format!("{TOOLBAR_IMPORTS}{body}"), "toolbar.tsx")
}

#[test]
fn toolbar_groups_follow_apples_limits() {
    let fine = toolbar(
        "const S = Button(Icon(RiShareLine)).label('Share');\nexport const x = () => Header('Edit').toolbar(ToolbarGroup(S, S), ToolbarSpacer('fixed'), ToolbarGroup(S), ToolbarSpacer(), Button(Text('Done')).style('glassProminent'));\n",
    );
    assert!(fine.diagnostics.is_empty() && fine.warnings.is_empty(), "{:?}", messages(&fine.warnings));
    let many = toolbar(
        "const S = Button(Icon(RiShareLine)).label('Share');\nexport const x = () => Header('Edit').toolbar(ToolbarGroup(S), ToolbarGroup(S), ToolbarGroup(S), ToolbarGroup(S));\n",
    );
    assert_eq!(messages(&many.warnings), ["4 toolbar groups: a toolbar has at most three"]);
    let mixed = toolbar(
        "export const x = () => ToolbarGroup(Button(Icon(RiShareLine)).label('Share'), Button(Text('Done')));\n",
    );
    assert_eq!(messages(&mixed.warnings), ["a toolbar group mixes text and icon buttons"]);
}

const PHASE_IMPORTS: &str = "import { HStack, Icon, Text, defineKeyframes } from '@oxy.so/bloom-language';
import { RiShareLine } from '@oxy.so/bloom/icons/RiShareLine';
";

fn phases(body: &str) -> crate::Output {
    compile(&format!("{PHASE_IMPORTS}{body}"), "phases.tsx")
}

#[test]
fn a_phase_sets_geometry_and_opacity_only() {
    let fine = phases(
        "export const x = (n) => Icon(RiShareLine).phases(['rest', 'lift'], n, (v, p) => v.offset({ y: p === 'lift' ? '-sm' : 'none' }).scale('swell'), (p) => (p === 'lift' ? 'pop' : 'select'));\n",
    );
    assert!(fine.diagnostics.is_empty(), "{:?}", messages(&fine.diagnostics));
    let padded = phases("export const x = (n) => Text('a').phases(['a', 'b'], n, (v) => v.padding('md'));\n");
    assert_eq!(messages(&padded.diagnostics), ["A phase cannot change .padding()"]);
    let token = phases("export const x = (n) => Text('a').phases(['a', 'b'], n, (v) => v.scale('huge'));\n");
    assert_eq!(messages(&token.diagnostics), ["Unknown scale token 'huge' for .scale()"]);
}

#[test]
fn keyframe_tracks_are_static() {
    let output = phases(
        "const bounce = defineKeyframes({ y: [{ to: '-lg', motion: 'pop' }, { to: 'none', motion: 'select' }], scale: [{ to: 1.2, ms: 120 }, { to: 1, ms: 180 }] });\nexport function X({ n }) {\n  return Text('a').keyframes(bounce, n);\n}\n",
    );
    assert!(output.diagnostics.is_empty(), "{:?}", messages(&output.diagnostics));
}

#[test]
fn view_that_fits_measures_few_candidates() {
    let imports = "import { Text, ViewThatFits } from '@oxy.so/bloom-language';\n";
    let few = compile(
        &format!("{imports}export const x = () => ViewThatFits('horizontal', Text('a'), Text('b'));\n"),
        "fits.tsx",
    );
    assert!(few.warnings.is_empty());
    let many = compile(
        &format!(
            "{imports}export const x = () => ViewThatFits('horizontal', Text('a'), Text('b'), Text('c'), Text('d'));\n"
        ),
        "fits.tsx",
    );
    assert_eq!(messages(&many.warnings), ["ViewThatFits measures 4 candidates"]);
}

const RULE_IMPORTS: &str =
    "import { Button, GlassGroup, HStack, Text, VStack, clear, regular } from '@oxy.so/bloom-language';
";

fn rules(body: &str) -> crate::Output {
    compile(&format!("{RULE_IMPORTS}{body}"), "rules.tsx")
}

#[test]
fn clear_glass_takes_a_dimming_layer() {
    let bare = rules("export const x = () => VStack(Text('a')).glass(clear);\n");
    assert_eq!(messages(&bare.warnings), ["clear glass with no dimming layer"]);
    let dimmed = rules("export const x = () => VStack(Text('a')).glass(clear.dimmed());\n");
    assert!(
        dimmed.warnings.is_empty() && dimmed.diagnostics.is_empty(),
        "{:?}",
        messages(&dimmed.diagnostics)
    );
    let tinted = rules("export const x = () => VStack(Text('a')).glass(clear.tint('primary'));\n");
    assert!(tinted.warnings.is_empty());
}

#[test]
fn one_tinted_control_per_group() {
    let two = rules(
        "export const x = () => GlassGroup(HStack(Button(Text('Done')).style('glassProminent'), Button(Text('Save')).glass(regular.tint('primary'))));\n",
    );
    assert_eq!(messages(&two.warnings), ["2 tinted glasses in one group: tint one, the primary action"]);
    let one = rules(
        "export const x = () => GlassGroup(HStack(Button(Text('Done')).style('glassProminent'), Button(Text('Save')).style('glass')));\n",
    );
    assert!(one.warnings.is_empty(), "{:?}", messages(&one.warnings));
}

#[test]
fn the_lens_budget_and_a_glass_per_item() {
    let glasses = (0..13)
        .map(|i| format!("export const g{i} = () => VStack(Text('a')).glass();\n"))
        .collect::<String>();
    let many = rules(&glasses);
    assert_eq!(messages(&many.warnings), ["13 glasses in one module: past the budget of 12"]);
    let list = rules("export const x = (items) => VStack(items.map((item) => Text(item).glass()));\n");
    assert_eq!(messages(&list.warnings), ["a glass per item of a list"]);
}

#[test]
fn the_layout_apps_write_is_checked() {
    // Auto margins, a gap per axis, a border's line, and the numeric tokens Mention writes.
    let ok = compiled(
        "export const x = () => HStack(Text('a').font('12.5'), VStack().margin('leading', 'auto').margin('auto')).horizontalSpacing('lg').verticalSpacing('6').border('border', '0.5').borderStyle('dashed').opacity('85');\n",
    );
    assert!(ok.diagnostics.is_empty(), "{:?}", ok.diagnostics);
    // `auto` is a margin's alone: a padding has no free space to take.
    let output = compiled("export const x = () => HStack().padding('auto');\n");
    assert_eq!(output.diagnostics[0].message, "Unknown padding token 'auto' for .padding()");
    let output = compiled("export const x = () => HStack().borderStyle('double');\n");
    assert_eq!(output.diagnostics[0].message, "Unknown borderStyle token 'double' for .borderStyle()");
    let output = compiled("export const x = () => Text('a').horizontalSpacing('lg');\n");
    assert_eq!(output.diagnostics[0].message, "Text has no modifier .horizontalSpacing()");
    let output = compiled("export const x = () => Text('a').font('12.4');\n");
    assert_eq!(output.diagnostics[0].message, "Unknown font token '12.4' for .font()");
}

#[test]
fn the_accessibility_modifiers_are_checked() {
    let ok = compiled(
        "export const x = (on: boolean) => VStack(Text('a').liveRegion('polite')).accessibilityState({ selected: on, checked: 'mixed', busy: false }).accessibilityHidden().accessibilityHidden(on);\n",
    );
    assert!(ok.diagnostics.is_empty(), "{:?}", ok.diagnostics);
    let output = compiled("export const x = () => VStack().accessibilityState({ pressed: true });\n");
    assert_eq!(output.diagnostics[0].message, ".accessibilityState() has no 'pressed'");
    let output = compiled("export const x = () => VStack().accessibilityState({ checked: 'partly' });\n");
    assert_eq!(
        output.diagnostics[0].message,
        "Unknown accessibilityChecked token 'partly' for .accessibilityState()"
    );
    let output = compiled("export const x = () => VStack().liveRegion('loud');\n");
    assert_eq!(output.diagnostics[0].message, "Unknown liveRegion token 'loud' for .liveRegion()");
}

#[test]
fn a_press_fade_takes_an_opacity_token() {
    let ok = compiled(
        "export const x = (f: () => void) => HStack(Text('a')).onPress(f).pressFade('70').pressFade();\n",
    );
    assert!(ok.diagnostics.is_empty(), "{:?}", ok.diagnostics);
    let output = compiled("export const x = () => HStack().pressFade('0.7');\n");
    assert_eq!(output.diagnostics[0].message, "Unknown opacity token '0.7' for .pressFade()");
}

#[test]
fn a_virtual_list_takes_content_margins_and_a_gap() {
    let ok = compiled(
        "import { VirtualList } from '@oxy.so/bloom-language';\nexport const x = (row: never) => VirtualList([], row).contentMargins('horizontal', 'lg').contentMargins('6').spacing('sm');\n",
    );
    assert!(ok.diagnostics.is_empty(), "{:?}", ok.diagnostics);
    let output = compiled(
        "import { VirtualList } from '@oxy.so/bloom-language';\nexport const x = (row: never) => VirtualList([], row).contentMargins('bottom', '-lg');\n",
    );
    assert_eq!(output.diagnostics[0].message, "Unknown space token '-lg' for .contentMargins()");
}

#[test]
fn a_dialog_hears_it_has_finished_closing() {
    let ok = compiled(
        "import { Dialog } from '@oxy.so/bloom-language';\nexport const x = (open: boolean, set: (v: boolean) => void, gone: () => void) => Dialog(Text('a')).onDismissed(gone).presented([open, set]);\n",
    );
    assert!(ok.diagnostics.is_empty(), "{:?}", ok.diagnostics);
    let output = compiled("export const x = (gone: () => void) => VStack().onDismissed(gone);\n");
    assert_eq!(output.diagnostics[0].message, "VStack has no modifier .onDismissed()");
}

#[test]
fn a_menu_row_sizes_and_inks_its_own_glyph() {
    let ok = compiled(
        "export const x = () => Menu(Text('More'), Item('Copy').icon(RiMoreFill).iconSize('22').iconForeground('primary'));\n",
    );
    assert!(ok.diagnostics.is_empty(), "{:?}", ok.diagnostics);
    let output = compiled("export const x = () => Item('Copy').iconSize('23');\n");
    assert_eq!(output.diagnostics[0].message, "Unknown iconSize token '23' for .iconSize()");
    let output = compiled("export const x = () => Item('Copy').iconForeground('#fff');\n");
    assert_eq!(output.diagnostics[0].message, "Unknown color token '#fff' for .iconForeground()");
}

/// `body` compiled with `names` imported from the language (and the icons it names).
fn compiled_with(names: &str, body: &str) -> crate::Output {
    compile(
        &format!(
            "import {{ {names} }} from '@oxy.so/bloom-language';\nimport {{ RiShareLine }} from '@oxy.so/bloom/icons/RiShareLine';\n{body}"
        ),
        "row.tsx",
    )
}

#[test]
fn a_submenu_sizes_and_inks_its_own_glyph() {
    let names = "Menu, Submenu, Item, Text";
    let ok = compiled_with(
        names,
        "export const x = () => Menu(Text('More'), Submenu('Share', Item('Email')).icon(RiShareLine).iconSize('22').iconForeground('primary'));\n",
    );
    assert!(ok.diagnostics.is_empty(), "{:?}", ok.diagnostics);
    let output = compiled_with(names, "export const x = () => Submenu('Share').iconSize('23');\n");
    assert_eq!(output.diagnostics[0].message, "Unknown iconSize token '23' for .iconSize()");
    let output = compiled_with(names, "export const x = () => Submenu('Share').iconForeground('#fff');\n");
    assert_eq!(output.diagnostics[0].message, "Unknown color token '#fff' for .iconForeground()");
}

#[test]
fn a_search_takes_a_most_characters() {
    let ok =
        compiled_with("Search", "export const x = (t) => Search(t).placeholder('Find').maxLength(50);\n");
    assert!(ok.diagnostics.is_empty(), "{:?}", ok.diagnostics);
    let output = compiled_with("Search", "export const x = (t) => Search(t).maxLength(50, 2);\n");
    assert_eq!(output.diagnostics[0].message, ".maxLength() takes 1 argument(s), not 2");
}

#[test]
fn views_are_content_where_a_component_draws_them() {
    let ok = compiled_with(
        "Header, Text, Button, Loading, Group, Icon, TextField",
        "export const x = (t) => [Header(Text('Home')).subtitle(Text('3 new')), Button(Loading().style('inline')).label('Ana'), Button(Group(Icon(RiShareLine).size('22'))).label('Share'), TextField(t, 'Name').placeholder(null)];\n",
    );
    assert!(ok.diagnostics.is_empty(), "{:?}", ok.diagnostics);
}

#[test]
fn stacking_levels_and_an_aspect_ratio_anywhere() {
    let ok = compiled(
        "export const x = (f) => [VStack(Text('a')).zIndex('-1'), HStack(Text('b')).zIndex('7').frame({ width: '1/4' }).aspectRatio(1).onPress(f)];\n",
    );
    assert!(ok.diagnostics.is_empty(), "{:?}", ok.diagnostics);
    let output = compiled("export const x = () => VStack(Text('a')).zIndex('-2');\n");
    assert_eq!(output.diagnostics[0].message, "Unknown zIndex token '-2' for .zIndex()");
}

#[test]
fn a_view_is_padded_by_the_safe_area() {
    let ok = compiled(
        "export const x = () => [VStack(Text('a')).safeAreaPadding(), VStack(Text('b')).safeAreaPadding('top').padding('top', '2xl')];\n",
    );
    assert!(ok.diagnostics.is_empty(), "{:?}", ok.diagnostics);
    let output = compiled("export const x = () => VStack(Text('a')).safeAreaPadding('leading');\n");
    assert_eq!(output.diagnostics[0].message, "Unknown physicalEdge token 'leading' for .safeAreaPadding()");
}

#[test]
fn a_hit_slop_reaches_each_side_its_own_way() {
    let ok = compiled(
        "export const x = (f) => [VStack(Text('a')).onPress(f).hitSlop('md'), VStack(Text('b')).onPress(f).hitSlop('vertical', '5').hitSlop('right', 'none')];\n",
    );
    assert!(ok.diagnostics.is_empty(), "{:?}", ok.diagnostics);
    let output = compiled("export const x = (f) => VStack(Text('a')).onPress(f).hitSlop('leading', 'md');\n");
    assert_eq!(output.diagnostics[0].message, "Unknown physicalEdge token 'leading' for .hitSlop()");
    let output = compiled("export const x = (f) => VStack(Text('a')).onPress(f).hitSlop('10');\n");
    assert_eq!(output.diagnostics[0].message, "Unknown hitSlop token '10' for .hitSlop()");
}

#[test]
fn an_accessibility_value_is_checked() {
    let ok = compiled(
        "export const x = (p) => [Text('a').role('progressbar').accessibilityValue({ min: 0, max: 100, now: p }), VStack(Text('b')).accessibilityValue({ text: 'Verifying' })];\n",
    );
    assert!(ok.diagnostics.is_empty(), "{:?}", ok.diagnostics);
    let output = compiled("export const x = () => Text('a').accessibilityValue({ current: 4 });\n");
    assert_eq!(output.diagnostics[0].message, ".accessibilityValue() has no 'current'");
}

#[test]
fn the_escape_hatches_take_a_ref_and_a_layout_handler() {
    let ok = compiled("export const x = (r, f) => VStack(Text('a')).ref(r).onLayout(f);\n");
    assert!(ok.diagnostics.is_empty(), "{:?}", ok.diagnostics);
    let output = compiled("export const x = (r) => VStack(Text('a')).ref(r, r);\n");
    assert_eq!(output.diagnostics[0].message, ".ref() takes 1 argument(s), not 2");
}

#[test]
fn a_refresh_is_a_binding_or_its_value_and_action() {
    let names = "ScrollView, VirtualList, Text";
    let ok = compiled_with(
        names,
        "export const x = (q, b, rows, row) => [ScrollView(Text('a')).refreshable(b, 'primary'), ScrollView(Text('a')).refreshable({ refreshing: q.isRefetching, onRefresh: q.refetch }), VirtualList(rows, row).refreshable({ refreshing: q.isRefetching, onRefresh: q.refetch })];\n",
    );
    assert!(ok.diagnostics.is_empty(), "{:?}", ok.diagnostics);
    let output = compiled_with(
        names,
        "export const x = (q) => ScrollView(Text('a')).refreshable({ refreshing: q.isRefetching, onPull: q.refetch });\n",
    );
    assert_eq!(output.diagnostics[0].message, ".refreshable() has no 'onPull'");
    let output =
        compiled_with(names, "export const x = (b) => ScrollView(Text('a')).refreshable(b, 'teal');\n");
    assert_eq!(output.diagnostics[0].message, "Unknown color token 'teal' for .refreshable()");
}

#[test]
fn the_component_props_mention_writes_are_checked() {
    let names = "Button, Card, Chip, Field, Icon, Text, Toggle, Badge";
    let ok = compiled_with(
        names,
        "export const x = (t, f) => [Button(Icon(RiShareLine)).shape('circle').iconSize('xl').stopPropagation().label('Share').onPress(f), Card(Text('a'), Text('b')).axis('horizontal').align('center').justify('between').spacing('md'), Chip(Icon(RiShareLine).size('sm').foreground('primary'), Text('Share'), Badge(1)).size('xl').style('subtle'), Field('Type', Toggle(t), Toggle(t)).multiple()];\n",
    );
    assert!(ok.diagnostics.is_empty(), "{:?}", ok.diagnostics);
    let output = compiled_with(names, "export const x = () => Button(Text('a')).iconSize('28');\n");
    assert_eq!(output.diagnostics[0].message, "Unknown iconSize token '28' for .iconSize()");
    let output = compiled_with(names, "export const x = () => Card(Text('a')).axis('row');\n");
    assert_eq!(output.diagnostics[0].message, "Unknown axis token 'row' for .axis()");
}

#[test]
fn a_buttons_inks_spinner_and_a_fields_lines_are_checked() {
    let names = "Button, Icon, Text, Badge, TextField";
    let ok = compiled_with(
        names,
        "export const x = (t, busy) => [Button(Icon(RiShareLine)).shape('circle').label('Share').foreground('error').hoverForeground('error').loading(busy).loadingIndicator(null), Button(Badge(1), Text('Ask')), TextField(t, 'Bio').multiline().editable(false)];\n",
    );
    assert!(ok.diagnostics.is_empty(), "{:?}", ok.diagnostics);
    let output = compiled_with(names, "export const x = () => Button(Text('a')).hoverForeground('#f00');\n");
    assert_eq!(output.diagnostics[0].message, "Unknown color token '#f00' for .hoverForeground()");
}

#[test]
fn a_tab_strips_open_tab_press_is_checked() {
    let names = "Tabs, TabItem";
    let ok = compiled_with(
        names,
        "export const x = (b) => Tabs(b, TabItem('a', 'A')).pressOpenTab('reselect');\n",
    );
    assert!(ok.diagnostics.is_empty(), "{:?}", ok.diagnostics);
    let output =
        compiled_with(names, "export const x = (b) => Tabs(b, TabItem('a', 'A')).pressOpenTab('top');\n");
    assert_eq!(output.diagnostics[0].message, "Unknown pressOpenTab token 'top' for .pressOpenTab()");
}

#[test]
fn a_menu_can_be_blooms_dropdown_everywhere() {
    let names = "Menu, Item, Text";
    let ok = compiled_with(
        names,
        "export const x = () => Menu(Text('More'), Item('Copy')).menuStyle('dropdown');\n",
    );
    assert!(ok.diagnostics.is_empty(), "{:?}", ok.diagnostics);
    let output = compiled_with(
        names,
        "export const x = () => Menu(Text('More'), Item('Copy')).menuStyle('inline');\n",
    );
    assert_eq!(output.diagnostics[0].message, "Unknown menuStyle token 'inline' for .menuStyle()");
}
