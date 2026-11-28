//! BloomUI's SwiftUI names (ADR 0002, section 3: `BloomUI`, re-exported by `Bloom`),
//! lowered before checking onto the language's own nodes and modifiers:
//!
//! | Written | Lowered to |
//! |---|---|
//! | `ForEach(xs) { x in … }` (in a builder) | `for x in xs { … }` |
//! | `List(xs) { x in … }` | `ScrollView { VStack { for x in xs { … } } }` |
//! | `Button(action: f) { Label("12", icon: .heart) }` | `Button { Icon(.heart); Text("12") }.style("plain").size("sm").onPress(f)` |
//! | `Button { f() } label: { Label(…) }` | the same |
//! | `Button("Save", action: f)`, `Button("Save") { f() }` | `Button(Text("Save")).onPress(f)` |
//! | `Label("Likes", icon: .heart)` | `HStack { Icon(.heart); Text("Likes") }.spacing(.xs)` |
//! | `Toggle("Likes", isOn: $on)` | `HStack { Text("Likes"); Spacer(); Toggle($on).label("Likes") }` |
//! | `Toggle("Likes", isOn: $on).description(d)` | the same, its title `VStack { Text("Likes"); Text(d).foreground(.muted).font(.body2) }.align(.leading)` |
//! | `Text(date, format: .relative)` | `Text(date.formatted(.relative))` |
//! | `ProgressView()` | `Loading()` |
//! | `VStack(spacing: .sm) { … }`, `HStack(alignment: .center, spacing: .xs) { … }` | `VStack { … }.spacing(.sm)`, `HStack { … }.align(.center).spacing(.xs)` |
//! | `.foregroundStyle(x)`, `.lineLimit(n)` | `.foreground(x)`, `.lines(n)` |
//! | `Toast.show("Saved")` | `toast("Saved")` |
//! | `.refreshable { await f() }` | `.refreshable(refreshAction($__refreshing0) { await f() })`, with `@State private var __refreshing0 = false` |
//!
//! Only package files (2.0) are lowered; a name the file declares itself is left alone.

use std::collections::BTreeSet;
use std::sync::atomic::{AtomicU32, Ordering};

use crate::ast::*;
use crate::diagnostic::Diagnostic;

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
        ret: None,
        params: Vec::new(),
        has_in: false,
        tuple: false,
        operator: None,
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
    let icon = take_label(&mut args, &["icon", "systemImage"])?;
    let [text] = args.as_slice() else { return None };
    if text.label.is_some() {
        return None;
    }
    Some((text.value.clone(), icon))
}

fn icon_and_text(text: Expr, icon: Expr) -> Vec<Stmt> {
    // (an `Icon(.name)` made here is lowered when the walk reaches it, or by `Label`'s rewrite)
    let span = text.span;
    vec![stmt(node("Icon", vec![arg(icon)], None, span)), stmt(node("Text", vec![arg(text)], None, span))]
}

/// Mention's own glyphs in Bloom's icon set; every other name is a Remix icon.
const OWN_ICONS: &[&str] = &[
    "Like",
    "LikeFill",
    "Reply",
    "Repost",
    "Share",
    "Bookmark",
    "BookmarkFill",
    "Menu",
    "MediaAttachment",
    "GifAttachment",
];

/// Names written for a glyph of another name in Bloom's set (SwiftUI's, or the obvious one).
const ICON_ALIASES: &[(&str, &str)] = &[("verified", "verifiedBadge"), ("verifiedFill", "verifiedBadgeFill")];

/// Whether `component` (`RiHeartLine`) is a glyph of Bloom's icon set.
/// The nodes whose first parameter is an icon component, which take a glyph by name.
const ICON_NODES: &[&str] = &["Icon", "IconCircle", "Action", "GroupedSectionIcon"];

pub fn icon_exists(component: &str) -> bool {
    crate::icons::ICONS.binary_search(&component).is_ok()
}

/// `.heart` → `RiHeartLine`, `.heartFill` → `RiHeartFill`, `.like` → `LikeIcon`: the
/// glyph component of Bloom's icon set (`@oxy.so/bloom/icons/<Name>`). Whether it is in
/// the set is `icon_exists`.
pub fn icon_component(name: &str) -> String {
    let name = ICON_ALIASES.iter().find(|(from, _)| *from == name).map_or(name, |(_, to)| to);
    let mut pascal = String::new();
    let mut upper = true;
    for ch in name.chars() {
        if ch == '-' || ch == '_' {
            upper = true;
            continue;
        }
        if upper {
            pascal.extend(ch.to_uppercase());
            upper = false;
        } else {
            pascal.push(ch);
        }
    }
    if OWN_ICONS.contains(&pascal.as_str()) {
        return format!("{pascal}Icon");
    }
    if pascal.ends_with("Fill") || pascal.ends_with("Line") {
        return format!("Ri{pascal}");
    }
    format!("Ri{pascal}Line")
}

/// A closure value as a modifier's trailing closure, else its argument.
fn closure_or_arg(value: Expr) -> (Vec<Arg>, Option<Closure>) {
    match value.kind {
        ExprKind::Closure(c) => (Vec::new(), Some(c)),
        _ => (vec![arg(value)], None),
    }
}

/// What `.refreshable { … }` lowers onto (the standard library's).
const REFRESH_ACTION: &str = "refreshAction";

/// The label `Toggle(_:isOn:)` takes its `.description(…)` under while it is lowered.
const DESCRIPTION: &str = "description";

struct Lowering<'a> {
    own: &'a BTreeSet<String>,
    /// Standard library names the lowering introduced (to import).
    names: BTreeSet<String>,
    /// The buttons whose content is a `Label`: an icon and a count, drawn quiet.
    quiet: BTreeSet<ExprId>,
    /// The glyph components `Icon(.name)` named (imported from Bloom's icon set).
    icons: BTreeSet<String>,
    diagnostics: Vec<Diagnostic>,
    /// The states the lowering added to the view being lowered (`.refreshable { … }`'s).
    states: Vec<StateDecl>,
}

impl Lowering<'_> {
    fn ours(&self, name: &str) -> bool {
        !self.own.contains(name)
    }

    /// `.heart` (or `on ? .likeFill : .like`) as the icon set's glyphs.
    fn glyph(&mut self, value: &Expr) -> Option<Expr> {
        match &value.kind {
            ExprKind::ImplicitMember(name) => {
                let component = icon_component(&name.name);
                if !icon_exists(&component) {
                    self.diagnostics.push(Diagnostic::error(
                        "B0502",
                        name.span,
                        format!("`.{}` is not an icon of Bloom's set (no `{component}`)", name.name),
                    ));
                    return None;
                }
                self.icons.insert(component.clone());
                Some(expr(ExprKind::Name(component), value.span))
            }
            ExprKind::Ternary(cond, a, b) => {
                let (a, b) = (self.glyph(a)?, self.glyph(b)?);
                Some(expr(ExprKind::Ternary(cond.clone(), Box::new(a), Box::new(b)), value.span))
            }
            ExprKind::Paren(inner) => self.glyph(inner),
            _ => None,
        }
    }

    fn rewrite(&mut self, e: &mut Expr) {
        let span = e.span;
        let ExprKind::Call(c) = &mut e.kind else { return };
        // `Icon(.heart)`, `Action(.close, "Close")`: the icon set's glyph, in the nodes whose
        // first parameter is an icon (R1).
        if let Some(node) = name_of(&c.callee)
            && ICON_NODES.contains(&node)
            && self.ours(node)
            && let Some(first) = c.args.first_mut().filter(|a| a.label.is_none())
            && let Some(glyph) = self.glyph(&first.value)
        {
            first.value = glyph;
            return;
        }
        // `.foregroundStyle(x)` / `.lineLimit(n)`: renamed modifiers.
        if let ExprKind::Field(_, member) = &mut c.callee.kind {
            match member.name.as_str() {
                "foregroundStyle" => member.name = "foreground".into(),
                "lineLimit" => member.name = "lines".into(),
                _ => {}
            }
            // `.refreshable { await model.refresh() }`: a refreshing state the pull sets, and the
            // action, which clears it when it ends (`refreshAction`).
            if member.name == "refreshable" {
                let action = match (c.trailing.take(), c.args.as_slice()) {
                    (Some(closure), []) => Some(*closure),
                    (None, [only])
                        if only.label.is_none() && matches!(only.value.kind, ExprKind::Closure(_)) =>
                    {
                        match c.args.remove(0).value.kind {
                            ExprKind::Closure(closure) => Some(closure),
                            _ => None,
                        }
                    }
                    (trailing, _) => {
                        c.trailing = trailing;
                        None
                    }
                };
                if let Some(action) = action {
                    let name = format!("refreshing{}", self.states.len());
                    let name = format!("__{name}");
                    self.states.push(StateDecl {
                        attr: StateAttr::State,
                        attr_span: fresh(span),
                        name: ident(&name, span),
                        ty: None,
                        value: expr(ExprKind::Bool(false), span),
                        span: fresh(span),
                    });
                    let state = expr(ExprKind::Binding(vec![ident(&name, span)]), span);
                    let run = call(
                        expr(ExprKind::Name(REFRESH_ACTION.into()), span),
                        vec![arg(state), arg(expr(ExprKind::Closure(action), span))],
                        None,
                        span,
                    );
                    c.args = vec![arg(run)];
                    c.parens = true;
                    self.names.insert(REFRESH_ACTION.into());
                }
                return;
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
                    let mut stmts = icon_and_text(text, icon);
                    if let StmtKind::Expr(glyph) = &mut stmts[0].kind {
                        self.rewrite(glyph);
                    }
                    let hstack = node("HStack", Vec::new(), Some(stmts), span);
                    *e = modifier(
                        hstack,
                        "spacing",
                        vec![arg(expr(ExprKind::ImplicitMember(ident("xs", span)), span))],
                        None,
                    );
                }
            }
            "Toggle" => {
                // `Toggle(title, isOn: b)` (and its `description:`, from `.description(d)`).
                let labelled = |a: &Arg, name: &str| a.label.as_ref().is_some_and(|l| l.name == name);
                let rest: Vec<&Arg> =
                    c.args.iter().filter(|a| !labelled(a, "isOn") && !labelled(a, DESCRIPTION)).collect();
                if !c.args.iter().any(|a| labelled(a, "isOn")) || rest.len() != 1 || rest[0].label.is_some() {
                    return;
                }
                let (Some(binding), description) =
                    (take_label(&mut c.args, &["isOn"]), take_label(&mut c.args, &[DESCRIPTION]))
                else {
                    return;
                };
                // A settings row: the title, then the switch (labelled with it for assistive tech).
                let title = c.args[0].value.clone();
                let toggle = modifier(
                    node("Toggle", vec![arg(binding)], None, span),
                    "label",
                    vec![arg(title.clone())],
                    None,
                );
                let mut text = node("Text", vec![arg(title)], None, span);
                // `.description(d)`: a quieter line under the title.
                if let Some(detail) = description {
                    let token = |name: &str| arg(expr(ExprKind::ImplicitMember(ident(name, span)), span));
                    let detail = node("Text", vec![arg(detail)], None, span);
                    let detail = modifier(detail, "foreground", vec![token("muted")], None);
                    let detail = modifier(detail, "font", vec![token("body2")], None);
                    let column = node("VStack", Vec::new(), Some(vec![stmt(text), stmt(detail)]), span);
                    text = modifier(column, "align", vec![token("start")], None);
                }
                let spacer = node("Spacer", Vec::new(), None, span);
                *e = node("HStack", Vec::new(), Some(vec![stmt(text), stmt(spacer), stmt(toggle)]), span);
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
                // `Button("Save") { save() }`: a text label, the trailing closure its action.
                if c.trailing.is_some()
                    && let [title] = c.args.as_slice()
                    && title.label.is_none()
                    && matches!(title.value.kind, ExprKind::Str { .. })
                    && let Some(action) = c.trailing.take()
                {
                    c.args.push(Arg {
                        label: Some(ident("action", span)),
                        spread: false,
                        span,
                        value: expr(ExprKind::Closure(*action), span),
                    });
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

    /// `Toggle(title, isOn: b).description(d)`: the description joins the `Toggle` call (as
    /// `description:`), before the walk lowers the `Toggle` into its row.
    fn toggle_description(&mut self, e: &mut Expr) {
        let ExprKind::Call(outer) = &mut e.kind else { return };
        let ExprKind::Field(object, member) = &mut outer.callee.kind else { return };
        if member.name != DESCRIPTION
            || outer.trailing.is_some()
            || outer.args.len() != 1
            || outer.args[0].label.is_some()
        {
            return;
        }
        let ExprKind::Call(toggle) = &mut object.kind else { return };
        if name_of(&toggle.callee) != Some("Toggle")
            || !self.ours("Toggle")
            || !toggle.args.iter().any(|a| a.label.as_ref().is_some_and(|l| l.name == "isOn"))
        {
            return;
        }
        let mut detail = outer.args.remove(0);
        detail.label = Some(ident(DESCRIPTION, detail.span));
        toggle.args.push(detail);
        let inner = std::mem::replace(object.as_mut(), expr(ExprKind::Unit, e.span));
        *e = inner;
    }

    fn expr(&mut self, e: &mut Expr) {
        self.toggle_description(e);
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
            | ExprKind::Is(x, _)
            | ExprKind::CastAs(x, ..) => self.expr(x),
            ExprKind::Binary(_, a, b) | ExprKind::Index(a, b) | ExprKind::OptIndex(a, b) => {
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
                StmtKind::Break(_) | StmtKind::Continue(_) => {}
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
    Stmt { kind: StmtKind::For(ForStmt { pattern, iter: items, body, label: None }), span }
}

/// Lowers `file`'s BloomUI names in place; returns the standard library names it introduced.
/// An icon not in Bloom's set is reported in `diagnostics`.
pub fn lower(file: &mut File, diagnostics: &mut Vec<Diagnostic>) -> BTreeSet<String> {
    let own: BTreeSet<String> = file.items.iter().map(|i| i.kind.name().name.clone()).collect();
    let mut lowering = Lowering {
        own: &own,
        names: BTreeSet::new(),
        quiet: BTreeSet::new(),
        icons: BTreeSet::new(),
        diagnostics: Vec::new(),
        states: Vec::new(),
    };
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
                v.members.extend(lowering.states.drain(..).map(Member::State));
            }
            _ => {}
        }
    }
    for icon in &lowering.icons {
        // A glyph the file already imports from the icon set (`import { RiCloseLine } from
        // "@oxy.so/bloom/icons/RiCloseLine"` beside `Icon(.close)`) is that import.
        let source = format!("@oxy.so/bloom/icons/{icon}");
        let written = file.imports.iter().any(|i| {
            i.source == source
                && matches!(&i.kind, ImportKind::Named(specs) if specs.iter().any(|s| s.local().name == *icon))
        });
        if written {
            continue;
        }
        let span = fresh(Span::new(0, 0));
        file.imports.push(Import {
            kind: ImportKind::Named(vec![ImportSpec {
                type_only: false,
                name: ident(icon, span),
                alias: None,
                span,
            }]),
            source,
            source_span: span,
            span,
        });
    }
    diagnostics.append(&mut lowering.diagnostics);
    lowering.names
}
