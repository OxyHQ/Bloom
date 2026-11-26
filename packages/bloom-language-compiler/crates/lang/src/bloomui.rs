//! BloomUI's SwiftUI names (ADR 0002, section 3: `BloomUI`, re-exported by `Bloom`),
//! lowered before checking onto the language's own nodes and modifiers:
//!
//! | Written | Lowered to |
//! |---|---|
//! | `ForEach(xs) { x in … }` (in a builder) | `for x in xs { … }` |
//! | `List(xs) { x in … }` | `ScrollView { VStack { for x in xs { … } } }` |
//! | `Button(action: f) { Label("12", icon: .heart) }` | `Button { Icon(.heart); Text("12") }.style("plain").size("sm").onPress(f)` |
//! | `Button { f() } label: { Label(…) }` | the same |
//! | `Button("Save", action: f)` | `Button(Text("Save")).onPress(f)` |
//! | `Label("Likes", icon: .heart)` | `HStack { Icon(.heart); Text("Likes") }.spacing(.xs)` |
//! | `Toggle("Likes", isOn: $on)` | `Toggle($on).label("Likes")` |
//! | `Text(date, format: .relative)` | `Text(date.formatted(.relative))` |
//! | `ProgressView()` | `Loading()` |
//! | `VStack(spacing: .sm) { … }`, `HStack(alignment: .center, spacing: .xs) { … }` | `VStack { … }.spacing(.sm)`, `HStack { … }.align(.center).spacing(.xs)` |
//! | `.foregroundStyle(x)`, `.lineLimit(n)` | `.foreground(x)`, `.lines(n)` |
//! | `Toast.show("Saved")` | `toast("Saved")` |
//!
//! Only package files (2.0) are lowered; a name the file declares itself is left alone.

use std::collections::BTreeSet;
use std::sync::atomic::{AtomicU32, Ordering};

use crate::ast::*;

static NEXT_ID: AtomicU32 = AtomicU32::new(3_900_000_000);

fn fresh(span: Span) -> Span {
    crate::codable::synthetic(span)
}

fn expr(kind: ExprKind, span: Span) -> Expr {
    Expr { id: ExprId(NEXT_ID.fetch_add(1, Ordering::Relaxed)), kind, span: fresh(span) }
}

fn ident(name: &str, span: Span) -> Ident {
    Ident { name: name.into(), span: fresh(span) }
}

fn arg(value: Expr) -> Arg {
    let span = value.span;
    Arg { label: None, spread: false, value, span }
}

fn str_lit(text: &str, span: Span) -> Expr {
    expr(ExprKind::Str { parts: vec![StrPart::Text(text.into())], raw: false }, span)
}

fn call(callee: Expr, args: Vec<Arg>, trailing: Option<Closure>, span: Span) -> Expr {
    let parens = !args.is_empty() || trailing.is_none();
    expr(
        ExprKind::Call(Call {
            callee: Box::new(callee),
            args,
            parens,
            trailing: trailing.map(Box::new),
            optional: false,
        }),
        span,
    )
}

fn node(name: &str, args: Vec<Arg>, children: Option<Vec<Stmt>>, span: Span) -> Expr {
    let trailing = children.map(|body| Closure {
        params: Vec::new(),
        has_in: false,
        tuple: false,
        body,
        span: fresh(span),
    });
    call(expr(ExprKind::Name(name.into()), span), args, trailing, span)
}

/// `object.name(args…)` (a modifier), or with `trailing` as its closure.
fn modifier(object: Expr, name: &str, args: Vec<Arg>, trailing: Option<Closure>) -> Expr {
    let span = object.span;
    let callee = expr(ExprKind::Field(Box::new(object), ident(name, span)), span);
    call(callee, args, trailing, span)
}

fn stmt(e: Expr) -> Stmt {
    let span = e.span;
    Stmt { kind: StmtKind::Expr(e), span }
}

fn take_label(args: &mut Vec<Arg>, labels: &[&str]) -> Option<Expr> {
    let at = args.iter().position(|a| a.label.as_ref().is_some_and(|l| labels.contains(&l.name.as_str())))?;
    Some(args.remove(at).value)
}

fn name_of(e: &Expr) -> Option<&str> {
    match &e.kind {
        ExprKind::Name(n) => Some(n),
        _ => None,
    }
}

/// `Label("12", icon: .heart)`: its text and icon.
fn label_parts(e: &Expr) -> Option<(Expr, Expr)> {
    let ExprKind::Call(c) = &e.kind else { return None };
    if name_of(&c.callee) != Some("Label") || c.trailing.is_some() {
        return None;
    }
    let mut args = c.args.clone();
    let mut icon = take_label(&mut args, &["icon", "systemImage"])?;
    // `.heart`: the icon's name.
    if let ExprKind::ImplicitMember(name) = &icon.kind {
        icon = str_lit(&name.name, icon.span);
    }
    let [text] = args.as_slice() else { return None };
    if text.label.is_some() {
        return None;
    }
    Some((text.value.clone(), icon))
}

fn icon_and_text(text: Expr, icon: Expr) -> Vec<Stmt> {
    let span = text.span;
    vec![stmt(node("Icon", vec![arg(icon)], None, span)), stmt(node("Text", vec![arg(text)], None, span))]
}

/// A closure value as a modifier's trailing closure, else its argument.
fn closure_or_arg(value: Expr) -> (Vec<Arg>, Option<Closure>) {
    match value.kind {
        ExprKind::Closure(c) => (Vec::new(), Some(c)),
        _ => (vec![arg(value)], None),
    }
}

struct Lowering<'a> {
    own: &'a BTreeSet<String>,
    /// Standard library names the lowering introduced (to import).
    names: BTreeSet<String>,
    /// The buttons whose content is a `Label`: an icon and a count, drawn quiet.
    quiet: BTreeSet<ExprId>,
}

impl Lowering<'_> {
    fn ours(&self, name: &str) -> bool {
        !self.own.contains(name)
    }

    fn rewrite(&mut self, e: &mut Expr) {
        let span = e.span;
        let ExprKind::Call(c) = &mut e.kind else { return };
        // `.foregroundStyle(x)` / `.lineLimit(n)`: renamed modifiers.
        if let ExprKind::Field(_, member) = &mut c.callee.kind {
            match member.name.as_str() {
                "foregroundStyle" => member.name = "foreground".into(),
                "lineLimit" => member.name = "lines".into(),
                _ => {}
            }
            // `Toast.show("Saved")`.
            if member.name == "show"
                && let ExprKind::Field(object, _) = &c.callee.kind
                && name_of(object) == Some("Toast")
                && self.ours("Toast")
            {
                let first = c.args.iter().find(|a| a.label.is_none()).cloned();
                if let Some(first) = first {
                    *e = call(expr(ExprKind::Name("toast".into()), span), vec![first], None, span);
                }
            }
            return;
        }
        let Some(name) = name_of(&c.callee).map(str::to_string) else { return };
        if !self.ours(&name) {
            return;
        }
        match name.as_str() {
            "ProgressView" if c.args.is_empty() => *c.callee = expr(ExprKind::Name("Loading".into()), span),
            "Label" => {
                if let Some((text, icon)) = label_parts(e) {
                    let hstack = node("HStack", Vec::new(), Some(icon_and_text(text, icon)), span);
                    *e = modifier(
                        hstack,
                        "spacing",
                        vec![arg(expr(ExprKind::ImplicitMember(ident("xs", span)), span))],
                        None,
                    );
                }
            }
            "Toggle" => {
                if let Some(binding) = take_label(&mut c.args, &["isOn"])
                    && let [title] = c.args.as_slice()
                {
                    let title = title.value.clone();
                    let toggle = node("Toggle", vec![arg(binding)], None, span);
                    *e = modifier(toggle, "label", vec![arg(title)], None);
                }
            }
            "Text" => {
                if let Some(format) = take_label(&mut c.args, &["format"])
                    && let [value] = c.args.as_mut_slice()
                {
                    let inner = std::mem::replace(&mut value.value, expr(ExprKind::Unit, span));
                    value.value = modifier(inner, "formatted", vec![arg(format)], None);
                    self.names.insert("Date$formatted".into());
                }
            }
            "VStack" | "HStack" => {
                let alignment = take_label(&mut c.args, &["alignment"]);
                let spacing = take_label(&mut c.args, &["spacing"]);
                if alignment.is_none() && spacing.is_none() {
                    return;
                }
                let mut out = std::mem::replace(e, expr(ExprKind::Unit, span));
                if let Some(a) = alignment {
                    out = modifier(out, "align", vec![arg(a)], None);
                }
                if let Some(s) = spacing {
                    out = modifier(out, "spacing", vec![arg(s)], None);
                }
                *e = out;
            }
            "Button" => {
                // `Button { action } label: { content }`: the first closure acts, `label:` is drawn.
                if let Some(content) = take_label(&mut c.args, &["label"]) {
                    let Some(action) = c.trailing.take() else { return };
                    let ExprKind::Closure(content) = content.kind else { return };
                    c.trailing = Some(Box::new(content));
                    c.args.push(Arg {
                        label: Some(ident("action", span)),
                        spread: false,
                        span,
                        value: expr(ExprKind::Closure(*action), span),
                    });
                    c.parens = true;
                }
                let Some(action) = take_label(&mut c.args, &["action"]) else { return };
                let quiet = self.quiet.contains(&e.id);
                // `Button("Save", action: f)`: a text label.
                if let [title] = c.args.as_mut_slice()
                    && title.label.is_none()
                    && matches!(title.value.kind, ExprKind::Str { .. })
                {
                    let text = std::mem::replace(&mut title.value, expr(ExprKind::Unit, span));
                    title.value = node("Text", vec![arg(text)], None, span);
                }
                let mut out = std::mem::replace(e, expr(ExprKind::Unit, span));
                if quiet {
                    out = modifier(out, "style", vec![arg(str_lit("plain", span))], None);
                    out = modifier(out, "size", vec![arg(str_lit("sm", span))], None);
                }
                let (args, trailing) = closure_or_arg(action);
                *e = modifier(out, "onPress", args, trailing);
            }
            "List" => {
                // `List(xs) { x in … }`: rows over `xs`, scrolling.
                let Some(closure) = c.trailing.as_deref() else { return };
                if closure.params.len() > 1 || c.args.len() != 1 || c.args[0].label.is_some() {
                    return;
                }
                let items = c.args[0].value.clone();
                let rows = for_each(items, closure.clone(), span);
                let stack = node("VStack", Vec::new(), Some(vec![rows]), span);
                *e = node("ScrollView", Vec::new(), Some(vec![stmt(stack)]), span);
            }
            _ => {}
        }
    }

    /// `Button(…) { Label("12", icon: .heart) }` (or `label: { … }`): its content becomes the
    /// icon and the text, before the `Label` is lowered on its own.
    fn button_content(&mut self, e: &mut Expr) {
        let id = e.id;
        let ExprKind::Call(c) = &mut e.kind else { return };
        if name_of(&c.callee) != Some("Button") || !self.ours("Button") {
            return;
        }
        let bodies =
            c.trailing.iter_mut().map(|t| &mut t.body).chain(c.args.iter_mut().filter_map(|a| {
                match (&a.label, &mut a.value.kind) {
                    (Some(l), ExprKind::Closure(closure)) if l.name == "label" => Some(&mut closure.body),
                    _ => None,
                }
            }));
        for body in bodies {
            if let [Stmt { kind: StmtKind::Expr(only), .. }] = body.as_slice()
                && let Some((text, icon)) = label_parts(only)
            {
                *body = icon_and_text(text, icon);
                self.quiet.insert(id);
            }
        }
    }

    fn expr(&mut self, e: &mut Expr) {
        self.button_content(e);
        match &mut e.kind {
            ExprKind::Call(c) => {
                self.expr(&mut c.callee);
                for a in &mut c.args {
                    self.expr(&mut a.value);
                }
                if let Some(closure) = &mut c.trailing {
                    self.stmts(&mut closure.body);
                }
            }
            ExprKind::Closure(closure) => self.stmts(&mut closure.body),
            ExprKind::Await(x)
            | ExprKind::Try(x)
            | ExprKind::Paren(x)
            | ExprKind::Spread(x)
            | ExprKind::Unary(_, x)
            | ExprKind::Throwing(_, x)
            | ExprKind::Field(x, _)
            | ExprKind::OptField(x, _)
            | ExprKind::Is(x, _) => self.expr(x),
            ExprKind::Binary(_, a, b) | ExprKind::Index(a, b) => {
                self.expr(a);
                self.expr(b);
            }
            ExprKind::Ternary(a, b, c) => {
                self.expr(a);
                self.expr(b);
                self.expr(c);
            }
            ExprKind::List(xs) | ExprKind::Tuple(xs) => xs.iter_mut().for_each(|x| self.expr(x)),
            ExprKind::If(i) => {
                match &mut i.cond {
                    Cond::Expr(x) | Cond::Let(_, x) => self.expr(x),
                }
                self.stmts(&mut i.then.stmts);
                match i.otherwise.as_deref_mut() {
                    Some(Else::If(x)) => self.expr(x),
                    Some(Else::Block(b)) => self.stmts(&mut b.stmts),
                    None => {}
                }
            }
            ExprKind::Match(m) => {
                self.expr(&mut m.scrutinee);
                for arm in &mut m.arms {
                    match &mut arm.body {
                        ArmBody::Expr(x) => self.expr(x),
                        ArmBody::Block(b) => self.stmts(&mut b.stmts),
                    }
                }
            }
            ExprKind::Task(b) => self.stmts(&mut b.stmts),
            _ => {}
        }
        self.rewrite(e);
    }

    fn stmts(&mut self, stmts: &mut [Stmt]) {
        for s in stmts {
            // `ForEach(xs) { x in … }` in a builder: a `for`.
            if let StmtKind::Expr(e) = &s.kind
                && let ExprKind::Call(c) = &e.kind
                && name_of(&c.callee) == Some("ForEach")
                && self.ours("ForEach")
                && let Some(closure) = c.trailing.as_deref()
                && let Some(items) = c.args.iter().find(|a| a.label.is_none())
            {
                *s = for_each(items.value.clone(), closure.clone(), e.span);
            }
            match &mut s.kind {
                StmtKind::Let(x) => self.expr(&mut x.value),
                StmtKind::Var(x) => self.expr(&mut x.value),
                StmtKind::Assign(x) => self.expr(&mut x.value),
                StmtKind::Return(Some(x)) | StmtKind::Expr(x) | StmtKind::Throw(x) => self.expr(x),
                StmtKind::Return(None) => {}
                StmtKind::Defer(b) => self.stmts(&mut b.stmts),
                StmtKind::While(w) => {
                    self.expr(&mut w.cond);
                    self.stmts(&mut w.body.stmts);
                }
                StmtKind::For(f) => {
                    self.expr(&mut f.iter);
                    self.stmts(&mut f.body.stmts);
                }
                StmtKind::Guard(g) => self.stmts(&mut g.otherwise.stmts),
                StmtKind::Do(d) => {
                    self.stmts(&mut d.body.stmts);
                    for catch in &mut d.catches {
                        self.stmts(&mut catch.body.stmts);
                    }
                }
            }
        }
    }
}

/// `for x in items { closure's body }` (`_` when the closure names no parameter).
fn for_each(items: Expr, closure: Closure, span: Span) -> Stmt {
    let pattern = match closure.params.first() {
        Some(p) => Pattern { kind: PatternKind::Bind(p.name.clone()), span: p.name.span },
        None => Pattern { kind: PatternKind::Wildcard, span: fresh(span) },
    };
    let body = Block { stmts: closure.body, span: closure.span };
    Stmt { kind: StmtKind::For(ForStmt { pattern, iter: items, body }), span }
}

/// Lowers `file`'s BloomUI names in place; returns the standard library names it introduced.
pub fn lower(file: &mut File) -> BTreeSet<String> {
    let own: BTreeSet<String> = file.items.iter().map(|i| i.kind.name().name.clone()).collect();
    let mut lowering = Lowering { own: &own, names: BTreeSet::new(), quiet: BTreeSet::new() };
    for item in &mut file.items {
        match &mut item.kind {
            ItemKind::Fn(f) => lowering.stmts(&mut f.body.stmts),
            ItemKind::Const(c) => lowering.expr(&mut c.value),
            ItemKind::View(v) => {
                for member in &mut v.members {
                    match member {
                        Member::State(s) => lowering.expr(&mut s.value),
                        Member::Let(l) => lowering.expr(&mut l.value),
                        Member::Fn(f) => lowering.stmts(&mut f.body.stmts),
                        Member::Effect(e) => lowering.stmts(&mut e.body.stmts),
                        Member::Equal(e) => lowering.stmts(&mut e.body.stmts),
                    }
                }
                lowering.stmts(&mut v.body.stmts);
            }
            _ => {}
        }
    }
    lowering.names
}
