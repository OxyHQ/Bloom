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
fn the_small_modifiers_and_numeric_tokens_are_checked() {
    let ok = compiled(
        "export const x = () => VStack(Text('1').monospacedDigit().wordBreak('all')).corner('3xl', 'top').corner('sm', 'bottom-trailing').basis('none').scale('105').allowsHitTesting(false).accessibilityOnly().zIndex('50').shadow('0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)').ring('primary', '3').frame({ width: 'fit' }).listMarker('disc');\n",
    );
    assert!(ok.diagnostics.is_empty(), "{:?}", ok.diagnostics);
    let output = compiled("export const x = () => HStack().corner('lg', 'top-left');\n");
    assert_eq!(output.diagnostics[0].message, "Unknown cornerSide token 'top-left' for .corner()");
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

const GESTURE_IMPORTS: &str = "import { Text, VStack, useMotionValue } from '@oxy.so/bloom-language';
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

/// The app chrome's constructors, imported as a screen file imports them.
const CHROME: &str = "import { SettingsSection, SettingsValue, SettingsSelect, SettingsTextField, SettingsDateField, SidebarMode, AutoHideBar, ResizeHandle, ScrollArea, ScrollSurface, StickySection, Toolbar, AppLayout, Destination, Panel, Stack, BottomSheet, Command, CommandGroup, CommandItem, NavItem, SettingsGroup, SettingsItem, SettingsModal, PageFooter, Rail, RailItem, ScrollView, Sidebar, Text, TreeFolder, TreeItem, TreeSection } from '@oxy.so/bloom-language';\n";

fn chrome(body: &str) -> crate::Output {
    compile(&format!("{CHROME}{body}"), "chrome.tsx")
}

fn first_message(output: &crate::Output) -> Option<&str> {
    output.diagnostics.first().map(|d| d.message.as_str())
}

#[test]
fn the_screen_and_its_scroll_view_are_checked_against_the_spec() {
    let fine = chrome(
        "export const S = (more, refresh) => ScrollView(Text('a')).contentMargins('horizontal', 'lg').contentMargins('md').spacing('md').keyboardTaps('handled').scrollDismissesKeyboard('interactively').scrollIndicators('hidden').onEndReached(more, 3).refreshable(refresh).padding('sm').title('Feed').scrollEdge('always').screenKind('collection').screenScroll('content').documentScroll().headerPlacement('overlay').contentClearance('2xl').navigationScope('isolated');\n",
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
        "export const S = (Home, select) => Sidebar(NavItem('Home', Home).id('home').link('/').badge(3).shortcut('⌘1').secondary(), TreeSection('Projects', TreeFolder('Archive', TreeItem('Old')).expanded(true), TreeItem('Roadmap').subtitle('Q1').meta('3').disabled()).collapsible().loading().emptyLabel('None')).selection('home').onSelect(select).variant('rail').surface('docked').size('lg').collapsed().searchable(false).themeToggle(false).label('Navigation');\n",
    );
    assert!(fine.diagnostics.is_empty(), "{:?}", first_message(&fine));
    let rail = chrome(
        "export const R = (icon) => Rail(RailItem('Home', icon).id('home').activeIcon(icon)).selection('home').width('96');\n",
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
}

#[test]
fn the_command_palette_and_the_settings_are_checked_against_the_spec() {
    let fine = chrome(
        "export const C = (open, set, q, onQ, run, Icon, page) => [Command(CommandItem('New').icon(Icon).subtitle('a').keywords('x', 'y').shortcut('⌘N').disabled().onPress(run), CommandGroup('Go', CommandItem('B'))).presented([open, set]).placeholder('Search').emptyLabel('None').query(q, onQ).testID('c'), SettingsModal(SettingsGroup('Account', SettingsItem('Profile', Icon).id('p').content(page).title('You').fullBleed(), SettingsItem('Out', Icon).onPress(run)).id('a')).presented([open, set]).selection('p').initialView('page').presentation('floating')];\n",
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
fn the_sidebar_s_modes_identities_search_and_drops_are_checked_against_the_spec() {
    let fine = chrome(
        "export const S = (Glyph, choose, team, plan, typed, dropped) => Sidebar(SidebarMode('Search', Glyph).id('search').shortcut('k'), TreeSection('Private', TreeItem('Notes').draggable().droppable(false).dropBeside(false)).droppable(false)).mode('search').onModeChange(choose).modePresentation('toggle').modesLabel('Mode').team(team).teamPlacement('header').plan(plan).onboarding({ title: 'Start', steps: [] }).query('ho', typed).onDrop(dropped);\n",
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
        "export const x = (r, set) => VStack(Rating(4.5).count('1.2k').countStyle('reviews').size('sm').style('stars').showsValue(false).starSize('xl').tint('white').starTint('warning').countTint('muted/half').emptyTint('border').fillValue(4.5).labels({}), RatingInput([r, set]).max(10).size('lg').disabled().starLabel(String), RatingBar('Value', 3).max(1).valueLabel('72%').labelWidth('56').reveal({ visible: true }), RatingSummary(4.4, 128, {}).labels({}));\n",
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
        "export const x = (stop, share) => VStack(Meter(3, 5).valueText('3 of 5').tint('success').trackTint('muted/20').thickness('10').barCorner('2xs').fillDuration('slow').reveal({ visible: true }), ProgressBar(0).indeterminate().decorative(), MeterRing(0.9).size('80').cap('butt').backdrop('black/half').content(Text('9')), ProgressRing(0.3).onStop(stop, 'Stop').progress(share), StatBar('Level', 40, 100).rangeLabels('0', '100').trailing(Text('!')), SplitBar('Wins', 30, '3', '7').tint('info'));\n",
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
        "export const x = (p, items, sections, data, row, set, actions) => VStack(ListItem('Ana').supporting('Design').supportingLines(2).prefix(Text('A')).trailing(Text('>')).footnote(Text('f')).attachments(Text('a')).density('compact').compactPadding('xs').active(true).disabled().link('/a').onPrefetch(set).checkable([true, set]).selecting(true).selectionLabel('Select').rowActions(actions, set).swipeActions({}, undefined).swipeEnabled(false).contextMenu(Text('m')), PersonRow(p), List(items).separator('line').scrollable().scrollHeight('320').stickyHeaders().headerContent(Text('h')).footerContent(Text('f')).emptyState(Text('e')).loading().loadingRows(3), SectionedList(sections).sectionIndex({}), VirtualList(data, row).itemKey(String).itemType(String).estimatedItemSize(56).columns(2).onEndReached(set, 0.5).refreshable(false, set).stickyIndices([0]).restorationKey('k').tuning({}), ListSelectionBar(1, 2).selecting(true).onSelectAll(set).onClear(set).rowActions(actions, set).labels({}));\n",
    );
    assert!(valid.diagnostics.is_empty(), "{:?}", valid.diagnostics.first().map(|d| &d.message));
    let cases = [
        ("List([]).separator('dashed')", "Unknown listSeparator token 'dashed' for .separator()"),
        ("ListItem('a').compactPadding('tight')", "Unknown space token 'tight' for .compactPadding()"),
        ("ListItem('a').density('cozy')", "Unknown density token 'cozy' for .density()"),
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
        "export const x = (open) => Accordion(open, AccordionItem('a', AccordionTrigger('A').indicator(Text('+')), AccordionContent(Text('more'))).disabled()).size('sm').allowsMultiple().revealMotion('spring');\n",
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
        "export const x = (open, icon, data, f, menu) => VStack(Tooltip(Text('i'), 'About').presented(open).side('top').openDelay(0).size('md'), Breadcrumb(BreadcrumbItem('Home').link('/').icon(icon).prefix(Text('a')).active(true).disabled().hoverMenu(menu).size('sm')).size('sm').collapses().separatorView(Text('/')).labels({}), ActivityHeatmap(data).days(56).endDate('2026-11-21').levels([1]).emptyTint('mutedFill').cellSize('10').spacing('2xs').weekStart(1).labels({}).onPressDay(f));\n",
    );
    assert!(valid.diagnostics.is_empty(), "{:?}", valid.diagnostics.first().map(|d| &d.message));
    let cases = [
        ("Tooltip(t, 'a').side('left')", "Unknown tooltipSide token 'left' for .side()"),
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
        "export const x = (tags, q, f, file, player) => VStack(TagField(tags, 'Topics').placeholder('Add').suggestions([], 3).allowsCreate(false).max(3).onMaxReached(f).normalize(f).query(q).tint('vivid').size('sm').disabled().invalid().labels({}), FileUpload().file(file).uploadProgress(40).onFileSelected(f).onUploadComplete(f).onReject(f).picker(f).allowedExtensions(['pdf']).maxBytes(5).fileIcon(() => Text('f')).disabled().labels({}), Video(player).contentFit('contain').nativeControls(true).allowsPictureInPicture(false));\n",
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
        "export const x = (open) => HoverCard(Text('@nate'), Text('Card')).presented(open).openDelay(0).closeDelay(300).side('top').align('end').padded(false).disabled().label('Nate').padding('xs');\n",
    );
    assert!(valid.diagnostics.is_empty(), "{:?}", valid.diagnostics.first().map(|d| &d.message));
    let cases = [
        ("HoverCard(Text('a'), Text('b')).side('left')", "Unknown tooltipSide token 'left' for .side()"),
        ("HoverCard(Text('a'), Text('b')).actions(t)", "HoverCard has no modifier .actions()"),
    ];
    for (chain, message) in cases {
        let output = check(&format!("export const x = (t) => {chain};\n"));
        assert_eq!(output.diagnostics[0].message, message, "{chain}");
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
        ("CategoryBar('C', [], t).disabled()", "CategoryBar has no modifier .disabled()"),
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
