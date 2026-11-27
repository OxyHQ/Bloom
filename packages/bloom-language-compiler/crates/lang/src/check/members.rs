//! 2.0's reference types and protocols (ADR 0002, section 5): a class's fields and the
//! views that read them (`@Observable`), protocols and their conformances, the witnesses
//! that constrained generics and `any P` pass, and writes into a model's fields.

use std::rc::Rc;

use rustc_hash::{FxHashMap as HashMap, FxHashSet as HashSet};

use super::{Checker, TypeName};
use crate::ast::*;
use crate::diagnostic::Diagnostic;
use crate::types::*;

/// What a generic's type parameter is constrained to, when it is passed a witness.
#[derive(Debug, Clone, PartialEq)]
pub enum Bound {
    /// A protocol of a `.bloom` module, by name: its requirements' witness object.
    Protocol(Rc<str>),
    /// `Equatable` (`Hashable`, `Comparable`): its `==`, a function.
    Equatable,
    /// `Codable` (`Decodable`, `Encodable`): its `Codec<T>`, which `T.self` is.
    Codable,
}

impl Bound {
    /// The bound a protocol's name stands for, as [`FnTy::bounds`] spells it.
    pub fn of(name: &str) -> Bound {
        match name {
            "Equatable" => Bound::Equatable,
            "Codable" => Bound::Codable,
            other => Bound::Protocol(other.into()),
        }
    }

    pub fn name(&self) -> Rc<str> {
        match self {
            Bound::Protocol(name) => name.clone(),
            Bound::Equatable => "Equatable".into(),
            Bound::Codable => "Codable".into(),
        }
    }
}

/// A witness a generic call passes for one of its constraints.
#[derive(Debug, Clone, PartialEq)]
pub enum WitnessArg {
    /// `T$$P`: the conformance's witness object (its type's and protocol's names).
    Conformance { ty: String, protocol: String },
    /// The caller's own witness parameter (`$w_T_P`), passed on.
    Param(String),
    /// `==` of a type, compared field by field where it is a struct.
    Equal(Ty),
    /// A codec: `T$$self`, or a generic type's `T$$codec(…)` of its arguments' codecs.
    Codec(String),
}

/// How a conforming type meets one requirement.
#[derive(Debug, Clone, PartialEq)]
pub enum Witnessed {
    /// A stored property: read from `self`.
    Field(String),
    /// A computed property or a method: its lowered function.
    Fn(String),
}

#[derive(Debug, Clone, PartialEq)]
pub struct Conformance {
    pub def: DefId,
    pub protocol: DefId,
    pub members: Vec<(String, Witnessed)>,
    pub exported: bool,
}

/// A read a view (or a model's member) makes of a model.
#[derive(Debug, Clone, PartialEq, Eq, Hash)]
pub enum Read {
    Field(String),
    /// A member function of the model, whose own reads count.
    Member(String),
}

/// The name of the witness parameter of `T`'s constraint `P`.
pub fn witness_param(param: &str, protocol: &str) -> String {
    format!("$w_{param}_{protocol}")
}

impl Checker<'_> {
    /// A class's stored properties: its fields, typed as written or by their literal value.
    pub(super) fn class_fields(&mut self, c: &ClassDecl) {
        let Some(TypeName::Def(def)) = self.type_names.get(&c.name.name).cloned() else { return };
        self.generics = c.generics.iter().map(|g| g.name.clone()).collect();
        let mut fields: Vec<FieldDef> = Vec::new();
        let mut class = self.out.defs[def].class.clone().unwrap_or_default();
        for member in &c.body.members {
            let TypeMemberKind::Stored { mutable, name, ty, value } = &member.kind else { continue };
            if member.modifiers.is_static {
                continue;
            }
            if fields.iter().any(|f| f.name == name.name) {
                self.duplicate(name);
            }
            let ty = match (ty, value) {
                (Some(ty), _) => self.resolve_type(ty),
                (None, Some(value)) => match literal_type(value) {
                    Some(ty) => ty,
                    None => {
                        self.report(
                            Diagnostic::error(
                                "B0101",
                                name.span,
                                format!("stored property `{}` needs a type", name.name),
                            )
                            .label("its value is not a literal")
                            .help(format!("write `var {}: T = …`", name.name))
                            .spec("49-classes-and-observable-models"),
                        );
                        Ty::Unknown
                    }
                },
                (None, None) => Ty::Unknown,
            };
            let default = match value {
                Some(expr) => FieldDefault::Expr(expr.id),
                // An optional with no value starts `none`, as in Swift.
                None if matches!(ty, Ty::Option(_)) => FieldDefault::Undefined,
                None => FieldDefault::None,
            };
            if !mutable {
                class.constants.push(name.name.clone());
            }
            let sealed = member.visibility == Visibility::Private
                || member.modifiers.setter.is_some_and(|(v, _)| v == Visibility::Private);
            if sealed {
                class.sealed.push(name.name.clone());
            }
            fields.push(FieldDef { name: name.name.clone(), ty, default });
        }
        self.generics.clear();
        self.out.defs[def].kind = DefKind::Struct(fields);
        self.out.defs[def].class = Some(class);
    }

    /// A class's field values, checked against the fields' types.
    pub(super) fn class_defaults(&mut self, c: &ClassDecl) {
        let Some(TypeName::Def(def)) = self.type_names.get(&c.name.name).cloned() else { return };
        self.generics = c.generics.iter().map(|g| g.name.clone()).collect();
        for member in &c.body.members {
            if let TypeMemberKind::Stored { name, value: Some(value), .. } = &member.kind
                && !member.modifiers.is_static
            {
                let ty =
                    self.out.defs[def].fields().iter().find(|f| f.name == name.name).map(|f| f.ty.clone());
                self.expr(value, ty.as_ref());
            }
        }
        self.generics.clear();
        // A field with neither a value nor an `init` to set it.
        let init = crate::extensions::mangle(&c.name.name, "init", true);
        if self.lookup(&init).is_none() {
            for member in &c.body.members {
                if let TypeMemberKind::Stored { name, value: None, .. } = &member.kind
                    && !member.modifiers.is_static
                    && self.out.defs[def]
                        .fields()
                        .iter()
                        .any(|f| f.name == name.name && f.default == FieldDefault::None)
                {
                    self.report(
                        Diagnostic::error(
                            "B0101",
                            name.span,
                            format!("class `{}` has no `init` to set `{}`", c.name.name, name.name),
                        )
                        .label("no value")
                        .help(format!(
                            "give it a value (`= …`), or write `init(…) {{ self.{} = … }}`",
                            name.name
                        ))
                        .spec("49-classes-and-observable-models"),
                    );
                }
            }
        }
    }

    /// A protocol's requirements, typed (`Self` is the conforming type, unknown here).
    pub(super) fn protocol_requirements(&mut self, p: &ProtocolDecl) {
        let Some(TypeName::Def(def)) = self.type_names.get(&p.name.name).cloned() else { return };
        self.type_names.insert("Self".into(), TypeName::Ty(Ty::Unknown));
        let mut requirements = Vec::new();
        for requirement in &p.requirements {
            let (name, ty, method) = match requirement {
                Requirement::Property { name, ty, .. } => (name, self.resolve_type(ty), false),
                Requirement::Func { decl, .. } => (&decl.name, self.fn_signature(decl), true),
            };
            if requirements.iter().any(|r: &RequirementDef| r.name == name.name) {
                self.duplicate(name);
            }
            requirements.push(RequirementDef { name: name.name.clone(), ty, method });
        }
        self.type_names.remove("Self");
        self.out.defs[def].kind = DefKind::Protocol(requirements);
    }

    /// Each declared conformance: a protocol's requirements are met by fields or members,
    /// and the built-in ones hold (`Identifiable` has an `id`, `CaseIterable` cases only).
    pub(super) fn conformances(&mut self, file: &File) {
        // A witness is exported with its type (an extension's own visibility aside).
        let exported: Vec<(&str, bool)> = file
            .items
            .iter()
            .filter(|i| !matches!(i.kind, ItemKind::Extension(_)))
            .map(|i| (i.kind.name().name.as_str(), i.visibility.exported(self.options.modules)))
            .collect();
        for item in &file.items {
            let (name, list) = match &item.kind {
                ItemKind::Struct(StructDecl { name, surface: Some(body), .. }) => (name, &body.conformances),
                ItemKind::Enum(e) => (&e.name, &e.conformances),
                ItemKind::Class(c) => (&c.name, &c.body.conformances),
                ItemKind::Extension(x) => (&x.name, &x.body.conformances),
                _ => continue,
            };
            let Some(TypeName::Def(def)) = self.type_names.get(&name.name).cloned() else { continue };
            for written in list {
                let TypeKind::Named { name: protocol, .. } = &written.kind else { continue };
                let public = exported.iter().find(|(n, _)| *n == name.name).is_some_and(|(_, e)| *e);
                self.conformance(def, protocol, public);
            }
        }
    }

    fn conformance(&mut self, def: DefId, protocol: &Ident, exported: bool) {
        let d = self.out.defs[def].clone();
        let missing = |checker: &mut Self, what: String| {
            checker.report(
                Diagnostic::error(
                    "B0231",
                    protocol.span,
                    format!("`{}` does not conform to `{}`: it has no {what}", d.name, protocol.name),
                )
                .label("a requirement is not met")
                .help(format!(
                    "add it to `{}`, or in `extension {}: {} {{ … }}`",
                    d.name, d.name, protocol.name
                ))
                .spec("48-protocols"),
            );
        };
        match protocol.name.as_str() {
            "Identifiable" => {
                if self.member_of(def, "id").is_none() {
                    missing(self, "`id`".into());
                }
                return;
            }
            "CaseIterable" => {
                if !d.is_fieldless() {
                    self.report(
                        Diagnostic::error(
                            "B0231",
                            protocol.span,
                            format!("`{}` is `CaseIterable` only when no case carries a value", d.name),
                        )
                        .label("a case with a payload")
                        .spec("48-protocols"),
                    );
                }
                return;
            }
            "Equatable" | "Hashable" => {
                if let super::Equality::None(part) =
                    super::equality(&self.out.defs, &Ty::Adt(def, Vec::new()))
                {
                    let shown = self.show(&part);
                    missing(self, format!("`==`: {shown} cannot be compared"));
                }
                return;
            }
            _ => {}
        }
        let Some(TypeName::Def(proto)) = self.type_names.get(&protocol.name).cloned() else { return };
        let DefKind::Protocol(requirements) = self.out.defs[proto].kind.clone() else {
            let shown = self.out.defs[proto].name.clone();
            self.report(
                Diagnostic::error("B0204", protocol.span, format!("`{shown}` is not a protocol"))
                    .label("a type conforms to protocols")
                    .spec("48-protocols"),
            );
            return;
        };
        let mut members = Vec::new();
        for requirement in &requirements {
            match self.member_of(def, &requirement.name) {
                Some(witness) => members.push((requirement.name.clone(), witness)),
                None => {
                    let what = if requirement.method {
                        format!("`func {}`", requirement.name)
                    } else {
                        format!(
                            "`var {}: {}`",
                            requirement.name,
                            self.show(&requirement.ty).trim_matches('`')
                        )
                    };
                    missing(self, what);
                }
            }
        }
        self.out.conformances.push(super::Conformance { def, protocol: proto, members, exported });
    }

    /// How `def` provides the member `name`: a field, or a lowered computed property or method.
    fn member_of(&self, def: DefId, name: &str) -> Option<Witnessed> {
        let d = &self.out.defs[def];
        if d.fields().iter().any(|f| f.name == name) {
            return Some(Witnessed::Field(name.to_string()));
        }
        let func = crate::extensions::mangle(&d.name, name, false);
        self.lookup(&func).map(|_| Witnessed::Fn(func))
    }

    /// Records that `object.name` was read: by the view being checked, or by a member
    /// of an `@Observable` class reading its own `self`.
    pub(super) fn observe(&mut self, object: &Expr, read: Read) {
        let ExprKind::Name(name) = &object.kind else { return };
        let Some(super::NameRes::Local(local)) = self.out.names.get(&object.id).cloned() else { return };
        let ty = self.resolve(&self.out.locals[local].ty.clone());
        let Ty::Adt(def, _) = ty else { return };
        if !self.out.defs[def].class.as_ref().is_some_and(|c| c.observable) {
            return;
        }
        if let Some(view) = self.view {
            self.view_reads.push((view, local, read.clone()));
        }
        if name == "self"
            && let Some(func) = self.member_fn.clone()
        {
            self.member_reads.entry(func).or_default().insert(read);
        }
    }

    /// The fields each view subscribes to, per model it holds: what it reads, and what the
    /// model's members it calls read (transitively). A member of another module reads
    /// every field.
    pub(super) fn observed(&mut self) {
        let reads = std::mem::take(&mut self.view_reads);
        let mut out: HashMap<usize, Vec<(super::LocalId, Vec<String>)>> = HashMap::default();
        for (view, local, read) in reads {
            let Ty::Adt(def, _) = self.resolve(&self.out.locals[local].ty.clone()) else { continue };
            let mut fields = Vec::new();
            let mut seen = HashSet::default();
            self.fields_read(def, &read, &mut seen, &mut fields);
            let entry = out.entry(view).or_default();
            match entry.iter_mut().find(|(l, _)| *l == local) {
                Some((_, existing)) => existing.extend(fields),
                None => entry.push((local, fields)),
            }
        }
        for entries in out.values_mut() {
            for (_, fields) in entries.iter_mut() {
                fields.sort();
                fields.dedup();
            }
        }
        self.out.observed = out;
    }

    fn fields_read(&self, def: DefId, read: &Read, seen: &mut HashSet<String>, out: &mut Vec<String>) {
        match read {
            Read::Field(name) => out.push(name.clone()),
            Read::Member(func) => {
                if !seen.insert(func.clone()) {
                    return;
                }
                match self.member_reads.get(func) {
                    Some(reads) => {
                        for read in reads {
                            self.fields_read(def, read, seen, out);
                        }
                    }
                    None if self
                        .out
                        .locals
                        .iter()
                        .any(|l| l.name == *func && l.kind == super::LocalKind::ModuleFn) => {}
                    None => out.extend(self.out.defs[def].fields().iter().map(|f| f.name.clone())),
                }
            }
        }
    }

    /// The constraints of a function's (or a view's) type parameters that pass a witness.
    pub(super) fn bounds(
        &mut self,
        generics: &[Ident],
        constraints: &[(Ident, TypeExpr)],
    ) -> Vec<(u32, String, Bound)> {
        let mut out = Vec::new();
        for (param, protocol) in constraints {
            let Some(index) = generics.iter().position(|g| g.name == param.name) else {
                self.report(
                    Diagnostic::error(
                        "B0202",
                        param.span,
                        format!("`{}` is not a type parameter here", param.name),
                    )
                    .label("not declared in `<…>`")
                    .spec("46-generics"),
                );
                continue;
            };
            let TypeKind::Named { name, .. } = &protocol.kind else { continue };
            let bound = match name.name.as_str() {
                "Equatable" | "Hashable" | "Comparable" => Bound::Equatable,
                "Codable" | "Decodable" | "Encodable" => Bound::Codable,
                other => match self.type_names.get(other).cloned() {
                    Some(TypeName::Def(def)) if matches!(self.out.defs[def].kind, DefKind::Protocol(_)) => {
                        Bound::Protocol(other.into())
                    }
                    // A built-in protocol with no requirement a body reads (`Sendable`).
                    _ => continue,
                },
            };
            out.push((index as u32, param.name.clone(), bound));
        }
        out
    }

    /// The constraints of a function's (or a view's) type parameters that are shapes: a
    /// struct, a record type or a TS interface (`<T: ProfileGridEntry>`). A shape is
    /// structural, as TS's `T extends ProfileGridEntry` is: its fields are read from the value
    /// itself, and a call passes no witness for it. (A parameter not declared in `<…>` is
    /// reported by [`Self::bounds`].)
    pub(super) fn shapes(&mut self, generics: &[Ident], constraints: &[(Ident, TypeExpr)]) -> Vec<(u32, Ty)> {
        let mut out = Vec::new();
        for (param, bound) in constraints {
            let Some(index) = generics.iter().position(|g| g.name == param.name) else { continue };
            let shape = match &bound.kind {
                TypeKind::Named { name, .. } => match self.type_names.get(&name.name).cloned() {
                    Some(TypeName::Def(def)) if matches!(self.out.defs[def].kind, DefKind::Struct(_)) => true,
                    Some(TypeName::Alias(..) | TypeName::Ty(_)) => true,
                    // A protocol, `Equatable`, `Codable` or a built-in one (`Sendable`).
                    _ => false,
                },
                TypeKind::Record(_) => true,
                _ => false,
            };
            if !shape {
                continue;
            }
            let ty = self.resolve_type(bound);
            match self.resolve(&ty) {
                Ty::Adt(def, _) if matches!(self.out.defs[def].kind, DefKind::Struct(_)) => {
                    out.push((index as u32, ty));
                }
                Ty::Unknown => {}
                other => {
                    let shown = self.show(&other);
                    self.report(
                        Diagnostic::error("B0232", bound.span, format!("{shown} is not a protocol or a shape"))
                            .label("a type parameter is constrained by a protocol, a struct, a record type or a TS interface")
                            .spec("46-generics"),
                    );
                }
            }
        }
        out
    }

    /// The shape a type parameter in scope has (`<T: ProfileGridEntry>`), if it has one.
    pub(super) fn shape_of(&self, ty: &Ty) -> Option<Ty> {
        let Ty::Param(_, name) = ty else { return None };
        self.shapes_in_scope.iter().rev().find(|(n, _)| n == &**name).map(|(_, shape)| shape.clone())
    }

    /// Whether `ty` has the fields of `shape` (each fitting): a call's check of a
    /// shape-bounded type parameter, once its type argument is known.
    pub(super) fn has_shape(&mut self, ty: &Ty, shape: &Ty, span: Span) {
        let ty = self.zonk(ty);
        let actual = match (&ty, self.shape_of(&ty)) {
            (Ty::Unknown | Ty::Var(_) | Ty::Foreign(_), _) => return,
            (Ty::Param(..), Some(inner)) => inner,
            _ => ty.clone(),
        };
        let fits = match (self.resolve(&actual), self.resolve(shape)) {
            (Ty::Adt(d1, x), Ty::Adt(d2, y))
                if matches!(self.out.defs[d1].kind, DefKind::Struct(_))
                    && matches!(self.out.defs[d2].kind, DefKind::Struct(_)) =>
            {
                d1 == d2 || self.fits_record(d1, &x, d2, &y)
            }
            (a, e) => self.coerce(&a, &e),
        };
        if fits {
            return;
        }
        let shown = self.show(&ty);
        let wanted = self.show(shape);
        let missing: Vec<String> = match (self.resolve(&actual), self.resolve(shape)) {
            (Ty::Adt(d1, _), Ty::Adt(d2, _)) => {
                let have = self.out.defs[d1].fields().to_vec();
                self.out.defs[d2]
                    .fields()
                    .iter()
                    .filter(|w| {
                        w.default != FieldDefault::Undefined && !have.iter().any(|h| h.name == w.name)
                    })
                    .map(|w| format!("`{}`", w.name))
                    .collect()
            }
            _ => Vec::new(),
        };
        let help = if missing.is_empty() {
            format!("give it {wanted}'s fields, each of its type")
        } else {
            format!("it lacks {}", missing.join(", "))
        };
        self.report(
            Diagnostic::error("B0232", span, format!("{shown} does not have the shape of {wanted}"))
                .label("a constraint of the view or function called")
                .help(help)
                .spec("46-generics"),
        );
    }

    /// The witness a constraint is met with at a call, once its type argument is known.
    pub(super) fn witness_for(&mut self, ty: &Ty, bound: &Bound, span: Span) -> Option<WitnessArg> {
        let ty = self.zonk(ty);
        let protocol = bound.name();
        let refuse = |checker: &mut Self, ty: &Ty, help: Option<String>| {
            let shown = checker.show(ty);
            checker.report(
                Diagnostic::error("B0232", span, format!("{shown} does not conform to `{protocol}`"))
                    .label("a constraint of the function called")
                    .maybe_help(help)
                    .spec("48-protocols"),
            );
            None
        };
        match (bound, &ty) {
            (_, Ty::Unknown | Ty::Var(_)) => None,
            (_, Ty::Param(_, name)) => {
                if !self.bounds_in_scope.iter().any(|(n, b)| n == &**name && b == bound) {
                    let help = format!("constrain it: `<{name}: {protocol}>`");
                    return refuse(self, &ty, Some(help));
                }
                Some(WitnessArg::Param(witness_param(name, &protocol)))
            }
            (Bound::Equatable, _) => match super::equality(&self.out.defs, &ty) {
                super::Equality::None(_) => refuse(self, &ty, None),
                _ => Some(WitnessArg::Equal(ty)),
            },
            (Bound::Codable, _) => match self.codec(&ty) {
                Some(codec) => Some(WitnessArg::Codec(codec)),
                None => refuse(self, &ty, Some("conform it to `Codable`".into())),
            },
            (Bound::Protocol(name), Ty::Adt(def, _)) => {
                let d = &self.out.defs[*def];
                let declared = self
                    .out
                    .conformances
                    .iter()
                    .any(|c| c.def == *def && self.out.defs[c.protocol].name == **name);
                if !declared && d.origin == Origin::Local {
                    let help = format!("declare it: `extension {}: {name} {{ … }}`", d.name);
                    return refuse(self, &ty, Some(help));
                }
                Some(WitnessArg::Conformance { ty: d.name.clone(), protocol: name.to_string() })
            }
            (Bound::Protocol(_), _) => refuse(self, &ty, None),
        }
    }

    /// `ty`'s codec as TS text: `Post$$self`, `String$$self`, a generic type's
    /// `Page$$codec(Post$$self)` and `Array$$codec(…)` (`None`: it has none in scope).
    fn codec(&self, ty: &Ty) -> Option<String> {
        let named = |owner: &str, args: &[Ty]| -> Option<String> {
            if args.is_empty() {
                let name = crate::extensions::mangle(owner, "self", true);
                return self.lookup(&name).map(|_| name);
            }
            let name = crate::extensions::mangle(owner, "codec", true);
            self.lookup(&name)?;
            let args: Option<Vec<String>> = args.iter().map(|a| self.codec(a)).collect();
            Some(format!("{name}({})", args?.join(", ")))
        };
        match self.resolve(ty) {
            Ty::Param(_, name) => self
                .bounds_in_scope
                .iter()
                .any(|(n, b)| n == &*name && *b == Bound::Codable)
                .then(|| witness_param(&name, "Codable")),
            Ty::Str | Ty::Strings(_) => named("String", &[]),
            Ty::Int => named("Int", &[]),
            Ty::Float => named("Double", &[]),
            Ty::Bool => named("Bool", &[]),
            Ty::List(t) => named("Array", &[*t]),
            Ty::Option(t) => named("Optional", &[*t]),
            Ty::Map(t) => named("Dictionary", &[*t]),
            Ty::Adt(def, args) => named(&self.out.defs[def].name.clone(), &args),
            _ => None,
        }
    }

    /// `T.self` in a function constrained `<T: Codable>`: its codec witness, a `Codec<T>`.
    pub(super) fn codec_param(&mut self, expr: &Expr, param: &str) -> Option<Ty> {
        if !self.bounds_in_scope.iter().any(|(n, b)| n == param && *b == Bound::Codable) {
            return None;
        }
        let index = self.generics.iter().rposition(|g| g == param)?;
        self.out.fields.insert(expr.id, super::FieldRes::Static(witness_param(param, "Codable").into()));
        let t = Ty::Param(index as u32, param.into());
        Some(match self.type_names.get("Codec").cloned() {
            Some(TypeName::Def(def)) => Ty::Adt(def, vec![t]),
            _ => Ty::Foreign(format!("Codec<{param}>").into()),
        })
    }

    /// `x.name` where `x` is a constrained type parameter's value or an `any P`: the
    /// requirement's type, read through the witness (`None`: not a requirement).
    pub(super) fn requirement(&mut self, ty: &Ty, name: &str) -> Option<(Option<String>, RequirementDef)> {
        let (param, protocols): (Option<String>, Vec<DefId>) = match ty {
            Ty::Param(_, param) => (
                Some(param.to_string()),
                self.bounds_in_scope
                    .iter()
                    .filter(|(n, _)| n == &**param)
                    .filter_map(|(_, b)| match b {
                        Bound::Protocol(p) => match self.type_names.get(&**p) {
                            Some(TypeName::Def(def)) => Some(*def),
                            _ => None,
                        },
                        _ => None,
                    })
                    .collect(),
            ),
            Ty::Any(protocol) => (None, vec![*protocol]),
            _ => return None,
        };
        for protocol in protocols {
            if let Some(requirement) = self.out.defs[protocol].requirements().iter().find(|r| r.name == name)
            {
                let witness = param.as_ref().map(|p| witness_param(p, &self.out.defs[protocol].name));
                return Some((witness, requirement.clone()));
            }
        }
        None
    }

    /// Whether `ty` is a type parameter constrained `Equatable`: `==` calls its witness.
    pub(super) fn equatable_param(&self, ty: &Ty) -> Option<String> {
        let Ty::Param(_, name) = ty else { return None };
        self.bounds_in_scope
            .iter()
            .any(|(n, b)| n == &**name && *b == Bound::Equatable)
            .then(|| witness_param(name, "Equatable"))
    }
}

/// A literal's type, for a stored property written without one (`var isLoading = false`).
fn literal_type(value: &Expr) -> Option<Ty> {
    Some(match &value.kind {
        ExprKind::Int(_) => Ty::Int,
        ExprKind::Float(_) => Ty::Float,
        ExprKind::Bool(_) => Ty::Bool,
        ExprKind::Str { parts, .. } if parts.iter().all(|p| matches!(p, StrPart::Text(_))) => Ty::Str,
        ExprKind::Unary(UnaryOp::Neg, inner) => return literal_type(inner),
        _ => return None,
    })
}

/// A simple type's TS text (`number`, `string`, a struct's name), for a TS type Bloom writes.
pub fn ts_text(defs: &[Def], ty: &Ty) -> Option<String> {
    Some(match ty {
        Ty::Int | Ty::Float => "number".into(),
        Ty::Str => "string".into(),
        Ty::Bool => "boolean".into(),
        Ty::Adt(def, args) if args.is_empty() => defs.get(*def)?.name.clone(),
        _ => return None,
    })
}
