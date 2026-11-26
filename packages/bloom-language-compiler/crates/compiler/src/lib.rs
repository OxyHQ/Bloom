//! Bloom language compiler.
//!
//! An optimisation in front of the bundler's own transform, never a
//! requirement: the runtime (`@oxy.so/bloom-language`) interprets every chain,
//! and this pass changes only what it can prove keeps the same meaning.
//!
//! - **Static chains are hoisted.** A chain whose every input is a literal, an
//!   import or a static module constant is the same immutable node on every
//!   call, so it is built once at module scope. The runtime remembers the
//!   element a node rendered as, so React then skips that subtree.
//! - **View bodies opt into the React Compiler.** Expo runs it in `infer`
//!   mode, which finds components by JSX or hook calls; a body returning
//!   chains has neither, so each body passed to `view()` gets `"use memo"`.
//! - **Chains are checked against the spec**: modifiers and literal tokens,
//!   with the names generated from `spec/language.json` (`spec.generated.rs`).
//!   Every chain is checked, before anything moves: one nested in a hoisted
//!   chain as much as one left where it is.
//!
//! The output is the same program on every platform: resolving tokens stays
//! the runtime's job, so the two can never disagree about what a token means.
//!
//! `.bloom` modules: bloomc (`crates/lang`) runs this pass on what it emits,
//! for the checks above, and its output must be a fixed point of the pass
//! (bloomc hoists static chains itself, and its bodies are `"use no memo"`),
//! so the pass returns it unchanged without printing it again.
//! `crates/lang/tests/fixtures.rs` holds that for every emit fixture: a new
//! transform here that would change bloomc's output fails there until bloomc
//! does the same.

mod check;
mod diagnostics;
mod docs;
#[path = "entries.generated.rs"]
pub mod entries;
mod module;
/// The names chains are checked against, generated from `spec/language.json`:
/// public so the `.bloom` compiler checks its modifiers and tokens against the
/// same tables instead of a copy.
#[rustfmt::skip]
#[path = "spec.generated.rs"]
pub mod spec;

use std::collections::HashSet;

use oxc_allocator::{Allocator, TakeIn};
use oxc_ast::ast::{
    Argument, ArrowFunctionBody, ArrowFunctionExpression, CallExpression, Expression, Function, FunctionBody,
    Statement,
};
use oxc_ast_visit::{Visit, VisitMut, walk, walk_mut};
use oxc_codegen::{Codegen, CodegenOptions};
use oxc_parser::Parser;
use oxc_semantic::{Scoping, SemanticBuilder};
use oxc_span::{GetSpan, SourceType, Span};
use oxc_syntax::scope::ScopeFlags;
use oxc_syntax::symbol::SymbolId;

pub use diagnostics::{Diagnostic, Severity};
pub use docs::{DOCS_BASE, Doc, Tour, links as doc_links};
pub use module::LANGUAGE_MODULE;
use module::{Binding, Module};

pub struct Output {
    /// The compiled module, or the input unchanged when `changed` is false.
    pub code: String,
    /// Source map (JSON) from `code` back to the input, when `changed`.
    pub map: Option<String>,
    pub changed: bool,
    /// How many chains were hoisted to module scope.
    pub hoisted: u32,
    /// Errors: the module does not compile.
    pub diagnostics: Vec<Diagnostic>,
    /// Warnings: reported, and the module compiles.
    pub warnings: Vec<Diagnostic>,
}

impl Output {
    fn unchanged(source: &str, diagnostics: Vec<Diagnostic>, warnings: Vec<Diagnostic>) -> Self {
        Self { code: source.to_string(), map: None, changed: false, hoisted: 0, diagnostics, warnings }
    }
}

pub fn compile(source: &str, filename: &str) -> Output {
    let allocator = Allocator::default();
    let source_type = SourceType::from_path(filename).unwrap_or_default();
    let parsed = Parser::new(&allocator, source, source_type).parse();
    // Syntax errors are the next transform's to report, with its own frame.
    if parsed.diagnostics.has_errors() {
        return Output::unchanged(source, Vec::new(), Vec::new());
    }
    let mut program = parsed.program;
    let scoping = SemanticBuilder::new().build(&program).semantic.into_scoping();
    let Some(module) = Module::read(&program, &scoping) else {
        return Output::unchanged(source, Vec::new(), Vec::new());
    };

    let checked = check::check_program(&program, &module, &scoping);
    let render = |severity, problems: Vec<check::Problem>| -> Vec<Diagnostic> {
        problems
            .into_iter()
            .map(|problem| {
                Diagnostic::with_severity(
                    severity,
                    source,
                    filename,
                    problem.span,
                    problem.message,
                    problem.help,
                    &problem.docs,
                )
            })
            .collect()
    };
    let diagnostics = render(Severity::Error, checked.errors);
    let warnings = render(Severity::Warning, checked.warnings);
    if !diagnostics.is_empty() {
        return Output::unchanged(source, diagnostics, warnings);
    }

    let mut bodies =
        ViewBodies { module: &module, scoping: &scoping, spans: HashSet::new(), symbols: HashSet::new() };
    bodies.visit_program(&program);

    let mut prefix = String::from("_bloomStatic");
    while source.contains(&prefix) {
        prefix.push('_');
    }
    let mut root = String::from("_BloomRoot");
    while source.contains(&root) {
        root.push('_');
    }
    let mut compiler = Compiler {
        allocator: &allocator,
        module: &module,
        scoping: &scoping,
        bodies,
        prefix,
        root,
        jsx: source_type.is_jsx(),
        depth: 0,
        hoisted: Vec::new(),
        memoized: 0,
        lowered: 0,
    };
    compiler.visit_program(&mut program);
    if compiler.hoisted.is_empty() && compiler.memoized == 0 && compiler.lowered == 0 {
        return Output::unchanged(source, Vec::new(), warnings);
    }

    let hoisted = std::mem::take(&mut compiler.hoisted);
    let count = hoisted.len() as u32;
    let mut declarations: Vec<(usize, Statement)> = Vec::new();
    for (at, name, value) in hoisted {
        let span = value.span();
        let mut statements = compiler.parse_statements(&format!("const {name} = __bloomHole;"), span);
        let mut values = [Some(value)];
        for statement in &mut statements {
            HoleFiller { values: &mut values }.visit_statement(statement);
        }
        declarations.extend(statements.into_iter().map(|statement| (at, statement)));
    }
    let body = program.body.take_in(&&allocator);
    let mut pending = declarations.into_iter().peekable();
    for (index, statement) in body.into_iter().enumerate() {
        while let Some((_, declaration)) = pending.next_if(|(at, _)| *at <= index) {
            program.body.push(declaration);
        }
        program.body.push(statement);
    }
    program.body.extend(pending.map(|(_, declaration)| declaration));
    if compiler.lowered > 0 {
        let import = format!("import {{ LanguageRoot as {} }} from '{LANGUAGE_MODULE}';", compiler.root);
        let mut statements = compiler.parse_statements(&import, Span::default());
        program.body.insert(0, statements.remove(0));
    }

    let printed = Codegen::new()
        .with_options(CodegenOptions { source_map_path: Some(filename.into()), ..CodegenOptions::default() })
        .build(&program);
    Output {
        code: printed.code,
        map: printed.map.map(|map| map.to_json_string()),
        changed: true,
        hoisted: count,
        diagnostics: Vec::new(),
        warnings,
    }
}

/// The functions passed to `view()`: inline (by span) or by the name of a
/// module-scope function declaration (by symbol).
struct ViewBodies<'m> {
    module: &'m Module,
    scoping: &'m Scoping,
    spans: HashSet<Span>,
    symbols: HashSet<SymbolId>,
}

impl<'a> Visit<'a> for ViewBodies<'_> {
    fn visit_call_expression(&mut self, call: &CallExpression<'a>) {
        if self.module.resolve(&call.callee, self.scoping) == Some(Binding::View)
            && let Some(body) = call.arguments.first().and_then(Argument::as_expression)
        {
            match body.without_parentheses() {
                Expression::FunctionExpression(function) => {
                    self.spans.insert(function.span);
                }
                Expression::ArrowFunctionExpression(arrow) => {
                    self.spans.insert(arrow.span);
                }
                Expression::Identifier(identifier) => {
                    if let Some(symbol) =
                        identifier.reference_id.get().and_then(|r| self.scoping.get_reference(r).symbol_id())
                    {
                        self.symbols.insert(symbol);
                    }
                }
                _ => {}
            }
        }
        walk::walk_call_expression(self, call);
    }
}

struct Compiler<'a, 's> {
    allocator: &'a Allocator,
    module: &'s Module,
    scoping: &'s Scoping,
    bodies: ViewBodies<'s>,
    prefix: String,
    /// How many functions enclose the expression being visited; only an
    /// expression inside one runs more than once, so only those are hoisted.
    depth: usize,
    /// (body index to declare it before, its name, the expression).
    hoisted: Vec<(usize, String, Expression<'a>)>,
    memoized: usize,
    /// The local name of the language's `LanguageRoot`, imported when a `toElement` is lowered.
    root: String,
    /// Whether the module is JSX (TSX), so a `toElement(chain)` can become an element.
    jsx: bool,
    /// How many `toElement(chain)` calls became `<LanguageRoot build={() => chain} />`.
    lowered: usize,
}

impl<'a> Compiler<'a, '_> {
    /// Whether `expression` is `toElement(chain)` (and an optional key) whose
    /// chain runs at render: what `lower_to_element` rewrites. A bare view
    /// node is left alone: `toElement` mounts its component directly, with no
    /// boundary fiber, and a view's props reach React as JSX props already. So
    /// is a chain of host views that reads nothing and takes no handler or ref
    /// (`Module::host_views`): `toElement` draws it as those views, with no
    /// boundary to build it in.
    fn lowers(&self, expression: &Expression<'a>) -> bool {
        let Expression::CallExpression(call) = expression.without_parentheses() else { return false };
        self.depth > 0
            && self.jsx
            && self.module.resolve(&call.callee, self.scoping) == Some(Binding::ToElement)
            && (1..=2).contains(&call.arguments.len())
            && call.arguments.iter().all(|argument| argument.as_expression().is_some())
            && call.arguments.first().and_then(Argument::as_expression).is_some_and(|chain| {
                // A bare view (`Row(props)`) mounts its own component, with no boundary to build it in.
                !matches!(self.module.callee(chain, self.scoping), Some(Binding::ViewConstructor { .. }))
                    && self.module.is_chain(chain, self.scoping)
                    && !self.module.host_views(chain, self.scoping)
                    && self.module.static_after(chain, self.scoping).is_none()
            })
    }

    /// `toElement(chain, key)` becomes `<LanguageRoot build={() => chain} key={key} />`.
    ///
    /// The React Compiler checks every argument of a call made during render as
    /// something the callee might read then: a press handler that reads a ref
    /// (`ref.current?.measure()`), or a ref given to `.ref()`, makes it give up
    /// on the whole component, and every `useCallback` and `useMemo` in it
    /// becomes a hook slot of its own. A JSX prop is not read during render, so
    /// the chain is built as the boundary renders, from one prop the React
    /// Compiler memoizes like any other. Static chains are hoisted instead.
    fn lower_to_element(&mut self, expression: &mut Expression<'a>) {
        let span = expression.span();
        let Expression::CallExpression(call) = expression.without_parentheses_mut() else { return };
        let mut values: Vec<Option<Expression<'a>>> = Vec::new();
        for argument in call.arguments.iter_mut() {
            let mut value = argument.to_expression_mut().take_in(&self.allocator);
            self.visit_expression(&mut value);
            values.push(Some(value));
        }
        let key = if values.len() == 2 { " key={__bloomHole}" } else { "" };
        let text = self.allocator.alloc_str(&format!("<{} build={{() => __bloomHole}}{key} />", self.root));
        let mut element =
            Parser::new(self.allocator, text, SourceType::jsx()).parse_expression().expect("an element");
        SpanRetarget(span).visit_expression(&mut element);
        HoleFiller { values: &mut values }.visit_expression(&mut element);
        *expression = element;
        self.lowered += 1;
    }

    /// Visit a chain: hoist it when static, else hoist what is static inside it
    /// (its arguments' chains, and its longest static prefix).
    fn visit_chain(&mut self, expression: &mut Expression<'a>) {
        if self.depth > 0
            && let Some(after) = self.module.static_after(expression, self.scoping)
        {
            self.hoist(expression, after);
            return;
        }
        let Expression::CallExpression(call) = expression.without_parentheses_mut() else { return };
        for argument in call.arguments.iter_mut() {
            self.visit_argument(argument);
        }
        if let Expression::StaticMemberExpression(member) = &mut call.callee {
            self.visit_chain(&mut member.object);
        }
    }

    fn hoist(&mut self, expression: &mut Expression<'a>, after: usize) {
        let name = format!("{}{}", self.prefix, self.hoisted.len());
        let span = expression.span();
        let text = self.allocator.alloc_str(&name);
        let mut reference =
            Parser::new(self.allocator, text, SourceType::mjs()).parse_expression().expect("an identifier");
        SpanRetarget(span).visit_expression(&mut reference);
        let value = std::mem::replace(expression, reference);
        self.hoisted.push((after, name, value));
    }

    /// Opt a view body into the React Compiler (see the crate docs).
    fn opt_in_to_memo(&mut self, body: &mut FunctionBody<'a>) {
        if body.directives.iter().any(|d| d.directive == "use memo" || d.directive == "use no memo") {
            return;
        }
        let mut memo = self.parse_function_body("\"use memo\";", body.span);
        body.directives.insert(0, memo.directives.remove(0));
        self.memoized += 1;
    }

    /// `(post) => HStack(…)` becomes `(post) => { "use memo"; return HStack(…); }`.
    fn opt_in_arrow_to_memo(&mut self, arrow: &mut ArrowFunctionExpression<'a>) {
        let ArrowFunctionBody::FunctionBody(body) = &mut arrow.body else {
            let span = arrow.body.span();
            let returned = arrow.body.take_in(&self.allocator);
            let mut body = self.parse_function_body("\"use memo\"; return __bloomHole;", span);
            let mut values = [Some(returned.into_expression())];
            for statement in body.statements.iter_mut() {
                HoleFiller { values: &mut values }.visit_statement(statement);
            }
            arrow.body = ArrowFunctionBody::FunctionBody(body);
            self.memoized += 1;
            return;
        };
        self.opt_in_to_memo(body);
    }

    fn parse_function_body(&self, text: &str, span: Span) -> oxc_allocator::Box<'a, FunctionBody<'a>> {
        let mut statements = self.parse_statements(&format!("function _() {{ {text} }}"), span);
        let Some(Statement::FunctionDeclaration(function)) = statements.pop() else {
            unreachable!("the text is a function declaration")
        };
        function.unbox().body.expect("a declaration has a body")
    }

    fn parse_statements(&self, text: &str, span: Span) -> Vec<Statement<'a>> {
        let text = self.allocator.alloc_str(text);
        let mut program = Parser::new(self.allocator, text, SourceType::mjs()).parse().program;
        SpanRetarget(span).visit_program(&mut program);
        program.body.into_iter().collect()
    }
}

impl<'a> VisitMut<'a> for Compiler<'a, '_> {
    fn visit_expression(&mut self, expression: &mut Expression<'a>) {
        if self.lowers(expression) {
            self.lower_to_element(expression);
            return;
        }
        if !self.module.is_chain(expression, self.scoping) {
            walk_mut::walk_expression(self, expression);
            return;
        }
        self.visit_chain(expression);
    }

    fn visit_function(&mut self, function: &mut Function<'a>, flags: ScopeFlags) {
        let body = self.bodies.spans.contains(&function.span)
            || function.id.as_ref().is_some_and(|id| self.bodies.symbols.contains(&id.symbol_id()));
        if body && let Some(statements) = &mut function.body {
            self.thunks().visit_function_body(statements);
        }
        self.depth += 1;
        walk_mut::walk_function(self, function, flags);
        self.depth -= 1;
        if body && let Some(statements) = &mut function.body {
            self.opt_in_to_memo(statements);
        }
    }

    fn visit_arrow_function_expression(&mut self, arrow: &mut ArrowFunctionExpression<'a>) {
        let body = self.bodies.spans.contains(&arrow.span);
        if body {
            let mut thunks = self.thunks();
            match &mut arrow.body {
                ArrowFunctionBody::FunctionBody(statements) => thunks.visit_function_body(statements),
                // `(props) => chain`: the returned expression.
                returned => thunks.thunk(returned.to_expression_mut()),
            }
        }
        self.depth += 1;
        walk_mut::walk_arrow_function_expression(self, arrow);
        self.depth -= 1;
        if body {
            self.opt_in_arrow_to_memo(arrow);
        }
    }
}

impl<'a> Compiler<'a, '_> {
    fn thunks(&self) -> ReturnThunks<'a, '_> {
        ReturnThunks { allocator: self.allocator, module: self.module, scoping: self.scoping, lowered: 0 }
    }
}

/// A view body's returned chain, as a function that builds it: `return chain`
/// becomes `return () => chain` (`view()` calls it as the body's host
/// renders).
///
/// The body runs as its host renders, and the language compiler opts it into
/// the React Compiler (`"use memo"`). That compiler checks every argument of a
/// call made during render as something the callee might read then: a press
/// handler that reads a ref, or a ref given to `.ref()`, makes it give up on
/// the whole body, and its `useCallback`s and `useMemo`s become hook slots of
/// their own. A returned function is not called during the body's render, so
/// the body compiles and memoizes the function by what the chain reads, as
/// `toElement`'s lowering does with a JSX prop. Only the body's own returns
/// of a chain that runs at render are lowered; a static chain is hoisted.
struct ReturnThunks<'a, 's> {
    allocator: &'a Allocator,
    module: &'s Module,
    scoping: &'s Scoping,
    lowered: usize,
}

impl<'a> ReturnThunks<'a, '_> {
    fn thunk(&mut self, expression: &mut Expression<'a>) {
        if !self.module.is_chain(expression, self.scoping)
            || self.module.static_after(expression, self.scoping).is_some()
        {
            return;
        }
        let span = expression.span();
        let chain = expression.take_in(&self.allocator);
        let mut arrow = Parser::new(self.allocator, "() => __bloomHole", SourceType::mjs())
            .parse_expression()
            .expect("an arrow");
        SpanRetarget(span).visit_expression(&mut arrow);
        let mut values = [Some(chain)];
        HoleFiller { values: &mut values }.visit_expression(&mut arrow);
        *expression = arrow;
        self.lowered += 1;
    }
}

impl<'a> VisitMut<'a> for ReturnThunks<'a, '_> {
    fn visit_return_statement(&mut self, statement: &mut oxc_ast::ast::ReturnStatement<'a>) {
        if let Some(argument) = &mut statement.argument {
            self.thunk(argument);
        }
    }

    // A nested function's returns are its own.
    fn visit_function(&mut self, _function: &mut Function<'a>, _flags: ScopeFlags) {}
    fn visit_arrow_function_expression(&mut self, _arrow: &mut ArrowFunctionExpression<'a>) {}
}

/// Puts a moved expression where the parsed text named `__bloomHole`.
struct HoleFiller<'v, 'a> {
    values: &'v mut [Option<Expression<'a>>],
}

impl<'a> VisitMut<'a> for HoleFiller<'_, 'a> {
    fn visit_expression(&mut self, expression: &mut Expression<'a>) {
        if let Expression::Identifier(identifier) = expression
            && identifier.name == "__bloomHole"
            && let Some(value) = self.values.iter_mut().find_map(Option::take)
        {
            *expression = value;
        } else {
            walk_mut::walk_expression(self, expression);
        }
    }
}

/// Points every span of generated code at the source it stands for, so the
/// source map sends a hoisted declaration back to the chain that wrote it.
struct SpanRetarget(Span);

impl<'a> VisitMut<'a> for SpanRetarget {
    fn visit_span(&mut self, span: &mut Span) {
        *span = self.0;
    }
}

#[cfg(test)]
mod tests;
#[cfg(test)]
#[rustfmt::skip]
#[path = "token_params.generated.rs"]
mod token_params;
