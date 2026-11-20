//! What each module-scope name is, and which expressions are static.
//!
//! The compiler hoists an expression only when it can prove the expression
//! has the same value at module initialisation as at every later evaluation.
//! That holds for a language chain whose every input is a literal, an import
//! binding, or a module-scope `const` that is itself static (a literal, a
//! chain, or a frozen `defineTokens` table). Names are resolved through
//! `oxc_semantic`, so a local that shadows an import is never mistaken for it.

use std::collections::HashMap;

use oxc_ast::ast::{
    Argument, ArrayExpressionElement, BindingPattern, Declaration, Expression, ImportDeclarationSpecifier,
    ObjectPropertyKind, Program, PropertyKey, Statement, UnaryOperator, VariableDeclarationKind,
};
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
    /// The language's `defineTokens`.
    DefineTokens,
    /// `regular` or `clear`.
    Glass,
    /// Any other import: a binding the importer cannot reassign.
    Import,
    /// A module-scope `const` with a static value, declared at body index `at`.
    Const { at: usize },
    /// A module-scope `const` holding a frozen `defineTokens` table.
    Tokens { at: usize },
    /// A module-scope `const X = view(…)`: calling it makes a view node.
    ViewConstructor { at: usize },
}

pub struct Module {
    pub bindings: HashMap<SymbolId, Binding>,
    /// The body index just after the last import: where an expression with no
    /// module-scope dependency is declared.
    pub after_imports: usize,
}

impl Module {
    /// The module's bindings, or `None` when it imports nothing from the language.
    pub fn read(program: &Program, scoping: &Scoping) -> Option<Self> {
        let mut module = Self { bindings: HashMap::new(), after_imports: 0 };
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
        language.then_some(module)
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
                Some(Binding::View) => Some(Binding::ViewConstructor { at: index }),
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
                Some(Binding::Const { at } | Binding::Tokens { at } | Binding::ViewConstructor { at }) => {
                    Some((at + 1).max(floor))
                }
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
                        Binding::Constructor { .. } => Some(after),
                        Binding::ViewConstructor { at } => Some(after.max(at + 1)),
                        _ => None,
                    },
                    // A modifier on a static chain, or `.tint()` on a glass value.
                    Expression::StaticMemberExpression(member) => {
                        let receiver = member.object.without_parentheses();
                        let chain = self.is_chain(receiver, scoping)
                            || self.resolve(receiver, scoping) == Some(Binding::Glass);
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
        "defineTokens" => Binding::DefineTokens,
        "regular" | "clear" => Binding::Glass,
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
