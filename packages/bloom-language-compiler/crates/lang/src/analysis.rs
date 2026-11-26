//! What an editor asks of a module ([`crate::analyze`]): every definition and
//! every reference to one, the names in scope at an offset, the members of a
//! receiver and the type expected at an offset.
//!
//! Built after the check from its side tables and one walk of the tree, so a
//! compile pays nothing for it; only the expected types are recorded during
//! the check, and only when analysing.

use rustc_hash::FxHashMap as HashMap;
use std::collections::BTreeSet;
use std::path::{Path, PathBuf};

use crate::Options;
use crate::ast::*;
use crate::check::{AssignRes, CallRes, CheckResult, FieldRes, LocalKind, NameRes, call};
use crate::diagnostic::Diagnostic;
use crate::types::{DefKind, Display, Origin, Ty};

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum DefinitionKind {
    /// A module item: a struct, enum, alias, `fn`, view, constant, or a view's `fn` member.
    Item,
    Param,
    Local,
    /// `@state`, `@list`, `@record`, `@env`.
    State,
    Field,
    Case,
    Import,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum DefinitionOrigin {
    /// Declared in this file.
    Local,
    /// Declared in another `.bloom` module.
    Bloom(PathBuf),
    /// Declared in TS: the file when it is known (an import), and the span there (not read yet).
    Ts(Option<PathBuf>, Option<Span>),
}

#[derive(Debug, Clone)]
pub struct Definition {
    pub name: String,
    pub kind: DefinitionKind,
    /// The name (empty for a definition of another file).
    pub span: Span,
    /// The whole declaration (`let x = …`, the item, the parameter).
    pub full_span: Span,
    /// Its type as Bloom writes it (none for a type itself).
    pub ty: Option<String>,
    pub origin: DefinitionOrigin,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum MemberKind {
    Field,
    Case,
    /// A standard library method (`map`) or property (`count`).
    Method,
    Modifier,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct MemberInfo {
    pub name: String,
    pub kind: MemberKind,
    pub ty: Option<String>,
}

/// A module, analysed.
#[derive(Debug, Clone, Default)]
pub struct Analysis {
    pub definitions: Vec<Definition>,
    /// Each reference's span and the definition (index) it names.
    pub references: Vec<(Span, usize)>,
    pub diagnostics: Vec<Diagnostic>,
    pub warnings: Vec<Diagnostic>,
    pub dependencies: Vec<PathBuf>,
    /// Each local definition's visible range.
    visible: Vec<(usize, Span)>,
    /// Each typed span (expressions, bindings, type expressions) with its type.
    types: Vec<(Span, Ty)>,
    expected: Vec<(Span, String)>,
    /// Members by type: struct fields and enum cases (by the type's definition index).
    defs: Vec<crate::types::Def>,
    type_defs: HashMap<usize, usize>,
    /// A type name's span (`Prefs` in `Prefs.patch`) → its definition.
    type_names: HashMap<Span, usize>,
    /// Where each receiver ends: the source, to look back over the space before a `.`.
    source: String,
}

impl Analysis {
    /// The definition referred to (or declared) at `offset`.
    pub fn definition_at(&self, offset: u32) -> Option<usize> {
        self.references
            .iter()
            .filter(|(span, _)| span.contains(offset))
            .min_by_key(|(span, _)| span.end - span.start)
            .map(|(_, def)| *def)
            .or_else(|| {
                self.definitions
                    .iter()
                    .position(|d| d.origin == DefinitionOrigin::Local && d.span.contains(offset))
            })
    }

    /// The spans that refer to definition `def`, its own name first when it is in this file.
    pub fn references_to(&self, def: usize) -> Vec<Span> {
        let mut out: Vec<Span> = Vec::new();
        if let Some(d) = self.definitions.get(def)
            && d.origin == DefinitionOrigin::Local
        {
            out.push(d.span);
        }
        out.extend(self.references.iter().filter(|(_, d)| *d == def).map(|(s, _)| *s));
        out
    }

    /// The local, parameter, member and module definitions visible at `offset`,
    /// innermost first; a shadowed name appears once.
    pub fn scope_at(&self, offset: u32) -> Vec<usize> {
        let mut visible: Vec<(usize, Span)> = self
            .visible
            .iter()
            .copied()
            .filter(|(_, range)| range.start <= offset && offset <= range.end)
            .collect();
        visible.sort_by_key(|(_, range)| std::cmp::Reverse(range.start));
        let mut seen = BTreeSet::new();
        visible
            .into_iter()
            .filter(|(def, _)| seen.insert(self.definitions[*def].name.clone()))
            .map(|(def, _)| def)
            .collect()
    }

    /// The type of the expression at `offset` (the innermost one), as Bloom writes it.
    pub fn type_at(&self, offset: u32) -> Option<String> {
        self.types
            .iter()
            .filter(|(span, _)| span.contains(offset))
            .min_by_key(|(span, _)| span.end - span.start)
            .map(|(_, ty)| Display { ty, defs: &self.defs }.to_string())
    }

    /// The type expected where the innermost expression at `offset` is.
    pub fn expected_type_at(&self, offset: u32) -> Option<String> {
        self.expected
            .iter()
            .filter(|(span, _)| span.contains(offset) || span.end == offset)
            .min_by_key(|(span, _)| span.end - span.start)
            .map(|(_, ty)| ty.clone())
    }

    /// The members of the receiver that ends at `dot` (the offset of the `.`
    /// after it): fields, cases, standard library members, a node's modifiers.
    pub fn members_at(&self, dot: u32) -> Vec<MemberInfo> {
        // `x\n  .name`: the receiver ends before the line break.
        let before = self.source.get(..dot as usize).unwrap_or_default();
        let dot = before.trim_end().len() as u32;
        if let Some((span, _)) = self.type_names.iter().find(|(span, _)| span.end == dot) {
            return self.members_of_type_name(self.type_names[span]);
        }
        let Some((_, ty)) = self
            .types
            .iter()
            .filter(|(span, _)| span.end == dot)
            .max_by_key(|(span, _)| span.end - span.start)
        else {
            return Vec::new();
        };
        self.members(ty)
    }

    fn show(&self, ty: &Ty) -> String {
        Display { ty, defs: &self.defs }.to_string()
    }

    fn members(&self, ty: &Ty) -> Vec<MemberInfo> {
        let mut out = Vec::new();
        match ty {
            Ty::Adt(def, args) => {
                for field in self.defs[*def].fields() {
                    let ty = crate::types::substitute(&field.ty, args);
                    out.push(MemberInfo {
                        name: field.name.clone(),
                        kind: MemberKind::Field,
                        ty: Some(self.show(&ty)),
                    });
                }
                if matches!(self.defs[*def].kind, DefKind::Struct(_)) {
                    out.push(MemberInfo { name: "with".into(), kind: MemberKind::Method, ty: None });
                }
            }
            Ty::Partial(inner) | Ty::Option(inner) => return self.members(inner),
            Ty::View(kind) => {
                let mut names: BTreeSet<&str> = BTreeSet::new();
                for spec in [kind.and_then(crate::ui::node), crate::ui::node("view")].into_iter().flatten() {
                    names.extend(spec.modifiers.iter().copied());
                }
                names.insert("task");
                names.insert("onChange");
                out.extend(names.into_iter().map(|n| MemberInfo {
                    name: n.into(),
                    kind: MemberKind::Modifier,
                    ty: None,
                }));
            }
            Ty::Str | Ty::Strings(_) | Ty::List(_) | Ty::Map(_) => {
                let props: &[&str] = match ty {
                    Ty::List(_) => &["count", "isEmpty", "first", "last"],
                    Ty::Map(_) => &["count", "isEmpty", "keys", "values", "entries"],
                    _ => &["count", "isEmpty"],
                };
                out.extend(props.iter().map(|n| MemberInfo {
                    name: (*n).into(),
                    kind: MemberKind::Method,
                    ty: None,
                }));
            }
            Ty::Result(..) => out.push(MemberInfo {
                name: "isOk".into(),
                kind: MemberKind::Method,
                ty: Some("Bool".into()),
            }),
            Ty::JsError => {
                for n in ["message", "name"] {
                    out.push(MemberInfo {
                        name: n.into(),
                        kind: MemberKind::Field,
                        ty: Some("String".into()),
                    });
                }
            }
            _ => {}
        }
        out.extend(call::method_names(ty).into_iter().map(|n| MemberInfo {
            name: n.into(),
            kind: MemberKind::Method,
            ty: None,
        }));
        out
    }

    /// `Type.` : an enum's cases, a struct's `patch`.
    fn members_of_type_name(&self, def: usize) -> Vec<MemberInfo> {
        let d = &self.defs[def];
        match &d.kind {
            DefKind::Enum(variants) => variants
                .iter()
                .map(|v| MemberInfo {
                    name: v.name.clone(),
                    kind: MemberKind::Case,
                    ty: Some(d.name.clone()),
                })
                .collect(),
            DefKind::Struct(_) => {
                vec![MemberInfo {
                    name: "patch".into(),
                    kind: MemberKind::Method,
                    ty: Some(format!("Partial<{}>", d.name)),
                }]
            }
        }
    }
}

/// What a reference names, before definitions are numbered.
#[derive(Clone, Copy, PartialEq, Eq, Hash)]
enum Target {
    Local(usize),
    Type(usize),
    Field(usize, usize),
    Case(usize, usize),
}

struct Builder<'a> {
    ck: &'a CheckResult,
    file: &'a File,
    path: &'a Path,
    options: &'a Options,
    out: Analysis,
    ids: HashMap<Target, usize>,
    /// Name span → the whole declaration.
    full: HashMap<Span, Span>,
    /// Scopes: the spans that bound what is declared inside them.
    containers: Vec<Span>,
    /// Import spec local-name spans → the file it comes from.
    imports: HashMap<Span, DefinitionOrigin>,
}

pub fn build(
    file: &File,
    source: &str,
    ck: &CheckResult,
    expected: Vec<(Span, Ty)>,
    path: &Path,
    options: &Options,
) -> Analysis {
    let mut b = Builder {
        ck,
        file,
        path,
        options,
        out: Analysis { defs: ck.defs.clone(), source: source.to_string(), ..Analysis::default() },
        ids: HashMap::default(),
        full: HashMap::default(),
        containers: vec![file.span],
        imports: HashMap::default(),
    };
    b.declarations();
    b.definitions();
    for item in &file.items {
        b.item(item);
    }
    b.out.types = ck.spans.clone();
    b.out.expected =
        expected.iter().map(|(span, ty)| (*span, Display { ty, defs: &ck.defs }.to_string())).collect();
    b.out.references.sort_by_key(|(span, _)| *span);
    b.out.references.dedup();
    b.out
}

impl Builder<'_> {
    /// The whole span of each declared name, the scopes, and where imports come from.
    fn declarations(&mut self) {
        for import in &self.file.imports {
            let ImportKind::Named(specs) = &import.kind else { continue };
            let bloom = import.source.ends_with(".bloom");
            let dir = self.path.parent().unwrap_or(Path::new("."));
            let origin = if bloom {
                DefinitionOrigin::Bloom(dir.join(&import.source))
            } else {
                DefinitionOrigin::Ts(crate::ts::resolve(self.path, &import.source, self.options), None)
            };
            for spec in specs {
                self.imports.insert(spec.local().span, origin.clone());
                self.full.insert(spec.local().span, spec.span);
            }
        }
        for item in &self.file.items {
            self.full.insert(item.kind.name().span, item.span);
            match &item.kind {
                ItemKind::Struct(s) => s.fields.iter().for_each(|f| {
                    self.full.insert(f.name.span, f.span);
                }),
                ItemKind::Enum(e) => e.variants.iter().for_each(|v| {
                    self.full.insert(v.name.span, v.span);
                }),
                ItemKind::Fn(f) => self.fn_decl(f),
                ItemKind::View(v) => {
                    self.containers.push(v.span);
                    for p in v.params.iter().flatten() {
                        self.full.insert(p.name.span, p.span);
                    }
                    for member in &v.members {
                        match member {
                            Member::State(s) => {
                                self.full.insert(s.name.span, s.span);
                            }
                            Member::Let(l) => self.pattern_full(&l.pattern, l.span),
                            Member::Fn(f) => self.fn_decl(f),
                            Member::Effect(_) => {}
                        }
                    }
                }
                ItemKind::Alias(_) | ItemKind::Const(_) => {}
            }
        }
        // Every block, closure, arm and `for` is a scope.
        let mut containers = std::mem::take(&mut self.containers);
        let mut full = std::mem::take(&mut self.full);
        walk_file(self.file, &mut |node| match node {
            Node::Block(span) => containers.push(span),
            Node::Stmt(stmt) => match &stmt.kind {
                StmtKind::For(_) => containers.push(stmt.span),
                StmtKind::Let(l) => pattern_full(&mut full, &l.pattern, stmt.span),
                StmtKind::Var(v) => {
                    full.insert(v.name.span, stmt.span);
                }
                _ => {}
            },
            Node::Expr(expr) => match &expr.kind {
                ExprKind::Closure(c) => containers.push(c.span),
                ExprKind::If(_) => containers.push(expr.span),
                ExprKind::Call(call) => {
                    if let Some(c) = &call.trailing {
                        containers.push(c.span);
                    }
                }
                ExprKind::Match(m) => containers.extend(m.arms.iter().map(|a| a.span)),
                _ => {}
            },
            _ => {}
        });
        self.containers = containers;
        self.full = full;
    }

    fn fn_decl(&mut self, f: &FnDecl) {
        self.full.insert(f.name.span, f.span);
        self.containers.push(f.span);
        for p in &f.params {
            self.full.insert(p.name.span, p.span);
        }
    }

    fn pattern_full(&mut self, pattern: &Pattern, span: Span) {
        pattern_full(&mut self.full, pattern, span);
    }

    fn push(&mut self, target: Target, definition: Definition) -> usize {
        let id = self.out.definitions.len();
        self.out.definitions.push(definition);
        self.ids.insert(target, id);
        id
    }

    /// Locals, then types and their fields and cases.
    fn definitions(&mut self) {
        let ck = self.ck;
        for (index, local) in ck.locals.iter().enumerate() {
            let origin = self.imports.get(&local.span).cloned().unwrap_or(DefinitionOrigin::Local);
            let kind = if origin != DefinitionOrigin::Local {
                DefinitionKind::Import
            } else {
                match local.kind {
                    LocalKind::Param | LocalKind::Prop => DefinitionKind::Param,
                    LocalKind::State => DefinitionKind::State,
                    LocalKind::Hook if self.is_attr_member(local.span) => DefinitionKind::State,
                    LocalKind::ModuleFn | LocalKind::ModuleConst | LocalKind::View | LocalKind::Handler => {
                        DefinitionKind::Item
                    }
                    LocalKind::Import { .. } | LocalKind::Component { .. } => DefinitionKind::Import,
                    _ => DefinitionKind::Local,
                }
            };
            let full_span = self.full.get(&local.span).copied().unwrap_or(local.span);
            let id = self.push(
                Target::Local(index),
                Definition {
                    name: local.name.clone(),
                    kind,
                    span: local.span,
                    full_span,
                    ty: Some(Display { ty: &local.ty, defs: &ck.defs }.to_string()),
                    origin,
                },
            );
            // Module-level names are visible everywhere; others from where they are declared.
            let range = if local.frame == 0 && local.view.is_none() {
                self.file.span
            } else {
                let container = self
                    .containers
                    .iter()
                    .filter(|c| c.start <= local.span.start && local.span.end <= c.end && **c != local.span)
                    .min_by_key(|c| c.end - c.start)
                    .copied()
                    .unwrap_or(self.file.span);
                let start = if kind == DefinitionKind::Param { container.start } else { local.span.start };
                Span::new(start, container.end)
            };
            self.out.visible.push((id, range));
        }
        let spans: HashMap<&str, (&Ident, &Item)> = self
            .file
            .items
            .iter()
            .filter(|i| matches!(i.kind, ItemKind::Struct(_) | ItemKind::Enum(_)))
            .map(|i| (i.kind.name().name.as_str(), (i.kind.name(), i)))
            .collect();
        for (index, def) in ck.defs.iter().enumerate() {
            let origin = match &def.origin {
                Origin::Local => DefinitionOrigin::Local,
                Origin::Bloom { specifier } => {
                    DefinitionOrigin::Bloom(self.path.parent().unwrap_or(Path::new(".")).join(specifier))
                }
                Origin::Ts { .. } | Origin::Record => DefinitionOrigin::Ts(None, None),
            };
            let local = origin == DefinitionOrigin::Local;
            let decl = if local { spans.get(def.name.as_str()) } else { None };
            let (span, full_span) =
                decl.map_or((Span::default(), Span::default()), |(n, i)| (n.span, i.span));
            let id = self.push(
                Target::Type(index),
                Definition {
                    name: def.name.clone(),
                    kind: DefinitionKind::Item,
                    span,
                    full_span,
                    ty: None,
                    origin: origin.clone(),
                },
            );
            self.out.type_defs.insert(index, id);
            let item = decl.map(|(_, item)| &item.kind);
            for (f, field) in def.fields().iter().enumerate() {
                let span = match item {
                    Some(ItemKind::Struct(s)) => s.fields.get(f).map(|d| (d.name.span, d.span)),
                    _ => None,
                }
                .unwrap_or_default();
                self.push(
                    Target::Field(index, f),
                    Definition {
                        name: field.name.clone(),
                        kind: DefinitionKind::Field,
                        span: span.0,
                        full_span: span.1,
                        ty: Some(Display { ty: &field.ty, defs: &ck.defs }.to_string()),
                        origin: origin.clone(),
                    },
                );
            }
            for (v, variant) in def.variants().iter().enumerate() {
                let span = match item {
                    Some(ItemKind::Enum(e)) => e.variants.get(v).map(|d| (d.name.span, d.span)),
                    _ => None,
                }
                .unwrap_or_default();
                self.push(
                    Target::Case(index, v),
                    Definition {
                        name: variant.name.clone(),
                        kind: DefinitionKind::Case,
                        span: span.0,
                        full_span: span.1,
                        ty: Some(def.name.clone()),
                        origin: origin.clone(),
                    },
                );
            }
        }
    }

    /// Whether `span` names an `@list`/`@record`/`@env` member.
    fn is_attr_member(&self, span: Span) -> bool {
        self.file.items.iter().any(|item| match &item.kind {
            ItemKind::View(v) => {
                v.members.iter().any(|m| matches!(m, Member::State(s) if s.name.span == span))
            }
            _ => false,
        })
    }

    fn refer(&mut self, span: Span, target: Target) {
        if let Some(id) = self.ids.get(&target) {
            self.out.references.push((span, *id));
        }
    }

    fn field_target(&self, ty: Option<&Ty>, name: &str) -> Option<Target> {
        let ty = match ty? {
            Ty::Option(inner) | Ty::Partial(inner) => inner.as_ref(),
            other => other,
        };
        let Ty::Adt(def, _) = ty else { return None };
        let index = self.ck.defs[*def].fields().iter().position(|f| f.name == name)?;
        Some(Target::Field(*def, index))
    }

    fn case_target(&self, ty: Option<&Ty>, name: &str) -> Option<Target> {
        let ty = match ty? {
            Ty::Option(inner) => inner.as_ref(),
            other => other,
        };
        let Ty::Adt(def, _) = ty else { return None };
        let index = self.ck.defs[*def].variants().iter().position(|v| v.name == name)?;
        Some(Target::Case(*def, index))
    }

    fn item(&mut self, item: &Item) {
        let mut refs: Vec<(Span, Target)> = Vec::new();
        let mut type_names: Vec<(Span, usize)> = Vec::new();
        let ck = self.ck;
        walk_item(item, &mut |node| match node {
            Node::Expr(expr) => match &expr.kind {
                ExprKind::Name(_) => {
                    if let Some(NameRes::Local(local)) = ck.names.get(&expr.id) {
                        refs.push((expr.span, Target::Local(*local)));
                    }
                }
                ExprKind::Binding(path) => {
                    if let Some((local, fields)) = ck.bindings.get(&expr.id) {
                        refs.push((path[0].span, Target::Local(*local)));
                        let mut ty = Some(ck.locals[*local].ty.clone());
                        for (ident, field) in path[1..].iter().zip(fields) {
                            match self.field_target(ty.as_ref(), field) {
                                Some(Target::Field(def, index)) => {
                                    refs.push((ident.span, Target::Field(def, index)));
                                    ty = Some(ck.defs[def].fields()[index].ty.clone());
                                }
                                _ => break,
                            }
                        }
                    }
                }
                ExprKind::Field(object, name) | ExprKind::OptField(object, name) => {
                    match ck.fields.get(&expr.id) {
                        Some(FieldRes::EnumCase(def, index)) => {
                            refs.push((name.span, Target::Case(*def, *index)));
                            if let ExprKind::Name(_) = object.kind
                                && !ck.names.contains_key(&object.id)
                            {
                                refs.push((object.span, Target::Type(*def)));
                                type_names.push((object.span, *def));
                            }
                        }
                        Some(FieldRes::Field) => {
                            if let Some(target) = self.field_target(ck.types.get(&object.id), &name.name) {
                                refs.push((name.span, target));
                            }
                        }
                        _ => {}
                    }
                }
                ExprKind::ImplicitMember(name) => {
                    if let Some(FieldRes::EnumCase(def, index)) = ck.fields.get(&expr.id) {
                        refs.push((name.span, Target::Case(*def, *index)));
                    }
                }
                ExprKind::Call(call) => {
                    if let ExprKind::Name(_) = &call.callee.kind
                        && let Some(NameRes::Local(local)) = ck.names.get(&call.callee.id)
                    {
                        refs.push((call.callee.span, Target::Local(*local)));
                    }
                    match ck.calls.get(&expr.id) {
                        Some(CallRes::EnumCase(def, index)) => {
                            let (name, object) = match &call.callee.kind {
                                ExprKind::Field(object, name) => (name.span, Some(object)),
                                ExprKind::ImplicitMember(name) => (name.span, None),
                                _ => (call.callee.span, None),
                            };
                            refs.push((name, Target::Case(*def, *index)));
                            if let Some(object) = object
                                && matches!(object.kind, ExprKind::Name(_))
                            {
                                refs.push((object.span, Target::Type(*def)));
                                type_names.push((object.span, *def));
                            }
                        }
                        Some(CallRes::Struct(def) | CallRes::Partial(def) | CallRes::With(def)) => {
                            let def = *def;
                            match &call.callee.kind {
                                ExprKind::Name(_) => refs.push((call.callee.span, Target::Type(def))),
                                ExprKind::Field(object, _)
                                    if matches!(object.kind, ExprKind::Name(_))
                                        && !ck.names.contains_key(&object.id) =>
                                {
                                    refs.push((object.span, Target::Type(def)));
                                    type_names.push((object.span, def));
                                }
                                _ => {}
                            }
                            for arg in &call.args {
                                if let Some(label) = &arg.label
                                    && let Some(index) =
                                        ck.defs[def].fields().iter().position(|f| f.name == label.name)
                                {
                                    refs.push((label.span, Target::Field(def, index)));
                                }
                            }
                        }
                        _ => {}
                    }
                }
                _ => {}
            },
            Node::Stmt(stmt) => {
                if let StmtKind::Assign(a) = &stmt.kind
                    && let Some(AssignRes::State { local, .. } | AssignRes::Var { local, .. }) =
                        ck.assigns.get(&a.span)
                {
                    let mut root = &a.target;
                    while let ExprKind::Field(inner, _) = &root.kind {
                        root = inner;
                    }
                    refs.push((root.span, Target::Local(*local)));
                }
            }
            Node::Pattern(pattern) => match &pattern.kind {
                PatternKind::Case { ty, name, .. } => {
                    if let Some(Target::Case(def, index)) =
                        self.case_target(ck.pattern_tys.get(&pattern.span), &name.name)
                    {
                        refs.push((name.span, Target::Case(def, index)));
                        if let Some(ty) = ty {
                            refs.push((ty.span, Target::Type(def)));
                        }
                    }
                }
                PatternKind::Record(fields) => {
                    for (name, _) in fields {
                        if let Some(target) = self.field_target(ck.pattern_tys.get(&pattern.span), &name.name)
                        {
                            refs.push((name.span, target));
                        }
                    }
                }
                _ => {}
            },
            Node::Type(te) => {
                if let TypeKind::Named { name, .. } = &te.kind
                    && let Some(Ty::Adt(def, _)) = ck.type_exprs.get(&te.span).map(strip)
                {
                    refs.push((name.span, Target::Type(def)));
                }
            }
            Node::Block(_) => {}
        });
        for (span, target) in refs {
            self.refer(span, target);
        }
        for (span, def) in type_names {
            self.out.type_names.insert(span, def);
        }
    }
}

/// The struct or enum a written type names (`Partial<Prefs>` names `Prefs`).
fn strip(ty: &Ty) -> Ty {
    match ty {
        Ty::Partial(inner) | Ty::Option(inner) | Ty::List(inner) => strip(inner),
        other => other.clone(),
    }
}

fn pattern_full(full: &mut HashMap<Span, Span>, pattern: &Pattern, span: Span) {
    walk_pattern(pattern, &mut |node| {
        if let Node::Pattern(p) = node {
            match &p.kind {
                PatternKind::Bind(name) => {
                    full.insert(name.span, span);
                }
                PatternKind::Record(fields) => {
                    for (name, sub) in fields {
                        if sub.is_none() {
                            full.insert(name.span, span);
                        }
                    }
                }
                _ => {}
            }
        }
    });
}

// ---- a walk over every node ---------------------------------------------------

pub enum Node<'a> {
    Expr(&'a Expr),
    Stmt(&'a Stmt),
    Pattern(&'a Pattern),
    Type(&'a TypeExpr),
    Block(Span),
}

pub fn walk_file<'a>(file: &'a File, f: &mut dyn FnMut(Node<'a>)) {
    for item in &file.items {
        walk_item(item, f);
    }
}

pub fn walk_item<'a>(item: &'a Item, f: &mut dyn FnMut(Node<'a>)) {
    match &item.kind {
        ItemKind::Struct(s) => {
            for field in &s.fields {
                walk_type(&field.ty, f);
                if let Some(d) = &field.default {
                    walk_expr(d, f);
                }
            }
        }
        ItemKind::Enum(e) => e.variants.iter().flat_map(|v| &v.payload).for_each(|p| walk_type(&p.ty, f)),
        ItemKind::Alias(a) => walk_type(&a.ty, f),
        ItemKind::Fn(func) => walk_fn(func, f),
        ItemKind::View(v) => {
            for p in v.params.iter().flatten() {
                walk_param(p, f);
            }
            for member in &v.members {
                match member {
                    Member::State(s) => {
                        if let Some(t) = &s.ty {
                            walk_type(t, f);
                        }
                        walk_expr(&s.value, f);
                    }
                    Member::Let(l) => walk_let(l, f),
                    Member::Fn(func) => walk_fn(func, f),
                    Member::Effect(e) => {
                        if let Some(id) = &e.id {
                            walk_expr(id, f);
                        }
                        walk_block(&e.body, f);
                    }
                }
            }
            walk_block(&v.body, f);
        }
        ItemKind::Const(c) => {
            if let Some(t) = &c.ty {
                walk_type(t, f);
            }
            walk_expr(&c.value, f);
        }
    }
}

fn walk_param<'a>(p: &'a Param, f: &mut dyn FnMut(Node<'a>)) {
    walk_type(&p.ty, f);
    if let Some(d) = &p.default {
        walk_expr(d, f);
    }
}

fn walk_fn<'a>(func: &'a FnDecl, f: &mut dyn FnMut(Node<'a>)) {
    for p in &func.params {
        walk_param(p, f);
    }
    if let Some(r) = &func.ret {
        walk_type(r, f);
    }
    walk_block(&func.body, f);
}

fn walk_let<'a>(l: &'a LetStmt, f: &mut dyn FnMut(Node<'a>)) {
    walk_pattern(&l.pattern, f);
    if let Some(t) = &l.ty {
        walk_type(t, f);
    }
    walk_expr(&l.value, f);
}

fn walk_block<'a>(b: &'a Block, f: &mut dyn FnMut(Node<'a>)) {
    f(Node::Block(b.span));
    b.stmts.iter().for_each(|s| walk_stmt(s, f));
}

pub fn walk_stmt<'a>(stmt: &'a Stmt, f: &mut dyn FnMut(Node<'a>)) {
    f(Node::Stmt(stmt));
    match &stmt.kind {
        StmtKind::Let(l) => walk_let(l, f),
        StmtKind::Var(v) => {
            if let Some(t) = &v.ty {
                walk_type(t, f);
            }
            walk_expr(&v.value, f);
        }
        StmtKind::Assign(a) => {
            walk_expr(&a.target, f);
            walk_expr(&a.value, f);
        }
        StmtKind::Return(value) => {
            if let Some(v) = value {
                walk_expr(v, f);
            }
        }
        StmtKind::Defer(b) => walk_block(b, f),
        StmtKind::While(w) => {
            walk_expr(&w.cond, f);
            walk_block(&w.body, f);
        }
        StmtKind::For(fs) => {
            walk_pattern(&fs.pattern, f);
            walk_expr(&fs.iter, f);
            walk_block(&fs.body, f);
        }
        StmtKind::Expr(e) => walk_expr(e, f),
    }
}

pub fn walk_pattern<'a>(p: &'a Pattern, f: &mut dyn FnMut(Node<'a>)) {
    f(Node::Pattern(p));
    match &p.kind {
        PatternKind::Literal(e) => walk_expr(e, f),
        PatternKind::Case { args, .. } => args.iter().flatten().for_each(|a| walk_pattern(a, f)),
        PatternKind::Tuple(items) | PatternKind::Or(items) => items.iter().for_each(|a| walk_pattern(a, f)),
        PatternKind::Record(fields) => {
            fields.iter().filter_map(|(_, p)| p.as_ref()).for_each(|a| walk_pattern(a, f))
        }
        PatternKind::Wildcard | PatternKind::Bind(_) | PatternKind::None => {}
    }
}

pub fn walk_type<'a>(t: &'a TypeExpr, f: &mut dyn FnMut(Node<'a>)) {
    f(Node::Type(t));
    match &t.kind {
        TypeKind::Named { args, .. } => args.iter().for_each(|a| walk_type(a, f)),
        TypeKind::List(a) | TypeKind::Optional(a) => walk_type(a, f),
        TypeKind::Map(k, v) => {
            walk_type(k, f);
            walk_type(v, f);
        }
        TypeKind::Tuple(items) => items.iter().for_each(|a| walk_type(a, f)),
        TypeKind::Record(fields) => fields.iter().for_each(|(_, t)| walk_type(t, f)),
        TypeKind::Strings(_) => {}
        TypeKind::Fn { params, ret, .. } => {
            params.iter().for_each(|a| walk_type(a, f));
            walk_type(ret, f);
        }
        TypeKind::Error => {}
    }
}

fn walk_closure<'a>(c: &'a Closure, f: &mut dyn FnMut(Node<'a>)) {
    for p in &c.params {
        if let Some(t) = &p.ty {
            walk_type(t, f);
        }
    }
    c.body.iter().for_each(|s| walk_stmt(s, f));
}

pub fn walk_expr<'a>(e: &'a Expr, f: &mut dyn FnMut(Node<'a>)) {
    f(Node::Expr(e));
    match &e.kind {
        ExprKind::Str { parts, .. } => parts.iter().for_each(|p| {
            if let StrPart::Interp(inner) = p {
                walk_expr(inner, f);
            }
        }),
        ExprKind::TypeApply { args, .. } => args.iter().for_each(|a| walk_type(a, f)),
        ExprKind::Paren(a)
        | ExprKind::Unary(_, a)
        | ExprKind::Await(a)
        | ExprKind::Try(a)
        | ExprKind::Field(a, _)
        | ExprKind::OptField(a, _) => walk_expr(a, f),
        ExprKind::Tuple(items) | ExprKind::List(items) => items.iter().for_each(|a| walk_expr(a, f)),
        ExprKind::Record(entries) => entries.iter().for_each(|e| walk_expr(e.value(), f)),
        ExprKind::Map(entries) => entries.iter().for_each(|(k, v)| {
            walk_expr(k, f);
            walk_expr(v, f);
        }),
        ExprKind::Binary(_, a, b) | ExprKind::Index(a, b) => {
            walk_expr(a, f);
            walk_expr(b, f);
        }
        ExprKind::Ternary(a, b, c) => {
            walk_expr(a, f);
            walk_expr(b, f);
            walk_expr(c, f);
        }
        ExprKind::Call(call) => {
            walk_expr(&call.callee, f);
            call.args.iter().for_each(|a| walk_expr(&a.value, f));
            if let Some(t) = &call.trailing {
                walk_closure(t, f);
            }
        }
        ExprKind::Closure(c) => walk_closure(c, f),
        ExprKind::If(i) => walk_if(i, f),
        ExprKind::Match(m) => {
            walk_expr(&m.scrutinee, f);
            for arm in &m.arms {
                walk_pattern(&arm.pattern, f);
                if let Some(g) = &arm.guard {
                    walk_expr(g, f);
                }
                match &arm.body {
                    ArmBody::Expr(b) => walk_expr(b, f),
                    ArmBody::Block(b) => walk_block(b, f),
                }
            }
        }
        ExprKind::Task(b) => walk_block(b, f),
        _ => {}
    }
}

fn walk_if<'a>(i: &'a IfExpr, f: &mut dyn FnMut(Node<'a>)) {
    match &i.cond {
        Cond::Expr(e) => walk_expr(e, f),
        Cond::Let(p, e) => {
            walk_pattern(p, f);
            walk_expr(e, f);
        }
    }
    walk_block(&i.then, f);
    match i.otherwise.as_deref() {
        Some(Else::If(e)) => walk_expr(e, f),
        Some(Else::Block(b)) => walk_block(b, f),
        None => {}
    }
}
