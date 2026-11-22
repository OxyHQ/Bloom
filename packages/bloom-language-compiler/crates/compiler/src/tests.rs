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
