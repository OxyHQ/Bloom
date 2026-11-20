//! Turn a folded node into JavaScript: hoisted styles, a hoisted element tree
//! when nothing in it is dynamic, and holes where runtime values go.
//!
//! The emitter writes JavaScript text; `lib.rs` parses it back into the
//! module's AST, so the rest of the file is never re-serialised by hand.

use std::fmt::Write;

use oxc_span::Span;

use crate::chain::{self, Child, Component, Node, Style, Value};

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Platform {
    /// iOS and Android through React Native: hoisted style objects, colour
    /// roles resolved by the theme-aware hosts.
    Native,
    /// react-native-web: atomic classes (`$$css` style objects) plus a CSS
    /// sheet in which colours are theme variables.
    Web,
}

/// The identifier the emitted text uses for the n-th runtime value.
pub fn hole_name(index: usize) -> String {
    format!("__bloomHole{index}")
}

pub struct Emitter {
    platform: Platform,
    /// Module-scope declarations, each with the source span it maps back to.
    pub declarations: Vec<(String, Span)>,
    styles: Vec<(Style, String)>,
    tables: Vec<&'static str>,
    colors: Vec<(Style, String)>,
    pub css: Vec<String>,
    uses_view: bool,
    uses_text: bool,
    uses_themed_view: bool,
    trees: usize,
}

const RUNTIME_NATIVE: &str = "@oxy.so/bloom-language/compiled";

impl Emitter {
    pub fn new(platform: Platform) -> Self {
        Self {
            platform,
            declarations: Vec::new(),
            styles: Vec::new(),
            tables: Vec::new(),
            colors: Vec::new(),
            css: Vec::new(),
            uses_view: false,
            uses_text: false,
            uses_themed_view: false,
            trees: 0,
        }
    }

    pub fn is_empty(&self) -> bool {
        self.declarations.is_empty()
    }

    /// The import statements the emitted code needs, in a stable order.
    pub fn imports(&self) -> Vec<String> {
        let mut imports =
            vec!["import { jsx as _bloomJsx, jsxs as _bloomJsxs } from \"react/jsx-runtime\";".to_string()];
        match self.platform {
            Platform::Native => {
                if self.uses_view {
                    imports.push("import { View as _BloomView } from \"react-native\";".into());
                }
                let mut hosts = Vec::new();
                if self.uses_text {
                    hosts.push("BloomText as _BloomText");
                }
                if self.uses_themed_view {
                    hosts.push("BloomView as _BloomThemedView");
                }
                if !hosts.is_empty() {
                    imports.push(format!("import {{ {} }} from \"{RUNTIME_NATIVE}\";", hosts.join(", ")));
                }
            }
            Platform::Web => {
                let mut hosts = Vec::new();
                if self.uses_view {
                    hosts.push("View as _BloomView");
                }
                if self.uses_text {
                    hosts.push("Text as _BloomText");
                }
                imports.push(format!("import {{ {} }} from \"react-native\";", hosts.join(", ")));
            }
        }
        imports
    }

    /// The element expression for `node`. Dynamic children become holes, their
    /// spans appended to `holes` in the order the hole names number them.
    pub fn element(&mut self, node: &Node, holes: &mut Vec<Span>) -> String {
        let host = self.host(node);
        let mut props = String::new();
        let mut style = self.style(&node.style, node.span);
        if !node.tables.is_empty() {
            let mut entries = vec![style];
            for (modifier, span) in &node.tables {
                let table = self.table(modifier, node.span);
                holes.push(*span);
                entries.push(format!("{table}[{}]", hole_name(holes.len() - 1)));
            }
            style = format!("[{}]", entries.join(", "));
        }
        let _ = write!(props, "style: {style}");
        if self.platform == Platform::Native && !node.style.themed.is_empty() {
            let colors = self.colors(&node.style, node.span);
            let _ = write!(props, ", colors: {colors}");
        }

        let children: Vec<String> = node
            .children
            .iter()
            .map(|child| match child {
                Child::Node(child) => self.element(child, holes),
                Child::Text(text) => format!("{text:?}"),
                Child::Dynamic(span) => {
                    holes.push(*span);
                    hole_name(holes.len() - 1)
                }
            })
            .collect();
        let factory = match children.len() {
            0 => "_bloomJsx",
            1 => {
                let _ = write!(props, ", children: {}", children[0]);
                "_bloomJsx"
            }
            _ => {
                let _ = write!(props, ", children: [{}]", children.join(", "));
                "_bloomJsxs"
            }
        };
        format!("{factory}({host}, {{ {props} }})")
    }

    /// Hoist a fully static element to module scope and return its name. React
    /// sees the same element object on every render and skips the subtree.
    pub fn hoist_tree(&mut self, element: String, span: Span) -> String {
        let name = format!("_bloomTree{}", self.trees);
        self.trees += 1;
        self.declarations.push((format!("const {name} = {element};"), span));
        name
    }

    fn host(&mut self, node: &Node) -> &'static str {
        match (node.component, self.platform) {
            (Component::Text, _) => {
                self.uses_text = true;
                "_BloomText"
            }
            (_, Platform::Native) if !node.style.themed.is_empty() => {
                self.uses_themed_view = true;
                "_BloomThemedView"
            }
            _ => {
                self.uses_view = true;
                "_BloomView"
            }
        }
    }

    /// The hoisted style object for `style`, shared by every node with the same one.
    fn style(&mut self, style: &Style, span: Span) -> String {
        if let Some((_, name)) = self.styles.iter().find(|(known, _)| known == style) {
            return name.clone();
        }
        let name = format!("_bloomStyle{}", self.styles.len());
        let body = match self.platform {
            Platform::Native => native_style(style),
            Platform::Web => self.web_style(style),
        };
        self.declarations.push((format!("const {name} = {body};"), span));
        self.styles.push((style.clone(), name.clone()));
        name
    }

    /// The hoisted token → style table for a modifier with a runtime token.
    fn table(&mut self, modifier: &'static str, span: Span) -> String {
        let name = format!("_bloomTable_{modifier}");
        if self.tables.contains(&modifier) {
            return name;
        }
        self.tables.push(modifier);
        let entries: Vec<String> = chain::modifier_table(modifier)
            .iter()
            .map(|(token, style)| {
                let body = match self.platform {
                    Platform::Native => native_style(style),
                    Platform::Web => self.web_style(style),
                };
                format!("{token:?}: {body}")
            })
            .collect();
        self.declarations.push((format!("const {name} = {{ {} }};", entries.join(", ")), span));
        name
    }

    /// The hoisted colour-role map for `style` (native), shared like styles are.
    fn colors(&mut self, style: &Style, span: Span) -> String {
        if let Some((_, name)) = self.colors.iter().find(|(known, _)| known.themed == style.themed) {
            return name.clone();
        }
        let name = format!("_bloomColors{}", self.colors.len());
        self.colors.push((style.clone(), name.clone()));
        let entries: Vec<String> =
            style.themed.iter().map(|(property, role)| format!("{property}: {role:?}")).collect();
        self.declarations.push((format!("const {name} = {{ {} }};", entries.join(", ")), span));
        name
    }

    /// `{ $$css: true, padding: "b1k2j3" }`: react-native-web merges these per
    /// property and renders the class names; the rules go to the CSS sheet.
    fn web_style(&mut self, style: &Style) -> String {
        let mut entries = vec!["$$css: true".to_string()];
        let declarations = style
            .fixed
            .iter()
            .map(|(property, value)| (*property, css_value(property, value)))
            .chain(style.themed.iter().map(|(property, role)| (*property, format!("var(--{role})"))));
        for (property, value) in declarations {
            let declaration = format!("{}:{value}", kebab(property));
            let class = format!("b{}", hash(&declaration));
            let rule = format!(".{class}{{{declaration}}}");
            if !self.css.contains(&rule) {
                self.css.push(rule);
            }
            entries.push(format!("{property}: {class:?}"));
        }
        format!("{{ {} }}", entries.join(", "))
    }
}

fn native_style(style: &Style) -> String {
    let entries: Vec<String> = style
        .fixed
        .iter()
        .map(|(property, value)| match value {
            Value::Number(number) => format!("{property}: {number}"),
            Value::Str(text) => format!("{property}: {text:?}"),
        })
        .collect();
    format!("{{ {} }}", entries.join(", "))
}

fn css_value(property: &str, value: &Value) -> String {
    match value {
        Value::Str(text) => text.to_string(),
        Value::Number(number) if property == "fontWeight" => number.to_string(),
        Value::Number(number) => format!("{number}px"),
    }
}

fn kebab(property: &str) -> String {
    let mut out = String::with_capacity(property.len() + 4);
    for character in property.chars() {
        if character.is_ascii_uppercase() {
            out.push('-');
            out.push(character.to_ascii_lowercase());
        } else {
            out.push(character);
        }
    }
    out
}

/// FNV-1a, base 36: short, stable class names from the declaration text.
fn hash(text: &str) -> String {
    let mut value: u32 = 0x811c_9dc5;
    for byte in text.bytes() {
        value ^= u32::from(byte);
        value = value.wrapping_mul(0x0100_0193);
    }
    let mut digits = Vec::new();
    loop {
        digits.push(char::from_digit(value % 36, 36).unwrap_or('0'));
        value /= 36;
        if value == 0 {
            break;
        }
    }
    digits.iter().rev().collect()
}
