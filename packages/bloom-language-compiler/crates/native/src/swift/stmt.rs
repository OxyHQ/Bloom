//! Statements, blocks and patterns, as Swift writes them.
//!
//! Bloom's blocks have a value (a function's, a closure's, a branch's last expression);
//! Swift's do not, outside a single-expression body. A block in [`Mode::Value`] returns its
//! last expression, and an `if` or `switch` in that place returns from each branch.

use std::fmt::Write as _;

use bloom_lang::ast::*;

use super::{Emitter, Mode, kw, pad};

impl Emitter<'_> {
    pub(crate) fn block(&mut self, stmts: &[Stmt], indent: usize, mode: Mode) -> String {
        if mode == Mode::View {
            return self.view_block(stmts, indent);
        }
        let mut out = String::new();
        for (i, stmt) in stmts.iter().enumerate() {
            let last = i + 1 == stmts.len();
            out.push_str(&self.stmt(stmt, indent, if last { mode } else { Mode::Unit }));
        }
        out
    }

    pub(crate) fn let_stmt(&mut self, l: &LetStmt, indent: usize) -> String {
        let p = pad(indent);
        let value = self.expr_value(&l.value, indent);
        let word = if l.is_async { "async let" } else { "let" };
        let ty = l.ty.as_ref().map(|t| format!(": {}", self.ty(t))).unwrap_or_default();
        match &l.pattern.kind {
            PatternKind::Wildcard => format!("{p}_ = {value}\n"),
            PatternKind::Bind(_) | PatternKind::Tuple(_) => {
                let pat = self.binding_pattern(&l.pattern);
                format!("{p}{word} {pat}{ty} = {value}\n")
            }
            _ => format!("{p}{}\n", self.unsupported(l.span, "this `let` pattern")),
        }
    }

    /// `x`, `(a, _)`: the names a `let` binds.
    fn binding_pattern(&mut self, pat: &Pattern) -> String {
        match &pat.kind {
            PatternKind::Bind(n) => kw(&n.name),
            PatternKind::Wildcard => "_".into(),
            PatternKind::Tuple(items) => {
                let items: Vec<String> = items.iter().map(|i| self.binding_pattern(i)).collect();
                format!("({})", items.join(", "))
            }
            _ => self.unsupported(pat.span, "this binding pattern"),
        }
    }

    pub(crate) fn stmt(&mut self, stmt: &Stmt, indent: usize, mode: Mode) -> String {
        let saved = std::mem::replace(&mut self.indent, indent);
        let text = self.stmt_at(stmt, indent, mode);
        self.indent = saved;
        text
    }

    fn stmt_at(&mut self, stmt: &Stmt, indent: usize, mode: Mode) -> String {
        let p = pad(indent);
        match &stmt.kind {
            StmtKind::Let(l) => self.let_stmt(l, indent),
            StmtKind::Var(v) => {
                let ty = v.ty.as_ref().map(|t| format!(": {}", self.ty(t))).unwrap_or_default();
                let value = self.expr_value(&v.value, indent);
                format!("{p}var {}{ty} = {value}\n", kw(&v.name.name))
            }
            StmtKind::Assign(a) => {
                let target = self.expr(&a.target);
                let value = self.expr_value(&a.value, indent);
                format!("{p}{target} {} {value}\n", a.op.text())
            }
            StmtKind::Return(Some(e)) => format!("{p}return {}\n", self.expr_value(e, indent)),
            StmtKind::Return(None) => format!("{p}return\n"),
            StmtKind::Defer(b) => {
                let body = self.block(&b.stmts, indent + 1, Mode::Unit);
                format!("{p}defer {{\n{body}{p}}}\n")
            }
            StmtKind::While(w) => {
                let cond = self.expr(&w.cond);
                let body = self.block(&w.body.stmts, indent + 1, Mode::Unit);
                let label = w.label.as_ref().map(|l| format!("{}: ", kw(&l.name))).unwrap_or_default();
                format!("{p}{label}while {cond} {{\n{body}{p}}}\n")
            }
            StmtKind::Break(l) => format!("{p}break{}\n", l.as_ref().map(|l| format!(" {}", kw(&l.name))).unwrap_or_default()),
            StmtKind::Continue(l) => {
                format!("{p}continue{}\n", l.as_ref().map(|l| format!(" {}", kw(&l.name))).unwrap_or_default())
            }
            StmtKind::For(f) => {
                let pat = self.binding_pattern(&f.pattern);
                let iter = self.expr(&f.iter);
                let body = self.block(&f.body.stmts, indent + 1, Mode::Unit);
                let label = f.label.as_ref().map(|l| format!("{}: ", kw(&l.name))).unwrap_or_default();
                format!("{p}{label}for {pat} in {iter} {{\n{body}{p}}}\n")
            }
            StmtKind::Guard(g) => {
                let cond = self.cond(&g.cond);
                let otherwise = self.block(&g.otherwise.stmts, indent + 1, Mode::Unit);
                format!("{p}guard {cond} else {{\n{otherwise}{p}}}\n")
            }
            StmtKind::Throw(e) => format!("{p}throw {}\n", self.expr(e)),
            StmtKind::Do(d) => {
                let body = self.block(&d.body.stmts, indent + 1, mode);
                let mut out = format!("{p}do {{\n{body}{p}}}");
                for c in &d.catches {
                    let head = match (&c.name, &c.ty, &c.pattern) {
                        (_, _, Some(pat)) => format!(" {}", self.pattern(pat)),
                        (Some(n), Some(t), None) => format!(" let {} as {}", kw(&n.name), self.ty(t)),
                        (None, Some(t), None) => format!(" is {}", self.ty(t)),
                        (Some(n), None, None) if n.name == "error" => String::new(),
                        (Some(n), None, None) => format!(" let {}", kw(&n.name)),
                        (None, None, None) => String::new(),
                    };
                    let inner = self.block(&c.body.stmts, indent + 1, mode);
                    let _ = write!(out, " catch{head} {{\n{inner}{p}}}");
                }
                out.push('\n');
                out
            }
            StmtKind::Expr(e) => match (mode, &e.kind) {
                (Mode::View, _) => self.view_stmt(e, indent),
                (_, ExprKind::If(i)) => self.if_stmt(i, indent, mode),
                (_, ExprKind::Match(m)) => self.switch_stmt(m, indent, mode),
                // `fatal()` and a `throw` in value position need no `return`.
                (Mode::Value, ExprKind::Call(c)) if matches!(&c.callee.kind, ExprKind::Name(n) if n == "fatal") =>
                {
                    format!("{p}{}\n", self.expr(e))
                }
                (Mode::Value, ExprKind::None) => format!("{p}return nil\n"),
                (Mode::Value, _) => format!("{p}return {}\n", self.expr_value(e, indent)),
                (_, _) => format!("{p}{}\n", self.expr_stmt(e)),
            },
        }
    }

    /// An expression whose value is dropped: a call that returns one discards it with `_ =`
    /// only where Swift would warn and the checker says it is not Unit.
    fn expr_stmt(&mut self, e: &Expr) -> String {
        self.expr(e)
    }

    pub(crate) fn cond(&mut self, c: &Cond) -> String {
        match c {
            Cond::Expr(e) => self.expr(e),
            Cond::Let(pat, value) => {
                let v = self.expr(value);
                match &pat.kind {
                    PatternKind::Bind(n) => format!("let {} = {v}", kw(&n.name)),
                    _ => format!("case {} = {v}", self.pattern(pat)),
                }
            }
        }
    }

    pub(crate) fn if_stmt(&mut self, i: &IfExpr, indent: usize, mode: Mode) -> String {
        let p = pad(indent);
        let cond = self.cond(&i.cond);
        let then = self.block(&i.then.stmts, indent + 1, mode);
        let mut out = format!("{p}if {cond} {{\n{then}{p}}}");
        match i.otherwise.as_deref() {
            Some(Else::Block(b)) => {
                let body = self.block(&b.stmts, indent + 1, mode);
                let _ = write!(out, " else {{\n{body}{p}}}");
            }
            Some(Else::If(e)) => {
                if let ExprKind::If(inner) = &e.kind {
                    let nested = self.if_stmt(inner, indent, mode);
                    let _ = write!(out, " else {}", nested.trim_start());
                    return out;
                }
            }
            None if mode == Mode::Value => {
                // A Bloom `if` without `else` in value position is Unit's: nothing to return.
            }
            None => {}
        }
        out.push('\n');
        out
    }

    /// Whether a `switch` over the scrutinee is exhaustive in Swift without a `default`: an
    /// enum of the program (the checker proved every case is handled), a `Bool`, or a
    /// wildcard arm.
    fn exhaustive(&self, m: &MatchExpr) -> bool {
        if m.arms.iter().any(|a| {
            matches!(a.pattern.kind, PatternKind::Wildcard | PatternKind::Bind(_)) && a.guard.is_none()
        }) {
            return true;
        }
        let ty = self.type_at(m.scrutinee.span).map(|t| t.trim_end_matches('?').to_string());
        match ty.as_deref() {
            Some("Bool") => true,
            Some(t) => self.decls.enums.contains_key(t) || self.is_runtime_enum(t),
            // Unknown: trust the patterns when they are all cases.
            None => {
                m.arms.iter().all(|a| matches!(a.pattern.kind, PatternKind::Case { .. } | PatternKind::Or(_)))
            }
        }
    }

    fn is_runtime_enum(&self, t: &str) -> bool {
        matches!(t, "DateStyle" | "DateFormat" | "Result" | "HTTPMethod" | "LoadState")
    }

    pub(crate) fn switch_stmt(&mut self, m: &MatchExpr, indent: usize, mode: Mode) -> String {
        let p = pad(indent);
        let scrutinee = self.expr(&m.scrutinee);
        let mut out = format!("{p}switch {scrutinee} {{\n");
        for arm in &m.arms {
            let head = match &arm.pattern.kind {
                PatternKind::Wildcard => "default".to_string(),
                _ => format!("case {}", self.pattern(&arm.pattern)),
            };
            let guard = arm.guard.as_ref().map(|g| format!(" where {}", self.expr(g))).unwrap_or_default();
            let stmts: Vec<Stmt> = match &arm.body {
                ArmBody::Expr(e) => vec![Stmt { kind: StmtKind::Expr(e.clone()), span: e.span }],
                ArmBody::Block(b) => b.stmts.clone(),
            };
            let body = self.block(&stmts, indent + 1, mode);
            let body = if body.trim().is_empty() {
                format!("{}{}\n", pad(indent + 1), if mode == Mode::View { "EmptyView()" } else { "break" })
            } else {
                body
            };
            let _ = write!(out, "{p}{head}{guard}:\n{body}");
        }
        if !self.exhaustive(m) {
            let fallback = match mode {
                Mode::Value => "fatal(\"no case matched\")",
                Mode::View => "EmptyView()",
                Mode::Unit => "break",
            };
            let _ = writeln!(out, "{p}default:\n{}{fallback}", pad(indent + 1));
        }
        let _ = writeln!(out, "{p}}}");
        out
    }

    /// A `case` pattern: `.image(let url, _)`, `.a, .b`, `1`, `nil`, `(let a, 0)`.
    pub(crate) fn pattern(&mut self, pat: &Pattern) -> String {
        match &pat.kind {
            PatternKind::Wildcard => "_".into(),
            PatternKind::Bind(n) => format!("let {}", kw(&n.name)),
            PatternKind::Literal(e) => self.expr(e),
            PatternKind::None => "nil".into(),
            PatternKind::Case { ty, name, args } => {
                let ty = ty.as_ref().map(|t| t.name.clone()).unwrap_or_default();
                match args {
                    Some(args) => {
                        let items: Vec<String> = args.iter().map(|a| self.pattern(a)).collect();
                        format!("{ty}.{}({})", kw(&name.name), items.join(", "))
                    }
                    None => format!("{ty}.{}", kw(&name.name)),
                }
            }
            PatternKind::Tuple(items) => {
                let items: Vec<String> = items.iter().map(|i| self.pattern(i)).collect();
                format!("({})", items.join(", "))
            }
            PatternKind::Or(ps) => {
                let items: Vec<String> = ps.iter().map(|i| self.pattern(i)).collect();
                items.join(", ")
            }
            PatternKind::Record(_) => self.unsupported(pat.span, "a record pattern"),
        }
    }
}
