//! Hook functions, as SwiftUI's `DynamicProperty`.
//!
//! A Bloom function with `@State var x = v` in its body (or that calls one at its top level)
//! is a hook: its state belongs to the view that calls it, once per call site, as React's
//! `useState` in a custom hook. SwiftUI's own shape for that is a `DynamicProperty`: a struct
//! the view stores, whose `@State` SwiftUI installs into the view's storage. So
//!
//! ```text
//! public func useCounter(_ start: Int) -> (Int, () -> Void, Binding<Int>) {
//!   @State var count = start
//!   let bump = { count += 1 }
//!   return (count, bump, $count)
//! }
//! ```
//!
//! is `public struct UseCounter: DynamicProperty`, its states `@State` properties set from its
//! `init(_ start:)` (an initial value is computed when the view's value is made, as Swift's
//! `@State var x = f()` is), and the function's value its `value`. A view's
//! `let counter = useCounter(start)` stores `UseCounter(start)`, assigned in its `init`, and
//! reads `counter` as its `value`.

use std::collections::HashSet;
use std::fmt::Write as _;

use bloom_lang::ast::*;

use super::{Emitter, Mode, kw, pad};
use crate::Program;

/// The program's hook functions: a free function with `@State var` at its top level, or whose
/// top-level `let` calls one, to a fixed point.
pub(crate) fn hook_functions(program: &Program) -> HashSet<String> {
    let fns: Vec<&FnDecl> = program
        .modules
        .iter()
        .flat_map(|m| m.files.iter())
        .flat_map(|f| f.ast.items.iter())
        .filter_map(|i| match &i.kind {
            ItemKind::Fn(f) => Some(f),
            _ => None,
        })
        .collect();
    let mut hooks: HashSet<String> = fns
        .iter()
        .filter(|f| f.body.stmts.iter().any(|s| matches!(&s.kind, StmtKind::Var(v) if v.state.is_some())))
        .map(|f| f.name.name.clone())
        .collect();
    loop {
        let before = hooks.len();
        for f in &fns {
            if f.body.stmts.iter().any(|s| hook_let(s, &hooks).is_some()) {
                hooks.insert(f.name.name.clone());
            }
        }
        if hooks.len() == before {
            return hooks;
        }
    }
}

/// `let x = useHook(…)`: the bound name and the call.
pub(crate) fn hook_let<'s>(s: &'s Stmt, hooks: &HashSet<String>) -> Option<(&'s Ident, &'s Call)> {
    let StmtKind::Let(l) = &s.kind else { return None };
    let PatternKind::Bind(name) = &l.pattern.kind else { return None };
    hook_call(&l.value, hooks).map(|c| (name, c))
}

pub(crate) fn hook_call<'e>(e: &'e Expr, hooks: &HashSet<String>) -> Option<&'e Call> {
    let ExprKind::Call(call) = &e.kind else { return None };
    let ExprKind::Name(n) = &call.callee.kind else { return None };
    hooks.contains(n).then_some(call)
}

/// A hook function's `DynamicProperty`'s name: `useCounter` is `UseCounter`.
pub(crate) fn hook_type(name: &str) -> String {
    crate::upper_first(name)
}

impl Emitter<'_> {
    pub(crate) fn is_hook(&self, name: &str) -> bool {
        self.hooks.is_some_and(|h| h.contains(name))
    }

    /// `useCounter(start)` as the stored hook's construction: `UseCounter(start)`.
    pub(crate) fn hook_construction(&mut self, call: &Call) -> String {
        let ExprKind::Name(n) = &call.callee.kind else {
            return self.unsupported(call.callee.span, "a hook call");
        };
        format!("{}({})", hook_type(n), self.args(call))
    }

    pub(crate) fn hook_struct(&mut self, vis: &str, f: &FnDecl) -> String {
        let hooks = self.hooks.cloned().unwrap_or_default();
        let name = hook_type(&f.name.name);
        let params = self.params(&f.params, f.func);
        let ret = match &f.ret {
            Some(t) => self.ty(t),
            None => match self.file.checked.fn_rets.get(&f.span) {
                Some(t) => self.swift_type_text(&bloom_lang::backend::display(t, &self.file.checked)),
                None => "Void".into(),
            },
        };
        let mut stored = String::new();
        let mut init = String::new();
        let mut rest: Vec<Stmt> = Vec::new();
        for s in &f.body.stmts {
            match &s.kind {
                StmtKind::Var(v) if v.state.is_some() => {
                    let ty = match &v.ty {
                        Some(t) => self.ty(t),
                        None => self
                            .type_at(v.name.span)
                            .or_else(|| self.type_at(v.value.span))
                            .map(|t| self.swift_type_text(t))
                            .unwrap_or_else(|| {
                                self.unsupported(v.span, "a hook's `@State` whose type is unknown")
                            }),
                    };
                    let value = self.expr_value(&v.value, 2);
                    let n = kw(&v.name.name);
                    let _ = writeln!(stored, "  @State private var {n}: {ty}");
                    let _ = writeln!(init, "    self._{} = State(initialValue: {value})", v.name.name);
                }
                _ if hook_let(s, &hooks).is_some() => {
                    let (bound, call) = hook_let(s, &hooks).expect("a hook let");
                    let ExprKind::Name(callee) = &call.callee.kind else { unreachable!() };
                    let construction = self.hook_construction(call);
                    let _ = writeln!(stored, "  private let _{}: {}", bound.name, hook_type(callee));
                    let _ = writeln!(init, "    self._{} = {construction}", bound.name);
                    rest.push(Stmt {
                        kind: StmtKind::Let(LetStmt {
                            pattern: Pattern { kind: PatternKind::Bind(bound.clone()), span: bound.span },
                            ty: None,
                            value: Expr {
                                id: ExprId(u32::MAX),
                                kind: ExprKind::Field(
                                    Box::new(Expr {
                                        id: ExprId(u32::MAX),
                                        kind: ExprKind::Name(format!("_{}", bound.name)),
                                        span: Span::default(),
                                    }),
                                    Ident { name: "value".into(), span: Span::default() },
                                ),
                                span: Span::default(),
                            },
                            span: s.span,
                            is_async: false,
                        }),
                        span: s.span,
                    });
                }
                _ => rest.push(s.clone()),
            }
        }
        let mode = if ret == "Void" { Mode::Unit } else { Mode::Value };
        let body = self.block(&rest, 2, mode);
        let p = pad(1);
        format!(
            "/// `{fname}`'s state, kept by the view that calls it (SwiftUI's `DynamicProperty`).\n{vis}struct {name}: DynamicProperty {{\n{stored}\n{p}{vis}init({params}) {{\n{init}{p}}}\n\n{p}{vis}var value: {ret} {{\n{body}{p}}}\n}}\n",
            fname = f.name.name
        )
    }
}
