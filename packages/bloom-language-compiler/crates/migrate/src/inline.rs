//! A private hook with an effect, used by exactly one view, is that view's own code (ADR 0002,
//! the lead's decision of 2026-11-28): 2.0 has no hook functions with effects, so the hook's
//! statements are spliced in where the view called it, and its `useEffect` becomes the view's
//! `.task(id:)`/`.onChange(of:)` like any other. The rewrite is made on the TS text, before it is
//! translated: `usePrefetchReplies(id ? String(id) : '');` becomes `const postId: string = id ?
//! String(id) : '';` and the hook's body, and the hook's declaration is removed.
//!
//! A name of the hook (a parameter or a top-level `const`) that the view's text already uses is
//! renamed after the hook (`postId` in `usePrefetchReplies` is `prefetchRepliesPostId`).

use std::collections::{HashMap, HashSet};

use oxc_allocator::Allocator;
use oxc_ast::ast::*;
use oxc_ast_visit::Visit;
use oxc_parser::Parser;
use oxc_span::{GetSpan, SourceType, Span};

/// The source with every such hook inlined and closures put below what they read, or `None` when
/// neither applies.
pub fn private_hooks(source: &str, filename: &str) -> Option<String> {
    let hooks = inline_hooks(source, filename);
    let text = hooks.as_deref().unwrap_or(source);
    closure_order(text, filename).or(hooks)
}

fn inline_hooks(source: &str, filename: &str) -> Option<String> {
    let allocator = Allocator::default();
    let source_type = SourceType::from_path(filename).unwrap_or_default();
    let parsed = Parser::new(&allocator, source, source_type).parse();
    if parsed.diagnostics.has_errors() {
        return None;
    }
    let program = &parsed.program;
    let mut edits: Vec<(Span, String)> = Vec::new();
    let mut prev_end = 0u32;
    for statement in &program.body {
        let start_gap = prev_end;
        prev_end = statement.span().end;
        let Statement::FunctionDeclaration(f) = statement else { continue };
        let Some(id) = &f.id else { continue };
        let name = id.name.as_str();
        if !is_hook(name)
            || f.r#async
            || f.generator
            || f.type_parameters.is_some()
            || f.params.rest.is_some()
        {
            continue;
        }
        let Some(body) = &f.body else { continue };
        if !body
            .statements
            .iter()
            .all(|s| matches!(s, Statement::VariableDeclaration(_) | Statement::ExpressionStatement(_)))
            || !body.statements.iter().any(is_effect)
        {
            continue;
        }
        let mut params = Vec::new();
        for p in &f.params.items {
            let BindingPattern::BindingIdentifier(b) = &p.pattern else { break };
            if p.initializer.is_some() || p.optional {
                break;
            }
            params.push((b.name.to_string(), p.type_annotation.as_ref().map(|t| t.type_annotation.span())));
        }
        if params.len() != f.params.items.len() {
            continue;
        }
        // Exactly one use: a statement `useX(…)` directly in a function body.
        let mut uses = Uses { name, refs: 0, calls: Vec::new(), functions: Vec::new() };
        uses.visit_program(program);
        let [(call_span, enclosing, args)] = uses.calls.as_slice() else { continue };
        if uses.refs != 2
            || args.len() != params.len()
            || enclosing.start <= f.span.end && enclosing.end >= f.span.start
        {
            continue;
        }
        // The names the hook brings in, and the view's words they would collide with.
        let mut declared: Vec<String> = params.iter().map(|(n, _)| n.clone()).collect();
        for s in &body.statements {
            if let Statement::VariableDeclaration(d) = s {
                let mut b = Bindings(&mut declared);
                for decl in &d.declarations {
                    b.visit_binding_pattern(&decl.id);
                }
            }
        }
        let taken = words(&source[enclosing.start as usize..enclosing.end as usize]);
        let base = {
            let rest = &name[3..];
            let mut c = rest.chars();
            c.next().map(|f| f.to_lowercase().collect::<String>() + c.as_str()).unwrap_or_default()
        };
        let mut renames: HashMap<String, String> = HashMap::new();
        for n in &declared {
            if taken.contains(n) {
                let mut c = n.chars();
                let fresh = format!(
                    "{base}{}{}",
                    c.next().map(|f| f.to_uppercase().collect::<String>()).unwrap_or_default(),
                    c.as_str()
                );
                if taken.contains(&fresh) || declared.contains(&fresh) {
                    renames.clear();
                    break;
                }
                renames.insert(n.clone(), fresh);
            }
        }
        if declared.iter().any(|n| taken.contains(n) && !renames.contains_key(n)) {
            continue;
        }
        // The body's text with the renames.
        let inner = Span::new(body.span.start + 1, body.span.end - 1);
        let mut local: Vec<(Span, String)> = Vec::new();
        if !renames.is_empty() {
            let mut r = Renamer { renames: &renames, edits: &mut local };
            for s in &body.statements {
                r.visit_statement(s);
            }
        }
        let mut text = String::new();
        for ((param, ty), arg) in params.iter().zip(args) {
            let target = renames.get(param).unwrap_or(param);
            let arg_text = &source[arg.start as usize..arg.end as usize];
            if arg_text == target {
                continue;
            }
            let ty =
                ty.map(|t| format!(": {}", &source[t.start as usize..t.end as usize])).unwrap_or_default();
            text.push_str(&format!("const {target}{ty} = {arg_text};\n"));
        }
        text.push_str(&splice(source, inner, &mut local));
        // The hook's own comments go with its code.
        let lead = &source[start_gap as usize..f.span.start as usize];
        let comments = lead.trim();
        let comments = if comments.starts_with("/*") || comments.starts_with("//") { comments } else { "" };
        let inlined = if comments.is_empty() { text } else { format!("{comments}\n{text}") };
        edits.push((*call_span, inlined));
        let removed_from = if comments.is_empty() {
            f.span.start
        } else {
            start_gap + (lead.len() - lead.trim_start().len()) as u32
        };
        edits.push((Span::new(removed_from, f.span.end), String::new()));
    }
    if edits.is_empty() {
        return None;
    }
    Some(splice(source, Span::new(0, source.len() as u32), &mut edits))
}

fn is_hook(name: &str) -> bool {
    name.len() > 3 && name.starts_with("use") && name[3..].starts_with(|c: char| c.is_ascii_uppercase())
}

fn is_effect(s: &Statement) -> bool {
    matches!(s, Statement::ExpressionStatement(e)
        if matches!(&e.expression, Expression::CallExpression(c)
            if matches!(&c.callee, Expression::Identifier(i) if matches!(i.name.as_str(), "useEffect" | "useLayoutEffect"))))
}

/// `text[span]` with `edits` (inside it) applied.
fn splice(source: &str, span: Span, edits: &mut [(Span, String)]) -> String {
    edits.sort_by_key(|(s, _)| s.start);
    let mut out = String::new();
    let mut at = span.start as usize;
    for (s, t) in edits.iter() {
        if (s.start as usize) < at {
            continue;
        }
        out.push_str(&source[at..s.start as usize]);
        out.push_str(t);
        at = s.end as usize;
    }
    out.push_str(&source[at..span.end as usize]);
    out
}

fn words(text: &str) -> HashSet<String> {
    text.split(|c: char| !(c.is_alphanumeric() || c == '_' || c == '$'))
        .filter(|w| !w.is_empty())
        .map(str::to_string)
        .collect()
}

struct Uses<'n> {
    name: &'n str,
    refs: usize,
    /// The call statement, the function it is in (with its parameters), and its arguments.
    calls: Vec<(Span, Span, Vec<Span>)>,
    functions: Vec<Span>,
}

impl<'a> Visit<'a> for Uses<'_> {
    fn visit_identifier_reference(&mut self, id: &IdentifierReference<'a>) {
        if id.name == self.name {
            self.refs += 1;
        }
    }
    fn visit_binding_identifier(&mut self, id: &BindingIdentifier<'a>) {
        if id.name == self.name {
            self.refs += 1;
        }
    }
    fn visit_function(&mut self, f: &Function<'a>, flags: oxc_syntax::scope::ScopeFlags) {
        self.functions.push(f.span);
        oxc_ast_visit::walk::walk_function(self, f, flags);
        self.functions.pop();
    }
    fn visit_arrow_function_expression(&mut self, f: &ArrowFunctionExpression<'a>) {
        self.functions.push(f.span);
        oxc_ast_visit::walk::walk_arrow_function_expression(self, f);
        self.functions.pop();
    }
    fn visit_function_body(&mut self, body: &FunctionBody<'a>) {
        let function = self.functions.last().copied().unwrap_or(body.span);
        for s in &body.statements {
            if let Statement::ExpressionStatement(e) = s
                && let Expression::CallExpression(c) = &e.expression
                && matches!(&c.callee, Expression::Identifier(i) if i.name == self.name)
                && c.arguments.iter().all(|a| a.as_expression().is_some())
            {
                self.calls.push((e.span, function, c.arguments.iter().map(|a| a.span()).collect()));
            }
        }
        oxc_ast_visit::walk::walk_function_body(self, body);
    }
}

struct Bindings<'v>(&'v mut Vec<String>);

impl<'a> Visit<'a> for Bindings<'_> {
    fn visit_binding_identifier(&mut self, id: &BindingIdentifier<'a>) {
        self.0.push(id.name.to_string());
    }
}

struct Renamer<'r> {
    renames: &'r HashMap<String, String>,
    edits: &'r mut Vec<(Span, String)>,
}

impl<'a> Visit<'a> for Renamer<'_> {
    fn visit_identifier_reference(&mut self, id: &IdentifierReference<'a>) {
        if let Some(to) = self.renames.get(id.name.as_str()) {
            self.edits.push((id.span, to.clone()));
        }
    }
    fn visit_binding_identifier(&mut self, id: &BindingIdentifier<'a>) {
        if let Some(to) = self.renames.get(id.name.as_str()) {
            self.edits.push((id.span, to.clone()));
        }
    }
    fn visit_object_property(&mut self, p: &ObjectProperty<'a>) {
        // `{ viewerId }` keeps its key: `{ viewerId: prefetchRepliesViewerId }`.
        if p.shorthand
            && let Expression::Identifier(id) = &p.value
            && let Some(to) = self.renames.get(id.name.as_str())
        {
            self.edits.push((p.span, format!("{}: {to}", id.name)));
            return;
        }
        oxc_ast_visit::walk::walk_object_property(self, p);
    }
    fn visit_binding_property(&mut self, p: &BindingProperty<'a>) {
        if p.shorthand
            && let BindingPattern::BindingIdentifier(id) = &p.value
            && let Some(to) = self.renames.get(id.name.as_str())
        {
            self.edits.push((p.span, format!("{}: {to}", id.name)));
            return;
        }
        if p.shorthand
            && let BindingPattern::AssignmentPattern(a) = &p.value
            && let BindingPattern::BindingIdentifier(id) = &a.left
            && let Some(to) = self.renames.get(id.name.as_str())
        {
            self.edits.push((id.span, format!("{}: {to}", id.name)));
            self.visit_expression(&a.right);
            return;
        }
        oxc_ast_visit::walk::walk_binding_property(self, p);
    }
}

/// `const chrome = (c) => { … replyFooter … }; const replyFooter = …;` in a function body: the
/// closure reads a name declared below it, which JS allows (it runs later) and a 2.0 view's
/// members do not (each member is in scope below itself). The closure moves below the last such
/// declaration when nothing between reads it.
fn closure_order(source: &str, filename: &str) -> Option<String> {
    let allocator = Allocator::default();
    let source_type = SourceType::from_path(filename).unwrap_or_default();
    let parsed = Parser::new(&allocator, source, source_type).parse();
    if parsed.diagnostics.has_errors() {
        return None;
    }
    struct Bodies<'s> {
        source: &'s str,
        edits: Vec<(Span, String)>,
    }
    impl<'a> Visit<'a> for Bodies<'_> {
        fn visit_function_body(&mut self, body: &FunctionBody<'a>) {
            oxc_ast_visit::walk::walk_function_body(self, body);
            let statements = &body.statements;
            let declares = |s: &Statement| -> Vec<String> {
                let mut names = Vec::new();
                if let Statement::VariableDeclaration(d) = s {
                    let mut b = Bindings(&mut names);
                    for decl in &d.declarations {
                        b.visit_binding_pattern(&decl.id);
                    }
                }
                names
            };
            let mut moved: HashSet<usize> = HashSet::new();
            for (i, s) in statements.iter().enumerate() {
                let Statement::VariableDeclaration(d) = s else { continue };
                let [decl] = d.declarations.as_slice() else { continue };
                let BindingPattern::BindingIdentifier(name) = &decl.id else { continue };
                let Some(init) = &decl.init else { continue };
                if !matches!(
                    init.without_parentheses(),
                    Expression::ArrowFunctionExpression(_) | Expression::FunctionExpression(_)
                ) {
                    continue;
                }
                let mut reads = Refs(HashSet::new());
                reads.visit_expression(init);
                let Some(last) = (i + 1..statements.len())
                    .filter(|&j| declares(&statements[j]).iter().any(|n| reads.0.contains(n)))
                    .max()
                else {
                    continue;
                };
                let mut between = Refs(HashSet::new());
                for st in &statements[i + 1..=last] {
                    between.visit_statement(st);
                }
                if between.0.contains(name.name.as_str()) || (i + 1..=last).any(|j| moved.contains(&j)) {
                    continue;
                }
                moved.insert(i);
                // The statement with its own leading comments, from the end of the one before.
                let from = if i == 0 { body.span.start + 1 } else { statements[i - 1].span().end };
                let span = Span::new(from, s.span().end);
                let text = self.source[span.start as usize..span.end as usize].to_string();
                self.edits.push((span, String::new()));
                let at = statements[last].span().end;
                self.edits.push((Span::new(at, at), text));
            }
        }
    }
    struct Refs(HashSet<String>);
    impl<'a> Visit<'a> for Refs {
        fn visit_identifier_reference(&mut self, id: &IdentifierReference<'a>) {
            self.0.insert(id.name.to_string());
        }
    }
    let mut bodies = Bodies { source, edits: Vec::new() };
    bodies.visit_program(&parsed.program);
    if bodies.edits.is_empty() {
        return None;
    }
    Some(splice(source, Span::new(0, source.len() as u32), &mut bodies.edits))
}
