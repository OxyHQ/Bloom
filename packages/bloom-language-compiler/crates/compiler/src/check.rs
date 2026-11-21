//! Checks a chain against the spec: each modifier exists for the node, takes
//! that many arguments, and every literal token is in its token set. Runtime
//! values are the runtime's; TypeScript checks them where it can, and this is
//! the backstop for JavaScript, casts and generated code.

use oxc_ast::ast::{
    Argument, ArrowFunctionBody, BindingPattern, CallExpression, Expression, IdentifierReference,
    ObjectProperty, ObjectPropertyKind, Program, PropertyKey, Statement,
};
use oxc_ast_visit::{Visit, walk};
use oxc_semantic::Scoping;
use oxc_span::{GetSpan, Span};

use crate::diagnostics::suggest;
use crate::module::{Binding, Module};
use crate::spec::{FADING_LOOPS, MODIFIERS, NODES, NodeSpec, OBJECTS, TOKEN_SETS, VARIANT_MODIFIERS};

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
        // A loop token fades when its frames do (the spec's loops); keyframes of the app's own as above.
        "repeatForever" => match value.without_parentheses() {
            Expression::StringLiteral(s) => FADING_LOOPS.contains(&s.value.as_str().unwrap_or_default()),
            _ => fades(value, module, scoping),
        },
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
    let motion_value = module.is_motion_value_ref(value, scoping);
    if param == "motionValue" {
        return if motion_value || !is_literal(value) {
            Ok(())
        } else {
            Err(Problem {
                span: value.span(),
                message: format!(".{modifier}() takes a MotionValue"),
                help: Some("const y = useMotionValue(0), from '@oxy.so/bloom-language'".into()),
            })
        };
    }
    if motion_value && !matches!(param, "scale" | "rotation" | "value" | "children" | "namespace") {
        return Err(motion_value_for_token(modifier, param, value.span()));
    }
    match param {
        "value" | "children" | "namespace" => Ok(()),
        "variant" => check_variant(value, spec, module, scoping),
        "scale" | "rotation" if motion_value => Ok(()),
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
        param if OBJECTS.iter().any(|(name, _, _)| *name == param) => {
            let &(_, keys, set) = OBJECTS.iter().find(|(name, _, _)| *name == param).expect("matched above");
            let Expression::ObjectExpression(object) = value.without_parentheses() else { return Ok(()) };
            for property in &object.properties {
                let ObjectPropertyKind::ObjectProperty(property) = property else { continue };
                let key = match &property.key {
                    PropertyKey::StaticIdentifier(id) => id.name.as_str(),
                    PropertyKey::StringLiteral(s) => s.value.as_str().unwrap_or_default(),
                    _ => continue,
                };
                if !keys.contains(&key) {
                    return Err(Problem {
                        span: property.key.span(),
                        message: format!(".{modifier}() has no '{key}'"),
                        help: Some(with_suggestion(
                            suggest(key, keys),
                            format!("{modifier} keys: {}", keys.join(", ")),
                        )),
                    });
                }
                // An offset's axis may follow a `MotionValue` in place of its token.
                if !(param == "offset" && module.is_motion_value_ref(&property.value, scoping)) {
                    check_token(modifier, set, &property.value)?;
                }
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

/// A variant (`when(condition, (v) => v.padding('lg'))`): the chain the arrow
/// returns on its parameter takes only the modifiers a variant can change,
/// each one the node takes, with valid arguments. A variant written any other
/// way (a function declared elsewhere) is the runtime's.
fn check_variant(
    value: &Expression,
    spec: &NodeSpec,
    module: &Module,
    scoping: &Scoping,
) -> Result<(), Problem> {
    let Expression::ArrowFunctionExpression(arrow) = value.without_parentheses() else { return Ok(()) };
    let [param] = arrow.params.items.as_slice() else { return Ok(()) };
    let BindingPattern::BindingIdentifier(param) = &param.pattern else { return Ok(()) };
    let body = match &arrow.body {
        ArrowFunctionBody::FunctionBody(body) => match body.statements.as_slice() {
            [Statement::ReturnStatement(statement)] => match &statement.argument {
                Some(argument) => argument,
                None => return Ok(()),
            },
            _ => return Ok(()),
        },
        body => match body.as_expression() {
            Some(expression) => expression,
            None => return Ok(()),
        },
    };
    let mut modifiers = Vec::new();
    let mut current = body.without_parentheses();
    while let Expression::CallExpression(call) = current {
        let Expression::StaticMemberExpression(member) = &call.callee else { return Ok(()) };
        modifiers.push((
            member.property.name.as_str(),
            member.property.span,
            call.arguments.as_slice(),
            call.span,
        ));
        current = member.object.without_parentheses();
    }
    let Expression::Identifier(root) = current else { return Ok(()) };
    if root.name != param.name {
        return Ok(());
    }
    for (modifier, span, arguments, call_span) in modifiers.into_iter().rev() {
        if !VARIANT_MODIFIERS.contains(&modifier) || !spec.modifiers.contains(&modifier) {
            let varies: Vec<&str> =
                VARIANT_MODIFIERS.iter().copied().filter(|name| spec.modifiers.contains(name)).collect();
            return Err(Problem {
                span,
                message: format!("A variant cannot change .{modifier}()"),
                help: Some(with_suggestion(
                    suggest(modifier, &varies),
                    format!("a variant changes: {}", varies.join(", ")),
                )),
            });
        }
        // A variant varies geometry by token: a view that follows a MotionValue moves by the value.
        if let Some(value) = arguments
            .iter()
            .filter_map(Argument::as_expression)
            .find(|value| follows_motion_value(value, module, scoping))
        {
            return Err(Problem {
                span: value.span(),
                message: format!(".{modifier}() inside when() takes tokens, not a MotionValue"),
                help: Some(
                    "a variant changes geometry by token; bind the MotionValue outside when() and move it with animate()"
                        .into(),
                ),
            });
        }
        check_arguments(modifier, arguments, spec, call_span, module, scoping)?;
    }
    Ok(())
}

/// Whether a value is a `MotionValue`, or an object (an offset) with one on an axis.
fn follows_motion_value(value: &Expression, module: &Module, scoping: &Scoping) -> bool {
    match value.without_parentheses() {
        Expression::ObjectExpression(object) => object.properties.iter().any(|property| {
            matches!(property, ObjectPropertyKind::ObjectProperty(property)
                if module.is_motion_value_ref(&property.value, scoping))
        }),
        value => module.is_motion_value_ref(value, scoping),
    }
}

fn is_literal(value: &Expression) -> bool {
    matches!(
        value.without_parentheses(),
        Expression::StringLiteral(_)
            | Expression::NumericLiteral(_)
            | Expression::BooleanLiteral(_)
            | Expression::NullLiteral(_)
            | Expression::ObjectExpression(_)
            | Expression::ArrayExpression(_)
            | Expression::TemplateLiteral(_)
    )
}

/// A `MotionValue` where a token goes: only geometry follows a value.
fn motion_value_for_token(modifier: &str, param: &str, span: Span) -> Problem {
    Problem {
        span,
        message: format!(".{modifier}() takes {param} tokens, not a MotionValue"),
        help: Some(
            "a view follows a MotionValue in .offset({ x, y }), .scale() and .rotation(); a token modifier takes a \
             token"
                .into(),
        ),
    }
}

/// A string literal must be one of `set`'s tokens; anything else is the runtime's.
/// A colour may name an opacity after its role (`'muted/faded'`): both halves are checked.
fn check_token(modifier: &str, set: &str, value: &Expression) -> Result<(), Problem> {
    let Expression::StringLiteral(literal) = value.without_parentheses() else { return Ok(()) };
    let token = literal.value.as_str().unwrap_or_default();
    let (token, set, names) = match token.split_once('/') {
        Some((role, opacity)) if set == "color" && tokens("color").contains(&role) => {
            (opacity, "opacity", tokens("opacity"))
        }
        _ => (token, set, tokens(set)),
    };
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
