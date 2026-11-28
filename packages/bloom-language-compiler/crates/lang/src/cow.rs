//! Copy-on-write for the TypeScript backend: which local `var`s own their array or dictionary,
//! so a write to an element (`xs[i] = v`, `table[k] = v`) or a mutating member (`xs.append(v)`)
//! changes it in place, and which reads copy it.
//!
//! Bloom's arrays and dictionaries are values, as Swift's are: `let b = a` is a copy, and a
//! write to `a` is never seen through `b`. JS's are objects, shared by every name that holds
//! one. A `var` written in place therefore holds its own object, and nothing else may hold it:
//!
//! - it is **copied when it is set** from a value that may be shared (`var xs = ys`, `xs = f()`),
//!   and not from a fresh one (a literal, `Array(repeating:count:)`, `map`, `filter`, …);
//! - it is **copied where it escapes**: bound to another name, passed to a function, stored in a
//!   field or a literal, given as a closure's result;
//! - it is read in place where nothing can keep it: `xs[i]`, `xs.count`, a standard library
//!   member's receiver, `for x in xs` (when the loop does not write it), a comparison, and the
//!   function's own `return xs` (the `var` dies there).
//!
//! Only the top level is shared-free: an element write rebuilds the levels below it
//! (`grid[i][j] = v` is `grid[i] = $at(grid[i], j, v)`), so an element read out earlier
//! (`let row = grid[i]`) never changes. Kotlin and Swift have value semantics of their own and
//! do not read this.

use std::collections::{HashMap, HashSet};

use crate::analysis::{Node, walk_file};
use crate::ast::*;
use crate::check::{AssignRes, CallRes, CheckResult, FieldRes, LocalId, LocalKind, NameRes, Recv};
use crate::types::Ty;

#[derive(Debug, Default)]
pub struct Cow {
    /// The `var`s that own their storage, written in place.
    pub owned: HashSet<LocalId>,
    /// Expressions whose value is copied (`[...xs]`, `{ ...table }`): an owned `var`'s escaping
    /// read, or the shared value an owned `var` is set from.
    pub copies: HashSet<ExprId>,
}

/// What one owned candidate's writes look like.
#[derive(Default)]
struct Writes {
    /// Where it is written in place.
    sites: Vec<Span>,
    /// Written in place inside a closure that captured it.
    captured: bool,
}

pub fn analyze(file: &File, ck: &CheckResult) -> Cow {
    // Each `var` by its name's span (what a `Local`'s span is).
    let mut declared: HashMap<Span, LocalId> = HashMap::new();
    for (id, local) in ck.locals.iter().enumerate() {
        if local.kind == LocalKind::Var && matches!(local.ty, Ty::List(_) | Ty::Map(_)) {
            declared.insert(local.span, id);
        }
    }
    if declared.is_empty() {
        return Cow::default();
    }
    let candidate = |id: LocalId| declared.get(&ck.locals[id].span) == Some(&id);
    // Closures (and `task { … }`'s blocks): a capture is a use inside one that does not hold the
    // declaration.
    let mut closures: Vec<Span> = Vec::new();
    let mut writes: HashMap<LocalId, Writes> = HashMap::new();
    let root_local = |target: &Expr| -> Option<LocalId> {
        let mut root = target;
        while let ExprKind::Field(inner, _) | ExprKind::Index(inner, _) = &root.kind {
            root = inner;
        }
        ck.names.get(&root.id).map(|NameRes::Local(local)| *local)
    };
    // The top segment of a place, from its root: `xs[i]…` is an element of `xs`.
    let top_is_index = |target: &Expr| -> bool {
        let mut node = target;
        let mut top = None;
        loop {
            match &node.kind {
                ExprKind::Field(inner, _) => {
                    top = Some(false);
                    node = inner;
                }
                ExprKind::Index(inner, _) => {
                    top = Some(true);
                    node = inner;
                }
                _ => break,
            }
        }
        top == Some(true)
    };
    walk_file(file, &mut |node| match node {
        Node::Expr(e) => match &e.kind {
            ExprKind::Closure(c) => closures.push(c.span),
            ExprKind::Task(b) => closures.push(b.span),
            // `&xs`: the function it is passed to writes it in place.
            ExprKind::InOut(place) => {
                if let (ExprKind::Name(_), Some(NameRes::Local(local))) =
                    (&place.kind, ck.names.get(&place.id))
                    && candidate(*local)
                {
                    writes.entry(*local).or_default().sites.push(e.span);
                }
            }
            ExprKind::Call(call) => {
                if let Some(t) = &call.trailing {
                    closures.push(t.span);
                }
                if let Some(CallRes::Mutating { .. }) = ck.calls.get(&e.id)
                    && let ExprKind::Field(object, _) = &call.callee.kind
                {
                    match ck.mutations.get(&e.id) {
                        Some(AssignRes::Var { local, fields }) if fields.is_empty() && candidate(*local) => {
                            writes.entry(*local).or_default().sites.push(e.span);
                        }
                        // `bags[i].items.append(x)`: an element of `bags`, written in place.
                        Some(AssignRes::Place { local, model: None, .. })
                            if candidate(*local)
                                && top_is_index(object)
                                && root_local(object) == Some(*local) =>
                        {
                            writes.entry(*local).or_default().sites.push(e.span);
                        }
                        _ => {}
                    }
                }
            }
            _ => {}
        },
        Node::Stmt(stmt) => {
            if let StmtKind::Assign(a) = &stmt.kind {
                match ck.assigns.get(&a.span) {
                    Some(AssignRes::Place { local, model: None, .. })
                        if candidate(*local)
                            && top_is_index(&a.target)
                            && root_local(&a.target) == Some(*local) =>
                    {
                        writes.entry(*local).or_default().sites.push(a.span);
                    }
                    // `xs += ys`: appended in place.
                    Some(AssignRes::Var { local, fields })
                        if fields.is_empty()
                            && a.op == AssignOp::Add
                            && candidate(*local)
                            && matches!(ck.locals[*local].ty, Ty::List(_)) =>
                    {
                        writes.entry(*local).or_default().sites.push(a.span);
                    }
                    _ => {}
                }
            }
        }
        _ => {}
    });
    // An `inout` array or dictionary is the caller's own storage: owned, and handed back (never
    // read as the function's dying `var`).
    let mut handed_back: HashSet<LocalId> = HashSet::new();
    for_each_fn_decl(file, &mut |func| {
        for p in func.params.iter().filter(|p| p.inout) {
            if let Some(&local) = declared.get(&p.name.span) {
                writes.entry(local).or_default();
                handed_back.insert(local);
            }
        }
    });
    if writes.is_empty() {
        return Cow::default();
    }
    let inside = |outer: Span, inner: Span| outer.start <= inner.start && inner.end <= outer.end;
    let captured_at = |decl: Span, at: Span| closures.iter().any(|c| inside(*c, at) && !inside(*c, decl));
    for (local, w) in writes.iter_mut() {
        let decl = ck.locals[*local].span;
        w.captured = w.sites.iter().any(|s| captured_at(decl, *s));
    }
    let owned: HashSet<LocalId> = writes.keys().copied().collect();
    let owned_name = |e: &Expr| -> Option<LocalId> {
        match (&e.kind, ck.names.get(&e.id)) {
            (ExprKind::Name(_), Some(NameRes::Local(local))) if owned.contains(local) => Some(*local),
            _ => None,
        }
    };
    // Reads that keep nothing, by the read's id; and the reads of a loop that writes what it walks.
    let mut in_place: HashSet<ExprId> = HashSet::new();
    let mut walked: HashSet<ExprId> = HashSet::new();
    let mut copies: HashSet<ExprId> = HashSet::new();
    let mut reads: Vec<(ExprId, LocalId)> = Vec::new();
    let unchanged_while = |local: LocalId, span: Span| -> bool {
        let w = &writes[&local];
        !w.captured && !w.sites.iter().any(|s| inside(span, *s))
    };
    // A value an owned `var` may be set from without a copy: one nothing else holds, typed
    // mutable in TS.
    fn fresh(e: &Expr, ck: &CheckResult) -> bool {
        match &e.kind {
            ExprKind::List(_) | ExprKind::Map(_) => true,
            ExprKind::Paren(inner) => fresh(inner, ck),
            ExprKind::Ternary(_, a, b) => fresh(a, ck) && fresh(b, ck),
            ExprKind::Call(_) => match ck.calls.get(&e.id) {
                Some(CallRes::ArrayRepeating) => true,
                Some(CallRes::Method { recv: Recv::List, name }) => matches!(
                    *name,
                    "map"
                        | "filter"
                        | "flatMap"
                        | "slice"
                        | "prefix"
                        | "dropFirst"
                        | "reversed"
                        | "enumerated"
                ),
                _ => false,
            },
            _ => false,
        }
    }
    walk_file(file, &mut |node| match node {
        Node::Expr(e) => {
            if let Some(local) = owned_name(e) {
                reads.push((e.id, local));
            }
            match &e.kind {
                ExprKind::InOut(place) => {
                    if owned_name(place).is_some() {
                        in_place.insert(place.id);
                    }
                }
                ExprKind::Index(object, _) => {
                    if owned_name(object).is_some() {
                        in_place.insert(object.id);
                    }
                }
                ExprKind::Field(object, _) => {
                    if owned_name(object).is_some()
                        && matches!(ck.fields.get(&e.id), Some(FieldRes::Prop { .. }))
                    {
                        in_place.insert(object.id);
                    }
                }
                ExprKind::Binary(op, a, b)
                    if matches!(op, BinaryOp::Eq | BinaryOp::Ne | BinaryOp::Add)
                        && matches!(ck.types.get(&a.id), Some(Ty::List(_) | Ty::Map(_))) =>
                {
                    for side in [a, b] {
                        if owned_name(side).is_some() {
                            in_place.insert(side.id);
                        }
                    }
                }
                ExprKind::Call(call) => {
                    let ExprKind::Field(object, _) = &call.callee.kind else { return };
                    let Some(local) = owned_name(object) else { return };
                    match ck.calls.get(&e.id) {
                        // The place it writes.
                        Some(CallRes::Mutating { .. }) => {
                            in_place.insert(object.id);
                        }
                        // A member that walks it, with closures that may write it: only while
                        // nothing writes it.
                        Some(CallRes::Method { .. })
                            if call.trailing.is_none()
                                && !call
                                    .args
                                    .iter()
                                    .any(|a| matches!(a.value.kind, ExprKind::Closure(_)))
                                || unchanged_while(local, e.span) =>
                        {
                            in_place.insert(object.id);
                        }
                        _ => {}
                    }
                }
                _ => {}
            }
        }
        Node::Stmt(stmt) => match &stmt.kind {
            // `for x in xs`: walked as it is while the loop does not write it.
            StmtKind::For(f) => {
                let iter = match &f.iter.kind {
                    ExprKind::Call(call) => match &call.callee.kind {
                        ExprKind::Field(object, _) => object,
                        _ => &f.iter,
                    },
                    _ => &f.iter,
                };
                if let Some(local) = owned_name(iter) {
                    if unchanged_while(local, stmt.span) {
                        in_place.insert(iter.id);
                    } else {
                        walked.insert(iter.id);
                    }
                }
            }
            StmtKind::Return(Some(value)) => {
                if let Some(local) = owned_name(value)
                    && !writes[&local].captured
                    && !handed_back.contains(&local)
                    && !captured_at(ck.locals[local].span, value.span)
                {
                    in_place.insert(value.id);
                }
            }
            StmtKind::Var(v) => {
                if let Some(&local) = declared.get(&v.name.span)
                    && owned.contains(&local)
                    && !fresh(&v.value, ck)
                    && owned_name(&v.value).is_none()
                {
                    copies.insert(v.value.id);
                }
            }
            StmtKind::Assign(a) => {
                if let Some(AssignRes::Var { local, fields }) = ck.assigns.get(&a.span)
                    && fields.is_empty()
                    && a.op == AssignOp::Set
                    && owned.contains(local)
                    && !fresh(&a.value, ck)
                    && owned_name(&a.value).is_none()
                {
                    copies.insert(a.value.id);
                }
                // The target is written, not read.
                let mut root = &a.target;
                while let ExprKind::Field(inner, _) | ExprKind::Index(inner, _) = &root.kind {
                    root = inner;
                }
                in_place.insert(root.id);
            }
            _ => {}
        },
        _ => {}
    });
    // A function's last line is its result, as `return` is.
    for_each_fn(file, &mut |body| {
        if let Some(Stmt { kind: StmtKind::Expr(value), .. }) = body.stmts.last()
            && let Some(local) = owned_name(value)
            && !writes[&local].captured
            && !handed_back.contains(&local)
            && !captured_at(ck.locals[local].span, value.span)
        {
            in_place.insert(value.id);
        }
    });
    for (id, _) in reads {
        if walked.contains(&id) || !in_place.contains(&id) {
            copies.insert(id);
        }
    }
    Cow { owned, copies }
}

/// Every function declaration of the file: its functions, its types' methods and its views'.
fn for_each_fn_decl<'a>(file: &'a File, f: &mut dyn FnMut(&'a FnDecl)) {
    fn members<'a>(members: &'a [TypeMember], f: &mut dyn FnMut(&'a FnDecl)) {
        for member in members {
            if let TypeMemberKind::Func(func) = &member.kind {
                f(func);
            }
        }
    }
    fn item<'a>(it: &'a Item, f: &mut dyn FnMut(&'a FnDecl)) {
        match &it.kind {
            ItemKind::Fn(func) => f(func),
            ItemKind::Class(c) => members(&c.body.members, f),
            ItemKind::Extension(e) => members(&e.body.members, f),
            ItemKind::Extern(e) => e.items.iter().for_each(|i| item(i, f)),
            ItemKind::View(v) => {
                for member in &v.members {
                    if let Member::Fn(func) = member {
                        f(func);
                    }
                }
            }
            _ => {}
        }
    }
    for i in &file.items {
        item(i, f);
    }
}

/// Every function body of the file: its functions, its types' methods and its views'.
fn for_each_fn<'a>(file: &'a File, f: &mut dyn FnMut(&'a Block)) {
    fn members<'a>(members: &'a [TypeMember], f: &mut dyn FnMut(&'a Block)) {
        for member in members {
            match &member.kind {
                TypeMemberKind::Func(func) => f(&func.body),
                TypeMemberKind::Computed { body, .. } => f(body),
                _ => {}
            }
        }
    }
    fn item<'a>(it: &'a Item, f: &mut dyn FnMut(&'a Block)) {
        match &it.kind {
            ItemKind::Fn(func) => f(&func.body),
            ItemKind::Class(c) => members(&c.body.members, f),
            ItemKind::Extension(e) => members(&e.body.members, f),
            ItemKind::Extern(e) => e.items.iter().for_each(|i| item(i, f)),
            ItemKind::View(v) => {
                for member in &v.members {
                    if let Member::Fn(func) = member {
                        f(&func.body);
                    }
                }
            }
            _ => {}
        }
    }
    for i in &file.items {
        item(i, f);
    }
}
