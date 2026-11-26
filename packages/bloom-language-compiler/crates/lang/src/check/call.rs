//! Calls: Bloom and TS functions, construction, enum cases, nodes and their
//! modifiers (checked against the spec tables), components, views, the
//! prelude and the standard library.

use std::rc::Rc;

use super::{CallRes, Checker, ClosureInfo, LocalKind, NameRes, Recv, TypeName};
use crate::ast::*;
use crate::diagnostic::{Diagnostic, closest};
use crate::types::*;
use crate::ui::{self, ParamKind};

impl Checker<'_> {
    pub(super) fn call(&mut self, expr: &Expr, call: &Call, expected: Option<&Ty>) -> Ty {
        let hook_allowed = std::mem::take(&mut self.hook_allowed);
        let task_allowed = std::mem::take(&mut self.task_allowed);
        match &call.callee.kind {
            ExprKind::Name(name) => {
                if let Some(local) = self.lookup(name) {
                    self.out.names.insert(call.callee.id, NameRes::Local(local));
                    let info = self.out.locals[local].clone();
                    self.out.types.insert(call.callee.id, info.ty.clone());
                    return match &info.kind {
                        LocalKind::Component { props } => self.component_call(expr, call, props),
                        LocalKind::View => self.view_call(expr, call, &info.ty),
                        LocalKind::Import { hook: true } => {
                            if !hook_allowed {
                                self.report(
                                    Diagnostic::error(
                                        "B0420",
                                        call.callee.span,
                                        format!("the hook `{name}` is called outside a view member"),
                                    )
                                    .label("a hook runs on every render, in the same order")
                                    .help(format!("call it as a view member: `let value = {name}(…)`"))
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
                                && name.starts_with(|c: char| c.is_ascii_uppercase()) =>
                        {
                            self.component_call(expr, call, &Ty::Foreign("".into()))
                        }
                        _ => {
                            let ty = self.instantiate(&info.ty);
                            self.value_call(expr, call, &ty)
                        }
                    };
                }
                match name.as_str() {
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
                        return if name == "toast" { Ty::Unit } else { Ty::Foreign("Navigation".into()) };
                    }
                    "sleep" => {
                        self.out.calls.insert(expr.id, CallRes::Sleep);
                        self.positional(call, &[Ty::Int]);
                        return Ty::Async(Box::new(Ty::Unit));
                    }
                    "all" | "race" => return self.all_or_race(expr, call, name == "all"),
                    "Binding" => return self.binding_ctor(expr, call),
                    _ => {}
                }
                if let Some(TypeName::Def(def)) = self.type_names.get(name).cloned() {
                    if matches!(self.out.defs[def].kind, DefKind::Struct(_)) {
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
                let recv = self.resolve(&recv);
                match &recv {
                    Ty::View(kind) => self.modifier(expr, call, *kind, member, &recv, task_allowed),
                    Ty::Adt(def, targs)
                        if member.name == "with"
                            && matches!(self.out.defs[*def].kind, DefKind::Struct(_)) =>
                    {
                        let (def, targs) = (*def, targs.clone());
                        self.with_update(expr, call, def, targs)
                    }
                    Ty::Foreign(_) | Ty::Adt(..) => {
                        let field = self.member(&call.callee, &recv, member, object.span);
                        self.out.types.insert(call.callee.id, field.clone());
                        self.value_call(expr, call, &field)
                    }
                    Ty::Unknown => {
                        self.args_unchecked(call);
                        Ty::Unknown
                    }
                    _ => self.method_call(expr, call, &recv, member),
                }
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

    /// Calling a value of type `ty`: a Bloom function, a TS function, or a foreign value.
    fn value_call(&mut self, expr: &Expr, call: &Call, ty: &Ty) -> Ty {
        match self.resolve(ty) {
            Ty::Fn(f) if f.ts => {
                self.ts_args(expr, call, &f);
                f.ret.clone()
            }
            Ty::Fn(f) => {
                let order = self.bloom_args(call, &f);
                self.out.calls.insert(expr.id, CallRes::Bloom { order });
                if f.is_async { Ty::Async(Box::new(f.ret.clone())) } else { f.ret.clone() }
            }
            Ty::Foreign(text) => {
                self.out.calls.insert(expr.id, CallRes::Ts);
                for arg in &call.args {
                    self.boundary(&arg.value, None);
                }
                if let Some(trailing) = &call.trailing {
                    self.closure(trailing, None, true);
                }
                Ty::Foreign(format!("ReturnType<{text}>").into())
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
    fn bloom_args(&mut self, call: &Call, f: &FnTy) -> Vec<Option<usize>> {
        let mut order: Vec<Option<usize>> = vec![None; f.params.len()];
        let mut next = 0;
        for (index, arg) in call.args.iter().enumerate() {
            if arg.spread {
                self.report(
                    Diagnostic::error(
                        "B0207",
                        arg.span,
                        "`..` spreads a struct into a construction, not a call",
                    )
                    .label("not a struct construction")
                    .spec("44-structs"),
                );
                continue;
            }
            let slot = match &arg.label {
                Some(label) => {
                    match f.params.iter().position(|p| p.name.as_deref() == Some(label.name.as_str())) {
                        Some(slot) => slot,
                        None => {
                            let names: Vec<&str> =
                                f.params.iter().filter_map(|p| p.name.as_deref()).collect();
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
                    if next >= order.len() {
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
                    next
                }
            };
            if order[slot].is_some() {
                self.report(
                    Diagnostic::error("B0207", arg.span, "this parameter is given twice")
                        .label("already given")
                        .spec("5-values-functions-and-closures"),
                );
                continue;
            }
            order[slot] = Some(index);
            let ty = f.params[slot].ty.clone();
            self.expr(&arg.value, Some(&ty));
        }
        if let Some(trailing) = &call.trailing {
            let slot = (0..order.len())
                .rev()
                .find(|&i| order[i].is_none() && matches!(self.resolve(&f.params[i].ty), Ty::Fn(_)));
            match slot {
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
                            .label("a trailing closure fills a function parameter")
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
            .filter(|(p, given)| given.is_none() && !p.optional)
            .map(|(p, _)| format!("`{}`", p.name.clone().unwrap_or_default()))
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
        order
    }

    /// A TS function: positional arguments in order (a rest parameter takes the
    /// rest), named ones form one options object passed last (spec 5).
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
            match param {
                Some(param) => {
                    let ty = param.ty.clone();
                    self.boundary(&arg.value, Some(&ty));
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
                Some(_) => {
                    for arg in &named {
                        self.boundary(&arg.value, None);
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
            let closure = self.closure(
                trailing,
                ty.as_ref().filter(|t| matches!(self.resolve(t), Ty::Fn(_))),
                ty.is_none(),
            );
            if let Some(ty) = ty
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
                    .help(format!("pass it: `{}({first}: …)`, or give the field a default", d.name))
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
                name: Some("value".into()),
                ty: value.clone(),
                optional: false,
                rest: false,
            }],
            ret: Ty::Unit,
            is_async: false,
            generics: 0,
            ts: false,
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
        self.expr(&call.args[0].value, Some(&value));
        self.expr(&call.args[1].value, Some(&setter));
        self.out.calls.insert(expr.id, CallRes::Binding);
        Ty::Binding(Box::new(value))
    }

    /// A node constructor: positional arguments; a trailing closure is its children.
    fn node_call(&mut self, expr: &Expr, call: &Call, kind: &'static str) -> Ty {
        let ExprKind::Name(name) = &call.callee.kind else { unreachable!("a node is called by name") };
        let ctor = ui::node(kind)
            .and_then(|n| n.constructors.iter().find(|c| **c == name.as_str()))
            .copied()
            .unwrap_or("Embed");
        self.out.calls.insert(expr.id, CallRes::Node(ctor));
        for arg in &call.args {
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
            self.node_arg(&arg.value);
        }
        if let Some(trailing) = &call.trailing {
            self.builder_closure(trailing);
        }
        Ty::View(Some(kind))
    }

    /// A node's argument: TypeScript checks it against the node's signature
    /// (constructor signatures are not in the spec tables yet), Bloom checks the value.
    fn node_arg(&mut self, value: &Expr) {
        let ty = self.boundary(value, None);
        if let Ty::Option(inner) = self.resolve(&ty)
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

    fn component_call(&mut self, expr: &Expr, call: &Call, props: &Ty) -> Ty {
        self.out.calls.insert(expr.id, CallRes::Component);
        let props = self.resolve(props);
        let fields = match &props {
            Ty::Adt(def, _) => Some(self.out.defs[*def].fields().to_vec()),
            Ty::Unit => Some(Vec::new()),
            _ => None,
        };
        let mut given = Vec::new();
        for arg in &call.args {
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
            self.boundary(&arg.value, ty.as_ref());
        }
        if let Some(fields) = &fields {
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
            self.builder_closure(trailing);
        }
        Ty::View(Some("embed"))
    }

    fn view_call(&mut self, expr: &Expr, call: &Call, ty: &Ty) -> Ty {
        let Ty::Fn(f) = ty else { return Ty::Unknown };
        let params: Vec<String> = f.params.iter().filter_map(|p| p.name.clone()).collect();
        self.bloom_args(call, f);
        self.out.calls.insert(expr.id, CallRes::View { params });
        Ty::View(Some("view"))
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
        if name.name == "onChange" {
            return self.on_change(expr, call, name, recv, task_allowed);
        }
        let kind = kind.unwrap_or("view");
        let Some(spec) = ui::node(kind) else { return recv.clone() };
        let ctor = spec.constructors.first().copied().unwrap_or("A view");
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
                Some(ParamKind::Object { keys, set, points }) => {
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
                ParamKind::Object { .. } | ParamKind::Any => {
                    self.boundary(value, None);
                }
            }
        }
        self.out.calls.insert(expr.id, CallRes::Modifier { object });
        recv.clone()
    }

    /// A token parameter: a literal in the set, or a value of the set's type.
    fn token_arg(&mut self, value: &Expr, set: &Rc<StrSet>, modifier: &str) {
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
        self.expr(value, Some(&expected));
    }

    /// A parameter that takes points (a computed number) or a token.
    fn points_arg(&mut self, value: &Expr, set: &Rc<StrSet>, modifier: &str) {
        if written_number(value).is_some() {
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
                    .map(|ty| ParamTy { name: None, ty, optional: false, rest: false })
                    .collect();
                let handler =
                    Ty::Fn(Rc::new(FnTy { params, ret: Ty::Unit, is_async: false, generics: 0, ts: false }));
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
                    Ty::Foreign(format!("Awaited<{text}>").into())
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
            let help =
                closest(&name.name, methods.iter().copied()).map(|near| format!("did you mean `.{near}`?"));
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
                    .map(|ty| ParamTy { name: None, ty, optional: false, rest: false })
                    .collect(),
                ret,
                is_async: false,
                generics: 0,
                ts: false,
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
                    "replace" => (vec![Ty::Str, Ty::Str], Ty::Str),
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
                    "filter" => (vec![f(vec![t.clone()], Ty::Bool)], list(t)),
                    "compactMap" => (vec![f(vec![t.clone()], opt(u.clone()))], list(u)),
                    "reduce" => (vec![u.clone(), f(vec![u.clone(), t.clone()], u.clone())], u),
                    "find" => (vec![f(vec![t.clone()], Ty::Bool)], opt(t)),
                    "findIndex" => (vec![f(vec![t.clone()], Ty::Bool)], opt(Ty::Int)),
                    "contains" => (vec![t.clone()], Ty::Bool),
                    "sorted" => (vec![f(vec![t.clone(), t.clone()], Ty::Bool)], list(t)),
                    "reversed" => (vec![], list(t)),
                    "prefix" | "dropFirst" => (vec![Ty::Int], list(t)),
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
            "toInt",
            "toFloat",
        ],
        Ty::Int => vec!["toFloat", "abs", "min", "max", "clamp"],
        Ty::Float => vec!["rounded", "floor", "ceil", "truncated", "abs", "min", "max", "clamp"],
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
            "dropFirst",
            "appending",
            "inserting",
            "removing",
            "joined",
        ],
        Ty::Map(_) => vec!["setting", "removing"],
        Ty::Option(_) => vec!["map", "unwrapOr"],
        Ty::Result(..) => vec!["map", "mapErr", "unwrapOr", "ok"],
        _ => Vec::new(),
    }
}

/// `(key, value)`: two arguments without labels, the first of them a key path
/// or not a field's value (a struct's fields are otherwise named).
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
