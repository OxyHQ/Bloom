//! React's `useMemo` and `useCallback` written as a view's members (TS code the codemod kept):
//! lowered to plain members, which bloomc memoises in the view's one cache on their exact
//! dependencies (ADR 0002 section 5, "memoisation: none written"). Each costs no hook slot,
//! as the React Compiler folded them into its `_c(n)` cache for the TS.
//!
//! - `let f = useCallback({ … }, [deps])` is `let f = { … }`;
//! - `let x = useMemo({ e }, [deps])` is `let x = e`, and a closure of several lines is called
//!   (`let x = { … }()`).
//!
//! The written dependencies are not read: bloomc's are exact. A hook function keeps its calls,
//! since it has no cache of its own.

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
        let ItemKind::View(view) = &mut item.kind else { continue };
        for member in &mut view.members {
            let Member::Let(stmt) = member else { continue };
            lower_value(&mut stmt.value, &use_memo, &use_callback);
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
    if let [Stmt { kind: StmtKind::Expr(tail), .. }] = closure.body.as_slice() {
        *value = tail.clone();
        return;
    }
    // Several lines: the closure, called where the member is computed.
    *call.callee = function;
    call.args.clear();
}
