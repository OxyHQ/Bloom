//! Bloom language compiler (spike).
//!
//! Folds static Bloom chains (`HStack(Text('x').font('body')).padding('md')`)
//! into precomputed React elements and hoisted styles, before Babel or any
//! other transform sees the file. Dynamic parts stay as ordinary expressions;
//! chains that need runtime values in a modifier are left to the runtime.

mod chain;
mod diagnostics;
mod emit;
mod tokens;

use oxc_allocator::{Allocator, TakeIn};
use std::collections::HashSet;

use oxc_allocator::Box as ArenaBox;
use oxc_ast::ast::{
    ArrowFunctionBody, ArrowFunctionExpression, BindingPattern, CallExpression, Expression, Function,
    FunctionBody, ImportDeclarationSpecifier, Program, Statement, VariableDeclarator,
};
use oxc_ast_visit::{VisitMut, walk_mut};
use oxc_codegen::{Codegen, CodegenOptions};
use oxc_parser::Parser;
use oxc_span::{GetSpan, SourceType, Span};
use oxc_syntax::scope::ScopeFlags;

pub use chain::Component;
pub use diagnostics::Diagnostic;
pub use emit::Platform;

/// The module whose exports are Bloom chain roots.
pub const LANGUAGE_MODULE: &str = "@oxy.so/bloom-language";

pub struct Output {
    /// The compiled module, or the input unchanged when `changed` is false.
    pub code: String,
    /// Source map (JSON) from `code` back to the input, when `changed`.
    pub map: Option<String>,
    /// Atomic CSS rules for the web platform; empty on native.
    pub css: String,
    pub changed: bool,
    pub diagnostics: Vec<Diagnostic>,
}

impl Output {
    fn unchanged(source: &str, diagnostics: Vec<Diagnostic>) -> Self {
        Self { code: source.to_string(), map: None, css: String::new(), changed: false, diagnostics }
    }
}

pub fn compile(source: &str, filename: &str, platform: Platform) -> Output {
    let allocator = Allocator::default();
    let source_type = SourceType::from_path(filename).unwrap_or_default();
    let parsed = Parser::new(&allocator, source, source_type).parse();
    // Syntax errors are the next transform's to report, with its own frame.
    if parsed.diagnostics.has_errors() {
        return Output::unchanged(source, Vec::new());
    }
    let mut program = parsed.program;
    let Some(imports) = language_imports(&program) else {
        return Output::unchanged(source, Vec::new());
    };
    let (import_span, insert_at) = (imports.span, imports.insert_at);

    let mut compiler = Compiler {
        allocator: &allocator,
        source,
        filename,
        source_type,
        imports: imports.components,
        views: imports.views,
        functions: Vec::new(),
        component_arrows: HashSet::new(),
        emitter: emit::Emitter::new(platform),
        diagnostics: Vec::new(),
    };
    compiler.visit_program(&mut program);
    if !compiler.diagnostics.is_empty() {
        return Output::unchanged(source, compiler.diagnostics);
    }
    if compiler.emitter.is_empty() {
        return Output::unchanged(source, Vec::new());
    }

    let mut prelude = Vec::new();
    for import in compiler.emitter.imports() {
        prelude.extend(compiler.parse_statements(&import, import_span));
    }
    for (declaration, span) in std::mem::take(&mut compiler.emitter.declarations) {
        prelude.extend(compiler.parse_statements(&declaration, span));
    }
    program.body.splice(insert_at..insert_at, prelude);

    let printed = Codegen::new()
        .with_options(CodegenOptions { source_map_path: Some(filename.into()), ..CodegenOptions::default() })
        .build(&program);
    Output {
        code: printed.code,
        map: printed.map.map(|map| map.to_json_string()),
        css: compiler.emitter.css.join("\n"),
        changed: true,
        diagnostics: Vec::new(),
    }
}

struct LanguageImports {
    components: chain::Imports,
    /// Local names of `view`, whose function argument is a component.
    views: HashSet<String>,
    /// The first language import, which generated imports map back to.
    span: Span,
    /// The body index just after the module's last import.
    insert_at: usize,
}

/// The local names bound by `import { … } from '@oxy.so/bloom-language'`.
fn language_imports(program: &Program) -> Option<LanguageImports> {
    let mut imports = chain::Imports::new();
    let mut views = HashSet::new();
    let mut import_span = None;
    let mut insert_at = 0;
    for (index, statement) in program.body.iter().enumerate() {
        let Statement::ImportDeclaration(declaration) = statement else { continue };
        insert_at = index + 1;
        if declaration.source.value != LANGUAGE_MODULE {
            continue;
        }
        import_span.get_or_insert(declaration.span);
        for specifier in declaration.specifiers.iter().flatten() {
            let ImportDeclarationSpecifier::ImportSpecifier(specifier) = specifier else { continue };
            let imported = specifier.imported.name();
            if let Some(component) = Component::from_export(&imported) {
                imports.insert(specifier.local.name.to_string(), component);
            } else if imported == "view" {
                views.insert(specifier.local.name.to_string());
            }
        }
    }
    (!imports.is_empty()).then(|| LanguageImports {
        components: imports,
        views,
        span: import_span.unwrap_or_default(),
        insert_at,
    })
}

struct Compiler<'a, 's> {
    allocator: &'a Allocator,
    source: &'s str,
    filename: &'s str,
    source_type: SourceType,
    imports: chain::Imports,
    views: HashSet<String>,
    /// Enclosing functions, innermost last: (is a component, holds a compiled
    /// element with runtime values).
    functions: Vec<(bool, bool)>,
    /// Arrow functions known to be components, by span.
    component_arrows: HashSet<Span>,
    emitter: emit::Emitter,
    diagnostics: Vec<Diagnostic>,
}

impl<'a> Compiler<'a, '_> {
    /// Replace a folded chain with its compiled element, keeping the runtime
    /// values (holes) as the original AST nodes.
    fn replace(&mut self, expression: &mut Expression<'a>, node: &chain::Node) {
        let mut holes = Vec::new();
        let mut element = self.emitter.element(node, &mut holes);
        if holes.is_empty() {
            element = self.emitter.hoist_tree(element, node.span);
        } else if let Some((_, dynamic)) = self.functions.last_mut() {
            *dynamic = true;
        }

        let mut taken = HoleTaker {
            allocator: self.allocator,
            holes: &holes,
            taken: holes.iter().map(|_| None).collect(),
        };
        taken.visit_expression(expression);
        let mut values: Vec<Option<Expression<'a>>> = taken.taken;
        for value in values.iter_mut().flatten() {
            self.visit_expression(value); // nested chains inside runtime values
        }

        let text = self.allocator.alloc_str(&element);
        let mut replacement = Parser::new(self.allocator, text, self.source_type)
            .parse_expression()
            .expect("the emitter writes valid expressions");
        SpanRetarget(node.span).visit_expression(&mut replacement);
        HoleFiller { values: &mut values }.visit_expression(&mut replacement);
        *expression = replacement;
    }

    /// Opt a component into the React Compiler. Expo's compiler runs in
    /// `infer` mode, which finds components by JSX syntax or hook calls; the
    /// compiled module has neither, so the directive is what keeps the
    /// component memoized on its runtime values.
    fn opt_in_to_memo(&self, body: &mut FunctionBody<'a>) {
        if body.directives.iter().any(|directive| directive.directive == "use memo") {
            return;
        }
        let mut memo = self.parse_function_body("\"use memo\";", body.span);
        body.directives.insert(0, memo.directives.remove(0));
    }

    /// `(post) => HStack(…)` becomes `(post) => { "use memo"; return HStack(…); }`.
    fn opt_in_arrow_to_memo(&self, arrow: &mut ArrowFunctionExpression<'a>) {
        let ArrowFunctionBody::FunctionBody(body) = &mut arrow.body else {
            let span = arrow.body.span();
            let returned = arrow.body.take_in(&self.allocator);
            let mut body = self.parse_function_body("\"use memo\"; return __bloomHole0;", span);
            let mut values = [Some(returned.into_expression())];
            for statement in body.statements.iter_mut() {
                HoleFiller { values: &mut values }.visit_statement(statement);
            }
            arrow.body = ArrowFunctionBody::FunctionBody(body);
            return;
        };
        self.opt_in_to_memo(body);
    }

    fn parse_function_body(&self, text: &str, span: Span) -> ArenaBox<'a, FunctionBody<'a>> {
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
        match chain::analyze(expression, &self.imports) {
            chain::Analysis::Folded(node) => self.replace(expression, &node),
            chain::Analysis::Error { span, message, help } => {
                self.diagnostics.push(Diagnostic::new(self.source, self.filename, span, message, help));
            }
            // A runtime chain's own prefixes are not separate chains; only its
            // arguments can hold chains to fold.
            chain::Analysis::Dynamic => self.visit_chain_arguments(expression),
            chain::Analysis::NotAChain => walk_mut::walk_expression(self, expression),
        }
    }

    fn visit_function(&mut self, function: &mut Function<'a>, flags: ScopeFlags) {
        let component = function.id.as_ref().is_some_and(|id| is_component_name(&id.name));
        self.functions.push((component, false));
        walk_mut::walk_function(self, function, flags);
        if self.functions.pop() == Some((true, true))
            && let Some(body) = &mut function.body
        {
            self.opt_in_to_memo(body);
        }
    }

    fn visit_arrow_function_expression(&mut self, arrow: &mut ArrowFunctionExpression<'a>) {
        self.functions.push((self.component_arrows.contains(&arrow.span), false));
        walk_mut::walk_arrow_function_expression(self, arrow);
        if self.functions.pop() == Some((true, true)) {
            self.opt_in_arrow_to_memo(arrow);
        }
    }

    /// `const PostRow = (…) => …` declares a component.
    fn visit_variable_declarator(&mut self, declarator: &mut VariableDeclarator<'a>) {
        if let BindingPattern::BindingIdentifier(id) = &declarator.id
            && is_component_name(&id.name)
            && let Some(Expression::ArrowFunctionExpression(arrow)) = &declarator.init
        {
            self.component_arrows.insert(arrow.span);
        }
        walk_mut::walk_variable_declarator(self, declarator);
    }

    /// `view((post) => …)` declares a component.
    fn visit_call_expression(&mut self, call: &mut CallExpression<'a>) {
        if let Expression::Identifier(callee) = &call.callee
            && self.views.contains(callee.name.as_str())
            && let Some(Expression::ArrowFunctionExpression(arrow)) =
                call.arguments.first().and_then(|argument| argument.as_expression())
        {
            self.component_arrows.insert(arrow.span);
        }
        walk_mut::walk_call_expression(self, call);
    }
}

/// React's own rule: a component's name starts with a capital letter.
fn is_component_name(name: &str) -> bool {
    name.starts_with(|first: char| first.is_ascii_uppercase())
}

impl<'a> Compiler<'a, '_> {
    fn visit_chain_arguments(&mut self, expression: &mut Expression<'a>) {
        let Expression::CallExpression(call) = expression.without_parentheses_mut() else { return };
        for argument in call.arguments.iter_mut() {
            self.visit_argument(argument);
        }
        if let Expression::StaticMemberExpression(member) = &mut call.callee {
            self.visit_chain_arguments(&mut member.object);
        }
    }
}

/// Moves the runtime-value expressions out of a folded chain.
struct HoleTaker<'a, 'h> {
    allocator: &'a Allocator,
    holes: &'h [Span],
    taken: Vec<Option<Expression<'a>>>,
}

impl<'a> VisitMut<'a> for HoleTaker<'a, '_> {
    fn visit_expression(&mut self, expression: &mut Expression<'a>) {
        if let Some(index) = self.holes.iter().position(|span| *span == expression.span()) {
            self.taken[index] = Some(expression.take_in(&self.allocator));
        } else {
            walk_mut::walk_expression(self, expression);
        }
    }
}

/// Puts the runtime values back where the emitted text named their holes.
struct HoleFiller<'v, 'a> {
    values: &'v mut [Option<Expression<'a>>],
}

impl<'a> VisitMut<'a> for HoleFiller<'_, 'a> {
    fn visit_expression(&mut self, expression: &mut Expression<'a>) {
        if let Expression::Identifier(identifier) = expression
            && let Some(index) =
                identifier.name.strip_prefix("__bloomHole").and_then(|n| n.parse::<usize>().ok())
            && let Some(value) = self.values[index].take()
        {
            *expression = value;
        } else {
            walk_mut::walk_expression(self, expression);
        }
    }
}

/// Points every span of generated code at the chain it came from, so the source
/// map sends a hoisted style or element back to the line that wrote it.
struct SpanRetarget(Span);

impl<'a> VisitMut<'a> for SpanRetarget {
    fn visit_span(&mut self, span: &mut Span) {
        *span = self.0;
    }
}

#[cfg(test)]
mod tests;
