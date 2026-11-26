//! Nodes, modifiers and tokens, read from the embedded language's generated
//! spec tables (`bloom_language_compiler::spec`), never a copy of them.

use rustc_hash::FxHashMap as HashMap;
use std::cell::RefCell;

use std::rc::Rc;

use bloom_language_compiler::spec::{
    MODIFIERS, NODES, NodeSpec, OBJECTS, POINT_PARAMS, SIGNATURES, TOKEN_SETS,
};
use bloom_language_compiler::{Doc, Tour};

use crate::diagnostic::closest;
use crate::types::StrSet;

pub fn node_by_constructor(name: &str) -> Option<&'static NodeSpec> {
    NODES.iter().find(|node| node.constructors.contains(&name))
}

/// A constructor's positional parameters (`spec::SIGNATURES`); any number of children when unknown.
pub fn signature(constructor: &str) -> &'static [&'static str] {
    SIGNATURES.iter().find(|(name, _)| *name == constructor).map_or(&["...children"], |(_, params)| params)
}

pub fn node(kind: &str) -> Option<&'static NodeSpec> {
    NODES.iter().find(|node| node.kind == kind)
}

pub fn constructors() -> impl Iterator<Item = &'static str> {
    NODES.iter().flat_map(|node| node.constructors.iter().copied())
}

pub fn token_set(name: &str) -> Option<&'static [&'static str]> {
    TOKEN_SETS.iter().find(|(set, _)| *set == name).map(|(_, tokens)| *tokens)
}

/// `Space` → the `space` set: a token set named as a Bloom type.
pub fn token_set_by_type(name: &str) -> Option<Rc<StrSet>> {
    let mut chars = name.chars();
    let first = chars.next()?;
    if !first.is_ascii_uppercase() {
        return None;
    }
    let set = first.to_ascii_lowercase().to_string() + chars.as_str();
    token_set(&set).map(|_| str_set(&set))
}

thread_local! {
    static SETS: RefCell<HashMap<String, Rc<StrSet>>> = RefCell::new(HashMap::default());
}

/// The token set `name` as a type, one shared value per set.
/// The token sets whose TS parameter also takes a boolean: `HitTesting` is
/// `boolean | …`, `.when(condition: Condition | boolean)`, and an
/// accessibility state's `checked` is `boolean | 'mixed'`.
pub const BOOL_SETS: &[&str] = &["hitTesting", "condition", "accessibilityChecked"];

pub fn takes_bool(set: &str) -> bool {
    BOOL_SETS.contains(&set)
}

pub fn str_set(name: &str) -> Rc<StrSet> {
    SETS.with(|sets| {
        sets.borrow_mut()
            .entry(name.to_string())
            .or_insert_with(|| {
                Rc::new(StrSet {
                    name: name.to_string(),
                    values: token_set(name).unwrap_or(&[]).iter().map(|t| t.to_string()).collect(),
                    token: true,
                })
            })
            .clone()
    })
}

/// A node's densities as a set of its own.
pub fn density_set(spec: &NodeSpec) -> Rc<StrSet> {
    Rc::new(StrSet {
        name: format!("{}Density", spec.kind),
        values: spec.densities.iter().map(|d| d.to_string()).collect(),
        token: true,
    })
}

/// The parameters of `modifier` on `spec`: the node's own when it takes them
/// narrower, else the modifier's. `None` when the node does not take it.
pub fn modifier_params(spec: &NodeSpec, modifier: &str) -> Option<&'static [&'static str]> {
    if !spec.modifiers.contains(&modifier) {
        return None;
    }
    Some(
        spec.params
            .iter()
            .chain(MODIFIERS)
            .find(|(name, _)| *name == modifier)
            .map_or(&[][..], |(_, params)| params),
    )
}

/// What a modifier parameter takes, for checking a `.bloom` argument.
#[derive(Debug, Clone)]
pub enum ParamKind {
    Token(Rc<StrSet>),
    /// Points as a computed number, or a token (`frame`, `padding`, …).
    TokenOrPoints(Rc<StrSet>),
    /// An object (`.frame(width: "full")`): its keys and the set each value is in.
    Object {
        keys: &'static [&'static str],
        set: Option<Rc<StrSet>>,
        points: bool,
    },
    Bool,
    View,
    Children,
    /// Anything: TypeScript checks it on the emitted code.
    Any,
}

pub fn param_kind(spec: &NodeSpec, param: &str) -> ParamKind {
    let own = |set: Option<&str>| set.map_or(ParamKind::Any, |set| ParamKind::Token(str_set(set)));
    match param {
        "children" => ParamKind::Children,
        "boolean" => ParamKind::Bool,
        "view" => ParamKind::View,
        "size" => own(spec.size),
        "tint" => own(spec.tint),
        "style" => own(spec.style),
        "shape" => own(spec.shape),
        "blend" => ParamKind::Token(str_set(spec.blend.unwrap_or("blend"))),
        "density" => ParamKind::Token(density_set(spec)),
        param => {
            if let Some((_, keys, set, _)) = OBJECTS.iter().find(|(name, _, _, _)| *name == param) {
                let set = token_set(set).map(|_| str_set(set));
                return ParamKind::Object { keys, set, points: POINT_PARAMS.contains(&param) };
            }
            match token_set(param) {
                Some(_) if POINT_PARAMS.contains(&param) => ParamKind::TokenOrPoints(str_set(param)),
                Some(_) => ParamKind::Token(str_set(param)),
                None => ParamKind::Any,
            }
        }
    }
}

/// Each argument index with its parameter: optional parameters take the
/// arguments beyond the required ones, in order (as the embedded checker pairs them).
pub fn paired(params: &[&'static str], count: usize) -> Vec<(usize, &'static str)> {
    let required = params.iter().filter(|p| !p.ends_with('?')).count();
    let mut optional = count.saturating_sub(required);
    let mut pairs = Vec::new();
    let mut index = 0;
    for param in params {
        let param = match param.strip_suffix('?') {
            Some(param) if optional > 0 => {
                optional -= 1;
                param
            }
            Some(_) => continue,
            None => param,
        };
        if index >= count {
            break;
        }
        pairs.push((index, param));
        index += 1;
    }
    pairs
}

/// The arity `params` take: (required, total); `None` total when children take any number
/// (none included: `.modifier(m)` is `m(view)`, with no further arguments).
pub fn arity(params: &[&str]) -> (usize, Option<usize>) {
    let required = params.iter().filter(|p| !p.ends_with('?') && **p != "children").count();
    let total = (!params.contains(&"children")).then_some(params.len());
    (required, total)
}

/// Whether `token` is in `set`; a colour role may carry an opacity (`primary/10`).
pub fn token_ok(set: &StrSet, token: &str) -> bool {
    let known = match set.token.then(|| spec_set(&set.name)).flatten() {
        Some(tokens) => tokens.contains(token),
        None => set.values.iter().any(|t| t == token),
    };
    if known {
        return true;
    }
    if set.token
        && (set.name == "color" || set.name == "ring")
        && let Some((role, opacity)) = token.split_once('/')
    {
        return token_set("color").is_some_and(|roles| roles.contains(&role))
            && token_set("opacity").is_some_and(|opacities| opacities.contains(&opacity));
    }
    false
}

/// A spec token set, hashed: a colour set is long, and every token argument is looked up.
fn spec_set(name: &str) -> Option<&'static rustc_hash::FxHashSet<&'static str>> {
    static SETS: std::sync::OnceLock<HashMap<&'static str, rustc_hash::FxHashSet<&'static str>>> =
        std::sync::OnceLock::new();
    SETS.get_or_init(|| {
        TOKEN_SETS.iter().map(|(name, tokens)| (*name, tokens.iter().copied().collect())).collect()
    })
    .get(name)
}

/// The closest valid token, for `did you mean`.
pub fn closest_token<'s>(set: &'s StrSet, token: &str) -> Option<&'s str> {
    closest(token, set.values.iter().map(String::as_str))
}

/// The docs page of a token set, else of the tokens tour.
pub fn token_docs(set: &StrSet) -> String {
    Doc::tokens(&set.name).unwrap_or(Doc::Tour(Tour::Tokens)).url()
}

pub fn modifier_docs(modifier: &str) -> String {
    Doc::modifier(modifier).url()
}

pub fn node_docs(kind: &'static str) -> String {
    Doc::Node(kind).url()
}

/// The constructors of the nodes that take `modifier`, for a help line.
pub fn takers(modifier: &str) -> Vec<&'static str> {
    NODES
        .iter()
        .filter(|node| node.modifiers.contains(&modifier))
        .flat_map(|node| node.constructors.iter().copied())
        .collect()
}

#[cfg(test)]
mod tests {
    /// Every token set the language's TS unions with `boolean` is one bloomc takes a `Bool` for.
    #[test]
    fn bool_sets_follow_the_tokens() {
        let path = concat!(env!("CARGO_MANIFEST_DIR"), "/../../../bloom-language/src/tokens.ts");
        let source = std::fs::read_to_string(path).expect("the language's tokens.ts");
        for line in source.lines() {
            let Some(rest) = line.split(" = boolean | (typeof ENUMS.").nth(1) else { continue };
            let set = rest.split(')').next().expect("a set name");
            assert!(super::takes_bool(set), "`{set}` takes a boolean in tokens.ts: add it to BOOL_SETS");
        }
    }
}
