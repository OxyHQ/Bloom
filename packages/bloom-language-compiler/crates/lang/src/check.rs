//! Name resolution and type checking (spec sections 4 to 8): local
//! bidirectional inference with unification, signatures required at module
//! level. The checker leaves side tables the emitter reads: what each name,
//! call, member, assignment, await and pattern resolved to, and every type.

mod call;
mod exhaust;

use std::collections::{HashMap, HashSet};
use std::path::{Path, PathBuf};
use std::rc::Rc;

use crate::Options;
use crate::ast::*;
use crate::diagnostic::{Diagnostic, closest};
use crate::ts;
use crate::types::*;
use crate::ui;

pub use exhaust::Pat;

pub type LocalId = usize;

#[derive(Debug, Clone, PartialEq)]
pub enum LocalKind {
    Let,
    Var,
    Param,
    /// A view's parameter: one of its props.
    Prop,
    /// `@state`; written through its setter.
    State,
    /// A view member whose value is a hook (`let x = useX()`, `@list`, `@record`, `@env`).
    Hook,
    /// A view's `let` member.
    Derived,
    /// A view's `fn` member.
    Handler,
    ModuleFn,
    ModuleConst,
    /// A Bloom view: called with its props as named arguments.
    View,
    /// A TS value.
    Import {
        hook: bool,
    },
    /// A TS React component: a node, its props as named arguments.
    Component {
        props: Ty,
    },
}

#[derive(Debug, Clone)]
pub struct Local {
    pub name: String,
    pub ty: Ty,
    pub kind: LocalKind,
    pub span: Span,
    /// The function frame that declared it (a `var` is not capturable).
    pub frame: usize,
    /// For a view member, the view's index in `CheckResult::views`.
    pub view: Option<usize>,
}

/// How a call is emitted.
#[derive(Debug, Clone, PartialEq)]
pub enum CallRes {
    /// A Bloom function: argument index for each parameter, in order (`None`: its default).
    Bloom {
        order: Vec<Option<usize>>,
    },
    /// A TS function: positional arguments, then the named ones as one object.
    Ts,
    Struct(DefId),
    Partial(DefId),
    /// `s.with(field: v)`.
    With(DefId),
    EnumCase(DefId, usize),
    Node(&'static str),
    /// `.name(…)` on a view; `object`: the named arguments form one object (`.frame(width: …)`).
    Modifier {
        object: bool,
    },
    /// `.task { … }` / `.task(id: v) { … }` on the body's root.
    Task,
    /// A Bloom view: its props as one object.
    View {
        params: Vec<String>,
    },
    /// A TS component: `Embed(jsx(C, props))`.
    Component,
    /// A standard library member (spec 12).
    Method {
        recv: Recv,
        name: &'static str,
    },
    Ok,
    Err,
    Toast,
    Navigate,
    Binding,
    Sleep,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Recv {
    Str,
    Int,
    Float,
    List,
    Map,
    Option,
    Result,
}

/// How `a.b` is emitted.
#[derive(Debug, Clone, PartialEq)]
pub enum FieldRes {
    /// A field of a struct, a TS object or a foreign value.
    Field,
    /// `t.0`
    Index(usize),
    EnumCase(DefId, usize),
    /// A standard library property (`count`, `isEmpty`, `first`, `last`, `keys`, …).
    Prop {
        recv: Recv,
        name: &'static str,
    },
    /// `error.message`.
    ErrorField,
    /// `Task.signal`.
    TaskSignal,
}

#[derive(Debug, Clone, PartialEq)]
pub enum AssignRes {
    /// A state's setter; `functional` when the value reads the state.
    State {
        local: LocalId,
        fields: Vec<String>,
        functional: bool,
    },
    Var {
        local: LocalId,
        fields: Vec<String>,
    },
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum AwaitRes {
    Bloom,
    /// A TS promise, settled into a `Result`.
    Ts,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TryRes {
    Result,
    Option,
}

#[derive(Debug, Clone)]
pub struct ClosureInfo {
    pub params: Vec<LocalId>,
    pub is_async: bool,
    pub ret: Ty,
    /// A builder: each line is a child.
    pub builder: bool,
}

#[derive(Debug, Clone, Default)]
pub struct ViewInfo {
    pub props: Vec<LocalId>,
    /// Each member's locals, in order (a destructuring `let` has several).
    pub members: Vec<Vec<LocalId>>,
}

#[derive(Debug, Clone)]
pub enum NameRes {
    Local(LocalId),
}

#[derive(Default)]
pub struct CheckResult {
    pub diagnostics: Vec<Diagnostic>,
    pub defs: Vec<Def>,
    pub locals: Vec<Local>,
    pub types: HashMap<ExprId, Ty>,
    pub spans: Vec<(Span, Ty)>,
    pub names: HashMap<ExprId, NameRes>,
    pub calls: HashMap<ExprId, CallRes>,
    pub fields: HashMap<ExprId, FieldRes>,
    pub bindings: HashMap<ExprId, (LocalId, Vec<String>)>,
    pub assigns: HashMap<Span, AssignRes>,
    pub awaits: HashMap<ExprId, AwaitRes>,
    pub tries: HashMap<ExprId, TryRes>,
    pub closures: HashMap<Span, ClosureInfo>,
    /// Pattern span → the type it matches; binding span → its local.
    pub pattern_tys: HashMap<Span, Ty>,
    pub pattern_locals: HashMap<Span, LocalId>,
    /// Item index → its locals: a fn's parameters, a view's info.
    pub fn_params: HashMap<Span, Vec<LocalId>>,
    pub views: HashMap<usize, ViewInfo>,
    /// Item index → the local it declares.
    pub items: HashMap<usize, LocalId>,
    /// Type names the module declares or imports: what the emitter names them.
    pub type_imports: Vec<String>,
    /// Imported names that are types only (a struct or enum of another `.bloom` module,
    /// a TS interface): emitted as `import type`.
    pub type_only_imports: HashSet<Span>,
    /// The names an assignment writes (`count` in `count += 1`): written, not read.
    pub assign_targets: HashSet<ExprId>,
    /// `Foreign` values accepted as a Bloom type: emitted `(value satisfies T)`.
    pub foreign_checks: HashMap<ExprId, Ty>,
}

impl CheckResult {
    pub fn types(&self, _source: &str) -> Vec<(Span, String)> {
        let mut out: Vec<(Span, String)> = self
            .spans
            .iter()
            .map(|(span, ty)| (*span, Display { ty, defs: &self.defs }.to_string()))
            .collect();
        out.sort_by_key(|(span, _)| (span.start, std::cmp::Reverse(span.end)));
        out
    }
}

/// A function frame: what `return` and `?` refer to, and whether `await` may appear.
struct Frame {
    ret: Ty,
    is_async: bool,
    /// A closure: `await` makes it async.
    closure: bool,
    /// The states written so far in this frame (B0410).
    written: HashSet<LocalId>,
    /// Inside `.task { }`: `Task.signal` is in scope.
    task: bool,
    /// A render frame (a view's members and body): states are not written here.
    render: bool,
    /// A `task { … }`: an async call here starts without being awaited.
    spawn: bool,
}

/// A type name in scope.
#[derive(Debug, Clone)]
enum TypeName {
    Def(DefId),
    Alias(Ty, usize),
    Ty(Ty),
}

pub struct Checker<'o> {
    source: &'o str,
    path: PathBuf,
    options: &'o Options,
    pub out: CheckResult,
    vars: Vec<Option<Ty>>,
    scopes: Vec<HashMap<String, LocalId>>,
    type_names: HashMap<String, TypeName>,
    /// Type parameters in scope (innermost last).
    generics: Vec<String>,
    frames: Vec<Frame>,
    ts_named: HashMap<(PathBuf, String), Ty>,
    /// The view being checked.
    view: Option<usize>,
    /// The outermost call of a view member's value may be a hook.
    hook_allowed: bool,
    /// Whether the call just checked was a hook.
    was_hook: bool,
    /// The body's root chain may carry `.task`.
    task_allowed: bool,
    /// Spans already reported: one error per place.
    reported: HashSet<Span>,
}

pub fn check(file: &File, source: &str, filename: &str, options: &Options) -> CheckResult {
    let mut checker = Checker::new(source, filename, options);
    checker.module(file);
    checker.finish()
}

impl<'o> Checker<'o> {
    fn new(source: &'o str, filename: &str, options: &'o Options) -> Self {
        let path = match &options.root {
            Some(root) if Path::new(filename).is_relative() => root.join(filename),
            _ => PathBuf::from(filename),
        };
        Self {
            source,
            path,
            options,
            out: CheckResult::default(),
            vars: Vec::new(),
            scopes: vec![HashMap::new()],
            type_names: HashMap::new(),
            generics: Vec::new(),
            frames: vec![Frame {
                ret: Ty::Unit,
                is_async: false,
                closure: false,
                written: HashSet::new(),
                task: false,
                render: false,
                spawn: false,
            }],
            ts_named: HashMap::new(),
            view: None,
            hook_allowed: false,
            was_hook: false,
            task_allowed: false,
            reported: HashSet::new(),
        }
    }

    fn finish(mut self) -> CheckResult {
        let types = std::mem::take(&mut self.out.types);
        self.out.types = types.into_iter().map(|(id, ty)| (id, self.zonk(&ty))).collect();
        let spans = std::mem::take(&mut self.out.spans);
        self.out.spans = spans.into_iter().map(|(span, ty)| (span, self.zonk(&ty))).collect();
        let locals = std::mem::take(&mut self.out.locals);
        self.out.locals = locals.into_iter().map(|l| Local { ty: self.zonk(&l.ty), ..l }).collect();
        let pattern_tys = std::mem::take(&mut self.out.pattern_tys);
        self.out.pattern_tys = pattern_tys.into_iter().map(|(s, ty)| (s, self.zonk(&ty))).collect();
        let closures = std::mem::take(&mut self.out.closures);
        self.out.closures =
            closures.into_iter().map(|(s, c)| (s, ClosureInfo { ret: self.zonk(&c.ret), ..c })).collect();
        for def in 0..self.out.defs.len() {
            let mut d = self.out.defs[def].clone();
            match &mut d.kind {
                DefKind::Struct(fields) => fields.iter_mut().for_each(|f| f.ty = self.zonk(&f.ty)),
                DefKind::Enum(variants) => {
                    variants.iter_mut().for_each(|v| v.payload.iter_mut().for_each(|p| p.1 = self.zonk(&p.1)))
                }
            }
            self.out.defs[def] = d;
        }
        self.out
    }

    // ---- diagnostics ----------------------------------------------------

    fn report(&mut self, diagnostic: Diagnostic) {
        if self.reported.insert(diagnostic.span) {
            self.out.diagnostics.push(diagnostic);
        }
    }

    fn show(&self, ty: &Ty) -> String {
        let ty = self.zonk(ty);
        format!("`{}`", Display { ty: &ty, defs: &self.out.defs })
    }

    fn mismatch(&mut self, span: Span, actual: &Ty, expected: &Ty) {
        let actual = self.zonk(actual);
        let expected = self.zonk(expected);
        if matches!(actual, Ty::Unknown) || matches!(expected, Ty::Unknown) {
            return;
        }
        if let Ty::Foreign(text) = &actual {
            let help = format!(
                "annotate it where Bloom first uses it: `let value: {} = …`; TypeScript then checks the boundary",
                Display { ty: &expected, defs: &self.out.defs }
            );
            let label = if text.is_empty() {
                "a TS value Bloom could not type".to_string()
            } else {
                format!("a TS value Bloom could not type (`{text}`)")
            };
            self.report(
                Diagnostic::error(
                    "B0601",
                    span,
                    format!("a `Foreign` value flows into {}", self.show(&expected)),
                )
                .label(label)
                .help(help)
                .spec("47-the-foreign-boundary"),
            );
            return;
        }
        let mut diagnostic = Diagnostic::error(
            "B0201",
            span,
            format!("expected {}, found {}", self.show(&expected), self.show(&actual)),
        )
        .label(format!("this is {}", self.show(&actual)))
        .spec("43-soundness-rules");
        let help = match (&actual, &expected) {
            (Ty::Int, Ty::Float) => {
                Some("convert it: `.toFloat()` (Bloom never converts numbers implicitly)".to_string())
            }
            (Ty::Float, Ty::Int) => {
                Some("convert it: `.rounded()`, `.floor()`, `.ceil()` or `.truncated()`".to_string())
            }
            (Ty::Option(inner), other) if self.compatible(inner, other) => Some(
                "it may be `none`: unwrap it with `?? fallback`, `if let value = …`, `?.` or `match`"
                    .to_string(),
            ),
            (Ty::Async(_), _) => Some("this is a pending async call: write `await` before it".to_string()),
            (Ty::Promise(_), _) => {
                Some("this is a promise: write `await` before it, and handle its `Result`".to_string())
            }
            (Ty::Result(ok, _), other) if self.compatible(ok, other) => {
                Some("this is a `Result`: `match` it, or write `?` to return the error early".to_string())
            }
            (Ty::Str, Ty::Strings(set)) if set.token => Some(format!(
                "a `String` is not a token: write a literal (`\"{}\"`), or give the value the token type (`let x: {} = …`)",
                set.values.iter().find(|v| v.chars().any(|c| c.is_alphabetic())).cloned().unwrap_or_default(),
                token_type_name(&set.name)
            )),
            _ => None,
        };
        diagnostic = diagnostic.maybe_help(help);
        self.report(diagnostic);
    }

    // ---- types ----------------------------------------------------------

    fn fresh(&mut self) -> Ty {
        self.vars.push(None);
        Ty::Var(self.vars.len() as u32 - 1)
    }

    fn resolve(&self, ty: &Ty) -> Ty {
        let mut ty = ty.clone();
        while let Ty::Var(v) = ty {
            match &self.vars[v as usize] {
                Some(bound) => ty = bound.clone(),
                None => break,
            }
        }
        ty
    }

    pub fn zonk(&self, ty: &Ty) -> Ty {
        map_ty(ty, &mut |t| match t {
            Ty::Var(v) => self.vars[*v as usize].as_ref().map(|bound| self.zonk(bound)),
            _ => None,
        })
    }

    fn occurs(&self, var: u32, ty: &Ty) -> bool {
        let mut found = false;
        map_ty(&self.zonk(ty), &mut |t| {
            if *t == Ty::Var(var) {
                found = true;
            }
            None
        });
        found
    }

    fn unify(&mut self, a: &Ty, b: &Ty) -> bool {
        let a = self.resolve(a);
        let b = self.resolve(b);
        match (&a, &b) {
            (Ty::Var(x), Ty::Var(y)) if x == y => true,
            (Ty::Var(x), other) | (other, Ty::Var(x)) => {
                if self.occurs(*x, other) {
                    return false;
                }
                self.vars[*x as usize] = Some(other.clone());
                true
            }
            (Ty::Unknown, _) | (_, Ty::Unknown) | (Ty::Never, _) | (_, Ty::Never) => true,
            (Ty::Foreign(_), Ty::Foreign(_)) | (Ty::View(_), Ty::View(_)) => true,
            (Ty::List(x), Ty::List(y))
            | (Ty::Map(x), Ty::Map(y))
            | (Ty::Option(x), Ty::Option(y))
            | (Ty::Partial(x), Ty::Partial(y))
            | (Ty::Async(x), Ty::Async(y))
            | (Ty::Promise(x), Ty::Promise(y))
            | (Ty::Binding(x), Ty::Binding(y)) => self.unify(x, y),
            (Ty::Result(a1, b1), Ty::Result(a2, b2)) => self.unify(a1, a2) && self.unify(b1, b2),
            (Ty::Tuple(x), Ty::Tuple(y)) => {
                x.len() == y.len() && x.iter().zip(y).all(|(x, y)| self.unify(x, y))
            }
            (Ty::Adt(d1, x), Ty::Adt(d2, y)) => {
                d1 == d2 && x.len() == y.len() && x.iter().zip(y).all(|(x, y)| self.unify(x, y))
            }
            (Ty::Strings(x), Ty::Strings(y)) => x.name == y.name || x.values == y.values,
            (Ty::Fn(f), Ty::Fn(g)) => {
                f.params.len() == g.params.len()
                    && f.is_async == g.is_async
                    && f.params.iter().zip(&g.params).all(|(p, q)| self.unify(&p.ty, &q.ty))
                    && self.unify(&f.ret, &g.ret)
            }
            (Ty::Param(x, _), Ty::Param(y, _)) => x == y,
            _ => a == b,
        }
    }

    /// Whether two types could be the same, without binding anything.
    fn compatible(&self, a: &Ty, b: &Ty) -> bool {
        let a = self.zonk(a);
        let b = self.zonk(b);
        a == b || matches!(a, Ty::Var(_)) || matches!(b, Ty::Var(_))
    }

    /// Whether a value of `actual` fits where `expected` is wanted (spec 4.2):
    /// `T` promotes to `T?`, a token is a `String`, a struct is its own patch,
    /// anything flows into TS, and a function returning anything fits one
    /// returning `Unit`.
    fn coerce(&mut self, actual: &Ty, expected: &Ty) -> bool {
        let a = self.resolve(actual);
        let e = self.resolve(expected);
        match (&a, &e) {
            (Ty::Never | Ty::Unknown, _) | (_, Ty::Unknown) => true,
            (Ty::Var(_), _) | (_, Ty::Var(_)) => self.unify(&a, &e),
            (_, Ty::Foreign(_)) => true,
            (Ty::Foreign(_), _) => false,
            (Ty::Option(x), Ty::Option(y)) => self.coerce(x, y),
            (_, Ty::Option(inner)) => self.coerce(&a, inner),
            (Ty::Strings(_), Ty::Str) => true,
            (Ty::Strings(x), Ty::Strings(y)) => x.values.iter().all(|v| ui::token_ok(y, v)),
            (Ty::Adt(d1, x), Ty::Partial(inner)) => match self.resolve(inner) {
                Ty::Adt(d2, y) => *d1 == d2 && x.iter().zip(&y).all(|(x, y)| self.unify(x, y)),
                _ => false,
            },
            (Ty::List(x), Ty::List(y)) => self.coerce(x, y),
            (Ty::Fn(f), Ty::Fn(g)) => {
                if f.params.len() > g.params.len() && f.params[g.params.len()..].iter().any(|p| !p.optional) {
                    return false;
                }
                let params_ok = f.params.iter().zip(&g.params).all(|(p, q)| self.coerce(&q.ty, &p.ty));
                let ret = self.resolve(&g.ret);
                let ret_ok = if ret == Ty::Unit {
                    // The result is discarded; an async function's promise too.
                    let _ = self.unify(&f.ret, &Ty::Unit) || true;
                    true
                } else {
                    f.is_async == g.is_async && self.coerce(&f.ret, &g.ret)
                };
                params_ok && ret_ok
            }
            _ => self.unify(&a, &e),
        }
    }

    // ---- scopes ---------------------------------------------------------

    fn push(&mut self) {
        self.scopes.push(HashMap::new());
    }

    fn pop(&mut self) {
        self.scopes.pop();
    }

    fn declare(&mut self, name: &Ident, ty: Ty, kind: LocalKind) -> LocalId {
        let id = self.out.locals.len();
        self.out.locals.push(Local {
            name: name.name.clone(),
            ty: ty.clone(),
            kind,
            span: name.span,
            frame: self.frames.len() - 1,
            view: self.view,
        });
        self.out.spans.push((name.span, ty));
        if name.name != "_" {
            self.scopes.last_mut().expect("a scope").insert(name.name.clone(), id);
        }
        id
    }

    fn lookup(&self, name: &str) -> Option<LocalId> {
        self.scopes.iter().rev().find_map(|scope| scope.get(name).copied())
    }

    fn names_in_scope(&self) -> Vec<String> {
        let mut names: Vec<String> = self.scopes.iter().flat_map(|s| s.keys().cloned()).collect();
        names.extend(["ok", "err", "toast", "navigate", "Binding", "sleep"].map(String::from));
        names.extend(ui::constructors().map(String::from));
        names
    }

    // ---- type expressions -----------------------------------------------

    fn resolve_type(&mut self, te: &TypeExpr) -> Ty {
        let ty = self.resolve_type_inner(te);
        self.out.spans.push((te.span, ty.clone()));
        ty
    }

    fn resolve_type_inner(&mut self, te: &TypeExpr) -> Ty {
        match &te.kind {
            TypeKind::Error => Ty::Unknown,
            TypeKind::List(t) => Ty::List(Box::new(self.resolve_type(t))),
            TypeKind::Map(k, v) => {
                let key = self.resolve_type(k);
                if !matches!(key, Ty::Str | Ty::Unknown) {
                    self.report(
                        Diagnostic::error(
                            "B0204",
                            k.span,
                            format!("a map's keys are strings in phase 0, not {}", self.show(&key)),
                        )
                        .label("not a `String` key")
                        .help("key it by a string (`[String: V]`), or keep a list of pairs")
                        .spec("41-the-types"),
                    );
                }
                Ty::Map(Box::new(self.resolve_type(v)))
            }
            TypeKind::Tuple(items) if items.is_empty() => Ty::Unit,
            TypeKind::Tuple(items) => Ty::Tuple(items.iter().map(|t| self.resolve_type(t)).collect()),
            TypeKind::Fn { is_async, params, ret } => {
                let params = params
                    .iter()
                    .map(|p| ParamTy { name: None, ty: self.resolve_type(p), optional: false, rest: false })
                    .collect();
                let ret = self.resolve_type(ret);
                Ty::Fn(Rc::new(FnTy { params, ret, is_async: *is_async, generics: 0, ts: false }))
            }
            TypeKind::Optional(inner) => {
                let inner_ty = self.resolve_type(inner);
                if matches!(inner.kind, TypeKind::Optional(_)) || matches!(inner_ty, Ty::Option(_)) {
                    self.report(
                        Diagnostic::error("B0203", te.span, "an optional is never optional again")
                            .label("`T??` has no meaning `T?` lacks")
                            .help("write one `?`: an optional's absence is `none` alone")
                            .spec("41-the-types"),
                    );
                    return inner_ty;
                }
                Ty::Option(Box::new(inner_ty))
            }
            TypeKind::Named { name, args } => self.named_type(name, args, te.span),
        }
    }

    fn named_type(&mut self, name: &Ident, args: &[TypeExpr], span: Span) -> Ty {
        let arity = |checker: &mut Self, want: usize| -> bool {
            if args.len() != want {
                checker.report(
                    Diagnostic::error(
                        "B0218",
                        span,
                        format!("`{}` takes {want} type argument(s), not {}", name.name, args.len()),
                    )
                    .label("wrong number of type arguments")
                    .spec("46-generics"),
                );
                return false;
            }
            true
        };
        if let Some(index) = self.generics.iter().rposition(|g| *g == name.name) {
            return Ty::Param(index as u32, name.name.as_str().into());
        }
        let simple = match name.name.as_str() {
            "Int" => Some(Ty::Int),
            "Float" => Some(Ty::Float),
            "Bool" => Some(Ty::Bool),
            "String" => Some(Ty::Str),
            "Unit" => Some(Ty::Unit),
            "View" => Some(Ty::View(None)),
            "Error" => Some(Ty::JsError),
            "Foreign" => Some(Ty::Foreign("".into())),
            _ => None,
        };
        if let Some(ty) = simple {
            arity(self, 0);
            return ty;
        }
        match name.name.as_str() {
            "Result" => {
                return if arity(self, 2) {
                    let ok = self.resolve_type(&args[0]);
                    Ty::Result(Box::new(ok), Box::new(self.resolve_type(&args[1])))
                } else {
                    Ty::Unknown
                };
            }
            "Promise" => {
                return if arity(self, 1) {
                    Ty::Promise(Box::new(self.resolve_type(&args[0])))
                } else {
                    Ty::Unknown
                };
            }
            "Binding" => {
                return if arity(self, 1) {
                    Ty::Binding(Box::new(self.resolve_type(&args[0])))
                } else {
                    Ty::Unknown
                };
            }
            "Partial" => {
                if !arity(self, 1) {
                    return Ty::Unknown;
                }
                let inner = self.resolve_type(&args[0]);
                return match &inner {
                    Ty::Adt(def, _) if matches!(self.out.defs[*def].kind, DefKind::Struct(_)) => {
                        Ty::Partial(Box::new(inner))
                    }
                    Ty::Unknown => Ty::Unknown,
                    _ => {
                        self.report(
                            Diagnostic::error(
                                "B0204",
                                args[0].span,
                                format!("`Partial` takes a struct, not {}", self.show(&inner)),
                            )
                            .label("not a struct")
                            .spec("44-structs"),
                        );
                        Ty::Unknown
                    }
                };
            }
            _ => {}
        }
        if let Some(found) = self.type_names.get(&name.name).cloned() {
            return match found {
                TypeName::Def(def) => {
                    let want = self.out.defs[def].generics.len();
                    if !arity(self, want) {
                        return Ty::Unknown;
                    }
                    let args = args.iter().map(|a| self.resolve_type(a)).collect();
                    Ty::Adt(def, args)
                }
                TypeName::Alias(ty, want) => {
                    if !arity(self, want) {
                        return Ty::Unknown;
                    }
                    let args: Vec<Ty> = args.iter().map(|a| self.resolve_type(a)).collect();
                    substitute(&ty, &args)
                }
                TypeName::Ty(ty) => ty,
            };
        }
        if let Some(set) = ui::token_set_by_type(&name.name) {
            arity(self, 0);
            return Ty::Strings(set);
        }
        let mut candidates: Vec<String> = self.type_names.keys().cloned().collect();
        candidates.extend(
            ["Int", "Float", "Bool", "String", "Unit", "View", "Result", "Binding", "Partial", "Error"]
                .map(String::from),
        );
        let help = closest(&name.name, candidates.iter().map(String::as_str))
            .map(|near| format!("did you mean `{near}`?"));
        let mut diagnostic =
            Diagnostic::error("B0204", name.span, format!("cannot find type `{}`", name.name))
                .label("not a type in scope")
                .maybe_help(help.clone())
                .spec("41-the-types");
        if help.is_none() {
            diagnostic =
                diagnostic.help("declare it (`struct`, `enum`, `type`), or import it from its module");
        }
        self.report(diagnostic);
        Ty::Unknown
    }

    // ---- the module -----------------------------------------------------

    fn module(&mut self, file: &File) {
        for import in &file.imports {
            self.import(import);
        }
        // Types first (so fields can name any of them), then their bodies.
        let mut pending = Vec::new();
        for (index, item) in file.items.iter().enumerate() {
            let (name, generics) = match &item.kind {
                ItemKind::Struct(s) => (&s.name, &s.generics),
                ItemKind::Enum(e) => (&e.name, &e.generics),
                ItemKind::Alias(_) => {
                    pending.push(index);
                    continue;
                }
                _ => continue,
            };
            if self.type_names.contains_key(&name.name) {
                self.duplicate(name);
                continue;
            }
            let def = self.out.defs.len();
            let kind = if matches!(item.kind, ItemKind::Struct(_)) {
                DefKind::Struct(Vec::new())
            } else {
                DefKind::Enum(Vec::new())
            };
            self.out.defs.push(Def {
                name: name.name.clone(),
                generics: generics.iter().map(|g| g.name.clone()).collect(),
                kind,
                origin: Origin::Local,
            });
            self.type_names.insert(name.name.clone(), TypeName::Def(def));
            self.out.spans.push((name.span, Ty::Adt(def, Vec::new())));
        }
        for index in pending {
            if let ItemKind::Alias(alias) = &file.items[index].kind {
                self.generics = alias.generics.iter().map(|g| g.name.clone()).collect();
                let ty = self.resolve_type(&alias.ty);
                self.generics.clear();
                self.type_names.insert(alias.name.name.clone(), TypeName::Alias(ty, alias.generics.len()));
            }
        }
        for item in &file.items {
            match &item.kind {
                ItemKind::Struct(s) => self.struct_fields(s),
                ItemKind::Enum(e) => self.enum_variants(e),
                _ => {}
            }
        }
        // Values: functions and views are visible everywhere; constants in order.
        for (index, item) in file.items.iter().enumerate() {
            let local = match &item.kind {
                ItemKind::Fn(f) => {
                    let ty = self.fn_signature(f);
                    Some(self.declare_unique(&f.name, ty, LocalKind::ModuleFn))
                }
                ItemKind::View(v) => {
                    let params = self.view_params(v);
                    let ty = Ty::Fn(Rc::new(FnTy {
                        params,
                        ret: Ty::View(Some("view")),
                        is_async: false,
                        generics: 0,
                        ts: false,
                    }));
                    Some(self.declare_unique(&v.name, ty, LocalKind::View))
                }
                _ => None,
            };
            if let Some(local) = local {
                self.out.items.insert(index, local);
            }
        }
        let mut screens = 0;
        for (index, item) in file.items.iter().enumerate() {
            match &item.kind {
                ItemKind::Const(c) => {
                    let declared = c.ty.as_ref().map(|t| self.resolve_type(t));
                    let ty = self.expr(&c.value, declared.as_ref());
                    let local = self.declare_unique(&c.name, ty, LocalKind::ModuleConst);
                    self.out.items.insert(index, local);
                }
                ItemKind::Struct(s) => self.struct_defaults(s),
                ItemKind::Fn(f) => {
                    self.fn_body(f, false);
                }
                ItemKind::View(v) => {
                    if v.kind != ViewKind::View {
                        screens += 1;
                        if screens > 1 {
                            self.report(
                                Diagnostic::error(
                                    "B0106",
                                    v.name.span,
                                    "a file has one `screen` or `layout`",
                                )
                                .label("a second route in this file")
                                .help("a route is the file's default export: move this one to its own file")
                                .spec("71-a-view"),
                            );
                        }
                    }
                    self.view_decl(index, v);
                }
                _ => {}
            }
        }
    }

    fn duplicate(&mut self, name: &Ident) {
        self.report(
            Diagnostic::error("B0217", name.span, format!("`{}` is declared twice", name.name))
                .label("a second declaration")
                .help("rename one of them")
                .spec("10-modules-and-interop"),
        );
    }

    fn declare_unique(&mut self, name: &Ident, ty: Ty, kind: LocalKind) -> LocalId {
        if self.scopes.last().is_some_and(|s| s.contains_key(&name.name)) {
            self.duplicate(name);
        }
        self.declare(name, ty, kind)
    }

    fn struct_fields(&mut self, s: &StructDecl) {
        let Some(TypeName::Def(def)) = self.type_names.get(&s.name.name).cloned() else { return };
        self.generics = s.generics.iter().map(|g| g.name.clone()).collect();
        let mut fields: Vec<FieldDef> = Vec::new();
        for field in &s.fields {
            if fields.iter().any(|f| f.name == field.name.name) {
                self.duplicate(&field.name);
            }
            let ty = self.resolve_type(&field.ty);
            let default = match &field.default {
                Some(expr) => FieldDefault::Expr(expr.id),
                None => FieldDefault::None,
            };
            fields.push(FieldDef { name: field.name.name.clone(), ty, default });
        }
        self.generics.clear();
        self.out.defs[def].kind = DefKind::Struct(fields);
    }

    fn struct_defaults(&mut self, s: &StructDecl) {
        let Some(TypeName::Def(def)) = self.type_names.get(&s.name.name).cloned() else { return };
        self.generics = s.generics.iter().map(|g| g.name.clone()).collect();
        for (index, field) in s.fields.iter().enumerate() {
            if let Some(expr) = &field.default {
                let ty = self.out.defs[def].fields()[index].ty.clone();
                self.expr(expr, Some(&ty));
            }
        }
        self.generics.clear();
    }

    fn enum_variants(&mut self, e: &EnumDecl) {
        let Some(TypeName::Def(def)) = self.type_names.get(&e.name.name).cloned() else { return };
        self.generics = e.generics.iter().map(|g| g.name.clone()).collect();
        let mut variants: Vec<VariantDef> = Vec::new();
        for variant in &e.variants {
            if variants.iter().any(|v| v.name == variant.name.name) {
                self.duplicate(&variant.name);
            }
            let payload = variant
                .payload
                .iter()
                .map(|p| (p.name.as_ref().map(|n| n.name.clone()), self.resolve_type(&p.ty)))
                .collect();
            variants.push(VariantDef { name: variant.name.name.clone(), payload });
        }
        self.generics.clear();
        self.out.defs[def].kind = DefKind::Enum(variants);
    }

    fn fn_signature(&mut self, f: &FnDecl) -> Ty {
        self.generics = f.generics.iter().map(|g| g.name.clone()).collect();
        let params = f
            .params
            .iter()
            .map(|p| ParamTy {
                name: Some(p.name.name.clone()),
                ty: self.resolve_type(&p.ty),
                optional: p.default.is_some(),
                rest: false,
            })
            .collect();
        let ret = f.ret.as_ref().map_or(Ty::Unit, |r| self.resolve_type(r));
        self.generics.clear();
        Ty::Fn(Rc::new(FnTy {
            params,
            ret,
            is_async: f.is_async,
            generics: f.generics.len() as u32,
            ts: false,
        }))
    }

    /// A function's body; `member`: a view's `fn` (it reads the view's members).
    fn fn_body(&mut self, f: &FnDecl, member: bool) -> Ty {
        let signature = self.fn_signature(f);
        let Ty::Fn(fn_ty) = &signature else { unreachable!("a signature is a function") };
        let outer_generics =
            std::mem::replace(&mut self.generics, f.generics.iter().map(|g| g.name.clone()).collect());
        self.push();
        self.frames.push(Frame {
            ret: fn_ty.ret.clone(),
            is_async: f.is_async,
            closure: false,
            written: HashSet::new(),
            task: false,
            render: false,
            spawn: false,
        });
        let mut params = Vec::new();
        for (param, ty) in f.params.iter().zip(&fn_ty.params) {
            if let Some(default) = &param.default {
                self.expr(default, Some(&ty.ty));
            }
            params.push(self.declare(&param.name, ty.ty.clone(), LocalKind::Param));
        }
        self.out.fn_params.insert(f.span, params);
        let ret = fn_ty.ret.clone();
        self.block(&f.body, Some(&ret));
        self.frames.pop();
        self.pop();
        self.generics = outer_generics;
        let _ = member;
        signature
    }

    fn view_params(&mut self, v: &ViewDecl) -> Vec<ParamTy> {
        v.params
            .iter()
            .flatten()
            .map(|p| ParamTy {
                name: Some(p.name.name.clone()),
                ty: self.resolve_type(&p.ty),
                optional: p.default.is_some(),
                rest: false,
            })
            .collect()
    }

    fn view_decl(&mut self, index: usize, v: &ViewDecl) {
        self.view = Some(index);
        self.push();
        self.frames.push(Frame {
            ret: Ty::View(None),
            is_async: false,
            closure: false,
            written: HashSet::new(),
            task: false,
            render: true,
            spawn: false,
        });
        let mut info = ViewInfo::default();
        let params = self.view_params(v);
        for (param, ty) in v.params.iter().flatten().zip(params) {
            if let Some(default) = &param.default {
                self.expr(default, Some(&ty.ty));
            }
            info.props.push(self.declare(&param.name, ty.ty, LocalKind::Prop));
        }
        for member in &v.members {
            let locals = match member {
                Member::State(state) => {
                    let declared = state.ty.as_ref().map(|t| self.resolve_type(t));
                    let ty = match state.attr {
                        StateAttr::State => self.expr(&state.value, declared.as_ref()),
                        // A bloom-data store or an environment key: its value is the store's.
                        _ => {
                            self.boundary(&state.value, None);
                            declared.unwrap_or_else(|| Ty::Foreign("".into()))
                        }
                    };
                    let kind =
                        if state.attr == StateAttr::State { LocalKind::State } else { LocalKind::Hook };
                    vec![self.declare(&state.name, ty, kind)]
                }
                Member::Let(stmt) => {
                    self.hook_allowed = true;
                    self.was_hook = false;
                    let declared = stmt.ty.as_ref().map(|t| self.resolve_type(t));
                    let ty = self.expr(&stmt.value, declared.as_ref());
                    self.hook_allowed = false;
                    let kind = if self.was_hook { LocalKind::Hook } else { LocalKind::Derived };
                    self.bind_irrefutable(&stmt.pattern, &ty, kind)
                }
                Member::Fn(f) => {
                    let ty = self.fn_signature(f);
                    let local = self.declare(&f.name, ty, LocalKind::Handler);
                    self.fn_body(f, true);
                    vec![local]
                }
            };
            info.members.push(locals);
        }
        self.out.views.insert(index, info);
        self.body(&v.body);
        self.frames.pop();
        self.pop();
        self.view = None;
    }

    /// A view's `body { … }`: one view, whose root chain may carry `.task`.
    fn body(&mut self, block: &Block) {
        self.push();
        let mut views = 0;
        for stmt in &block.stmts {
            match &stmt.kind {
                StmtKind::Let(_) => self.stmt(stmt),
                StmtKind::Expr(expr) => {
                    views += 1;
                    if views == 2 {
                        self.report(
                            Diagnostic::error("B0504", expr.span, "a body is one view")
                                .label("a second view in the body")
                                .help("put the views in one container: `VStack { … }` or `Group { … }`")
                                .spec("71-a-view"),
                        );
                    }
                    self.task_allowed = true;
                    self.child(expr);
                    self.task_allowed = false;
                }
                _ => self.builder_line(stmt),
            }
        }
        if views == 0 {
            self.report(
                Diagnostic::error("B0504", block.span, "this body draws nothing")
                    .label("no view here")
                    .help("write the view the body draws: `body { Text(\"…\") }`")
                    .spec("71-a-view"),
            );
        }
        self.pop();
    }

    // ---- imports --------------------------------------------------------

    fn import(&mut self, import: &Import) {
        let specifier = match import.source.as_str() {
            "bloom/data" => "@oxy.so/bloom-data",
            "bloom/router" => "@oxy.so/bloom-language/router",
            "bloom/motion" => "@oxy.so/bloom-language",
            other => other,
        };
        if specifier.ends_with(".bloom") {
            self.import_bloom(import, specifier);
            return;
        }
        // `import { Row } from "./Row"`: a `.bloom` module when one is there, never both.
        let relative = specifier.starts_with("./") || specifier.starts_with("../");
        if relative && Path::new(specifier).extension().is_none() {
            let with_extension = format!("{specifier}.bloom");
            if self.path.parent().unwrap_or(Path::new(".")).join(&with_extension).is_file() {
                if let Some(ts_path) = ts::resolve(&self.path, specifier, self.options) {
                    self.report(
                        Diagnostic::error("B0610", import.source_span, format!("\"{specifier}\" is both a .bloom module and a TS module"))
                            .label(format!("also `{}`", ts_path.file_name().map_or(String::new(), |n| n.to_string_lossy().into_owned())))
                            .help(format!("remove one of them, or import the one you mean with its extension: \"{with_extension}\""))
                            .spec("10-modules-and-interop"),
                    );
                    return;
                }
                self.import_bloom(import, &with_extension);
                return;
            }
        }
        let file = ts::resolve(&self.path, specifier, self.options).and_then(|path| ts::read(&path));
        if file.is_none() {
            self.out.diagnostics.push(
                Diagnostic::warning(
                    "B0602",
                    import.source_span,
                    format!("cannot find TS declarations for \"{}\"", import.source),
                )
                .label("its names are `Foreign`: annotate them before Bloom logic uses them")
                .help("check the path, the `paths` map or that the package is installed")
                .spec("47-the-foreign-boundary"),
            );
        }
        match &import.kind {
            ImportKind::Namespace(name) => {
                self.declare_unique(
                    name,
                    Ty::Foreign(format!("typeof {}", name.name).into()),
                    LocalKind::Import { hook: false },
                );
            }
            ImportKind::Named(specs) => {
                for spec in specs {
                    let local = spec.local().clone();
                    let mapped = match &file {
                        Some(file) => {
                            let mut mapper = ts::Mapper {
                                defs: &mut self.out.defs,
                                options: self.options,
                                named: &mut self.ts_named,
                            };
                            let mapped = mapper.export(file, &spec.name.name, &local.name, 0);
                            if mapped.is_none() {
                                let exports: Vec<&str> = file.exports.keys().map(String::as_str).collect();
                                let help = closest(&spec.name.name, exports.iter().copied())
                                    .map(|near| format!("did you mean `{near}`?"));
                                self.report(
                                    Diagnostic::error(
                                        "B0603",
                                        spec.name.span,
                                        format!("\"{}\" has no export `{}`", import.source, spec.name.name),
                                    )
                                    .label("not exported there")
                                    .maybe_help(help)
                                    .spec("10-modules-and-interop"),
                                );
                            }
                            mapped.unwrap_or_default()
                        }
                        None => ts::Mapped {
                            value: Some(Ty::Foreign(format!("typeof {}", local.name).into())),
                            ty: None,
                            component: None,
                        },
                    };
                    if mapped.value.is_none() && mapped.component.is_none() && mapped.ty.is_some() {
                        self.out.type_only_imports.insert(spec.span);
                    }
                    if let Some(ty) = mapped.ty {
                        self.type_names.insert(local.name.clone(), TypeName::Ty(ty));
                        self.out.type_imports.push(local.name.clone());
                    }
                    if spec.type_only {
                        continue;
                    }
                    let hook = is_hook_name(&local.name);
                    if let Some(props) = mapped.component {
                        self.declare_unique(&local, Ty::View(Some("embed")), LocalKind::Component { props });
                    } else if let Some(value) = mapped.value {
                        self.declare_unique(&local, value, LocalKind::Import { hook });
                    }
                }
            }
        }
    }

    fn import_bloom(&mut self, import: &Import, specifier: &str) {
        let path = self.path.parent().unwrap_or(Path::new(".")).join(specifier);
        let Ok(source) = std::fs::read_to_string(&path) else {
            self.report(
                Diagnostic::error("B0602", import.source_span, format!("cannot read \"{}\"", import.source))
                    .label("no such .bloom file")
                    .help("check the path: it is relative to this file")
                    .spec("10-modules-and-interop"),
            );
            return;
        };
        let (file, _, _) = crate::parser::parse(&source);
        let options = self.options;
        let mut sub = Checker::new(&source, &path.to_string_lossy(), options);
        sub.out.defs = std::mem::take(&mut self.out.defs);
        sub.declare_signatures(&file, specifier);
        self.out.defs = std::mem::take(&mut sub.out.defs);
        let ImportKind::Named(specs) = &import.kind else {
            self.report(
                Diagnostic::error("B0603", import.span, "a .bloom module is imported by name")
                    .label("`* as` is for TS modules")
                    .help("import the names: `import { Row } from \"./Row.bloom\"`")
                    .spec("10-modules-and-interop"),
            );
            return;
        };
        for spec in specs {
            let local = spec.local().clone();
            if let Some(TypeName::Def(def)) = sub.type_names.get(&spec.name.name).cloned() {
                self.type_names.insert(local.name.clone(), TypeName::Def(def));
                self.out.type_imports.push(local.name.clone());
                self.out.type_only_imports.insert(spec.span);
                continue;
            }
            match sub.lookup(&spec.name.name).map(|id| sub.out.locals[id].clone()) {
                Some(found) => {
                    let ty = sub.zonk(&found.ty);
                    self.declare_unique(&local, ty, found.kind);
                }
                None => {
                    self.report(
                        Diagnostic::error(
                            "B0603",
                            spec.name.span,
                            format!("\"{}\" has no `pub` item `{}`", import.source, spec.name.name),
                        )
                        .label("not exported there")
                        .help("mark it `pub` in its module")
                        .spec("10-modules-and-interop"),
                    );
                }
            }
        }
    }

    /// Another module's `pub` types and signatures, for an import.
    fn declare_signatures(&mut self, file: &File, specifier: &str) {
        for import in &file.imports {
            if !import.source.ends_with(".bloom") {
                self.import(import);
            }
        }
        let first = self.out.defs.len();
        for item in &file.items {
            let (name, generics, kind) = match &item.kind {
                ItemKind::Struct(s) => (&s.name, &s.generics, DefKind::Struct(Vec::new())),
                ItemKind::Enum(e) => (&e.name, &e.generics, DefKind::Enum(Vec::new())),
                _ => continue,
            };
            let def = self.out.defs.len();
            self.out.defs.push(Def {
                name: name.name.clone(),
                generics: generics.iter().map(|g| g.name.clone()).collect(),
                kind,
                origin: Origin::Bloom { specifier: specifier.to_string() },
            });
            self.type_names.insert(name.name.clone(), TypeName::Def(def));
        }
        for item in &file.items {
            match &item.kind {
                ItemKind::Struct(s) => {
                    self.struct_fields(s);
                    let Some(TypeName::Def(def)) = self.type_names.get(&s.name.name).cloned() else {
                        continue;
                    };
                    if let DefKind::Struct(fields) = &mut self.out.defs[def].kind {
                        for (field, decl) in fields.iter_mut().zip(&s.fields) {
                            field.default = match &decl.default {
                                Some(expr) => {
                                    literal_text(expr).map_or(FieldDefault::None, FieldDefault::Literal)
                                }
                                None => FieldDefault::None,
                            };
                        }
                    }
                }
                ItemKind::Enum(e) => self.enum_variants(e),
                ItemKind::Alias(a) => {
                    let ty = self.resolve_type(&a.ty);
                    self.type_names.insert(a.name.name.clone(), TypeName::Alias(ty, a.generics.len()));
                }
                _ => {}
            }
        }
        let _ = first;
        for item in &file.items {
            if item.visibility == Visibility::Private {
                continue;
            }
            match &item.kind {
                ItemKind::Fn(f) => {
                    let ty = self.fn_signature(f);
                    self.declare(&f.name, ty, LocalKind::ModuleFn);
                }
                ItemKind::View(v) if v.kind == ViewKind::View => {
                    let params = self.view_params(v);
                    let ty = Ty::Fn(Rc::new(FnTy {
                        params,
                        ret: Ty::View(Some("view")),
                        is_async: false,
                        generics: 0,
                        ts: false,
                    }));
                    self.declare(&v.name, ty, LocalKind::View);
                }
                ItemKind::Const(c) => {
                    let ty = match &c.ty {
                        Some(t) => self.resolve_type(t),
                        None => self.expr(&c.value, None),
                    };
                    self.declare(&c.name, ty, LocalKind::ModuleConst);
                }
                _ => {}
            }
        }
    }

    // ---- statements -----------------------------------------------------

    /// A block's value: its last line when that is an expression.
    fn block(&mut self, block: &Block, expected: Option<&Ty>) -> Ty {
        self.push();
        let ty = self.stmts(&block.stmts, expected, block.span);
        self.pop();
        ty
    }

    fn stmts(&mut self, stmts: &[Stmt], expected: Option<&Ty>, span: Span) -> Ty {
        let discard = expected.is_some_and(|e| self.resolve(e) == Ty::Unit);
        let mut ty = Ty::Unit;
        for (index, stmt) in stmts.iter().enumerate() {
            let last = index + 1 == stmts.len();
            match &stmt.kind {
                StmtKind::Expr(expr) if last && !discard => {
                    ty = self.expr(expr, expected);
                }
                StmtKind::Return(_) => {
                    self.stmt(stmt);
                    ty = Ty::Never;
                }
                _ => {
                    self.stmt(stmt);
                    if last {
                        ty = Ty::Unit;
                    }
                }
            }
        }
        if let Some(expected) = expected
            && !discard
            && !matches!(stmts.last().map(|s| &s.kind), Some(StmtKind::Expr(_) | StmtKind::Return(_)))
        {
            let expected = expected.clone();
            if !self.coerce(&Ty::Unit, &expected) {
                let at = stmts.last().map_or(span, |s| s.span);
                self.report(
                    Diagnostic::error(
                        "B0201",
                        at,
                        format!("this block gives no value; expected {}", self.show(&expected)),
                    )
                    .label("the last line is not an expression")
                    .help("end the block with the value (the last expression is the result)")
                    .spec("5-values-functions-and-closures"),
                );
            }
            return expected;
        }
        if discard { Ty::Unit } else { ty }
    }

    fn stmt(&mut self, stmt: &Stmt) {
        match &stmt.kind {
            StmtKind::Let(l) => {
                let declared = l.ty.as_ref().map(|t| self.resolve_type(t));
                let ty = self.expr(&l.value, declared.as_ref());
                self.bind_irrefutable(&l.pattern, &ty, LocalKind::Let);
            }
            StmtKind::Var(v) => {
                let declared = v.ty.as_ref().map(|t| self.resolve_type(t));
                let ty = self.expr(&v.value, declared.as_ref());
                self.declare(&v.name, ty, LocalKind::Var);
            }
            StmtKind::Assign(a) => self.assign(a),
            StmtKind::Return(value) => {
                let ret = self.frames.last().expect("a frame").ret.clone();
                match value {
                    Some(value) => {
                        self.expr(value, Some(&ret));
                    }
                    None => {
                        if !self.coerce(&Ty::Unit, &ret) {
                            self.report(
                                Diagnostic::error(
                                    "B0201",
                                    stmt.span,
                                    format!(
                                        "`return` needs a value: this function returns {}",
                                        self.show(&ret)
                                    ),
                                )
                                .label("no value")
                                .spec("5-values-functions-and-closures"),
                            );
                        }
                    }
                }
            }
            StmtKind::While(w) => {
                self.expr(&w.cond, Some(&Ty::Bool));
                self.block(&w.body, Some(&Ty::Unit));
            }
            StmtKind::For(f) => {
                let elem = self.iterable(&f.iter);
                self.push();
                self.bind_irrefutable(&f.pattern, &elem, LocalKind::Let);
                self.stmts(&f.body.stmts, Some(&Ty::Unit), f.body.span);
                self.pop();
            }
            StmtKind::Defer(block) => {
                self.block(block, Some(&Ty::Unit));
            }
            StmtKind::Expr(expr) => {
                let ty = self.expr(expr, None);
                if matches!(self.resolve(&ty), Ty::Async(_) | Ty::Promise(_))
                    && !self.frames.last().is_some_and(|f| f.spawn)
                {
                    self.report(
                        Diagnostic::error(
                            "B0430",
                            expr.span,
                            "this async call is neither awaited nor started as a task",
                        )
                        .label("its result (and any failure) would be dropped")
                        .help("write `await` before it, or start it on its own: `task { await … }`")
                        .spec("8-effects-tasks-and-concurrency"),
                    );
                }
            }
        }
    }

    /// The element type of what `for … in` walks.
    fn iterable(&mut self, expr: &Expr) -> Ty {
        let ty = self.expr(expr, None);
        match self.resolve(&ty) {
            Ty::List(elem) => *elem,
            Ty::Map(value) => Ty::Tuple(vec![Ty::Str, *value]),
            Ty::Unknown => Ty::Unknown,
            Ty::Var(_) => {
                let elem = self.fresh();
                self.unify(&ty, &Ty::List(Box::new(elem.clone())));
                elem
            }
            other => {
                self.report(
                    Diagnostic::error(
                        "B0201",
                        expr.span,
                        format!("`for … in` walks a list, not {}", self.show(&other)),
                    )
                    .label("not a list")
                    .spec("6-expressions-and-control-flow"),
                );
                Ty::Unknown
            }
        }
    }

    fn assign(&mut self, a: &AssignStmt) {
        let mut fields = Vec::new();
        let mut root = &a.target;
        while let ExprKind::Field(inner, name) = &root.kind {
            fields.push(name.name.clone());
            root = inner;
        }
        fields.reverse();
        let ExprKind::Name(name) = &root.kind else { return };
        self.out.assign_targets.insert(root.id);
        let Some(local) = self.lookup(name) else {
            self.expr(&a.target, None);
            self.expr(&a.value, None);
            return;
        };
        let info = self.out.locals[local].clone();
        let mutable = matches!(info.kind, LocalKind::State | LocalKind::Var);
        if !mutable {
            let help = match info.kind {
                LocalKind::Let | LocalKind::Derived => format!(
                    "declare it with `var {name} = …` (in a function) or make it `@state {name} = …` (in a view)"
                ),
                LocalKind::Prop => {
                    "a prop is its parent's: take a binding (`Binding<T>`) or a callback to change it"
                        .to_string()
                }
                _ => "only a `@state` or a `var` can be assigned".to_string(),
            };
            self.report(
                Diagnostic::error(
                    "B0403",
                    a.target.span,
                    format!("cannot assign to `{name}`: it is immutable"),
                )
                .label("immutable")
                .with_label(info.span, "declared here")
                .help(help)
                .spec("43-soundness-rules"),
            );
        }
        if info.kind == LocalKind::Var && info.frame != self.frames.len() - 1 {
            self.var_captured(&info, a.target.span);
        }
        // The place's type, field by field.
        let place_ty = {
            let mut ty = info.ty.clone();
            for field in &fields {
                ty = match self.resolve(&ty) {
                    Ty::Adt(def, args) => match self.out.defs[def].fields().iter().find(|f| f.name == *field)
                    {
                        Some(f) => substitute(&f.ty, &args),
                        None => {
                            self.expr(&a.target, None);
                            Ty::Unknown
                        }
                    },
                    _ => {
                        self.expr(&a.target, None);
                        Ty::Unknown
                    }
                };
            }
            ty
        };
        if info.kind == LocalKind::State && self.frames.last().is_some_and(|f| f.render) {
            self.report(
                Diagnostic::error(
                    "B0401",
                    a.target.span,
                    format!("`{name}` is written while the view draws"),
                )
                .label("a state changes in an event, not in the body or a derived value")
                .help("write it in a handler (`fn`, `.onPress { … }`) or a `.task { … }`")
                .spec("73-reactivity-compile-time"),
            );
        }
        let reads_self = reads_name(&a.value, name);
        match a.op {
            AssignOp::Set => {
                self.expr(&a.value, Some(&place_ty));
            }
            op => {
                let value = self.expr(&a.value, Some(&place_ty));
                let numeric = matches!(self.resolve(&place_ty), Ty::Int | Ty::Float | Ty::Unknown);
                let text = op == AssignOp::Add && matches!(self.resolve(&place_ty), Ty::Str);
                if !numeric && !text {
                    self.report(
                        Diagnostic::error(
                            "B0201",
                            a.span,
                            format!("`{}` needs a number, found {}", op.text(), self.show(&value)),
                        )
                        .label("not a number")
                        .spec("61-precedence-high-to-low"),
                    );
                }
            }
        }
        let functional = reads_self || a.op != AssignOp::Set || !fields.is_empty();
        let res = if info.kind == LocalKind::State {
            self.frames.last_mut().expect("a frame").written.insert(local);
            AssignRes::State { local, fields, functional }
        } else {
            AssignRes::Var { local, fields }
        };
        self.out.assigns.insert(a.span, res);
    }

    fn var_captured(&mut self, info: &Local, span: Span) {
        self.report(
            Diagnostic::error(
                "B0402",
                span,
                format!("`{}` is a `var`, and a closure cannot capture it", info.name),
            )
            .label("captured here")
            .with_label(info.span, "declared here")
            .help("bind its value to a `let` before the closure, or make it `@state`")
            .spec("43-soundness-rules"),
        );
    }

    // ---- builders -------------------------------------------------------

    /// A builder's lines (spec 7.2): views, `if`, `match`, `for` and `let`.
    fn builder(&mut self, stmts: &[Stmt]) {
        self.push();
        for stmt in stmts {
            self.builder_line(stmt);
        }
        self.pop();
    }

    fn builder_line(&mut self, stmt: &Stmt) {
        match &stmt.kind {
            StmtKind::Let(_) => self.stmt(stmt),
            StmtKind::Expr(expr) => self.child(expr),
            StmtKind::For(f) => {
                let elem = self.iterable(&f.iter);
                self.push();
                self.bind_irrefutable(&f.pattern, &elem, LocalKind::Let);
                self.builder(&f.body.stmts);
                self.pop();
            }
            _ => self.report(
                Diagnostic::error("B0504", stmt.span, "a builder line is a view")
                    .label("not a view, `if`, `for`, `match` or `let`")
                    .help("do this in a handler (`fn`, `.onPress { … }`); a builder only lists children")
                    .spec("72-builders-modifiers-and-tokens"),
            ),
        }
    }

    /// One child: a view, an optional view, a list of views, or a builder `if`/`match`.
    fn child(&mut self, expr: &Expr) {
        match &expr.kind {
            ExprKind::If(if_expr) => {
                self.record(expr, Ty::View(None));
                self.push();
                self.cond(&if_expr.cond);
                self.builder(&if_expr.then.stmts);
                self.pop();
                match if_expr.otherwise.as_deref() {
                    Some(Else::If(next)) => self.child(next),
                    Some(Else::Block(block)) => self.builder(&block.stmts),
                    None => {}
                }
            }
            ExprKind::Match(m) => {
                self.record(expr, Ty::View(None));
                self.match_arms(m, expr.span, &mut |checker, body| match body {
                    ArmBody::Expr(e) => {
                        checker.child(e);
                        Ty::View(None)
                    }
                    ArmBody::Block(b) => {
                        checker.builder(&b.stmts);
                        Ty::View(None)
                    }
                });
            }
            _ => {
                let ty = self.expr(expr, Some(&Ty::View(None)));
                let _ = ty;
            }
        }
    }

    fn record(&mut self, expr: &Expr, ty: Ty) {
        self.out.types.insert(expr.id, ty.clone());
        self.out.spans.push((expr.span, ty));
    }

    // ---- patterns -------------------------------------------------------

    fn bind_irrefutable(&mut self, pattern: &Pattern, ty: &Ty, kind: LocalKind) -> Vec<LocalId> {
        let mut locals = Vec::new();
        self.bind(pattern, ty, &kind, &mut locals);
        let row = vec![self.to_pat(pattern)];
        let ty = self.zonk(ty);
        if !matches!(pattern.kind, PatternKind::Bind(_) | PatternKind::Wildcard)
            && !matches!(ty, Ty::Unknown | Ty::Foreign(_))
        {
            let missing = exhaust::missing(&[row], &ty, &self.out.defs);
            if !missing.is_empty() {
                self.report(
                    Diagnostic::error("B0304", pattern.span, "this pattern may not match")
                        .label(format!("it does not match {}", missing.join(", ")))
                        .help("use `if let` or `match` for a pattern that can fail")
                        .spec("45-enums-option-and-result"),
                );
            }
        }
        locals
    }

    /// Declares the names `pattern` binds, checking it against `ty`.
    fn bind(&mut self, pattern: &Pattern, ty: &Ty, kind: &LocalKind, locals: &mut Vec<LocalId>) {
        self.out.pattern_tys.insert(pattern.span, ty.clone());
        let resolved = self.resolve(ty);
        match &pattern.kind {
            PatternKind::Wildcard => {}
            PatternKind::Bind(name) => {
                let local = self.declare(name, ty.clone(), kind.clone());
                self.out.pattern_locals.insert(name.span, local);
                locals.push(local);
            }
            PatternKind::Literal(expr) => {
                self.expr(expr, Some(ty));
            }
            PatternKind::None => {
                if !matches!(resolved, Ty::Option(_) | Ty::Unknown | Ty::Var(_)) {
                    self.pattern_mismatch(pattern, "`none`", &resolved);
                }
            }
            PatternKind::Tuple(items) => {
                let tys = match &resolved {
                    Ty::Tuple(tys) if tys.len() == items.len() => tys.clone(),
                    Ty::Unknown | Ty::Foreign(_) => vec![resolved.clone(); items.len()],
                    Ty::Var(_) => {
                        let tys: Vec<Ty> = items.iter().map(|_| self.fresh()).collect();
                        self.unify(&resolved, &Ty::Tuple(tys.clone()));
                        tys
                    }
                    _ => {
                        self.pattern_mismatch(pattern, &format!("a tuple of {}", items.len()), &resolved);
                        vec![Ty::Unknown; items.len()]
                    }
                };
                for (item, ty) in items.iter().zip(tys) {
                    self.bind(item, &ty, kind, locals);
                }
            }
            PatternKind::Record(fields) => {
                for (name, sub) in fields {
                    let field_ty = match &resolved {
                        Ty::Adt(def, args) => {
                            match self.out.defs[*def].fields().iter().find(|f| f.name == name.name) {
                                Some(f) => substitute(&f.ty, args),
                                None => {
                                    self.unknown_field(name, &resolved);
                                    Ty::Unknown
                                }
                            }
                        }
                        Ty::Foreign(text) => Ty::Foreign(format!("{text}[\"{}\"]", name.name).into()),
                        Ty::Unknown => Ty::Unknown,
                        _ => {
                            self.pattern_mismatch(pattern, "a struct", &resolved);
                            Ty::Unknown
                        }
                    };
                    match sub {
                        Some(sub) => self.bind(sub, &field_ty, kind, locals),
                        None => {
                            let local = self.declare(name, field_ty, kind.clone());
                            self.out.pattern_locals.insert(name.span, local);
                            locals.push(local);
                        }
                    }
                }
            }
            PatternKind::Or(alternatives) => {
                for alternative in alternatives {
                    let before = locals.len();
                    self.bind(alternative, ty, kind, locals);
                    if locals.len() > before {
                        self.report(
                            Diagnostic::error(
                                "B0303",
                                alternative.span,
                                "the alternatives of `|` bind no names in phase 0",
                            )
                            .label("a name bound here")
                            .help("write one `case` per alternative that binds")
                            .spec("45-enums-option-and-result"),
                        );
                    }
                }
            }
            PatternKind::Case { ty: qualifier, name, args } => {
                let payload = self.case_payload(pattern, qualifier.as_ref(), name, &resolved);
                let Some(payload) = payload else {
                    for arg in args.iter().flatten() {
                        self.bind(arg, &Ty::Unknown, kind, locals);
                    }
                    return;
                };
                if let Some(args) = args {
                    if args.len() != payload.len() {
                        self.report(
                            Diagnostic::error(
                                "B0303",
                                pattern.span,
                                format!(
                                    "`.{}` carries {} value(s), not {}",
                                    name.name,
                                    payload.len(),
                                    args.len()
                                ),
                            )
                            .label("wrong number of patterns")
                            .help(if payload.is_empty() {
                                format!("write `.{}` without parentheses", name.name)
                            } else {
                                format!("write {} pattern(s), `_` for one you skip", payload.len())
                            })
                            .spec("45-enums-option-and-result"),
                        );
                    }
                    for (arg, ty) in args.iter().zip(payload.iter().chain(std::iter::repeat(&Ty::Unknown))) {
                        self.bind(arg, ty, kind, locals);
                    }
                }
            }
        }
    }

    /// The payload types of the case `name` of `ty`, or `None` after reporting.
    fn case_payload(
        &mut self,
        pattern: &Pattern,
        qualifier: Option<&Ident>,
        name: &Ident,
        ty: &Ty,
    ) -> Option<Vec<Ty>> {
        match ty {
            Ty::Option(inner) => match name.name.as_str() {
                "some" => Some(vec![(**inner).clone()]),
                "none" => Some(vec![]),
                _ => {
                    self.unknown_case(name, &["some", "none"], ty);
                    None
                }
            },
            Ty::Result(ok, err) => match name.name.as_str() {
                "ok" => Some(vec![(**ok).clone()]),
                "err" => Some(vec![(**err).clone()]),
                _ => {
                    self.unknown_case(name, &["ok", "err"], ty);
                    None
                }
            },
            Ty::Adt(def, args) if matches!(self.out.defs[*def].kind, DefKind::Enum(_)) => {
                let d = self.out.defs[*def].clone();
                if let Some(q) = qualifier
                    && q.name != d.name
                {
                    self.pattern_mismatch(pattern, &format!("`{}`", q.name), ty);
                    return None;
                }
                match d.variants().iter().find(|v| v.name == name.name) {
                    Some(v) => Some(v.payload.iter().map(|(_, t)| substitute(t, args)).collect()),
                    None => {
                        let names: Vec<&str> = d.variants().iter().map(|v| v.name.as_str()).collect();
                        self.unknown_case(name, &names, ty);
                        None
                    }
                }
            }
            Ty::Unknown => None,
            other => {
                self.pattern_mismatch(pattern, &format!("a case `.{}`", name.name), other);
                None
            }
        }
    }

    fn unknown_case(&mut self, name: &Ident, cases: &[&str], ty: &Ty) {
        let help = match closest(&name.name, cases.iter().copied()) {
            Some(near) => format!(
                "did you mean `.{near}`? the cases are {}",
                cases.iter().map(|c| format!("`.{c}`")).collect::<Vec<_>>().join(", ")
            ),
            None => format!(
                "the cases are {}",
                cases.iter().map(|c| format!("`.{c}`")).collect::<Vec<_>>().join(", ")
            ),
        };
        self.report(
            Diagnostic::error("B0216", name.span, format!("{} has no case `.{}`", self.show(ty), name.name))
                .label("no such case")
                .help(help)
                .spec("45-enums-option-and-result"),
        );
    }

    fn unknown_field(&mut self, name: &Ident, ty: &Ty) {
        let fields: Vec<String> = match self.resolve(ty) {
            Ty::Adt(def, _) => self.out.defs[def].fields().iter().map(|f| f.name.clone()).collect(),
            _ => Vec::new(),
        };
        let help = closest(&name.name, fields.iter().map(String::as_str))
            .map(|near| format!("did you mean `{near}`?"))
            .or_else(|| {
                (!fields.is_empty()).then(|| {
                    format!(
                        "its fields are {}",
                        fields.iter().map(|f| format!("`{f}`")).collect::<Vec<_>>().join(", ")
                    )
                })
            });
        self.report(
            Diagnostic::error("B0205", name.span, format!("{} has no field `{}`", self.show(ty), name.name))
                .label("no such field")
                .maybe_help(help)
                .spec("44-structs"),
        );
    }

    fn pattern_mismatch(&mut self, pattern: &Pattern, what: &str, ty: &Ty) {
        self.report(
            Diagnostic::error("B0303", pattern.span, format!("{what} cannot match {}", self.show(ty)))
                .label(format!("the value is {}", self.show(ty)))
                .spec("45-enums-option-and-result"),
        );
    }

    /// A pattern in the exhaustiveness checker's terms.
    fn to_pat(&self, pattern: &Pattern) -> Pat {
        let ty = self.out.pattern_tys.get(&pattern.span).map(|t| self.zonk(t)).unwrap_or(Ty::Unknown);
        match &pattern.kind {
            PatternKind::Wildcard | PatternKind::Bind(_) => Pat::Wild,
            PatternKind::None => Pat::Ctor("none".into(), vec![]),
            PatternKind::Literal(expr) => match &expr.kind {
                ExprKind::Bool(b) => Pat::Ctor(b.to_string(), vec![]),
                ExprKind::Str { parts, .. } if matches!(ty, Ty::Strings(_)) => {
                    Pat::Ctor(format!("\"{}\"", plain_text(parts)), vec![])
                }
                ExprKind::Str { parts, .. } => Pat::Lit(format!("\"{}\"", plain_text(parts))),
                _ => Pat::Lit(self.source[expr.span.start as usize..expr.span.end as usize].to_string()),
            },
            PatternKind::Tuple(items) => {
                Pat::Ctor("tuple".into(), items.iter().map(|p| self.to_pat(p)).collect())
            }
            PatternKind::Record(fields) => match &ty {
                Ty::Adt(def, _) => {
                    let pats = self.out.defs[*def]
                        .fields()
                        .iter()
                        .map(|f| {
                            fields
                                .iter()
                                .find(|(name, _)| name.name == f.name)
                                .and_then(|(_, sub)| sub.as_ref())
                                .map_or(Pat::Wild, |sub| self.to_pat(sub))
                        })
                        .collect();
                    Pat::Ctor("struct".into(), pats)
                }
                _ => Pat::Wild,
            },
            PatternKind::Case { name, args, .. } => {
                let ctor = match (&ty, name.name.as_str()) {
                    (Ty::Option(_), "some" | "none") | (Ty::Result(..), "ok" | "err") => name.name.clone(),
                    _ => format!(".{}", name.name),
                };
                Pat::Ctor(ctor, args.iter().flatten().map(|p| self.to_pat(p)).collect())
            }
            // An alternative is expanded by the caller.
            PatternKind::Or(_) => Pat::Wild,
        }
    }

    /// The rows an arm contributes: one per alternative of `|`.
    fn rows(&self, pattern: &Pattern) -> Vec<Pat> {
        match &pattern.kind {
            PatternKind::Or(alternatives) => alternatives.iter().flat_map(|a| self.rows(a)).collect(),
            _ => vec![self.to_pat(pattern)],
        }
    }

    // ---- control flow ---------------------------------------------------

    fn cond(&mut self, cond: &Cond) {
        match cond {
            Cond::Expr(expr) => {
                self.expr(expr, Some(&Ty::Bool));
            }
            Cond::Let(pattern, value) => {
                let ty = self.expr(value, None);
                // `if let v = optional`: a bare name unwraps.
                let resolved = self.resolve(&ty);
                let bound = match (&pattern.kind, &resolved) {
                    (PatternKind::Bind(_), Ty::Option(inner)) => (**inner).clone(),
                    (PatternKind::Bind(_), Ty::Foreign(_) | Ty::Unknown) => resolved.clone(),
                    (PatternKind::Bind(name), _) => {
                        self.report(
                            Diagnostic::error(
                                "B0303",
                                value.span,
                                format!(
                                    "`if let {} = …` unwraps an optional, and this is {}",
                                    name.name,
                                    self.show(&resolved)
                                ),
                            )
                            .label("never `none`")
                            .help(format!(
                                "bind it with `let {} = …`, or match a case: `if let .ready(x) = …`",
                                name.name
                            ))
                            .spec("45-enums-option-and-result"),
                        );
                        resolved.clone()
                    }
                    _ => ty.clone(),
                };
                let mut locals = Vec::new();
                self.bind(pattern, &bound, &LocalKind::Let, &mut locals);
                // The value it unwraps, for the emitter.
                self.out.pattern_tys.insert(value.span, ty);
            }
        }
    }

    fn if_expr(&mut self, if_expr: &IfExpr, expected: Option<&Ty>, span: Span) -> Ty {
        self.push();
        self.cond(&if_expr.cond);
        let Some(otherwise) = if_expr.otherwise.as_deref() else {
            self.block(&if_expr.then, Some(&Ty::Unit));
            self.pop();
            return Ty::Unit;
        };
        let then = self.block(&if_expr.then, expected);
        self.pop();
        let other = match otherwise {
            Else::If(next) => self.expr(next, expected.or(Some(&then))),
            Else::Block(block) => self.block(block, expected.or(Some(&then))),
        };
        self.join(&then, &other, span)
    }

    /// The type of two branches together: `T` and `none` make `T?`.
    fn join(&mut self, a: &Ty, b: &Ty, span: Span) -> Ty {
        let ra = self.resolve(a);
        let rb = self.resolve(b);
        match (&ra, &rb) {
            (Ty::Never, _) => rb,
            (_, Ty::Never) => ra,
            (Ty::Option(_), _) if self.coerce(&rb, &ra) => ra,
            (_, Ty::Option(_)) if self.coerce(&ra, &rb) => rb,
            (Ty::Strings(_), Ty::Str) | (Ty::Str, Ty::Strings(_)) => Ty::Str,
            (Ty::Strings(x), Ty::Strings(y)) if x.token && x.name == y.name => ra,
            (Ty::Strings(x), Ty::Strings(y)) if !x.token && !y.token => {
                let mut values = x.values.clone();
                values.extend(y.values.iter().filter(|v| !x.values.contains(v)).cloned());
                let name = values.iter().map(|v| format!("\"{v}\"")).collect::<Vec<_>>().join(" | ");
                Ty::Strings(Rc::new(StrSet { name, values, token: false }))
            }
            _ => {
                if !self.coerce(&rb, &ra) {
                    self.report(
                        Diagnostic::error(
                            "B0201",
                            span,
                            format!("the branches give {} and {}", self.show(&ra), self.show(&rb)),
                        )
                        .label("every branch gives the same type")
                        .spec("6-expressions-and-control-flow"),
                    );
                }
                ra
            }
        }
    }

    /// Checks a `match`'s arms (exhaustive, reachable); `arm` checks each body.
    fn match_arms(
        &mut self,
        m: &MatchExpr,
        span: Span,
        arm: &mut dyn FnMut(&mut Self, &ArmBody) -> Ty,
    ) -> Vec<Ty> {
        let scrutinee = self.expr(&m.scrutinee, None);
        let scrutinee = self.resolve(&scrutinee);
        self.out.pattern_tys.insert(m.scrutinee.span, scrutinee.clone());
        let mut rows: Vec<Vec<Pat>> = Vec::new();
        let mut tys = Vec::new();
        let zonked = self.zonk(&scrutinee);
        for a in &m.arms {
            self.push();
            let mut locals = Vec::new();
            self.bind(&a.pattern, &scrutinee, &LocalKind::Let, &mut locals);
            if let Some(guard) = &a.guard {
                self.expr(guard, Some(&Ty::Bool));
            }
            let arm_rows = self.rows(&a.pattern);
            let reachable = arm_rows.iter().any(|row| {
                exhaust::useful(
                    &rows,
                    std::slice::from_ref(row),
                    std::slice::from_ref(&zonked),
                    &self.out.defs,
                )
            });
            if !reachable && !matches!(zonked, Ty::Unknown | Ty::Foreign(_)) {
                self.out.diagnostics.push(
                    Diagnostic::warning("B0302", a.pattern.span, "this arm is never reached")
                        .label("the arms above match every value it matches")
                        .help("remove it, or move it above the arm that covers it")
                        .spec("43-soundness-rules"),
                );
            }
            if a.guard.is_none() {
                rows.extend(arm_rows.into_iter().map(|p| vec![p]));
            }
            tys.push(arm(self, &a.body));
            self.pop();
        }
        if matches!(zonked, Ty::Foreign(_)) {
            self.report(
                Diagnostic::error("B0601", m.scrutinee.span, "a `Foreign` value is matched")
                    .label("Bloom cannot check these patterns against a TS value it could not type")
                    .help("annotate it first: `let value: T = …`, then `match value`")
                    .spec("47-the-foreign-boundary"),
            );
        }
        if !matches!(zonked, Ty::Unknown | Ty::Foreign(_)) {
            let missing = exhaust::missing(&rows, &zonked, &self.out.defs);
            if !missing.is_empty() {
                let list = missing.iter().map(|m| format!("`{m}`")).collect::<Vec<_>>().join(", ");
                let arms: String = missing.iter().map(|m| format!("\n      case {m} => …")).collect();
                self.report(
                    Diagnostic::error("B0301", m.scrutinee.span, format!("this match does not cover {list}"))
                        .label(format!("{} is not matched by every value", self.show(&zonked)))
                        .help(format!("add the missing arm(s), or `case _ =>` for the rest:{arms}"))
                        .spec("43-soundness-rules"),
                );
            }
        }
        let _ = span;
        tys
    }

    fn match_expr(&mut self, m: &MatchExpr, expected: Option<&Ty>, span: Span) -> Ty {
        let expected = expected.cloned();
        let tys = self.match_arms(m, span, &mut |checker, body| match body {
            ArmBody::Expr(e) => checker.expr(e, expected.as_ref()),
            ArmBody::Block(b) => checker.block(b, expected.as_ref()),
        });
        let mut ty = Ty::Never;
        for arm_ty in tys {
            ty = self.join(&ty, &arm_ty, span);
        }
        ty
    }

    // ---- expressions ----------------------------------------------------

    /// Checks `expr` against `expected` (when there is one) and records its type.
    pub fn expr(&mut self, expr: &Expr, expected: Option<&Ty>) -> Ty {
        let ty = self.infer(expr, expected);
        self.out.types.insert(expr.id, ty.clone());
        self.out.spans.push((expr.span, ty.clone()));
        match expected {
            Some(expected) => {
                // A TS value Bloom could not type is accepted where a type is
                // expected; the emitted `satisfies` lets TypeScript check it (spec 4.7).
                if matches!(self.resolve(&ty), Ty::Foreign(_))
                    && !matches!(self.resolve(expected), Ty::Unknown | Ty::Foreign(_))
                {
                    if let Ty::Fn(f) = self.resolve(expected)
                        && f.is_async
                    {
                        let params: Vec<String> =
                            f.params.iter().map(|p| self.show(&p.ty).trim_matches('`').to_string()).collect();
                        let ret = self.show(&f.ret).trim_matches('`').to_string();
                        self.report(
                                Diagnostic::error("B0201", expr.span, "a TS function returns a promise, not a Bloom async result")
                                    .label("a TS value typed as a Bloom `async` function")
                                    .help(format!("type it with `Promise`: `({}) -> Promise<{ret}>`; awaiting it gives a `Result`", params.join(", ")))
                                    .spec("8-effects-tasks-and-concurrency"),
                            );
                    }
                    let mut expected = self.zonk(expected);
                    // Go on with the type the help writes, so one mistake is one error.
                    if let Ty::Fn(f) = &expected
                        && f.is_async
                    {
                        let ret = Ty::Promise(Box::new(f.ret.clone()));
                        expected = Ty::Fn(Rc::new(FnTy { ret, is_async: false, ..(**f).clone() }));
                    }
                    self.out.foreign_checks.insert(expr.id, expected.clone());
                    return expected;
                }
                if !self.coerce(&ty, expected) {
                    self.mismatch(expr.span, &ty, expected);
                    return Ty::Unknown;
                }
                if matches!(self.resolve(&ty), Ty::Never) { ty } else { expected.clone() }
            }
            None => ty,
        }
    }

    /// An argument TS checks: `Foreign` and Bloom values alike, an `Int` where
    /// a TS `number` is, a closure whose untyped parameters TS infers.
    pub fn boundary(&mut self, expr: &Expr, ts_ty: Option<&Ty>) -> Ty {
        let hint = ts_ty.map(|t| self.resolve(t));
        let ty = match (&expr.kind, &hint) {
            (ExprKind::Closure(c), None | Some(Ty::Foreign(_))) => {
                let ty = self.closure(c, None, true);
                self.out.types.insert(expr.id, ty.clone());
                ty
            }
            _ => self.infer(expr, hint.as_ref().filter(|h| !matches!(h, Ty::Foreign(_)))),
        };
        self.out.types.insert(expr.id, ty.clone());
        self.out.spans.push((expr.span, ty.clone()));
        if let Some(hint) = hint {
            let fits = matches!((self.resolve(&ty), &hint), (Ty::Int, Ty::Float))
                || matches!(self.resolve(&ty), Ty::Foreign(_))
                || self.coerce(&ty, &hint);
            if !fits {
                self.mismatch(expr.span, &ty, &hint);
            }
        }
        if matches!(self.resolve(&ty), Ty::Async(_)) {
            self.report(
                Diagnostic::error("B0430", expr.span, "a pending async call is passed to TS")
                    .label("an async Bloom call")
                    .help("write `await` before it, or pass the function itself")
                    .spec("8-effects-tasks-and-concurrency"),
            );
        }
        ty
    }

    fn infer(&mut self, expr: &Expr, expected: Option<&Ty>) -> Ty {
        let expected_resolved = expected.map(|e| self.resolve(e));
        match &expr.kind {
            ExprKind::Error => Ty::Unknown,
            ExprKind::Int(_) => match expected_resolved {
                // A literal is as polymorphic as the type it is written for.
                Some(Ty::Float) => Ty::Float,
                Some(Ty::Option(inner)) if *inner == Ty::Float => Ty::Float,
                _ => Ty::Int,
            },
            ExprKind::Float(_) => Ty::Float,
            ExprKind::Unit => Ty::Unit,
            ExprKind::Task(block) => {
                let task = self.frames.last().is_some_and(|f| f.task);
                self.frames.push(Frame {
                    ret: Ty::Unit,
                    is_async: true,
                    closure: true,
                    written: HashSet::new(),
                    task,
                    render: false,
                    spawn: true,
                });
                self.push();
                self.stmts(&block.stmts, Some(&Ty::Unit), block.span);
                self.pop();
                self.frames.pop();
                Ty::Unit
            }
            ExprKind::Bool(_) => Ty::Bool,
            ExprKind::None => match expected_resolved {
                Some(Ty::Option(inner)) => Ty::Option(inner),
                _ => Ty::Option(Box::new(self.fresh())),
            },
            ExprKind::Str { parts, .. } => self.string(expr, parts, expected_resolved.as_ref()),
            ExprKind::Name(name) => self.name(expr, name),
            ExprKind::ImplicitMember(name) => self.implicit_member(expr, name, expected_resolved.as_ref()),
            ExprKind::Binding(path) => self.binding(expr, path),
            ExprKind::TypeApply { name, .. } => {
                self.report(
                    Diagnostic::error(
                        "B0201",
                        expr.span,
                        format!("`{}<…>` is a type here, not a value", name.name),
                    )
                    .label("a type")
                    .help("construct it: `Partial<Prefs>(likes: false)`, or name a case: `Load<Int>.loading`")
                    .spec("44-structs"),
                );
                Ty::Unknown
            }
            ExprKind::Paren(inner) => self.expr(inner, expected),
            ExprKind::Tuple(items) if items.is_empty() => Ty::Unit,
            ExprKind::Tuple(items) => {
                let expected_items = match &expected_resolved {
                    Some(Ty::Tuple(tys)) if tys.len() == items.len() => tys.clone(),
                    _ => Vec::new(),
                };
                Ty::Tuple(
                    items
                        .iter()
                        .enumerate()
                        .map(|(i, item)| self.expr(item, expected_items.get(i)))
                        .collect(),
                )
            }
            ExprKind::List(items) => {
                let elem = match &expected_resolved {
                    Some(Ty::List(elem)) => (**elem).clone(),
                    _ => self.fresh(),
                };
                for item in items {
                    let ty = self.expr(item, Some(&elem));
                    let _ = ty;
                }
                Ty::List(Box::new(elem))
            }
            ExprKind::Map(entries) => {
                let value = match &expected_resolved {
                    Some(Ty::Map(value)) => (**value).clone(),
                    _ => self.fresh(),
                };
                for (key, item) in entries {
                    self.expr(key, Some(&Ty::Str));
                    self.expr(item, Some(&value));
                }
                Ty::Map(Box::new(value))
            }
            ExprKind::Unary(op, operand) => match op {
                UnaryOp::Not => {
                    self.expr(operand, Some(&Ty::Bool));
                    Ty::Bool
                }
                UnaryOp::Neg => {
                    let ty = self.expr(operand, expected);
                    let ty = self.resolve(&ty);
                    if !matches!(ty, Ty::Int | Ty::Float | Ty::Unknown) {
                        self.operand_error(operand.span, "`-`", &ty);
                    }
                    ty
                }
            },
            ExprKind::Binary(op, lhs, rhs) => self.binary(*op, lhs, rhs, expected_resolved.as_ref()),
            ExprKind::Ternary(cond, then, otherwise) => {
                self.expr(cond, Some(&Ty::Bool));
                let a = self.expr(then, expected);
                let b = self
                    .expr(otherwise, expected.or(Some(&a)).filter(|_| !matches!(then.kind, ExprKind::None)));
                self.join(&a, &b, expr.span)
            }
            ExprKind::Await(inner) => self.await_expr(expr, inner),
            ExprKind::Try(inner) => self.try_expr(expr, inner),
            ExprKind::Field(object, name) => self.field(expr, object, name),
            ExprKind::OptField(object, name) => {
                let ty = self.expr(object, None);
                match self.resolve(&ty) {
                    Ty::Option(inner) => {
                        let field = self.member(expr, &inner, name, object.span);
                        match self.resolve(&field) {
                            Ty::Option(_) => field,
                            other => Ty::Option(Box::new(other)),
                        }
                    }
                    Ty::Foreign(text) => Ty::Foreign(format!("{text}[\"{}\"]", name.name).into()),
                    Ty::Unknown => Ty::Unknown,
                    other => {
                        self.report(
                            Diagnostic::error(
                                "B0201",
                                name.span,
                                format!("`?.` reads an optional, and this is {}", self.show(&other)),
                            )
                            .label("never `none`")
                            .help(format!("write `.{}`", name.name))
                            .fix(Span::new(name.span.start - 2, name.span.start), ".")
                            .spec("45-enums-option-and-result"),
                        );
                        self.member(expr, &other, name, object.span)
                    }
                }
            }
            ExprKind::Index(object, index) => {
                let ty = self.expr(object, None);
                match self.resolve(&ty) {
                    Ty::List(elem) => {
                        self.expr(index, Some(&Ty::Int));
                        Ty::Option(elem)
                    }
                    Ty::Map(value) => {
                        self.expr(index, Some(&Ty::Str));
                        Ty::Option(value)
                    }
                    Ty::Foreign(text) => {
                        self.boundary(index, None);
                        Ty::Foreign(format!("{text}[number]").into())
                    }
                    Ty::Unknown => Ty::Unknown,
                    other => {
                        self.report(
                            Diagnostic::error(
                                "B0201",
                                object.span,
                                format!("{} cannot be indexed", self.show(&other)),
                            )
                            .label("not a list or a map")
                            .spec("12-standard-library-surface-draft"),
                        );
                        Ty::Unknown
                    }
                }
            }
            ExprKind::Call(call) => self.call(expr, call, expected_resolved.as_ref()),
            ExprKind::Closure(c) => self.closure(c, expected_resolved.as_ref(), false),
            ExprKind::If(if_expr) => self.if_expr(if_expr, expected, expr.span),
            ExprKind::Match(m) => self.match_expr(m, expected, expr.span),
        }
    }

    fn operand_error(&mut self, span: Span, op: &str, ty: &Ty) {
        if matches!(ty, Ty::Foreign(_)) {
            self.mismatch(span, ty, &Ty::Float);
            return;
        }
        self.report(
            Diagnostic::error("B0201", span, format!("{op} does not apply to {}", self.show(ty)))
                .label(format!("this is {}", self.show(ty)))
                .spec("61-precedence-high-to-low"),
        );
    }

    fn string(&mut self, expr: &Expr, parts: &[StrPart], expected: Option<&Ty>) -> Ty {
        let mut interpolated = false;
        for part in parts {
            if let StrPart::Interp(inner) = part {
                interpolated = true;
                let ty = self.expr(inner, None);
                match self.resolve(&ty) {
                    Ty::Str
                    | Ty::Int
                    | Ty::Float
                    | Ty::Bool
                    | Ty::Strings(_)
                    | Ty::Foreign(_)
                    | Ty::Unknown
                    | Ty::Var(_) => {}
                    Ty::Adt(def, _) if self.out.defs[def].is_fieldless() => {}
                    Ty::Option(_) => self.report(
                        Diagnostic::error("B0201", inner.span, "an optional is interpolated")
                            .label("it may be `none`, which would print `undefined`")
                            .help("unwrap it first: `${name ?? \"\"}`")
                            .spec("2-lexical-structure"),
                    ),
                    other => self.report(
                        Diagnostic::error(
                            "B0201",
                            inner.span,
                            format!("{} is interpolated into a string", self.show(&other)),
                        )
                        .label("not text, a number or a Bool")
                        .help("interpolate one of its fields")
                        .spec("2-lexical-structure"),
                    ),
                }
            }
        }
        if let (Some(Ty::Strings(set)), false) = (expected, interpolated) {
            let text = plain_text(parts);
            if ui::token_ok(set, &text) {
                return Ty::Strings(set.clone());
            }
            self.bad_token(expr.span, set, &text, None);
            return Ty::Strings(set.clone());
        }
        Ty::Str
    }

    /// B0502: a literal that is not one of the set's tokens.
    pub fn bad_token(&mut self, span: Span, set: &Rc<StrSet>, text: &str, modifier: Option<&str>) {
        let kind = if set.token { format!("{} token", set.name) } else { format!("`{}`", set.name) };
        let suggestion = ui::closest_token(set, text);
        let shown: Vec<&str> = set
            .values
            .iter()
            .map(String::as_str)
            .filter(|t| {
                !t.starts_with('-')
                    && !t.chars().all(|c| c.is_ascii_digit() || c == '.' || c == '%' || c == '/')
            })
            .collect();
        let label = if shown.len() <= 16 {
            format!("expected one of: {}", shown.join(" "))
        } else {
            format!("expected one of: {} …", shown[..16].join(" "))
        };
        let mut diagnostic = Diagnostic::error("B0502", span, format!("`\"{text}\"` is not a {kind}"))
            .label(label)
            .docs(if set.token {
                ui::token_docs(set)
            } else {
                format!("{}#47-the-foreign-boundary", crate::diagnostic::SPEC_DOCS)
            });
        if let Some(near) = suggestion {
            diagnostic =
                diagnostic.help(format!("did you mean `\"{near}\"`?")).fix(span, format!("\"{near}\""));
        } else if let Some(modifier) = modifier {
            diagnostic = diagnostic.help(format!("see the tokens `.{modifier}()` takes"));
        }
        self.report(diagnostic);
    }

    fn name(&mut self, expr: &Expr, name: &str) -> Ty {
        if let Some(local) = self.lookup(name) {
            self.out.names.insert(expr.id, NameRes::Local(local));
            let info = self.out.locals[local].clone();
            if info.kind == LocalKind::Var && info.frame != self.frames.len() - 1 {
                self.var_captured(&info, expr.span);
            }
            if info.kind == LocalKind::State && self.frames.last().is_some_and(|f| f.written.contains(&local))
            {
                self.report(
                    Diagnostic::error(
                        "B0410",
                        expr.span,
                        format!("`{name}` is read after it is written in this closure"),
                    )
                    .label("this reads the value the view drew with, not the new one")
                    .help(format!("bind the new value first: `let next = …; {name} = next`, then use `next`"))
                    .spec("73-reactivity-compile-time"),
                );
            }
            return self.instantiate(&info.ty);
        }
        match name {
            "ok" | "err" | "toast" | "navigate" | "sleep" | "Binding" => {
                self.report(
                    Diagnostic::error("B0208", expr.span, format!("`{name}` is called, not passed"))
                        .label("call it")
                        .help(format!("write `{name}(…)`"))
                        .spec("10-modules-and-interop"),
                );
                return Ty::Unknown;
            }
            _ => {}
        }
        if ui::node_by_constructor(name).is_some() {
            self.report(
                Diagnostic::error("B0208", expr.span, format!("`{name}` is a node: call it"))
                    .label("a node constructor")
                    .help(format!("write `{name}(…)` or `{name} {{ … }}`"))
                    .spec("72-builders-modifiers-and-tokens"),
            );
            return Ty::Unknown;
        }
        if self.type_names.contains_key(name) {
            self.report(
                Diagnostic::error("B0208", expr.span, format!("`{name}` is a type, not a value"))
                    .label("a type")
                    .help(format!("construct it (`{name}(…)`) or name one of its cases (`{name}.case`)"))
                    .spec("41-the-types"),
            );
            return Ty::Unknown;
        }
        self.unknown_name(expr.span, name);
        Ty::Unknown
    }

    fn unknown_name(&mut self, span: Span, name: &str) {
        let names = self.names_in_scope();
        let help =
            closest(name, names.iter().map(String::as_str)).map(|near| format!("did you mean `{near}`?"));
        let mut diagnostic = Diagnostic::error("B0202", span, format!("cannot find `{name}` in scope"))
            .label("not declared")
            .maybe_help(help.clone())
            .spec("10-modules-and-interop");
        if help.is_none() && name.chars().next().is_some_and(|c| c.is_ascii_lowercase()) {
            diagnostic = diagnostic.help("declare it with `let`, or import it from its module");
        }
        self.report(diagnostic);
    }

    /// A generic function's type with fresh variables for its parameters.
    fn instantiate(&mut self, ty: &Ty) -> Ty {
        match ty {
            Ty::Fn(f) if f.generics > 0 => {
                let args: Vec<Ty> = (0..f.generics).map(|_| self.fresh()).collect();
                let params =
                    f.params.iter().map(|p| ParamTy { ty: substitute(&p.ty, &args), ..p.clone() }).collect();
                Ty::Fn(Rc::new(FnTy { params, ret: substitute(&f.ret, &args), generics: 0, ..(**f).clone() }))
            }
            _ => ty.clone(),
        }
    }

    fn implicit_member(&mut self, expr: &Expr, name: &Ident, expected: Option<&Ty>) -> Ty {
        let target = match expected {
            Some(Ty::Option(inner)) => self.resolve(inner),
            Some(other) => other.clone(),
            None => Ty::Unknown,
        };
        match &target {
            Ty::Adt(def, args) if matches!(self.out.defs[*def].kind, DefKind::Enum(_)) => {
                let d = self.out.defs[*def].clone();
                match d.variants().iter().position(|v| v.name == name.name) {
                    Some(index) => {
                        if !d.variants()[index].payload.is_empty() {
                            self.report(
                                Diagnostic::error(
                                    "B0207",
                                    expr.span,
                                    format!("`.{}` carries a value", name.name),
                                )
                                .label("call it with its payload")
                                .help(format!("write `.{}(…)`", name.name))
                                .spec("45-enums-option-and-result"),
                            );
                        }
                        self.out.fields.insert(expr.id, FieldRes::EnumCase(*def, index));
                        Ty::Adt(*def, args.clone())
                    }
                    None => {
                        let names: Vec<&str> = d.variants().iter().map(|v| v.name.as_str()).collect();
                        self.unknown_case(name, &names, &target);
                        Ty::Unknown
                    }
                }
            }
            _ => {
                self.report(
                    Diagnostic::error("B0212", expr.span, format!("which type's case is `.{}`?", name.name))
                        .label("no enum type is expected here")
                        .help(format!("name the type: `Type.{}`", name.name))
                        .spec("3-grammar-ebnf"),
                );
                Ty::Unknown
            }
        }
    }

    fn binding(&mut self, expr: &Expr, path: &[Ident]) -> Ty {
        let root = &path[0];
        let Some(local) = self.lookup(&root.name) else {
            self.unknown_name(root.span, &root.name);
            return Ty::Unknown;
        };
        let info = self.out.locals[local].clone();
        if info.kind != LocalKind::State {
            self.report(
                Diagnostic::error(
                    "B0505",
                    expr.span,
                    format!("`${}` binds a state, and `{}` is not one", root.name, root.name),
                )
                .label("not a `@state`")
                .with_label(info.span, "declared here")
                .help(format!(
                    "declare it `@state {} = …` in the view, or pass a `Binding(get: …, set: {{ v in … }})`",
                    root.name
                ))
                .spec("72-builders-modifiers-and-tokens"),
            );
            return Ty::Unknown;
        }
        let mut ty = info.ty.clone();
        let mut fields = Vec::new();
        for field in &path[1..] {
            ty = match self.resolve(&ty) {
                Ty::Adt(def, args) if matches!(self.out.defs[def].kind, DefKind::Struct(_)) => {
                    match self.out.defs[def].fields().iter().find(|f| f.name == field.name) {
                        Some(f) => substitute(&f.ty, &args),
                        None => {
                            self.unknown_field(field, &Ty::Adt(def, args));
                            return Ty::Unknown;
                        }
                    }
                }
                other => {
                    self.report(
                        Diagnostic::error(
                            "B0505",
                            field.span,
                            format!("{} has no fields to bind", self.show(&other)),
                        )
                        .label("not a struct")
                        .spec("72-builders-modifiers-and-tokens"),
                    );
                    return Ty::Unknown;
                }
            };
            fields.push(field.name.clone());
        }
        self.out.bindings.insert(expr.id, (local, fields));
        Ty::Binding(Box::new(ty))
    }

    fn binary(&mut self, op: BinaryOp, lhs: &Expr, rhs: &Expr, expected: Option<&Ty>) -> Ty {
        match op {
            BinaryOp::And | BinaryOp::Or => {
                self.expr(lhs, Some(&Ty::Bool));
                self.expr(rhs, Some(&Ty::Bool));
                Ty::Bool
            }
            BinaryOp::Default => {
                let left = self.expr(lhs, None);
                match self.resolve(&left) {
                    Ty::Option(inner) => {
                        let hint = expected.cloned().unwrap_or((*inner).clone());
                        let right = self.expr(rhs, Some(&Ty::Option(Box::new(hint.clone()))));
                        let _ = right;
                        // `x ?? y` is optional only when `y` is.
                        let right_ty = self.out.types.get(&rhs.id).cloned().unwrap_or(Ty::Unknown);
                        match self.resolve(&right_ty) {
                            Ty::Option(_) => Ty::Option(inner),
                            _ => {
                                if !self.coerce(&right_ty, &inner) {
                                    self.mismatch(rhs.span, &right_ty, &inner);
                                }
                                *inner
                            }
                        }
                    }
                    Ty::Unknown => {
                        self.expr(rhs, None);
                        Ty::Unknown
                    }
                    Ty::Foreign(_) => {
                        self.mismatch(lhs.span, &left, &Ty::Option(Box::new(Ty::Unknown)));
                        self.expr(rhs, None)
                    }
                    other => {
                        self.report(
                            Diagnostic::error(
                                "B0201",
                                lhs.span,
                                format!(
                                    "`??` gives a fallback for an optional, and this is {}",
                                    self.show(&other)
                                ),
                            )
                            .label("never `none`")
                            .help("remove `?? …`: the value is always there")
                            .spec("45-enums-option-and-result"),
                        );
                        self.expr(rhs, None);
                        other
                    }
                }
            }
            BinaryOp::Eq | BinaryOp::Ne => {
                let left = self.expr(lhs, None);
                let right = self.expr(rhs, Some(&left));
                let ty = self.zonk(&left);
                let comparable = |defs: &[Def], ty: &Ty| -> bool {
                    match ty {
                        Ty::Int
                        | Ty::Float
                        | Ty::Bool
                        | Ty::Str
                        | Ty::Strings(_)
                        | Ty::Unknown
                        | Ty::Var(_)
                        | Ty::Foreign(_) => true,
                        Ty::Adt(def, _) => defs[*def].is_fieldless(),
                        _ => false,
                    }
                };
                let inner = match &ty {
                    Ty::Option(inner) => (**inner).clone(),
                    other => other.clone(),
                };
                if !comparable(&self.out.defs, &inner) {
                    self.report(
                        Diagnostic::error(
                            "B0210",
                            lhs.span.to(rhs.span),
                            format!("`{}` on {} is phase 1", op.text(), self.show(&ty)),
                        )
                        .label("structural equality is not built yet")
                        .help("compare the fields that matter (`a.id == b.id`), or `match` the case")
                        .spec("43-soundness-rules"),
                    );
                }
                let _ = right;
                Ty::Bool
            }
            BinaryOp::Lt | BinaryOp::Le | BinaryOp::Gt | BinaryOp::Ge => {
                let left = self.expr(lhs, None);
                let left = self.resolve(&left);
                if !matches!(left, Ty::Int | Ty::Float | Ty::Str | Ty::Strings(_) | Ty::Unknown | Ty::Var(_))
                {
                    self.operand_error(lhs.span, &format!("`{}`", op.text()), &left);
                }
                let hint = if matches!(left, Ty::Strings(_)) { Ty::Str } else { left };
                self.expr(rhs, Some(&hint));
                Ty::Bool
            }
            BinaryOp::Add | BinaryOp::Sub | BinaryOp::Mul | BinaryOp::Div | BinaryOp::Rem => {
                let left = self.expr(lhs, expected.filter(|e| matches!(e, Ty::Int | Ty::Float)));
                let left = self.resolve(&left);
                match &left {
                    Ty::Str | Ty::Strings(_) if op == BinaryOp::Add => {
                        let right = self.expr(rhs, None);
                        if !matches!(self.resolve(&right), Ty::Str | Ty::Strings(_) | Ty::Unknown) {
                            self.report(
                                Diagnostic::error(
                                    "B0201",
                                    rhs.span,
                                    format!("`+` joins strings, and this is {}", self.show(&right)),
                                )
                                .label("not a String")
                                .help("interpolate it instead: `\"${a}${b}\"`")
                                .spec("61-precedence-high-to-low"),
                            );
                        }
                        Ty::Str
                    }
                    Ty::Int | Ty::Float => {
                        let right = self.expr(rhs, Some(&left));
                        let _ = right;
                        left
                    }
                    Ty::Var(_) => {
                        let right = self.expr(rhs, None);
                        self.unify(&left, &right);
                        right
                    }
                    Ty::Unknown => {
                        self.expr(rhs, None);
                        Ty::Unknown
                    }
                    other => {
                        self.operand_error(lhs.span, &format!("`{}`", op.text()), other);
                        self.expr(rhs, None);
                        Ty::Unknown
                    }
                }
            }
        }
    }

    fn await_expr(&mut self, expr: &Expr, inner: &Expr) -> Ty {
        let frame = self.frames.last_mut().expect("a frame");
        if frame.closure {
            frame.is_async = true;
        } else if !frame.is_async {
            self.report(
                Diagnostic::error("B0215", expr.span, "`await` is only allowed in an async function")
                    .label("this function is not async")
                    .help("mark the function `async fn`, or await in a closure (`.onPress { await … }`)")
                    .spec("8-effects-tasks-and-concurrency"),
            );
        }
        let ty = self.expr(inner, None);
        match self.resolve(&ty) {
            Ty::Async(t) => {
                self.out.awaits.insert(expr.id, AwaitRes::Bloom);
                *t
            }
            Ty::Promise(t) => {
                self.out.awaits.insert(expr.id, AwaitRes::Ts);
                Ty::Result(t, Box::new(Ty::JsError))
            }
            Ty::Foreign(text) => {
                self.out.awaits.insert(expr.id, AwaitRes::Ts);
                Ty::Result(Box::new(Ty::Foreign(format!("Awaited<{text}>").into())), Box::new(Ty::JsError))
            }
            Ty::Unknown => Ty::Unknown,
            other => {
                self.report(
                    Diagnostic::error(
                        "B0215",
                        inner.span,
                        format!("`await` waits for an async call, and this is {}", self.show(&other)),
                    )
                    .label("nothing to wait for")
                    .help("remove `await`")
                    .spec("8-effects-tasks-and-concurrency"),
                );
                other
            }
        }
    }

    fn try_expr(&mut self, expr: &Expr, inner: &Expr) -> Ty {
        let ty = self.expr(inner, None);
        let ret = self.frames.last().expect("a frame").ret.clone();
        let ret_resolved = self.resolve(&ret);
        match self.resolve(&ty) {
            Ty::Result(ok, err) => {
                self.out.tries.insert(expr.id, TryRes::Result);
                match ret_resolved {
                    Ty::Result(_, fn_err) => {
                        if !self.coerce(&err, &fn_err) {
                            self.report(
                                Diagnostic::error(
                                    "B0214",
                                    expr.span,
                                    format!(
                                        "`?` returns {} early, and this function's error is {}",
                                        self.show(&err),
                                        self.show(&fn_err)
                                    ),
                                )
                                .label("the error types differ")
                                .help("convert it first: `.mapErr { e in … }?`")
                                .spec("45-enums-option-and-result"),
                            );
                        }
                    }
                    Ty::Var(_) => {
                        let ok_var = self.fresh();
                        self.unify(&ret, &Ty::Result(Box::new(ok_var), err));
                    }
                    _ => self.try_outside(expr, &ret_resolved, "a `Result`"),
                }
                *ok
            }
            Ty::Option(inner_ty) => {
                self.out.tries.insert(expr.id, TryRes::Option);
                match ret_resolved {
                    Ty::Option(_) => {}
                    Ty::Var(_) => {
                        let some = self.fresh();
                        self.unify(&ret, &Ty::Option(Box::new(some)));
                    }
                    _ => self.try_outside(expr, &ret_resolved, "an optional"),
                }
                *inner_ty
            }
            Ty::Unknown => Ty::Unknown,
            other => {
                self.report(
                    Diagnostic::error(
                        "B0214",
                        expr.span,
                        format!("`?` unwraps a `Result` or an optional, and this is {}", self.show(&other)),
                    )
                    .label("nothing to unwrap")
                    .help("remove `?`")
                    .spec("45-enums-option-and-result"),
                );
                other
            }
        }
    }

    fn try_outside(&mut self, expr: &Expr, ret: &Ty, what: &str) {
        self.report(
            Diagnostic::error(
                "B0214",
                expr.span,
                format!(
                    "`?` on {what} needs a function that returns one, and this one returns {}",
                    self.show(ret)
                ),
            )
            .label("cannot return early from here")
            .help("`match` the value instead, or make the function return a `Result`")
            .spec("45-enums-option-and-result"),
        );
    }

    fn field(&mut self, expr: &Expr, object: &Expr, name: &Ident) -> Ty {
        // `Type.case` and `Task.signal`, before values.
        if let ExprKind::Name(type_name) = &object.kind
            && self.lookup(type_name).is_none()
        {
            if type_name == "Task" && name.name == "signal" {
                if !self.frames.iter().any(|f| f.task) {
                    self.report(
                        Diagnostic::error(
                            "B0432",
                            expr.span,
                            "`Task.signal` is read outside a `.task { … }`",
                        )
                        .label("no task here")
                        .help("read it inside `.task { … }` on the body")
                        .spec("8-effects-tasks-and-concurrency"),
                    );
                }
                self.out.fields.insert(expr.id, FieldRes::TaskSignal);
                return Ty::Foreign("AbortSignal".into());
            }
            if let Some(TypeName::Def(def)) = self.type_names.get(type_name).cloned() {
                return self.enum_case_value(expr, def, name, Vec::new());
            }
        }
        if let ExprKind::TypeApply { name: type_name, args } = &object.kind
            && let Some(TypeName::Def(def)) = self.type_names.get(&type_name.name).cloned()
        {
            let args = args.iter().map(|a| self.resolve_type(a)).collect();
            return self.enum_case_value(expr, def, name, args);
        }
        let ty = self.expr(object, None);
        self.member(expr, &ty, name, object.span)
    }

    fn enum_case_value(&mut self, expr: &Expr, def: DefId, name: &Ident, args: Vec<Ty>) -> Ty {
        let d = self.out.defs[def].clone();
        if !matches!(d.kind, DefKind::Enum(_)) {
            self.report(
                Diagnostic::error(
                    "B0205",
                    expr.span,
                    format!("`{}` is a struct; `{}.{}` names nothing", d.name, d.name, name.name),
                )
                .label("structs have no cases")
                .help(format!("construct it: `{}(…)`", d.name))
                .spec("44-structs"),
            );
            return Ty::Unknown;
        }
        let Some(index) = d.variants().iter().position(|v| v.name == name.name) else {
            let names: Vec<&str> = d.variants().iter().map(|v| v.name.as_str()).collect();
            self.unknown_case(name, &names, &Ty::Adt(def, args));
            return Ty::Unknown;
        };
        if !d.variants()[index].payload.is_empty() {
            self.report(
                Diagnostic::error("B0207", expr.span, format!("`{}.{}` carries a value", d.name, name.name))
                    .label("call it with its payload")
                    .help(format!("write `{}.{}(…)`", d.name, name.name))
                    .spec("45-enums-option-and-result"),
            );
        }
        self.out.fields.insert(expr.id, FieldRes::EnumCase(def, index));
        let args = if args.is_empty() { d.generics.iter().map(|_| self.fresh()).collect() } else { args };
        Ty::Adt(def, args)
    }

    /// `value.name` on a value of type `ty`.
    fn member(&mut self, expr: &Expr, ty: &Ty, name: &Ident, object_span: Span) -> Ty {
        let resolved = self.resolve(ty);
        let prop = |checker: &mut Self, recv: Recv, n: &'static str, ty: Ty| {
            checker.out.fields.insert(expr.id, FieldRes::Prop { recv, name: n });
            ty
        };
        match (&resolved, name.name.as_str()) {
            (Ty::Adt(def, args), _) if matches!(self.out.defs[*def].kind, DefKind::Struct(_)) => {
                match self.out.defs[*def].fields().iter().find(|f| f.name == name.name) {
                    Some(f) => {
                        let ty = substitute(&f.ty, args);
                        self.out.fields.insert(expr.id, FieldRes::Field);
                        ty
                    }
                    None => {
                        self.unknown_field(name, &resolved);
                        Ty::Unknown
                    }
                }
            }
            (Ty::Partial(inner), _) => {
                let field = self.member(expr, inner, name, object_span);
                match field {
                    Ty::Option(_) | Ty::Unknown => field,
                    other => Ty::Option(Box::new(other)),
                }
            }
            (Ty::Tuple(items), index) if index.parse::<usize>().is_ok() => {
                let index: usize = index.parse().expect("checked");
                match items.get(index) {
                    Some(ty) => {
                        self.out.fields.insert(expr.id, FieldRes::Index(index));
                        ty.clone()
                    }
                    None => {
                        self.report(
                            Diagnostic::error(
                                "B0205",
                                name.span,
                                format!("this tuple has {} items; `.{index}` is past them", items.len()),
                            )
                            .label("out of range")
                            .spec("41-the-types"),
                        );
                        Ty::Unknown
                    }
                }
            }
            (Ty::Str | Ty::Strings(_), "count") => prop(self, Recv::Str, "count", Ty::Int),
            (Ty::Str | Ty::Strings(_), "isEmpty") => prop(self, Recv::Str, "isEmpty", Ty::Bool),
            (Ty::List(_), "count") => prop(self, Recv::List, "count", Ty::Int),
            (Ty::List(_), "isEmpty") => prop(self, Recv::List, "isEmpty", Ty::Bool),
            (Ty::List(elem), "first") => prop(self, Recv::List, "first", Ty::Option(elem.clone())),
            (Ty::List(elem), "last") => prop(self, Recv::List, "last", Ty::Option(elem.clone())),
            (Ty::Map(_), "count") => prop(self, Recv::Map, "count", Ty::Int),
            (Ty::Map(_), "isEmpty") => prop(self, Recv::Map, "isEmpty", Ty::Bool),
            (Ty::Map(_), "keys") => prop(self, Recv::Map, "keys", Ty::List(Box::new(Ty::Str))),
            (Ty::Map(value), "values") => prop(self, Recv::Map, "values", Ty::List(value.clone())),
            (Ty::Map(value), "entries") => prop(
                self,
                Recv::Map,
                "entries",
                Ty::List(Box::new(Ty::Tuple(vec![Ty::Str, (**value).clone()]))),
            ),
            (Ty::Result(..), "isOk") => prop(self, Recv::Result, "isOk", Ty::Bool),
            (Ty::JsError, "message" | "name") => {
                self.out.fields.insert(expr.id, FieldRes::ErrorField);
                Ty::Str
            }
            (Ty::Foreign(text), _) => {
                self.out.fields.insert(expr.id, FieldRes::Field);
                Ty::Foreign(format!("{text}[\"{}\"]", name.name).into())
            }
            (Ty::Unknown, _) => Ty::Unknown,
            (Ty::Option(_), _) => {
                self.report(
                    Diagnostic::error("B0201", name.span, format!("{} may be `none`", self.show(&resolved)))
                        .label(format!("`.{}` would read nothing when it is `none`", name.name))
                        .help(format!("write `?.{}`, or unwrap it first (`if let`, `??`)", name.name))
                        .fix(Span::new(name.span.start - 1, name.span.start), "?.")
                        .spec("45-enums-option-and-result"),
                );
                let _ = object_span;
                Ty::Unknown
            }
            (Ty::View(_), modifier) => {
                self.report(
                    Diagnostic::error("B0208", name.span, format!("`.{modifier}` is a modifier: call it"))
                        .label("a modifier is a call")
                        .help(format!("write `.{modifier}(…)`"))
                        .spec("72-builders-modifiers-and-tokens"),
                );
                Ty::Unknown
            }
            _ => {
                let methods = call::method_names(&resolved);
                let help = if methods.contains(&name.name.as_str()) {
                    Some(format!("`{}` is a method: call it, `.{}(…)`", name.name, name.name))
                } else {
                    closest(&name.name, methods.iter().copied())
                        .map(|near| format!("did you mean `.{near}`?"))
                };
                self.report(
                    Diagnostic::error(
                        "B0205",
                        name.span,
                        format!("{} has no member `{}`", self.show(&resolved), name.name),
                    )
                    .label("no such member")
                    .maybe_help(help)
                    .spec("12-standard-library-surface-draft"),
                );
                Ty::Unknown
            }
        }
    }

    /// A closure; `boundary`: TS takes it, so untyped parameters are TS's to infer.
    pub fn closure(&mut self, c: &Closure, expected: Option<&Ty>, boundary: bool) -> Ty {
        let expected_fn = match expected.map(|e| self.resolve(e)) {
            Some(Ty::Fn(f)) => Some(f),
            _ => None,
        };
        self.push();
        let mut params = Vec::new();
        let mut param_tys = Vec::new();
        for (index, param) in c.params.iter().enumerate() {
            let expected_param = expected_fn.as_ref().and_then(|f| f.params.get(index)).map(|p| p.ty.clone());
            let ty = match (&param.ty, expected_param) {
                (Some(te), Some(want)) => {
                    let ty = self.resolve_type(te);
                    if !self.unify(&ty, &want) {
                        self.mismatch(te.span, &ty, &want);
                    }
                    ty
                }
                (Some(te), None) => self.resolve_type(te),
                (None, Some(want)) => want,
                (None, None) if boundary => Ty::Foreign("".into()),
                (None, None) => self.fresh(),
            };
            param_tys.push(ParamTy {
                name: Some(param.name.name.clone()),
                ty: ty.clone(),
                optional: false,
                rest: false,
            });
            params.push((param, ty));
        }
        let ret = expected_fn.as_ref().map_or_else(|| self.fresh(), |f| f.ret.clone());
        let task = self.frames.last().is_some_and(|f| f.task);
        self.frames.push(Frame {
            ret: ret.clone(),
            is_async: false,
            closure: true,
            written: HashSet::new(),
            task,
            render: false,
            spawn: false,
        });
        let mut locals = Vec::new();
        for (param, ty) in params {
            locals.push(self.declare(&param.name, ty, LocalKind::Param));
        }
        let ret_resolved = self.resolve(&ret);
        let body_ty = self.stmts(&c.body, Some(&ret), c.span);
        // A Bloom async call is awaited or started as a task, never returned unawaited.
        if let (Ty::Async(_), Some(Stmt { kind: StmtKind::Expr(tail), .. })) =
            (self.resolve(&body_ty), c.body.last())
        {
            self.report(
                Diagnostic::error(
                    "B0430",
                    tail.span,
                    "this async call is neither awaited nor started as a task",
                )
                .label("its result (and any failure) would be dropped")
                .help("write `await` before it, or start it on its own: `task { await … }`")
                .spec("8-effects-tasks-and-concurrency"),
            );
        }
        if matches!(ret_resolved, Ty::Var(_)) {
            self.unify(&ret, &body_ty);
        }
        let frame = self.frames.pop().expect("the closure's frame");
        self.pop();
        let info = ClosureInfo { params: locals, is_async: frame.is_async, ret: ret.clone(), builder: false };
        self.out.closures.insert(c.span, info);
        Ty::Fn(Rc::new(FnTy { params: param_tys, ret, is_async: frame.is_async, generics: 0, ts: false }))
    }
}

/// Whether `expr` reads the name `name` (a state's own value, for a functional update).
pub fn reads_name(expr: &Expr, name: &str) -> bool {
    let mut found = false;
    walk_names(expr, &mut |n, _| {
        if n == name {
            found = true;
        }
    });
    found
}

/// Every name `expr` reads, with its expression id (closures included).
pub fn walk_names(expr: &Expr, f: &mut dyn FnMut(&str, ExprId)) {
    match &expr.kind {
        ExprKind::Name(name) => f(name, expr.id),
        ExprKind::Binding(path) => f(&path[0].name, expr.id),
        ExprKind::Str { parts, .. } => {
            for part in parts {
                if let StrPart::Interp(inner) = part {
                    walk_names(inner, f);
                }
            }
        }
        ExprKind::Paren(e)
        | ExprKind::Unary(_, e)
        | ExprKind::Await(e)
        | ExprKind::Try(e)
        | ExprKind::Field(e, _)
        | ExprKind::OptField(e, _) => walk_names(e, f),
        ExprKind::Tuple(items) | ExprKind::List(items) => items.iter().for_each(|e| walk_names(e, f)),
        ExprKind::Map(entries) => entries.iter().for_each(|(k, v)| {
            walk_names(k, f);
            walk_names(v, f);
        }),
        ExprKind::Binary(_, a, b) | ExprKind::Index(a, b) => {
            walk_names(a, f);
            walk_names(b, f);
        }
        ExprKind::Ternary(a, b, c) => {
            walk_names(a, f);
            walk_names(b, f);
            walk_names(c, f);
        }
        ExprKind::Call(call) => {
            walk_names(&call.callee, f);
            call.args.iter().for_each(|a| walk_names(&a.value, f));
            if let Some(c) = &call.trailing {
                walk_stmts(&c.body, f);
            }
        }
        ExprKind::Closure(c) => walk_stmts(&c.body, f),
        ExprKind::Task(block) => walk_stmts(&block.stmts, f),
        ExprKind::If(i) => walk_if(i, f),
        ExprKind::Match(m) => {
            walk_names(&m.scrutinee, f);
            for arm in &m.arms {
                walk_pattern(&arm.pattern, f);
                if let Some(g) = &arm.guard {
                    walk_names(g, f);
                }
                match &arm.body {
                    ArmBody::Expr(e) => walk_names(e, f),
                    ArmBody::Block(b) => walk_stmts(&b.stmts, f),
                }
            }
        }
        ExprKind::Int(_)
        | ExprKind::Unit
        | ExprKind::Float(_)
        | ExprKind::Bool(_)
        | ExprKind::None
        | ExprKind::ImplicitMember(_)
        | ExprKind::TypeApply { .. }
        | ExprKind::Error => {}
    }
}

fn walk_pattern(pattern: &Pattern, f: &mut dyn FnMut(&str, ExprId)) {
    match &pattern.kind {
        PatternKind::Literal(e) => walk_names(e, f),
        PatternKind::Case { args: Some(args), .. } | PatternKind::Tuple(args) | PatternKind::Or(args) => {
            args.iter().for_each(|p| walk_pattern(p, f))
        }
        PatternKind::Record(fields) => {
            fields.iter().filter_map(|(_, p)| p.as_ref()).for_each(|p| walk_pattern(p, f))
        }
        _ => {}
    }
}

fn walk_if(i: &IfExpr, f: &mut dyn FnMut(&str, ExprId)) {
    match &i.cond {
        Cond::Expr(e) => walk_names(e, f),
        Cond::Let(p, e) => {
            walk_pattern(p, f);
            walk_names(e, f);
        }
    }
    walk_stmts(&i.then.stmts, f);
    match i.otherwise.as_deref() {
        Some(Else::If(e)) => walk_names(e, f),
        Some(Else::Block(b)) => walk_stmts(&b.stmts, f),
        None => {}
    }
}

pub fn walk_stmts(stmts: &[Stmt], f: &mut dyn FnMut(&str, ExprId)) {
    for stmt in stmts {
        match &stmt.kind {
            StmtKind::Let(l) => walk_names(&l.value, f),
            StmtKind::Var(v) => walk_names(&v.value, f),
            StmtKind::Assign(a) => {
                walk_names(&a.target, f);
                walk_names(&a.value, f);
            }
            StmtKind::Return(Some(e)) | StmtKind::Expr(e) => walk_names(e, f),
            StmtKind::Return(None) => {}
            StmtKind::Defer(block) => walk_stmts(&block.stmts, f),
            StmtKind::While(w) => {
                walk_names(&w.cond, f);
                walk_stmts(&w.body.stmts, f);
            }
            StmtKind::For(fs) => {
                walk_names(&fs.iter, f);
                walk_stmts(&fs.body.stmts, f);
            }
        }
    }
}

fn is_hook_name(name: &str) -> bool {
    name.strip_prefix("use").and_then(|rest| rest.chars().next()).is_some_and(|c| c.is_ascii_uppercase())
}

/// A string literal's text (no interpolation).
pub fn plain_text(parts: &[StrPart]) -> String {
    parts
        .iter()
        .map(|part| match part {
            StrPart::Text(text) => text.as_str(),
            StrPart::Interp(_) => "",
        })
        .collect()
}

/// A literal default as TS text, for a struct imported from another module.
fn literal_text(expr: &Expr) -> Option<String> {
    Some(match &expr.kind {
        ExprKind::Int(v) => v.to_string(),
        ExprKind::Float(v) => v.to_string(),
        ExprKind::Bool(v) => v.to_string(),
        ExprKind::None => "undefined".into(),
        ExprKind::Str { parts, .. } if parts.iter().all(|p| matches!(p, StrPart::Text(_))) => {
            format!("{:?}", plain_text(parts))
        }
        ExprKind::List(items) if items.is_empty() => "[]".into(),
        ExprKind::Map(entries) if entries.is_empty() => "{}".into(),
        ExprKind::Field(object, case) if matches!(object.kind, ExprKind::Name(_)) => {
            format!("{:?}", case.name)
        }
        ExprKind::Unary(UnaryOp::Neg, inner) => format!("-{}", literal_text(inner)?),
        _ => return None,
    })
}
