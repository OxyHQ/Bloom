//! Checks a chain against the spec: each modifier exists for the node, takes
//! that many arguments, and every literal token is in its token set. Runtime
//! values are the runtime's; TypeScript checks them where it can, and this is
//! the backstop for JavaScript, casts and generated code.

use oxc_ast::ast::{Argument, Expression, ObjectPropertyKind, Program, PropertyKey};
use oxc_ast_visit::{Visit, walk};
use oxc_semantic::Scoping;
use oxc_span::{GetSpan, Span};

use crate::diagnostics::suggest;
use crate::module::{Binding, Module};
use crate::spec::{FRAME_KEYS, MODIFIERS, NODES, NodeSpec, TOKEN_SETS};

pub struct Problem {
    pub span: Span,
    pub message: String,
    pub help: Option<String>,
}

fn tokens(set: &str) -> &'static [&'static str] {
    TOKEN_SETS.iter().find(|(name, _)| *name == set).map_or(&[], |(_, tokens)| tokens)
}

fn node(kind: &str) -> &'static NodeSpec {
    NODES.iter().find(|node| node.kind == kind).expect("every node kind is in the spec")
}

/// Every chain in `program`, each checked once, whatever the compiler later
/// does with it: a chain nested in another's arguments is its own chain.
pub fn check_program(program: &Program, module: &Module, scoping: &Scoping) -> Vec<Problem> {
    let mut checker = Checker { module, scoping, problems: Vec::new() };
    checker.visit_program(program);
    checker.problems
}

struct Checker<'m> {
    module: &'m Module,
    scoping: &'m Scoping,
    problems: Vec<Problem>,
}

impl<'a> Visit<'a> for Checker<'_> {
    fn visit_expression(&mut self, expression: &Expression<'a>) {
        if !self.module.is_chain(expression, self.scoping) {
            walk::walk_expression(self, expression);
            return;
        }
        if let Err(problem) = check_chain(expression, self.module, self.scoping) {
            self.problems.push(problem);
        }
        // The chain's own calls were checked together; their arguments are visited
        // for the chains inside them, never the chain's own prefix again.
        let mut current = expression.without_parentheses();
        while let Expression::CallExpression(call) = current {
            for argument in &call.arguments {
                self.visit_argument(argument);
            }
            let Expression::StaticMemberExpression(member) = &call.callee else { break };
            current = member.object.without_parentheses();
        }
    }
}

/// Check the chain `expression` (a constructor call and its modifiers), if it is one.
fn check_chain(expression: &Expression, module: &Module, scoping: &Scoping) -> Result<(), Problem> {
    let Some(root) = module.chain_root(expression, scoping) else { return Ok(()) };
    let (kind, name) = match root {
        Binding::Constructor { kind, name } => (kind, name),
        _ => ("view", "A view"),
    };
    let spec = node(kind);
    // Modifiers, outside-in; checked in source order.
    let mut modifiers = Vec::new();
    let mut current = expression.without_parentheses();
    while let Expression::CallExpression(call) = current {
        let Expression::StaticMemberExpression(member) = &call.callee else { break };
        modifiers.push((
            member.property.name.as_str(),
            member.property.span,
            call.arguments.as_slice(),
            call.span,
        ));
        current = member.object.without_parentheses();
    }
    for (modifier, span, arguments, call_span) in modifiers.into_iter().rev() {
        if !spec.modifiers.contains(&modifier) {
            let help = format!("{name} modifiers: {}", spec.modifiers.join(", "));
            return Err(Problem {
                span,
                message: format!("{name} has no modifier .{modifier}()"),
                help: Some(with_suggestion(suggest(modifier, spec.modifiers), help)),
            });
        }
        check_arguments(modifier, arguments, spec, call_span, module, scoping)?;
    }
    Ok(())
}

fn check_arguments(
    modifier: &str,
    arguments: &[Argument],
    spec: &NodeSpec,
    call_span: Span,
    module: &Module,
    scoping: &Scoping,
) -> Result<(), Problem> {
    let params = MODIFIERS.iter().find(|(name, _)| *name == modifier).map_or(&[][..], |(_, params)| params);
    let required = params.iter().filter(|param| !param.ends_with('?')).count();
    let variadic = params.contains(&"children");
    if !variadic && (arguments.len() < required || arguments.len() > params.len()) {
        let expected = if required == params.len() {
            required.to_string()
        } else {
            format!("{required} to {}", params.len())
        };
        return Err(Problem {
            span: call_span,
            message: format!(".{modifier}() takes {expected} argument(s), not {}", arguments.len()),
            help: None,
        });
    }
    // Optional parameters take the arguments beyond the required ones, in order.
    let mut optional = arguments.len().saturating_sub(required);
    let mut arguments = arguments.iter();
    for param in params {
        let param = match param.strip_suffix('?') {
            Some(param) if optional > 0 => {
                optional -= 1;
                param
            }
            Some(_) => continue,
            None => param,
        };
        let Some(argument) = arguments.next() else { break };
        let Some(value) = argument.as_expression() else { continue };
        check_value(modifier, param, value, spec, module, scoping)?;
    }
    Ok(())
}

fn check_value(
    modifier: &str,
    param: &str,
    value: &Expression,
    spec: &NodeSpec,
    module: &Module,
    scoping: &Scoping,
) -> Result<(), Problem> {
    match param {
        "value" | "children" => Ok(()),
        "frame" => {
            let Expression::ObjectExpression(object) = value.without_parentheses() else { return Ok(()) };
            for property in &object.properties {
                let ObjectPropertyKind::ObjectProperty(property) = property else { continue };
                let key = match &property.key {
                    PropertyKey::StaticIdentifier(id) => id.name.as_str(),
                    PropertyKey::StringLiteral(s) => s.value.as_str().unwrap_or_default(),
                    _ => continue,
                };
                if !FRAME_KEYS.contains(&key) {
                    return Err(Problem {
                        span: property.key.span(),
                        message: format!(".frame() has no '{key}'"),
                        help: Some(with_suggestion(
                            suggest(key, FRAME_KEYS),
                            format!("frame keys: {}", FRAME_KEYS.join(", ")),
                        )),
                    });
                }
                check_token(modifier, "space", &property.value)?;
            }
            Ok(())
        }
        "glass" => match value.without_parentheses() {
            Expression::CallExpression(call) => {
                let Expression::StaticMemberExpression(member) = &call.callee else { return Ok(()) };
                if module.resolve(&member.object, scoping) != Some(Binding::Glass)
                    || member.property.name != "tint"
                {
                    return Ok(());
                }
                let mut arguments = call.arguments.iter().filter_map(Argument::as_expression);
                if let Some(color) = arguments.next() {
                    check_token("tint", "color", color)?;
                }
                if let Some(opacity) = arguments.next() {
                    check_token("tint", "glassOpacity", opacity)?;
                }
                Ok(())
            }
            Expression::StringLiteral(literal) => Err(Problem {
                span: literal.span,
                message: format!(".glass() takes a glass value, not '{}'", literal.value.display()),
                help: Some("import { regular, clear } from '@oxy.so/bloom-language'".into()),
            }),
            _ => Ok(()),
        },
        "size" => spec.size.map_or(Ok(()), |set| check_token(modifier, set, value)),
        "tint" => spec.tint.map_or(Ok(()), |set| check_token(modifier, set, value)),
        "style" => spec.style.map_or(Ok(()), |set| check_token(modifier, set, value)),
        "shape" => spec.shape.map_or(Ok(()), |set| check_token(modifier, set, value)),
        set => check_token(modifier, set, value),
    }
}

/// A string literal must be one of `set`'s tokens; anything else is the runtime's.
fn check_token(modifier: &str, set: &str, value: &Expression) -> Result<(), Problem> {
    let Expression::StringLiteral(literal) = value.without_parentheses() else { return Ok(()) };
    let names = tokens(set);
    let token = literal.value.as_str().unwrap_or_default();
    if names.contains(&token) {
        return Ok(());
    }
    Err(Problem {
        span: literal.span,
        message: format!("Unknown {set} token '{token}' for .{modifier}()"),
        help: Some(with_suggestion(suggest(token, names), format!("{set} tokens: {}", names.join(", ")))),
    })
}

fn with_suggestion(suggestion: Option<String>, list: String) -> String {
    match suggestion {
        Some(suggestion) => format!("{suggestion} {list}"),
        None => list,
    }
}
