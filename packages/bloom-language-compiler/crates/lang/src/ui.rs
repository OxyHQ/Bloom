//! Nodes, modifiers and tokens, read from the embedded language's generated
//! spec tables (`bloom_language_compiler::spec`), never a copy of them.

use std::cell::RefCell;
use std::collections::HashMap;
use std::rc::Rc;

use bloom_language_compiler::spec::{MODIFIERS, NODES, NodeSpec, OBJECTS, POINT_PARAMS, TOKEN_SETS};
use bloom_language_compiler::{Doc, Tour};

use crate::diagnostic::closest;
use crate::types::StrSet;

pub fn node_by_constructor(name: &str) -> Option<&'static NodeSpec> {
    NODES.iter().find(|node| node.constructors.contains(&name))
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
    static SETS: RefCell<HashMap<String, Rc<StrSet>>> = RefCell::new(HashMap::new());
}

/// The token set `name` as a type, one shared value per set.
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

/// The arity `params` take: (required, total); `None` total when children take any number.
pub fn arity(params: &[&str]) -> (usize, Option<usize>) {
    let required = params.iter().filter(|p| !p.ends_with('?')).count();
    let total = (!params.contains(&"children")).then_some(params.len());
    (required, total)
}

/// Whether `token` is in `set`; a colour role may carry an opacity (`primary/10`).
pub fn token_ok(set: &StrSet, token: &str) -> bool {
    if set.values.iter().any(|t| t == token) {
        return true;
    }
    if set.token && (set.name == "color" || set.name == "ring") {
        if let Some((role, opacity)) = token.split_once('/') {
            return token_set("color").is_some_and(|roles| roles.contains(&role))
                && token_set("opacity").is_some_and(|opacities| opacities.contains(&opacity));
        }
    }
    false
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

/// Every modifier name of the spec.
pub fn all_modifiers() -> impl Iterator<Item = &'static str> {
    MODIFIERS.iter().map(|(name, _)| *name)
}
