//! Recognise a Bloom chain and fold it into a resolved node.
//!
//! A chain is a component call followed by modifier calls:
//! `HStack(Text('x').font('body')).padding('md')`. Folding resolves every
//! modifier's token now, so the output carries numbers and colour roles only.

use std::collections::HashMap;

use oxc_ast::ast::{Argument, Expression};
use oxc_span::{GetSpan, Span};

use crate::diagnostics::suggest;
use crate::tokens::{self, COLORS, RADIUS, SPACE, TYPE_ROLES, WEIGHTS};

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Component {
    HStack,
    VStack,
    Text,
}

impl Component {
    pub fn from_export(name: &str) -> Option<Self> {
        match name {
            "HStack" => Some(Self::HStack),
            "VStack" => Some(Self::VStack),
            "Text" => Some(Self::Text),
            _ => None,
        }
    }

    pub fn name(self) -> &'static str {
        match self {
            Self::HStack => "HStack",
            Self::VStack => "VStack",
            Self::Text => "Text",
        }
    }

    pub fn is_text(self) -> bool {
        self == Self::Text
    }

    fn modifiers(self) -> &'static [&'static str] {
        match self {
            Self::HStack | Self::VStack => &["padding", "spacing", "corner", "background"],
            Self::Text => &["padding", "font", "weight", "foreground"],
        }
    }

    /// The component's own style before any modifier.
    fn base_style(self) -> Style {
        let mut style = Style::default();
        match self {
            Self::HStack => {
                style.set("flexDirection", Value::Str("row"));
                style.set("alignItems", Value::Str("center"));
            }
            Self::VStack => style.set("flexDirection", Value::Str("column")),
            Self::Text => style.set_color("color", "foreground"),
        }
        style
    }
}

#[derive(Debug, Clone, PartialEq)]
pub enum Value {
    Number(f64),
    Str(&'static str),
}

/// A resolved style: theme-invariant values, plus the properties whose value
/// is a colour role and so depends on the active theme. Insertion-ordered, a
/// later modifier replacing an earlier one's property.
#[derive(Debug, Clone, Default, PartialEq)]
pub struct Style {
    pub fixed: Vec<(&'static str, Value)>,
    pub themed: Vec<(&'static str, &'static str)>,
}

impl Style {
    fn set(&mut self, property: &'static str, value: Value) {
        self.fixed.retain(|(p, _)| *p != property);
        self.fixed.push((property, value));
    }

    fn set_color(&mut self, property: &'static str, role: &'static str) {
        self.themed.retain(|(p, _)| *p != property);
        self.themed.push((property, role));
    }
}

#[derive(Debug)]
pub struct Node {
    pub component: Component,
    pub span: Span,
    pub style: Style,
    /// Modifiers whose token is a runtime value (`.spacing(gap)`), with the
    /// value's span. Tokens are a closed set, so each compiles to a lookup in
    /// a precomputed table rather than to runtime resolution.
    pub tables: Vec<(&'static str, Span)>,
    pub children: Vec<Child>,
}

#[derive(Debug)]
pub enum Child {
    Node(Node),
    Text(String),
    /// A runtime value (`post.text`, `post.media && Media(…)`), kept as source.
    Dynamic(Span),
}

pub enum Analysis {
    NotAChain,
    /// A chain that needs runtime values in a modifier; left to the runtime.
    Dynamic,
    Folded(Node),
    Error {
        span: Span,
        message: String,
        help: Option<String>,
    },
}

/// Local binding name → Bloom component, from `import { … } from '@oxy.so/bloom-language'`.
pub type Imports = HashMap<String, Component>;

pub fn analyze(expression: &Expression, imports: &Imports) -> Analysis {
    // Peel `.modifier(…)` calls off the outside, then expect a component call.
    let mut modifiers = Vec::new();
    let mut current = expression.without_parentheses();
    loop {
        let Expression::CallExpression(call) = current else { return Analysis::NotAChain };
        match &call.callee {
            Expression::StaticMemberExpression(member) => {
                modifiers.push((member.property.name.as_str(), member.property.span, &call.arguments));
                current = member.object.without_parentheses();
            }
            Expression::Identifier(callee) => {
                let Some(&component) = imports.get(callee.name.as_str()) else {
                    return Analysis::NotAChain;
                };
                return fold(component, &call.arguments, &modifiers, expression.span(), imports);
            }
            _ => return Analysis::NotAChain,
        }
    }
}

fn fold(
    component: Component,
    arguments: &[Argument],
    modifiers: &[(&str, Span, &oxc_allocator::Vec<Argument>)],
    chain_span: Span,
    imports: &Imports,
) -> Analysis {
    let mut children = Vec::new();
    for argument in arguments {
        let Some(child) = argument.as_expression() else { return Analysis::Dynamic };
        match child.without_parentheses() {
            Expression::StringLiteral(text) => children.push(Child::Text(text.value.display().to_string())),
            other => match analyze(other, imports) {
                Analysis::Folded(node) => children.push(Child::Node(node)),
                Analysis::Error { span, message, help } => return Analysis::Error { span, message, help },
                Analysis::NotAChain | Analysis::Dynamic => children.push(Child::Dynamic(child.span())),
            },
        }
    }

    let mut style = component.base_style();
    let mut tables: Vec<(&'static str, Span)> = Vec::new();
    // Modifiers were collected outside-in; they apply inside-out, in source order.
    for (name, name_span, arguments) in modifiers.iter().rev() {
        let Some(&modifier) = component.modifiers().iter().find(|known| *known == name) else {
            return Analysis::Error {
                span: *name_span,
                message: format!("{} has no modifier .{name}()", component.name()),
                help: Some(with_suggestion(
                    suggest(name, component.modifiers()),
                    format!("{} modifiers: {}", component.name(), component.modifiers().join(", ")),
                )),
            };
        };
        let [argument] = arguments.as_slice() else {
            return Analysis::Error {
                span: *name_span,
                message: format!(".{name}() takes one token"),
                help: None,
            };
        };
        let Some(value) = argument.as_expression() else { return Analysis::Dynamic };
        let Expression::StringLiteral(token) = value.without_parentheses() else {
            // Colour roles stay on the runtime path for now (see STUDY.md).
            if is_color(modifier) {
                return Analysis::Dynamic;
            }
            tables.retain(|(earlier, _)| *earlier != modifier);
            tables.push((modifier, value.span()));
            continue;
        };
        // A table applies after the static style, so a later static modifier
        // must not write a property an earlier table writes.
        if let Some((earlier, _)) = tables.iter().find(|(earlier, _)| overlaps(earlier, modifier)) {
            return Analysis::Error {
                span: *name_span,
                message: format!(".{modifier}() with a fixed token follows .{earlier}() with a runtime one"),
                help: Some(format!("both set the same style; move .{modifier}() before .{earlier}()")),
            };
        }
        if let Err((message, help)) = apply(&mut style, modifier, token.value.as_str().unwrap_or_default()) {
            return Analysis::Error { span: token.span, message, help: Some(help) };
        }
    }

    Analysis::Folded(Node { component, span: chain_span, style, tables, children })
}

/// Resolve one modifier's token into style properties.
fn apply(style: &mut Style, modifier: &str, token: &str) -> Result<(), (String, String)> {
    let unknown = |kind: &str, names: &[&str]| {
        (
            format!("Unknown {kind} token '{token}' for .{modifier}()"),
            with_suggestion(suggest(token, names), format!("{kind} tokens: {}", names.join(", "))),
        )
    };
    match modifier {
        "padding" | "spacing" => {
            let value =
                *tokens::lookup(SPACE, token).ok_or_else(|| unknown("spacing", &tokens::names(SPACE)))?;
            let property = if modifier == "padding" { "padding" } else { "gap" };
            style.set(property, Value::Number(value));
        }
        "corner" => {
            let value =
                *tokens::lookup(RADIUS, token).ok_or_else(|| unknown("radius", &tokens::names(RADIUS)))?;
            style.set("borderRadius", Value::Number(value));
        }
        "font" => {
            let role = tokens::lookup(TYPE_ROLES, token)
                .ok_or_else(|| unknown("type", &tokens::names(TYPE_ROLES)))?;
            style.set("fontSize", Value::Number(role.size));
            style.set("lineHeight", Value::Number(role.line_height));
            style.set("fontWeight", Value::Str(role.weight));
        }
        "weight" => {
            let weight =
                *tokens::lookup(WEIGHTS, token).ok_or_else(|| unknown("weight", &tokens::names(WEIGHTS)))?;
            style.set("fontWeight", Value::Str(weight));
        }
        "foreground" | "background" => {
            let role = COLORS.iter().find(|role| **role == token).ok_or_else(|| unknown("colour", COLORS))?;
            let property = if modifier == "foreground" { "color" } else { "backgroundColor" };
            style.set_color(property, role);
        }
        _ => unreachable!("modifier lists and apply() cover the same names"),
    }
    Ok(())
}

/// Every token of a length or type modifier with the style it resolves to.
pub fn modifier_table(modifier: &str) -> Vec<(&'static str, Style)> {
    let names = match modifier {
        "padding" | "spacing" => tokens::names(SPACE),
        "corner" => tokens::names(RADIUS),
        "font" => tokens::names(TYPE_ROLES),
        "weight" => tokens::names(WEIGHTS),
        _ => unreachable!("colour modifiers never become tables"),
    };
    names
        .into_iter()
        .map(|token| {
            let mut style = Style::default();
            apply(&mut style, modifier, token).expect("a token from the modifier's own table");
            (token, style)
        })
        .collect()
}

fn is_color(modifier: &str) -> bool {
    matches!(modifier, "foreground" | "background")
}

fn properties(modifier: &str) -> &'static [&'static str] {
    match modifier {
        "padding" => &["padding"],
        "spacing" => &["gap"],
        "corner" => &["borderRadius"],
        "font" => &["fontSize", "lineHeight", "fontWeight"],
        "weight" => &["fontWeight"],
        "foreground" => &["color"],
        "background" => &["backgroundColor"],
        _ => &[],
    }
}

fn overlaps(a: &str, b: &str) -> bool {
    properties(a).iter().any(|property| properties(b).contains(property))
}

fn with_suggestion(suggestion: Option<String>, list: String) -> String {
    match suggestion {
        Some(suggestion) => format!("{suggestion} {list}"),
        None => list,
    }
}
