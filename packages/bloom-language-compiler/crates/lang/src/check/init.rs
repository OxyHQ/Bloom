//! Definite initialization (Swift's): an `init` sets every stored field on every path before it
//! returns, and reads none of them, nor `self` itself, before it is set.
//!
//! A path is the statements in order: an `if`'s branches and a `switch`'s arms each start from
//! what was set before them and continue with what all of them set; a loop's body may run no
//! times, so what it sets does not count after it; a `do`'s catches start from what was set
//! before the `do`. `return` and `throw` end a path (a `return` checks it is complete first;
//! `throw` and an `init?`'s `return none` do not).

use std::collections::BTreeSet;

use crate::ast::*;
use crate::diagnostic::Diagnostic;
use crate::types::{FieldDefault, Ty};

use super::Checker;

/// What a path has set: field names, or `SELF` for `self` set whole.
type Set = BTreeSet<String>;

const SELF: &str = "*";

struct Flow {
    /// The fields an `init` must set: a stored field with no default (a `var` of an optional
    /// type starts as `none`, as Swift's does).
    required: Vec<String>,
    /// Every stored field: a member of `self` that is not one is a method or a computed
    /// property, which reads `self` whole.
    fields: Vec<String>,
    /// A type with no stored fields (an enum, a built-in type): only `self = …` sets it.
    whole: bool,
    failable: bool,
    errors: Vec<Diagnostic>,
}

impl Flow {
    fn complete(&self, set: &Set) -> bool {
        set.contains(SELF) || (!self.whole && self.required.iter().all(|f| set.contains(f)))
    }

    fn missing(&self, set: &Set) -> String {
        if self.whole {
            return "`self`".to_string();
        }
        self.required
            .iter()
            .filter(|f| !set.contains(*f))
            .map(|f| format!("`{f}`"))
            .collect::<Vec<_>>()
            .join(", ")
    }

    /// `stmts` from `set`: what is set at their end, or `None` when no path reaches it.
    fn block(&mut self, stmts: &[Stmt], mut set: Set) -> Option<Set> {
        for stmt in stmts {
            if !self.stmt(stmt, &mut set) {
                return None;
            }
        }
        Some(set)
    }

    /// Whether the path goes on after `stmt`.
    fn stmt(&mut self, stmt: &Stmt, set: &mut Set) -> bool {
        match &stmt.kind {
            StmtKind::Let(l) => self.reads(&l.value, set),
            StmtKind::Var(v) => self.reads(&v.value, set),
            StmtKind::Assign(a) => {
                self.reads(&a.value, set);
                self.assign(&a.target, a.op, set);
            }
            StmtKind::Expr(e) => return self.expr_stmt(e, set),
            StmtKind::Return(value) => {
                let fails = self.failable && value.as_ref().is_some_and(|v| matches!(v.kind, ExprKind::None));
                if let Some(value) = value {
                    self.reads(value, set);
                }
                if !fails && !self.complete(set) {
                    let missing = self.missing(set);
                    self.errors.push(
                        Diagnostic::error(
                            "B0405",
                            stmt.span,
                            format!("`init` returns before it sets {missing}"),
                        )
                        .label("returns here")
                        .help("set every stored field before `return` (or give the field a default)")
                        .spec("44-structs"),
                    );
                }
                return false;
            }
            StmtKind::Throw(e) => {
                self.reads(e, set);
                return false;
            }
            StmtKind::Guard(g) => {
                self.cond(&g.cond, set);
                let _ = self.block(&g.otherwise.stmts, set.clone());
            }
            StmtKind::While(w) => {
                self.reads(&w.cond, set);
                let _ = self.block(&w.body.stmts, set.clone());
            }
            StmtKind::For(f) => {
                self.reads(&f.iter, set);
                let _ = self.block(&f.body.stmts, set.clone());
            }
            StmtKind::Do(d) => {
                let mut outs = vec![self.block(&d.body.stmts, set.clone())];
                for catch in &d.catches {
                    outs.push(self.block(&catch.body.stmts, set.clone()));
                }
                return join(outs, set);
            }
            StmtKind::Defer(_) => {}
            StmtKind::Break(_) | StmtKind::Continue(_) => return false,
        }
        true
    }

    /// An expression as a statement: an `if` or a `switch` is control flow.
    fn expr_stmt(&mut self, e: &Expr, set: &mut Set) -> bool {
        match &e.kind {
            ExprKind::If(if_expr) => {
                self.cond(&if_expr.cond, set);
                let then = self.block(&if_expr.then.stmts, set.clone());
                let otherwise = match if_expr.otherwise.as_deref() {
                    None => Some(set.clone()),
                    Some(Else::Block(b)) => self.block(&b.stmts, set.clone()),
                    Some(Else::If(expr)) => {
                        let mut branch = set.clone();
                        self.expr_stmt(expr, &mut branch).then_some(branch)
                    }
                };
                join(vec![then, otherwise], set)
            }
            ExprKind::Match(m) => {
                self.reads(&m.scrutinee, set);
                let mut outs = Vec::new();
                for arm in &m.arms {
                    let mut branch = set.clone();
                    if let Some(guard) = &arm.guard {
                        self.reads(guard, &branch);
                    }
                    outs.push(match &arm.body {
                        ArmBody::Block(b) => self.block(&b.stmts, branch),
                        ArmBody::Expr(e) => self.expr_stmt(e, &mut branch).then_some(branch),
                    });
                }
                if outs.is_empty() {
                    return true;
                }
                join(outs, set)
            }
            _ => {
                self.reads(e, set);
                true
            }
        }
    }

    fn cond(&mut self, cond: &Cond, set: &Set) {
        match cond {
            Cond::Expr(e) | Cond::Let(_, e) => self.reads(e, set),
        }
    }

    /// `self = v` sets it whole, `self.f = v` the field; any other place reads what it is in.
    fn assign(&mut self, target: &Expr, op: AssignOp, set: &mut Set) {
        match &target.kind {
            ExprKind::Name(name) if name == "self" && op == AssignOp::Set => {
                set.insert(SELF.to_string());
            }
            ExprKind::Field(base, field)
                if matches!(&base.kind, ExprKind::Name(n) if n == "self")
                    && self.fields.contains(&field.name) =>
            {
                if op != AssignOp::Set {
                    self.reads(target, set);
                }
                set.insert(field.name.clone());
            }
            _ => self.reads(target, set),
        }
    }

    /// Every read of `self` in `e`: a field read before it is set, or `self` used whole before
    /// every field is.
    fn reads(&mut self, e: &Expr, set: &Set) {
        let complete = self.complete(set);
        let mut fields_read: Vec<ExprId> = Vec::new();
        let mut errors = Vec::new();
        crate::analysis::walk_expr(e, &mut |node| {
            let crate::analysis::Node::Expr(expr) = node else { return };
            match &expr.kind {
                ExprKind::Field(base, field) | ExprKind::OptField(base, field) if matches!(&base.kind, ExprKind::Name(n) if n == "self") =>
                {
                    if !self.fields.contains(&field.name) {
                        // A method or a computed property: `self` whole (the name below).
                        return;
                    }
                    fields_read.push(base.id);
                    if !set.contains(SELF)
                        && !set.contains(&field.name)
                        && self.required.contains(&field.name)
                    {
                        errors.push(
                            Diagnostic::error(
                                "B0405",
                                expr.span,
                                format!("`self.{}` is read before `init` sets it", field.name),
                            )
                            .label("not set yet")
                            .help(format!("set `self.{} = …` first", field.name))
                            .spec("44-structs"),
                        );
                    }
                }
                ExprKind::Name(n) if n == "self" && !fields_read.contains(&expr.id) && !complete => {
                    errors.push(
                        Diagnostic::error(
                            "B0405",
                            expr.span,
                            "`self` is used before `init` sets every field",
                        )
                        .label("not made yet")
                        .help("set every stored field first, then use `self`")
                        .spec("44-structs"),
                    );
                }
                _ => {}
            }
        });
        self.errors.extend(errors);
    }
}

/// The paths that go on, joined: what every one of them set. `false` when none goes on.
fn join(outs: Vec<Option<Set>>, set: &mut Set) -> bool {
    let mut going = outs.into_iter().flatten();
    let Some(first) = going.next() else { return false };
    *set = going.fold(first, |acc, other| acc.intersection(&other).cloned().collect());
    true
}

impl Checker<'_> {
    /// An `init`'s definite initialization (module doc); `ret`: what it makes (`T`, `T?`).
    pub(super) fn init_flow(&mut self, f: &FnDecl, ret: &Ty, failable: bool) {
        let made = match ret {
            Ty::Option(inner) => (**inner).clone(),
            other => other.clone(),
        };
        let made = self.resolve(&made);
        let defs = &self.out.defs;
        let (fields, required): (Vec<String>, Vec<String>) = match &made {
            Ty::Adt(def, _) => {
                let fields = defs[*def].fields();
                let required = fields
                    .iter()
                    .filter(|f| f.default == FieldDefault::None)
                    .filter(|f| !(f.mutable && matches!(f.ty, Ty::Option(_))))
                    .map(|f| f.name.clone())
                    .collect();
                (fields.iter().map(|f| f.name.clone()).collect(), required)
            }
            _ => (Vec::new(), Vec::new()),
        };
        let whole = fields.is_empty();
        let mut flow = Flow { required, fields, whole, failable, errors: Vec::new() };
        if let Some(end) = flow.block(&f.body.stmts, Set::new())
            && !flow.complete(&end)
        {
            let missing = flow.missing(&end);
            flow.errors.push(
                Diagnostic::error("B0405", f.name.span, format!("`init` ends before it sets {missing}"))
                    .label("this `init`")
                    .help("set every stored field on every path (or give the field a default)")
                    .spec("44-structs"),
            );
        }
        for error in flow.errors {
            self.report(error);
        }
    }
}
