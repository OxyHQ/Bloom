//! Bloom's types (spec section 4) and the definitions they name.

use std::fmt::{self, Write};
use std::rc::Rc;

use crate::ast::ExprId;

pub type DefId = usize;

#[derive(Debug, Clone, PartialEq)]
pub enum Ty {
    Int,
    Float,
    Bool,
    Str,
    Unit,
    /// What does not return (`return`, a panic): fits anywhere.
    Never,
    /// JavaScript's `Error`, the error of a rejected TS promise.
    JsError,
    List(Box<Ty>),
    /// `[String: V]`.
    Map(Box<Ty>),
    /// `Map<K, V>`: a JS `Map`, keyed by any value.
    JsMap(Box<Ty>, Box<Ty>),
    /// `Set<T>`: a JS `Set`.
    Set(Box<Ty>),
    Tuple(Vec<Ty>),
    Option(Box<Ty>),
    Result(Box<Ty>, Box<Ty>),
    /// A struct, enum or class, with its type arguments.
    Adt(DefId, Vec<Ty>),
    /// `any P` (2.0): a value of a type conforming to the protocol `P`, with its witness.
    Any(DefId),
    /// `Partial<S>`: the struct with every field optional.
    Partial(Box<Ty>),
    Fn(Rc<FnTy>),
    /// Calling a Bloom `async fn`: awaiting it gives the result.
    Async(Box<Ty>),
    /// A TS promise: awaiting it gives `Result<T, Error>`.
    Promise(Box<Ty>),
    /// A UI value; the node kind when known.
    View(Option<&'static str>),
    Binding(Box<Ty>),
    /// `KeyPath<S, V>`: a field of the struct `S` whose type is `V` (at runtime, its name).
    KeyPath(Box<Ty>, Box<Ty>),
    /// A closed set of strings: a token set of the spec, or a TS literal union.
    Strings(Rc<StrSet>),
    /// A TS value Bloom could not type: its TS type's text.
    Foreign(Rc<str>),
    /// A type parameter of the definition being checked.
    Param(u32, Rc<str>),
    /// An inference variable.
    Var(u32),
    /// After an error: fits anything, reports nothing more.
    Unknown,
}

#[derive(Debug, Clone, PartialEq)]
pub struct FnTy {
    pub params: Vec<ParamTy>,
    pub ret: Ty,
    pub is_async: bool,
    /// How many type parameters it is generic over (`Ty::Param(0..n)`).
    pub generics: u32,
    /// A TS function: named arguments form one options object, passed last.
    pub ts: bool,
    /// `throws` (2.0): a call of it is written `try`.
    pub throws: bool,
    /// Its constrained type parameters that take a witness (2.0): each one's type
    /// (`Ty::Param`, then what a call instantiates it with) and its protocol's name
    /// (`Equatable`, `Codable`, or a protocol of a `.bloom` module).
    pub bounds: Vec<(Ty, Rc<str>)>,
    /// Its type parameters bounded by a shape (`<T: ProfileGridEntry>`, a struct, a record type
    /// or a TS interface): each one's type (`Ty::Param`, then what a call instantiates it with)
    /// and the shape it has. Structural, so a call passes nothing for them.
    pub shapes: Vec<(Ty, Ty)>,
}

#[derive(Debug, Clone, PartialEq)]
pub struct ParamTy {
    /// A `func`'s labelled parameter: a call names it (`move(to: 1)`), never by position.
    pub labelled: bool,
    /// A `func`'s `_ name` parameter: called by position only (its name is the body's).
    pub positional: bool,
    pub name: Option<String>,
    pub ty: Ty,
    /// Has a default (Bloom) or is optional (TS `?`).
    pub optional: bool,
    /// A TS rest parameter (`...args: T[]`): takes any number of `T`.
    pub rest: bool,
}

#[derive(Debug, PartialEq)]
pub struct StrSet {
    /// `space`, `color`, or the TS alias's name.
    pub name: String,
    pub values: Vec<String>,
    /// A token set of the spec (a colour may carry an opacity, `primary/10`).
    pub token: bool,
}

#[derive(Debug, Clone, PartialEq)]
pub enum Origin {
    /// Declared in the file being compiled.
    Local,
    /// Declared in another `.bloom` module: the specifier to import it from.
    Bloom { specifier: String },
    /// A record literal's own type (`{ a: Int }`): named in TS by its fields.
    Record,
    /// Declared in TS: how to name its type in the emitted TS (an imported
    /// name, or a path from one: `ReturnType<typeof useX>["value"]`).
    Ts { path: String },
}

/// A field's default, as construction inlines it.
#[derive(Debug, Clone, PartialEq)]
pub enum FieldDefault {
    None,
    /// An expression of the file being compiled.
    Expr(ExprId),
    /// A literal from another module, as TS text.
    Literal(String),
    /// A TS optional property: absent is `undefined`.
    Undefined,
}

#[derive(Debug, Clone, PartialEq)]
pub struct FieldDef {
    pub name: String,
    pub ty: Ty,
    pub default: FieldDefault,
}

#[derive(Debug, Clone, PartialEq)]
pub struct VariantDef {
    pub name: String,
    /// Named payloads keep their names in the representation; positional ones are `_0`, `_1`.
    pub payload: Vec<(Option<String>, Ty)>,
}

impl VariantDef {
    pub fn key(&self, index: usize) -> String {
        self.payload[index].0.clone().unwrap_or_else(|| format!("_{index}"))
    }
}

#[derive(Debug, Clone, PartialEq)]
pub enum DefKind {
    /// A struct's fields, or a class's stored properties.
    Struct(Vec<FieldDef>),
    Enum(Vec<VariantDef>),
    /// A protocol's requirements.
    Protocol(Vec<RequirementDef>),
}

/// A protocol's requirement: a property (`ty` its type) or a method (`ty` its function type,
/// without `self`).
#[derive(Debug, Clone, PartialEq)]
pub struct RequirementDef {
    pub name: String,
    pub ty: Ty,
    pub method: bool,
}

/// What a class adds to its fields (2.0).
#[derive(Debug, Clone, PartialEq, Default)]
pub struct ClassDef {
    /// `@Observable`: writes notify the views that read the field.
    pub observable: bool,
    /// Fields only the class's own members assign (`private(set)`, `private`).
    pub sealed: Vec<String>,
    /// `let` fields: assigned in `init` only.
    pub constants: Vec<String>,
}

#[derive(Debug, Clone, PartialEq)]
pub struct Def {
    pub name: String,
    pub generics: Vec<String>,
    pub kind: DefKind,
    pub origin: Origin,
    /// A class (a reference type): its fields are written in place.
    pub class: Option<ClassDef>,
    /// A TS discriminated union (`{ kind: "a"; … } | { kind: "b"; … }`): its tag field and each
    /// member's type by its tag. The def's own field is the tag, a union of the members' tags;
    /// a `match` on it narrows the value to the member each arm names.
    pub tagged: Option<std::rc::Rc<Tagged>>,
}

#[derive(Debug, Clone, PartialEq)]
pub struct Tagged {
    pub tag: String,
    pub members: Vec<(String, Ty)>,
}

impl Def {
    pub fn fields(&self) -> &[FieldDef] {
        match &self.kind {
            DefKind::Struct(fields) => fields,
            DefKind::Enum(_) | DefKind::Protocol(_) => &[],
        }
    }

    pub fn variants(&self) -> &[VariantDef] {
        match &self.kind {
            DefKind::Enum(variants) => variants,
            DefKind::Struct(_) | DefKind::Protocol(_) => &[],
        }
    }

    pub fn requirements(&self) -> &[RequirementDef] {
        match &self.kind {
            DefKind::Protocol(requirements) => requirements,
            _ => &[],
        }
    }

    /// An enum whose every case has no payload: it is a string. A struct is not one.
    pub fn is_fieldless(&self) -> bool {
        matches!(&self.kind, DefKind::Enum(variants) if variants.iter().all(|v| v.payload.is_empty()))
    }
}

/// A TS type built from a `Foreign`'s text (`ReturnType<T>`, `T["k"]`, `T[number]`). An
/// untyped `Foreign` (no text, TS's `unknown`) stays untyped: `ReturnType<>` and `["k"]` are no
/// TS types (Babel: "Type argument list cannot be empty").
pub fn foreign_of(text: &str, f: impl FnOnce(&str) -> String) -> Ty {
    if text.is_empty() { Ty::Foreign("".into()) } else { Ty::Foreign(f(text).into()) }
}

/// Replaces `Ty::Param(i)` with `args[i]`.
pub fn substitute(ty: &Ty, args: &[Ty]) -> Ty {
    if args.is_empty() {
        return ty.clone();
    }
    map_ty(ty, &mut |ty| match ty {
        Ty::Param(index, _) => args.get(*index as usize).cloned(),
        _ => None,
    })
}

/// Rebuilds `ty` bottom-up, replacing what `f` returns `Some` for.
pub fn map_ty(ty: &Ty, f: &mut impl FnMut(&Ty) -> Option<Ty>) -> Ty {
    if let Some(replaced) = f(ty) {
        return replaced;
    }
    let mut go = |t: &Ty| Box::new(map_ty(t, f));
    match ty {
        Ty::List(t) => Ty::List(go(t)),
        Ty::Map(t) => Ty::Map(go(t)),
        Ty::Set(t) => Ty::Set(go(t)),
        Ty::JsMap(k, v) => {
            let k = go(k);
            Ty::JsMap(k, go(v))
        }
        Ty::Option(t) => Ty::Option(go(t)),
        Ty::Partial(t) => Ty::Partial(go(t)),
        Ty::Async(t) => Ty::Async(go(t)),
        Ty::Promise(t) => Ty::Promise(go(t)),
        Ty::Binding(t) => Ty::Binding(go(t)),
        Ty::Result(a, b) => {
            let a = go(a);
            Ty::Result(a, go(b))
        }
        Ty::KeyPath(a, b) => {
            let a = go(a);
            Ty::KeyPath(a, go(b))
        }
        Ty::Tuple(items) => Ty::Tuple(items.iter().map(|t| map_ty(t, f)).collect()),
        Ty::Adt(def, args) => Ty::Adt(*def, args.iter().map(|t| map_ty(t, f)).collect()),
        Ty::Fn(fn_ty) => Ty::Fn(Rc::new(FnTy {
            params: fn_ty
                .params
                .iter()
                .map(|p| ParamTy {
                    labelled: p.labelled,
                    positional: p.positional,
                    name: p.name.clone(),
                    ty: map_ty(&p.ty, f),
                    optional: p.optional,
                    rest: p.rest,
                })
                .collect(),
            ret: map_ty(&fn_ty.ret, f),
            is_async: fn_ty.is_async,
            generics: fn_ty.generics,
            ts: fn_ty.ts,
            throws: fn_ty.throws,
            bounds: fn_ty.bounds.iter().map(|(t, p)| (map_ty(t, f), p.clone())).collect(),
            shapes: fn_ty.shapes.iter().map(|(t, s)| (map_ty(t, f), map_ty(s, f))).collect(),
        })),
        other => other.clone(),
    }
}

/// Writes a type as Bloom spells it (`[String: Int]?`, `Result<Post, String>`).
pub struct Display<'d> {
    pub ty: &'d Ty,
    pub defs: &'d [Def],
}

impl fmt::Display for Display<'_> {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write_ty(f, self.ty, self.defs)
    }
}

fn write_ty(f: &mut impl Write, ty: &Ty, defs: &[Def]) -> fmt::Result {
    let list = |f: &mut dyn Write, items: &[Ty]| -> fmt::Result {
        for (i, item) in items.iter().enumerate() {
            if i > 0 {
                f.write_str(", ")?;
            }
            write!(f, "{}", Display { ty: item, defs })?;
        }
        Ok(())
    };
    match ty {
        Ty::Int => f.write_str("Int"),
        Ty::Float => f.write_str("Float"),
        Ty::Bool => f.write_str("Bool"),
        Ty::Str => f.write_str("String"),
        Ty::Unit => f.write_str("Unit"),
        Ty::Never => f.write_str("Never"),
        Ty::JsError => f.write_str("Error"),
        Ty::List(t) => write!(f, "[{}]", Display { ty: t, defs }),
        Ty::Map(t) => write!(f, "[String: {}]", Display { ty: t, defs }),
        Ty::JsMap(k, v) => write!(f, "Map<{}, {}>", Display { ty: k, defs }, Display { ty: v, defs }),
        Ty::Set(t) => write!(f, "Set<{}>", Display { ty: t, defs }),
        Ty::Tuple(items) if items.is_empty() => f.write_str("Unit"),
        Ty::Tuple(items) => {
            f.write_str("(")?;
            list(f, items)?;
            f.write_str(")")
        }
        Ty::Option(t) => {
            if matches!(**t, Ty::Fn(_)) {
                write!(f, "({})?", Display { ty: t, defs })
            } else {
                write!(f, "{}?", Display { ty: t, defs })
            }
        }
        Ty::Result(a, b) => write!(f, "Result<{}, {}>", Display { ty: a, defs }, Display { ty: b, defs }),
        Ty::Adt(def, args) => {
            f.write_str(defs.get(*def).map_or("?", |d| d.name.as_str()))?;
            if !args.is_empty() {
                f.write_str("<")?;
                list(f, args)?;
                f.write_str(">")?;
            }
            Ok(())
        }
        Ty::Partial(t) => write!(f, "Partial<{}>", Display { ty: t, defs }),
        Ty::Any(def) => write!(f, "any {}", defs.get(*def).map_or("?", |d| d.name.as_str())),
        Ty::Fn(fn_ty) => {
            if fn_ty.is_async {
                f.write_str("async ")?;
            }
            f.write_str("(")?;
            let params: Vec<Ty> = fn_ty.params.iter().map(|p| p.ty.clone()).collect();
            list(f, &params)?;
            write!(f, ") -> {}", Display { ty: &fn_ty.ret, defs })
        }
        Ty::Async(t) => write!(f, "async {}", Display { ty: t, defs }),
        Ty::Promise(t) => write!(f, "Promise<{}>", Display { ty: t, defs }),
        Ty::View(_) => f.write_str("View"),
        Ty::Binding(t) => write!(f, "Binding<{}>", Display { ty: t, defs }),
        Ty::KeyPath(a, b) => write!(f, "KeyPath<{}, {}>", Display { ty: a, defs }, Display { ty: b, defs }),
        Ty::Strings(set) if set.token => f.write_str(&token_type_name(&set.name)),
        Ty::Strings(set) => f.write_str(&set.name),
        Ty::Foreign(text) if text.is_empty() => f.write_str("Foreign"),
        Ty::Foreign(text) => write!(f, "Foreign({text})"),
        Ty::Param(_, name) => f.write_str(name),
        Ty::Var(_) => f.write_str("_"),
        Ty::Unknown => f.write_str("{unknown}"),
    }
}

/// `space` → `Space`, `edgeDistance` → `EdgeDistance`: a token set's Bloom type.
pub fn token_type_name(set: &str) -> String {
    let mut chars = set.chars();
    chars.next().map_or_else(String::new, |first| first.to_ascii_uppercase().to_string() + chars.as_str())
}
