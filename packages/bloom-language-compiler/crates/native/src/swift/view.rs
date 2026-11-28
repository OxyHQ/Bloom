//! Views: `struct X: View` as SwiftUI's, its builders, and node chains.

use std::fmt::Write as _;

use bloom_lang::ast::*;

use super::nodes;
use super::{Emitter, Mode, kw, label, pad};

/// A view expression unwound: the call at its base, and the modifiers on it in source
/// order (innermost first).
pub(crate) struct Chain<'e> {
    pub base: &'e Expr,
    pub mods: Vec<(&'e Ident, &'e Call, Span)>,
}

pub(crate) fn unwind(expr: &Expr) -> Chain<'_> {
    let mut mods = Vec::new();
    let mut at = expr;
    while let ExprKind::Call(call) = &at.kind
        && let ExprKind::Field(inner, name) = &call.callee.kind
        && !matches!(inner.kind, ExprKind::Name(ref n) if n.chars().next().is_some_and(char::is_uppercase) && !matches!(inner.kind, ExprKind::Call(_)))
    {
        mods.push((name, call, at.span));
        at = inner;
    }
    mods.reverse();
    Chain { base: at, mods }
}

/// The constructor a chain's base calls (`VStack` of `VStack(spacing: .lg) { … }`).
fn constructor(base: &Expr) -> Option<&str> {
    match &base.kind {
        ExprKind::Call(c) => match &c.callee.kind {
            ExprKind::Name(n) => Some(n.as_str()),
            _ => None,
        },
        ExprKind::Name(n) => Some(n.as_str()),
        _ => None,
    }
}

impl Emitter<'_> {
    pub(crate) fn view_decl(&mut self, vis: &str, v: &ViewDecl) -> String {
        match v.surface.as_deref() {
            Some(surface) => self.struct_view(vis, v, surface),
            None => self.classic_view(vis, v),
        }
    }

    /// `struct PostRow: View { … }`: its members as written, with an `init` of its props.
    fn struct_view(&mut self, vis: &str, v: &ViewDecl, surface: &TypeBody) -> String {
        let conforms = self.conformances(&surface.conformances);
        let mut out = String::new();
        // `let content: View`: children, a type parameter of the view (`Content: View`) its
        // `init` takes as a `@ViewBuilder` closure.
        let mut children: Vec<(String, String, bool)> = Vec::new();
        let mut builders: Vec<(String, String, String)> = Vec::new();
        let saved = self.enter_type(&v.name.name, vis == "public ", &conforms);
        let was_in_view = std::mem::replace(&mut self.in_view, true);
        let mut props: Vec<Param> = Vec::new();
        let has_init = surface
            .members
            .iter()
            .any(|m| matches!(&m.kind, TypeMemberKind::Func(f) if f.name.name == "init"));
        for m in &surface.members {
            let mvis = Self::visibility(m.visibility);
            let attr = m.modifiers.attrs.first();
            match &m.kind {
                TypeMemberKind::Stored { mutable, name, ty, value } => {
                    let ty_text = ty.as_ref().map(|t| self.ty(t));
                    let annotated = ty_text.as_ref().map(|t| format!(": {t}")).unwrap_or_default();
                    match attr.map(|a| a.name.name.as_str()) {
                        Some("State") => {
                            let value = value.as_ref().map(|v| self.expr_value(v, 1)).unwrap_or_default();
                            let _ =
                                writeln!(out, "  @State {mvis}var {}{annotated} = {value}", kw(&name.name));
                        }
                        Some("Binding") => {
                            let _ = writeln!(out, "  @Binding {mvis}var {}{annotated}", kw(&name.name));
                            if let Some(t) = ty {
                                props.push(prop(name, binding_of(t), None, true));
                            }
                        }
                        Some(attr_name @ ("Environment" | "Query")) => {
                            let a = attr.expect("an attribute");
                            // Bloom's built-in environment values are BloomUI's (`\.disabled` is
                            // `\.bloomDisabled`: SwiftUI's own `controlSize` is another type).
                            let mut a = a.clone();
                            for arg in &mut a.args {
                                if let ExprKind::KeyPath { root: None, path } = &mut arg.value.kind
                                    && let [only] = path.as_mut_slice()
                                    && matches!(
                                        only.name.as_str(),
                                        "disabled" | "controlSize" | "buttonStyle"
                                    )
                                {
                                    only.name = format!("bloom{}", crate::upper_first(&only.name));
                                }
                            }
                            let a = &a;
                            let args = self.args(&Call {
                                callee: Box::new(Expr { id: ExprId(0), kind: ExprKind::Unit, span: a.span }),
                                args: a.args.clone(),
                                parens: true,
                                trailing: None,
                                optional: false,
                            });
                            let _ = writeln!(
                                out,
                                "  @{attr_name}({args}) {mvis}var {}{annotated}",
                                kw(&name.name)
                            );
                        }
                        Some(other) => {
                            self.unsupported(a_span(attr), format!("`@{other}` on a view's property"));
                        }
                        // `let x = v`: computed each render, so a computed property.
                        None if !*mutable && value.is_some() => {
                            let value = self.expr_value(value.as_ref().expect("a value"), 2);
                            let rt =
                                ty_text.or_else(|| self.type_at(name.span).map(|t| self.swift_type_text(t)));
                            match rt {
                                Some(rt) => {
                                    let _ =
                                        writeln!(out, "  {mvis}var {}: {rt} {{ {value} }}", kw(&name.name));
                                }
                                None => {
                                    self.unsupported(name.span, "a view's `let` whose type is unknown");
                                }
                            }
                        }
                        // Children: a view-typed prop.
                        None if ty.as_ref().and_then(view_prop).is_some() => {
                            let optional = ty.as_ref().and_then(view_prop).unwrap_or(false);
                            let mut param = crate::upper_first(&name.name);
                            if param == v.name.name {
                                param.push_str("Content");
                            }
                            let q = if optional { "?" } else { "" };
                            let _ = writeln!(out, "  {mvis}let {}: {param}{q}", kw(&name.name));
                            children.push((name.name.clone(), param, optional));
                        }
                        // `let rows: (Post) -> View`: a view builder the view calls, generic too.
                        None if matches!(ty.as_ref().map(|t| &t.kind), Some(TypeKind::Fn { ret, .. }) if view_prop(ret) == Some(false)) =>
                        {
                            let Some(TypeKind::Fn { params, is_async, .. }) = ty.as_ref().map(|t| &t.kind)
                            else {
                                unreachable!()
                            };
                            let mut param = crate::upper_first(&name.name);
                            if param == v.name.name {
                                param.push_str("Content");
                            }
                            let args: Vec<String> = params.iter().map(|p| self.ty(p)).collect();
                            let a = if *is_async { " async" } else { "" };
                            let fn_ty = format!("({}){a} -> {param}", args.join(", "));
                            let _ = writeln!(out, "  {mvis}let {}: {fn_ty}", kw(&name.name));
                            builders.push((name.name.clone(), param, fn_ty));
                        }
                        // A prop.
                        None => {
                            let word = if *mutable { "var" } else { "let" };
                            let _ = writeln!(out, "  {mvis}{word} {}{annotated}", kw(&name.name));
                            if let Some(t) = ty {
                                props.push(prop(name, t.clone(), value.clone(), false));
                            }
                        }
                    }
                }
                TypeMemberKind::Computed { name, body, .. } if name.name == "body" => {
                    let mvis = self.member_visibility(m.visibility, "body");
                    let drawn = self.view_block(&body.stmts, 2);
                    let builder = if body.stmts.len() > 1 { "@ViewBuilder " } else { "" };
                    let _ = write!(out, "\n  {builder}{mvis}var body: some View {{\n{drawn}  }}\n");
                }
                _ => out.push_str(&self.type_member(m, 1, false)),
            }
        }
        if !has_init && (!props.is_empty() || !vis.is_empty() || !children.is_empty() || !builders.is_empty())
        {
            self.view_builders = builders.clone();
            out.push_str(&self.view_init(vis, &props, &children, None));
            for (i, (_, param, optional)) in children.iter().enumerate() {
                if *optional {
                    out.push_str(&self.view_init(vis, &props, &children, Some((i, param))));
                }
            }
        }
        out.push_str("}\n");
        self.witness_names = saved;
        self.in_view = was_in_view;
        let mut generics = self.generics(&v.generics, &v.constraints);
        self.view_builders.clear();
        if !children.is_empty() || !builders.is_empty() {
            let own: Vec<String> = children
                .iter()
                .map(|(_, p, _)| format!("{p}: View"))
                .chain(builders.iter().map(|(_, p, _)| format!("{p}: View")))
                .collect();
            generics = if generics.is_empty() {
                format!("<{}>", own.join(", "))
            } else {
                format!("{}, {}>", generics.trim_end_matches('>'), own.join(", "))
            };
        }
        format!("{vis}struct {}{generics}: {} {{\n{out}", kw(&v.name.name), conforms.join(", "))
    }

    /// The view's `init`: each prop labelled by its name, a `@Binding`'s through `_name`, its
    /// children last as `@ViewBuilder` closures. `without`: the `init` that leaves out the
    /// optional children `i` (`where Children == EmptyView`).
    fn view_init(
        &mut self,
        vis: &str,
        props: &[Param],
        children: &[(String, String, bool)],
        without: Option<(usize, &String)>,
    ) -> String {
        let vis = if vis == "public " && props.iter().any(|p| self.names_internal(&p.ty)) { "" } else { vis };
        let mut params: Vec<String> = props
            .iter()
            .map(|p| {
                let ty = self.param_type(&p.ty);
                let default =
                    p.default.as_ref().map(|d| format!(" = {}", self.expr_value(d, 2))).unwrap_or_default();
                format!("{}: {ty}{default}", kw(&p.name.name))
            })
            .collect();
        for (i, (name, param, _)) in children.iter().enumerate() {
            if without.is_some_and(|(w, _)| w == i) {
                continue;
            }
            params.push(format!("@ViewBuilder {}: () -> {param}", kw(name)));
        }
        for (name, _, fn_ty) in self.view_builders.clone() {
            params.push(format!("@ViewBuilder {}: @escaping {fn_ty}", kw(&name)));
        }
        let clause = without.map(|(_, p)| format!(" where {p} == EmptyView")).unwrap_or_default();
        let mut out = format!("\n  {vis}init({}){clause} {{\n", params.join(", "));
        for (name, _, _) in self.view_builders.clone() {
            let _ = writeln!(out, "    self.{n} = {n}", n = kw(&name));
        }
        for (i, (name, _, _)) in children.iter().enumerate() {
            let n = kw(name);
            if without.is_some_and(|(w, _)| w == i) {
                let _ = writeln!(out, "    self.{n} = nil");
            } else {
                let _ = writeln!(out, "    self.{n} = {n}()");
            }
        }
        for p in props {
            let n = kw(&p.name.name);
            if p.rest {
                let _ = writeln!(out, "    self._{} = {n}", p.name.name);
            } else {
                let _ = writeln!(out, "    self.{n} = {n}");
            }
        }
        out.push_str("  }\n");
        out
    }

    /// A 0.x `view X(props) { @state …; body }`: a struct of its props, its states, and
    /// its effects on the body.
    fn classic_view(&mut self, vis: &str, v: &ViewDecl) -> String {
        let generics = self.generics(&v.generics, &v.constraints);
        let mut out = format!("{vis}struct {}{generics}: View {{\n", kw(&v.name.name));
        let props: Vec<Param> = v.params.clone().unwrap_or_default();
        for p in &props {
            let ty = self.ty(&p.ty);
            let _ = writeln!(out, "  let {}: {ty}", kw(&p.name.name));
        }
        let mut effects = Vec::new();
        for m in &v.members {
            match m {
                Member::State(s) if s.attr == StateAttr::State => {
                    let ty = s.ty.as_ref().map(|t| format!(": {}", self.ty(t))).unwrap_or_default();
                    let value = self.expr_value(&s.value, 1);
                    let _ = writeln!(out, "  @State private var {}{ty} = {value}", kw(&s.name.name));
                }
                Member::State(s) => {
                    self.unsupported(s.span, format!("`@{}`", s.attr.word()));
                }
                Member::Let(l) => {
                    if let PatternKind::Bind(n) = &l.pattern.kind {
                        let rt =
                            l.ty.as_ref()
                                .map(|t| self.ty(t))
                                .or_else(|| self.type_at(n.span).map(|t| self.swift_type_text(t)));
                        let value = self.expr_value(&l.value, 2);
                        match rt {
                            Some(rt) => {
                                let _ = writeln!(out, "  private var {}: {rt} {{ {value} }}", kw(&n.name));
                            }
                            None => {
                                self.unsupported(l.span, "a view's `let` whose type is unknown");
                            }
                        }
                    } else {
                        self.unsupported(l.span, "a destructuring `let` in a view");
                    }
                }
                Member::Fn(f) => out.push_str(&format!("\n{}", self.func("", f, false, 1, None))),
                Member::Effect(e) => effects.push(e.clone()),
                Member::Equal(e) => {
                    let body = self.block(&e.body.stmts, 2, Mode::Value);
                    let _ = write!(
                        out,
                        "\n  static func == ({}: Self, {}: Self) -> Bool {{\n{body}  }}\n",
                        kw(&e.old.name),
                        kw(&e.new.name)
                    );
                }
            }
        }
        let drawn = self.view_block(&v.body.stmts, 3);
        let mut body = format!("    Group {{\n{drawn}    }}");
        for e in &effects {
            let inner = self.block(&e.body.stmts, 3, Mode::Unit);
            match &e.id {
                Some(id) if !matches!(id.kind, ExprKind::Unit) => {
                    let _ = write!(body, "\n    .task(id: {}) {{\n{inner}    }}", self.expr(id));
                }
                _ => {
                    let _ = write!(body, "\n    .task {{\n{inner}    }}");
                }
            }
        }
        let _ = write!(out, "\n  var body: some View {{\n{body}\n  }}\n");
        if !props.is_empty() || !vis.is_empty() {
            out.push_str(&self.view_init(vis, &props, &[], None));
        }
        out.push_str("}\n");
        out
    }

    /// A view builder's statements, drawn.
    pub(crate) fn view_block(&mut self, stmts: &[Stmt], indent: usize) -> String {
        let mut out = String::new();
        for stmt in stmts {
            match &stmt.kind {
                StmtKind::Expr(e) => out.push_str(&self.view_stmt(e, indent)),
                StmtKind::For(f) => out.push_str(&self.for_each(f, indent)),
                _ => out.push_str(&self.stmt(stmt, indent, Mode::Unit)),
            }
        }
        if out.trim().is_empty() {
            out = format!("{}EmptyView()\n", pad(indent));
        }
        out
    }

    /// `for x in xs { … }` in a builder: a `ForEach` keyed by position, as the TypeScript
    /// backend keys it.
    fn for_each(&mut self, f: &ForStmt, indent: usize) -> String {
        let p = pad(indent);
        let iter = self.postfix_base(&f.iter);
        let name = match &f.pattern.kind {
            PatternKind::Bind(n) => kw(&n.name),
            PatternKind::Wildcard => "_".into(),
            _ => self.unsupported(f.pattern.span, "this pattern in a builder's `for`"),
        };
        let body = self.view_block(&f.body.stmts, indent + 1);
        format!("{p}ForEach(Array({iter}.enumerated()), id: \\.offset) {{ _, {name} in\n{body}{p}}}\n")
    }

    pub(crate) fn view_stmt(&mut self, e: &Expr, indent: usize) -> String {
        let saved = std::mem::replace(&mut self.indent, indent);
        let text = self.view_stmt_at(e, indent);
        self.indent = saved;
        text
    }

    fn view_stmt_at(&mut self, e: &Expr, indent: usize) -> String {
        let p = pad(indent);
        match &e.kind {
            ExprKind::None => format!("{p}EmptyView()\n"),
            ExprKind::If(i) => self.if_stmt(i, indent, Mode::View),
            ExprKind::Match(m) => self.switch_stmt(m, indent, Mode::View),
            ExprKind::Paren(inner) => self.view_stmt(inner, indent),
            _ => format!("{p}{}\n", self.view_expr(e, indent)),
        }
    }

    /// A view expression: its base, then its own modifiers (the node's methods), then the
    /// universal ones, each group in source order. A builder closure is drawn as a builder.
    pub(crate) fn view_expr(&mut self, e: &Expr, indent: usize) -> String {
        let chain = unwind(e);
        let ctor = constructor(chain.base).map(str::to_string);
        let base = self.view_base(chain.base, ctor.as_deref(), indent);
        let (mut own, mut rest) = (Vec::new(), Vec::new());
        for (name, call, span) in &chain.mods {
            let is_own = ctor.as_deref().is_some_and(|c| nodes::is_own(c, &name.name));
            let text = self.modifier(name, call, *span, indent, is_own);
            if is_own { own.push(text) } else { rest.push(text) }
        }
        let mut out = base;
        for m in own.into_iter().chain(rest) {
            out.push_str(&m);
        }
        out
    }

    fn modifier(&mut self, name: &Ident, call: &Call, span: Span, indent: usize, own: bool) -> String {
        let args: Vec<String> = call
            .args
            .iter()
            .map(|a| {
                let value = self.view_arg(&a.value, indent);
                match &a.label {
                    Some(l) => format!("{}: {value}", label(&l.name)),
                    None => value,
                }
            })
            .collect();
        let trailing = match call.trailing.as_deref() {
            Some(c)
                if matches!(
                    name.name.as_str(),
                    "overlay"
                        | "background"
                        | "trailing"
                        | "leadingView"
                        | "safeAreaInset"
                        | "toolbar"
                        | "sheet"
                        | "contextMenu"
                ) =>
            {
                format!(" {}", self.view_closure(c, indent))
            }
            Some(c) => format!(" {}", self.closure(c, c.span.to(span), indent)),
            None => String::new(),
        };
        let parens = if args.is_empty() && call.trailing.is_some() && !call.parens {
            String::new()
        } else {
            format!("({})", args.join(", "))
        };
        format!("\n{}.{}{parens}{trailing}", pad(indent), swift_modifier(&name.name, own))
    }

    /// An argument that may be a view (`.trailing(Toggle(…).label(t))`): drawn as one.
    fn view_arg(&mut self, e: &Expr, indent: usize) -> String {
        let chain = unwind(e);
        match constructor(chain.base) {
            Some(c) if nodes::is_node(c) || self.decls.views.contains_key(c) => self.view_expr(e, indent + 1),
            _ => match &e.kind {
                ExprKind::Closure(c) => self.closure(c, e.span, indent + 1),
                _ => self.expr(e),
            },
        }
    }

    fn view_base(&mut self, base: &Expr, ctor: Option<&str>, indent: usize) -> String {
        let ExprKind::Call(call) = &base.kind else { return self.expr(base) };
        let Some(name) = ctor else { return self.expr(base) };
        let builder = match name {
            // `Button("Open") { … }` is an action; `Button { Icon(…) }` draws its children.
            "Button" => call.args.iter().all(|a| a.label.as_ref().is_some_and(|l| l.name == "action")),
            other => nodes::takes_children(other) || self.view_has_children(other),
        };
        let args: Vec<String> = call
            .args
            .iter()
            .map(|a| {
                let value = match &a.value.kind {
                    // `VirtualList(posts, { row in PostRow(…) })`: a row builder.
                    ExprKind::Closure(c)
                        if matches!(name, "VirtualList" | "List" | "ForEach" | "NavigationStack") =>
                    {
                        self.view_closure(c, indent)
                    }
                    _ => self.view_arg(&a.value, indent),
                };
                match &a.label {
                    Some(l) => format!("{}: {value}", label(&l.name)),
                    None => value,
                }
            })
            .collect();
        let callee = self.expr(&call.callee);
        let trailing = match call.trailing.as_deref() {
            Some(c) if builder => format!(" {}", self.view_closure(c, indent)),
            Some(c) => format!(" {}", self.closure(c, c.span, indent)),
            None => String::new(),
        };
        if args.is_empty() && call.trailing.is_some() && !call.parens {
            format!("{callee}{trailing}")
        } else {
            format!("{callee}({}){trailing}", args.join(", "))
        }
    }

    /// Whether a view of the program takes children (a `content` prop of a builder type).
    fn view_has_children(&self, name: &str) -> bool {
        self.decls
            .views
            .get(name)
            .is_some_and(|props| props.iter().any(|p| p.name == "content" || p.name == "children"))
            || self.takes_view_children(name)
    }

    /// `{ route in switch route { … } }`: a closure that draws.
    pub(crate) fn view_closure(&mut self, c: &Closure, indent: usize) -> String {
        let params: Vec<String> = c.params.iter().map(|q| kw(&q.name.name)).collect();
        let shorthand = !c.has_in && c.params.iter().all(|q| q.name.name.starts_with('$'));
        let head =
            if params.is_empty() || shorthand { String::new() } else { format!(" {} in", params.join(", ")) };
        let body = self.view_block(&c.body, indent + 1);
        format!("{{{head}\n{body}{}}}", pad(indent))
    }
}

/// A modifier's Swift name: SwiftUI's for an effect, `bloom<Name>` for a universal modifier
/// (kept out of SwiftUI's overloads of `padding`, `frame`, `font`…), whether or not the node
/// gives it its own meaning (then it is the node's method of that name: `GroupedSection`'s
/// `bloomTitle`), and the spec's name for a node's own modifier (its method in BloomUI).
fn swift_modifier(name: &str, own: bool) -> String {
    if nodes::is_effect(name) {
        return name.to_string();
    }
    let spec = nodes::spec_name(name);
    let _ = own;
    if nodes::is_universal(name) { format!("bloom{}", crate::upper_first(spec)) } else { kw(spec) }
}

/// Whether a prop's type is a view (`View`), and whether it is optional (`View?`).
fn view_prop(t: &TypeExpr) -> Option<bool> {
    match &t.kind {
        TypeKind::Named { name, args } if name.name == "View" && args.is_empty() => Some(false),
        TypeKind::Optional(inner) => view_prop(inner).filter(|o| !o).map(|_| true),
        _ => None,
    }
}

fn a_span(attr: Option<&Attr>) -> Span {
    attr.map(|a| a.span).unwrap_or_default()
}

/// A view's prop as its `init` takes it (`rest` marks a `@Binding`, set through `_name`).
fn prop(name: &Ident, ty: TypeExpr, default: Option<Expr>, binding: bool) -> Param {
    Param {
        label: None,
        name: name.clone(),
        rest: binding,
        spread: false,
        whole: None,
        ty,
        default,
        span: name.span,
    }
}

fn binding_of(t: &TypeExpr) -> TypeExpr {
    TypeExpr {
        kind: TypeKind::Named { name: Ident { name: "Binding".into(), span: t.span }, args: vec![t.clone()] },
        span: Span::default(),
    }
}
