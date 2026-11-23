//! Checks a chain against the spec: each modifier exists for the node, takes
//! that many arguments, and every literal token is in its token set. Runtime
//! values are the runtime's; TypeScript checks them where it can, and this is
//! the backstop for JavaScript, casts and generated code.

use oxc_ast::ast::{
    Argument, ArrowFunctionBody, BindingPattern, CallExpression, Expression, IdentifierReference,
    ObjectProperty, ObjectPropertyKind, Program, PropertyKey, Statement, UnaryOperator,
};
use oxc_ast_visit::{Visit, walk};
use oxc_semantic::Scoping;
use oxc_span::{GetSpan, Span};

use crate::diagnostics::suggest;
use crate::docs::{Doc, Tour};
use crate::module::{Binding, Literal, Module};
use crate::spec::{
    CONTENT_VIEW_MODIFIERS, FADING_LOOPS, GLASS_VALUE, MODIFIERS, NODES, NodeSpec, OBJECTS, POINT_PARAMS,
    TOKEN_SETS, VARIANT_MODIFIERS,
};

pub struct Problem {
    pub span: Span,
    pub message: String,
    pub help: Option<String>,
    /// The docs that explain it, the most precise first.
    pub docs: Vec<Doc>,
}

fn tokens(set: &str) -> &'static [&'static str] {
    TOKEN_SETS.iter().find(|(name, _)| *name == set).map_or(&[], |(_, tokens)| tokens)
}

fn node(kind: &str) -> &'static NodeSpec {
    NODES.iter().find(|node| node.kind == kind).expect("every node kind is in the spec")
}

/// What checking a module found: errors fail the build, warnings are reported.
pub struct Checked {
    pub errors: Vec<Problem>,
    pub warnings: Vec<Problem>,
}

/// Every chain in `program`, each checked once, whatever the compiler later
/// does with it: a chain nested in another's arguments is its own chain.
pub fn check_program(program: &Program, module: &Module, scoping: &Scoping) -> Checked {
    let mut checker = Checker {
        module,
        scoping,
        place: Place::default(),
        groups: Vec::new(),
        lenses: Vec::new(),
        checked: Checked { errors: Vec::new(), warnings: Vec::new() },
    };
    checker.visit_program(program);
    if let Some(&span) = checker.lenses.get(LENS_BUDGET) {
        checker.checked.warnings.push(Problem {
            span,
            message: format!("{} glasses in one module: past the budget of {LENS_BUDGET}", checker.lenses.len()),
            help: Some(
                "every lens is drawn each frame (60 at once were 21% janky frames on a Pixel 8a): group nearby \
                 glass in a GlassGroup, and keep glass to the navigation layer"
                    .into(),
            ),
            docs: vec![Doc::Tour(Tour::LiquidGlassRules), Doc::Tour(Tour::GlassGroups)],
        });
    }
    checker.checked
}

/// How many glasses one module may draw before the compiler warns: a screen's
/// bars, toolbar groups and a floating control, well under the 60 lenses Bloom
/// measured at 21% janky frames on a Pixel 8a (AGENTS.rules.md, Material).
const LENS_BUDGET: usize = 12;

/// Where a chain is written, as far as one expression shows it: inside the
/// children of a glass, of scrolling content, of a glass group.
#[derive(Clone, Copy, Default)]
struct Place {
    in_glass: bool,
    in_content: bool,
    in_group: bool,
    /// Inside a callback of `.map()`: one per item of a list.
    in_list: bool,
}

struct Checker<'m> {
    module: &'m Module,
    scoping: &'m Scoping,
    place: Place,
    /// Per enclosing glass group, toolbar group or toolbar: its tinted glasses.
    groups: Vec<u32>,
    /// Every glass the module draws, in source order (the lens budget).
    lenses: Vec<Span>,
    checked: Checked,
}

impl<'a> Visit<'a> for Checker<'_> {
    fn visit_expression(&mut self, expression: &Expression<'a>) {
        if !self.module.is_chain(expression, self.scoping) {
            if let Err(problem) = check_define_environment(expression, self.module, self.scoping)
                .and_then(|()| check_define_modifier(expression, self.module, self.scoping))
            {
                self.checked.errors.push(problem);
            }
            // A callback of `.map()` draws once per item.
            if let Expression::CallExpression(call) = expression.without_parentheses()
                && let Expression::StaticMemberExpression(member) = &call.callee
                && member.property.name == "map"
            {
                self.visit_expression(&member.object);
                let outer = self.place;
                self.place.in_list = true;
                for argument in &call.arguments {
                    self.visit_argument(argument);
                }
                self.place = outer;
                return;
            }
            walk::walk_expression(self, expression);
            return;
        }
        if let Err(problem) = check_chain(expression, self.module, self.scoping) {
            self.checked.errors.push(problem);
        }
        let glass = self.check_glass(expression);
        self.check_toolbar(expression);
        if let Some(problem) = untagged_choice(expression, self.module, self.scoping) {
            self.checked.errors.push(problem);
        }
        // The chain's own calls were checked together; their arguments are visited
        // for the chains inside them, never the chain's own prefix again. Its
        // children (the constructor's arguments) are inside it: in its glass, its
        // scrolling content, its group.
        let kind = chain_kind(expression, self.module, self.scoping);
        let mut current = expression.without_parentheses();
        while let Expression::CallExpression(call) = current {
            let Expression::StaticMemberExpression(member) = &call.callee else {
                let outer = self.place;
                self.place.in_glass |= glass.is_some();
                self.place.in_content |= CONTENT_KINDS.contains(&kind);
                self.place.in_group |= kind == "glassGroup";
                let group = kind == "glassGroup" || kind == "toolbarGroup";
                self.in_group_scope(group, call.span, |checker| {
                    for argument in &call.arguments {
                        checker.visit_argument(argument);
                    }
                });
                self.place = outer;
                break;
            };
            let toolbar = matches!(member.property.name.as_str(), "toolbar" | "toolbarLeading");
            self.in_group_scope(toolbar, call.span, |checker| {
                for argument in &call.arguments {
                    checker.visit_argument(argument);
                }
            });
            current = member.object.without_parentheses();
        }
    }
}

/// What a phase of `.phases()` sets: what the motion engine plays.
const PHASE_MODIFIERS: &[&str] = &["offset", "scale", "rotation", "opacity"];

/// Nodes whose children are content: they scroll, or they are a card of it.
const CONTENT_KINDS: &[&str] = &["scrollView", "scrollArea", "scrollSurface", "list", "virtualList", "card"];

/// A glass, as the Liquid Glass rules see it.
struct Glass {
    span: Span,
    /// `.inContent()`: in the content layer on purpose.
    in_content: bool,
    /// Tinted with a colour (`.tint()`, or `glassProminent`'s accent).
    tinted: bool,
    /// `clear` with neither a tint nor `.dimmed()`.
    undimmed_clear: bool,
}

impl Checker<'_> {
    /// Visits a group's (a glass group's, a toolbar group's, a toolbar's)
    /// content, then holds Apple's rule of one tinted control in it.
    fn in_group_scope(&mut self, group: bool, span: Span, visit: impl FnOnce(&mut Self)) {
        if !group {
            visit(self);
            return;
        }
        self.groups.push(0);
        visit(self);
        let tinted = self.groups.pop().unwrap_or(0);
        if tinted > 1 {
            self.checked.warnings.push(Problem {
                span,
                message: format!("{tinted} tinted glasses in one group: tint one, the primary action"),
                help: Some(
                    "Apple: refrain from adding color to the background of multiple controls; the key action is \
                     .style('glassProminent'), the rest untinted"
                        .into(),
                ),
                docs: vec![Doc::Tour(Tour::LiquidGlassRules)],
            });
        }
    }

    /// The Liquid Glass rules for one chain (see docs/bloom-language.mdx, Liquid
    /// Glass rules); returns the chain's glass, if it draws one.
    fn check_glass(&mut self, expression: &Expression) -> Option<Glass> {
        let (module, scoping) = (self.module, self.scoping);
        let glass = glass_of(expression, module, scoping);
        if let Some(glass) = &glass {
            self.lenses.push(glass.span);
            if glass.tinted {
                for count in &mut self.groups {
                    *count += 1;
                }
            }
            if glass.undimmed_clear {
                self.checked.warnings.push(Problem {
                    span: glass.span,
                    message: "clear glass with no dimming layer".into(),
                    help: Some(
                        "Apple: clear glass sits over rich media, with a dimming layer when the media is bright: \
                         .glass(clear.dimmed()), or a tint"
                            .into(),
                    ),
                    docs: vec![Doc::Tour(Tour::LiquidGlassRules), Doc::modifier("glass")],
                });
            }
            if self.place.in_list && !glass.in_content {
                self.checked.warnings.push(Problem {
                    span: glass.span,
                    message: "a glass per item of a list".into(),
                    help: Some(
                        "every lens is drawn each frame; a row's control that is glass on purpose says so with \
                         .inContent()"
                            .into(),
                    ),
                    docs: vec![Doc::Tour(Tour::LiquidGlassRules), Doc::modifier("inContent")],
                });
            }
            if self.place.in_glass {
                self.checked.errors.push(Problem {
                    span: glass.span,
                    message: "glass on glass: this glass is inside another glass".into(),
                    help: Some(
                        "Liquid Glass is one layer: drop this .glass(), or put both side by side in a GlassGroup".into(),
                    ),
                    docs: vec![Doc::Tour(Tour::LiquidGlassRules), Doc::Tour(Tour::GlassGroups)],
                });
            } else if self.place.in_content && !glass.in_content {
                self.checked.warnings.push(Problem {
                    span: glass.span,
                    message: "glass in scrolling content: glass belongs to the navigation layer".into(),
                    help: Some(
                        "put it on a bar, a toolbar or a floating control; a control in a row that is glass on purpose \
                         says so with .inContent()"
                            .into(),
                    ),
                    docs: vec![Doc::Tour(Tour::LiquidGlassRules), Doc::modifier("inContent")],
                });
            }
        }
        if let Some(root) = root_call(expression)
            && !self.place.in_group
            && chain_kind(expression, module, scoping) == "stack"
        {
            let siblings = root
                .arguments
                .iter()
                .filter_map(Argument::as_expression)
                .filter(|child| module.is_chain(child, scoping) && glass_of(child, module, scoping).is_some())
                .count();
            if siblings > 1 {
                self.checked.warnings.push(Problem {
                    span: root.span,
                    message: format!("{siblings} glasses side by side outside a GlassGroup"),
                    help: Some(
                        "wrap them in GlassGroup(...): nearby glass renders together, blends and morphs as one".into(),
                    ),
                    docs: vec![Doc::Tour(Tour::GlassGroups), Doc::Node("glassGroup")],
                });
            }
        }
        if let Some(problem) = unlabelled_icon_control(expression, module, scoping) {
            self.checked.errors.push(problem);
        }
        glass
    }
}

impl Checker<'_> {
    /// Apple's toolbar rules (at most three groups in a toolbar, text actions
    /// kept apart from icon actions within a group), and a `ViewThatFits` of at
    /// most three candidates.
    fn check_toolbar(&mut self, expression: &Expression) {
        let (module, scoping) = (self.module, self.scoping);
        for (name, call) in modifier_calls(expression) {
            if name != "toolbar" && name != "toolbarLeading" {
                continue;
            }
            let groups = call
                .arguments
                .iter()
                .filter_map(Argument::as_expression)
                .filter(|item| chain_kind(item, module, scoping) == "toolbarGroup")
                .count();
            if groups > 3 {
                self.checked.warnings.push(Problem {
                    span: call.span,
                    message: format!("{groups} toolbar groups: a toolbar has at most three"),
                    help: Some("Apple: aim for a maximum of three groups; move the rest into a menu".into()),
                    docs: vec![Doc::Tour(Tour::Navigation), Doc::Node("toolbarGroup")],
                });
            }
        }
        if chain_kind(expression, module, scoping) == "viewThatFits"
            && let Some(root) = root_call(expression)
            && root.arguments.len() > 4
        {
            self.checked.warnings.push(Problem {
                span: root.span,
                message: format!("ViewThatFits measures {} candidates", root.arguments.len() - 1),
                help: Some(
                    "each candidate is laid out once more to measure it: keep to three, and small".into(),
                ),
                docs: vec![Doc::Tour(Tour::Layout), Doc::Node("viewThatFits")],
            });
        }
        if chain_kind(expression, module, scoping) != "toolbarGroup" {
            return;
        }
        let Some(root) = root_call(expression) else { return };
        let (mut text, mut icons) = (false, false);
        for item in root.arguments.iter().filter_map(Argument::as_expression) {
            if chain_kind(item, module, scoping) != "button" {
                continue;
            }
            let Some(button) = root_call(item) else { continue };
            let worded = button
                .arguments
                .iter()
                .filter_map(Argument::as_expression)
                .any(|child| chain_kind(child, module, scoping) == "text");
            text |= worded;
            icons |= !worded;
        }
        if text && icons {
            self.checked.warnings.push(Problem {
                span: root.span,
                message: "a toolbar group mixes text and icon buttons".into(),
                help: Some(
                    "Apple: keep actions with text labels apart; put them in groups of their own".into(),
                ),
                docs: vec![Doc::Tour(Tour::Navigation), Doc::Node("toolbarGroup")],
            });
        }
    }
}

/// A row of a menu `Section` with a `.selection()` that is no tagged `Item`: the
/// runtime refuses it (`readMenuRows`), as each row of a section of choices is
/// one choice, its tag its value. A row the compiler cannot see (a list, a
/// name) is the runtime's to check.
fn untagged_choice(expression: &Expression, module: &Module, scoping: &Scoping) -> Option<Problem> {
    if chain_kind(expression, module, scoping) != "menuSection"
        || !modifier_calls(expression).iter().any(|(name, _)| *name == "selection")
    {
        return None;
    }
    let root = root_call(expression)?;
    root.arguments.iter().filter_map(Argument::as_expression).find_map(|row| {
        if !module.is_chain(row, scoping) {
            return None;
        }
        let tagged = chain_kind(row, module, scoping) == "menuItem"
            && modifier_calls(row).iter().any(|(name, _)| *name == "tag");
        (!tagged).then(|| Problem {
            span: row.span(),
            message: "a Section with a .selection() holds its choices only".into(),
            help: Some("each row is a choice: Item(title).tag(value)".into()),
            docs: vec![Doc::Node("menuSection"), Doc::modifier("selection")],
        })
    })
}

/// The constructor call at the root of a chain.
fn root_call<'e, 'a>(expression: &'e Expression<'a>) -> Option<&'e CallExpression<'a>> {
    let mut current = expression.without_parentheses();
    loop {
        let Expression::CallExpression(call) = current else { return None };
        match &call.callee {
            Expression::StaticMemberExpression(member) => current = member.object.without_parentheses(),
            _ => return Some(call),
        }
    }
}

/// The node kind a chain makes (`view` for an app's own view).
fn chain_kind(expression: &Expression, module: &Module, scoping: &Scoping) -> &'static str {
    match module.chain_root(expression, scoping) {
        Some(Binding::Constructor { kind, .. }) => kind,
        _ => "view",
    }
}

/// The chain's modifier calls, outermost first: (name, call).
fn modifier_calls<'e, 'a>(expression: &'e Expression<'a>) -> Vec<(&'e str, &'e CallExpression<'a>)> {
    let mut calls = Vec::new();
    let mut current = expression.without_parentheses();
    while let Expression::CallExpression(call) = current {
        let Expression::StaticMemberExpression(member) = &call.callee else { break };
        calls.push((member.property.name.as_str(), &**call));
        current = member.object.without_parentheses();
    }
    calls
}

/// The glass a chain draws: a `.glass()` that is not `identity`, a glass
/// button style, or a FAB (always on glass) without `.glass(identity)`.
fn glass_of(expression: &Expression, module: &Module, scoping: &Scoping) -> Option<Glass> {
    let calls = modifier_calls(expression);
    let in_content = calls.iter().any(|(name, _)| *name == "inContent");
    let mut glass: Option<Span> = None;
    let mut identity = false;
    let (mut tinted, mut undimmed_clear) = (false, false);
    for (name, call) in calls.iter().rev() {
        match *name {
            "glass" => {
                let value = call.arguments.first().and_then(Argument::as_expression);
                identity =
                    value.is_some_and(|value| module.resolve(value, scoping) == Some(Binding::GlassIdentity));
                glass = (!identity).then_some(call.span);
                let (root, methods) = value.map_or(("regular", Vec::new()), glass_value_parts);
                tinted = methods.contains(&"tint");
                undimmed_clear = root == "clear" && !tinted && !methods.contains(&"dimmed");
            }
            "style" if is_glass_style(call) => {
                glass = glass.or(Some(call.span));
                tinted |= matches!(
                    call.arguments.first().and_then(Argument::as_expression).map(Expression::without_parentheses),
                    Some(Expression::StringLiteral(style)) if style.value == "glassProminent"
                );
            }
            _ => {}
        }
    }
    let kind = chain_kind(expression, module, scoping);
    if glass.is_none() && kind == "fab" && !identity {
        glass = root_call(expression).map(|root| root.span);
    }
    glass.map(|span| Glass { span, in_content, tinted, undimmed_clear })
}

/// A glass value's root name (`regular`, `clear`, `identity`, or a name of the
/// module's) and the methods chained on it (`tint`, `dimmed`, `interactive`).
fn glass_value_parts<'e>(value: &'e Expression) -> (&'e str, Vec<&'e str>) {
    let mut methods = Vec::new();
    let mut current = value.without_parentheses();
    loop {
        match current {
            Expression::CallExpression(call) => {
                let Expression::StaticMemberExpression(member) = &call.callee else { return ("", methods) };
                methods.push(member.property.name.as_str());
                current = member.object.without_parentheses();
            }
            Expression::Identifier(identifier) => return (identifier.name.as_str(), methods),
            _ => return ("", methods),
        }
    }
}

/// `.style('glass')` or `.style('glassProminent')`: a button on glass.
fn is_glass_style(call: &CallExpression) -> bool {
    matches!(
        call.arguments.first().and_then(Argument::as_expression).map(Expression::without_parentheses),
        Some(Expression::StringLiteral(style)) if style.value == "glass" || style.value == "glassProminent"
    )
}

/// A `Button` or `FAB` whose content is glyphs alone has a `.label()`: the
/// glyph says nothing to a screen reader (Apple: "provide an accessibility
/// label for every icon").
fn unlabelled_icon_control(expression: &Expression, module: &Module, scoping: &Scoping) -> Option<Problem> {
    let kind = chain_kind(expression, module, scoping);
    if kind != "button" && kind != "fab" {
        return None;
    }
    let root = root_call(expression)?;
    let mut glyphs = 0;
    for argument in &root.arguments {
        let child = argument.as_expression()?;
        if chain_kind(child, module, scoping) != "icon" || !module.is_chain(child, scoping) {
            return None;
        }
        glyphs += 1;
    }
    if glyphs == 0 || modifier_calls(expression).iter().any(|(name, _)| *name == "label") {
        return None;
    }
    let name = if kind == "fab" { "FAB" } else { "Button" };
    Some(Problem {
        span: root.span,
        message: format!("an icon-only {name} has no .label()"),
        help: Some(format!("name what it does: {name}(Icon(…)).label('Share')")),
        docs: vec![Doc::Tour(Tour::Accessibility), Doc::modifier("label")],
    })
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
            let list = format!("{name} modifiers: {}", spec.modifiers.join(", "));
            let elsewhere = taken_elsewhere(modifier).map(|takers| format!("{takers}; "));
            let help = format!("{}{list}", elsewhere.unwrap_or_default());
            return Err(Problem {
                span,
                message: format!("{name} has no modifier .{modifier}()"),
                help: Some(with_suggestion(suggest(modifier, spec.modifiers), help)),
                docs: [Some(Doc::Node(kind)), Doc::find_modifier(modifier)].into_iter().flatten().collect(),
            });
        }
        check_arguments(modifier, arguments, spec, call_span, module, scoping)?;
        if modifier == "environment" {
            check_environment(arguments, module, scoping)?;
        }
        if holds_glass && fades_view(modifier, arguments, module, scoping) {
            return Err(Problem {
                span: call_span,
                message: format!(".{modifier}() fades a view that holds glass"),
                help: Some(
                    "on the web a faded ancestor flattens the material (it stops blurring); put the fade on the \
                     .glass() view itself, which fades the material's own layers instead"
                        .into(),
                ),
                docs: vec![Doc::Tour(Tour::LiquidGlassRules), Doc::modifier(modifier)],
            });
        }
    }
    Ok(())
}

/// `defineEnvironment('name', default)`: a literal name, and a literal default
/// whose kind every `.environment(key, value)` is held to.
fn check_define_environment(
    expression: &Expression,
    module: &Module,
    scoping: &Scoping,
) -> Result<(), Problem> {
    let Expression::CallExpression(call) = expression.without_parentheses() else { return Ok(()) };
    if module.resolve(&call.callee, scoping) != Some(Binding::DefineEnvironment) {
        return Ok(());
    }
    let mut arguments = call.arguments.iter().filter_map(Argument::as_expression);
    match arguments.next().map(Expression::without_parentheses) {
        Some(Expression::StringLiteral(_)) => {}
        _ => {
            return Err(Problem {
                span: call.span,
                message: "defineEnvironment() takes its name as a string literal".into(),
                help: Some("const Compact = defineEnvironment('compact', false)".into()),
                docs: vec![Doc::Tour(Tour::Environment)],
            });
        }
    }
    let default = arguments.next();
    let literal = default.is_some_and(|value| {
        Literal::of(value).is_some()
            || matches!(value.without_parentheses(), Expression::NullLiteral(_))
            || matches!(value.without_parentheses(), Expression::Identifier(id) if id.name == "undefined")
    });
    if literal {
        return Ok(());
    }
    Err(Problem {
        span: default.map_or(call.span, GetSpan::span),
        message:
            "defineEnvironment() takes a literal default: a string, a number, a boolean, null or undefined"
                .into(),
        help: Some("an environment value is a token or a plain value, never a style or an object".into()),
        docs: vec![Doc::Tour(Tour::Environment)],
    })
}

/// `.environment(key, value)`: a literal value has the kind of the key's default.
fn check_environment(arguments: &[Argument], module: &Module, scoping: &Scoping) -> Result<(), Problem> {
    let mut values = arguments.iter().filter_map(Argument::as_expression);
    let (Some(key), Some(value)) = (values.next(), values.next()) else { return Ok(()) };
    let Some(Binding::EnvironmentKey { kind: Some(expected), .. }) = module.resolve(key, scoping) else {
        return Ok(());
    };
    match Literal::of(value) {
        Some(found) if found != expected => Err(Problem {
            span: value.span(),
            message: format!(".environment() sets a {} value to a {}", expected.name(), found.name()),
            help: Some(format!(
                "the value has the type of the key's default (defineEnvironment): pass a {}",
                expected.name()
            )),
            docs: vec![Doc::Tour(Tour::Environment), Doc::modifier("environment")],
        }),
        _ => Ok(()),
    }
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
    let params = params_of(spec, modifier);
    check_arity(modifier, params, arguments.len(), call_span, Doc::modifier(modifier))?;
    for (param, value) in paired(params, arguments) {
        check_value(modifier, param, value, spec, module, scoping)?;
    }
    Ok(())
}

/// The node's own parameters for `modifier` where it takes them narrower, else the modifier's.
fn params_of(spec: &NodeSpec, modifier: &str) -> &'static [&'static str] {
    spec.params
        .iter()
        .chain(MODIFIERS)
        .find(|(name, _)| *name == modifier)
        .map_or(&[][..], |(_, params)| params)
}

/// `.name()` takes as many arguments as `params` has, less the optional ones.
fn check_arity(name: &str, params: &[&str], count: usize, call_span: Span, doc: Doc) -> Result<(), Problem> {
    let required = params.iter().filter(|param| !param.ends_with('?')).count();
    if params.contains(&"children") || (required..=params.len()).contains(&count) {
        return Ok(());
    }
    let expected = if required == params.len() {
        required.to_string()
    } else {
        format!("{required} to {}", params.len())
    };
    let signature = format!(".{name}({})", params.join(", "));
    let help = if required == params.len() {
        format!("write it {signature}")
    } else {
        format!("write it {signature}: a parameter marked ? is optional")
    };
    Err(Problem {
        span: call_span,
        message: format!(".{name}() takes {expected} argument(s), not {count}"),
        help: Some(help),
        docs: vec![doc],
    })
}

/// Each argument with its parameter type: optional parameters take the
/// arguments beyond the required ones, in order.
fn paired<'p, 'e, 'a>(
    params: &'p [&'p str],
    arguments: &'e [Argument<'a>],
) -> Vec<(&'p str, &'e Expression<'a>)> {
    let required = params.iter().filter(|param| !param.ends_with('?')).count();
    let mut optional = arguments.len().saturating_sub(required);
    let mut arguments = arguments.iter();
    let mut pairs = Vec::new();
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
        if let Some(value) = argument.as_expression() {
            pairs.push((param, value));
        }
    }
    pairs
}

/// A parameter that takes no token (a view, a boolean): a string written there is never one.
fn check_no_token(name: &str, param: &str, value: &Expression, doc: Doc) -> Result<(), Problem> {
    let Expression::StringLiteral(literal) = value.without_parentheses() else { return Ok(()) };
    Err(Problem {
        span: literal.span,
        message: format!(".{name}() takes a {param} here, not '{}'", literal.value.display()),
        help: Some(format!("pass a {param}: .{name}() takes no token on this node")),
        docs: vec![doc],
    })
}

/// A glass value's methods (`regular.tint('primary', 'subtle')`), outermost
/// first: each one's arguments, as the spec types them.
fn check_glass_value(call: &CallExpression, module: &Module, scoping: &Scoping) -> Result<(), Problem> {
    let mut current = Some(call);
    while let Some(call) = current {
        let Expression::StaticMemberExpression(member) = &call.callee else { return Ok(()) };
        if !module.is_glass_value(&member.object, scoping) {
            return Ok(());
        }
        let method = member.property.name.as_str();
        if let Some((_, params)) = GLASS_VALUE.iter().find(|(name, _)| *name == method) {
            check_arity(method, params, call.arguments.len(), call.span, Doc::modifier("glass"))?;
            for (param, value) in paired(params, &call.arguments) {
                if NO_TOKEN.contains(&param) {
                    check_no_token(method, param, value, Doc::modifier("glass"))?;
                } else if param != "value" {
                    check_token(method, Doc::modifier("glass"), param, value)?;
                }
            }
        }
        current = match member.object.without_parentheses() {
            Expression::CallExpression(inner) => Some(&**inner),
            _ => None,
        };
    }
    Ok(())
}

/// Parameter types that take no token.
const NO_TOKEN: &[&str] = &["view", "boolean"];

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
        if module.is_mapped_value_ref(value, scoping) {
            return Err(Problem {
                span: value.span(),
                message: format!(".{modifier}() moves a MotionValue; a mapped one only follows another"),
                help: Some(format!(".{modifier}() the value it maps, and bind the mapped one")),
                docs: vec![Doc::Tour(Tour::AnimationAndGestures), Doc::modifier(modifier)],
            });
        }
        return if motion_value || !is_literal(value) {
            Ok(())
        } else {
            Err(Problem {
                span: value.span(),
                message: format!(".{modifier}() takes a MotionValue"),
                help: Some("const y = useMotionValue(0), from '@oxy.so/bloom-language'".into()),
                docs: vec![Doc::Tour(Tour::AnimationAndGestures), Doc::modifier(modifier)],
            })
        };
    }
    if motion_value && !matches!(param, "scale" | "rotation" | "value" | "children" | "namespace") {
        return Err(motion_value_for_token(modifier, param, value.span()));
    }
    match param {
        "value" | "children" | "namespace" => Ok(()),
        param if NO_TOKEN.contains(&param) => check_no_token(modifier, param, value, Doc::modifier(modifier)),
        "variant" => check_variant(value, spec, module, scoping),
        // A phase's build: the chain on its view sets geometry and opacity only.
        "phaseBuild" => check_phase(value, spec, module, scoping),
        "contentView" => check_content_view(value, module, scoping),
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
                docs: vec![Doc::modifier(modifier), Doc::Tour(Tour::AnimationAndGestures)],
            }),
            _ => Ok(()),
        },
        param if OBJECTS.iter().any(|(name, _, _, _)| *name == param) => {
            let &(_, keys, set, or_token) =
                OBJECTS.iter().find(|(name, _, _, _)| *name == param).expect("matched above");
            let Expression::ObjectExpression(object) = value.without_parentheses() else {
                // One token on its own is the object too (a refresh tint's one colour).
                return if or_token {
                    check_token(modifier, Doc::modifier(modifier), set, value)
                } else {
                    Ok(())
                };
            };
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
                        docs: vec![Doc::modifier(modifier)],
                    });
                }
                // An offset's axis may follow a `MotionValue` in place of its token; a `value` is no token.
                if let Some(number) =
                    written_number(&property.value).filter(|_| POINT_PARAMS.contains(&param))
                {
                    return Err(written_number_problem(modifier, set, &number, true, property.value.span()));
                }
                if set != "value"
                    && !(param == "offset" && module.is_motion_value_ref(&property.value, scoping))
                {
                    check_token(modifier, Doc::modifier(modifier), set, &property.value)?;
                }
            }
            Ok(())
        }
        "glass" => match value.without_parentheses() {
            Expression::CallExpression(call) => check_glass_value(call, module, scoping),
            Expression::StringLiteral(literal) => Err(Problem {
                span: literal.span,
                message: format!(".glass() takes a glass value, not '{}'", literal.value.display()),
                help: Some("import { regular, clear } from '@oxy.so/bloom-language'".into()),
                docs: vec![Doc::modifier("glass"), Doc::Tour(Tour::Glass)],
            }),
            _ => Ok(()),
        },
        // A list of colours: each one written out is a colour token (an app colour is the runtime's).
        "colors" => match value.without_parentheses() {
            Expression::ArrayExpression(array) => {
                for element in &array.elements {
                    if let Some(color) = element.as_expression() {
                        check_token(modifier, Doc::modifier(modifier), "color", color)?;
                    }
                }
                Ok(())
            }
            Expression::StringLiteral(literal) => Err(Problem {
                span: literal.span,
                message: format!(".{modifier}() takes a list of colours, not '{}'", literal.value.display()),
                help: Some(format!(".{modifier}(['{}', …])", literal.value.display())),
                docs: vec![Doc::modifier(modifier)],
            }),
            _ => Ok(()),
        },
        "size" => spec.size.map_or(Ok(()), |set| check_token(modifier, Doc::modifier(modifier), set, value)),
        "tint" => spec.tint.map_or(Ok(()), |set| check_token(modifier, Doc::modifier(modifier), set, value)),
        "style" => {
            spec.style.map_or(Ok(()), |set| check_token(modifier, Doc::modifier(modifier), set, value))
        }
        "shape" => {
            spec.shape.map_or(Ok(()), |set| check_token(modifier, Doc::modifier(modifier), set, value))
        }
        "blend" => check_token(modifier, Doc::modifier(modifier), spec.blend.unwrap_or("blend"), value),
        // A density is the node's own: each node lists Bloom's names for its densities.
        "density" => check_density(modifier, spec, value),
        set => match written_number(value).filter(|_| POINT_PARAMS.contains(&set)) {
            Some(number) => Err(written_number_problem(modifier, set, &number, true, value.span())),
            None => check_token(modifier, Doc::modifier(modifier), set, value),
        },
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
    let varies = only_taken(VARIANT_MODIFIERS, spec);
    let build = Build {
        allowed: &varies,
        refused: &|modifier| format!("A variant cannot change .{modifier}()"),
        takes: "a variant changes",
        tokens_only: true,
        doc: Doc::Tour(Tour::Variants),
    };
    check_built(value, spec, &build, module, scoping)
}

/// A phase's build (`phaseAnimator(…, (v, phase) => v…)`): the chain on its
/// view sets geometry and opacity only, each one the node takes.
fn check_phase(
    value: &Expression,
    spec: &NodeSpec,
    module: &Module,
    scoping: &Scoping,
) -> Result<(), Problem> {
    let changes = only_taken(PHASE_MODIFIERS, spec);
    let build = Build {
        allowed: &changes,
        refused: &|modifier| format!("A phase cannot change .{modifier}()"),
        takes: "a phase changes",
        tokens_only: true,
        doc: Doc::Tour(Tour::AnimationAndGestures),
    };
    check_built(value, spec, &build, module, scoping)
}

/// `defineModifier((v, …) => v…)`: the chain on its view takes the universal
/// modifiers (it applies to any view), each with valid arguments. A body
/// written any other way is the runtime's.
fn check_define_modifier(expression: &Expression, module: &Module, scoping: &Scoping) -> Result<(), Problem> {
    let Expression::CallExpression(call) = expression.without_parentheses() else { return Ok(()) };
    if module.resolve(&call.callee, scoping) != Some(Binding::DefineModifier) {
        return Ok(());
    }
    let Some(body) = call.arguments.first().and_then(Argument::as_expression) else { return Ok(()) };
    let view = node("view");
    let build = Build {
        allowed: view.modifiers,
        refused: &|modifier| format!("A modifier cannot chain .{modifier}(): it applies to any view"),
        takes: "a modifier chains the universal modifiers",
        tokens_only: false,
        doc: Doc::Tour(Tour::CustomModifiers),
    };
    check_built(body, view, &build, module, scoping)
}

/// A scroll view's content view (`contentView((v) => v.padding('lg'))`): the
/// chain the arrow returns takes only the content view's modifiers (the layout
/// of one view), each checked as a stack's.
fn check_content_view(value: &Expression, module: &Module, scoping: &Scoping) -> Result<(), Problem> {
    let build = Build {
        allowed: CONTENT_VIEW_MODIFIERS,
        refused: &|modifier| format!("A content view cannot take .{modifier}()"),
        takes: "a content view takes",
        tokens_only: false,
        doc: Doc::modifier("contentView"),
    };
    check_built(value, node("stack"), &build, module, scoping)
}

/// Those of `names` the node takes.
fn only_taken(names: &[&'static str], spec: &NodeSpec) -> Vec<&'static str> {
    names.iter().copied().filter(|name| spec.modifiers.contains(name)).collect()
}

/// What a build function's chain may set, and how a refusal reads.
struct Build<'a> {
    /// The modifiers it may set (each one the node takes too).
    allowed: &'a [&'a str],
    /// The refusal of a modifier it may not set.
    refused: &'a dyn Fn(&str) -> String,
    /// The help's lead, before the modifiers it may set.
    takes: &'a str,
    /// Geometry by token only (a variant's, a phase's): a MotionValue moves the view itself.
    tokens_only: bool,
    /// Where what it may set is explained.
    doc: Doc,
}

/// The chain a build function (`(v) => v…`) returns on its first parameter:
/// each modifier one `build` allows, with valid arguments for `spec`. A
/// function written any other way (declared elsewhere) is the runtime's.
fn check_built(
    value: &Expression,
    spec: &NodeSpec,
    build: &Build,
    module: &Module,
    scoping: &Scoping,
) -> Result<(), Problem> {
    let Expression::ArrowFunctionExpression(arrow) = value.without_parentheses() else { return Ok(()) };
    let Some(param) = arrow.params.items.first() else { return Ok(()) };
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
        if !build.allowed.contains(&modifier) || !spec.modifiers.contains(&modifier) {
            return Err(Problem {
                span,
                message: (build.refused)(modifier),
                help: Some(with_suggestion(
                    suggest(modifier, build.allowed),
                    format!("{}: {}", build.takes, build.allowed.join(", ")),
                )),
                docs: vec![build.doc],
            });
        }
        // A variant varies geometry by token: a view that follows a MotionValue moves by the value.
        if let Some(value) = arguments
            .iter()
            .filter_map(Argument::as_expression)
            .find(|value| build.tokens_only && follows_motion_value(value, module, scoping))
        {
            return Err(Problem {
                span: value.span(),
                message: format!(".{modifier}() inside when() takes tokens, not a MotionValue"),
                help: Some(
                    "a variant changes geometry by token; bind the MotionValue outside when() and move it with animate()"
                        .into(),
                ),
                docs: vec![build.doc, Doc::Tour(Tour::AnimationAndGestures)],
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
        docs: vec![Doc::Tour(Tour::AnimationAndGestures), Doc::modifier(modifier)],
    }
}

/// A string literal must be one of `set`'s tokens; anything else is the runtime's.
/// A colour may name an opacity after its role (`'muted/faded'`): both halves are checked.
/// `doc` is where the modifier is explained; the token set's own section follows it.
fn check_token(modifier: &str, doc: Doc, set: &str, value: &Expression) -> Result<(), Problem> {
    if let Some(number) = written_number(value) {
        return Err(written_number_problem(modifier, set, &number, false, value.span()));
    }
    let Expression::StringLiteral(literal) = value.without_parentheses() else { return Ok(()) };
    let token = literal.value.as_str().unwrap_or_default();
    let (set, token) = match token.split_once('/') {
        // A ring's colour is a colour too: `.ring('primary/40')` paints the role at 40%.
        Some((role, opacity)) if (set == "color" || set == "ring") && tokens("color").contains(&role) => {
            ("opacity", opacity)
        }
        _ => (set, token),
    };
    let docs = vec![doc, Doc::tokens(set).unwrap_or(Doc::Tour(Tour::Tokens))];
    known(modifier, set, tokens(set), token, literal.span, docs, || token_elsewhere(token, set))
}

/// A number written out where a token goes. A parameter that takes points
/// (`POINT_PARAMS`: a frame, an edge, a stacking order) takes them computed at
/// render; one written out is its token.
fn written_number_problem(modifier: &str, set: &str, number: &str, points: bool, span: Span) -> Problem {
    Problem {
        span,
        message: format!(".{modifier}() takes {set} tokens, not the number {number}"),
        help: Some(if points {
            format!(
                "a number written out is a token ('{number}'); points are a value the view computes as it renders"
            )
        } else {
            format!("write the token ('{number}'); .{modifier}() takes tokens only")
        }),
        docs: vec![Doc::modifier(modifier), Doc::tokens(set).unwrap_or(Doc::Tour(Tour::Tokens))],
    }
}

/// A number written out (`44`, `-8`) where a token goes: a frame, an edge and a
/// stacking order take points the view computes as it renders, never a literal.
fn written_number(value: &Expression) -> Option<String> {
    match value.without_parentheses() {
        Expression::NumericLiteral(number) => Some(number.value.to_string()),
        Expression::UnaryExpression(unary) if unary.operator == UnaryOperator::UnaryNegation => {
            match unary.argument.without_parentheses() {
                Expression::NumericLiteral(number) => Some(format!("-{}", number.value)),
                _ => None,
            }
        }
        _ => None,
    }
}

/// A density written out is one the node lists itself.
fn check_density(modifier: &str, spec: &NodeSpec, value: &Expression) -> Result<(), Problem> {
    let Expression::StringLiteral(literal) = value.without_parentheses() else { return Ok(()) };
    let token = literal.value.as_str().unwrap_or_default();
    let docs = vec![Doc::modifier(modifier), Doc::Node(spec.kind)];
    let elsewhere = || {
        let takers: Vec<String> = NODES
            .iter()
            .filter(|node| node.densities.contains(&token))
            .filter_map(|node| node.constructors.first().map(|constructor| constructor.to_string()))
            .collect();
        (!takers.is_empty()).then(|| format!("'{token}' is a density of {}", listed(&takers)))
    };
    known(modifier, "density", spec.densities, token, literal.span, docs, elsewhere)
}

fn known(
    modifier: &str,
    set: &str,
    names: &[&str],
    token: &str,
    span: Span,
    docs: Vec<Doc>,
    elsewhere: impl FnOnce() -> Option<String>,
) -> Result<(), Problem> {
    if names.contains(&token) {
        return Ok(());
    }
    let list = format!("{set} tokens: {}", names.join(", "));
    let help = match elsewhere() {
        Some(elsewhere) => format!("{elsewhere}; {list}"),
        None => list,
    };
    Err(Problem {
        span,
        message: format!("Unknown {set} token '{token}' for .{modifier}()"),
        help: Some(with_suggestion(suggest(token, names), help)),
        docs,
    })
}

/// How many takers a hint names before it counts the rest.
const TAKERS_SHOWN: usize = 3;

/// `'bold' is one of the weight tokens, for .weight()`: of the other token
/// sets that have the token, the one the most modifiers (or nodes' own
/// modifiers) take, and those takers.
fn token_elsewhere(token: &str, set: &str) -> Option<String> {
    let (name, takers) = TOKEN_SETS
        .iter()
        .filter(|(name, tokens)| *name != set && tokens.contains(&token))
        .map(|(name, _)| (name, takers_of_set(name)))
        .filter(|(_, takers)| !takers.is_empty())
        .min_by_key(|(_, takers)| std::cmp::Reverse(takers.len()))?;
    Some(format!("'{token}' is one of the {name} tokens, for {}", listed(&takers)))
}

/// The modifiers with a parameter of `set`, then the nodes' own modifiers that read it.
fn takers_of_set(set: &str) -> Vec<String> {
    let has = |params: &[&str]| params.iter().any(|param| param.trim_end_matches('?') == set);
    let mut takers: Vec<String> = MODIFIERS
        .iter()
        .filter(|(_, params)| has(params))
        .map(|(modifier, _)| format!(".{modifier}()"))
        .collect();
    for node in NODES {
        let Some(constructor) = node.constructors.first() else { continue };
        let own = [("size", node.size), ("tint", node.tint), ("style", node.style), ("shape", node.shape)];
        takers.extend(
            own.iter()
                .filter(|(_, own)| *own == Some(set))
                .map(|(modifier, _)| format!("{constructor}().{modifier}()")),
        );
        takers.extend(
            node.params
                .iter()
                .filter(|(_, params)| has(params))
                .map(|(modifier, _)| format!("{constructor}().{modifier}()")),
        );
    }
    takers
}

/// `HStack, VStack and Grid take .childSpacing()`: the constructors of the
/// node kinds that take a modifier this one does not.
fn taken_elsewhere(modifier: &str) -> Option<String> {
    let takers: Vec<String> = NODES
        .iter()
        .filter(|node| node.modifiers.contains(&modifier))
        .flat_map(|node| node.constructors.iter().map(|constructor| constructor.to_string()))
        .collect();
    let verb = if takers.len() == 1 { "takes" } else { "take" };
    (!takers.is_empty()).then(|| format!("{} {verb} .{modifier}()", listed(&takers)))
}

/// The first few of `items`, and how many more.
fn listed(items: &[String]) -> String {
    match items {
        [] => String::new(),
        [only] => only.clone(),
        _ if items.len() <= TAKERS_SHOWN => {
            let (last, first) = items.split_last().expect("two or more");
            format!("{} and {last}", first.join(", "))
        }
        _ => format!("{} and {} more", items[..TAKERS_SHOWN].join(", "), items.len() - TAKERS_SHOWN),
    }
}

fn with_suggestion(suggestion: Option<String>, list: String) -> String {
    match suggestion {
        Some(suggestion) => format!("{suggestion} {list}"),
        None => list,
    }
}
