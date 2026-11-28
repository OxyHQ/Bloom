//! `Codable`, derived at compile time (ADR 0002, section 3): no reflection.
//!
//! A struct that conforms to `Codable` (or `Decodable`, `Encodable`) gets, beside it:
//!
//! ```swift
//! public static func decode(_ value: JSONValue, _ at: String) throws -> Post  // Post$$decode
//! public static func encode(_ value: Post) -> JSONValue                        // Post$$encode
//! public static let self: Codec<Post>                                          // Post$$self
//! ```
//!
//! Each field decodes through its type's own `T.decode` (the standard library's for
//! `String`, `Int`, `Double`, `Bool`, `Date`, `URL`; the derived one for another
//! `Codable` type), and `[T]`, `T?`, `[String: T]` through `Array`, `Optional` and
//! `Dictionary`'s, given the element's. A field's JSON key is its name, or
//! `@CodingKey("created_at")`'s; a field with a default takes it when the key is absent.
//! A case-only enum decodes from, and encodes to, its case name.

use std::collections::BTreeSet;
use std::sync::atomic::{AtomicU32, Ordering};

use crate::ast::*;
use crate::diagnostic::Diagnostic;

/// Fresh expression ids for what the derivation writes: far above any parser's.
static NEXT_ID: AtomicU32 = AtomicU32::new(3_500_000_000);

/// Derived code's spans start here: each one is distinct (the checker keys types and
/// functions by span), and stands for the type it was derived from ([`anchor`]).
const SYNTHETIC: u32 = 0xF000_0000;

thread_local! {
    static ANCHORS: std::cell::RefCell<Vec<Span>> = const { std::cell::RefCell::new(Vec::new()) };
}

/// `span` is derived code's.
pub fn is_synthetic(span: Span) -> bool {
    span.start >= SYNTHETIC
}

/// Forgets the previous compile's spans.
pub fn reset() {
    ANCHORS.with(|a| a.borrow_mut().clear());
}

/// A fresh span that stands for `anchor` (for a derived span, the written one it stands for:
/// code derived from derived code, such as a glyph import `bloomui` adds, still points at
/// the source).
pub fn synthetic(anchor: Span) -> Span {
    ANCHORS.with(|a| {
        let mut a = a.borrow_mut();
        let anchor = if anchor.start >= SYNTHETIC {
            a.get((anchor.start - SYNTHETIC) as usize).copied().unwrap_or(Span::new(0, 0))
        } else {
            anchor
        };
        a.push(anchor);
        let at = SYNTHETIC + a.len() as u32 - 1;
        Span::new(at, at)
    })
}

/// A diagnostic in derived code, moved to the type it was derived from.
pub fn anchor(diagnostic: &mut Diagnostic) {
    let original = |span: Span| {
        if span.start < SYNTHETIC {
            return span;
        }
        let anchored = ANCHORS
            .with(|a| a.borrow().get((span.start - SYNTHETIC) as usize).copied().unwrap_or(Span::new(0, 0)));
        // Every anchor is a written span ([`synthetic`]); one that is not is no place.
        if anchored.start >= SYNTHETIC { Span::new(0, 0) } else { anchored }
    };
    diagnostic.span = original(diagnostic.span);
    for label in &mut diagnostic.labels {
        label.span = original(label.span);
    }
}

pub(crate) struct Gen {
    /// The type's name: what derived code's spans stand for.
    pub(crate) span: Span,
    /// Every name the derived code refers to (imported from the standard library or the
    /// module that declares it, as written names are).
    pub(crate) names: BTreeSet<String>,
}

impl Gen {
    pub(crate) fn fresh(&self) -> Span {
        synthetic(self.span)
    }

    pub(crate) fn expr(&self, kind: ExprKind) -> Expr {
        Expr { id: ExprId(NEXT_ID.fetch_add(1, Ordering::Relaxed)), kind, span: self.fresh() }
    }

    pub(crate) fn ident(&self, name: &str) -> Ident {
        Ident { name: name.to_string(), span: self.fresh() }
    }

    pub(crate) fn name(&mut self, name: &str) -> Expr {
        self.names.insert(name.to_string());
        self.expr(ExprKind::Name(name.to_string()))
    }

    pub(crate) fn local(&self, name: &str) -> Expr {
        self.expr(ExprKind::Name(name.to_string()))
    }

    pub(crate) fn str(&self, text: &str) -> Expr {
        self.expr(ExprKind::Str { parts: vec![StrPart::Text(text.to_string())], raw: false })
    }

    pub(crate) fn call(&mut self, callee: Expr, args: Vec<(Option<&str>, Expr)>) -> Expr {
        let args = args
            .into_iter()
            .map(|(label, value)| Arg {
                label: label.map(|l| self.ident(l)),
                spread: false,
                value,
                span: self.fresh(),
            })
            .collect();
        self.expr(ExprKind::Call(Call {
            callee: Box::new(callee),
            args,
            parens: true,
            trailing: None,
            optional: false,
        }))
    }

    pub(crate) fn named_type(&mut self, name: &str, args: Vec<TypeExpr>) -> TypeExpr {
        self.names.insert(name.to_string());
        TypeExpr { kind: TypeKind::Named { name: self.ident(name), args }, span: self.fresh() }
    }

    fn param(&mut self, name: &str, ty: TypeExpr) -> Param {
        Param {
            label: Some(self.ident("_")),
            name: self.ident(name),
            rest: false,
            spread: false,
            whole: None,
            ty,
            default: None,
            span: self.fresh(),
        }
    }

    /// The `T.decode` / `T.encode` of a named type (`Float` is `Double`).
    fn member(&mut self, ty: &str, member: &str) -> Expr {
        let name = crate::extensions::mangle(crate::extensions::key(ty), member, true);
        self.name(&name)
    }

    /// The function that decodes a `ty` (`(JSONValue, String) throws -> T`).
    fn decoder(&mut self, ty: &TypeExpr) -> Result<Expr, String> {
        Ok(match &ty.kind {
            TypeKind::Named { name, args } if args.is_empty() => self.member(&name.name, "decode"),
            TypeKind::List(e) => {
                let inner = self.decoder(e)?;
                let f = self.member("Array", "decoder");
                self.call(f, vec![(None, inner)])
            }
            TypeKind::Optional(e) => {
                let inner = self.decoder(e)?;
                let f = self.member("Optional", "decoder");
                self.call(f, vec![(None, inner)])
            }
            TypeKind::Map(k, v) if is_string(k) => {
                let inner = self.decoder(v)?;
                let f = self.member("Dictionary", "decoder");
                self.call(f, vec![(None, inner)])
            }
            _ => return Err(written(ty)),
        })
    }

    /// `value` (a `JSONValue`) decoded as a `ty`, `at` naming it for errors.
    fn decode(&mut self, ty: &TypeExpr, value: Expr, at: &str) -> Result<Expr, String> {
        let at = self.str(at);
        let call = match &ty.kind {
            TypeKind::Named { name, args } if args.is_empty() => {
                let f = self.member(&name.name, "decode");
                self.call(f, vec![(None, value), (None, at)])
            }
            TypeKind::List(e) | TypeKind::Optional(e) => {
                let owner = if matches!(ty.kind, TypeKind::List(_)) { "Array" } else { "Optional" };
                let inner = self.decoder(e)?;
                let f = self.member(owner, "decode");
                self.call(f, vec![(None, value), (None, at), (None, inner)])
            }
            TypeKind::Map(k, v) if is_string(k) => {
                let inner = self.decoder(v)?;
                let f = self.member("Dictionary", "decode");
                self.call(f, vec![(None, value), (None, at), (None, inner)])
            }
            _ => return Err(written(ty)),
        };
        Ok(self.expr(ExprKind::Throwing(TryKind::Plain, Box::new(call))))
    }

    /// The function that encodes a `ty` (`(T) -> JSONValue`).
    fn encoder(&mut self, ty: &TypeExpr) -> Result<Expr, String> {
        Ok(match &ty.kind {
            TypeKind::Named { name, args } if args.is_empty() => self.member(&name.name, "encode"),
            TypeKind::List(e) | TypeKind::Optional(e) => {
                let owner = if matches!(ty.kind, TypeKind::List(_)) { "Array" } else { "Optional" };
                let inner = self.encoder(e)?;
                let f = self.member(owner, "encoder");
                self.call(f, vec![(None, inner)])
            }
            TypeKind::Map(k, v) if is_string(k) => {
                let inner = self.encoder(v)?;
                let f = self.member("Dictionary", "encoder");
                self.call(f, vec![(None, inner)])
            }
            _ => return Err(written(ty)),
        })
    }

    /// `value` (a `ty`) as a `JSONValue`.
    fn encode(&mut self, ty: &TypeExpr, value: Expr) -> Result<Expr, String> {
        Ok(match &ty.kind {
            TypeKind::Named { name, args } if args.is_empty() => {
                let f = self.member(&name.name, "encode");
                self.call(f, vec![(None, value)])
            }
            TypeKind::List(e) | TypeKind::Optional(e) => {
                let owner = if matches!(ty.kind, TypeKind::List(_)) { "Array" } else { "Optional" };
                let inner = self.encoder(e)?;
                let f = self.member(owner, "encode");
                self.call(f, vec![(None, value), (None, inner)])
            }
            TypeKind::Map(k, v) if is_string(k) => {
                let inner = self.encoder(v)?;
                let f = self.member("Dictionary", "encode");
                self.call(f, vec![(None, value), (None, inner)])
            }
            _ => return Err(written(ty)),
        })
    }

    fn body(&self, value: Expr) -> Block {
        Block { stmts: vec![Stmt { kind: StmtKind::Expr(value), span: self.fresh() }], span: self.fresh() }
    }

    fn func(
        &mut self,
        name: String,
        params: Vec<Param>,
        throws: bool,
        ret: TypeExpr,
        value: Expr,
        visibility: Visibility,
    ) -> Item {
        let span = self.fresh();
        Item {
            visibility,
            modifiers: Modifiers::default(),
            kind: ItemKind::Fn(FnDecl {
                is_async: false,
                func: true,
                name: Ident { name, span },
                generics: Vec::new(),
                constraints: Vec::new(),
                params,
                throws: throws.then_some(Throws { span, ty: None }),
                ret: Some(ret),
                body: self.body(value),
                span,
            }),
            span,
        }
    }
}

fn is_string(ty: &TypeExpr) -> bool {
    matches!(&ty.kind, TypeKind::Named { name, args } if name.name == "String" && args.is_empty())
}

/// A type as an error message writes it.
fn written(ty: &TypeExpr) -> String {
    match &ty.kind {
        TypeKind::Named { name, args } if args.is_empty() => name.name.clone(),
        TypeKind::Named { name, .. } => format!("{}<…>", name.name),
        TypeKind::List(e) => format!("[{}]", written(e)),
        TypeKind::Optional(e) => format!("{}?", written(e)),
        TypeKind::Map(k, v) => format!("[{}: {}]", written(k), written(v)),
        TypeKind::Tuple(_) => "a tuple".into(),
        TypeKind::Fn { .. } => "a function".into(),
        TypeKind::Record(_) => "a record".into(),
        TypeKind::Strings(_) => "a string union".into(),
        TypeKind::Composition(_) => "a protocol composition".into(),
        TypeKind::Error => "?".into(),
    }
}

/// Which of decode and encode `conformances` ask for.
fn derives(conformances: &[TypeExpr]) -> (bool, bool) {
    let mut out = (false, false);
    for c in conformances {
        if let TypeKind::Named { name, .. } = &c.kind {
            match name.name.as_str() {
                "Codable" => out = (true, true),
                "Decodable" => out.0 = true,
                "Encodable" => out.1 = true,
                _ => {}
            }
        }
    }
    out
}

/// `@CodingKey("created_at")` on a member: its JSON key.
fn coding_key(attrs: &[Attr]) -> Option<String> {
    let attr = attrs.iter().find(|a| a.name.name == "CodingKey")?;
    match &attr.args.first()?.value.kind {
        ExprKind::Str { parts, .. } => match parts.as_slice() {
            [StrPart::Text(text)] => Some(text.clone()),
            _ => None,
        },
        _ => None,
    }
}

fn unsupported(span: Span, ty_name: &str, what: String) -> Diagnostic {
    Diagnostic::error("B0830", span, format!("`{ty_name}` cannot derive `Codable`: {what}"))
        .label("no decoder for this")
        .help("give it a `Codable` type, or write `static func decode` and `encode` in an `extension`")
        .spec("44-structs")
}

/// Derives `Codable` for `file`'s types that conform to it, in place. Returns the
/// names the derived code uses (to import as written names are).
pub fn lower(file: &mut File, diagnostics: &mut Vec<Diagnostic>) -> BTreeSet<String> {
    let mut names = BTreeSet::new();
    let mut out = Vec::new();
    for item in std::mem::take(&mut file.items) {
        let mut derived = derive(&item, &mut names, diagnostics);
        derived.extend(crate::model::derive(&item, &mut names, diagnostics));
        // Beside the type: `T.self` is a constant, read after it is declared.
        out.push(item);
        out.extend(derived);
    }
    file.items = out;
    names
}

/// What `item` derives (nothing unless it is a `Codable` struct or enum).
fn derive(item: &Item, names: &mut BTreeSet<String>, diagnostics: &mut Vec<Diagnostic>) -> Vec<Item> {
    match &item.kind {
        ItemKind::Struct(s) => {
            let Some(surface) = &s.surface else { return Vec::new() };
            let (dec, enc) = derives(&surface.conformances);
            if !dec && !enc {
                return Vec::new();
            }
            if !s.generics.is_empty() {
                diagnostics.push(unsupported(s.name.span, &s.name.name, "it is generic".into()));
                return Vec::new();
            }
            let mut g = Gen { span: s.name.span, names: BTreeSet::new() };
            match derive_struct(&mut g, s, surface, item.visibility, dec, enc) {
                Ok(items) => {
                    names.extend(g.names);
                    items
                }
                Err(what) => {
                    diagnostics.push(unsupported(
                        s.name.span,
                        &s.name.name,
                        format!("no decoder for {what}"),
                    ));
                    Vec::new()
                }
            }
        }
        ItemKind::Enum(e) => {
            let (dec, enc) = derives(&e.conformances);
            if !dec && !enc {
                return Vec::new();
            }
            if e.variants.iter().any(|v| !v.payload.is_empty()) || !e.generics.is_empty() {
                diagnostics.push(unsupported(
                    e.name.span,
                    &e.name.name,
                    "only an enum of plain cases decodes (from its case name)".into(),
                ));
                return Vec::new();
            }
            let mut g = Gen { span: e.name.span, names: BTreeSet::new() };
            let items = derive_enum(&mut g, e, item.visibility, dec, enc);
            names.extend(g.names);
            items
        }
        _ => Vec::new(),
    }
}

fn derive_struct(
    g: &mut Gen,
    s: &StructDecl,
    surface: &TypeBody,
    visibility: Visibility,
    dec: bool,
    enc: bool,
) -> Result<Vec<Item>, String> {
    let ty = s.name.name.clone();
    let self_ty = g.named_type(&ty, Vec::new());
    let json = g.named_type("JSONValue", Vec::new());
    let string = g.named_type("String", Vec::new());
    let key_of = |field: &Field| {
        surface
            .members
            .iter()
            .find(|m| matches!(&m.kind, TypeMemberKind::Stored { name, .. } if name.name == field.name.name))
            .and_then(|m| coding_key(&m.modifiers.attrs))
            .unwrap_or_else(|| field.name.name.clone())
    };
    let mut items = Vec::new();
    if dec {
        let mut args = Vec::new();
        for field in &s.fields {
            let key = key_of(field);
            let at = format!("{ty}.{}", field.name.name);
            let value = {
                let f = g.name("jsonField");
                let (v, k, a) = (g.local("value"), g.str(&key), g.local("at"));
                let call = g.call(f, vec![(None, v), (None, k), (None, a)]);
                g.expr(ExprKind::Throwing(TryKind::Plain, Box::new(call)))
            };
            let decoded = match &field.default {
                // Absent: the default.
                Some(default) if !matches!(field.ty.kind, TypeKind::Optional(_)) => {
                    let optional =
                        TypeExpr { kind: TypeKind::Optional(Box::new(field.ty.clone())), span: g.fresh() };
                    let decoded = g.decode(&optional, value, &at)?;
                    g.expr(ExprKind::Binary(BinaryOp::Default, Box::new(decoded), Box::new(default.clone())))
                }
                _ => g.decode(&field.ty, value, &at)?,
            };
            args.push((field.name.name.clone(), decoded));
        }
        let ctor = g.name(&ty);
        let args = args.iter().map(|(n, e)| (Some(n.as_str()), e.clone())).collect();
        let value = g.call(ctor, args);
        let params = vec![g.param("value", json.clone()), g.param("at", string.clone())];
        let name = crate::extensions::mangle(&ty, "decode", true);
        items.push(g.func(name, params, true, self_ty.clone(), value, visibility));
    }
    if enc {
        let mut entries = Vec::new();
        for field in &s.fields {
            let key = g.str(&key_of(field));
            let read = {
                let base = g.local("value");
                g.expr(ExprKind::Field(Box::new(base), g.ident(&field.name.name)))
            };
            entries.push((key, g.encode(&field.ty, read)?));
        }
        let map = g.expr(ExprKind::Map(entries));
        let f = g.name("jsonObject");
        let value = g.call(f, vec![(None, map)]);
        let params = vec![g.param("value", self_ty.clone())];
        let name = crate::extensions::mangle(&ty, "encode", true);
        items.push(g.func(name, params, false, json.clone(), value, visibility));
    }
    if dec && enc {
        items.push(codec(g, &ty, visibility));
    }
    Ok(items)
}

fn derive_enum(g: &mut Gen, e: &EnumDecl, visibility: Visibility, dec: bool, enc: bool) -> Vec<Item> {
    let ty = e.name.name.clone();
    let self_ty = g.named_type(&ty, Vec::new());
    let json = g.named_type("JSONValue", Vec::new());
    let string = g.named_type("String", Vec::new());
    let mut items = Vec::new();
    if dec {
        let cases: Vec<Expr> = e
            .variants
            .iter()
            .map(|v| {
                let base = g.name(&ty);
                g.expr(ExprKind::Field(Box::new(base), g.ident(&v.name.name)))
            })
            .collect();
        let names: Vec<String> = e.variants.iter().map(|v| format!("\"{}\"", v.name.name)).collect();
        let expected = g.str(&format!("one of {}", names.join(", ")));
        let list = g.expr(ExprKind::List(cases));
        let f = g.name("decodeCase");
        let (v, a) = (g.local("value"), g.local("at"));
        let call = g.call(f, vec![(None, v), (None, a), (None, list), (None, expected)]);
        let value = g.expr(ExprKind::Throwing(TryKind::Plain, Box::new(call)));
        let params = vec![g.param("value", json.clone()), g.param("at", string.clone())];
        items.push(g.func(
            crate::extensions::mangle(&ty, "decode", true),
            params,
            true,
            self_ty.clone(),
            value,
            visibility,
        ));
    }
    if enc {
        let f = g.name("encodeCase");
        let v = g.local("value");
        let value = g.call(f, vec![(None, v)]);
        let params = vec![g.param("value", self_ty.clone())];
        items.push(g.func(
            crate::extensions::mangle(&ty, "encode", true),
            params,
            false,
            json,
            value,
            visibility,
        ));
    }
    if dec && enc {
        items.push(codec(g, &ty, visibility));
    }
    items
}

/// `static let self: Codec<T> = Codec(decode: T.decode, encode: T.encode)`: what `T.self` is.
fn codec(g: &mut Gen, ty: &str, visibility: Visibility) -> Item {
    let self_ty = g.named_type(ty, Vec::new());
    let codec_ty = g.named_type("Codec", vec![self_ty]);
    let decode = g.name(&crate::extensions::mangle(ty, "decode", true));
    let encode = g.name(&crate::extensions::mangle(ty, "encode", true));
    let ctor = g.name("Codec");
    let value = g.call(ctor, vec![(Some("decode"), decode), (Some("encode"), encode)]);
    let span = g.fresh();
    Item {
        visibility,
        modifiers: Modifiers::default(),
        kind: ItemKind::Const(ConstDecl {
            mutable: false,
            name: Ident { name: crate::extensions::mangle(ty, "self", true), span },
            ty: Some(codec_ty),
            value,
            span,
        }),
        span,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn a_span_derived_from_a_derived_one_anchors_at_the_source() {
        reset();
        let written = Span::new(4, 9);
        let derived = synthetic(synthetic(written));
        let mut diagnostic = Diagnostic::error("B0217", derived, "twice");
        anchor(&mut diagnostic);
        assert_eq!(diagnostic.span, written);
        // A span past the source is shown at its start, never a panic.
        let mut lost = Diagnostic::error("B0217", Span::new(SYNTHETIC + 99, SYNTHETIC + 99), "twice");
        lost.render("let a = 1\n", "a.bloom");
        assert!(lost.rendered.contains("a.bloom:1:1"), "{}", lost.rendered);
    }
}
