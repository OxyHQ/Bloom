use crate::compile;

const IMPORTS: &str =
    "import { HStack, Icon, Image, Text, VStack, view, defineTokens, regular } from '@oxy.so/bloom-language';
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
    assert_eq!(output.diagnostics[0].message, "Unknown space token 'mdd' for .frame()");
}

#[test]
fn files_without_the_language_are_untouched() {
    let source = "import { View } from 'react-native';\nexport const x = 1;\n";
    let output = compile(source, "plain.ts");
    assert!(!output.changed);
    assert_eq!(output.code, source);
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
    let output = motion("export const x = () => VStack(Text('t').glass()).opacity('disabled');\n");
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
