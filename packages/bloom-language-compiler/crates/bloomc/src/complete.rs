//! Completion in a `.bloom` document: what is in scope, a receiver's members
//! after `.` (struct fields, enum cases, a node's modifiers), the expected
//! enum's cases after a bare `.`, the tokens a modifier's argument takes inside
//! its string, and the keywords.

use bloom_lang::{Analysis, DefinitionKind, MemberKind, Span};
use bloom_language_compiler::spec::{MODIFIERS, NODES, NodeSpec, TOKEN_SETS};

/// LSP's `CompletionItemKind`s used here.
pub mod kind {
    pub const METHOD: u32 = 2;
    pub const FUNCTION: u32 = 3;
    pub const CONSTRUCTOR: u32 = 4;
    pub const FIELD: u32 = 5;
    pub const VARIABLE: u32 = 6;
    pub const CLASS: u32 = 7;
    pub const MODULE: u32 = 9;
    pub const VALUE: u32 = 12;
    pub const KEYWORD: u32 = 14;
    pub const ENUM_MEMBER: u32 = 20;
}

#[derive(Debug, Clone, PartialEq)]
pub struct Item {
    pub label: String,
    pub kind: u32,
    pub detail: Option<String>,
    /// The text it replaces (a token's typed part, inside its string), when not the word at the cursor.
    pub replace: Option<Span>,
}

impl Item {
    fn new(label: impl Into<String>, kind: u32, detail: Option<String>) -> Self {
        Self { label: label.into(), kind, detail, replace: None }
    }
}

/// A name the analysis gets in place of the one being typed, so `x.` parses as `x.x`.
const PLACEHOLDER: &str = "bloomcCompletion";

/// The completions at `offset` of `text`; `analyze` analyses a version of the
/// text (the document, or it with a placeholder name where one is being typed).
pub fn complete(text: &str, offset: u32, analyze: &dyn Fn(&str) -> Analysis) -> Vec<Item> {
    let offset = (offset as usize).min(text.len());
    if let Some(argument) = token_argument(text, offset) {
        let replace = Some(Span::new(argument.start as u32, offset as u32));
        return tokens_for(argument.modifier, argument.index, argument.head)
            .into_iter()
            .map(|token| Item {
                label: token.to_string(),
                kind: kind::VALUE,
                detail: Some(format!(".{}()", argument.modifier)),
                replace,
            })
            .collect();
    }
    let start = word_start(text, offset);
    // Analysed with a placeholder for the name being typed, so the line parses.
    let patched = |at: usize| {
        let mut patched = String::with_capacity(text.len() + PLACEHOLDER.len());
        patched.push_str(&text[..at]);
        patched.push_str(PLACEHOLDER);
        patched.push_str(&text[offset..]);
        patched
    };
    if let Some(dot) = text[..start].strip_suffix('.').map(str::len) {
        let analysis = analyze(&patched(start));
        if has_receiver(text, dot) {
            return analysis
                .members_at(dot as u32)
                .into_iter()
                .map(|member| {
                    let (kind, detail) = match member.kind {
                        MemberKind::Field => (kind::FIELD, member.ty),
                        MemberKind::Case => (kind::ENUM_MEMBER, member.ty),
                        MemberKind::Method => (kind::METHOD, member.ty),
                        MemberKind::Modifier => (kind::METHOD, Some("modifier".to_string())),
                    };
                    Item::new(member.name, kind, detail)
                })
                .collect();
        }
        // `.case` where an enum is expected.
        let Some(expected) = analysis.expected_type_at(dot as u32) else { return Vec::new() };
        let name = type_name(&expected);
        return analysis
            .definitions
            .iter()
            .filter(|d| d.kind == DefinitionKind::Case && d.ty.as_deref() == Some(name))
            .map(|d| Item::new(d.name.clone(), kind::ENUM_MEMBER, d.ty.clone()))
            .collect();
    }
    let analysis = analyze(&patched(start));
    // The values in scope, then the types (they are in scope everywhere).
    let mut defs = analysis.scope_at(start as u32);
    let types: Vec<usize> = (0..analysis.definitions.len())
        .filter(|i| {
            let d = &analysis.definitions[*i];
            d.kind == DefinitionKind::Item && d.ty.is_none() && !defs.contains(i)
        })
        .collect();
    defs.extend(types);
    let mut items: Vec<Item> = defs
        .into_iter()
        .map(|def| &analysis.definitions[def])
        .filter(|d| d.name != PLACEHOLDER)
        .map(|d| {
            let kind = match (d.kind, &d.ty) {
                (DefinitionKind::Item, None) => kind::CLASS,
                (DefinitionKind::Item, Some(_)) => kind::FUNCTION,
                (DefinitionKind::Field, _) => kind::FIELD,
                (DefinitionKind::Case, _) => kind::ENUM_MEMBER,
                (DefinitionKind::Import, None) => kind::MODULE,
                _ => kind::VARIABLE,
            };
            Item::new(d.name.clone(), kind, d.ty.clone())
        })
        .collect();
    let constructors = NODES.iter().flat_map(|n| n.constructors.iter().copied());
    let mut seen: std::collections::BTreeSet<String> = items.iter().map(|i| i.label.clone()).collect();
    for constructor in constructors {
        if seen.insert(constructor.to_string()) {
            items.push(Item::new(constructor, kind::CONSTRUCTOR, Some("node".to_string())));
        }
    }
    items.extend(bloom_lang::KEYWORDS.iter().map(|k| Item::new(*k, kind::KEYWORD, None)));
    items
}

/// `Load<String>?` names `Load`.
fn type_name(ty: &str) -> &str {
    let ty = ty.trim_end_matches('?');
    ty.split('<').next().unwrap_or(ty).trim()
}

fn is_word(c: char) -> bool {
    c.is_alphanumeric() || c == '_'
}

fn word_start(text: &str, offset: usize) -> usize {
    text[..offset].char_indices().rev().take_while(|&(_, c)| is_word(c)).last().map_or(offset, |(i, _)| i)
}

/// Whether the `.` at `dot` follows a receiver (`x.`, `f().`, a chain on the
/// next line), not an operator or an opening bracket (`.case` shorthand).
fn has_receiver(text: &str, dot: usize) -> bool {
    text[..dot]
        .trim_end()
        .chars()
        .next_back()
        .is_some_and(|c| is_word(c) || matches!(c, ')' | ']' | '}' | '"' | '?' | '!'))
}

/// The modifier argument a cursor inside a string is in: `.padding("|")`.
#[derive(Debug, PartialEq)]
struct TokenArgument<'t> {
    modifier: &'t str,
    /// Its position among the call's arguments.
    index: usize,
    /// The constructor that starts the chain (`Text` in `Text("a").font("|")`).
    head: Option<&'t str>,
    /// Where the string's text starts.
    start: usize,
}

fn token_argument(text: &str, offset: usize) -> Option<TokenArgument<'_>> {
    let line_start = text[..offset].rfind('\n').map_or(0, |i| i + 1);
    // The string open at the cursor on this line, if any.
    let mut open: Option<usize> = None;
    let mut chars = text[line_start..offset].char_indices();
    while let Some((i, c)) = chars.next() {
        match (open, c) {
            (Some(_), '\\') => {
                chars.next();
            }
            (Some(_), '"') => open = None,
            (None, '"') => open = Some(line_start + i),
            _ => {}
        }
    }
    let quote = open?;
    if text[quote..offset].contains("${") {
        return None;
    }
    let before = text[..quote].trim_end();
    if !before.ends_with('(') && !before.ends_with(',') {
        return None;
    }
    let (paren, index) = unclosed_paren(text, before.len())?;
    let name_start = word_start(text, paren);
    let modifier = &text[name_start..paren];
    let dot = text[..name_start].strip_suffix('.').map(str::len)?;
    if modifier.is_empty() {
        return None;
    }
    Some(TokenArgument { modifier, index, head: chain_head(text, dot), start: quote + 1 })
}

/// The `(` still open at `end`, and how many arguments come before `end` in it.
fn unclosed_paren(text: &str, end: usize) -> Option<(usize, usize)> {
    let bytes = text.as_bytes();
    let (mut depth, mut commas) = (0usize, 0usize);
    let mut i = end;
    while i > 0 {
        i -= 1;
        match bytes[i] {
            b'"' => i = string_start(bytes, i)?,
            b')' | b']' | b'}' => depth += 1,
            b'(' if depth == 0 => return Some((i, commas)),
            b'(' | b'[' | b'{' => depth = depth.checked_sub(1)?,
            b',' if depth == 0 => commas += 1,
            _ => {}
        }
    }
    None
}

/// The opening quote of the string whose closing quote is at `close`.
fn string_start(bytes: &[u8], close: usize) -> Option<usize> {
    let mut i = close;
    while i > 0 {
        i -= 1;
        if bytes[i] == b'"' && (i == 0 || bytes[i - 1] != b'\\') {
            return Some(i);
        }
    }
    None
}

/// The bracket that opens the group closed at `close`.
fn group_start(text: &str, close: usize) -> Option<usize> {
    let bytes = text.as_bytes();
    let mut depth = 0usize;
    let mut i = close + 1;
    while i > 0 {
        i -= 1;
        match bytes[i] {
            b'"' if i != close => i = string_start(bytes, i)?,
            b')' | b']' | b'}' => depth += 1,
            b'(' | b'[' | b'{' => {
                depth -= 1;
                if depth == 0 {
                    return Some(i);
                }
            }
            _ => {}
        }
    }
    None
}

/// The constructor at the start of the chain whose modifier's `.` is at `dot`:
/// back over `(…)`, `{…}` and `.name` links to the first name.
fn chain_head(text: &str, dot: usize) -> Option<&str> {
    let mut at = dot;
    loop {
        let mut end = text[..at].trim_end().len();
        while text[..end].ends_with([')', ']', '}']) {
            end = text[..group_start(text, end - 1)?].trim_end().len();
        }
        let start = word_start(text, end);
        if start == end {
            return None;
        }
        match text[..start].trim_end().strip_suffix('.') {
            Some(before) => at = before.len(),
            None => return Some(&text[start..end]),
        }
    }
}

/// The tokens a modifier's argument at `index` takes on the node `head` makes:
/// the node's own parameters for it when it narrows them, else the modifier's;
/// an optional parameter may be left out, so the next one can be at `index` too.
fn tokens_for(modifier: &str, index: usize, head: Option<&str>) -> Vec<&'static str> {
    let node: Option<&NodeSpec> = head.and_then(|h| NODES.iter().find(|n| n.constructors.contains(&h)));
    let params = node
        .and_then(|n| n.params.iter().find(|(m, _)| *m == modifier))
        .or_else(|| MODIFIERS.iter().find(|(m, _)| *m == modifier))
        .map_or(&[][..], |(_, params)| *params);
    let mut out: Vec<&'static str> = Vec::new();
    for param in params.iter().skip(index) {
        let name = param.trim_end_matches('?');
        let tokens: &[&'static str] = match (name, node) {
            ("density", Some(n)) => n.densities,
            ("size" | "tint" | "style" | "shape" | "blend", Some(n)) => {
                let set = match name {
                    "size" => n.size,
                    "tint" => n.tint,
                    "style" => n.style,
                    "shape" => n.shape,
                    _ => n.blend,
                };
                set.and_then(token_set).unwrap_or(&[])
            }
            _ => token_set(name).unwrap_or(&[]),
        };
        for token in tokens {
            if !out.contains(token) {
                out.push(token);
            }
        }
        if !param.ends_with('?') {
            break;
        }
    }
    out
}

fn token_set(name: &str) -> Option<&'static [&'static str]> {
    TOKEN_SETS.iter().find(|(set, _)| *set == name).map(|(_, tokens)| *tokens)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn at(text: &str) -> (String, usize) {
        let offset = text.find('|').expect("a cursor");
        (text.replacen('|', "", 1), offset)
    }

    #[test]
    fn a_string_argument_of_a_modifier_is_found_with_its_chain() {
        let (text, offset) = at("  Text(\"a\").padding(\"top\", \"m|\")");
        let argument = token_argument(&text, offset).unwrap();
        assert_eq!((argument.modifier, argument.index, argument.head), ("padding", 1, Some("Text")));
        assert_eq!(&text[argument.start..offset], "m");

        let (text, offset) = at("HStack {\n  Text(\"(\")\n}\n.spacing(\"|\")");
        let argument = token_argument(&text, offset).unwrap();
        assert_eq!((argument.modifier, argument.head), ("spacing", Some("HStack")));

        let (text, offset) = at("Button(Text(t(\"x\"))).disabled(!a).font(\"|\")");
        assert_eq!(token_argument(&text, offset).unwrap().head, Some("Button"));

        // Not a modifier's argument: a call's, or a string's interpolation.
        assert_eq!(token_argument(&at("t(\"|\")").0, at("t(\"|\")").1), None);
        let (text, offset) = at("Text(\"${a|}\")");
        assert_eq!(token_argument(&text, offset), None);
    }

    #[test]
    fn tokens_come_from_the_modifier_or_the_node() {
        let padding = tokens_for("padding", 0, Some("Text"));
        // `edge?` may be left out: the edges and the space tokens.
        assert!(padding.contains(&"top") && padding.contains(&"md"), "{padding:?}");
        assert!(!tokens_for("padding", 1, Some("Text")).contains(&"top"));
        assert!(tokens_for("font", 0, Some("Text")).contains(&"headline"));
        assert!(tokens_for("foreground", 0, None).contains(&"muted"));
    }

    #[test]
    fn a_dot_after_an_operator_has_no_receiver() {
        assert!(has_receiver("x.", 1));
        assert!(has_receiver("}\n  .", 4));
        assert!(!has_receiver("tone = .", 7));
        assert!(!has_receiver("f(.", 2));
    }

    #[test]
    fn a_type_name_loses_its_arguments() {
        assert_eq!(type_name("Load<String>?"), "Load");
        assert_eq!(type_name("Tone"), "Tone");
    }
}
