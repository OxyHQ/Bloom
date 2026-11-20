//! Checks a chain against the spec: each modifier exists for the node, takes
//! that many arguments, and every literal token is in its token set. Runtime
//! values are the runtime's; TypeScript checks them where it can, and this is
//! the backstop for JavaScript, casts and generated code.

use oxc_ast::ast::{
    Argument, CallExpression, Expression, IdentifierReference, ObjectProperty, ObjectPropertyKind,
    PropertyKey,
};
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

/// Check the chain `expression` (a constructor call and its modifiers), if it is one.
pub fn check_chain(expression: &Expression, module: &Module, scoping: &Scoping) -> Result<(), Problem> {
    let Some(root) = module.chain_root(expression, scoping) else { return Ok(()) };
    let (kind, name) = match root {
        Binding::Constructor { kind, name } => (kind, name),
        _ => ("view", "A view"),
    };
    let spec = node(kind);
    // Modifiers, outside-in; checked in source order.
    let mut modifiers = Vec::new();
    let mut current = expression.without_parentheses();
    let mut root: Option<&CallExpression> = None;
    while let Expression::CallExpression(call) = current {
        let Expression::StaticMemberExpression(member) = &call.callee else {
            root = Some(call);
            break;
        };
        modifiers.push((
            member.property.name.as_str(),
            member.property.span,
            call.arguments.as_slice(),
            call.span,
        ));
        current = member.object.without_parentheses();
    }
    let holds_glass = root.is_some_and(|root| holds_glass(&root.arguments, module, scoping));
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
        if holds_glass && fades_view(modifier, arguments, module, scoping) {
            return Err(Problem {
                span: call_span,
                message: format!(".{modifier}() fades a view that holds glass"),
                help: Some(
                    "on the web a faded ancestor flattens the material (it stops blurring); put the fade on the \
                     .glass() view itself, which fades the material's own layers instead"
                        .into(),
                ),
            });
        }
    }
    Ok(())
}

/// Whether this modifier makes the view less than opaque: an opacity below
/// `opaque`, or a transition or keyframes that change opacity.
fn fades_view(modifier: &str, arguments: &[Argument], module: &Module, scoping: &Scoping) -> bool {
    let Some(value) = arguments.first().and_then(Argument::as_expression) else { return false };
    match modifier {
        "opacity" => {
            !matches!(value.without_parentheses(), Expression::StringLiteral(s) if s.value == "opaque")
        }
        "transition" | "keyframes" => fades(value, module, scoping),
        _ => false,
    }
}

/// Whether a motion value changes opacity: it names `opacity` (or a constant
/// that does), or writes an `opacity:` frame.
pub fn fades(expression: &Expression, module: &Module, scoping: &Scoping) -> bool {
    let mut finder = FadeFinder { module, scoping, found: false };
    finder.visit_expression(expression);
    finder.found
}

struct FadeFinder<'m> {
    module: &'m Module,
    scoping: &'m Scoping,
    found: bool,
}

impl<'a> Visit<'a> for FadeFinder<'_> {
    fn visit_identifier_reference(&mut self, identifier: &IdentifierReference<'a>) {
        let symbol = identifier.reference_id.get().and_then(|r| self.scoping.get_reference(r).symbol_id());
        if let Some(symbol) = symbol
            && matches!(
                self.module.bindings.get(&symbol),
                Some(Binding::Fade | Binding::MotionConst { fades: true, .. })
            )
        {
            self.found = true;
        }
    }

    fn visit_object_property(&mut self, property: &ObjectProperty<'a>) {
        if matches!(&property.key, PropertyKey::StaticIdentifier(id) if id.name == "opacity") {
            self.found = true;
        }
        walk::walk_object_property(self, property);
    }
}

/// Whether any child (at any depth of the chains passed as children) is glass.
fn holds_glass(arguments: &[Argument], module: &Module, scoping: &Scoping) -> bool {
    let mut finder = GlassFinder { module, scoping, found: false };
    for argument in arguments {
        if let Some(expression) = argument.as_expression() {
            finder.visit_expression(expression);
        }
    }
    finder.found
}

struct GlassFinder<'m> {
    module: &'m Module,
    scoping: &'m Scoping,
    found: bool,
}

impl<'a> Visit<'a> for GlassFinder<'_> {
    fn visit_call_expression(&mut self, call: &CallExpression<'a>) {
        if let Expression::StaticMemberExpression(member) = &call.callee
            && member.property.name == "glass"
            && self.module.is_chain(&member.object, self.scoping)
        {
            self.found = true;
            return;
        }
        walk::walk_call_expression(self, call);
    }
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
        "value" | "children" | "namespace" => Ok(()),
        "offset" => {
            let Expression::ObjectExpression(object) = value.without_parentheses() else { return Ok(()) };
            for property in &object.properties {
                let ObjectPropertyKind::ObjectProperty(property) = property else { continue };
                let key = match &property.key {
                    PropertyKey::StaticIdentifier(id) => id.name.as_str(),
                    PropertyKey::StringLiteral(s) => s.value.as_str().unwrap_or_default(),
                    _ => continue,
                };
                if key != "x" && key != "y" {
                    return Err(Problem {
                        span: property.key.span(),
                        message: format!(".offset() has no '{key}'"),
                        help: Some("offset keys: x, y".into()),
                    });
                }
                check_token(modifier, "padding", &property.value)?;
            }
            Ok(())
        }
        "transition" | "keyframes" => match value.without_parentheses() {
            Expression::StringLiteral(literal) => Err(Problem {
                span: literal.span,
                message: format!(".{modifier}() takes a {param} value, not '{}'", literal.value.display()),
                help: Some(if param == "transition" {
                    "import { opacity, move, scale, asymmetric } from '@oxy.so/bloom-language'".into()
                } else {
                    "declare it once with defineKeyframes([...frames], motion)".into()
                }),
            }),
            _ => Ok(()),
        },
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
