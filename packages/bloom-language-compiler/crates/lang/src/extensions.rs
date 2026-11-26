//! `extension T { … }` and a data struct's methods (ADR 0002, section 5): lowered,
//! before checking, to free functions that the checker finds by the receiver's type.
//!
//! ```swift
//! extension String {
//!   public func padded(to width: Int) -> String { … }   // String$padded(self, width)
//!   public var isBlank: Bool { self.trimmed().isEmpty }  // String$isBlank(self)
//!   public static func repeating(_ s: String, count: Int) -> String { … }  // String$$repeating
//! }
//! ```
//!
//! An instance member `m` of `T` becomes `T$m`, whose first parameter is `self`; a static
//! one becomes `T$$m`. `x.m(…)` and `x.m` (a computed property) on a value of type `T`,
//! and `T.m(…)` / `T.m`, resolve to them (statically dispatched: nothing exists at
//! runtime but the functions). The built-in types extend under their Bloom names:
//! `String`, `Int`, `Double` (`Float` too), `Bool`, `Array` (generic over `Element`),
//! `Dictionary` (`[String: Value]`), `Set` (`Element`), `Optional` (`Wrapped`), `Error`.

use crate::ast::*;

/// The name a member `member` of type `owner` is lowered to.
pub fn mangle(owner: &str, member: &str, is_static: bool) -> String {
    format!("{owner}{}{member}", if is_static { "$$" } else { "$" })
}

/// A written type name's extension key: `Float` is `Double`.
pub fn key(name: &str) -> &str {
    match name {
        "Float" => "Double",
        other => other,
    }
}

#[allow(dead_code)]
/// The member an extension function was lowered from (`String$padded` → `("String", "padded", false)`).
pub fn demangle(name: &str) -> Option<(&str, &str, bool)> {
    if let Some((owner, member)) = name.split_once("$$") {
        return Some((owner, member, true));
    }
    let (owner, member) = name.split_once('$')?;
    Some((owner, member, false))
}

fn named(name: &str, args: Vec<TypeExpr>, span: Span) -> TypeExpr {
    TypeExpr { kind: TypeKind::Named { name: Ident { name: name.into(), span }, args }, span }
}

/// `self`'s type, and the type parameters it brings.
fn self_type(name: &Ident, written: &[Ident], local: Option<&[Ident]>) -> (TypeExpr, Vec<Ident>) {
    let span = name.span;
    let generic = |default: &str| -> Vec<Ident> {
        if written.is_empty() { vec![Ident { name: default.into(), span }] } else { written.to_vec() }
    };
    let param = |g: &Ident| named(&g.name, Vec::new(), span);
    match name.name.as_str() {
        "Array" => {
            let g = generic("Element");
            (TypeExpr { kind: TypeKind::List(Box::new(param(&g[0]))), span }, g)
        }
        "Dictionary" => {
            let g = generic("Value");
            let key = named("String", Vec::new(), span);
            (TypeExpr { kind: TypeKind::Map(Box::new(key), Box::new(param(&g[0]))), span }, g)
        }
        "Optional" => {
            let g = generic("Wrapped");
            (TypeExpr { kind: TypeKind::Optional(Box::new(param(&g[0]))), span }, g)
        }
        "Set" => {
            let g = generic("Element");
            (named("Set", vec![param(&g[0])], span), g)
        }
        _ => {
            let g = if written.is_empty() {
                local.map(<[Ident]>::to_vec).unwrap_or_default()
            } else {
                written.to_vec()
            };
            (named(&name.name, g.iter().map(param).collect(), span), g)
        }
    }
}

/// `Self` in `ty`, as the extended type.
fn replace_self(ty: &mut TypeExpr, with: &TypeExpr) {
    match &mut ty.kind {
        TypeKind::Named { name, args } => {
            if name.name == "Self" && args.is_empty() {
                *ty = with.clone();
                return;
            }
            for a in args {
                replace_self(a, with);
            }
        }
        TypeKind::List(t) | TypeKind::Optional(t) => replace_self(t, with),
        TypeKind::Map(k, v) => {
            replace_self(k, with);
            replace_self(v, with);
        }
        TypeKind::Tuple(ts) => ts.iter_mut().for_each(|t| replace_self(t, with)),
        TypeKind::Fn { params, ret, .. } => {
            params.iter_mut().for_each(|t| replace_self(t, with));
            replace_self(ret, with);
        }
        TypeKind::Record(fields) => fields.iter_mut().for_each(|(_, t)| replace_self(t, with)),
        TypeKind::Strings(_) | TypeKind::Error => {}
    }
}

struct Owner<'a> {
    key: String,
    self_ty: TypeExpr,
    generics: Vec<Ident>,
    visibility: Visibility,
    written: bool,
    span: Span,
    name: &'a Ident,
}

fn lower_member(owner: &Owner, member: &TypeMember, out: &mut Vec<Item>) {
    let is_static = member.modifiers.is_static;
    let visibility = if member.modifiers.visibility_span.is_some() || !owner.written {
        member.visibility
    } else {
        owner.visibility
    };
    let modifiers = Modifiers {
        attrs: member.modifiers.attrs.clone(),
        visibility_span: member.modifiers.visibility_span.or(owner.written.then_some(owner.span)),
        ..Modifiers::default()
    };
    let self_param = |span: Span| Param {
        label: Some(Ident { name: "_".into(), span }),
        name: Ident { name: "self".into(), span },
        rest: false,
        spread: false,
        whole: None,
        ty: owner.self_ty.clone(),
        default: None,
        span,
    };
    let kind = match &member.kind {
        // `static func ==` is a view's or a struct's comparator, read where the type is.
        TypeMemberKind::Func(f) if f.name.name == "==" => return,
        TypeMemberKind::Func(f) if f.name.name == "init" => return,
        TypeMemberKind::Func(f) => {
            let mut f = f.clone();
            f.name = Ident { name: mangle(&owner.key, &f.name.name, is_static), span: f.name.span };
            f.generics = owner.generics.iter().cloned().chain(f.generics).collect();
            if !is_static {
                f.params.insert(0, self_param(f.name.span));
            }
            for p in &mut f.params {
                replace_self(&mut p.ty, &owner.self_ty);
            }
            if let Some(ret) = &mut f.ret {
                replace_self(ret, &owner.self_ty);
            }
            ItemKind::Fn(f)
        }
        TypeMemberKind::Computed { name, ty, body } => {
            let mut ret = ty.clone();
            replace_self(&mut ret, &owner.self_ty);
            ItemKind::Fn(FnDecl {
                is_async: false,
                func: true,
                name: Ident { name: mangle(&owner.key, &name.name, is_static), span: name.span },
                generics: owner.generics.clone(),
                constraints: Vec::new(),
                params: if is_static { Vec::new() } else { vec![self_param(name.span)] },
                throws: None,
                ret: Some(ret),
                body: body.clone(),
                span: member.span,
            })
        }
        TypeMemberKind::Stored { name, ty, value: Some(value), .. } if is_static => {
            let mut ty = ty.clone();
            if let Some(t) = &mut ty {
                replace_self(t, &owner.self_ty);
            }
            ItemKind::Const(ConstDecl {
                name: Ident { name: mangle(&owner.key, &name.name, true), span: name.span },
                ty,
                value: value.clone(),
                span: member.span,
            })
        }
        TypeMemberKind::Stored { .. } | TypeMemberKind::Let(_) => return,
    };
    let _ = owner.name;
    out.push(Item { visibility, modifiers, kind, span: member.span });
}

/// Lowers `file`'s extensions, and its data structs' methods, in place.
pub fn lower(file: &mut File) {
    let lowers = |i: &Item| {
        match &i.kind {
        ItemKind::Extension(_) => true,
        ItemKind::Struct(s) => s.surface.as_ref().is_some_and(|b| {
            b.members.iter().any(|m| {
                matches!(&m.kind, TypeMemberKind::Computed { .. })
                    || matches!(&m.kind, TypeMemberKind::Func(f) if f.name.name != "==")
                    || matches!(&m.kind, TypeMemberKind::Stored { value: Some(_), .. } if m.modifiers.is_static)
            })
        }),
        _ => false,
    }
    };
    if !file.items.iter().any(lowers) {
        return;
    }
    let local_generics: Vec<(String, Vec<Ident>)> = file
        .items
        .iter()
        .filter_map(|i| match &i.kind {
            ItemKind::Struct(s) => Some((s.name.name.clone(), s.generics.clone())),
            ItemKind::Enum(e) => Some((e.name.name.clone(), e.generics.clone())),
            _ => None,
        })
        .collect();
    let mut items = Vec::new();
    for item in std::mem::take(&mut file.items) {
        match &item.kind {
            ItemKind::Extension(ext) => {
                let local =
                    local_generics.iter().find(|(n, _)| *n == ext.name.name).map(|(_, g)| g.as_slice());
                let (self_ty, generics) = self_type(&ext.name, &ext.generics, local);
                let owner = Owner {
                    key: key(&ext.name.name).to_string(),
                    self_ty,
                    generics,
                    visibility: item.visibility,
                    written: item.modifiers.visibility_span.is_some(),
                    span: item.modifiers.visibility_span.unwrap_or(ext.name.span),
                    name: &ext.name,
                };
                for member in &ext.body.members {
                    lower_member(&owner, member, &mut items);
                }
            }
            ItemKind::Struct(s) if lowers(&item) => {
                let (self_ty, generics) = self_type(&s.name, &s.generics, None);
                let owner = Owner {
                    key: s.name.name.clone(),
                    self_ty,
                    generics,
                    visibility: item.visibility,
                    written: false,
                    span: s.name.span,
                    name: &s.name,
                };
                let mut lowered = Vec::new();
                for member in &s.surface.as_ref().expect("checked").members {
                    lower_member(&owner, member, &mut lowered);
                }
                items.push(item);
                items.extend(lowered);
            }
            _ => items.push(item),
        }
    }
    file.items = items;
}
