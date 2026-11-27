//! `test("name") { … }` and `#expect(…)`: Bloom's test framework (`bloom test`),
//! lowered onto Jest underneath.
//!
//! ```swift
//! import Posts
//!
//! test("a like counts once") {
//!   var post = Post(likes: 0)
//!   post.like()
//!   #expect(post.likes == 1)
//! }
//! ```
//!
//! Each test becomes an `async` function, registered with the runtime's
//! `test`; `#expect(a == b)` becomes `expectEqual(a, b, "a == b")` (a failure
//! names both values) and `#expect(x)` becomes `expect(x, "x")`. The runtime
//! (`bloom:testing`, which `bloom test` maps to its generated module) is
//! imported as a namespace, so its names cross as `Foreign` and the test
//! file's own code stays Bloom-typed.

use std::sync::atomic::{AtomicU32, Ordering};

use crate::ast::*;
use crate::diagnostic::Diagnostic;

/// The runtime's specifier: mapped by `bloom test`'s Jest config.
pub const RUNTIME: &str = "bloom:testing";
const NAMESPACE: &str = "__testing";

static NEXT_ID: AtomicU32 = AtomicU32::new(3_500_000_000);

fn expr(kind: ExprKind, span: Span) -> Expr {
    Expr { id: ExprId(NEXT_ID.fetch_add(1, Ordering::Relaxed)), kind, span }
}

fn runtime(name: &str, span: Span) -> Expr {
    let base = expr(ExprKind::Name(NAMESPACE.into()), span);
    expr(ExprKind::Field(Box::new(base), Ident { name: name.into(), span }), span)
}

fn call(callee: Expr, args: Vec<Expr>, span: Span) -> Expr {
    let args =
        args.into_iter().map(|value| Arg { label: None, spread: false, span: value.span, value }).collect();
    expr(
        ExprKind::Call(Call {
            callee: Box::new(callee),
            args,
            parens: true,
            trailing: None,
            optional: false,
        }),
        span,
    )
}

fn text(value: &str, span: Span) -> Expr {
    expr(ExprKind::Str { parts: vec![StrPart::Text(value.into())], raw: true }, span)
}

/// Lowers `file`'s tests. `allowed`: the file is in a `.tests` target (or in no package).
pub fn lower(file: &mut File, source: &str, allowed: bool) -> Vec<Diagnostic> {
    if !file.items.iter().any(|i| matches!(i.kind, ItemKind::Test(_))) {
        return Vec::new();
    }
    let mut diagnostics = Vec::new();
    let mut items = Vec::new();
    let mut count = 0;
    for item in std::mem::take(&mut file.items) {
        let ItemKind::Test(mut test) = item.kind else {
            items.push(item);
            continue;
        };
        if !allowed {
            diagnostics.push(
                Diagnostic::error("B0823", test.name.span, "a test belongs to a `.tests` target")
                    .label("not in Tests/")
                    .help("move it to Tests/<Name>Tests/, declared as `.tests(\"<Name>Tests\", dependencies: […])`")
                    .toolchain("tests"),
            );
            continue;
        }
        expect_in_block(&mut test.body, source);
        let span = test.name.span;
        let name = Ident { name: format!("__test{count}"), span };
        items.push(Item {
            visibility: Visibility::Private,
            modifiers: item.modifiers.clone(),
            kind: ItemKind::Fn(FnDecl {
                is_async: true,
                func: true,
                name: name.clone(),
                generics: Vec::new(),
                constraints: Vec::new(),
                params: Vec::new(),
                // A test may `try`: what it throws fails it (as a Swift test function).
                throws: Some(Throws { span: item.span, ty: None }),
                ret: None,
                span: item.span,
                body: test.body,
            }),
            span: item.span,
        });
        let register = call(
            runtime("test", span),
            vec![text(&test.name.name, span), expr(ExprKind::Name(name.name.clone()), span)],
            span,
        );
        items.push(Item {
            visibility: Visibility::Private,
            modifiers: Modifiers::default(),
            kind: ItemKind::Const(ConstDecl {
                name: Ident { name: format!("__registered{count}"), span },
                ty: None,
                value: register,
                span,
            }),
            span: item.span,
        });
        count += 1;
    }
    file.items = items;
    if count > 0 {
        let span = Span::new(0, 0);
        file.imports.push(Import {
            kind: ImportKind::Namespace(Ident { name: NAMESPACE.into(), span }),
            source: RUNTIME.into(),
            source_span: span,
            span,
        });
    }
    diagnostics
}

fn expect_in_block(block: &mut Block, source: &str) {
    for stmt in &mut block.stmts {
        expect_in_stmt(stmt, source);
    }
}

fn expect_in_stmt(stmt: &mut Stmt, source: &str) {
    match &mut stmt.kind {
        StmtKind::Let(s) => expect_in(&mut s.value, source),
        StmtKind::Var(s) => expect_in(&mut s.value, source),
        StmtKind::Assign(s) => expect_in(&mut s.value, source),
        StmtKind::Return(Some(e)) | StmtKind::Expr(e) => expect_in(e, source),
        StmtKind::Return(None) => {}
        StmtKind::Defer(b) => expect_in_block(b, source),
        StmtKind::While(w) => expect_in_block(&mut w.body, source),
        StmtKind::For(f) => expect_in_block(&mut f.body, source),
        StmtKind::Guard(g) => expect_in_block(&mut g.otherwise, source),
        StmtKind::Throw(e) => expect_in(e, source),
        StmtKind::Do(d) => {
            expect_in_block(&mut d.body, source);
            for catch in &mut d.catches {
                expect_in_block(&mut catch.body, source);
            }
        }
    }
}

/// Rewrites the `#expect(…)` calls in `e`.
fn expect_in(e: &mut Expr, source: &str) {
    if let ExprKind::Call(c) = &mut e.kind
        && matches!(&c.callee.kind, ExprKind::Name(n) if n == "#expect")
        && c.args.len() == 1
    {
        let cond = c.args.remove(0).value;
        let written = source.get(cond.span.start as usize..cond.span.end as usize).unwrap_or("").to_string();
        let span = e.span;
        *e = match cond.kind {
            ExprKind::Binary(BinaryOp::Eq, a, b) => {
                call(runtime("expectEqual", span), vec![*a, *b, text(&written, span)], span)
            }
            kind => {
                let cond = Expr { kind, ..cond };
                call(runtime("expect", span), vec![cond, text(&written, span)], span)
            }
        };
        return;
    }
    match &mut e.kind {
        ExprKind::Call(c) => {
            expect_in(&mut c.callee, source);
            for arg in &mut c.args {
                expect_in(&mut arg.value, source);
            }
            if let Some(closure) = &mut c.trailing {
                for stmt in &mut closure.body {
                    expect_in_stmt(stmt, source);
                }
            }
        }
        ExprKind::Closure(closure) => {
            for stmt in &mut closure.body {
                expect_in_stmt(stmt, source);
            }
        }
        ExprKind::Await(inner) | ExprKind::Try(inner) | ExprKind::Force(inner) | ExprKind::Paren(inner) => {
            expect_in(inner, source)
        }
        ExprKind::If(i) => {
            expect_in_block(&mut i.then, source);
            match i.otherwise.as_deref_mut() {
                Some(Else::If(e)) => expect_in(e, source),
                Some(Else::Block(b)) => expect_in_block(b, source),
                None => {}
            }
        }
        ExprKind::Task(b) => expect_in_block(b, source),
        _ => {}
    }
}
