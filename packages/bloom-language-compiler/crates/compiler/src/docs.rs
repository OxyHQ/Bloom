//! Where each problem is explained: a section of the language reference
//! (generated from the spec, one heading per node kind, modifier and token
//! set) or of the tour. Every diagnostic links one or more.

use crate::spec::{DOCUMENTED_TOKEN_SETS, MODIFIERS, NODES};

/// The docs folder every link points into.
pub const DOCS_BASE: &str = "https://github.com/OxyHQ/Bloom/blob/main/docs/";

/// A section of the docs.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Doc {
    /// A node kind's section of `bloom-language-nodes.mdx`: its constructors,
    /// own modifiers and token sets.
    Node(&'static str),
    /// A modifier's section of `bloom-language-modifiers.mdx`: its parameters
    /// and the tokens each takes.
    Modifier(&'static str),
    /// A token set's section of `bloom-language-tokens.mdx` (a scale or an enum).
    Tokens(&'static str),
    /// A section of the tour, `bloom-language-tour.mdx`.
    Tour(Tour),
}

/// The tour's sections a problem points to.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Tour {
    ModifiersAndOrder,
    Tokens,
    Variants,
    Environment,
    CustomModifiers,
    Layout,
    Navigation,
    AnimationAndGestures,
    Glass,
    GlassGroups,
    LiquidGlassRules,
    Accessibility,
}

impl Tour {
    const ALL: &[Tour] = &[
        Tour::ModifiersAndOrder,
        Tour::Tokens,
        Tour::Variants,
        Tour::Environment,
        Tour::CustomModifiers,
        Tour::Layout,
        Tour::Navigation,
        Tour::AnimationAndGestures,
        Tour::Glass,
        Tour::GlassGroups,
        Tour::LiquidGlassRules,
        Tour::Accessibility,
    ];

    fn anchor(self) -> &'static str {
        match self {
            Tour::ModifiersAndOrder => "modifiers-and-order",
            Tour::Tokens => "tokens",
            Tour::Variants => "variants",
            Tour::Environment => "environment",
            Tour::CustomModifiers => "custom-modifiers",
            Tour::Layout => "layout",
            Tour::Navigation => "navigation",
            Tour::AnimationAndGestures => "animation-and-gestures",
            Tour::Glass => "glass",
            Tour::GlassGroups => "glass-groups",
            Tour::LiquidGlassRules => "liquid-glass-rules",
            Tour::Accessibility => "accessibility",
        }
    }
}

impl Doc {
    /// A modifier's section, when the spec has the modifier.
    pub fn find_modifier(name: &str) -> Option<Doc> {
        MODIFIERS.iter().find(|(modifier, _)| *modifier == name).map(|(modifier, _)| Doc::Modifier(modifier))
    }

    /// A modifier's section; the tour's on modifiers for a name the spec lacks.
    pub fn modifier(name: &str) -> Doc {
        Doc::find_modifier(name).unwrap_or(Doc::Tour(Tour::ModifiersAndOrder))
    }

    /// A token set's section, when the set has one of its own (a set the
    /// compiler composes, such as `padding`'s, is explained by its modifier).
    pub fn tokens(set: &str) -> Option<Doc> {
        DOCUMENTED_TOKEN_SETS.iter().find(|name| **name == set).map(|name| Doc::Tokens(name))
    }

    pub fn url(self) -> String {
        let (file, anchor) = match self {
            Doc::Node(kind) => ("bloom-language-nodes.mdx", kind.to_lowercase()),
            Doc::Modifier(name) => ("bloom-language-modifiers.mdx", name.to_lowercase()),
            Doc::Tokens(set) => ("bloom-language-tokens.mdx", set.to_lowercase()),
            Doc::Tour(section) => ("bloom-language-tour.mdx", section.anchor().to_string()),
        };
        format!("{DOCS_BASE}{file}#{anchor}")
    }
}

/// Every link a diagnostic can carry, for checking each against the docs.
pub fn links() -> Vec<String> {
    let nodes = NODES.iter().map(|node| Doc::Node(node.kind));
    let modifiers = MODIFIERS.iter().map(|(name, _)| Doc::Modifier(name));
    let tokens = DOCUMENTED_TOKEN_SETS.iter().map(|set| Doc::Tokens(set));
    let tour = Tour::ALL.iter().map(|section| Doc::Tour(*section));
    nodes.chain(modifiers).chain(tokens).chain(tour).map(Doc::url).collect()
}
