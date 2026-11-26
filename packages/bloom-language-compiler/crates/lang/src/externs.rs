//! `extern module "pkg" { … }`: a binding module's view of a JS package
//! (ADR 0002, section 4), lowered to what the checker and emitter know.
//!
//! ```swift
//! extern module "@sentry/react-native" {
//!   public struct Options { public var dsn: String }
//!   @extern("init") public func initialize(_ options: Options)
//!   @extern("captureException") public func capture(_ error: Error) -> String
//!   public let SDK_VERSION: String
//! }
//! ```
//!
//! becomes an import of the package as a namespace (whose names are `Foreign`)
//! and ordinary items: a function's body calls the package's function with its
//! parameters, and a constant is the package's value. Each crossing is the
//! declared Bloom type, which the emitted TS states (`satisfies`), so
//! `bloom check --tsc` checks the binding against the package's own declarations. Types (`struct`, `enum`,
//! `type`) stay as they are: the package's values are checked against them.

use std::sync::atomic::{AtomicU32, Ordering};

use crate::ast::*;
use crate::diagnostic::Diagnostic;

/// Fresh expression ids for what the lowering writes: far above any parser's.
static NEXT_ID: AtomicU32 = AtomicU32::new(3_000_000_000);

fn id() -> ExprId {
    ExprId(NEXT_ID.fetch_add(1, Ordering::Relaxed))
}

/// The namespace the `index`th extern module's package is imported as.
pub fn namespace(index: usize) -> String {
    format!("__extern{index}")
}

fn expr(kind: ExprKind, span: Span) -> Expr {
    Expr { id: id(), kind, span }
}

/// The package's name for `item`: `@extern("init")`, else the item's own.
fn extern_name(item: &Item) -> String {
    for attr in &item.modifiers.attrs {
        if attr.name.name == "extern"
            && let Some(arg) = attr.args.first()
            && let ExprKind::Str { parts, .. } = &arg.value.kind
            && let [StrPart::Text(text)] = parts.as_slice()
        {
            return text.clone();
        }
    }
    item.kind.name().name.clone()
}

/// Lowers every `extern module` of `file` in place.
pub fn lower(file: &mut File) -> Vec<Diagnostic> {
    if !file.items.iter().any(|i| matches!(i.kind, ItemKind::Extern(_))) {
        return Vec::new();
    }
    let mut diagnostics = Vec::new();
    let mut items = Vec::new();
    let mut modules_seen = 0;
    for item in std::mem::take(&mut file.items) {
        let ItemKind::Extern(module) = item.kind else {
            items.push(item);
            continue;
        };
        // The package is imported whole: its names are `Foreign`, so each crossing is
        // the declared Bloom type, which the emitted TS checks (`satisfies`).
        let ns = namespace(modules_seen);
        modules_seen += 1;
        let member = |name: &str, span: Span| {
            let base = expr(ExprKind::Name(ns.clone()), span);
            expr(ExprKind::Field(Box::new(base), Ident { name: name.to_string(), span }), span)
        };
        let mut used = false;
        for mut inner in module.items {
            let span = inner.span;
            let name = extern_name(&inner);
            match &mut inner.kind {
                ItemKind::Fn(f) => {
                    if !f.body.stmts.is_empty() {
                        diagnostics.push(
                            Diagnostic::error("B0820", f.name.span, "an extern function has no body")
                                .label("the package implements it")
                                .help("remove the body, or move the function out of `extern module` and call the binding from it")
                                .spec("binding-modules"),
                        );
                        continue;
                    }
                    let args = f
                        .params
                        .iter()
                        .map(|p| Arg {
                            label: None,
                            spread: false,
                            value: expr(ExprKind::Name(p.name.name.clone()), p.name.span),
                            span: p.name.span,
                        })
                        .collect();
                    let callee = member(&name, f.name.span);
                    let mut call = expr(
                        ExprKind::Call(Call {
                            callee: Box::new(callee),
                            args,
                            parens: true,
                            trailing: None,
                            optional: false,
                        }),
                        f.name.span,
                    );
                    if f.is_async {
                        call = expr(ExprKind::Await(Box::new(call)), f.name.span);
                        // `try await`: a rejected promise is the function's error.
                        if f.throws.is_some() {
                            call = expr(ExprKind::Try(Box::new(call)), f.name.span);
                        } else {
                            diagnostics.push(
                                Diagnostic::error("B0821", f.name.span, "an async extern function throws")
                                    .label("a JS promise can reject")
                                    .help("declare it `async throws`")
                                    .spec("binding-modules"),
                            );
                        }
                    }
                    f.body = Block {
                        stmts: vec![Stmt { kind: StmtKind::Expr(call), span: f.body.span }],
                        span: f.body.span,
                    };
                    used = true;
                }
                ItemKind::Const(c) => {
                    if matches!(&c.value.kind, ExprKind::Name(n) if *n == c.name.name) {
                        if c.ty.is_none() {
                            diagnostics.push(
                                Diagnostic::error("B0820", c.name.span, "an extern constant has a type")
                                    .label("the Bloom type the package's value is")
                                    .help(format!("write `public let {}: Type`", c.name.name))
                                    .spec("binding-modules"),
                            );
                        }
                        c.value = member(&name, c.name.span);
                        used = true;
                    }
                }
                ItemKind::Struct(_) | ItemKind::Enum(_) | ItemKind::Alias(_) | ItemKind::Protocol(_) => {}
                ItemKind::View(_) | ItemKind::Extern(_) | ItemKind::Extension(_) | ItemKind::Class(_) => {
                    diagnostics.push(
                        Diagnostic::error(
                            "B0820",
                            span,
                            "an extern module declares functions, constants and types",
                        )
                        .label("not here")
                        .help(
                            "write views in the binding module, outside `extern module`, over its functions",
                        )
                        .spec("binding-modules"),
                    );
                    continue;
                }
            }
            items.push(inner);
        }
        if used {
            file.imports.push(Import {
                kind: ImportKind::Namespace(Ident { name: ns, span: module.package.span }),
                source: module.package.name.clone(),
                source_span: module.package.span,
                span: module.package.span,
            });
        }
    }
    file.items = items;
    diagnostics
}
