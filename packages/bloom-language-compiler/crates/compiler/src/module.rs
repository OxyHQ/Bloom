//! What each module-scope name is, and which expressions are static.
//!
//! The compiler hoists an expression only when it can prove the expression
//! has the same value at module initialisation as at every later evaluation.
//! That holds for a language chain whose every input is a literal, an import
//! binding, or a module-scope `const` that is itself static (a literal, a
//! chain, or a frozen `defineTokens` table). Names are resolved through
//! `oxc_semantic`, so a local that shadows an import is never mistaken for it.

use std::collections::{HashMap, HashSet};

use oxc_ast::ast::{
    Argument, ArrayExpressionElement, BindingPattern, Declaration, Expression, ImportDeclarationSpecifier,
    ObjectPropertyKind, Program, PropertyKey, Statement, UnaryOperator, VariableDeclarationKind,
    VariableDeclarator,
};
use oxc_ast_visit::{Visit, walk};
use oxc_semantic::Scoping;
use oxc_syntax::symbol::SymbolId;

use crate::spec::NODES;

/// The module the language's exports come from.
pub const LANGUAGE_MODULE: &str = "@oxy.so/bloom-language";

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Binding {
    /// A language constructor (`HStack`, `Text`…): the node kind and its export name.
    Constructor { kind: &'static str, name: &'static str },
    /// The language's `view`.
    View,
    /// The language's `toElement`: a chain into JSX.
    ToElement,
    /// The language's `defineTokens`.
    DefineTokens,
    /// The language's `defineEnvironment`.
    DefineEnvironment,
    /// The language's `defineModifier`.
    DefineModifier,
    /// `regular` or `clear`.
    Glass,
    /// `identity`: a glass value that draws no glass.
    GlassIdentity,
    /// `opacity`: a transition value, immutable like a glass material.
    Fade,
    /// `move`, `scale`, `asymmetric`, `defineKeyframes`: pure builders of motion values.
    MotionBuilder,
    /// `useMotionValue`: makes a `MotionValue`, a number a gesture drives.
    UseMotionValue,
    /// `useMappedValue`: a `MotionValue` that follows another one through a range.
    UseMappedValue,
    /// Any other import: a binding the importer cannot reassign.
    Import,
    /// A module-scope `const` with a static value, declared at body index `at`.
    Const { at: usize },
    /// A module-scope `const` holding a frozen `defineTokens` table.
    Tokens { at: usize },
    /// A module-scope `const X = defineEnvironment('name', default)`, and the
    /// kind of its default (`None` when it is not a literal, or is `null`).
    EnvironmentKey { at: usize, kind: Option<Literal> },
    /// A module-scope `const X = defineModifier((v, …) => v…)`: a pure recipe of
    /// modifiers, the same value at every use, so a chain that applies it is static.
    ModifierConst { at: usize },
    /// A module-scope `const X = view(…)`: calling it makes a view node.
    ViewConstructor { at: usize },
    /// A module-scope `const` holding a static transition or keyframes value,
    /// and whether it changes opacity.
    MotionConst { at: usize, fades: bool },
}

/// The kind of a literal value, as an environment value's type is checked.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Literal {
    Boolean,
    Number,
    String,
}

impl Literal {
    /// The kind of `expression` when it is a boolean, number or string literal.
    pub fn of(expression: &Expression) -> Option<Self> {
        match expression.without_parentheses() {
            Expression::BooleanLiteral(_) => Some(Self::Boolean),
            Expression::NumericLiteral(_) => Some(Self::Number),
            Expression::StringLiteral(_) => Some(Self::String),
            Expression::TemplateLiteral(template) if template.expressions.is_empty() => Some(Self::String),
            Expression::UnaryExpression(unary)
                if unary.operator == UnaryOperator::UnaryNegation
                    && matches!(unary.argument.without_parentheses(), Expression::NumericLiteral(_)) =>
            {
                Some(Self::Number)
            }
            _ => None,
        }
    }

    pub fn name(self) -> &'static str {
        match self {
            Self::Boolean => "boolean",
            Self::Number => "number",
            Self::String => "string",
        }
    }
}

pub struct Module {
    pub bindings: HashMap<SymbolId, Binding>,
    /// Every `const` in any scope that holds a `MotionValue` (`const y = useMotionValue(0)`).
    pub motion_values: HashSet<SymbolId>,
    /// The ones that follow another value (`useMappedValue`): a view follows
    /// them, and nothing writes them.
    pub mapped_values: HashSet<SymbolId>,
    /// The body index just after the last import: where an expression with no
    /// module-scope dependency is declared.
    pub after_imports: usize,
}

impl Module {
    /// The module's bindings, or `None` when it imports nothing from the language.
    pub fn read(program: &Program, scoping: &Scoping) -> Option<Self> {
        let mut module = Self {
            bindings: HashMap::new(),
            motion_values: HashSet::new(),
            mapped_values: HashSet::new(),
            after_imports: 0,
        };
        let mut language = false;
        for (index, statement) in program.body.iter().enumerate() {
            match statement {
                Statement::ImportDeclaration(declaration) => {
                    module.after_imports = index + 1;
                    let from_language = declaration.source.value == LANGUAGE_MODULE;
                    language |= from_language;
                    for specifier in declaration.specifiers.iter().flatten() {
                        let binding = match specifier {
                            ImportDeclarationSpecifier::ImportSpecifier(s) if from_language => {
                                language_export(s.imported.name().as_str())
                            }
                            _ => Binding::Import,
                        };
                        module.bindings.insert(specifier.symbol_id(), binding);
                    }
                }
                Statement::VariableDeclaration(declaration) => module.declare(index, declaration, scoping),
                Statement::ExportDeclaration(export) => {
                    if let Declaration::VariableDeclaration(declaration) = &export.declaration {
                        module.declare(index, declaration, scoping);
                    }
                }
                _ => {}
            }
        }
        if !language {
            return None;
        }
        let mut finder =
            MotionValueFinder { module: &module, scoping, found: Vec::new(), mapped: Vec::new() };
        finder.visit_program(program);
        let (found, mapped) = (finder.found, finder.mapped);
        module.motion_values.extend(found);
        module.motion_values.extend(mapped.iter().copied());
        module.mapped_values.extend(mapped);
        Some(module)
    }

    /// Whether `expression` names a `MotionValue` (a `const` from `useMotionValue`).
    pub fn is_motion_value_ref(&self, expression: &Expression, scoping: &Scoping) -> bool {
        let Expression::Identifier(identifier) = expression.without_parentheses() else { return false };
        identifier
            .reference_id
            .get()
            .and_then(|reference| scoping.get_reference(reference).symbol_id())
            .is_some_and(|symbol| self.motion_values.contains(&symbol))
    }

    /// Whether `expression` names a `MotionValue` that follows another (a `const` from `useMappedValue`).
    pub fn is_mapped_value_ref(&self, expression: &Expression, scoping: &Scoping) -> bool {
        let Expression::Identifier(identifier) = expression.without_parentheses() else { return false };
        identifier
            .reference_id
            .get()
            .and_then(|reference| scoping.get_reference(reference).symbol_id())
            .is_some_and(|symbol| self.mapped_values.contains(&symbol))
    }

    fn declare(&mut self, index: usize, declaration: &oxc_ast::ast::VariableDeclaration, scoping: &Scoping) {
        if declaration.kind != VariableDeclarationKind::Const {
            return;
        }
        for declarator in &declaration.declarations {
            let (BindingPattern::BindingIdentifier(id), Some(init)) = (&declarator.id, &declarator.init)
            else {
                continue;
            };
            let binding = match self.callee(init, scoping) {
                Some(Binding::DefineTokens) => Some(Binding::Tokens { at: index }),
                Some(Binding::DefineEnvironment) => {
                    let Expression::CallExpression(call) = init.without_parentheses() else { continue };
                    let default = call.arguments.get(1).and_then(Argument::as_expression);
                    Some(Binding::EnvironmentKey { at: index, kind: default.and_then(Literal::of) })
                }
                Some(Binding::DefineModifier) => Some(Binding::ModifierConst { at: index }),
                Some(Binding::View) => Some(Binding::ViewConstructor { at: index }),
                _ if self.is_motion_value(init, scoping) => self.static_after(init, scoping).map(|_| {
                    Binding::MotionConst { at: index, fades: crate::check::fades(init, self, scoping) }
                }),
                _ => self.static_after(init, scoping).map(|_| Binding::Const { at: index }),
            };
            if let Some(binding) = binding {
                self.bindings.insert(id.symbol_id(), binding);
            }
        }
    }

    /// What the identifier `expression` names at module scope, if anything this compiler knows.
    pub fn resolve(&self, expression: &Expression, scoping: &Scoping) -> Option<Binding> {
        let Expression::Identifier(identifier) = expression.without_parentheses() else { return None };
        let reference = identifier.reference_id.get()?;
        let symbol = scoping.get_reference(reference).symbol_id()?;
        self.bindings.get(&symbol).copied()
    }

    /// The binding a call's callee names, for `callee(…)`.
    pub fn callee(&self, expression: &Expression, scoping: &Scoping) -> Option<Binding> {
        let Expression::CallExpression(call) = expression.without_parentheses() else { return None };
        self.resolve(&call.callee, scoping)
    }

    /// When `expression` is static, the body index from which its value exists;
    /// `None` when it depends on anything evaluated later than module initialisation.
    pub fn static_after(&self, expression: &Expression, scoping: &Scoping) -> Option<usize> {
        let floor = self.after_imports;
        match expression.without_parentheses() {
            Expression::StringLiteral(_)
            | Expression::NumericLiteral(_)
            | Expression::BooleanLiteral(_)
            | Expression::NullLiteral(_)
            | Expression::BigIntLiteral(_) => Some(floor),
            Expression::TemplateLiteral(template) if template.expressions.is_empty() => Some(floor),
            Expression::UnaryExpression(unary)
                if unary.operator == UnaryOperator::UnaryNegation
                    && matches!(unary.argument.without_parentheses(), Expression::NumericLiteral(_)) =>
            {
                Some(floor)
            }
            Expression::Identifier(identifier) => match self.resolve(expression, scoping) {
                Some(
                    Binding::Const { at }
                    | Binding::Tokens { at }
                    | Binding::ViewConstructor { at }
                    | Binding::EnvironmentKey { at, .. }
                    | Binding::ModifierConst { at }
                    | Binding::MotionConst { at, .. },
                ) => Some((at + 1).max(floor)),
                Some(_) => Some(floor),
                // An unresolved `undefined` is the global constant; any other free name could change.
                None => (identifier.name == "undefined"
                    && identifier
                        .reference_id
                        .get()
                        .is_some_and(|r| scoping.get_reference(r).symbol_id().is_none()))
                .then_some(floor),
            },
            // `row.space.gutter`: a frozen token table, read at any depth.
            Expression::StaticMemberExpression(member) => {
                let mut object = member.object.without_parentheses();
                while let Expression::StaticMemberExpression(inner) = object {
                    object = inner.object.without_parentheses();
                }
                match self.resolve(object, scoping) {
                    Some(Binding::Tokens { at }) => Some((at + 1).max(floor)),
                    _ => None,
                }
            }
            Expression::ArrayExpression(array) => array.elements.iter().try_fold(floor, |after, element| {
                let (ArrayExpressionElement::SpreadElement(_) | ArrayExpressionElement::Elision(_)) = element
                else {
                    return Some(after.max(self.static_after(element.as_expression()?, scoping)?));
                };
                None
            }),
            Expression::ObjectExpression(object) => {
                object.properties.iter().try_fold(floor, |after, property| {
                    let ObjectPropertyKind::ObjectProperty(property) = property else { return None };
                    if property.computed
                        || property.method
                        || !matches!(
                            property.key,
                            PropertyKey::StaticIdentifier(_) | PropertyKey::StringLiteral(_)
                        )
                    {
                        return None;
                    }
                    Some(after.max(self.static_after(&property.value, scoping)?))
                })
            }
            Expression::CallExpression(call) => {
                let after = self.static_arguments(&call.arguments, scoping)?;
                match &call.callee {
                    Expression::Identifier(_) => match self.resolve(&call.callee, scoping)? {
                        Binding::Constructor { .. } | Binding::MotionBuilder => Some(after),
                        Binding::ViewConstructor { at } => Some(after.max(at + 1)),
                        _ => None,
                    },
                    // A modifier on a static chain, `.tint()` on a glass value, or a
                    // method of a motion value (`.combined()`, `.animation()`).
                    Expression::StaticMemberExpression(member) => {
                        let receiver = member.object.without_parentheses();
                        let chain = self.is_chain(receiver, scoping)
                            || self.is_glass_value(receiver, scoping)
                            || self.is_motion_value(receiver, scoping);
                        if !chain {
                            return None;
                        }
                        Some(after.max(self.static_after(receiver, scoping)?))
                    }
                    _ => None,
                }
            }
            _ => None,
        }
    }

    fn static_arguments(&self, arguments: &[Argument], scoping: &Scoping) -> Option<usize> {
        arguments.iter().try_fold(self.after_imports, |after, argument| {
            Some(after.max(self.static_after(argument.as_expression()?, scoping)?))
        })
    }

    /// Whether `expression` is a transition or keyframes value: `opacity`, a builder's
    /// result, a method of one, or a module constant holding one.
    pub fn is_motion_value(&self, expression: &Expression, scoping: &Scoping) -> bool {
        match expression.without_parentheses() {
            Expression::Identifier(_) => {
                matches!(self.resolve(expression, scoping), Some(Binding::Fade | Binding::MotionConst { .. }))
            }
            Expression::CallExpression(call) => match &call.callee {
                Expression::Identifier(_) => {
                    self.resolve(&call.callee, scoping) == Some(Binding::MotionBuilder)
                }
                Expression::StaticMemberExpression(member) => self.is_motion_value(&member.object, scoping),
                _ => false,
            },
            _ => false,
        }
    }

    /// Whether `expression` is a glass value: `regular`, `clear` or `identity`, or a
    /// method of one (`regular.tint('primary').interactive(false)`).
    pub fn is_glass_value(&self, expression: &Expression, scoping: &Scoping) -> bool {
        match expression.without_parentheses() {
            Expression::Identifier(_) => {
                matches!(self.resolve(expression, scoping), Some(Binding::Glass | Binding::GlassIdentity))
            }
            Expression::CallExpression(call) => match &call.callee {
                Expression::StaticMemberExpression(member) => self.is_glass_value(&member.object, scoping),
                _ => false,
            },
            _ => false,
        }
    }

    /// Whether `expression` is a language chain: a constructor (or view) call with modifiers after it.
    pub fn is_chain(&self, expression: &Expression, scoping: &Scoping) -> bool {
        self.chain_root(expression, scoping).is_some()
    }

    /// The binding at the root of a chain (`HStack` in `HStack(…).padding('md')`).
    pub fn chain_root(&self, expression: &Expression, scoping: &Scoping) -> Option<Binding> {
        let mut current = expression.without_parentheses();
        loop {
            let Expression::CallExpression(call) = current else { return None };
            match &call.callee {
                Expression::StaticMemberExpression(member) => current = member.object.without_parentheses(),
                Expression::Identifier(_) => {
                    return match self.resolve(&call.callee, scoping)? {
                        binding @ (Binding::Constructor { .. } | Binding::ViewConstructor { .. }) => {
                            Some(binding)
                        }
                        _ => None,
                    };
                }
                _ => return None,
            }
        }
    }
}

fn language_export(name: &str) -> Binding {
    match name {
        "view" => Binding::View,
        "toElement" => Binding::ToElement,
        "defineTokens" => Binding::DefineTokens,
        "defineEnvironment" => Binding::DefineEnvironment,
        "defineModifier" => Binding::DefineModifier,
        "regular" | "clear" => Binding::Glass,
        "identity" => Binding::GlassIdentity,
        "opacity" => Binding::Fade,
        "move" | "scale" | "asymmetric" | "defineKeyframes" => Binding::MotionBuilder,
        "useMotionValue" => Binding::UseMotionValue,
        "useMappedValue" => Binding::UseMappedValue,
        _ => NODES
            .iter()
            .find_map(|node| {
                node.constructors
                    .iter()
                    .find(|constructor| **constructor == name)
                    .map(|constructor| Binding::Constructor { kind: node.kind, name: constructor })
            })
            .unwrap_or(Binding::Import),
    }
}

/// Collects the `const`s, in any scope, initialised by `useMotionValue(…)`
/// (`found`) or `useMappedValue(…)` (`mapped`).
struct MotionValueFinder<'m, 's> {
    module: &'m Module,
    scoping: &'s Scoping,
    found: Vec<SymbolId>,
    mapped: Vec<SymbolId>,
}

impl<'a> Visit<'a> for MotionValueFinder<'_, '_> {
    fn visit_variable_declarator(&mut self, declarator: &VariableDeclarator<'a>) {
        if let (BindingPattern::BindingIdentifier(id), Some(init)) = (&declarator.id, &declarator.init) {
            match self.module.callee(init, self.scoping) {
                Some(Binding::UseMotionValue) => self.found.push(id.symbol_id()),
                Some(Binding::UseMappedValue) => self.mapped.push(id.symbol_id()),
                _ => {}
            }
        }
        walk::walk_variable_declarator(self, declarator);
    }
}
