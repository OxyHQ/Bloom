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
//! one becomes `T$$m` (a static computed property `T$$get$m`, called where it is read). `x.m(…)` and `x.m` (a computed property) on a value of type `T`,
//! and `T.m(…)` / `T.m`, resolve to them (statically dispatched: nothing exists at
//! runtime but the functions). The built-in types extend under their Bloom names:
//! `String`, `Int`, `Double` (`Float` too), `Bool`, `Array` (generic over `Element`),
//! `Dictionary` (`[String: Value]`), `Set` (`Element`), `Optional` (`Wrapped`), `Error`.

use crate::ast::*;

/// The name a member `member` of type `owner` is lowered to.
pub fn mangle(owner: &str, member: &str, is_static: bool) -> String {
    format!("{owner}{}{member}", if is_static { "$$" } else { "$" })
}

/// The built-in types an extension extends under their Bloom names.
pub const BUILTIN: &[&str] =
    &["String", "Int", "Double", "Bool", "Array", "Dictionary", "Set", "Optional", "Error", "Date"];

/// A built-in type's `init` by its labels (`_` for an unlabelled parameter): `T$$init` when it
/// takes none, else `T$$init$label$…`.
pub fn init_name<'a>(owner: &str, labels: impl Iterator<Item = Option<&'a str>>) -> String {
    let mut name = mangle(owner, "init", true);
    for label in labels {
        name.push('$');
        name.push_str(label.unwrap_or("_"));
    }
    name
}

/// A written type name's extension key: `Float` is `Double`.
pub fn key(name: &str) -> &str {
    match name {
        "Float" => "Double",
        other => other,
    }
}

/// The member an extension function was lowered from (`String$padded` → `("String", "padded", false)`).
/// An overload's (`Double$formatted$0$digits`) is its base's member; a free function's overload
/// (`describe$0$count`) is no member.
pub fn demangle(name: &str) -> Option<(&str, &str, bool)> {
    let name = overload_base(name).unwrap_or(name);
    if let Some((owner, member)) = name.split_once("$$") {
        return Some((owner, member.strip_prefix("get$").unwrap_or(member), true));
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
        TypeKind::Composition(parts) => parts.iter_mut().for_each(|t| replace_self(t, with)),
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
    /// The names a member's body reads as `self.name` when it binds none of them itself
    /// (Swift's implicit `self`): the type's stored properties and instance members.
    members: &'a [String],
    /// A value type (a built-in one, or a struct): its `init`s are told apart by their labels and
    /// each body gives the value it makes. A class's `init` makes `self` (`T$$init`).
    value_init: bool,
}

/// Fresh expression ids for the nodes lowering adds (`self`, `T.case`), past the parser's.
struct Ids(u32);

impl Ids {
    fn next(&mut self) -> ExprId {
        self.0 += 1;
        ExprId(self.0)
    }
}

fn lower_member(owner: &Owner, member: &TypeMember, ids: &mut Ids, out: &mut Vec<Item>) {
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
        // `init(…)`: the static `T$$init`, which makes `self` and returns it (a class's).
        TypeMemberKind::Func(f) if f.name.name == "init" => {
            let mut f = f.clone();
            // A built-in type's `init`s (`Date(timeIntervalSince1970:)`, `Date(_:strategy:)`) are
            // told apart by their labels, as Swift's are: `Date$$init$timeIntervalSince1970`. Each
            // body gives the value it makes.
            let name = if owner.value_init {
                init_name(
                    &owner.key,
                    f.params
                        .iter()
                        .map(|p| Some(p.label.as_ref().map_or(p.name.name.as_str(), |l| l.name.as_str()))),
                )
            } else {
                mangle(&owner.key, "init", true)
            };
            f.name = Ident { name, span: f.name.span };
            f.generics = owner.generics.iter().cloned().chain(f.generics).collect();
            for p in &mut f.params {
                replace_self(&mut p.ty, &owner.self_ty);
            }
            f.ret = Some(owner.self_ty.clone());
            implicit_self(&mut f.params, &mut f.body, owner.members, ids);
            ItemKind::Fn(f)
        }
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
            if !is_static {
                implicit_self(&mut f.params, &mut f.body, owner.members, ids);
            }
            ItemKind::Fn(f)
        }
        TypeMemberKind::Computed { name, ty, body } => {
            let mut ret = ty.clone();
            replace_self(&mut ret, &owner.self_ty);
            let mut params = if is_static { Vec::new() } else { vec![self_param(name.span)] };
            let mut body = body.clone();
            if !is_static {
                implicit_self(&mut params, &mut body, owner.members, ids);
            }
            ItemKind::Fn(FnDecl {
                is_async: false,
                func: true,
                // A static computed property is read without a call: `T$$get$p()`.
                name: Ident {
                    name: if is_static {
                        mangle(&owner.key, &format!("get${}", name.name), true)
                    } else {
                        mangle(&owner.key, &name.name, false)
                    },
                    span: name.span,
                },
                generics: owner.generics.clone(),
                constraints: Vec::new(),
                params,
                throws: None,
                ret: Some(ret),
                body,
                span: member.span,
            })
        }
        TypeMemberKind::Stored { name, ty, value: Some(value), .. } if is_static => {
            let mut ty = ty.clone();
            if let Some(t) = &mut ty {
                replace_self(t, &owner.self_ty);
            }
            ItemKind::Const(ConstDecl {
                mutable: false,
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

/// A view's `static let x = v` (`struct Card: View { static let fallback = "…" }`): the type's
/// constant `Card$$fallback`, which `Card.fallback` reads, as a struct's is; the view's own
/// unqualified `fallback` reads it too.
fn view_statics(file: &mut File, ids: &mut Ids) {
    let mut consts = Vec::new();
    for item in &mut file.items {
        let ItemKind::View(v) = &mut item.kind else { continue };
        let Some(surface) = v.surface.as_deref() else { continue };
        for member in &surface.members {
            let TypeMemberKind::Stored { name, ty, value: Some(_), mutable: false } = &member.kind else {
                continue;
            };
            if !member.modifiers.is_static {
                continue;
            }
            let Some(slot) = v.members.iter_mut().find_map(|m| match m {
                Member::Let(l) if matches!(&l.pattern.kind, PatternKind::Bind(n) if n.name == name.name) => {
                    Some(l)
                }
                _ => None,
            }) else {
                continue;
            };
            let constant = mangle(&v.name.name, &name.name, true);
            let read = Expr { id: ids.next(), kind: ExprKind::Name(constant.clone()), span: slot.value.span };
            let value = std::mem::replace(&mut slot.value, read);
            consts.push(Item {
                visibility: member.visibility,
                modifiers: Modifiers {
                    visibility_span: member.modifiers.visibility_span,
                    ..Modifiers::default()
                },
                kind: ItemKind::Const(ConstDecl {
                    mutable: false,
                    name: Ident { name: constant, span: name.span },
                    ty: ty.clone(),
                    value,
                    span: member.span,
                }),
                span: member.span,
            });
        }
    }
    // Before the views, so a view's body (and the module's functions) read them declared.
    if !consts.is_empty() {
        consts.append(&mut file.items);
        file.items = consts;
    }
}

/// The standard library's queues an actor's methods run through (to import as written
/// names are: the source never spells them).
pub fn actor_runners(file: &File) -> Vec<String> {
    let mut out = Vec::new();
    for item in &file.items {
        let ItemKind::Class(c) = &item.kind else { continue };
        if !c.actor {
            continue;
        }
        for member in &c.body.members {
            let TypeMemberKind::Func(f) = &member.kind else { continue };
            let Some(Stmt { kind: StmtKind::Expr(mut e), .. }) = f.body.stmts.first().cloned() else {
                continue;
            };
            while let ExprKind::Throwing(_, inner) | ExprKind::Await(inner) = e.kind {
                e = *inner;
            }
            if let ExprKind::Call(call) = &e.kind
                && let ExprKind::Name(name) = &call.callee.kind
                && name.starts_with("actorIsolated")
                && !out.contains(name)
            {
                out.push(name.clone());
            }
        }
    }
    out
}

/// The isolated body of an actor's method `m`: what its own members call.
fn isolated(name: &str) -> String {
    format!("{name}$isolated")
}

/// An `actor`'s methods, serialised (ADR 0002, section 3: concurrency). Each method `m`
/// becomes `m$isolated` (private: its body as written), and a new `m` that is `async`
/// and runs it through the actor's queue (`actorIsolated`, `stdlib/Bloom/Concurrency.bloom`),
/// so a call from outside is awaited and waits for the calls before it. The actor's own
/// members call `m$isolated` directly: a call from inside never waits on itself.
fn isolate(c: &mut ClassDecl, ids: &mut Ids) {
    let methods: Vec<String> = c
        .body
        .members
        .iter()
        .filter_map(|m| match &m.kind {
            TypeMemberKind::Func(f)
                if !m.modifiers.is_static && f.name.name != "init" && f.name.name != "==" =>
            {
                Some(f.name.name.clone())
            }
            _ => None,
        })
        .collect();
    if methods.is_empty() {
        return;
    }
    let rename = |e: &mut Expr| match &mut e.kind {
        ExprKind::Name(name) if methods.contains(name) => *name = isolated(name),
        ExprKind::Field(object, member)
            if matches!(&object.kind, ExprKind::Name(n) if n == "self") && methods.contains(&member.name) =>
        {
            member.name = isolated(&member.name);
        }
        _ => {}
    };
    let mut wrappers = Vec::new();
    for member in &mut c.body.members {
        match &mut member.kind {
            TypeMemberKind::Func(f) => {
                walk_block(&mut f.body, &mut |e| rename(e), &mut |_| {});
                if member.modifiers.is_static || !methods.contains(&f.name.name) {
                    continue;
                }
                wrappers.push(queued(member.visibility, &member.modifiers, member.span, f, ids));
                f.name.name = isolated(&f.name.name);
                member.visibility = Visibility::Private;
                member.modifiers.visibility_span = None;
            }
            TypeMemberKind::Computed { body, .. } => walk_block(body, &mut |e| rename(e), &mut |_| {}),
            _ => {}
        }
    }
    c.body.members.extend(wrappers);
}

/// `func m(…) async [throws] -> R { [try] await actorIsolated…(self) { [try] [await] self.m$isolated(…) } }`.
fn queued(visibility: Visibility, modifiers: &Modifiers, at: Span, f: &FnDecl, ids: &mut Ids) -> TypeMember {
    let span = f.name.span;
    let mut expr = |kind: ExprKind| Expr { id: ids.next(), kind, span };
    let ident = |name: &str| Ident { name: name.to_string(), span };
    let args: Vec<Arg> = f
        .params
        .iter()
        .map(|p| {
            let label = match &p.label {
                Some(l) if l.name == "_" => None,
                Some(l) => Some(l.clone()),
                None if f.func => Some(p.name.clone()),
                None => None,
            };
            Arg { label, spread: false, value: expr(ExprKind::Name(p.name.name.clone())), span }
        })
        .collect();
    let receiver = expr(ExprKind::Name("self".into()));
    let callee = expr(ExprKind::Field(Box::new(receiver), ident(&isolated(&f.name.name))));
    let call = ExprKind::Call(Call {
        callee: Box::new(callee),
        args,
        parens: true,
        trailing: None,
        optional: false,
    });
    let mut work = expr(call);
    if f.is_async {
        work = expr(ExprKind::Await(Box::new(work)));
    }
    if f.throws.is_some() {
        work = expr(ExprKind::Throwing(TryKind::Plain, Box::new(work)));
    }
    let closure = Closure {
        ret: None,
        params: Vec::new(),
        has_in: false,
        tuple: false,
        operator: None,
        body: vec![Stmt { kind: StmtKind::Expr(work), span }],
        span,
    };
    let runner = match (f.is_async, f.throws.is_some()) {
        (false, false) => "actorIsolated",
        (false, true) => "actorIsolatedThrowing",
        (true, false) => "actorIsolatedAsync",
        (true, true) => "actorIsolatedAsyncThrowing",
    };
    let runner = expr(ExprKind::Name(runner.into()));
    let this = expr(ExprKind::Name("self".into()));
    let closure = expr(ExprKind::Closure(closure));
    let run = expr(ExprKind::Call(Call {
        callee: Box::new(runner),
        args: vec![
            Arg { label: None, spread: false, value: this, span },
            Arg { label: None, spread: false, value: closure, span },
        ],
        parens: true,
        trailing: None,
        optional: false,
    }));
    let mut body = expr(ExprKind::Await(Box::new(run)));
    if f.throws.is_some() {
        body = expr(ExprKind::Throwing(TryKind::Plain, Box::new(body)));
    }
    let mut wrapper = f.clone();
    wrapper.is_async = true;
    wrapper.body = Block { stmts: vec![Stmt { kind: StmtKind::Expr(body), span }], span: f.body.span };
    TypeMember { visibility, modifiers: modifiers.clone(), kind: TypeMemberKind::Func(wrapper), span: at }
}

/// Whether `body` lowers members: a method, a computed property, an `init` or a `static let`.
fn has_members(members: &[TypeMember]) -> bool {
    members.iter().any(|m| match &m.kind {
        TypeMemberKind::Computed { .. } => true,
        TypeMemberKind::Func(f) => f.name.name != "==",
        TypeMemberKind::Stored { value: Some(_), .. } => m.modifiers.is_static,
        _ => false,
    })
}

fn conforms(conformances: &[TypeExpr], protocol: &str) -> bool {
    conformances.iter().any(|c| matches!(&c.kind, TypeKind::Named { name, .. } if name.name == protocol))
}

/// The instance member names of each type the file declares or extends (implicit `self`).
fn member_names(file: &File) -> Vec<(String, Vec<String>)> {
    let mut out: Vec<(String, Vec<String>)> = Vec::new();
    let mut add = |owner: &str, names: Vec<String>| match out.iter_mut().find(|(n, _)| n == owner) {
        Some((_, existing)) => existing.extend(names),
        None => out.push((owner.to_string(), names)),
    };
    let instance = |members: &[TypeMember]| -> Vec<String> {
        members
            .iter()
            .filter(|m| !m.modifiers.is_static)
            .filter_map(|m| match &m.kind {
                TypeMemberKind::Stored { name, .. } | TypeMemberKind::Computed { name, .. } => {
                    Some(name.name.clone())
                }
                TypeMemberKind::Func(f) if f.name.name != "init" && f.name.name != "==" => {
                    Some(f.name.name.clone())
                }
                _ => None,
            })
            .collect()
    };
    for item in &file.items {
        match &item.kind {
            ItemKind::Struct(s) => {
                let mut names: Vec<String> = s.fields.iter().map(|f| f.name.name.clone()).collect();
                if let Some(body) = &s.surface {
                    names.extend(instance(&body.members));
                }
                add(&s.name.name, names);
            }
            ItemKind::Enum(e) => add(&e.name.name, instance(&e.members)),
            ItemKind::Class(c) => add(&c.name.name, instance(&c.body.members)),
            ItemKind::Extension(x) => add(key(&x.name.name), instance(&x.body.members)),
            _ => {}
        }
    }
    out
}

/// Lowers `file`'s extensions, and the members of its structs, enums and classes, in place;
/// then names each overload by its labels ([`overloads`]).
pub fn lower(file: &mut File) {
    lower_members(file);
    overloads(file);
}

/// The marker between an overloaded function's name and its labels (`describe$0$count`). No
/// other lowered name has it: every other `$` is followed by a name, and a name never starts
/// with a digit.
pub const OVERLOAD: &str = "$0";

/// An overload's name, by the labels its call writes (`_` for an unlabelled parameter; `self`,
/// a member's receiver, is not one): `describe(count:)` is `describe$0$count`, `f()` is `f$0`.
pub fn overload_name<'a>(name: &str, labels: impl Iterator<Item = &'a str>) -> String {
    let mut out = format!("{name}{OVERLOAD}");
    for label in labels {
        out.push('$');
        out.push_str(label);
    }
    out
}

/// The name an overload was lowered from (`describe$0$count` → `describe`).
pub fn overload_base(name: &str) -> Option<&str> {
    name.split_once(OVERLOAD).map(|(base, _)| base)
}

/// An overload's name as Swift writes it: `describe$0$count` is `describe(count:)`,
/// `Double$formatted$0$digits` is `formatted(digits:)`. Any other name is itself.
pub fn overload_display(name: &str) -> String {
    let Some((base, labels)) = name.split_once(OVERLOAD) else { return name.to_string() };
    let member = demangle(base).map_or(base, |(_, member, _)| member);
    let labels: String = labels.split('$').filter(|l| !l.is_empty()).map(|l| format!("{l}:")).collect();
    format!("{member}({labels})")
}

/// Swift's overloading by argument labels: functions of one name in one file (free functions,
/// and the members [`lower_members`] made of one type's methods) whose calls write different
/// labels are each named by their labels ([`overload_name`]); the checker picks one by a call's
/// labels. A name declared once keeps its name; two declarations with the same labels stay a
/// redeclaration (B0217).
fn overloads(file: &mut File) {
    let labels_of = |f: &FnDecl| -> Vec<String> {
        f.params
            .iter()
            .enumerate()
            .filter(|(i, p)| !(*i == 0 && p.name.name == "self"))
            .map(|(_, p)| p.label.as_ref().map_or(p.name.name.clone(), |l| l.name.clone()))
            .collect()
    };
    let mut groups: std::collections::HashMap<String, Vec<Vec<String>>> = std::collections::HashMap::new();
    for item in &file.items {
        if let ItemKind::Fn(f) = &item.kind
            && !f.name.name.contains("$$init")
        {
            groups.entry(f.name.name.clone()).or_default().push(labels_of(f));
        }
    }
    groups.retain(|_, sets| sets.len() > 1 && sets.iter().any(|s| *s != sets[0]));
    if groups.is_empty() {
        return;
    }
    for item in &mut file.items {
        if let ItemKind::Fn(f) = &mut item.kind
            && groups.contains_key(&f.name.name)
        {
            let labels = labels_of(f);
            f.name.name = overload_name(&f.name.name, labels.iter().map(String::as_str));
        }
    }
}

fn lower_members(file: &mut File) {
    let mut ids = Ids(u32::MAX / 2);
    view_statics(file, &mut ids);
    for item in &mut file.items {
        if let ItemKind::Class(c) = &mut item.kind
            && c.actor
        {
            isolate(c, &mut ids);
        }
    }
    let lowers = |i: &Item| match &i.kind {
        ItemKind::Extension(_) | ItemKind::Class(_) => true,
        ItemKind::Struct(s) => s.surface.as_ref().is_some_and(|b| has_members(&b.members)),
        ItemKind::Enum(e) => has_members(&e.members) || conforms(&e.conformances, "CaseIterable"),
        _ => false,
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
            ItemKind::Class(c) => Some((c.name.name.clone(), c.generics.clone())),
            _ => None,
        })
        .collect();
    // A class declared here: an `extension` of it adds members, its `init` makes `self`.
    let classes: Vec<String> = file
        .items
        .iter()
        .filter_map(|i| match &i.kind {
            ItemKind::Class(c) => Some(c.name.name.clone()),
            _ => None,
        })
        .collect();
    let classes: Vec<&str> = classes.iter().map(String::as_str).collect();
    let names = member_names(file);
    let none = Vec::new();
    let names_of = |owner: &str| names.iter().find(|(n, _)| n == owner).map_or(&none, |(_, m)| m);
    let mut items = Vec::new();
    for item in std::mem::take(&mut file.items) {
        let (name, generics, members, extension) = match &item.kind {
            ItemKind::Extension(x) => (&x.name, &x.generics, &x.body.members, true),
            ItemKind::Struct(s) if lowers(&item) => {
                (&s.name, &s.generics, &s.surface.as_ref().expect("checked").members, false)
            }
            ItemKind::Enum(e) if lowers(&item) => (&e.name, &e.generics, &e.members, false),
            ItemKind::Class(c) => (&c.name, &c.generics, &c.body.members, false),
            _ => {
                items.push(item);
                continue;
            }
        };
        let local = local_generics.iter().find(|(n, _)| *n == name.name).map(|(_, g)| g.as_slice());
        let (self_ty, generics) = self_type(
            name,
            if extension { generics } else { &[] },
            if extension { local } else { Some(generics) },
        );
        let owner = Owner {
            key: key(&name.name).to_string(),
            self_ty,
            generics,
            visibility: item.visibility,
            written: extension && item.modifiers.visibility_span.is_some(),
            span: item.modifiers.visibility_span.unwrap_or(name.span),
            name,
            members: names_of(key(&name.name)),
            value_init: BUILTIN.contains(&key(&name.name))
                || !(matches!(item.kind, ItemKind::Class(_)) || classes.contains(&name.name.as_str())),
        };
        let mut lowered = Vec::new();
        for member in members {
            lower_member(&owner, member, &mut ids, &mut lowered);
        }
        if let ItemKind::Enum(e) = &item.kind {
            all_cases(e, &item, &mut ids, &mut lowered);
        }
        if !extension {
            items.push(item);
        } else if let ItemKind::Extension(x) = &item.kind
            && !x.body.conformances.is_empty()
        {
            // Its conformances stay for the checker; its members are the lowered functions.
            let mut kept = item.clone();
            if let ItemKind::Extension(x) = &mut kept.kind {
                x.body.members.clear();
            }
            items.push(kept);
        }
        items.extend(lowered);
    }
    file.items = items;
}

/// `enum E: CaseIterable`: `static let allCases: [E]`, its cases in order (`E$$allCases`).
fn all_cases(e: &EnumDecl, item: &Item, ids: &mut Ids, out: &mut Vec<Item>) {
    let written = e.members.iter().any(|m| {
        m.modifiers.is_static
            && matches!(&m.kind, TypeMemberKind::Stored { name, .. } | TypeMemberKind::Computed { name, .. } if name.name == "allCases")
    });
    if written || !conforms(&e.conformances, "CaseIterable") || !e.generics.is_empty() {
        return;
    }
    let span = e.name.span;
    let cases = e
        .variants
        .iter()
        .filter(|v| v.payload.is_empty())
        .map(|v| {
            let ty = Expr { id: ids.next(), kind: ExprKind::Name(e.name.name.clone()), span };
            Expr { id: ids.next(), kind: ExprKind::Field(Box::new(ty), v.name.clone()), span: v.name.span }
        })
        .collect();
    let element = TypeExpr { kind: TypeKind::Named { name: e.name.clone(), args: Vec::new() }, span };
    out.push(Item {
        visibility: item.visibility,
        modifiers: Modifiers::default(),
        kind: ItemKind::Const(ConstDecl {
            mutable: false,
            name: Ident { name: mangle(&e.name.name, "allCases", true), span },
            ty: Some(TypeExpr { kind: TypeKind::List(Box::new(element)), span }),
            value: Expr { id: ids.next(), kind: ExprKind::List(cases), span },
            span,
        }),
        span: item.span,
    });
}

// ---- implicit `self` ----------------------------------------------------------------

/// Rewrites the names in `body` that are the type's members, and that the function binds
/// nowhere itself, to `self.name` (Swift's implicit `self`). A member a local shadows is
/// written `self.name` where it is meant.
fn implicit_self(params: &mut [Param], body: &mut Block, members: &[String], ids: &mut Ids) {
    if members.is_empty() {
        return;
    }
    let mut bound: Vec<String> = params.iter().map(|p| p.name.name.clone()).collect();
    walk_stmts(&mut body.stmts, &mut |_| {}, &mut |name| bound.push(name.to_string()));
    let free: Vec<&String> = members.iter().filter(|m| !bound.contains(m)).collect();
    if free.is_empty() {
        return;
    }
    walk_stmts(
        &mut body.stmts,
        &mut |e| {
            if let ExprKind::Name(name) = &e.kind
                && free.contains(&name)
            {
                let member = Ident { name: name.clone(), span: e.span };
                let receiver = Expr {
                    id: ids.next(),
                    kind: ExprKind::Name("self".into()),
                    span: Span::new(e.span.start, e.span.start),
                };
                e.kind = ExprKind::Field(Box::new(receiver), member);
            }
        },
        &mut |_| {},
    );
}

/// The names `pattern` binds.
fn names(pattern: &Pattern, b: &mut dyn FnMut(&str)) {
    match &pattern.kind {
        PatternKind::Bind(name) => b(&name.name),
        PatternKind::Case { args: Some(args), .. } => args.iter().for_each(|p| names(p, b)),
        PatternKind::Tuple(items) | PatternKind::Or(items) => items.iter().for_each(|p| names(p, b)),
        PatternKind::Record(entries) => {
            for (key, pattern) in entries {
                match pattern {
                    Some(p) => names(p, b),
                    None => b(&key.name),
                }
            }
        }
        _ => {}
    }
}

/// Visits every expression of `stmts` (outer before inner), and every name they bind.
fn walk_stmts(stmts: &mut [Stmt], f: &mut dyn FnMut(&mut Expr), bind: &mut dyn FnMut(&str)) {
    for stmt in stmts {
        walk_stmt(stmt, f, bind);
    }
}

fn walk_block(block: &mut Block, f: &mut dyn FnMut(&mut Expr), bind: &mut dyn FnMut(&str)) {
    walk_stmts(&mut block.stmts, f, bind);
}

fn walk_cond(cond: &mut Cond, f: &mut dyn FnMut(&mut Expr), bind: &mut dyn FnMut(&str)) {
    match cond {
        Cond::Expr(e) => walk_expr(e, f, bind),
        Cond::Let(pattern, e) => {
            names(pattern, bind);
            walk_expr(e, f, bind);
        }
    }
}

fn walk_stmt(stmt: &mut Stmt, f: &mut dyn FnMut(&mut Expr), bind: &mut dyn FnMut(&str)) {
    match &mut stmt.kind {
        StmtKind::Let(l) => {
            names(&l.pattern, bind);
            walk_expr(&mut l.value, f, bind);
        }
        StmtKind::Var(v) => {
            bind(&v.name.name);
            walk_expr(&mut v.value, f, bind);
        }
        StmtKind::Assign(a) => {
            walk_expr(&mut a.target, f, bind);
            walk_expr(&mut a.value, f, bind);
        }
        StmtKind::Return(e) => {
            if let Some(e) = e {
                walk_expr(e, f, bind);
            }
        }
        StmtKind::Defer(b) => walk_block(b, f, bind),
        StmtKind::While(w) => {
            walk_expr(&mut w.cond, f, bind);
            walk_block(&mut w.body, f, bind);
        }
        StmtKind::For(x) => {
            names(&x.pattern, bind);
            walk_expr(&mut x.iter, f, bind);
            walk_block(&mut x.body, f, bind);
        }
        StmtKind::Guard(g) => {
            walk_cond(&mut g.cond, f, bind);
            walk_block(&mut g.otherwise, f, bind);
        }
        StmtKind::Break(_) | StmtKind::Continue(_) => {}
        StmtKind::Throw(e) | StmtKind::Expr(e) => walk_expr(e, f, bind),
        StmtKind::Do(d) => {
            walk_block(&mut d.body, f, bind);
            for c in &mut d.catches {
                bind(c.name.as_ref().map_or("error", |n| n.name.as_str()));
                if let Some(pattern) = &c.pattern {
                    names(pattern, bind);
                }
                walk_block(&mut c.body, f, bind);
            }
        }
    }
}

fn walk_expr(expr: &mut Expr, f: &mut dyn FnMut(&mut Expr), bind: &mut dyn FnMut(&str)) {
    f(expr);
    match &mut expr.kind {
        ExprKind::Str { parts, .. } => {
            for part in parts {
                if let StrPart::Interp(e) = part {
                    walk_expr(e, f, bind);
                }
            }
        }
        ExprKind::Paren(e)
        | ExprKind::Spread(e)
        | ExprKind::Is(e, _)
        | ExprKind::CastAs(e, ..)
        | ExprKind::Unary(_, e)
        | ExprKind::Await(e)
        | ExprKind::Try(e)
        | ExprKind::Force(e)
        | ExprKind::Throwing(_, e)
        | ExprKind::Field(e, _)
        | ExprKind::OptField(e, _) => walk_expr(e, f, bind),
        ExprKind::Tuple(items) | ExprKind::List(items) => {
            items.iter_mut().for_each(|e| walk_expr(e, f, bind))
        }
        ExprKind::Map(entries) => {
            for (k, v) in entries {
                walk_expr(k, f, bind);
                walk_expr(v, f, bind);
            }
        }
        ExprKind::Record(entries) => {
            for entry in entries {
                match entry {
                    RecordEntry::Field { value, .. } | RecordEntry::Spread(value) => {
                        walk_expr(value, f, bind)
                    }
                }
            }
        }
        ExprKind::Binary(_, a, b) | ExprKind::Index(a, b) | ExprKind::OptIndex(a, b) => {
            walk_expr(a, f, bind);
            walk_expr(b, f, bind);
        }
        ExprKind::Ternary(a, b, c) => {
            walk_expr(a, f, bind);
            walk_expr(b, f, bind);
            walk_expr(c, f, bind);
        }
        ExprKind::Call(call) => {
            walk_expr(&mut call.callee, f, bind);
            for arg in &mut call.args {
                walk_expr(&mut arg.value, f, bind);
            }
            if let Some(c) = &mut call.trailing {
                c.params.iter().for_each(|param| bind(&param.name.name));
                walk_stmts(&mut c.body, f, bind);
            }
        }
        ExprKind::Closure(c) => {
            c.params.iter().for_each(|param| bind(&param.name.name));
            walk_stmts(&mut c.body, f, bind);
        }
        ExprKind::If(i) => walk_if(i, f, bind),
        ExprKind::Match(m) => {
            walk_expr(&mut m.scrutinee, f, bind);
            for arm in &mut m.arms {
                names(&arm.pattern, bind);
                if let Some(g) = &mut arm.guard {
                    walk_expr(g, f, bind);
                }
                match &mut arm.body {
                    ArmBody::Expr(e) => walk_expr(e, f, bind),
                    ArmBody::Block(b) => walk_block(b, f, bind),
                }
            }
        }
        ExprKind::Task(b) => walk_block(b, f, bind),
        _ => {}
    }
}

fn walk_if(i: &mut IfExpr, f: &mut dyn FnMut(&mut Expr), bind: &mut dyn FnMut(&str)) {
    walk_cond(&mut i.cond, f, bind);
    walk_block(&mut i.then, f, bind);
    match i.otherwise.as_deref_mut() {
        Some(Else::If(e)) => walk_expr(e, f, bind),
        Some(Else::Block(b)) => walk_block(b, f, bind),
        None => {}
    }
}
