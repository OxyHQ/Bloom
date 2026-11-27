//! Visibility within a file (2.0): a declaration other modules can see must not name a
//! type they cannot. Across files and modules, the module graph checks who uses what.

use rustc_hash::FxHashMap;

use crate::ast::*;
use crate::diagnostic::Diagnostic;

/// `public func f(_ x: Secret)` where `Secret` is `private` or `internal`: an error each.
/// Only 2.0's `public` is held to it: a 0.x `pub` declaration may name a file's own types,
/// which its `.d.bloom.ts` declares beside it.
pub fn check(file: &File, source: &str) -> Vec<Diagnostic> {
    let levels: FxHashMap<&str, (Visibility, Span)> = file
        .items
        .iter()
        // An extension names the type it extends; it declares none.
        .filter(|item| !matches!(item.kind, ItemKind::Extension(_)))
        .map(|item| (item.kind.name().name.as_str(), (item.visibility, item.kind.name().span)))
        .collect();
    let mut out = Vec::new();
    for item in &file.items {
        let written = item.modifiers.visibility_span.map(|s| &source[s.start as usize..s.end as usize]);
        if written != Some("public") {
            continue;
        }
        let mut types: Vec<&TypeExpr> = Vec::new();
        match &item.kind {
            ItemKind::Fn(f) => {
                types.extend(f.params.iter().map(|p| &p.ty));
                types.extend(f.ret.iter());
            }
            ItemKind::Struct(s) => types.extend(s.fields.iter().map(|f| &f.ty)),
            ItemKind::Enum(e) => {
                types.extend(e.variants.iter().flat_map(|v| v.payload.iter().map(|p| &p.ty)))
            }
            ItemKind::Alias(a) => types.push(&a.ty),
            ItemKind::Const(c) => types.extend(c.ty.iter()),
            ItemKind::View(v) => types.extend(v.params.iter().flatten().map(|p| &p.ty)),
            // Lowered before checking (`crate::extensions::lower`).
            ItemKind::Extension(_) | ItemKind::Extern(_) | ItemKind::Test(_) => {}
            ItemKind::Class(c) => types.extend(c.body.members.iter().filter_map(|m| match &m.kind {
                TypeMemberKind::Stored { ty, .. } if m.visibility != Visibility::Private => ty.as_ref(),
                _ => None,
            })),
            ItemKind::Protocol(p) => types.extend(p.requirements.iter().flat_map(|r| match r {
                Requirement::Property { ty, .. } => vec![ty],
                Requirement::Func { decl, .. } => {
                    decl.params.iter().map(|p| &p.ty).chain(decl.ret.iter()).collect()
                }
            })),
        }
        let mut seen: Vec<&str> = Vec::new();
        for ty in types {
            names(ty, &mut |name| {
                if let Some(&(level, declared)) = levels.get(name.name.as_str())
                    && !matches!(level, Visibility::Public | Visibility::PubDefault)
                    && !seen.contains(&name.name.as_str())
                {
                    seen.push(&name.name);
                    let word = if level == Visibility::Private { "private" } else { "internal" };
                    out.push(
                        Diagnostic::error(
                            "B0108",
                            name.span,
                            format!("a public declaration names the {word} type `{}`", name.name),
                        )
                        .label(format!("`{}` is {word}", name.name))
                        .with_label(declared, "declared here")
                        .help(format!("make `{}` public, or this declaration {word}", name.name))
                        .spec("10-modules-and-interop"),
                    );
                }
            });
        }
    }
    out
}

/// The names of `file`'s internal and private types that its `public` declarations name.
pub fn exposed(file: &File, source: &str) -> Vec<String> {
    let mut out: Vec<String> = Vec::new();
    for diagnostic in check(file, source) {
        if let Some(name) = diagnostic.message.split('`').nth(1)
            && !out.iter().any(|n| n == name)
        {
            out.push(name.to_string());
        }
    }
    out
}

fn names<'a>(ty: &'a TypeExpr, f: &mut impl FnMut(&'a Ident)) {
    match &ty.kind {
        TypeKind::Named { name, args } => {
            f(name);
            args.iter().for_each(|arg| names(arg, f));
        }
        TypeKind::List(inner) | TypeKind::Optional(inner) => names(inner, f),
        TypeKind::Map(k, v) => {
            names(k, f);
            names(v, f);
        }
        TypeKind::Tuple(items) => items.iter().for_each(|item| names(item, f)),
        TypeKind::Fn { params, ret, .. } => {
            params.iter().for_each(|p| names(p, f));
            names(ret, f);
        }
        TypeKind::Record(fields) => fields.iter().for_each(|(_, ty)| names(ty, f)),
        TypeKind::Strings(_) | TypeKind::Error => {}
    }
}
