//! `@Model`, derived at compile time beside `Codable` (ADR 0002, section 3: BloomData).
//!
//! ```swift
//! @Model public struct Post: Codable {
//!   @Attribute(.unique) public let id: String
//!   public var likes: Int
//! }
//! ```
//!
//! gets, beside it:
//!
//! ```swift
//! public static let store: ModelStore<Post> = modelStore("Post", key: \Post.id)   // Post$$store
//! ```
//!
//! the data layer's records of the type (`stdlib/Bloom/Data.bloom`), keyed by the field
//! marked `@Attribute(.unique)`, else by `id`. A view reads them with `@Query(Post.self)`
//! (lowered with the view's members, in the parser).

use std::collections::BTreeSet;

use crate::ast::*;
use crate::codable::Gen;
use crate::diagnostic::Diagnostic;

/// `@Attribute(.unique)` on a stored property.
fn is_unique(attrs: &[Attr]) -> bool {
    attrs.iter().any(|a| {
        a.name.name == "Attribute"
            && a.args
                .iter()
                .any(|arg| matches!(&arg.value.kind, ExprKind::ImplicitMember(m) if m.name == "unique"))
    })
}

fn is_string(ty: &TypeExpr) -> bool {
    matches!(&ty.kind, TypeKind::Named { name, args } if name.name == "String" && args.is_empty())
}

fn error(span: Span, ty: &str, what: &str, label: &str) -> Diagnostic {
    Diagnostic::error("B0831", span, format!("`@Model struct {ty}` {what}"))
        .label(label)
        .help(
            "mark one `String` property `@Attribute(.unique)` (or name it `id`): its records are kept by it",
        )
        .spec("44-structs")
}

/// What `item` derives for `@Model` (nothing unless it is a `@Model` struct).
pub fn derive(item: &Item, names: &mut BTreeSet<String>, diagnostics: &mut Vec<Diagnostic>) -> Vec<Item> {
    let ItemKind::Struct(s) = &item.kind else { return Vec::new() };
    let Some(attr) = item.modifiers.attrs.iter().find(|a| a.name.name == "Model") else {
        return Vec::new();
    };
    let ty = &s.name.name;
    if !s.generics.is_empty() {
        diagnostics.push(error(s.name.span, ty, "is generic", "a model's records are of one type"));
        return Vec::new();
    }
    let Some(surface) = &s.surface else { return Vec::new() };
    let unique: Vec<&TypeMember> = surface
        .members
        .iter()
        .filter(|m| matches!(m.kind, TypeMemberKind::Stored { .. }) && is_unique(&m.modifiers.attrs))
        .collect();
    if unique.len() > 1 {
        diagnostics.push(error(unique[1].span, ty, "has two unique keys", "a second `@Attribute(.unique)`"));
        return Vec::new();
    }
    let key = match unique.first().map(|m| &m.kind) {
        Some(TypeMemberKind::Stored { name, .. }) => name.name.clone(),
        _ => "id".to_string(),
    };
    let Some(field) = s.fields.iter().find(|f| f.name.name == key) else {
        diagnostics.push(error(attr.span, ty, "has no key", "no `@Attribute(.unique)` property and no `id`"));
        return Vec::new();
    };
    if !is_string(&field.ty) {
        diagnostics.push(error(field.ty.span, ty, "has a key that is not a `String`", "not a `String`"));
        return Vec::new();
    }
    let mut g = Gen { span: s.name.span, names: BTreeSet::new() };
    let self_ty = g.named_type(ty, Vec::new());
    let store_ty = g.named_type("ModelStore", vec![self_ty]);
    let path = g.expr(ExprKind::KeyPath { root: Some(g.ident(ty)), path: vec![g.ident(&key)] });
    let ctor = g.name("modelStore");
    let name = g.str(ty);
    let value = g.call(ctor, vec![(None, name), (Some("key"), path)]);
    let span = g.fresh();
    names.extend(g.names);
    vec![Item {
        visibility: item.visibility,
        modifiers: Modifiers::default(),
        kind: ItemKind::Const(ConstDecl {
            name: Ident { name: crate::extensions::mangle(ty, "store", true), span },
            ty: Some(store_ty),
            value,
            span,
        }),
        span,
    }]
}

/// What `@Query` members lowered onto (in the parser), to import as written names are:
/// the source never spells them.
pub fn query_names(file: &File) -> BTreeSet<String> {
    let mut names = BTreeSet::new();
    for item in &file.items {
        let ItemKind::View(view) = &item.kind else { continue };
        for member in &view.members {
            if let Member::Let(l) = member
                && let ExprKind::Call(call) = &l.value.kind
                && let ExprKind::Name(name) = &call.callee.kind
                && matches!(name.as_str(), "useQuery" | "useRecordQuery" | "useSource")
            {
                names.insert(name.clone());
            }
        }
    }
    names
}
