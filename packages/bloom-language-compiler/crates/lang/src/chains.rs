//! The chain rules (`bloom_language_compiler::rules`: glass, toolbars, labels,
//! choices) over a `.bloom` module: each chain the checker resolved is
//! described to them as the embedded pass describes a TSX chain, in the order
//! that pass walks one, so a rule is written once and holds in both.

use bloom_language_compiler::rules::{self, Chain, Child, FADE_MODIFIERS, Modifier, Problem, Rules, Value};

use crate::analysis::{Node, walk_expr, walk_stmt};
use crate::ast::*;
use crate::check::{CallRes, CheckResult};
use crate::diagnostic::{Diagnostic, Severity};
use crate::ui;

/// How deep a chain's children are described (a toolbar group's buttons' texts).
const DESCRIBED: u8 = 2;

/// The rules' errors and warnings over `file`, checked as `checked`.
pub fn check(file: &File, checked: &CheckResult) -> Vec<Diagnostic> {
    let mut walker = Walker { ck: checked, rules: Rules::default() };
    for item in &file.items {
        walker.item(item);
    }
    walker.rules.finish();
    let Rules { errors, warnings, .. } = walker.rules;
    let lift = |severity: Severity| {
        move |problem: Problem| {
            let span = Span::new(problem.span.start, problem.span.end);
            let mut diagnostic = Diagnostic::error("B0500", span, problem.message).maybe_help(problem.help);
            if let Some(doc) = problem.docs.first() {
                diagnostic = diagnostic.docs(doc.url());
            }
            diagnostic.severity = severity;
            diagnostic
        }
    };
    errors
        .into_iter()
        .map(lift(Severity::Error))
        .chain(warnings.into_iter().map(lift(Severity::Warning)))
        .collect()
}

fn span(span: Span) -> oxc_span::Span {
    oxc_span::Span::new(span.start, span.end)
}

fn peel(mut expr: &Expr) -> &Expr {
    while let ExprKind::Paren(inner) = &expr.kind {
        expr = inner;
    }
    expr
}

struct Walker<'c> {
    ck: &'c CheckResult,
    rules: Rules,
}

impl Walker<'_> {
    fn item(&mut self, item: &Item) {
        match &item.kind {
            ItemKind::Struct(s) => {
                s.fields.iter().filter_map(|f| f.default.as_ref()).for_each(|d| self.expr(d))
            }
            ItemKind::Fn(func) => self.function(func),
            ItemKind::View(view) => {
                for param in view.params.iter().flatten() {
                    if let Some(default) = &param.default {
                        self.expr(default);
                    }
                }
                for member in &view.members {
                    match member {
                        Member::State(state) => self.expr(&state.value),
                        Member::Let(l) => self.expr(&l.value),
                        Member::Fn(func) => self.function(func),
                        Member::Effect(e) => self.stmts(&e.body.stmts),
                    }
                }
                self.stmts(&view.body.stmts);
            }
            ItemKind::Const(c) => self.expr(&c.value),
            ItemKind::Enum(_) | ItemKind::Alias(_) => {}
        }
    }

    fn function(&mut self, func: &FnDecl) {
        for param in &func.params {
            if let Some(default) = &param.default {
                self.expr(default);
            }
        }
        self.stmts(&func.body.stmts);
    }

    fn stmts(&mut self, stmts: &[Stmt]) {
        for stmt in stmts {
            self.stmt(stmt);
        }
    }

    fn stmt(&mut self, stmt: &Stmt) {
        match &stmt.kind {
            StmtKind::Let(l) => self.expr(&l.value),
            StmtKind::Var(v) => self.expr(&v.value),
            StmtKind::Assign(a) => {
                self.expr(&a.target);
                self.expr(&a.value);
            }
            StmtKind::Return(value) => value.iter().for_each(|v| self.expr(v)),
            StmtKind::Defer(block) => self.stmts(&block.stmts),
            StmtKind::While(w) => {
                self.expr(&w.cond);
                self.stmts(&w.body.stmts);
            }
            StmtKind::For(f) => {
                self.expr(&f.iter);
                self.stmts(&f.body.stmts);
            }
            StmtKind::Expr(e) => self.expr(e),
        }
    }

    /// A builder's lines: a `for` draws its body once per item.
    fn builder(&mut self, stmts: &[Stmt]) {
        for stmt in stmts {
            match &stmt.kind {
                StmtKind::For(f) => {
                    self.expr(&f.iter);
                    let scope = self.rules.enter_list();
                    self.builder(&f.body.stmts);
                    self.rules.leave(scope);
                }
                _ => self.stmt(stmt),
            }
        }
    }

    /// A closure: a builder's lines, or a body.
    fn closure(&mut self, closure: &Closure) {
        if self.ck.closures.get(&closure.span).is_some_and(|info| info.builder) {
            self.builder(&closure.body);
        } else {
            self.stmts(&closure.body);
        }
    }

    fn block_or_builder(&mut self, stmts: &[Stmt]) {
        // An `if`/`match` in a builder holds builder lines; elsewhere statements. A `for`
        // line is a builder's only (a statement `for` draws nothing), so one walk serves both.
        self.builder(stmts);
    }

    fn expr(&mut self, expr: &Expr) {
        if self.kind(expr).is_some() {
            self.chain(expr);
            return;
        }
        match &expr.kind {
            ExprKind::Str { parts, .. } => {
                for part in parts {
                    if let StrPart::Interp(inner) = part {
                        self.expr(inner);
                    }
                }
            }
            ExprKind::Paren(a)
            | ExprKind::Unary(_, a)
            | ExprKind::Await(a)
            | ExprKind::Try(a)
            | ExprKind::Field(a, _)
            | ExprKind::OptField(a, _) => self.expr(a),
            ExprKind::Tuple(items) | ExprKind::List(items) => items.iter().for_each(|a| self.expr(a)),
            ExprKind::Record(entries) => entries.iter().for_each(|e| self.expr(e.value())),
            ExprKind::Map(entries) => entries.iter().for_each(|(k, v)| {
                self.expr(k);
                self.expr(v);
            }),
            ExprKind::Binary(_, a, b) | ExprKind::Index(a, b) => {
                self.expr(a);
                self.expr(b);
            }
            ExprKind::Ternary(a, b, c) => {
                self.expr(a);
                self.expr(b);
                self.expr(c);
            }
            ExprKind::Call(call) => {
                // A callback of `.map()` draws once per item.
                let list = matches!(&call.callee.kind, ExprKind::Field(_, name) if name.name == "map");
                match &call.callee.kind {
                    ExprKind::Field(recv, _) if list => self.expr(recv),
                    _ => self.expr(&call.callee),
                }
                let scope = list.then(|| self.rules.enter_list());
                self.arguments(call);
                if let Some(scope) = scope {
                    self.rules.leave(scope);
                }
            }
            ExprKind::Closure(c) => self.closure(c),
            ExprKind::If(i) => self.if_expr(i),
            ExprKind::Match(m) => {
                self.expr(&m.scrutinee);
                for arm in &m.arms {
                    if let Some(guard) = &arm.guard {
                        self.expr(guard);
                    }
                    match &arm.body {
                        ArmBody::Expr(body) => self.expr(body),
                        ArmBody::Block(block) => self.block_or_builder(&block.stmts),
                    }
                }
            }
            ExprKind::Task(block) => self.stmts(&block.stmts),
            _ => {}
        }
    }

    fn if_expr(&mut self, i: &IfExpr) {
        match &i.cond {
            Cond::Expr(e) => self.expr(e),
            Cond::Let(_, e) => self.expr(e),
        }
        self.block_or_builder(&i.then.stmts);
        match i.otherwise.as_deref() {
            Some(Else::If(e)) => self.expr(e),
            Some(Else::Block(block)) => self.block_or_builder(&block.stmts),
            None => {}
        }
    }

    fn arguments(&mut self, call: &Call) {
        for arg in &call.args {
            self.expr(&arg.value);
        }
        if let Some(trailing) = &call.trailing {
            self.closure(trailing);
        }
    }

    /// One chain: its own rules, then its modifiers' arguments outermost first,
    /// then its children, inside it.
    fn chain(&mut self, expr: &Expr) {
        let Some(chain) = self.describe(expr, DESCRIBED, true) else { return };
        let (root, calls) = self.calls(expr);
        if chain.modifiers.iter().any(|m| FADE_MODIFIERS.contains(&m.name)) {
            let holds_glass = self.holds_glass(root);
            for modifier in &chain.modifiers {
                if let Some(problem) = rules::fade(modifier, holds_glass) {
                    self.rules.errors.push(problem);
                }
            }
        }
        let glass = self.rules.chain(&chain);
        for (name, call_span, call, modifier) in calls {
            let scope = modifier.then(|| self.rules.enter_modifier(name, call_span));
            self.arguments(call);
            if let Some(scope) = scope {
                self.rules.leave(scope);
            }
        }
        let scope = self.rules.enter_children(&chain, glass);
        if let ExprKind::Call(call) = &root.kind {
            self.arguments(call);
        }
        self.rules.leave(scope);
    }

    /// The node kind `expr` makes, when it is a chain.
    fn kind(&self, expr: &Expr) -> Option<&'static str> {
        let expr = peel(expr);
        let ExprKind::Call(call) = &expr.kind else { return None };
        match self.ck.calls.get(&expr.id)? {
            CallRes::Node(ctor) => ui::node_by_constructor(ctor).map(|node| node.kind),
            CallRes::Component => ui::node_by_constructor("Embed").map(|node| node.kind),
            CallRes::View { .. } => Some("view"),
            CallRes::Modifier { .. } | CallRes::Task | CallRes::OnChange(_) => match &call.callee.kind {
                ExprKind::Field(recv, _) => self.kind(recv),
                _ => None,
            },
            _ => None,
        }
    }

    /// A chain's root call, and its calls after the root outermost first: the
    /// name, the span from the name to the call's end, the call, and whether it
    /// is a modifier of the chain (`.task` and `.onChange` are the view's effects).
    fn calls<'e>(&self, expr: &'e Expr) -> (&'e Expr, Vec<(&'e str, oxc_span::Span, &'e Call, bool)>) {
        let mut calls = Vec::new();
        let mut current = peel(expr);
        while let ExprKind::Call(call) = &current.kind
            && let ExprKind::Field(recv, name) = &call.callee.kind
            && matches!(
                self.ck.calls.get(&current.id),
                Some(CallRes::Modifier { .. } | CallRes::Task | CallRes::OnChange(_))
            )
        {
            let modifier = matches!(self.ck.calls.get(&current.id), Some(CallRes::Modifier { .. }));
            calls.push((
                name.name.as_str(),
                span(Span::new(name.span.start, current.span.end)),
                call,
                modifier,
            ));
            current = peel(recv);
        }
        (current, calls)
    }

    /// `expr` as the rules read it, its children `depth` levels down.
    fn describe<'e>(&self, expr: &'e Expr, depth: u8, fades: bool) -> Option<Chain<'e>> {
        let kind = self.kind(expr)?;
        let (root, calls) = self.calls(expr);
        let mut modifiers: Vec<Modifier<'e>> = calls
            .into_iter()
            .filter(|(_, _, _, modifier)| *modifier)
            .map(|(name, call_span, call, _)| Modifier {
                name,
                span: call_span,
                value: self.value(call, fades && FADE_MODIFIERS.contains(&name)),
                arguments: if depth == 0 { Vec::new() } else { self.modifier_arguments(call, depth - 1) },
            })
            .collect();
        modifiers.reverse();
        let children = match (&root.kind, depth) {
            (ExprKind::Call(call), 1..) => self.children(root, call, depth - 1),
            _ => Vec::new(),
        };
        Some(Chain { kind, span: span(expr.span), root: span(root.span), modifiers, children })
    }

    fn child<'e>(&self, expr: &'e Expr, depth: u8) -> Child<'e> {
        self.describe(expr, depth, false).map_or(Child::Other, Child::Chain)
    }

    /// A builder's lines as children: each view line one child (a `let` line is none).
    fn lines<'e>(&self, closure: &'e Closure, depth: u8, children: &mut Vec<Child<'e>>) {
        for stmt in &closure.body {
            match &stmt.kind {
                StmtKind::Expr(line) => children.push(self.child(line, depth)),
                StmtKind::Let(_) => {}
                _ => children.push(Child::Other),
            }
        }
    }

    /// The root's arguments, as the emitted constructor call takes them.
    fn children<'e>(&self, root: &'e Expr, call: &'e Call, depth: u8) -> Vec<Child<'e>> {
        if matches!(self.ck.calls.get(&root.id), Some(CallRes::View { .. })) {
            // A view takes its props as one object.
            let props = !call.args.is_empty() || call.trailing.is_some();
            return if props { vec![Child::Other] } else { Vec::new() };
        }
        let mut children: Vec<Child<'e>> =
            call.args.iter().map(|arg| self.child(&arg.value, depth)).collect();
        if let Some(trailing) = &call.trailing {
            self.lines(trailing, depth, &mut children);
        }
        children
    }

    fn modifier_arguments<'e>(&self, call: &'e Call, depth: u8) -> Vec<Child<'e>> {
        let mut arguments: Vec<Child<'e>> =
            call.args.iter().filter(|a| a.label.is_none()).map(|a| self.child(&a.value, depth)).collect();
        if call.args.iter().any(|a| a.label.is_some()) {
            arguments.push(Child::Other);
        }
        if let Some(trailing) = &call.trailing {
            if self.ck.closures.get(&trailing.span).is_some_and(|info| info.builder) {
                self.lines(trailing, depth, &mut arguments);
            } else {
                arguments.push(Child::Other);
            }
        }
        arguments
    }

    /// A modifier's first argument.
    fn value<'e>(&self, call: &'e Call, fades: bool) -> Value<'e> {
        let Some(first) = call.args.iter().find(|a| a.label.is_none()) else {
            return if call.args.is_empty() && call.trailing.is_none() {
                Value::None
            } else {
                Value::Other { fades: false }
            };
        };
        let value = peel(&first.value);
        match &value.kind {
            ExprKind::Str { parts, .. } => match parts.as_slice() {
                [] => Value::Str(""),
                [StrPart::Text(text)] => Value::Str(text),
                _ => Value::Other { fades: false },
            },
            _ if fades => Value::Other { fades: mentions_opacity(value) },
            ExprKind::Name(name) => {
                Value::Path { root: name, methods: Vec::new(), identity: name == "identity" }
            }
            ExprKind::Call(_) => {
                let mut methods = Vec::new();
                let mut current = value;
                loop {
                    match &current.kind {
                        ExprKind::Call(inner) => {
                            let ExprKind::Field(recv, method) = &inner.callee.kind else { break };
                            methods.push(method.name.as_str());
                            current = peel(recv);
                        }
                        ExprKind::Name(name) => {
                            return Value::Path { root: name, methods, identity: false };
                        }
                        _ => break,
                    }
                }
                Value::Path { root: "", methods, identity: false }
            }
            _ => Value::Other { fades: false },
        }
    }

    /// Whether any chain among the root's children, at any depth, has a `.glass()`.
    fn holds_glass(&self, root: &Expr) -> bool {
        let ExprKind::Call(call) = &root.kind else { return false };
        let mut found = false;
        let mut visit = |node: Node| {
            if let Node::Expr(expr) = node
                && let ExprKind::Call(inner) = &expr.kind
                && let ExprKind::Field(recv, name) = &inner.callee.kind
                && name.name == "glass"
                && matches!(self.ck.calls.get(&expr.id), Some(CallRes::Modifier { .. }))
                && self.kind(recv).is_some()
            {
                found = true;
            }
        };
        for arg in &call.args {
            walk_expr(&arg.value, &mut visit);
        }
        if let Some(trailing) = &call.trailing {
            for stmt in &trailing.body {
                walk_stmt(stmt, &mut visit);
            }
        }
        found
    }
}

/// Whether a motion value changes opacity: it names `opacity`, or writes an `opacity:` frame.
fn mentions_opacity(expr: &Expr) -> bool {
    let mut found = false;
    walk_expr(expr, &mut |node| {
        if let Node::Expr(expr) = node {
            match &expr.kind {
                ExprKind::Name(name) if name == "opacity" => found = true,
                ExprKind::Call(call)
                    if call.args.iter().any(|a| a.label.as_ref().is_some_and(|l| l.name == "opacity")) =>
                {
                    found = true;
                }
                _ => {}
            }
        }
    });
    found
}
