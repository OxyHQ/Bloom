use crate::{Platform, compile};

const HELLO: &str = "import { HStack, Text } from '@oxy.so/bloom-language';
export function Hello() {
  return HStack(Text('x').font('body')).padding('md');
}
";

#[test]
fn folds_a_static_chain_into_a_hoisted_tree() {
    let output = compile(HELLO, "hello.tsx", Platform::Native);
    assert!(output.changed && output.diagnostics.is_empty());
    let code = output.code;
    assert!(code.contains(
        "const _bloomStyle0 = {\n\tflexDirection: \"row\",\n\talignItems: \"center\",\n\tpadding: 12\n};"
    ));
    assert!(
        code.contains(
            "const _bloomStyle1 = {\n\tfontSize: 15,\n\tlineHeight: 22,\n\tfontWeight: \"400\"\n};"
        )
    );
    assert!(code.contains("const _bloomColors0 = { color: \"foreground\" };"));
    assert!(code.contains("return _bloomTree0;"), "the render returns the hoisted tree:\n{code}");
    assert!(!code.contains(".padding("), "no chain is left to interpret:\n{code}");
    assert!(output.map.is_some());
}

#[test]
fn web_emits_atomic_classes_and_theme_variables() {
    let output = compile(HELLO, "hello.tsx", Platform::Web);
    assert!(output.code.contains("$$css: true"));
    assert!(output.css.contains("{padding:12px}"));
    assert!(
        output.css.contains("{color:var(--foreground)}"),
        "colour stays a theme variable:\n{}",
        output.css
    );
    assert!(!output.code.contains("@oxy.so/bloom-language/compiled"), "web needs no theme-aware host");
}

#[test]
fn a_wrong_token_is_a_readable_error() {
    let source = HELLO.replace("padding('md')", "padding('mdd')");
    let output = compile(&source, "hello.tsx", Platform::Native);
    assert!(!output.changed);
    let [diagnostic] = output.diagnostics.as_slice() else { panic!("one diagnostic") };
    assert_eq!((diagnostic.line, diagnostic.column), (3, 49));
    assert_eq!(
        diagnostic.rendered,
        "error[bloom]: Unknown spacing token 'mdd' for .padding()
 --> hello.tsx:3:49
  |
3 |   return HStack(Text('x').font('body')).padding('mdd');
  |                                                 ^^^^^
  = help: did you mean 'md'? spacing tokens: none, xs, sm, md, lg, xl"
    );
}

#[test]
fn a_wrong_modifier_names_the_valid_ones() {
    let source = HELLO.replace(".font('body')", ".fnt('body')");
    let output = compile(&source, "hello.tsx", Platform::Native);
    let diagnostic = &output.diagnostics[0];
    assert_eq!(diagnostic.message, "Text has no modifier .fnt()");
    assert_eq!(
        diagnostic.help.as_deref(),
        Some("did you mean 'font'? Text modifiers: padding, font, weight, foreground")
    );
}

#[test]
fn a_runtime_token_becomes_a_table_lookup() {
    let source = HELLO.replace("padding('md')", "padding(size)");
    let output = compile(&source, "hello.tsx", Platform::Native);
    assert!(output.code.contains("const _bloomTable_padding = {"));
    assert!(output.code.contains("style: [_bloomStyle0, _bloomTable_padding[size]]"), "{}", output.code);
}

#[test]
fn a_fixed_token_after_a_runtime_one_on_the_same_style_is_an_error() {
    let source = HELLO.replace(".font('body')", ".weight(w).font('body')");
    let output = compile(&source, "hello.tsx", Platform::Native);
    assert_eq!(
        output.diagnostics[0].message,
        ".font() with a fixed token follows .weight() with a runtime one"
    );
}

#[test]
fn a_runtime_colour_leaves_the_chain_to_the_runtime_but_folds_its_children() {
    let source = "import { HStack, Text } from '@oxy.so/bloom-language';
const row = HStack(Text('x').font('body')).background(tone);
";
    let output = compile(source, "row.ts", Platform::Native);
    assert!(output.code.contains("HStack(_bloomTree0).background(tone)"), "{}", output.code);
}

#[test]
fn files_without_the_language_are_untouched() {
    let source = "import { View } from 'react-native';\nexport const x = 1;\n";
    let output = compile(source, "plain.ts", Platform::Native);
    assert!(!output.changed);
    assert_eq!(output.code, source);
}

#[test]
fn components_with_runtime_values_opt_in_to_the_react_compiler() {
    let source = "import { Text, view } from '@oxy.so/bloom-language';
export const Name = view((name: string) => Text(name).font('body'));
export function Title({ title }: { title: string }) {
  return Text(title).font('subtitle');
}
export function label(text: string) {
  return Text(text).font('caption');
}
export function Static() {
  return Text('x').font('body');
}
";
    let code = compile(source, "view.ts", Platform::Native).code;
    assert!(code.contains("view((name: string) => {\n\t\"use memo\";\n\treturn _bloomJsx("), "{code}");
    assert!(code.contains("function Title({ title }: {\n\ttitle: string;\n}) {\n\t\"use memo\";"), "{code}");
    assert!(code.contains("function label(text: string) {\n\treturn"), "not a component:\n{code}");
    assert!(code.contains("function Static() {\n\treturn _bloomTree0;"), "nothing to memoize:\n{code}");
}
