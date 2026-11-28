//! Calls: Bloom and TS functions, construction, enum cases, nodes and their
//! modifiers (checked against the spec tables), components, views, the
//! prelude and the standard library.

use std::rc::Rc;

use super::{CallRes, Checker, ClosureInfo, FieldRes, LocalKind, NameRes, Recv, TypeName};
use crate::ast::*;
use crate::diagnostic::{Diagnostic, closest};
use crate::types::*;
use crate::ui::{self, ParamKind};

impl Checker<'_> {
    pub(super) fn call(&mut self, expr: &Expr, call: &Call, expected: Option<&Ty>) -> Ty {
        let hook_allowed = std::mem::take(&mut self.hook_allowed) | self.hook_args.remove(&expr.id);
        // A hook given as an argument of a call that may call one is unconditional too.
        if hook_allowed && !call.optional {
            for arg in &call.args {
                if let ExprKind::Call(inner) = &arg.value.kind
                    && !inner.optional
                    && matches!(&inner.callee.kind, ExprKind::Name(name) if super::is_hook_name(name))
                {
                    self.hook_args.insert(arg.value.id);
                }
            }
        }
        let task_allowed = std::mem::take(&mut self.task_allowed);
        // What the call is expected to give, for a generic method's result (`uris.map { … }` where
        // `[Item]` is expected: the closure gives `Item`s).
        let inferred = self.inferred_expected.remove(&expr.id);
        if let Some(expected) = expected
            && !inferred
        {
            self.call_expected.insert(expr.id, expected.clone());
        }
        // `let all: [Item] = { … return a … return b }()`: the closure, called at once, gives what
        // is expected (Swift reads the binding's type into it), so each `return` is checked against
        // `[Item]`, not against the first one's.
        if let ExprKind::Closure(closure) = &call.callee.kind
            && closure.params.is_empty()
            && call.args.is_empty()
            && call.trailing.is_none()
            && !call.optional
            && !inferred
            && let Some(expected) = expected
            && !matches!(self.resolve(expected), Ty::Var(_) | Ty::Unknown)
        {
            let fn_ty = Ty::Fn(Rc::new(FnTy {
                params: Vec::new(),
                ret: expected.clone(),
                is_async: false,
                generics: 0,
                ts: false,
                throws: false,
                bounds: Vec::new(),
                shapes: Vec::new(),
            }));
            let ty = self.expr(&call.callee, Some(&fn_ty));
            return self.value_call(expr, call, &ty);
        }
        if call.optional {
            // `f?.(…)`: the call of `f`'s value when it is not `none`.
            let ty = self.expr(&call.callee, None);
            let end = call.callee.span.end;
            // `props.onOpen?.()` where TS says `onOpen` is always there: kept.
            let ty = match self.resolve(&ty) {
                Ty::Option(_) | Ty::Foreign(_) | Ty::Unknown => ty,
                other if self.ts_claimed(&call.callee, &ty) => {
                    self.claim_only.insert(call.callee.id);
                    Ty::Option(Box::new(other))
                }
                _ => ty,
            };
            return match self.optional_target(&ty, call.callee.span, (Span::new(end, end + 2), "")) {
                Some(inner) => {
                    let ret = self.value_call(expr, call, &inner);
                    let claim = self.claim_only.contains(&call.callee.id);
                    self.claim_link(expr, claim, &ret);
                    self.rechain(expr, ret)
                }
                None => {
                    let ty = self.resolve(&ty);
                    self.value_call(expr, call, &ty)
                }
            };
        }
        match &call.callee.kind {
            ExprKind::OptField(object, member) => {
                // `x?.m(…)`: the method of `x`'s value when it is not `none`.
                let recv = self.expr(object, None);
                let fix = (Span::new(member.span.start - 2, member.span.start), ".");
                // `viewPost.authors?.map(…)` where TS says `authors` is always there: kept.
                let mut claim = self.is_claim_only(object);
                let recv = match self.resolve(&recv) {
                    Ty::Option(_) | Ty::Foreign(_) | Ty::Unknown => recv,
                    other if self.ts_claimed(object, &recv) => {
                        claim = true;
                        Ty::Option(Box::new(other))
                    }
                    _ => recv,
                };
                match self.optional_target(&recv, member.span, fix) {
                    Some(inner) => {
                        let ret = self.member_call(expr, call, &inner, member, object.span, false, true);
                        self.claim_link(expr, claim, &ret);
                        self.rechain(expr, ret)
                    }
                    None => {
                        let recv = self.resolve(&recv);
                        self.member_call(expr, call, &recv, member, object.span, false, true)
                    }
                }
            }
            ExprKind::Name(name) => {
                if let Some(local) = self.lookup(name) {
                    self.out.names.insert(call.callee.id, NameRes::Local(local));
                    let info = self.out.locals[local].clone();
                    self.out.types.insert(call.callee.id, info.ty.clone());
                    return match &info.kind {
                        LocalKind::Component { props } => self.component_call(expr, call, props),
                        LocalKind::View => self.view_call(expr, call, &info.ty),
                        LocalKind::Import { hook: true } | LocalKind::ModuleFn
                            if !matches!(info.kind, LocalKind::ModuleFn) || super::is_hook_name(name) =>
                        {
                            if !hook_allowed {
                                self.report(
                                    Diagnostic::error(
                                        "B0420",
                                        call.callee.span,
                                        format!("the hook `{name}` is called outside a view member"),
                                    )
                                    .label("a hook runs on every render, in the same order")
                                    .help(format!(
                                        "call it as a view member (`let value = {name}(…)`), or at the top level of a hook function (`fn useX`)"
                                    ))
                                    .spec("73-reactivity-compile-time"),
                                );
                            }
                            self.was_hook = true;
                            let ty = self.instantiate(&info.ty);
                            self.value_call(expr, call, &ty)
                        }
                        // An UpperCamel TS value Bloom could not type, used as a node, is a component.
                        LocalKind::Import { hook: false }
                            if matches!(self.resolve(&info.ty), Ty::Foreign(_))
                                && name.starts_with(|c: char| c.is_ascii_uppercase())
                                && !self.out.constructors.contains(&local)
                                && !self.js_globals.contains(&local) =>
                        {
                            self.component_call(expr, call, &Ty::Foreign("".into()))
                        }
                        _ => {
                            let ty = self.instantiate(&info.ty);
                            let ret = self.value_call(expr, call, &ty);
                            // `URL(x)` is `new URL(x)`: an instance, not what a call returns.
                            match (&ret, self.out.constructors.contains(&local)) {
                                (Ty::Foreign(text), true) => match text.strip_prefix("ReturnType<") {
                                    Some(inner) => Ty::Foreign(format!("InstanceType<{inner}").into()),
                                    None => ret,
                                },
                                _ => ret,
                            }
                        }
                    };
                }
                match name.as_str() {
                    // `Task { … }` (2.0): starts the work and goes on, as 0.x `task { … }`.
                    "Task" if call.args.is_empty() && call.trailing.is_some() => {
                        let closure = call.trailing.as_deref().expect("checked");
                        self.spawn(&closure.body, closure.span);
                        self.out.calls.insert(expr.id, CallRes::Spawn);
                        return Ty::Unit;
                    }
                    "ok" | "err" => return self.result_ctor(expr, call, name == "ok", expected),
                    "toast" | "navigate" => {
                        self.out.calls.insert(
                            expr.id,
                            if name == "toast" { CallRes::Toast } else { CallRes::Navigate },
                        );
                        for (index, arg) in call.args.iter().enumerate() {
                            let hint = (index == 0 && arg.label.is_none()).then_some(Ty::Str);
                            self.boundary(&arg.value, hint.as_ref());
                        }
                        if name == "navigate" {
                            self.route(call);
                        }
                        return if name == "toast" { Ty::Unit } else { Ty::Foreign("Navigation".into()) };
                    }
                    "fail" => return self.fail(expr, call),
                    "sleep" => {
                        self.out.calls.insert(expr.id, CallRes::Sleep);
                        self.positional(call, &[Ty::Int]);
                        return Ty::Async(Box::new(Ty::Unit));
                    }
                    "all" | "race" => return self.all_or_race(expr, call, name == "all"),
                    "Map" | "Set" => return self.collection(expr, call, name == "Map", None, expected),
                    "min" | "max" | "abs" | "round" | "floor" | "ceil" => return self.math(expr, call, name),
                    "Int" | "Float" | "Double" => {
                        // `Int(s)` / `Float(s)`: a string's number, or `none`.
                        self.positional(call, &[Ty::Str]);
                        let int = name == "Int";
                        self.out.calls.insert(expr.id, CallRes::Parse { int });
                        return Ty::Option(Box::new(if int { Ty::Int } else { Ty::Float }));
                    }
                    "Binding" => return self.binding_ctor(expr, call),
                    // The standard library's `Date`, by its `init`'s labels (Swift's
                    // `Date(timeIntervalSince1970:)`, `Date(_:strategy:)`, `Date()`), in place of
                    // JS's `Date` (which a TS import of it no longer shadows).
                    "Date" if !self.type_names.contains_key("Date") => {
                        let init = crate::extensions::init_name(
                            "Date",
                            call.args.iter().map(|a| Some(a.label.as_ref().map_or("_", |l| l.name.as_str()))),
                        );
                        if let Some(local) = self.lookup(&init) {
                            self.out.names.insert(call.callee.id, NameRes::Local(local));
                            let ty = self.out.locals[local].ty.clone();
                            let ty = self.instantiate(&ty);
                            return self.value_call(expr, call, &ty);
                        }
                        if self.lookup("Date$$get$now").is_some() {
                            self.report(
                                Diagnostic::error("B0207", call.callee.span, "`Date` has no `init` with these labels")
                                    .label("not one of its initializers")
                                    .help(
                                        "write `Date()`, `Date(timeIntervalSince1970: s)`, \
                                         `Date(millisecondsSince1970: ms)` or `try Date(text, strategy: .iso8601)`",
                                    )
                                    .spec("10-modules-and-interop"),
                            );
                            self.args_unchecked(call);
                            return Ty::Date;
                        }
                    }
                    // `EnvironmentKey("session", default: Session.signedOut)`: an app's own
                    // environment value, which `@Environment(\.session)` reads.
                    "EnvironmentKey" => return self.environment_key_value(expr, call),
                    // The standard library's `Regex` struct, where it is in scope, is constructed.
                    "Regex" if !self.type_names.contains_key("Regex") => {
                        // `Regex("^www\\.", "g")`: a JS `RegExp`, for `replace`/`match` and its `test`.
                        if call.args.is_empty() || call.args.len() > 2 || call.trailing.is_some() {
                            self.report(
                                Diagnostic::error(
                                    "B0207",
                                    call.callee.span,
                                    "`Regex` takes a pattern and its flags",
                                )
                                .label("`Regex(\"…\")` or `Regex(\"…\", \"g\")`")
                                .spec("12-standard-library-surface-draft"),
                            );
                        }
                        for arg in &call.args {
                            self.expr(&arg.value, Some(&Ty::Str));
                        }
                        self.out.calls.insert(expr.id, CallRes::Regex);
                        return Ty::Foreign("RegExp".into());
                    }
                    // `Array(0..<n)`, `Array(xs)`, `Array(set)`: a new array of the elements.
                    "Array" if self.lookup("Array").is_none() => {
                        self.out.calls.insert(expr.id, CallRes::ArrayOf);
                        let [arg] = call.args.as_slice() else {
                            self.report(
                                Diagnostic::error("B0207", call.callee.span, "`Array` takes one collection")
                                    .label("`Array(0..<n)`, `Array(xs)` or `Array(set)`")
                                    .spec("63-ranges"),
                            );
                            self.args_unchecked(call);
                            return Ty::Unknown;
                        };
                        let ty = self.expr(&arg.value, None);
                        return match self.resolve(&ty) {
                            Ty::List(elem) | Ty::Set(elem) if arg.label.is_none() && !arg.spread => {
                                Ty::List(elem)
                            }
                            Ty::Unknown => Ty::Unknown,
                            other => {
                                self.report(
                                    Diagnostic::error(
                                        "B0201",
                                        arg.value.span,
                                        format!(
                                            "`Array` takes a range, a list or a set, not {}",
                                            self.show(&other)
                                        ),
                                    )
                                    .label("not a collection")
                                    .spec("63-ranges"),
                                );
                                Ty::Unknown
                            }
                        };
                    }
                    "catching" => return self.catching(expr, call),
                    // `import("./X")`: the module's promise, TS's to type.
                    "import" if self.lookup("import").is_none() => {
                        self.out.calls.insert(expr.id, CallRes::Ts);
                        let spec = match call.args.as_slice() {
                            [arg] if arg.label.is_none() => match &arg.value.kind {
                                ExprKind::Str { parts, .. } => match parts.as_slice() {
                                    [StrPart::Text(s)] => Some(s.clone()),
                                    [] => Some(String::new()),
                                    _ => None,
                                },
                                _ => None,
                            },
                            _ => None,
                        };
                        let Some(spec) = spec else {
                            self.report(
                                Diagnostic::error(
                                    "B0207",
                                    call.callee.span,
                                    "`import(…)` takes one module path",
                                )
                                .label("a string literal")
                                .spec("10-modules-and-interop"),
                            );
                            self.args_unchecked(call);
                            return Ty::Unknown;
                        };
                        self.boundary(&call.args[0].value, None);
                        return Ty::Foreign(
                            format!("Promise<typeof import({})>", crate::emit::string_literal(&spec)).into(),
                        );
                    }
                    _ => {}
                }
                if let Some(TypeName::Def(def)) = self.type_names.get(name).cloned() {
                    if self.out.defs[def].class.is_some() {
                        return self.construct_class(expr, call, def, name);
                    }
                    if matches!(self.out.defs[def].kind, DefKind::Struct(_)) {
                        // `Regex("\\d+")`: an `init` of an extension, beside the memberwise one
                        // (Swift keeps both), when the arguments are not the fields by name.
                        let init = crate::extensions::init_name(
                            name,
                            call.args.iter().map(|a| Some(a.label.as_ref().map_or("_", |l| l.name.as_str()))),
                        );
                        if !call.args.iter().any(|a| a.spread)
                            && let Some(local) = self.lookup(&init)
                        {
                            self.out.names.insert(call.callee.id, NameRes::Local(local));
                            let ty = self.out.locals[local].ty.clone();
                            let ty = self.instantiate(&ty);
                            return self.value_call(expr, call, &ty);
                        }
                        return self.construct(expr, call, def, Vec::new(), expected, false);
                    }
                    self.report(
                        Diagnostic::error(
                            "B0208",
                            call.callee.span,
                            format!("`{name}` is an enum: construct one of its cases"),
                        )
                        .label("an enum is not called")
                        .help(format!("write `{name}.case(…)`"))
                        .spec("45-enums-option-and-result"),
                    );
                    return Ty::Unknown;
                }
                if let Some(spec) = ui::node_by_constructor(name) {
                    return self.node_call(expr, call, spec.kind);
                }
                self.unknown_name(call.callee.span, name);
                self.args_unchecked(call);
                Ty::Unknown
            }
            ExprKind::TypeApply { name, args } if matches!(name.name.as_str(), "Map" | "Set") => {
                let ty = self.resolve_type(&TypeExpr {
                    kind: TypeKind::Named { name: name.clone(), args: args.clone() },
                    span: call.callee.span,
                });
                self.collection(expr, call, name.name == "Map", Some(ty), expected)
            }
            ExprKind::TypeApply { name, args } => {
                let args: Vec<Ty> = args.iter().map(|a| self.resolve_type(a)).collect();
                if name.name == "Partial" {
                    return match args.first().map(|a| self.resolve(a)) {
                        Some(Ty::Adt(def, targs))
                            if matches!(self.out.defs[def].kind, DefKind::Struct(_)) =>
                        {
                            self.construct(expr, call, def, targs, expected, true)
                        }
                        _ => {
                            self.report(
                                Diagnostic::error("B0204", call.callee.span, "`Partial<…>` takes a struct")
                                    .label("not a struct")
                                    .spec("44-structs"),
                            );
                            Ty::Unknown
                        }
                    };
                }
                match self.type_names.get(&name.name).cloned() {
                    Some(TypeName::Def(def)) if matches!(self.out.defs[def].kind, DefKind::Struct(_)) => {
                        self.construct(expr, call, def, args, expected, false)
                    }
                    _ => {
                        self.report(
                            Diagnostic::error(
                                "B0208",
                                call.callee.span,
                                format!("`{}<…>` cannot be called", name.name),
                            )
                            .label("not a struct")
                            .spec("44-structs"),
                        );
                        Ty::Unknown
                    }
                }
            }
            ExprKind::Field(object, member) => {
                // `Skeleton.Region(…) { … }` on `import * as Skeleton`: a member the module
                // exports as a component is drawn as one (its builder its `children`).
                // `Button.Group(…) { … }`: an UpperCamel static of a TS component is one too
                // (`Button: … & { Group: typeof Group }`); TS checks its props.
                if let ExprKind::Name(ns) = &object.kind
                    && member.name.starts_with(|c: char| c.is_ascii_uppercase())
                    && let Some(local) = self.lookup(ns)
                {
                    let props = match self.out.locals[local].kind {
                        LocalKind::Import { .. } => match self.ts_namespaces.get(ns).cloned() {
                            Some(file) => self.namespace_component(&file, ns, &member.name),
                            // An UpperCamel TS value Bloom could not type is a component (as
                            // `Button(…)` is), and so is its UpperCamel static.
                            None => (ns.starts_with(|c: char| c.is_ascii_uppercase())
                                && matches!(
                                    self.resolve(&self.out.locals[local].ty.clone()),
                                    Ty::Foreign(_)
                                )
                                && !self.out.constructors.contains(&local))
                            .then(|| Ty::Foreign("".into())),
                        },
                        LocalKind::Component { .. } => Some(Ty::Foreign("".into())),
                        _ => None,
                    };
                    if let Some(props) = props {
                        // The callee is a TS path (`Button.Group`), read as is.
                        self.out.names.insert(object.id, NameRes::Local(local));
                        self.out.types.insert(object.id, self.out.locals[local].ty.clone());
                        self.out.fields.insert(call.callee.id, FieldRes::Field);
                        self.out.types.insert(call.callee.id, Ty::Foreign("".into()));
                        return self.component_call(expr, call, &props);
                    }
                }
                // `Type.m(…)`: an extension's static function.
                if let ExprKind::Name(type_name) = &object.kind
                    && self.lookup(type_name).is_none()
                    && let Some(ty) = self.static_member(&call.callee, type_name, member)
                {
                    self.out.types.insert(call.callee.id, ty.clone());
                    return self.value_call(expr, call, &ty);
                }
                // `Type.case(…)`, `Type<T>.case(…)`.
                let case_def = match &object.kind {
                    ExprKind::Name(type_name) if self.lookup(type_name).is_none() => {
                        match self.type_names.get(type_name).cloned() {
                            Some(TypeName::Def(def)) => Some((def, Vec::new())),
                            _ => None,
                        }
                    }
                    ExprKind::TypeApply { name, args } => match self.type_names.get(&name.name).cloned() {
                        Some(TypeName::Def(def)) => {
                            Some((def, args.iter().map(|a| self.resolve_type(a)).collect()))
                        }
                        _ => None,
                    },
                    _ => None,
                };
                if let Some((def, targs)) = case_def {
                    // `S.patch(field: v)` builds a `Partial<S>`.
                    if member.name == "patch" && matches!(self.out.defs[def].kind, DefKind::Struct(_)) {
                        if keyed(call) {
                            let targs = if targs.is_empty() {
                                (0..self.out.defs[def].generics.len()).map(|_| self.fresh()).collect()
                            } else {
                                targs
                            };
                            return self.keyed(expr, call, def, targs, true);
                        }
                        return self.construct(expr, call, def, targs, expected, true);
                    }
                    return self.case_call(expr, call, def, member, targs, expected);
                }
                // The receiver is the same chain: `.task` may sit anywhere in the root's chain.
                self.task_allowed = task_allowed;
                let recv = self.expr(object, None);
                self.task_allowed = false;
                if let Some(inner) = self.unchain(object, &recv) {
                    let ret = self.member_call(expr, call, &inner, member, object.span, false, false);
                    return self.rechain(expr, ret);
                }
                let recv = self.resolve(&recv);
                self.member_call(expr, call, &recv, member, object.span, task_allowed, false)
            }
            ExprKind::ImplicitMember(name) => {
                let target = match expected.map(|e| self.resolve(e)) {
                    Some(Ty::Option(inner)) => self.resolve(&inner),
                    Some(other) => other,
                    None => Ty::Unknown,
                };
                match target {
                    Ty::Adt(def, targs) => self.case_call(expr, call, def, name, targs, expected),
                    _ => {
                        self.report(
                            Diagnostic::error(
                                "B0212",
                                call.callee.span,
                                format!("which type's case is `.{}`?", name.name),
                            )
                            .label("no enum type is expected here")
                            .help(format!("name the type: `Type.{}(…)`", name.name))
                            .spec("3-grammar-ebnf"),
                        );
                        self.args_unchecked(call);
                        Ty::Unknown
                    }
                }
            }
            _ => {
                let ty = self.expr(&call.callee, None);
                let ty = self.resolve(&ty);
                self.value_call(expr, call, &ty)
            }
        }
    }

    /// `recv.member(…)` once `recv` is typed; `optional`: written `recv?.member(…)`.
    #[allow(clippy::too_many_arguments)]
    fn member_call(
        &mut self,
        expr: &Expr,
        call: &Call,
        recv: &Ty,
        member: &Ident,
        object_span: Span,
        task_allowed: bool,
        optional: bool,
    ) -> Ty {
        // `x.formatted(fractionDigits: 2)`: `x` with exactly that many decimals, as JS's
        // `toFixed` writes it (`"3.14"`, never localized; `formatted(digits:)` is the
        // localized one).
        if matches!(self.resolve(recv), Ty::Int | Ty::Float)
            && member.name == "formatted"
            && call.trailing.is_none()
            && let [arg] = call.args.as_slice()
            && arg.label.as_ref().is_some_and(|l| l.name == "fractionDigits")
            && !arg.spread
            // `formatted(fractionDigits: 0...3)` is the localized one, a `ClosedRange` (stdlib).
            && !matches!(&arg.value.kind, ExprKind::Binary(op, ..) if op.is_range())
        {
            self.expr(&arg.value, Some(&Ty::Int));
            let recv_kind = if self.resolve(recv) == Ty::Int { Recv::Int } else { Recv::Float };
            self.out.calls.insert(expr.id, CallRes::Method { recv: recv_kind, name: "toFixed" });
            return Ty::Str;
        }
        if let Some(ret) = self.extension_call(expr, call, recv, member) {
            if let (Some(CallRes::Extension { func, .. }), ExprKind::Field(object, _)) =
                (self.out.calls.get(&expr.id).cloned(), &call.callee.kind)
            {
                self.observe(object, super::Read::Member(func.to_string()));
            }
            return ret;
        }
        if matches!(recv, Ty::Param(..) | Ty::Any(_))
            && let Some((witness, requirement)) = self.requirement(recv, &member.name)
        {
            let Ty::Fn(f) = requirement.ty.clone() else {
                let ty = requirement.ty.clone();
                self.out
                    .fields
                    .insert(call.callee.id, FieldRes::Witness { witness, member: member.name.clone() });
                return self.value_call(expr, call, &ty);
            };
            self.throwing_call(expr.span, &f);
            let (order, rest) = self.bloom_args(call, &f, false);
            self.out
                .calls
                .insert(expr.id, CallRes::Witness { witness, member: member.name.clone(), order, rest });
            return if f.is_async { Ty::Async(Box::new(f.ret.clone())) } else { f.ret.clone() };
        }
        match recv {
            Ty::View(kind) if !optional => self.modifier(expr, call, *kind, member, recv, task_allowed),
            Ty::Adt(def, targs)
                if !optional
                    && member.name == "with"
                    && matches!(self.out.defs[*def].kind, DefKind::Struct(_)) =>
            {
                let (def, targs) = (*def, targs.clone());
                self.with_update(expr, call, def, targs)
            }
            // `trends.enumerated()` on a TS value Bloom could not type (`Foreign`): a Bloom list's
            // method JS does not have, which would throw at run time ("enumerated is not a
            // function"). TS's own members (`map`, `filter`, `slice`) stay TS's to check.
            Ty::Foreign(text)
                if SWIFT_ONLY_MEMBERS.contains(&member.name.as_str())
                    && !super::is_element(&Ty::Foreign(text.clone())) =>
            {
                let help = format!(
                    "give it its Bloom type first (`let items: [Item] = …`), and `.{}` is the list's",
                    member.name
                );
                self.report(
                    Diagnostic::error(
                        "B0601",
                        member.span,
                        format!(
                            "`.{}` is a Bloom list's, and this is a TS value Bloom could not type",
                            member.name
                        ),
                    )
                    .label("a JS array has no such method")
                    .help(help)
                    .spec("47-the-foreign-boundary"),
                );
                self.args_unchecked(call);
                Ty::Unknown
            }
            Ty::Foreign(_) | Ty::Adt(..) => {
                let field = self.member(&call.callee, recv, member, object_span);
                self.out.types.insert(call.callee.id, field.clone());
                self.value_call(expr, call, &field)
            }
            Ty::Unknown => {
                self.args_unchecked(call);
                Ty::Unknown
            }
            _ => self.method_call(expr, call, recv, member),
        }
    }

    fn environment_key_value(&mut self, expr: &Expr, call: &Call) -> Ty {
        let (Some(name), Some(default)) = (
            call.args.iter().find(|a| a.label.is_none()),
            call.args.iter().find(|a| a.label.as_ref().is_some_and(|l| l.name == "default")),
        ) else {
            self.report(
                Diagnostic::error("B0207", call.callee.span, "`EnvironmentKey` takes a name and its default")
                    .label("`EnvironmentKey(\"session\", default: …)`")
                    .spec("74-environment"),
            );
            self.args_unchecked(call);
            return Ty::Unknown;
        };
        self.expr(&name.value, Some(&Ty::Str));
        let ty = self.expr(&default.value, None);
        let ty = self.zonk(&ty);
        self.out.calls.insert(expr.id, CallRes::EnvironmentKey);
        self.env_values.insert(expr.id, ty.clone());
        let text = crate::check::members::ts_text(&self.out.defs, &ty).unwrap_or_else(|| "unknown".into());
        Ty::Foreign(format!("import(\"@oxy.so/bloom-language\").EnvironmentKey<{text}>").into())
    }

    /// `Model(…)`: a class's `init` (`T$$init`), or `new T()` when it has none.
    fn construct_class(&mut self, expr: &Expr, call: &Call, def: DefId, name: &str) -> Ty {
        let init = crate::extensions::mangle(name, "init", true);
        if let Some(local) = self.lookup(&init) {
            self.out.names.insert(call.callee.id, NameRes::Local(local));
            let ty = self.out.locals[local].ty.clone();
            let ty = self.instantiate(&ty);
            return self.value_call(expr, call, &ty);
        }
        if !call.args.is_empty() || call.trailing.is_some() {
            self.report(
                Diagnostic::error(
                    "B0207",
                    call.callee.span,
                    format!("class `{name}` has no `init` taking arguments"),
                )
                .label("its fields start at their values")
                .help(format!("write `{name}()`, or add `init(…)` to it"))
                .spec("49-classes-and-observable-models"),
            );
            self.args_unchecked(call);
        }
        self.out.calls.insert(expr.id, CallRes::New(def));
        let count = self.out.defs[def].generics.len();
        let args = (0..count).map(|_| self.fresh()).collect();
        Ty::Adt(def, args)
    }

    /// `x.m(…)` with `m` an extension method of `x`'s type (`crate::extensions`), unless the
    /// type has a field, a built-in method or a modifier of that name.
    fn extension_call(&mut self, expr: &Expr, call: &Call, recv: &Ty, member: &Ident) -> Option<Ty> {
        let shadowed = match recv {
            Ty::Adt(def, _) => self.out.defs[*def].fields().iter().any(|f| f.name == member.name),
            Ty::View(_) | Ty::Foreign(_) | Ty::Unknown => true,
            // Swift's `s.contains(regex)` and `s.split(separator: regex)`: the standard
            // library's `Regex` overloads of the string's own methods.
            Ty::Str if member.name == "contains" && self.regex_arg(call) => false,
            Ty::Str
                if member.name == "split"
                    && call.args.iter().any(|a| a.label.as_ref().is_some_and(|l| l.name == "separator")) =>
            {
                false
            }
            other => method_names(other).contains(&member.name.as_str()),
        };
        if shadowed {
            return None;
        }
        let (func, local) = self.extension_fn(recv, &member.name, false)?;
        let fn_ty = self.out.locals[local].ty.clone();
        let Ty::Fn(f) = self.instantiate(&fn_ty) else { return None };
        let (first, params) = f.params.split_first()?;
        if !self.unify(&first.ty, recv) {
            self.mismatch(member.span, recv, &first.ty);
        }
        self.throwing_call(expr.span, &f);
        self.witnesses_of(expr, member.span, &f);
        let rest = FnTy { params: params.to_vec(), ..(*f).clone() };
        let (order, rest_args) = self.bloom_args(call, &rest, false);
        self.task_signal(expr, &rest.params, &order);
        self.out.calls.insert(expr.id, CallRes::Extension { func, order, rest: rest_args });
        Some(if f.is_async { Ty::Async(Box::new(f.ret.clone())) } else { f.ret.clone() })
    }

    /// Whether a call's one argument is a `Regex` (a name or a field holding one, or a
    /// `Regex(…)` built in place), read without checking it: what picks `String.contains(_: Regex)`.
    fn regex_arg(&self, call: &Call) -> bool {
        let [arg] = call.args.as_slice() else { return false };
        if arg.label.is_some() {
            return false;
        }
        let mut value = &arg.value;
        while let ExprKind::Try(inner) | ExprKind::Paren(inner) = &value.kind {
            value = inner;
        }
        let is_regex =
            |ty: &Ty| matches!(self.resolve(ty), Ty::Adt(def, _) if self.out.defs[def].name == "Regex");
        match &value.kind {
            ExprKind::Name(name) => self.lookup(name).is_some_and(|l| is_regex(&self.out.locals[l].ty)),
            ExprKind::Call(c) => {
                matches!(&c.callee.kind, ExprKind::Name(n) if n == "Regex")
                    || matches!(&c.callee.kind, ExprKind::Field(object, _) if matches!(&object.kind, ExprKind::Name(n) if n == "Regex"))
            }
            _ => false,
        }
    }

    /// What `?.` reaches: the value of an optional; `None` (reported) when `ty` is never `none`.
    fn optional_target(&mut self, ty: &Ty, span: Span, fix: (Span, &str)) -> Option<Ty> {
        match self.resolve(ty) {
            Ty::Option(inner) => Some(self.resolve(&inner)),
            Ty::Foreign(_) | Ty::Unknown => None,
            other => {
                self.report(
                    Diagnostic::error(
                        "B0201",
                        span,
                        format!("`?.` reads an optional, and this is {}", self.show(&other)),
                    )
                    .label("never `none`")
                    .help(if fix.1.is_empty() { "call it: `f(…)`" } else { "write `.`" })
                    .fix(fix.0, fix.1)
                    .spec("45-enums-option-and-result"),
                );
                None
            }
        }
    }

    /// `Map(entries)` / `Set(values)`, or empty: `Map()`, `Map<K, V>()`, typed by
    /// what is expected when the type is not written.
    fn collection(
        &mut self,
        expr: &Expr,
        call: &Call,
        map: bool,
        written: Option<Ty>,
        expected: Option<&Ty>,
    ) -> Ty {
        let ty = match written.or_else(|| expected.map(|e| self.resolve(e))) {
            Some(Ty::Option(inner)) => self.resolve(&inner),
            Some(ty @ (Ty::JsMap(..) | Ty::Set(_) | Ty::Unknown)) => ty,
            _ if map => Ty::JsMap(Box::new(self.fresh()), Box::new(self.fresh())),
            _ => Ty::Set(Box::new(self.fresh())),
        };
        let items = match &ty {
            Ty::JsMap(k, v) => Ty::List(Box::new(Ty::Tuple(vec![(**k).clone(), (**v).clone()]))),
            Ty::Set(t) => Ty::List(t.clone()),
            _ => Ty::Unknown,
        };
        if call.args.len() > 1
            || call.trailing.is_some()
            || call.args.iter().any(|a| a.label.is_some() || a.spread)
        {
            let what = if map {
                "`Map(entries)` takes one list of `(key, value)`"
            } else {
                "`Set(values)` takes one list"
            };
            self.report(
                Diagnostic::error("B0207", call.callee.span, what)
                    .label("one positional argument, or none")
                    .spec("12-standard-library-surface-draft"),
            );
        }
        if let Some(arg) = call.args.first() {
            self.expr(&arg.value, Some(&items));
        }
        self.out.calls.insert(expr.id, CallRes::Collection(ty.clone()));
        ty
    }

    /// `catching { … }`: runs the block; its value is `ok`, and what TS code in it threw is
    /// `err` (an `Error`). The block is inlined, so it cannot `return`.
    fn catching(&mut self, expr: &Expr, call: &Call) -> Ty {
        let Some(block) = call.trailing.as_deref().filter(|c| c.params.is_empty() && call.args.is_empty())
        else {
            self.report(
                Diagnostic::error("B0207", call.callee.span, "`catching` takes a block: `catching { … }`")
                    .label("a trailing block, no arguments")
                    .spec("12-standard-library-surface-draft"),
            );
            self.args_unchecked(call);
            return Ty::Unknown;
        };
        if let Some(ret) = block.body.iter().find(|s| matches!(s.kind, StmtKind::Return(_))) {
            self.report(
                Diagnostic::error("B0207", ret.span, "`return` inside `catching { … }`")
                    .label("the block's last line is its value")
                    .spec("12-standard-library-surface-draft"),
            );
        }
        self.closure_throws = true;
        let ty = self.closure(block, None, false);
        self.out.calls.insert(expr.id, CallRes::Catching);
        let value = match self.resolve(&ty) {
            Ty::Fn(f) => f.ret.clone(),
            _ => Ty::Unknown,
        };
        Ty::Result(Box::new(value), Box::new(Ty::JsError))
    }

    /// `min(a, b, …)`, `max`, `abs(x)`, `round`, `floor`, `ceil`: the prelude's numbers.
    fn math(&mut self, expr: &Expr, call: &Call, name: &str) -> Ty {
        let name: &'static str = match name {
            "min" => "min",
            "max" => "max",
            "abs" => "abs",
            "round" => "round",
            "floor" => "floor",
            _ => "ceil",
        };
        let many = matches!(name, "min" | "max");
        if call.trailing.is_some()
            || call.args.iter().any(|a| a.label.is_some())
            || (!many && call.args.len() != 1)
            || (many && call.args.len() < 2 && !call.args.iter().any(|a| a.spread))
        {
            let what = if many {
                format!("`{name}` takes two or more numbers (or `..xs`)")
            } else {
                format!("`{name}` takes one number")
            };
            self.report(
                Diagnostic::error("B0207", call.callee.span, what)
                    .label("its arguments")
                    .spec("12-standard-library-surface-draft"),
            );
        }
        let mut ty = Ty::Int;
        for arg in &call.args {
            let t = self.expr(&arg.value, None);
            let t = match self.resolve(&t) {
                Ty::List(e) if arg.spread => self.resolve(&e),
                other => other,
            };
            match t {
                Ty::Float => ty = Ty::Float,
                Ty::Int | Ty::Unknown => {}
                other => self.operand_error(arg.value.span, &format!("`{name}`"), &other),
            }
        }
        self.out.calls.insert(expr.id, CallRes::Math(name));
        match name {
            "round" | "floor" | "ceil" => Ty::Int,
            _ => ty,
        }
    }

    /// Checks the arguments of a call that already failed, so their own errors show.
    fn args_unchecked(&mut self, call: &Call) {
        for arg in &call.args {
            self.boundary(&arg.value, None);
        }
        if let Some(trailing) = &call.trailing {
            self.closure(trailing, None, true);
        }
    }

    /// Positional arguments of fixed types (prelude functions, methods).
    fn positional(&mut self, call: &Call, params: &[Ty]) {
        let count = call.args.len() + usize::from(call.trailing.is_some());
        if count != params.len() {
            let span = call.args.first().map_or(call.callee.span, |a| a.span);
            self.report(
                Diagnostic::error(
                    "B0207",
                    span,
                    format!("this takes {} argument(s), not {count}", params.len()),
                )
                .label("wrong number of arguments")
                .spec("5-values-functions-and-closures"),
            );
        }
        for (arg, ty) in call.args.iter().zip(params) {
            self.expr(&arg.value, Some(ty));
        }
        if let (Some(trailing), Some(ty)) = (&call.trailing, params.get(call.args.len())) {
            let closure = self.closure(trailing, Some(ty), false);
            if !self.coerce(&closure, ty) {
                self.mismatch(trailing.span, &closure, ty);
            }
        }
    }

    /// `fail(e)`: throws `e` from a closure TS calls (or `catching { … }`'s block),
    /// where a thrown error is how TS hears of it. Elsewhere a failure is a value.
    fn fail(&mut self, expr: &Expr, call: &Call) -> Ty {
        self.out.calls.insert(expr.id, CallRes::Fail);
        self.positional(call, &[Ty::JsError]);
        if !self.frames.last().is_some_and(|f| f.throws) {
            let ret = self.frames.last().map(|f| self.resolve(&f.ret));
            let help = match ret {
                Some(Ty::Result(..)) => "return the error: `return err(e)`".to_string(),
                _ => "return a `Result` and `return err(e)`; only a closure TS calls throws".to_string(),
            };
            self.report(
                Diagnostic::error("B0222", expr.span, "`fail(e)` throws, and nothing here catches a throw")
                    .label("not a closure TS calls, nor `catching { … }`")
                    .help(help)
                    .spec("8-effects-tasks-and-concurrency"),
            );
        }
        Ty::Never
    }

    /// In a `.task`, work that takes a cancellation (`cancellation: TaskSignal?`) and is given
    /// none takes the task's, as Swift's child work is cancelled with its task.
    fn task_signal(&mut self, expr: &Expr, params: &[ParamTy], order: &[Option<usize>]) {
        if self.frames.iter().any(|frame| frame.task)
            && let Some(slot) = params.iter().position(|p| {
                p.labelled
                    && p.name.as_deref() == Some("cancellation")
                    && matches!(&p.ty, Ty::Option(inner) if matches!(&**inner, Ty::Foreign(t) if &**t == "AbortSignal"))
            })
            && order.get(slot) == Some(&None)
        {
            self.out.implicit_signals.insert(expr.id, slot);
        }
    }

    /// Calling a value of type `ty`: a Bloom function, a TS function, or a foreign value.
    fn value_call(&mut self, expr: &Expr, call: &Call, ty: &Ty) -> Ty {
        match self.resolve(ty) {
            Ty::Fn(f) if f.ts => {
                self.ts_args(expr, call, &f);
                f.ret.clone()
            }
            Ty::Fn(f) => {
                self.throwing_call(expr.span, &f);
                self.witnesses_of(expr, call.callee.span, &f);
                let (order, rest) = self.bloom_args(call, &f, false);
                self.task_signal(expr, &f.params, &order);
                self.out.calls.insert(expr.id, CallRes::Bloom { order, rest });
                if f.is_async { Ty::Async(Box::new(f.ret.clone())) } else { f.ret.clone() }
            }
            Ty::Foreign(text) => {
                self.out.calls.insert(expr.id, CallRes::Ts);
                // A literal given to a TS function Bloom cannot read (`StyleSheet.create(video:
                // { minHeight: web ? "var(…)" : 384 })`): TS's to check against the parameter, as
                // any literal where a TS type is expected, element by element.
                let positional = call.args.iter().filter(|a| a.label.is_none() && !a.spread).count();
                let mut index = 0;
                for arg in &call.args {
                    let context = if arg.spread || !super::literal_shaped(&arg.value) || text.is_empty() {
                        None
                    } else if let Some(label) = &arg.label {
                        Some(format!(
                            "NonNullable<Parameters<{text}>[{positional}]>[{}]",
                            crate::emit::string_literal(&label.name)
                        ))
                    } else {
                        Some(format!("NonNullable<Parameters<{text}>[{index}]>"))
                    };
                    if arg.label.is_none() && !arg.spread {
                        index += 1;
                    }
                    let context = context.map(|c| Ty::Foreign(c.into()));
                    self.boundary(&arg.value, context.as_ref());
                }
                if let Some(trailing) = &call.trailing {
                    self.closure(trailing, None, true);
                }
                foreign_of(&text, |t| format!("ReturnType<{t}>"))
            }
            // A TS value callable by its call signatures beside its members (zustand's store
            // hook: `useStore()`, `useStore { s in s.items }`, `useStore.getState()`), as a Swift
            // value with `callAsFunction` overloads is: the signature the arguments fit, by count
            // (TS's overloads differ in it), first one first; generic, so `U` is the closure's.
            Ty::Adt(def, args) if self.out.defs[def].fields().iter().any(|f| f.name == crate::ts::CALL) => {
                let named = call.args.iter().any(|a| a.label.is_some());
                let given = call.args.iter().filter(|a| a.label.is_none()).count()
                    + usize::from(named)
                    + usize::from(call.trailing.is_some());
                let signatures: Vec<Ty> = self.out.defs[def]
                    .fields()
                    .iter()
                    .filter(|f| f.name == crate::ts::CALL)
                    .map(|f| substitute(&f.ty, &args))
                    .collect();
                let fits = |ty: &Ty| match ty {
                    Ty::Fn(f) => {
                        let required = f.params.iter().filter(|p| !p.optional && !p.rest).count();
                        required <= given && (given <= f.params.len() || f.params.iter().any(|p| p.rest))
                    }
                    _ => false,
                };
                let chosen = signatures.iter().find(|t| fits(t)).or(signatures.last()).cloned();
                let ty = chosen.map_or(Ty::Unknown, |t| self.instantiate(&t));
                self.value_call(expr, call, &ty)
            }
            Ty::Unknown => {
                self.args_unchecked(call);
                Ty::Unknown
            }
            other => {
                self.report(
                    Diagnostic::error(
                        "B0208",
                        call.callee.span,
                        format!("{} cannot be called", self.show(&other)),
                    )
                    .label("not a function")
                    .spec("5-values-functions-and-closures"),
                );
                self.args_unchecked(call);
                Ty::Unknown
            }
        }
    }

    /// Named arguments in any order after the positional ones (spec 5);
    /// a trailing closure is the next parameter that takes a function.
    /// `props`: a view's call, where `..r` spreads a record's fields as its props (JSX's
    /// `{...r}`); a later prop of the same name wins.
    fn bloom_args(&mut self, call: &Call, f: &FnTy, props: bool) -> (Vec<Option<usize>>, Vec<usize>) {
        let mut order: Vec<Option<usize>> = vec![None; f.params.len()];
        let mut spread_given = vec![false; f.params.len()];
        let mut rest = Vec::new();
        let rest_slot = f.params.last().filter(|p| p.rest).map(|_| f.params.len() - 1);
        let mut next = 0;
        let mut deferred = Vec::new();
        for (index, arg) in call.args.iter().enumerate() {
            if props && arg.spread && arg.label.is_none() {
                self.spread_arg(arg, f, index, &mut order, &mut spread_given);
                continue;
            }
            // Positional arguments past the others go to the rest parameter.
            if arg.label.is_none()
                && let Some(slot) = rest_slot
                && (arg.spread || (next..slot).all(|i| order[i].is_some()))
            {
                let element = f.params[slot].ty.clone();
                self.rest_arg(arg, &element, false);
                rest.push(index);
                next = slot;
                continue;
            }
            if arg.spread {
                self.spread_not_rest(arg);
                continue;
            }
            let slot = match &arg.label {
                Some(label) => {
                    match f
                        .params
                        .iter()
                        .position(|p| !p.positional && p.name.as_deref() == Some(label.name.as_str()))
                    {
                        Some(slot) => slot,
                        None => {
                            let names: Vec<&str> = f
                                .params
                                .iter()
                                .filter(|p| !p.positional)
                                .filter_map(|p| p.name.as_deref())
                                .collect();
                            let help = closest(&label.name, names.iter().copied())
                                .map(|near| format!("did you mean `{near}:`?"))
                                .unwrap_or_else(|| {
                                    format!(
                                        "the parameters are {}",
                                        names.iter().map(|n| format!("`{n}`")).collect::<Vec<_>>().join(", ")
                                    )
                                });
                            self.report(
                                Diagnostic::error(
                                    "B0207",
                                    label.span,
                                    format!("no parameter is named `{}`", label.name),
                                )
                                .label("unknown label")
                                .help(help)
                                .spec("5-values-functions-and-closures"),
                            );
                            self.boundary(&arg.value, None);
                            continue;
                        }
                    }
                }
                None => {
                    while next < order.len() && order[next].is_some() {
                        next += 1;
                    }
                    if next >= rest_slot.unwrap_or(order.len()) {
                        self.report(
                            Diagnostic::error(
                                "B0207",
                                arg.span,
                                format!("this takes {} argument(s); this one is extra", f.params.len()),
                            )
                            .label("an extra argument")
                            .help("remove it")
                            .fix(arg.span, "")
                            .spec("5-values-functions-and-closures"),
                        );
                        self.boundary(&arg.value, None);
                        continue;
                    }
                    // A `func`'s labelled parameter is named by the call (Swift's labels).
                    if f.params[next].labelled
                        && let Some(name) = f.params[next].name.as_deref()
                    {
                        self.report(
                            Diagnostic::error(
                                "B0207",
                                arg.span,
                                format!("missing argument label `{name}:`"),
                            )
                            .label(format!("this argument is `{name}`"))
                            .help(format!(
                                "write `{name}: …`, or declare the parameter `_ {name}` to call it by position"
                            ))
                            .fix(Span::new(arg.span.start, arg.span.start), format!("{name}: "))
                            .spec("5-values-functions-and-closures"),
                        );
                    }
                    next
                }
            };
            if order[slot].is_some() && !std::mem::take(&mut spread_given[slot]) {
                self.report(
                    Diagnostic::error("B0207", arg.span, "this parameter is given twice")
                        .label("already given")
                        .spec("5-values-functions-and-closures"),
                );
                continue;
            }
            order[slot] = Some(index);
            let ty = f.params[slot].ty.clone();
            // String literals given for a generic parameter (`choices(["a", "b"], chosen, …)`)
            // are checked after the other arguments: `T` is then what a typed one says (a TS
            // literal union), not the `String` the literals alone would make it.
            if literal_strings(&arg.value) && self.has_var(&ty) {
                deferred.push((index, ty));
                continue;
            }
            self.expr(&arg.value, Some(&ty));
        }
        for (index, ty) in deferred {
            self.expr(&call.args[index].value, Some(&ty));
        }
        if let Some(trailing) = &call.trailing {
            let slot = (0..order.len())
                .rev()
                .find(|&i| order[i].is_none() && matches!(self.resolve(&f.params[i].ty), Ty::Fn(_)));
            // A view's stored `View`/`View?` (`children`, `content`) takes the trailing
            // builder, as Swift's `@ViewBuilder let content: Content` does: its lines are
            // the children, passed as the prop's value.
            let builder = slot.is_none() && props;
            let slot = slot.or_else(|| {
                builder
                    .then(|| {
                        (0..order.len()).rev().find(|&i| {
                            order[i].is_none()
                                && match self.resolve(&f.params[i].ty) {
                                    Ty::View(_) => true,
                                    Ty::Option(inner) => matches!(self.resolve(&inner), Ty::View(_)),
                                    _ => false,
                                }
                        })
                    })
                    .flatten()
            });
            match slot {
                Some(slot) if builder => {
                    order[slot] = Some(call.args.len());
                    self.builder_closure(trailing);
                    self.out.builder_props.insert(trailing.span);
                }
                Some(slot) => {
                    order[slot] = Some(call.args.len());
                    let ty = f.params[slot].ty.clone();
                    let closure = self.closure(trailing, Some(&ty), false);
                    if !self.coerce(&closure, &ty) {
                        self.mismatch(trailing.span, &closure, &ty);
                    }
                }
                None => {
                    self.report(
                        Diagnostic::error("B0207", trailing.span, "no parameter takes this trailing closure")
                            .label(if props {
                                "a trailing closure fills a function parameter, or a view's `View` property"
                            } else {
                                "a trailing closure fills a function parameter"
                            })
                            .spec("5-values-functions-and-closures"),
                    );
                    self.closure(trailing, None, false);
                }
            }
        }
        let missing: Vec<String> = f
            .params
            .iter()
            .zip(&order)
            .filter(|(p, given)| given.is_none() && !p.optional && !p.rest)
            .enumerate()
            .map(|(index, (p, _))| match &p.name {
                Some(name) if !p.positional => format!("`{name}`"),
                _ => format!("the {} (unlabelled)", ordinal(index + 1)),
            })
            .collect();
        if !missing.is_empty() {
            let at = call.args.last().map_or(call.callee.span, |a| a.span);
            self.report(
                Diagnostic::error("B0207", at, format!("missing argument(s): {}", missing.join(", ")))
                    .label("this call leaves them out")
                    .help(format!("pass them: `{}: …`", missing[0].trim_matches('`')))
                    .spec("5-values-functions-and-closures"),
            );
        }
        (order, rest)
    }

    /// `..r` among a view's props: each of the record's fields a prop takes, checked
    /// against it; the record may have more.
    fn spread_arg(
        &mut self,
        arg: &Arg,
        f: &FnTy,
        index: usize,
        order: &mut [Option<usize>],
        spread_given: &mut [bool],
    ) {
        let ty = self.expr(&arg.value, None);
        let fields = match self.resolve(&ty) {
            Ty::Adt(def, targs) if matches!(self.out.defs[def].kind, DefKind::Struct(_)) => self.out.defs
                [def]
                .fields()
                .iter()
                .map(|field| (field.name.clone(), substitute(&field.ty, &targs)))
                .collect::<Vec<_>>(),
            Ty::Unknown => return,
            other => {
                self.report(
                    Diagnostic::error(
                        "B0207",
                        arg.span,
                        format!(
                            "`..` spreads a record's fields as props, and {} is not one",
                            self.show(&other)
                        ),
                    )
                    .label("not a struct or record")
                    .spec("71-views-and-state"),
                );
                return;
            }
        };
        for (name, field) in fields {
            let Some(slot) = f.params.iter().position(|p| p.name.as_deref() == Some(name.as_str())) else {
                continue;
            };
            let param = f.params[slot].ty.clone();
            if !self.coerce(&field, &param) {
                self.mismatch(arg.span, &field, &param);
            }
            order[slot] = Some(index);
            spread_given[slot] = true;
        }
    }

    /// An argument a rest parameter of `element`s takes: one element, or `..xs` of a list of them.
    fn rest_arg(&mut self, arg: &Arg, element: &Ty, ts: bool) {
        let list;
        let ty = if arg.spread {
            list = Ty::List(Box::new(element.clone()));
            &list
        } else {
            element
        };
        if ts {
            self.boundary(&arg.value, Some(ty));
        } else {
            self.expr(&arg.value, Some(ty));
        }
    }

    /// `..value` where no rest parameter takes it.
    fn spread_not_rest(&mut self, arg: &Arg) {
        self.report(
            Diagnostic::error(
                "B0207",
                arg.span,
                "`..` spreads a list into a rest parameter, and none is here",
            )
            .label("no rest parameter takes it")
            .help("a struct spreads into a construction: `S(..s, field: v)`")
            .spec("5-values-functions-and-closures"),
        );
        self.boundary(&arg.value, None);
    }

    /// A TS function: positional arguments in order (a rest parameter takes the
    /// rest), named ones form one options object passed last (spec 5).
    /// The soft context of an argument given for a TS function's constrained type parameter
    /// (`useAnimatedStyle(() => ({ transform: [...] }))`, `<Style extends DefaultStyle>`): a
    /// literal for it, or a closure's result literal, is checked against the constraint, TS's
    /// type, element by element (as any literal where a TS type is expected), while the type
    /// parameter itself is left to TS to infer from it, with no excess-field check.
    fn soft_context(&mut self, f: &FnTy, param: &Ty, value: &Expr) -> Option<Ty> {
        if f.shapes.is_empty() {
            return None;
        }
        match &value.kind {
            ExprKind::Closure(_) => self.soft_callback(f, param),
            _ if super::literal_shaped(value) => self.constraint_of(f, param),
            _ => None,
        }
    }

    /// `param`, a function whose result is a constrained type parameter, with the constraint
    /// as its result.
    fn soft_callback(&mut self, f: &FnTy, param: &Ty) -> Option<Ty> {
        let Ty::Fn(callback) = self.resolve(param) else { return None };
        let ret = self.constraint_of(f, &callback.ret)?;
        Some(Ty::Fn(Rc::new(FnTy { ret, ..(*callback).clone() })))
    }

    /// The constraint of `ty` when it is one of `f`'s constrained type parameters.
    fn constraint_of(&mut self, f: &FnTy, ty: &Ty) -> Option<Ty> {
        let Ty::Var(var) = self.resolve(ty) else { return None };
        f.shapes.iter().find_map(|(param, shape)| match self.resolve(param) {
            Ty::Var(v) if v == var => Some(shape.clone()),
            _ => None,
        })
    }

    fn ts_args(&mut self, expr: &Expr, call: &Call, f: &FnTy) {
        self.out.calls.insert(expr.id, CallRes::Ts);
        let positional: Vec<&Arg> = call.args.iter().filter(|a| a.label.is_none()).collect();
        let named: Vec<&Arg> = call.args.iter().filter(|a| a.label.is_some()).collect();
        let mut slot = 0;
        for arg in &positional {
            let param = f
                .params
                .get(slot.min(f.params.len().saturating_sub(1)))
                .filter(|p| slot < f.params.len() || p.rest);
            if arg.spread {
                // `..xs` fills the rest parameter; the ones before it are given or optional.
                let rest = f.params.iter().position(|p| p.rest).filter(|&r| r >= slot);
                match rest {
                    Some(r) => {
                        let element = f.params[r].ty.clone();
                        self.rest_arg(arg, &element, true);
                        slot = r;
                    }
                    None => self.spread_not_rest(arg),
                }
                continue;
            }
            match param {
                Some(param) => {
                    // A TS optional parameter (`locale?: string`) takes an optional as well, as
                    // TS's `undefined` is `none` (R2); a closure still reads the function type.
                    let ty = match self.resolve(&param.ty) {
                        Ty::Option(_) | Ty::Foreign(_) | Ty::Unknown => param.ty.clone(),
                        _ if param.optional
                            && !param.rest
                            && !matches!(arg.value.kind, ExprKind::Closure(_)) =>
                        {
                            Ty::Option(Box::new(param.ty.clone()))
                        }
                        _ => param.ty.clone(),
                    };
                    match self.soft_context(f, &ty, &arg.value) {
                        Some(soft) => {
                            self.boundary(&arg.value, Some(&soft));
                        }
                        None => {
                            self.boundary(&arg.value, Some(&ty));
                        }
                    }
                }
                None => {
                    self.report(
                        Diagnostic::error(
                            "B0207",
                            arg.span,
                            format!("this takes {} argument(s); this one is extra", f.params.len()),
                        )
                        .label("an extra argument")
                        .fix(arg.span, "")
                        .spec("5-values-functions-and-closures"),
                    );
                    self.boundary(&arg.value, None);
                }
            }
            if !f.params.get(slot).is_some_and(|p| p.rest) {
                slot += 1;
            }
        }
        if !named.is_empty() {
            let options = f.params.get(slot).map(|p| self.resolve(&p.ty));
            match options {
                Some(Ty::Adt(def, targs)) if matches!(self.out.defs[def].kind, DefKind::Struct(_)) => {
                    let fields = self.out.defs[def].fields().to_vec();
                    for arg in &named {
                        let label = arg.label.as_ref().expect("named");
                        match fields.iter().find(|f| f.name == label.name) {
                            Some(field) => {
                                let ty = substitute(&field.ty, &targs);
                                self.boundary(&arg.value, Some(&ty));
                            }
                            None => {
                                self.unknown_field(label, &Ty::Adt(def, targs.clone()));
                                self.boundary(&arg.value, None);
                            }
                        }
                    }
                }
                Some(Ty::Option(inner)) if matches!(self.resolve(&inner), Ty::Adt(..)) => {
                    let inner = self.resolve(&inner);
                    let Ty::Adt(def, targs) = inner else { unreachable!() };
                    let fields = self.out.defs[def].fields().to_vec();
                    for arg in &named {
                        let label = arg.label.as_ref().expect("named");
                        let ty =
                            fields.iter().find(|f| f.name == label.name).map(|f| substitute(&f.ty, &targs));
                        if ty.is_none() {
                            self.unknown_field(label, &Ty::Adt(def, targs.clone()));
                        }
                        self.boundary(&arg.value, ty.as_ref());
                    }
                }
                Some(options) => {
                    // The options object for a constrained type parameter (`StyleSheet.create(
                    // video: { … })`, `<T extends NamedStyles<T>>`): each named value is checked
                    // against its member of the constraint, TS's type, as a literal's fields are.
                    let soft = self.constraint_of(f, &options);
                    for arg in &named {
                        let label = arg.label.as_ref().expect("named");
                        let member = soft.as_ref().and_then(|soft| match soft {
                            Ty::Foreign(path) => Some(Ty::Foreign(
                                format!("{path}[{}]", crate::emit::string_literal(&label.name)).into(),
                            )),
                            _ => None,
                        });
                        self.boundary(&arg.value, member.as_ref());
                    }
                }
                None => {
                    let label = named[0].label.as_ref().expect("named");
                    self.report(
                        Diagnostic::error("B0207", label.span, "this TS function takes no options object")
                            .label("named arguments form one object, passed last")
                            .help("pass the values in order")
                            .spec("5-values-functions-and-closures"),
                    );
                    for arg in &named {
                        self.boundary(&arg.value, None);
                    }
                }
            }
            slot += 1;
        }
        if let Some(trailing) = &call.trailing {
            let ty = f.params.get(slot).map(|p| p.ty.clone());
            // A trailing closure past a TS function's parameters is an argument it never reads
            // (and a builder's nodes in it are never drawn).
            if ty.is_none() && !f.params.last().is_some_and(|p| p.rest) {
                self.report(
                    Diagnostic::error("B0207", trailing.span, "no parameter takes this trailing closure")
                        .label(format!("this TS function takes {} argument(s)", f.params.len()))
                        .help(
                            "a TS component takes a builder as its `children`: declare it to return a React \
                             element (`JSX.Element`, `ReactNode`), or pass the closure as an argument",
                        )
                        .spec("5-values-functions-and-closures"),
                );
            }
            self.closure_throws = true;
            let soft = ty.as_ref().and_then(|t| self.soft_callback(f, t));
            let closure = self.closure(
                trailing,
                soft.as_ref().or(ty.as_ref()).filter(|t| matches!(self.resolve(t), Ty::Fn(_))),
                ty.is_none(),
            );
            if soft.is_none()
                && let Some(ty) = ty
                && !self.coerce(&closure, &ty)
            {
                self.mismatch(trailing.span, &closure, &ty);
            }
        }
        let given = positional.len() + usize::from(!named.is_empty()) + usize::from(call.trailing.is_some());
        let required = f.params.iter().filter(|p| !p.optional && !p.rest).count();
        if given < required {
            let names: Vec<String> = f.params[given..required]
                .iter()
                .filter_map(|p| p.name.clone())
                .map(|n| format!("`{n}`"))
                .collect();
            self.report(
                Diagnostic::error(
                    "B0207",
                    call.callee.span,
                    format!("missing argument(s): {}", names.join(", ")),
                )
                .label("this TS function needs them")
                .spec("5-values-functions-and-closures"),
            );
        }
    }

    /// `{ key: value, ..spread }`: a struct's construction when a struct (or a patch of
    /// one) is expected; a TS value's object when a TS type is; else a record of its own
    /// type, its fields' types inferred.
    pub(super) fn record_literal(
        &mut self,
        expr: &Expr,
        entries: &[RecordEntry],
        expected: Option<&Ty>,
    ) -> Ty {
        let target = match expected.map(|e| self.resolve(e)) {
            Some(Ty::Option(inner)) => Some(self.resolve(&inner)),
            target => target,
        };
        let is_struct = |this: &Self, def: DefId| matches!(this.out.defs[def].kind, DefKind::Struct(_));
        match &target {
            Some(Ty::Adt(def, args)) if is_struct(self, *def) => {
                let call = record_call(expr.span, entries);
                return self.construct(expr, &call, *def, args.clone(), target.as_ref(), false);
            }
            Some(Ty::Partial(inner)) => {
                if let Ty::Adt(def, args) = self.resolve(inner)
                    && is_struct(self, def)
                {
                    let call = record_call(expr.span, entries);
                    return self.construct(expr, &call, def, args, target.as_ref(), true);
                }
            }
            // `{ k: v }` where a `[String: V]` is expected: a dictionary literal, each value a `V`.
            Some(Ty::Map(value)) => {
                let value = (**value).clone();
                let map = Ty::Map(Box::new(value.clone()));
                let mut keys: Vec<&str> = Vec::new();
                for entry in entries {
                    match entry {
                        RecordEntry::Field { key, value: v } => {
                            if keys.contains(&key.name.as_str()) {
                                self.report(
                                    Diagnostic::error(
                                        "B0208",
                                        key.span,
                                        format!("`{}` is given twice", key.name),
                                    )
                                    .label("a record has each key once")
                                    .spec("44-structs"),
                                );
                            }
                            keys.push(&key.name);
                            self.expr(v, Some(&value));
                        }
                        RecordEntry::Spread(v) => {
                            self.expr(v, Some(&map));
                        }
                    }
                }
                return map;
            }
            _ => {}
        }
        let mut fields: Vec<FieldDef> = Vec::new();
        // The keys written out: a key written twice is B0208, while a key written after a
        // spread replaces the spread's field (copy-and-change, as JS's `{ ...d, k: v }`).
        let mut explicit: Vec<&str> = Vec::new();
        // `{ ..s, k: v }` whose first entry spreads a struct: its fields keep their types, and
        // when every key written is one of them the literal is that struct, as it is when the
        // struct is expected.
        let mut base: Option<(DefId, Vec<Ty>)> = None;
        let mut spreads = 0;
        for (index, entry) in entries.iter().enumerate() {
            match entry {
                RecordEntry::Field { key, value } => {
                    if explicit.contains(&key.name.as_str()) {
                        self.report(
                            Diagnostic::error("B0208", key.span, format!("`{}` is given twice", key.name))
                                .label("a record has each key once")
                                .spec("44-structs"),
                        );
                    }
                    explicit.push(&key.name);
                    let field_ty = base.as_ref().and_then(|(def, args)| {
                        self.out.defs[*def]
                            .fields()
                            .iter()
                            .find(|f| f.name == key.name)
                            .map(|f| substitute(&f.ty, args))
                    });
                    let ty = match field_ty {
                        Some(field_ty) => {
                            self.expr(value, Some(&field_ty));
                            field_ty
                        }
                        // A field of a TS object (`{ transform: [{ scale }, { translateY }] }`
                        // where a TS type is expected): its literal is TS's to check.
                        None if matches!(target, Some(Ty::Foreign(_)))
                            && (super::literal_shaped(value)
                                || matches!(value.kind, ExprKind::Ternary(..))) =>
                        {
                            self.expr(value, Some(&Ty::Foreign("".into())))
                        }
                        None => {
                            // A module constant's record (`let SIZES = { small: "8" }`): its
                            // literals' types, as TS's `as const` (R6). Only its own fields, not
                            // nested values.
                            let literal = std::mem::take(&mut self.literal_record);
                            let hint = if literal { super::string_literal(value) } else { None };
                            let ty = self.boundary(value, hint.as_ref());
                            self.literal_record = literal;
                            ty
                        }
                    };
                    fields.retain(|f| f.name != key.name);
                    fields.push(FieldDef { name: key.name.clone(), ty, default: FieldDefault::None });
                }
                RecordEntry::Spread(value) => {
                    spreads += 1;
                    let ty = self.expr(value, None);
                    match self.resolve(&ty) {
                        Ty::Adt(def, args) if is_struct(self, def) => {
                            if index == 0 {
                                base = Some((def, args.clone()));
                            }
                            for field in self.out.defs[def].fields().to_vec() {
                                fields.retain(|f| f.name != field.name);
                                let ty = substitute(&field.ty, &args);
                                fields.push(FieldDef { name: field.name, ty, default: FieldDefault::None });
                            }
                        }
                        Ty::Foreign(_) | Ty::Unknown => {}
                        other => self.report(
                            Diagnostic::error(
                                "B0205",
                                value.span,
                                format!("cannot spread {} into a record", self.show(&other)),
                            )
                            .label("not a record")
                            .help("spread a struct or a record: `..base`")
                            .spec("44-structs"),
                        ),
                    }
                }
            }
        }
        if let Some(foreign @ Ty::Foreign(_)) = target {
            return foreign;
        }
        if let Some((def, args)) = base
            && spreads == 1
            && explicit.iter().all(|k| self.out.defs[def].fields().iter().any(|f| f.name == *k))
        {
            let ty = Ty::Adt(def, args);
            if let Some(target) = &target
                && !self.coerce(&ty, target)
            {
                self.mismatch(expr.span, &ty, target);
            }
            self.out.calls.insert(expr.id, CallRes::Struct(def));
            return ty;
        }
        let ty = self.record_type(fields);
        if let Some(target) = &target {
            let fits = self.coerce(&ty, target);
            if !fits {
                self.mismatch(expr.span, &ty, target);
            }
        }
        ty
    }

    /// A modifier's object literal (`.header({ right: saveAction })`), a list of them or either
    /// branch of a ternary: the views in its `fields` (those TS types `ReactNode`) cross as
    /// React elements, as a view given to a TS prop does.
    fn element_fields(&mut self, value: &Expr, fields: &[&str]) {
        if fields.is_empty() {
            return;
        }
        match &value.kind {
            ExprKind::Record(entries) => {
                for entry in entries {
                    if let RecordEntry::Field { key, value } = entry
                        && fields.contains(&key.name.as_str())
                    {
                        self.element(value);
                    }
                }
            }
            ExprKind::List(items) => items.iter().for_each(|item| self.element_fields(item, fields)),
            ExprKind::Paren(inner) => self.element_fields(inner, fields),
            ExprKind::Ternary(_, then, otherwise) => {
                self.element_fields(then, fields);
                self.element_fields(otherwise, fields);
            }
            _ => {}
        }
    }

    /// `S(field: v, ..spread)`; `partial`: `Partial<S>(…)`, every field optional.
    fn construct(
        &mut self,
        expr: &Expr,
        call: &Call,
        def: DefId,
        targs: Vec<Ty>,
        expected: Option<&Ty>,
        partial: bool,
    ) -> Ty {
        let d = self.out.defs[def].clone();
        // `UniqueID()`: a view's stable identity, a `@State`'s initial value and nothing else.
        if !partial
            && call.args.is_empty()
            && call.trailing.is_none()
            && d.name == "UniqueID"
            && self.out.transparent.contains(&def)
        {
            if self.unique_id_state == Some(expr.id) {
                self.out.unique_ids.insert(expr.id);
            } else {
                self.report(
                    Diagnostic::error("B0420", expr.span, "`UniqueID()` is a view's identity, made once for its life")
                        .label("not a `@State`'s initial value")
                        .help("declare it as a view's state, `@State private var id = UniqueID()`, and read `id.string`")
                        .spec("73-reactivity-compile-time"),
                );
            }
            return Ty::Adt(def, Vec::new());
        }
        let targs = if !targs.is_empty() {
            targs
        } else {
            match expected.map(|e| self.resolve(e)) {
                Some(Ty::Adt(e, args)) if e == def => args,
                _ => d.generics.iter().map(|_| self.fresh()).collect(),
            }
        };
        let ty = Ty::Adt(def, targs.clone());
        let fields = d.fields().to_vec();
        let mut given: Vec<&str> = Vec::new();
        let mut full_spread = false;
        for arg in &call.args {
            if arg.spread {
                if !given.is_empty() {
                    self.report(
                        Diagnostic::error(
                            "B0207",
                            arg.span,
                            "a spread comes before the fields it is overridden by",
                        )
                        .label("move it first")
                        .spec("44-structs"),
                    );
                }
                let spread = self.expr(&arg.value, None);
                // A `Partial<S>?` spreads nothing when it is `none`.
                let spread_ty = match self.resolve(&spread) {
                    Ty::Option(inner) if matches!(self.resolve(&inner), Ty::Partial(_)) => {
                        self.resolve(&inner)
                    }
                    other => other,
                };
                match spread_ty {
                    Ty::Adt(other, args) if other == def => {
                        for (a, b) in args.iter().zip(&targs) {
                            self.unify(a, b);
                        }
                        full_spread = true;
                    }
                    Ty::Partial(inner) => {
                        if !self.unify(&inner, &ty) {
                            self.mismatch(arg.value.span, &spread, &Ty::Partial(Box::new(ty.clone())));
                        }
                    }
                    Ty::Unknown => {}
                    _ => self.mismatch(arg.value.span, &spread, &Ty::Partial(Box::new(ty.clone()))),
                }
                continue;
            }
            let Some(label) = &arg.label else {
                let next = fields.get(given.len()).map_or("field".to_string(), |f| f.name.clone());
                self.report(
                    Diagnostic::error(
                        "B0207",
                        arg.span,
                        format!("a struct's fields are named: write `{next}: …`"),
                    )
                    .label("a field without its name")
                    .fix(Span::new(arg.span.start, arg.span.start), format!("{next}: "))
                    .spec("44-structs"),
                );
                self.boundary(&arg.value, None);
                continue;
            };
            match fields.iter().find(|f| f.name == label.name) {
                Some(field) => {
                    if given.contains(&field.name.as_str()) {
                        self.report(
                            Diagnostic::error(
                                "B0207",
                                label.span,
                                format!("`{}` is given twice", label.name),
                            )
                            .label("already given")
                            .spec("44-structs"),
                        );
                    }
                    given.push(&field.name);
                    let field_ty = substitute(&field.ty, &targs);
                    self.expr(&arg.value, Some(&field_ty));
                    // A TS object's `ReactNode` field (`rows: [{ trailing: Text("1") }]`): a view
                    // there crosses as an element.
                    if matches!(d.origin, Origin::Ts { .. }) && super::is_element(&field_ty) {
                        self.element(&arg.value);
                    }
                }
                // A callback's result (`xs.map { x in ({ id: x.id, color: x.color }) }` where
                // `[AvatarGroupItem]` is expected) may have more fields: TS checks no excess
                // property there, only on a literal written where the type is declared.
                None if self.callback_results.contains(&expr.id) => {
                    self.boundary(&arg.value, None);
                }
                None => {
                    self.unknown_field(label, &ty);
                    self.boundary(&arg.value, None);
                }
            }
        }
        if let Some(trailing) = &call.trailing {
            self.report(
                Diagnostic::error("B0207", trailing.span, format!("`{}` takes no trailing closure", d.name))
                    .label("a struct's fields are named arguments")
                    .spec("44-structs"),
            );
        }
        if !partial && !full_spread {
            let missing: Vec<String> = fields
                .iter()
                .filter(|f| {
                    f.default == FieldDefault::None
                        && !given.contains(&f.name.as_str())
                        && !matches!(f.ty, Ty::Option(_))
                })
                .map(|f| format!("`{}`", f.name))
                .collect();
            if !missing.is_empty() {
                let first = missing[0].trim_matches('`').to_string();
                self.report(
                    Diagnostic::error(
                        "B0206",
                        call.callee.span,
                        format!("`{}` needs {}", d.name, missing.join(", ")),
                    )
                    .label("missing field(s) without a default")
                    .help(if d.origin == Origin::Record {
                        format!("write it: `{{ {first}: … }}`")
                    } else {
                        format!("pass it: `{}({first}: …)`, or give the field a default", d.name)
                    })
                    .spec("44-structs"),
                );
            }
        }
        self.out.calls.insert(expr.id, if partial { CallRes::Partial(def) } else { CallRes::Struct(def) });
        if partial { Ty::Partial(Box::new(ty)) } else { ty }
    }

    /// `S.patch(key, value)` and `s.with(key, value)`: one field, named by a key path.
    fn keyed(&mut self, expr: &Expr, call: &Call, def: DefId, targs: Vec<Ty>, partial: bool) -> Ty {
        let ty = Ty::Adt(def, targs);
        let value = self.fresh();
        self.expr(&call.args[0].value, Some(&Ty::KeyPath(Box::new(ty.clone()), Box::new(value.clone()))));
        self.expr(&call.args[1].value, Some(&value));
        self.out.calls.insert(expr.id, CallRes::Keyed { partial });
        if partial { Ty::Partial(Box::new(ty)) } else { ty }
    }

    fn with_update(&mut self, expr: &Expr, call: &Call, def: DefId, targs: Vec<Ty>) -> Ty {
        if keyed(call) {
            return self.keyed(expr, call, def, targs, false);
        }
        let fields = self.out.defs[def].fields().to_vec();
        let ty = Ty::Adt(def, targs.clone());
        for arg in &call.args {
            match &arg.label {
                Some(label) => match fields.iter().find(|f| f.name == label.name) {
                    Some(field) => {
                        let field_ty = substitute(&field.ty, &targs);
                        self.expr(&arg.value, Some(&field_ty));
                    }
                    None => {
                        self.unknown_field(label, &ty);
                        self.boundary(&arg.value, None);
                    }
                },
                None => {
                    self.report(
                        Diagnostic::error("B0207", arg.span, "`.with` takes the fields it changes by name")
                            .label("a value without its field's name")
                            .help("write `.with(field: value)`")
                            .spec("44-structs"),
                    );
                    self.boundary(&arg.value, None);
                }
            }
        }
        self.out.calls.insert(expr.id, CallRes::With(def));
        ty
    }

    fn case_call(
        &mut self,
        expr: &Expr,
        call: &Call,
        def: DefId,
        name: &Ident,
        targs: Vec<Ty>,
        expected: Option<&Ty>,
    ) -> Ty {
        let d = self.out.defs[def].clone();
        // `.milliseconds(300)` where a `Duration` is expected: the type's static function, as
        // Swift's implicit member expression reads any static member giving the type.
        if !d.variants().iter().any(|v| v.name == name.name)
            && let Some(ty) = self.static_member(&call.callee, &d.name, name)
        {
            let ret = self.value_call(expr, call, &ty);
            if let Some(want) = expected
                && !self.coerce(&ret, want)
            {
                self.mismatch(name.span, &ret, want);
            }
            return ret;
        }
        let Some(index) = d.variants().iter().position(|v| v.name == name.name) else {
            if matches!(d.kind, DefKind::Struct(_)) {
                self.report(
                    Diagnostic::error(
                        "B0205",
                        name.span,
                        format!("`{}` is a struct, with no `{}`", d.name, name.name),
                    )
                    .label("structs have no cases")
                    .spec("44-structs"),
                );
            } else {
                let names: Vec<&str> = d.variants().iter().map(|v| v.name.as_str()).collect();
                self.unknown_case(name, &names, &Ty::Adt(def, targs.clone()));
            }
            self.args_unchecked(call);
            return Ty::Unknown;
        };
        let targs = if !targs.is_empty() {
            targs
        } else {
            let expected = match expected.map(|e| self.resolve(e)) {
                Some(Ty::Option(inner)) => Some(self.resolve(&inner)),
                other => other,
            };
            match expected {
                Some(Ty::Adt(e, args)) if e == def => args,
                _ => d.generics.iter().map(|_| self.fresh()).collect(),
            }
        };
        let variant = &d.variants()[index];
        let count = call.args.len() + usize::from(call.trailing.is_some());
        if count != variant.payload.len() {
            self.report(
                Diagnostic::error(
                    "B0207",
                    expr.span,
                    format!("`.{}` carries {} value(s), not {count}", variant.name, variant.payload.len()),
                )
                .label("wrong number of values")
                .spec("45-enums-option-and-result"),
            );
        }
        for (position, arg) in call.args.iter().enumerate() {
            let slot = match &arg.label {
                Some(label) => {
                    variant.payload.iter().position(|(n, _)| n.as_deref() == Some(label.name.as_str()))
                }
                None => Some(position),
            };
            match slot.and_then(|s| variant.payload.get(s)) {
                Some((_, ty)) => {
                    let ty = substitute(ty, &targs);
                    self.expr(&arg.value, Some(&ty));
                }
                None => {
                    self.boundary(&arg.value, None);
                }
            }
        }
        if let (Some(trailing), Some((_, ty))) = (&call.trailing, variant.payload.get(call.args.len())) {
            let ty = substitute(ty, &targs);
            self.closure(trailing, Some(&ty), false);
        }
        self.out.calls.insert(expr.id, CallRes::EnumCase(def, index));
        self.out.types.insert(call.callee.id, Ty::Adt(def, targs.clone()));
        Ty::Adt(def, targs)
    }

    fn result_ctor(&mut self, expr: &Expr, call: &Call, ok: bool, expected: Option<&Ty>) -> Ty {
        let (ok_ty, err_ty) = match expected.map(|e| self.resolve(e)) {
            Some(Ty::Result(a, b)) => (*a, *b),
            _ => (self.fresh(), self.fresh()),
        };
        self.out.calls.insert(expr.id, if ok { CallRes::Ok } else { CallRes::Err });
        self.positional(call, &[if ok { ok_ty.clone() } else { err_ty.clone() }]);
        Ty::Result(Box::new(ok_ty), Box::new(err_ty))
    }

    fn binding_ctor(&mut self, expr: &Expr, call: &Call) -> Ty {
        let value = self.fresh();
        let setter = Ty::Fn(Rc::new(FnTy {
            params: vec![ParamTy {
                labelled: false,
                positional: false,
                name: Some("value".into()),
                ty: value.clone(),
                optional: false,
                rest: false,
            }],
            ret: Ty::Unit,
            is_async: false,
            generics: 0,
            ts: false,
            throws: false,
            bounds: Vec::new(),
            shapes: Vec::new(),
        }));
        let labels: Vec<Option<&str>> =
            call.args.iter().map(|a| a.label.as_ref().map(|l| l.name.as_str())).collect();
        if labels != [Some("get"), Some("set")] || call.trailing.is_some() {
            self.report(
                Diagnostic::error("B0207", expr.span, "a binding is `Binding(get: value, set: { v in … })`")
                    .label("give `get:` and `set:`, in that order")
                    .spec("72-builders-modifiers-and-tokens"),
            );
            self.args_unchecked(call);
            return Ty::Unknown;
        }
        // The setter first: it says what a chosen value is (`{ value in onChange([value]) }`, a
        // `ReplyPermission`). The getter may be that or `none`, as SwiftUI's optional selection
        // is (`.selection(Binding(get: c ? "anyone" : none, set: …))`: no row chosen).
        self.expr(&call.args[1].value, Some(&setter));
        let optional = Ty::Option(Box::new(value.clone()));
        self.expr(&call.args[0].value, Some(&optional));
        self.out.calls.insert(expr.id, CallRes::Binding);
        Ty::Binding(Box::new(value))
    }

    /// `navigate("/path", param: v)`: a path written out names a route of the app's
    /// `app/` tree, and a route's parameters are given by name, each a string or a number.
    fn route(&mut self, call: &Call) {
        let Some(first) = call.args.first().filter(|arg| arg.label.is_none()) else { return };
        let ExprKind::Str { parts, .. } = &first.value.kind else { return };
        if parts.iter().any(|part| matches!(part, StrPart::Interp(_))) {
            return;
        }
        let path = super::plain_text(parts);
        if !path.starts_with('/') {
            return;
        }
        let Some(routes) = crate::routes::routes(self.options) else { return };
        self.out.dependencies.extend(routes.folders.iter().map(|(folder, _)| folder.clone()));
        let Some(pattern) = crate::routes::find(&routes, &path) else {
            let help = match closest(&path, routes.patterns.iter().map(String::as_str)) {
                Some(near) => format!("did you mean `{near}`?"),
                None => format!("the app's routes: {}", routes.patterns.join(", ")),
            };
            self.report(
                Diagnostic::error("B0701", first.value.span, format!("no route `{path}` in the app"))
                    .label("not a file of `app/`")
                    .help(help)
                    .spec("9-navigation"),
            );
            return;
        };
        // A pattern written out (`/posts/[id]`) takes its parameters by name.
        let wanted: Vec<&str> = if path.split(['?', '#']).next().unwrap_or_default().contains('[') {
            crate::routes::params(pattern)
        } else {
            Vec::new()
        };
        for arg in call.args.iter().skip(1) {
            let Some(label) = &arg.label else { continue };
            if !wanted.contains(&label.name.as_str()) {
                let help = if wanted.is_empty() {
                    format!("`{pattern}` takes no parameters here")
                } else {
                    format!("its parameters: {}", wanted.join(", "))
                };
                self.report(
                    Diagnostic::error(
                        "B0702",
                        label.span,
                        format!("`{pattern}` has no parameter `{}`", label.name),
                    )
                    .label("not a parameter of this route")
                    .help(help)
                    .spec("9-navigation"),
                );
                continue;
            }
            let ty = self.out.types.get(&arg.value.id).cloned().unwrap_or(Ty::Unknown);
            if !matches!(
                self.resolve(&ty),
                Ty::Str | Ty::Strings(_) | Ty::Int | Ty::Float | Ty::Foreign(_) | Ty::Unknown
            ) {
                self.report(
                    Diagnostic::error(
                        "B0702",
                        arg.value.span,
                        format!("a route parameter is a string or a number, not {}", self.show(&ty)),
                    )
                    .label("in the path")
                    .help("pass the field the route names (`id: post.id`)")
                    .spec("9-navigation"),
                );
            }
        }
        let given: Vec<&str> =
            call.args.iter().filter_map(|a| a.label.as_ref()).map(|l| l.name.as_str()).collect();
        let missing: Vec<String> =
            wanted.iter().filter(|p| !given.contains(p)).map(|p| format!("`{p}`")).collect();
        if !missing.is_empty() {
            self.report(
                Diagnostic::error(
                    "B0702",
                    first.value.span,
                    format!("`{pattern}` needs {}", missing.join(", ")),
                )
                .label("a parameter of the route is not given")
                .help(format!("navigate(\"{pattern}\", {}: …)", wanted[0]))
                .spec("9-navigation"),
            );
        }
    }

    /// A node constructor: positional arguments, checked against the
    /// constructor's signature (`spec::SIGNATURES`); a trailing closure is its children.
    fn node_call(&mut self, expr: &Expr, call: &Call, kind: &'static str) -> Ty {
        let ExprKind::Name(name) = &call.callee.kind else { unreachable!("a node is called by name") };
        let ctor = ui::node(kind)
            .and_then(|n| n.constructors.iter().find(|c| **c == name.as_str()))
            .copied()
            .unwrap_or("Embed");
        self.out.calls.insert(expr.id, CallRes::Node(ctor));
        let params = ui::signature(ctor);
        // `VirtualList(posts) { post in … }` (SwiftUI's `List(data) { item in … }`): the
        // trailing closure is the row, handed each item; its items are the one argument.
        let row = ctor == "VirtualList"
            && call.args.len() == 1
            && call.trailing.as_ref().is_some_and(|t| t.has_in && !t.params.is_empty());
        if !row {
            self.node_arity(call, ctor, kind, params);
        }
        let fixed: Vec<&str> = params.iter().filter(|p| !p.starts_with("...")).copied().collect();
        for (index, arg) in call.args.iter().enumerate() {
            if let Some(label) = &arg.label {
                self.report(
                    Diagnostic::error(
                        "B0207",
                        label.span,
                        format!("`{name}` takes its arguments in order, without labels"),
                    )
                    .label("a node's arguments are positional")
                    .help(format!(
                        "remove `{}:`; options of a node are modifiers (`.{}(…)`)",
                        label.name, label.name
                    ))
                    .fix(Span::new(label.span.start, arg.value.span.start), "")
                    .docs(ui::node_docs(kind)),
                );
            }
            let param = fixed.get(index).map_or("...", |p| p.trim_end_matches('?'));
            // `VirtualList(posts, { row in … })`: the row closure is handed FlashList's
            // `{ item, index }` (`VirtualListRow<T>`), never the item itself.
            if ctor == "VirtualList"
                && index == 1
                && let Some(row) = self.virtual_list_row(call, &arg.value)
            {
                self.boundary(&arg.value, Some(&row));
                continue;
            }
            // A child's place: a list of views is a child there (`Embed(c ? a : xs.map(f))`).
            if param == "..." || param == "view" || ctor == "Embed" {
                self.child_slots.insert(arg.value.id);
            }
            if param == "..." && matches!(ctor, "Text" | "RawText") {
                self.run_slots.insert(arg.value.id);
            }
            self.node_arg(&arg.value, param);
            // `Embed(c ? Text(…) : rows)`: Embed takes a React node, so Bloom views (one, or a
            // list of them) cross as one, `toElement(…)`, as where any TS takes an element.
            if ctor == "Embed"
                && let Some(ty) = self.out.types.get(&arg.value.id).cloned()
                && !matches!(self.resolve(&ty), Ty::View(Some("embed")))
                && (self.is_view(&ty) || self.child_list(&ty).is_some())
            {
                self.out.elements.insert(arg.value.id);
            }
        }
        if let Some(trailing) = &call.trailing {
            if row {
                self.trailing_row(call, trailing);
            } else {
                self.builder_closure(trailing);
            }
        }
        Ty::View(Some(kind))
    }

    /// `VirtualList(posts) { post in … }`: the row closure, handed the item (the emitter reads it
    /// from FlashList's `{ item }`); `VirtualList(posts.enumerated()) { i, post in … }` is
    /// handed its index too (`{ item, index }`), with no pairs built.
    fn trailing_row(&mut self, call: &Call, row: &Closure) {
        let items = &call.args[0].value;
        let items_ty = self.out.types.get(&items.id).cloned().unwrap_or(Ty::Unknown);
        let element = |this: &mut Self, ty: &Ty| match this.resolve(ty) {
            Ty::List(item) => Some(this.resolve(&item)),
            Ty::Option(inner) => match this.resolve(&inner) {
                Ty::List(item) => Some(this.resolve(&item)),
                _ => None,
            },
            _ => None,
        };
        let enumerated = matches!(
            self.out.calls.get(&items.id),
            Some(CallRes::Method { recv: Recv::List, name: "enumerated" })
        );
        let item = match element(self, &items_ty) {
            Some(Ty::Tuple(pair)) if enumerated && pair.len() == 2 => pair[1].clone(),
            Some(item) => item,
            None => Ty::Unknown,
        };
        let param = |ty: Ty| ParamTy {
            labelled: false,
            positional: true,
            name: None,
            ty,
            optional: false,
            rest: false,
        };
        let params = match (enumerated, row.params.len()) {
            (true, 2) => vec![param(Ty::Int), param(item)],
            (false, 1) => vec![param(item)],
            (_, count) => {
                let want = if enumerated {
                    "two parameters, its index and its item (`{ i, post in … }`)"
                } else {
                    "one parameter, its item (`{ post in … }`)"
                };
                self.report(
                    Diagnostic::error("B0503", row.span, format!("a row takes {want}, not {count}"))
                        .label("the row's parameters")
                        .help("`VirtualList(posts) { post in … }`, or `VirtualList(posts.enumerated()) { i, post in … }` with its index")
                        .docs(ui::node_docs("virtualList")),
                );
                return;
            }
        };
        let expected = Ty::Fn(Rc::new(FnTy {
            params,
            ret: Ty::View(None),
            is_async: false,
            generics: 0,
            ts: false,
            throws: false,
            bounds: Vec::new(),
            shapes: Vec::new(),
        }));
        self.closure(row, Some(&expected), false);
        self.out.row_closures.insert(row.span, enumerated);
    }

    /// The type of a `VirtualList`'s row closure written in place with one untyped parameter
    /// (`{ row in … }`): `(VirtualListRow<T>) -> View`, `T` the items' element, so `row.item` is
    /// the item and `row.index` its index. `None` for any other row (a function value, a typed
    /// closure), which TypeScript checks against `VirtualListRowFn<T>`.
    fn virtual_list_row(&mut self, call: &Call, row: &Expr) -> Option<Ty> {
        let ExprKind::Closure(closure) = &row.kind else { return None };
        if closure.tuple || closure.params.len() != 1 || closure.params[0].ty.is_some() {
            return None;
        }
        let items = call.args.first()?;
        let items = self.out.types.get(&items.value.id).cloned()?;
        let item = match self.resolve(&items) {
            Ty::List(item) => *item,
            Ty::Option(inner) => match self.resolve(&inner) {
                Ty::List(item) => *item,
                _ => return None,
            },
            _ => return None,
        };
        let item = self.resolve(&item);
        let name = format!("VirtualListRow<{}>", self.show(&item).trim_matches('`'));
        let fields = vec![
            FieldDef { name: "item".into(), ty: item, default: FieldDefault::None },
            FieldDef { name: "index".into(), ty: Ty::Int, default: FieldDefault::None },
        ];
        let row = self.object_type(&name, fields);
        Some(Ty::Fn(Rc::new(FnTy {
            params: vec![ParamTy {
                labelled: false,
                positional: true,
                name: Some("row".into()),
                ty: row,
                optional: false,
                rest: false,
            }],
            ret: Ty::View(None),
            is_async: false,
            generics: 0,
            ts: false,
            throws: false,
            bounds: Vec::new(),
            shapes: Vec::new(),
        })))
    }

    /// A node takes as many arguments (a builder's lines among them) as its signature has.
    fn node_arity(&mut self, call: &Call, ctor: &str, kind: &'static str, params: &[&str]) {
        let rest = params.iter().any(|p| p.starts_with("..."));
        let fixed = params.iter().filter(|p| !p.starts_with("...")).count();
        let required = params.iter().filter(|p| !p.starts_with("...") && !p.ends_with('?')).count();
        let lines = call.trailing.as_ref().map_or(0, |trailing| {
            trailing.body.iter().filter(|stmt| !matches!(stmt.kind, StmtKind::Let(_))).count()
        });
        let count = call.args.len() + lines;
        if count >= required && (rest || count <= fixed) {
            return;
        }
        let expected = match (rest, required == fixed) {
            (true, _) => format!("at least {required}"),
            (false, true) => required.to_string(),
            (false, false) => format!("{required} to {fixed}"),
        };
        // Past the signature: the first argument too many; short of it: the node's name.
        let span =
            call.args.get(fixed).filter(|_| count > fixed).map_or(call.callee.span, |extra| extra.span);
        self.report(
            Diagnostic::error("B0503", span, format!("`{ctor}` takes {expected} argument(s), not {count}"))
                .label("wrong number of arguments")
                .help(format!("write `{ctor}({})`: a parameter marked ? is optional", params.join(", ")))
                .docs(ui::node_docs(kind)),
        );
    }

    /// The type a literal given to an object parameter is checked against (`[dialogButton]`
    /// when `list`), as Swift checks a literal against its context: each list element and
    /// ternary branch on its own. `None` for any other value, which TypeScript checks.
    fn object_expected(&mut self, object: &str, list: bool, value: &Expr) -> Option<Ty> {
        if !super::literal_shaped(value) {
            return None;
        }
        let fields = ui::object_fields(object)?;
        let fields = fields
            .into_iter()
            .map(|(key, kind)| {
                let optional = kind.ends_with('?');
                let ty = match kind.trim_end_matches('?') {
                    "string" => Ty::Str,
                    "number" => Ty::Float,
                    "boolean" => Ty::Bool,
                    "action" => Ty::Fn(Rc::new(FnTy {
                        params: Vec::new(),
                        ret: Ty::Unit,
                        is_async: false,
                        generics: 0,
                        ts: false,
                        throws: false,
                        bounds: Vec::new(),
                        shapes: Vec::new(),
                    })),
                    "value" => Ty::Unknown,
                    set => Ty::Strings(ui::str_set(set)),
                };
                let ty = if optional && ty != Ty::Unknown { Ty::Option(Box::new(ty)) } else { ty };
                let default = if optional { FieldDefault::Undefined } else { FieldDefault::None };
                FieldDef { name: key.to_string(), ty, default }
            })
            .collect();
        let ty = self.object_type(object, fields);
        Some(if list { Ty::List(Box::new(ty)) } else { ty })
    }

    /// A node's argument: a primitive its signature names is checked here, a literal given to an
    /// object parameter against the object; any other value TypeScript checks against the
    /// constructor on the emitted code.
    fn node_arg(&mut self, value: &Expr, param: &str) {
        let expected = match param {
            "string" => Some(Ty::Str),
            "number" => Some(Ty::Float),
            "boolean" => Some(Ty::Bool),
            param => match param.strip_prefix('[').and_then(|p| p.strip_suffix(']')) {
                Some(object) => self.object_expected(object, true, value),
                None => self.object_expected(param, false, value),
            },
        };
        let ty = self.boundary(value, expected.as_ref());
        if param == "binding" && !matches!(self.resolve(&ty), Ty::Binding(_) | Ty::Foreign(_) | Ty::Unknown) {
            self.report(
                Diagnostic::error("B0201", value.span, format!("{} is not a binding", self.show(&ty)))
                    .label("this node reads and writes the value")
                    .help("pass a binding: `$name`, or `Binding(get: …, set: …)`")
                    .spec("72-builders-modifiers-and-tokens"),
            );
            return;
        }
        // A `value` is TypeScript's to check: its declaration may take `undefined`
        // (`SettingsSection(label: string | undefined, …)`).
        if param != "value"
            && let Ty::Option(inner) = self.resolve(&ty)
            && !matches!(self.resolve(&inner), Ty::View(_))
        {
            self.report(
                Diagnostic::error("B0201", value.span, format!("{} may be `none` here", self.show(&ty)))
                    .label("a node's argument is a value")
                    .help("unwrap it: `?? \"\"`, or draw the node under `if let`")
                    .spec("45-enums-option-and-result"),
            );
        }
    }

    /// A builder closure: each line is a child.
    pub(super) fn builder_closure(&mut self, closure: &Closure) {
        if !closure.params.is_empty() {
            self.report(
                Diagnostic::error("B0504", closure.span, "a builder takes no parameters")
                    .label("children are listed, not computed from parameters")
                    .spec("72-builders-modifiers-and-tokens"),
            );
        }
        self.builder(&closure.body);
        self.out.closures.insert(
            closure.span,
            ClosureInfo { params: Vec::new(), is_async: false, ret: Ty::View(None), builder: true },
        );
    }

    /// The props of `ns.name` when the module `file` exports it as a component.
    fn namespace_component(&mut self, file: &Rc<crate::ts::TsFile>, ns: &str, name: &str) -> Option<Ty> {
        let mut mapper = crate::ts::Mapper {
            defs: &mut self.out.defs,
            options: self.options,
            named: &mut self.ts_named,
            reads: &mut self.out.dependencies,
            module: None,
        };
        mapper.export(file, name, &format!("{ns}.{name}"), 0)?.component
    }

    fn component_call(&mut self, expr: &Expr, call: &Call, props: &Ty) -> Ty {
        self.out.calls.insert(expr.id, CallRes::Component);
        let props = self.resolve(props);
        let fields = match &props {
            Ty::Adt(def, _) => Some(self.out.defs[*def].fields().to_vec()),
            Ty::Unit => Some(Vec::new()),
            _ => None,
        };
        let mut given = Vec::new();
        let mut spread = false;
        for arg in &call.args {
            // `..r`: JSX's `{...r}`, its fields as props (tsc checks them).
            if arg.spread && arg.label.is_none() {
                spread = true;
                self.boundary(&arg.value, None);
                continue;
            }
            let Some(label) = &arg.label else {
                self.report(
                    Diagnostic::error("B0207", arg.span, "a component takes its props by name")
                        .label("a prop without its name")
                        .help("write `prop: value`")
                        .spec("72-builders-modifiers-and-tokens"),
                );
                self.boundary(&arg.value, None);
                continue;
            };
            given.push(label.name.clone());
            let ty = fields
                .as_ref()
                .and_then(|fields| fields.iter().find(|f| f.name == label.name))
                .map(|f| f.ty.clone());
            if ty.is_none() && fields.is_some() {
                self.unknown_field(label, &props);
            }
            // `ref: input` gives a TS component the `@ref` itself, as `.ref(input)` gives a node.
            // A literal given to a prop Bloom cannot read (`style: [TABS, { borderColor }]` on React
            // Native's `ScrollView`, whose props extend `ViewProps`) is TS's to check, each element
            // on its own.
            let ty = ty.or_else(|| {
                (fields.is_none() && super::literal_shaped(&arg.value)).then(|| Ty::Foreign("".into()))
            });
            let ref_object = label.name == "ref" && matches!(arg.value.kind, ExprKind::Name(_));
            self.ref_object = ref_object;
            self.boundary(&arg.value, ty.as_ref());
            self.ref_object = false;
            // Props Bloom cannot read (`ScreenProps extends ViewProps`) are a React component's:
            // a Bloom view given to one is an element there (`header: toElement(Header(…))`).
            if fields.is_none() {
                self.element(&arg.value);
                // A callback prop of one (`FlatList`'s `renderItem`): the view it gives, too.
                if let ExprKind::Closure(c) = &arg.value.kind {
                    self.element_tail(c);
                }
            }
        }
        if let Some(fields) = fields.as_ref().filter(|_| !spread) {
            let missing: Vec<String> = fields
                .iter()
                .filter(|f| {
                    f.default == FieldDefault::None && !given.contains(&f.name) && f.name != "children"
                })
                .map(|f| format!("`{}`", f.name))
                .collect();
            if !missing.is_empty() {
                self.report(
                    Diagnostic::error(
                        "B0206",
                        call.callee.span,
                        format!("this component needs {}", missing.join(", ")),
                    )
                    .label("missing required props")
                    .spec("72-builders-modifiers-and-tokens"),
                );
            }
        }
        if let Some(trailing) = &call.trailing {
            self.component_builder(call.callee.span, trailing, fields.as_deref(), &given);
            // `TextFieldLabel { label }`: one line of text is the component's text children,
            // as JSX's `<TextFieldLabel>{label}</TextFieldLabel>` (a builder line is a view).
            match trailing.body.as_slice() {
                [Stmt { kind: StmtKind::Expr(line), .. }]
                    if trailing.params.is_empty()
                        && !matches!(line.kind, ExprKind::If(_) | ExprKind::Match(_)) =>
                {
                    // Typed on its own first; anything but text is read again as a child, as
                    // any builder line is (what the first reading reported is dropped).
                    let mark = self.out.diagnostics.len();
                    self.push();
                    let ty = self.expr(line, None);
                    self.pop();
                    if matches!(self.resolve(&ty), Ty::Str | Ty::Strings(_)) {
                        self.out.text_children.insert(trailing.span);
                        self.out.closures.insert(
                            trailing.span,
                            ClosureInfo {
                                params: Vec::new(),
                                is_async: false,
                                ret: Ty::View(None),
                                builder: true,
                            },
                        );
                    } else {
                        for diagnostic in self.out.diagnostics.split_off(mark) {
                            self.reported.remove(&diagnostic.span);
                        }
                        self.builder_closure(trailing);
                    }
                }
                _ => self.builder_closure(trailing),
            }
        }
        Ty::View(Some("embed"))
    }

    /// Where a TS component's trailing builder goes: its `children` (JSX children), or the
    /// one node prop it declares in their place (`content: ReactNode`), as a view's builder
    /// fills its `View` property. A component with neither cannot draw the builder's nodes,
    /// so that is an error, never a silent drop. Props Bloom cannot read are TS's to check
    /// (`satisfies ComponentProps<…>`), so the builder is their `children`.
    fn component_builder(
        &mut self,
        callee: Span,
        trailing: &Closure,
        fields: Option<&[FieldDef]>,
        given: &[String],
    ) {
        if given.iter().any(|g| g == "children") {
            self.report(
                Diagnostic::error("B0207", trailing.span, "`children` is given twice")
                    .label("the trailing builder is the component's `children`")
                    .help("pass the children by name or as the trailing builder, not both")
                    .spec("72-builders-modifiers-and-tokens"),
            );
            return;
        }
        let Some(fields) = fields else { return };
        if fields.iter().any(|f| f.name == "children") {
            return;
        }
        let slots: Vec<&str> = fields
            .iter()
            .filter(|f| !given.contains(&f.name) && self.is_node_ty(&f.ty))
            .map(|f| f.name.as_str())
            .collect();
        if let [slot] = slots.as_slice() {
            self.out.component_slots.insert(trailing.span, (*slot).to_string());
            return;
        }
        let help = if slots.is_empty() {
            "draw the nodes beside it, or give it a `children` prop".to_string()
        } else {
            format!(
                "it has several node props ({}): pass each by name, as `{}: VStack {{ … }}`",
                slots.iter().map(|s| format!("`{s}`")).collect::<Vec<_>>().join(", "),
                slots[0]
            )
        };
        self.report(
            Diagnostic::error("B0506", trailing.span, "this component takes no children")
                .label("these nodes would never be drawn")
                .with_label(callee, "its props have no `children`, and no node prop is left for them")
                .help(help)
                .spec("72-builders-modifiers-and-tokens"),
        );
    }

    /// A TS prop that holds a node: `ReactNode`, `ReactElement`, a Bloom view, or one of those
    /// optional.
    fn is_node_ty(&self, ty: &Ty) -> bool {
        match self.resolve(ty) {
            Ty::View(_) => true,
            Ty::Option(inner) => self.is_node_ty(&inner),
            Ty::Foreign(text) => {
                text.ends_with(".ReactNode")
                    || text.ends_with(".ReactElement")
                    || text.ends_with("JSX.Element")
            }
            _ => false,
        }
    }

    fn view_call(&mut self, expr: &Expr, call: &Call, ty: &Ty) -> Ty {
        let Ty::Fn(generic) = ty else { return Ty::Unknown };
        // A `struct X: ViewModifier` is applied to a view, never drawn itself.
        if generic.ret == Ty::View(Some("viewModifier")) && self.modifier_arg != Some(expr.id) {
            let name = match &call.callee.kind {
                ExprKind::Name(name) => name.clone(),
                _ => "X".into(),
            };
            self.report(
                Diagnostic::error("B0421", expr.span, format!("`{name}` is a modifier, applied to a view"))
                    .label("a `ViewModifier` is not a view")
                    .help(format!("apply it: `content.modifier({name}(…))`"))
                    .spec("72b-view-modifiers"),
            );
        }
        // A generic view's witness props, by its type parameters' names (`$w_T_Titled`).
        let witnesses: Vec<String> = generic
            .bounds
            .iter()
            .filter_map(|(param, protocol)| match param {
                Ty::Param(_, name) => Some(super::witness_param(name, protocol)),
                _ => None,
            })
            .collect();
        let Ty::Fn(f) = self.instantiate(ty) else { return Ty::Unknown };
        let params: Vec<String> = f.params.iter().filter_map(|p| p.name.clone()).collect();
        let (order, _) = self.bloom_args(call, &f, true);
        let trailing = order
            .iter()
            .position(|o| *o == Some(call.args.len()))
            .and_then(|slot| f.params[slot].name.clone());
        self.witnesses_of(expr, call.callee.span, &f);
        self.out.calls.insert(expr.id, CallRes::View { params, trailing, witnesses });
        f.ret.clone()
    }

    /// `view.modifier(Gate(…))` with `struct Gate: ViewModifier`. A stateful one (its members
    /// keep state or call hooks) is called once per render at the top of the view applying it,
    /// so it is applied in the view's `body` itself, from names declared before the body.
    fn view_modifier(&mut self, expr: &Expr, arg: &Arg, callee: &str, stateful: bool) -> Ty {
        let saved = self.modifier_arg.replace(arg.value.id);
        self.expr(&arg.value, None);
        self.modifier_arg = saved;
        if stateful {
            let in_closure = self.frames.last().is_some_and(|f| f.closure);
            match self.modifier_site.filter(|_| !in_closure) {
                None => self.report(
                    Diagnostic::error(
                        "B0422",
                        arg.value.span,
                        format!("`{callee}` keeps state, so it is applied in a view's `body`"),
                    )
                    .label("in a closure, a `for` row or a member, which may run any number of times")
                    .help(format!(
                        "apply it outside the rows (`VStack {{ … }}.modifier({callee}(…))`), or make `{callee}` keep no state"
                    ))
                    .spec("72b-view-modifiers"),
                ),
                Some(first) => {
                    let mut late: Vec<(String, Span)> = Vec::new();
                    super::walk_names(&arg.value, &mut |name, id| {
                        if let Some(super::NameRes::Local(local)) = self.out.names.get(&id)
                            && *local >= first
                            && !late.iter().any(|(n, _)| n == name)
                        {
                            late.push((name.to_string(), self.out.locals[*local].span));
                        }
                    });
                    if let Some((name, declared)) = late.first() {
                        self.report(
                            Diagnostic::error(
                                "B0422",
                                arg.value.span,
                                format!("`{callee}(…)` reads `{name}`, declared in the body"),
                            )
                            .label("a modifier that keeps state is set up before the body runs")
                            .with_label(*declared, "declared here")
                            .help(format!("make `{name}` a member of the view (`let {name} = …` beside the props)"))
                            .spec("72b-view-modifiers"),
                        );
                    }
                }
            }
        }
        self.out.view_modifiers.insert(expr.id, stateful);
        self.out.calls.insert(expr.id, CallRes::Modifier { object: false });
        Ty::View(None)
    }

    /// `.name(…)` on a view: the node takes it, with that many arguments, each
    /// a valid token where the spec takes a token.
    fn modifier(
        &mut self,
        expr: &Expr,
        call: &Call,
        kind: Option<&'static str>,
        name: &Ident,
        recv: &Ty,
        task_allowed: bool,
    ) -> Ty {
        if name.name == "task" {
            return self.task(expr, call, name, recv, task_allowed);
        }
        // `.ref(x)`, `.inputRef(x)`: the `@ref` itself, for the node to fill.
        if (name.name == "ref" || name.name.ends_with("Ref"))
            && let [arg] = call.args.as_slice()
            && matches!(arg.value.kind, ExprKind::Name(_))
        {
            self.ref_object = true;
            self.boundary(&arg.value, None);
            self.ref_object = false;
            self.out.calls.insert(expr.id, CallRes::Modifier { object: false });
            return recv.clone();
        }
        if name.name == "onChange" {
            return self.on_change(expr, call, name, recv, task_allowed);
        }
        // `.modifier(Gate(…))`, a `struct Gate: ViewModifier`: its body wraps the view.
        if name.name == "modifier"
            && let [arg] = call.args.as_slice()
            && arg.label.is_none()
            && let ExprKind::Call(inner) = &arg.value.kind
            && let ExprKind::Name(callee) = &inner.callee.kind
            && let Some(&stateful) = self.modifier_decls.get(callee.as_str())
        {
            return self.view_modifier(expr, arg, callee, stateful);
        }
        let kind = kind.unwrap_or("view");
        let Some(spec) = ui::node(kind) else { return recv.clone() };
        let ctor = spec.constructors.first().copied().unwrap_or(match kind {
            "menuActions" => "MenuActions",
            "menuContent" => "MenuContent",
            _ => "A view",
        });
        let Some(params) = ui::modifier_params(spec, &name.name) else {
            let takers = ui::takers(&name.name);
            let help = match closest(&name.name, spec.modifiers.iter().copied()) {
                Some(near) => format!("did you mean `.{near}`?"),
                None if !takers.is_empty() => format!(
                    "{} take(s) `.{}`; `{ctor}` does not",
                    takers.iter().take(3).map(|t| format!("`{t}`")).collect::<Vec<_>>().join(", "),
                    name.name
                ),
                None => format!("see the modifiers `{ctor}` takes"),
            };
            let mut diagnostic =
                Diagnostic::error("B0501", name.span, format!("`{ctor}` has no modifier `.{}`", name.name))
                    .label("not a modifier of this node")
                    .help(help)
                    .docs(ui::node_docs(kind));
            if let Some(near) = closest(&name.name, spec.modifiers.iter().copied()) {
                diagnostic = diagnostic.fix(name.span, near);
            }
            self.report(diagnostic);
            self.args_unchecked(call);
            return recv.clone();
        };
        let named: Vec<&Arg> = call.args.iter().filter(|a| a.label.is_some()).collect();
        let positional: Vec<&Expr> =
            call.args.iter().filter(|a| a.label.is_none()).map(|a| &a.value).collect();
        let object = !named.is_empty();
        // `.frame(width: "full")`: the named arguments are the object parameter's keys.
        if object {
            let object_param = params
                .iter()
                .map(|p| p.trim_end_matches('?'))
                .find(|p| matches!(ui::param_kind(spec, p), ParamKind::Object { .. }));
            match object_param.map(|p| ui::param_kind(spec, p)) {
                Some(ParamKind::Object { keys, set, points, .. }) => {
                    for arg in &named {
                        let label = arg.label.as_ref().expect("named");
                        if !keys.contains(&label.name.as_str()) {
                            let help = closest(&label.name, keys.iter().copied()).map_or_else(
                                || format!("its keys are {}", keys.join(", ")),
                                |near| format!("did you mean `{near}:`?"),
                            );
                            self.report(
                                Diagnostic::error(
                                    "B0501",
                                    label.span,
                                    format!("`.{}` has no `{}`", name.name, label.name),
                                )
                                .label("not one of its keys")
                                .help(help)
                                .docs(ui::modifier_docs(&name.name)),
                            );
                            continue;
                        }
                        match &set {
                            Some(set) if points => self.points_arg(&arg.value, set, &name.name),
                            Some(set) => self.token_arg(&arg.value, set, &name.name),
                            None => {
                                self.boundary(&arg.value, None);
                            }
                        }
                    }
                }
                _ => {
                    let label = named[0].label.as_ref().expect("named");
                    self.report(
                        Diagnostic::error(
                            "B0503",
                            label.span,
                            format!("`.{}` takes its arguments in order", name.name),
                        )
                        .label("no labels here")
                        .help(format!("write `.{}({})`", name.name, params.join(", ")))
                        .docs(ui::modifier_docs(&name.name)),
                    );
                    for arg in &named {
                        self.boundary(&arg.value, None);
                    }
                }
            }
        }
        let count = positional.len() + usize::from(call.trailing.is_some()) + usize::from(object);
        let (required, total) = ui::arity(params);
        if count < required || total.is_some_and(|t| count > t) {
            let expected = match total {
                Some(t) if t == required => required.to_string(),
                Some(t) => format!("{required} to {t}"),
                None => format!("{required} or more"),
            };
            self.report(
                Diagnostic::error(
                    "B0503",
                    call.args.first().map_or(name.span, |a| a.span),
                    format!("`.{}` takes {expected} argument(s), not {count}", name.name),
                )
                .label("wrong number of arguments")
                .help(format!(
                    "write `.{}({})`: a parameter marked ? is optional",
                    name.name,
                    params.join(", ")
                ))
                .docs(ui::modifier_docs(&name.name)),
            );
        }
        let pairs = ui::paired(params, positional.len() + usize::from(call.trailing.is_some()));
        for (index, param) in pairs {
            let kind = ui::param_kind(spec, param);
            if index == positional.len() {
                // The trailing closure.
                let trailing = call.trailing.as_ref().expect("counted");
                match kind {
                    ParamKind::Children | ParamKind::View => self.builder_closure(trailing),
                    _ => {
                        let ty = self.closure(trailing, None, true);
                        let _ = ty;
                    }
                }
                continue;
            }
            let value = positional[index];
            match kind {
                ParamKind::Token(set) => self.token_arg(value, &set, &name.name),
                ParamKind::TokenOrPoints(set) => self.points_arg(value, &set, &name.name),
                ParamKind::Bool => {
                    self.expr(value, Some(&Ty::Bool));
                }
                ParamKind::View | ParamKind::Children => self.child(value),
                // `.accessory(if open { row })`: an `if` without `else` is an optional child.
                ParamKind::Object { .. } | ParamKind::Any if matches!(&value.kind, ExprKind::If(i) if i.otherwise.is_none()) => {
                    self.child(value)
                }
                ParamKind::Object { name: object, .. } => {
                    let ty = self.object_expected(object, false, value);
                    self.boundary(value, ty.as_ref());
                }
                ParamKind::ObjectList(object) => {
                    let ty = self.object_expected(object, true, value);
                    self.boundary(value, ty.as_ref());
                }
                ParamKind::Any => {
                    self.boundary(value, None);
                    self.element_fields(value, crate::ui::element_fields(&name.name));
                }
            }
        }
        self.out.calls.insert(expr.id, CallRes::Modifier { object });
        recv.clone()
    }

    /// `.md`, `.caption1`, `.primary.opacity(0.1)` (2.0): a token by its Swift name, recorded
    /// for the emitter as the token string. False when `value` is not written so.
    fn swift_token(&mut self, value: &Expr, set: &Rc<StrSet>, modifier: &str) -> bool {
        let (member, opacity) = match &value.kind {
            ExprKind::ImplicitMember(member) => (member, None),
            // `.primary.opacity(0.1)`: a colour role at an opacity (`"primary/10"`).
            ExprKind::Call(call)
                if (set.name == "color" || set.name == "ring")
                    && let ExprKind::Field(inner, method) = &call.callee.kind
                    && method.name == "opacity"
                    && let ExprKind::ImplicitMember(member) = &inner.kind
                    && let [arg] = call.args.as_slice() =>
            {
                (member, Some(arg))
            }
            _ => return false,
        };
        let Some(token) = ui::swift_token(&set.name, &member.name) else {
            if !set.token && set.values.iter().any(|v| v == &member.name) {
                return false;
            }
            let help = match closest(&member.name, ui::swift_names(&set.name)) {
                Some(near) => format!("did you mean `.{near}`?"),
                None => format!("write one of the {} tokens", set.name),
            };
            self.report(
                Diagnostic::error(
                    "B0502",
                    member.span,
                    format!("`.{modifier}` takes {} tokens, and `.{}` is not one", set.name, member.name),
                )
                .label("not a token of this set")
                .help(help)
                .docs(ui::token_docs(set)),
            );
            return true;
        };
        let token = match opacity {
            None => token.to_string(),
            Some(arg) => {
                let percent = match &arg.value.kind {
                    ExprKind::Float(f) => Some((f * 100.0).round() as i64),
                    _ => None,
                };
                match percent
                    .map(|p| p.to_string())
                    .filter(|p| ui::token_set("opacity").is_some_and(|o| o.contains(&p.as_str())))
                {
                    Some(p) => format!("{token}/{p}"),
                    None => {
                        self.report(
                            Diagnostic::error(
                                "B0502",
                                arg.value.span,
                                "`.opacity(…)` takes an opacity token",
                            )
                            .label("not an opacity Bloom names")
                            .help("write a fraction of the opacity scale: 0.05, 0.1, 0.2, 0.25, …")
                            .docs(ui::token_docs(set)),
                        );
                        return true;
                    }
                }
            }
        };
        self.out.swift_tokens.insert(value.id, token);
        true
    }

    /// A token parameter: a literal in the set, or a value of the set's type.
    fn token_arg(&mut self, value: &Expr, set: &Rc<StrSet>, modifier: &str) {
        // `.tint(support ? .success : none)`: where TS takes `undefined`, `none` leaves the
        // modifier unapplied (R4).
        if let Some(handled) = self.none_token(value, set, modifier) {
            if handled {
                let ty = Ty::Option(Box::new(Ty::Strings(set.clone())));
                self.out.types.insert(value.id, ty.clone());
                self.span_type((value.span, ty));
            }
            return;
        }
        // `isLiked ? .danger : .neutral`: a token each way.
        if let ExprKind::Ternary(cond, then, otherwise) = &value.kind
            && [then, otherwise].iter().any(|b| matches!(b.kind, ExprKind::ImplicitMember(_)))
        {
            self.expr(cond, Some(&Ty::Bool));
            self.token_arg(then, set, modifier);
            self.token_arg(otherwise, set, modifier);
            let ty = Ty::Strings(set.clone());
            self.out.types.insert(value.id, ty.clone());
            self.span_type((value.span, ty));
            return;
        }
        if let Some(number) = written_number(value) {
            let as_token = set.values.contains(&number);
            let mut diagnostic = Diagnostic::error(
                "B0502",
                value.span,
                format!("`.{modifier}` takes {} tokens, not the number {number}", set.name),
            )
            .label("a number written out")
            .docs(ui::token_docs(set));
            diagnostic = if as_token {
                diagnostic
                    .help(format!("write the token: `\"{number}\"`"))
                    .fix(value.span, format!("\"{number}\""))
            } else {
                diagnostic.help(format!("write one of the {} tokens", set.name))
            };
            self.report(diagnostic);
            return;
        }
        let expected = Ty::Strings(set.clone());
        if self.swift_token(value, set, modifier) {
            self.out.types.insert(value.id, expected);
            return;
        }
        // A set whose TS type also takes a boolean (`HitTesting`, `Condition | boolean`).
        if ui::takes_bool(&set.name) && !matches!(value.kind, ExprKind::Str { .. }) {
            let ty = self.boundary(value, None);
            let ty = match self.resolve(&ty) {
                Ty::Option(inner) => self.resolve(&inner),
                other => other,
            };
            if matches!(ty, Ty::Bool | Ty::Foreign(_) | Ty::Unknown) {
                return;
            }
            self.out.types.remove(&value.id);
        }
        if let ExprKind::Str { parts, .. } = &value.kind
            && parts.iter().all(|p| matches!(p, StrPart::Text(_)))
        {
            let text = super::plain_text(parts);
            if !ui::token_ok(set, &text) {
                self.bad_token(value.span, set, &text, Some(modifier));
                self.out.types.insert(value.id, expected);
                return;
            }
        }
        // A `Tone?` where TS takes `undefined`.
        let expected = if ui::takes_none(modifier) { Ty::Option(Box::new(expected)) } else { expected };
        self.expr(value, Some(&expected));
    }

    /// A token argument that is `none`, or a conditional with a `none` branch: checked, each
    /// other branch a token (`Some(true)`), or refused where TS takes no `undefined`
    /// (`Some(false)`). `None`: not such an argument.
    fn none_token(&mut self, value: &Expr, set: &Rc<StrSet>, modifier: &str) -> Option<bool> {
        let (cond, then, otherwise) = match &value.kind {
            ExprKind::None => (None, None, None),
            ExprKind::Paren(inner) => return self.none_token(inner, set, modifier),
            ExprKind::Ternary(cond, then, otherwise) if super::ends_in_none(value) => {
                (Some(cond), Some(then), Some(otherwise))
            }
            _ => return None,
        };
        if !ui::takes_none(modifier) {
            self.report(
                Diagnostic::error("B0502", value.span, format!("`.{modifier}` does not take `none`"))
                    .label("it may be `none`")
                    .help(format!(
                        "give it a {} token each way, or apply `.{modifier}` only where it has one",
                        set.name
                    ))
                    .docs(ui::token_docs(set)),
            );
            self.boundary(value, None);
            return Some(false);
        }
        if let Some(cond) = cond {
            self.expr(cond, Some(&Ty::Bool));
        }
        for branch in [then, otherwise].into_iter().flatten() {
            if !matches!(branch.kind, ExprKind::None) {
                self.token_arg(branch, set, modifier);
            }
        }
        Some(true)
    }

    /// A parameter that takes points (a computed number) or a token.
    fn points_arg(&mut self, value: &Expr, set: &Rc<StrSet>, modifier: &str) {
        if written_number(value).is_some() || matches!(value.kind, ExprKind::ImplicitMember(_)) {
            self.token_arg(value, set, modifier);
            return;
        }
        let ty = self.boundary(value, None);
        match self.resolve(&ty) {
            Ty::Int | Ty::Float | Ty::Foreign(_) | Ty::Unknown => {}
            _ => {
                self.out.types.remove(&value.id);
                self.token_arg(value, set, modifier);
            }
        }
    }

    fn task(&mut self, expr: &Expr, call: &Call, name: &Ident, recv: &Ty, allowed: bool) -> Ty {
        if !allowed {
            self.report(
                Diagnostic::error("B0431", name.span, "`.task` goes on the body's root view")
                    .label("a task belongs to the view that runs it")
                    .help("move it to the end of the body's outermost chain")
                    .spec("8-effects-tasks-and-concurrency"),
            );
        }
        for arg in &call.args {
            match arg.label.as_ref().map(|l| l.name.as_str()) {
                Some("id") => {
                    self.expr(&arg.value, None);
                }
                _ => self.report(
                    Diagnostic::error("B0207", arg.span, "`.task` takes `id:` and a closure")
                        .label("not `id:`")
                        .help("write `.task { … }` or `.task(id: value) { … }`")
                        .spec("8-effects-tasks-and-concurrency"),
                ),
            }
        }
        match &call.trailing {
            Some(trailing) => {
                self.frames.last_mut().expect("a frame").task = true;
                self.closure(
                    trailing,
                    Some(&Ty::Fn(Rc::new(FnTy {
                        params: Vec::new(),
                        ret: Ty::Unit,
                        is_async: false,
                        generics: 0,
                        ts: false,
                        throws: false,
                        bounds: Vec::new(),
                        shapes: Vec::new(),
                    }))),
                    false,
                );
                self.frames.last_mut().expect("a frame").task = false;
            }
            None => self.report(
                Diagnostic::error("B0207", name.span, "`.task` needs the work to run")
                    .label("no closure")
                    .help("write `.task { … }`")
                    .spec("8-effects-tasks-and-concurrency"),
            ),
        }
        self.out.calls.insert(expr.id, CallRes::Task);
        recv.clone()
    }

    /// `.onChange(of: value) { old, new in … }` on the body's root: runs after
    /// `value` changes (compared as `==` does), not on the first render.
    fn on_change(&mut self, expr: &Expr, call: &Call, name: &Ident, recv: &Ty, allowed: bool) -> Ty {
        if !allowed {
            self.report(
                Diagnostic::error("B0431", name.span, "`.onChange` goes on the body's root view")
                    .label("an effect belongs to the view that runs it")
                    .help("move it to the end of the body's outermost chain")
                    .spec("8-effects-tasks-and-concurrency"),
            );
        }
        let value = match call.args.as_slice() {
            [arg] if arg.label.as_ref().is_some_and(|l| l.name == "of") => self.expr(&arg.value, None),
            _ => {
                let at = call.args.first().map_or(name.span, |a| a.span);
                self.report(
                    Diagnostic::error("B0207", at, "`.onChange` takes the value it watches as `of:`")
                        .label("not `of: value`")
                        .help("write `.onChange(of: value) { old, new in … }`")
                        .spec("8-effects-tasks-and-concurrency"),
                );
                self.args_unchecked(call);
                Ty::Unknown
            }
        };
        let value = self.zonk(&value);
        if let super::Equality::None(part) = super::equality(&self.out.defs, &value) {
            self.report(
                Diagnostic::error(
                    "B0210",
                    call.args[0].value.span,
                    format!("`.onChange` compares values, and {} has no equality", self.show(&part)),
                )
                .label("cannot tell whether it changed")
                .help("watch what it holds (a field, an id) instead")
                .spec("43-soundness-rules"),
            );
        }
        match &call.trailing {
            Some(trailing) => {
                let params = match trailing.params.len() {
                    0 => Vec::new(),
                    2 => vec![value.clone(), value.clone()],
                    _ => {
                        self.report(
                            Diagnostic::error(
                                "B0207",
                                trailing.span,
                                "`.onChange` gives the old and the new value",
                            )
                            .label("one parameter")
                            .help("write `{ old, new in … }`, or `{ … }` without parameters")
                            .spec("8-effects-tasks-and-concurrency"),
                        );
                        vec![value.clone(); trailing.params.len()]
                    }
                };
                let params = params
                    .into_iter()
                    .map(|ty| ParamTy {
                        labelled: false,
                        positional: false,
                        name: None,
                        ty,
                        optional: false,
                        rest: false,
                    })
                    .collect();
                let handler = Ty::Fn(Rc::new(FnTy {
                    params,
                    ret: Ty::Unit,
                    is_async: false,
                    generics: 0,
                    ts: false,
                    throws: false,
                    bounds: Vec::new(),
                    shapes: Vec::new(),
                }));
                self.closure(trailing, Some(&handler), false);
            }
            None => self.report(
                Diagnostic::error("B0207", name.span, "`.onChange` needs the work to run")
                    .label("no closure")
                    .help("write `.onChange(of: value) { old, new in … }`")
                    .spec("8-effects-tasks-and-concurrency"),
            ),
        }
        self.out.calls.insert(expr.id, CallRes::OnChange(value));
        recv.clone()
    }

    /// `all(a(), b())`: both results, as a tuple; `race(a(), b())`: the first.
    /// Each is a pending Bloom call or a TS promise; with a promise among them
    /// the whole is a promise (awaiting it gives a `Result`).
    fn all_or_race(&mut self, expr: &Expr, call: &Call, all: bool) -> Ty {
        let word = if all { "all" } else { "race" };
        if call.args.len() < 2
            || call.trailing.is_some()
            || call.args.iter().any(|a| a.label.is_some() || a.spread)
        {
            self.report(
                Diagnostic::error(
                    "B0207",
                    call.callee.span,
                    format!("`{word}` takes two or more pending calls"),
                )
                .label("in order, without labels")
                .help(format!("write `await {word}(loadA(), loadB())`"))
                .spec("8-effects-tasks-and-concurrency"),
            );
        }
        let mut promise = false;
        let mut results = Vec::new();
        let raced = self.fresh();
        for arg in &call.args {
            let ty = self.expr(&arg.value, None);
            let result = match self.resolve(&ty) {
                Ty::Async(t) => *t,
                Ty::Promise(t) => {
                    promise = true;
                    *t
                }
                Ty::Foreign(text) => {
                    promise = true;
                    foreign_of(&text, |t| format!("Awaited<{t}>"))
                }
                Ty::Unknown => Ty::Unknown,
                other => {
                    self.report(
                        Diagnostic::error(
                            "B0215",
                            arg.value.span,
                            format!("`{word}` waits for pending calls, and this is {}", self.show(&other)),
                        )
                        .label("nothing to wait for")
                        .help("pass the call itself, without `await`: `all(loadA(), loadB())`")
                        .spec("8-effects-tasks-and-concurrency"),
                    );
                    Ty::Unknown
                }
            };
            if !all && !self.unify(&raced, &result) {
                self.mismatch(arg.value.span, &result, &raced);
            }
            results.push(result);
        }
        self.out.calls.insert(expr.id, if all { CallRes::All } else { CallRes::Race });
        let value = if all { Ty::Tuple(results) } else { raced };
        if promise { Ty::Promise(Box::new(value)) } else { Ty::Async(Box::new(value)) }
    }

    fn method_call(&mut self, expr: &Expr, call: &Call, recv: &Ty, name: &Ident) -> Ty {
        let Some((recv_kind, method, params, ret)) = self.method_sig(recv, &name.name) else {
            let methods = method_names(recv);
            let optional = match recv {
                Ty::Option(inner) => method_names(&self.resolve(inner)).contains(&name.name.as_str()),
                _ => false,
            };
            let help = if optional {
                Some(format!("it may be `none`: write `?.{}`", name.name))
            } else {
                closest(&name.name, methods.iter().copied()).map(|near| format!("did you mean `.{near}`?"))
            };
            self.report(
                Diagnostic::error(
                    "B0209",
                    name.span,
                    format!("{} has no method `{}`", self.show(recv), name.name),
                )
                .label("no such method")
                .maybe_help(help)
                .spec("12-standard-library-surface-draft"),
            );
            self.args_unchecked(call);
            return Ty::Unknown;
        };
        // A generic method's result met with what is expected first (`[Item]` for `map`'s `[U]`), so
        // its closure's literals are checked against `Item`, as Swift checks them in context.
        if let Some(expected) = self.call_expected.remove(&expr.id)
            && contains_var(&self.zonk(&ret))
            && !matches!(self.resolve(&expected), Ty::Var(_) | Ty::Unknown | Ty::Foreign(_))
        {
            let target = match self.resolve(&expected) {
                Ty::Option(inner) if !matches!(self.resolve(&ret), Ty::Option(_)) => *inner,
                other => other,
            };
            let _ = self.unify(&ret, &target);
        }
        // `xs.dropFirst()` / `xs.dropLast()`: one element, Swift's default.
        let params = if recv_kind == Recv::List
            && matches!(method, "dropFirst" | "dropLast")
            && call.args.is_empty()
            && call.trailing.is_none()
        {
            Vec::new()
        } else {
            params
        };
        self.positional(call, &params);
        self.out.calls.insert(expr.id, CallRes::Method { recv: recv_kind, name: method });
        ret
    }

    /// A standard library method: its receiver kind, name, parameter and result types.
    fn method_sig(&mut self, recv: &Ty, name: &str) -> Option<(Recv, &'static str, Vec<Ty>, Ty)> {
        let f = |params: Vec<Ty>, ret: Ty| {
            Ty::Fn(Rc::new(FnTy {
                params: params
                    .into_iter()
                    .map(|ty| ParamTy {
                        labelled: false,
                        positional: false,
                        name: None,
                        ty,
                        optional: false,
                        rest: false,
                    })
                    .collect(),
                ret,
                is_async: false,
                generics: 0,
                ts: false,
                throws: false,
                bounds: Vec::new(),
                shapes: Vec::new(),
            }))
        };
        let opt = |t: Ty| Ty::Option(Box::new(t));
        let list = |t: Ty| Ty::List(Box::new(t));
        let name = method_names(recv).into_iter().find(|m| *m == name)?;
        Some(match recv {
            Ty::Str | Ty::Strings(_) => {
                let (params, ret) = match name {
                    "slice" => (vec![Ty::Int, Ty::Int], Ty::Str),
                    "contains" | "startsWith" | "endsWith" => (vec![Ty::Str], Ty::Bool),
                    "lowercased" | "uppercased" | "trimmed" => (vec![], Ty::Str),
                    "split" => (vec![Ty::Str], list(Ty::Str)),
                    // A pattern is a string (every match) or a JS `RegExp` (as JS's `replace`).
                    "replace" => (vec![Ty::Foreign("string | RegExp".into()), Ty::Str], Ty::Str),
                    "match" => (
                        vec![Ty::Foreign("string | RegExp".into())],
                        Ty::Foreign("RegExpMatchArray | null".into()),
                    ),
                    "toInt" => (vec![], opt(Ty::Int)),
                    _ => (vec![], opt(Ty::Float)),
                };
                (Recv::Str, name, params, ret)
            }
            Ty::Int | Ty::Float => {
                let num = recv.clone();
                let (params, ret) = match name {
                    "toFloat" => (vec![], Ty::Float),
                    "rounded" | "floor" | "ceil" | "truncated" => (vec![], Ty::Int),
                    "abs" => (vec![], num.clone()),
                    "min" | "max" => (vec![num.clone()], num.clone()),
                    _ => (vec![num.clone(), num.clone()], num.clone()),
                };
                (if *recv == Ty::Int { Recv::Int } else { Recv::Float }, name, params, ret)
            }
            Ty::List(elem) => {
                let t = (**elem).clone();
                let u = self.fresh();
                let (params, ret) = match name {
                    "map" => (vec![f(vec![t.clone()], u.clone())], list(u)),
                    "flatMap" => (vec![f(vec![t.clone()], list(u.clone()))], list(u)),
                    "any" | "all" => (vec![f(vec![t.clone()], Ty::Bool)], Ty::Bool),
                    "slice" => (vec![Ty::Int, Ty::Int], list(t)),
                    "indexOf" => (vec![t.clone()], opt(Ty::Int)),
                    "at" => (vec![Ty::Int], opt(t.clone())),
                    "enumerated" => (vec![], list(Ty::Tuple(vec![Ty::Int, t.clone()]))),
                    "filter" => (vec![f(vec![t.clone()], Ty::Bool)], list(t)),
                    "compactMap" => (vec![f(vec![t.clone()], opt(u.clone()))], list(u)),
                    "reduce" => (vec![u.clone(), f(vec![u.clone(), t.clone()], u.clone())], u),
                    "find" => (vec![f(vec![t.clone()], Ty::Bool)], opt(t)),
                    "findIndex" => (vec![f(vec![t.clone()], Ty::Bool)], opt(Ty::Int)),
                    "contains" => (vec![t.clone()], Ty::Bool),
                    "sorted" => (vec![f(vec![t.clone(), t.clone()], Ty::Bool)], list(t)),
                    "reversed" => (vec![], list(t)),
                    "prefix" | "suffix" | "dropFirst" | "dropLast" => (vec![Ty::Int], list(t)),
                    "appending" => (vec![t.clone()], list(t)),
                    "inserting" => (vec![t.clone(), Ty::Int], list(t)),
                    "removing" => (vec![Ty::Int], list(t)),
                    _ => (vec![Ty::Str], Ty::Str),
                };
                (Recv::List, name, params, ret)
            }
            Ty::Map(value) => {
                let v = (**value).clone();
                let (params, ret) = match name {
                    "setting" => (vec![Ty::Str, v.clone()], Ty::Map(Box::new(v))),
                    _ => (vec![Ty::Str], Ty::Map(Box::new(v))),
                };
                (Recv::Map, name, params, ret)
            }
            Ty::JsMap(key, value) => {
                let (k, v) = ((**key).clone(), (**value).clone());
                let map = Ty::JsMap(key.clone(), value.clone());
                let (params, ret) = match name {
                    "get" => (vec![k], opt(v)),
                    "contains" => (vec![k], Ty::Bool),
                    "setting" => (vec![k, v], map),
                    _ => (vec![k], map),
                };
                (Recv::JsMap, name, params, ret)
            }
            Ty::Set(elem) => {
                let t = (**elem).clone();
                let (params, ret) = match name {
                    "contains" => (vec![t], Ty::Bool),
                    _ => (vec![t], Ty::Set(elem.clone())),
                };
                (Recv::Set, name, params, ret)
            }
            Ty::Option(inner) => {
                let t = (**inner).clone();
                let u = self.fresh();
                let (params, ret) = match name {
                    "map" => (vec![f(vec![t.clone()], u.clone())], opt(u)),
                    _ => (vec![t.clone()], t),
                };
                (Recv::Option, name, params, ret)
            }
            Ty::Result(ok, err) => {
                let (t, e) = ((**ok).clone(), (**err).clone());
                let u = self.fresh();
                let (params, ret) = match name {
                    "map" => (vec![f(vec![t.clone()], u.clone())], Ty::Result(Box::new(u), Box::new(e))),
                    "mapErr" => (vec![f(vec![e.clone()], u.clone())], Ty::Result(Box::new(t), Box::new(u))),
                    "unwrapOr" => (vec![t.clone()], t),
                    _ => (vec![], opt(t)),
                };
                (Recv::Result, name, params, ret)
            }
            _ => return None,
        })
    }
}

/// The standard library's methods on `ty` (spec 12).
pub fn method_names(ty: &Ty) -> Vec<&'static str> {
    match ty {
        Ty::Str | Ty::Strings(_) => vec![
            "slice",
            "contains",
            "startsWith",
            "endsWith",
            "lowercased",
            "uppercased",
            "trimmed",
            "split",
            "replace",
            "match",
            "toInt",
            "toFloat",
        ],
        Ty::Int => vec!["toFloat", "abs", "min", "max", "clamp", "clamped"],
        Ty::Float => vec!["rounded", "floor", "ceil", "truncated", "abs", "min", "max", "clamp", "clamped"],
        Ty::List(_) => vec![
            "map",
            "filter",
            "compactMap",
            "reduce",
            "find",
            "findIndex",
            "contains",
            "sorted",
            "reversed",
            "prefix",
            "suffix",
            "dropFirst",
            "dropLast",
            "appending",
            "inserting",
            "removing",
            "joined",
            "flatMap",
            "any",
            "all",
            "slice",
            "indexOf",
            "at",
            "enumerated",
        ],
        Ty::Map(_) => vec!["setting", "removing"],
        Ty::JsMap(..) => vec!["get", "contains", "setting", "removing"],
        Ty::Set(_) => vec!["contains", "inserting", "removing"],
        Ty::Option(_) => vec!["map", "unwrapOr"],
        Ty::Result(..) => vec!["map", "mapErr", "unwrapOr", "ok"],
        _ => Vec::new(),
    }
}

/// `(key, value)`: two arguments without labels, the first of them a key path
/// or not a field's value (a struct's fields are otherwise named).
/// A string literal, or a list literal of them (`["a", "b"]`).
fn literal_strings(expr: &Expr) -> bool {
    match &expr.kind {
        ExprKind::List(items) => {
            !items.is_empty() && items.iter().all(|i| super::string_literal(i).is_some())
        }
        _ => super::string_literal(expr).is_some(),
    }
}

fn keyed(call: &Call) -> bool {
    call.trailing.is_none()
        && call.args.len() == 2
        && call.args.iter().all(|a| a.label.is_none() && !a.spread)
}

/// A number written out (`16`, `-8`) where a token goes.
fn written_number(value: &Expr) -> Option<String> {
    match &value.kind {
        ExprKind::Int(v) => Some(v.to_string()),
        ExprKind::Float(v) => Some(v.to_string()),
        ExprKind::Unary(UnaryOp::Neg, inner) => written_number(inner).map(|n| format!("-{n}")),
        _ => None,
    }
}

/// `1st`, `2nd`, `3rd`, `4th`…
fn ordinal(n: usize) -> String {
    let suffix = match (n % 10, n % 100) {
        (1, 11) | (2, 12) | (3, 13) => "th",
        (1, _) => "st",
        (2, _) => "nd",
        (3, _) => "rd",
        _ => "th",
    };
    format!("{n}{suffix}")
}

/// Whether `ty` still has an unsolved type variable.
fn contains_var(ty: &Ty) -> bool {
    let mut found = false;
    map_ty(ty, &mut |t| {
        if matches!(t, Ty::Var(_)) {
            found = true;
        }
        None
    });
    found
}

/// Swift collection methods a JS array does not have: called on a `Foreign` value they would
/// throw at run time (B0601).
const SWIFT_ONLY_MEMBERS: &[&str] = &[
    "enumerated",
    "compactMap",
    "firstIndex",
    "lastIndex",
    "allSatisfy",
    "dropFirst",
    "dropLast",
    "reversed",
    "sorted",
    "removingDuplicates",
    "chunked",
    "joined",
];
