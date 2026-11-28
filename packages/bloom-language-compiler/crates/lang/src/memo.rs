//! React's `useMemo` and `useCallback` written as a view's members, or as the top-level `let`s
//! of a hook function (`func useX`; TS code the codemod kept): lowered to plain `let`s, which
//! bloomc memoises in the view's or the hook function's one cache on their exact dependencies
//! (ADR 0002 section 5, "memoisation: none written"). Each costs no hook slot, as the React
//! Compiler folded them into its `_c(n)` cache for the TS.
//!
//! - `let f = useCallback({ … }, [deps])` is `let f = { … }`;
//! - `let x = useMemo({ e }, [deps])` is `let x = e`, and a closure of several lines (or whose
//!   line returns early with `?`) is called (`let x = { … }()`).
//!
//! The written dependencies are not read: bloomc's are exact.

use crate::ast::*;

pub fn lower(file: &mut File) {
    let mut use_memo = Vec::new();
    let mut use_callback = Vec::new();
    for import in &file.imports {
        if import.source != "react" {
            continue;
        }
        let ImportKind::Named(specs) = &import.kind else { continue };
        for spec in specs.iter().filter(|s| !s.type_only) {
            match spec.name.name.as_str() {
                "useMemo" => use_memo.push(spec.local().name.clone()),
                "useCallback" => use_callback.push(spec.local().name.clone()),
                _ => {}
            }
        }
    }
    if use_memo.is_empty() && use_callback.is_empty() {
        return;
    }
    for item in &mut file.items {
        match &mut item.kind {
            ItemKind::View(view) => {
                for member in &mut view.members {
                    let Member::Let(stmt) = member else { continue };
                    lower_value(&mut stmt.value, &use_memo, &use_callback);
                }
            }
            ItemKind::Fn(f) if crate::check::is_hook_name(&f.name.name) && !f.is_async => {
                for stmt in &mut f.body.stmts {
                    let StmtKind::Let(l) = &mut stmt.kind else { continue };
                    if !l.is_async {
                        lower_value(&mut l.value, &use_memo, &use_callback);
                    }
                }
            }
            _ => {}
        }
    }
}

fn lower_value(value: &mut Expr, use_memo: &[String], use_callback: &[String]) {
    let ExprKind::Call(call) = &mut value.kind else { return };
    let ExprKind::Name(name) = &call.callee.kind else { return };
    let memo = use_memo.contains(name);
    if !(memo || use_callback.contains(name))
        || call.trailing.is_some()
        || call.optional
        || call.args.len() != 2
        || call.args.iter().any(|a| a.label.is_some() || a.spread)
        || !matches!(call.args[1].value.kind, ExprKind::List(_))
    {
        return;
    }
    let ExprKind::Closure(closure) = &call.args[0].value.kind else { return };
    if memo && !closure.params.is_empty() {
        return;
    }
    let function = call.args.swap_remove(0).value;
    if !memo {
        *value = function;
        return;
    }
    let ExprKind::Closure(closure) = &function.kind else { unreachable!("matched above") };
    // Inlined, a `?` would return from the hook function, not from the closure.
    if let [Stmt { kind: StmtKind::Expr(tail), .. }] = closure.body.as_slice()
        && !returns_early(tail)
    {
        *value = tail.clone();
        return;
    }
    // Several lines: the closure, called where the member is computed.
    *call.callee = function;
    call.args.clear();
}

/// Whether `expr` holds a `?` (one in a closure of its own too: the IIFE is never wrong).
fn returns_early(expr: &Expr) -> bool {
    let mut found = false;
    crate::analysis::walk_expr(expr, &mut |node| {
        if let crate::analysis::Node::Expr(e) = node
            && matches!(e.kind, ExprKind::Try(_))
        {
            found = true;
        }
    });
    found
}
