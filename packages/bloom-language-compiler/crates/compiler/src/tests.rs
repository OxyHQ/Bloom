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
    let imports = "import { AreaChartCard, BarListCard, ChartCardSurface, LineChartCard, RadarChartCard, Sparkline, StepsCard, VStack } from '@oxy.so/bloom-language';\n";
    let check = |body: &str| compile(&format!("{imports}{body}"), "row.tsx");
    let valid = check(
        "export const x = (d) => VStack(AreaChartCard({ data: d }).style('percent').shape('sharp'), BarListCard().tint('success'), ChartCardSurface(d).spacing('sm'), LineChartCard().shape('curved').tint('primary').activeTint('error/half'), RadarChartCard().style('score'), Sparkline(d).tint('negative'), StepsCard(d).tint('info').activeTint('primary'));\n",
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
        ("ComposerPanelStatusTab().disabled()", "ComposerPanelStatusTab has no modifier .disabled()"),
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
        ("TenancyTimeline(o).density('comfortable')", "Unknown density token 'comfortable' for .density()"),
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
         PlacePicker('Address', p, q, o).size('sm').disabled()];\n",
    );
    assert!(valid.diagnostics.is_empty(), "{:?}", valid.diagnostics.first().map(|d| &d.message));
    let output = check("export const x = () => PlaceCard('Forner').style('compact');\n");
    assert_eq!(output.diagnostics[0].message, "Unknown placeCardStyle token 'compact' for .style()");
    let output = check("export const x = (l) => DirectionsSteps(l).size('md');\n");
    assert_eq!(output.diagnostics[0].message, "Unknown directionsDensity token 'md' for .size()");
    let output = check("export const x = (p, q, o) => PlacePicker('Address', p, q, o).style('plain');\n");
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
        ("SavedSearchCard('a').disabled()", "SavedSearchCard has no modifier .disabled()"),
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
        ("RentalActionCard('a').disabled()", "RentalActionCard has no modifier .disabled()"),
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
        "export const x = (p, c) => VStack(ListingCard('Flat', p).style('horizontal').density('compact').loading(), ListingCardGrid(c).density('default'), WishlistCard('Summer', p).tint('primary/half'));\n",
    );
    assert!(valid.diagnostics.is_empty(), "{:?}", valid.diagnostics.first().map(|d| &d.message));
    let cases = [
        ("ListingCard('a', p).style('grid')", "Unknown listingCardLayout token 'grid' for .style()"),
        ("ListingCardGrid(c).density('results')", "Unknown density token 'results' for .density()"),
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
        ("ListingQualityMeter(i).disabled()", "ListingQualityMeter has no modifier .disabled()"),
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
