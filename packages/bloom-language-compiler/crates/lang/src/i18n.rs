//! Localization checked at compile time (ADR 0002, section 3).
//!
//! A package's catalogs are `Resources/Localizable/<locale>.json`, each an object of
//! key → string (or plural forms: `{ "one": "…", "other": "…" }`, `{count}` and `{name}`
//! placeholders). With catalogs present:
//!
//! - `String(localized: "feed.empty")` is the key's string in the preferred locale; a key
//!   the base catalog (`en`, else the first) lacks is an error (B0840);
//! - `Text("feed.title")` with a key of the base catalog shows the localized string; a
//!   literal that looks like a key (dotted, no spaces) and is not one warns (B0841);
//! - a key some other catalog lacks warns (B0842), naming the catalogs.
//!
//! Both lower to the standard library's `String.localized(_:args:count:)`; without
//! catalogs, `String(localized:)` still lowers (its key is shown) and `Text` is unchanged.

use std::cell::RefCell;
use std::collections::hash_map::DefaultHasher;
use std::collections::{BTreeMap, BTreeSet};
use std::hash::{Hash, Hasher};
use std::path::{Path, PathBuf};
use std::rc::Rc;
use std::sync::atomic::{AtomicU32, Ordering};

use crate::ast::*;
use crate::diagnostic::{Diagnostic, closest};

/// The standard library's lookup (`String.localized`).
pub const LOOKUP: &str = "String$$localized";

/// The standard library's hook that reads the preferred locale, so a view re-draws when it
/// changes (`Locale.prefer`): a view that shows localized strings reads it once.
pub const LOCALE_HOOK: &str = "useLocalization";

/// The view member that holds it, passed to each lookup in the view (`locale:`).
const LOCALE_MEMBER: &str = "bloom$locale";

/// Where a package's catalogs are, under its root.
pub const DIR: &str = "Resources/Localizable";

static NEXT_ID: AtomicU32 = AtomicU32::new(3_800_000_000);

/// A package's catalogs: each locale's keys.
#[derive(Debug, Default)]
pub struct Catalogs {
    /// The locale whose keys are the reference (`en`, else the first).
    pub base: String,
    pub keys: BTreeMap<String, BTreeSet<String>>,
}

/// What a cache entry was read from: each catalog's path and a hash of its text. Not the
/// modified time: file times come from the kernel's coarse clock, a tick of a few
/// milliseconds, so a catalog rewritten within a tick of the read kept its time and its new
/// keys went unseen until the next unrelated change (the route table's bug, `routes.rs`).
/// A catalog is a few kilobytes, so reading it to hash costs what its `stat` did.
type Stamp = Vec<(PathBuf, u64)>;

fn content_hash(text: &str) -> u64 {
    let mut hasher = DefaultHasher::new();
    text.hash(&mut hasher);
    hasher.finish()
}

thread_local! {
    static LOADED: RefCell<BTreeMap<PathBuf, (Stamp, Rc<Catalogs>)>> = const { RefCell::new(BTreeMap::new()) };
}

/// The catalogs of the package at `root` (none: an empty `keys`).
pub fn catalogs(root: &Path) -> Rc<Catalogs> {
    let dir = root.join(DIR);
    let mut files: Vec<PathBuf> = std::fs::read_dir(&dir)
        .map(|entries| {
            entries
                .filter_map(|e| e.ok().map(|e| e.path()))
                .filter(|p| p.extension().is_some_and(|x| x == "json"))
                .collect()
        })
        .unwrap_or_default();
    files.sort();
    let texts: Vec<(PathBuf, String)> = files
        .into_iter()
        .map(|path| {
            let text = std::fs::read_to_string(&path).unwrap_or_default();
            (path, text)
        })
        .collect();
    let stamp: Stamp = texts.iter().map(|(path, text)| (path.clone(), content_hash(text))).collect();
    if let Some(found) =
        LOADED.with(|l| l.borrow().get(&dir).filter(|(s, _)| *s == stamp).map(|(_, c)| c.clone()))
    {
        return found;
    }
    let mut out = Catalogs::default();
    for (path, text) in &texts {
        let locale = path.file_stem().map(|s| s.to_string_lossy().into_owned()).unwrap_or_default();
        out.keys.insert(locale, top_level_keys(text));
    }
    out.base = if out.keys.contains_key("en") {
        "en".into()
    } else {
        out.keys.keys().next().cloned().unwrap_or_default()
    };
    let out = Rc::new(out);
    LOADED.with(|l| l.borrow_mut().insert(dir, (stamp, out.clone())));
    out
}

/// Forgets every package's catalogs (an editor's `clear_caches`).
pub fn clear() {
    LOADED.with(|l| l.borrow_mut().clear());
}

/// The keys of the JSON object `text` (its top level only).
pub fn top_level_keys(text: &str) -> BTreeSet<String> {
    let bytes = text.as_bytes();
    let mut keys = BTreeSet::new();
    let mut depth = 0usize;
    let mut i = 0;
    // A string at depth 1 followed by `:` is a key.
    while i < bytes.len() {
        match bytes[i] {
            b'{' | b'[' => depth += 1,
            b'}' | b']' => depth = depth.saturating_sub(1),
            b'"' => {
                let start = i + 1;
                let mut j = start;
                let mut s = String::new();
                while j < bytes.len() && bytes[j] != b'"' {
                    if bytes[j] == b'\\' && j + 1 < bytes.len() {
                        match bytes[j + 1] {
                            b'n' => s.push('\n'),
                            b't' => s.push('\t'),
                            other => s.push(other as char),
                        }
                        j += 2;
                        continue;
                    }
                    let ch_len = utf8_len(bytes[j]);
                    s.push_str(&text[j..(j + ch_len).min(text.len())]);
                    j += ch_len;
                }
                i = j;
                let mut k = j + 1;
                while k < bytes.len() && bytes[k].is_ascii_whitespace() {
                    k += 1;
                }
                if depth == 1 && k < bytes.len() && bytes[k] == b':' {
                    keys.insert(s);
                }
            }
            _ => {}
        }
        i += 1;
    }
    keys
}

fn utf8_len(first: u8) -> usize {
    match first {
        0x00..=0x7F => 1,
        0xC0..=0xDF => 2,
        0xE0..=0xEF => 3,
        _ => 4,
    }
}

fn plain(parts: &[StrPart]) -> Option<&str> {
    match parts {
        [StrPart::Text(text)] => Some(text),
        [] => Some(""),
        _ => None,
    }
}

/// A string that reads as a key: dotted, without spaces (`feed.empty.title`).
fn looks_like_key(text: &str) -> bool {
    text.contains('.') && !text.contains(char::is_whitespace) && !text.ends_with('.')
}

struct Lowering<'c> {
    catalogs: &'c Catalogs,
    diagnostics: Vec<Diagnostic>,
    used: bool,
    /// In a view: its lookups read the locale through the view's hook member.
    in_view: bool,
    /// A lookup in the current view, which then declares the member.
    view_used: bool,
    /// Some view declares the member (the hook is then imported).
    hook_used: bool,
}

impl Lowering<'_> {
    fn lookup(&mut self, key: Expr, rest: Vec<Arg>) -> Expr {
        self.used = true;
        let span = crate::codable::synthetic(key.span);
        let callee = Expr {
            id: ExprId(NEXT_ID.fetch_add(1, Ordering::Relaxed)),
            kind: ExprKind::Name(LOOKUP.into()),
            span,
        };
        let key_span = key.span;
        let mut args = vec![Arg { label: None, spread: false, span: key_span, value: key }];
        args.extend(rest);
        // In a view, the locale its hook read: a switch re-draws the view (a memo dependency).
        if self.in_view {
            self.view_used = true;
            let locale = Expr {
                id: ExprId(NEXT_ID.fetch_add(1, Ordering::Relaxed)),
                kind: ExprKind::Name(LOCALE_MEMBER.into()),
                span,
            };
            let label = Ident { name: "locale".into(), span };
            args.push(Arg { label: Some(label), spread: false, span: key_span, value: locale });
        }
        Expr {
            id: ExprId(NEXT_ID.fetch_add(1, Ordering::Relaxed)),
            kind: ExprKind::Call(Call {
                callee: Box::new(callee),
                args,
                parens: true,
                trailing: None,
                optional: false,
            }),
            span,
        }
    }

    /// Checks `key` (at `span`) against the catalogs; `required`: `String(localized:)`.
    fn check(&mut self, key: &str, span: Span, required: bool) -> bool {
        if self.catalogs.keys.is_empty() {
            return required;
        }
        let base = &self.catalogs.base;
        let known = self.catalogs.keys.get(base).is_some_and(|k| k.contains(key));
        if !known {
            if required || looks_like_key(key) {
                let near =
                    self.catalogs.keys.get(base).and_then(|k| closest(key, k.iter().map(String::as_str)));
                let mut d = if required {
                    Diagnostic::error("B0840", span, format!("`{key}` is not a key of {DIR}/{base}.json"))
                        .label("no such key")
                } else {
                    Diagnostic::warning(
                        "B0841",
                        span,
                        format!("`{key}` reads like a key, and {DIR}/{base}.json has none"),
                    )
                    .label("shown as written")
                };
                d = d.maybe_help(
                    near.map(|n| format!("did you mean `{n}`?"))
                        .or_else(|| Some(format!("add \"{key}\" to {DIR}/{base}.json"))),
                );
                self.diagnostics.push(d.spec("10-modules-and-interop"));
            }
            return required;
        }
        let missing: Vec<String> = self
            .catalogs
            .keys
            .iter()
            .filter(|(locale, keys)| *locale != base && !keys.contains(key))
            .map(|(locale, _)| format!("{locale}.json"))
            .collect();
        if !missing.is_empty() {
            self.diagnostics.push(
                Diagnostic::warning("B0842", span, format!("`{key}` is missing in {}", missing.join(", ")))
                    .label(format!("those locales show the {base} string"))
                    .help(format!("add \"{key}\" to each of them"))
                    .spec("10-modules-and-interop"),
            );
        }
        true
    }

    fn expr(&mut self, e: &mut Expr) {
        if let ExprKind::Call(call) = &mut e.kind {
            // `String(localized: "key", …)`.
            if matches!(&call.callee.kind, ExprKind::Name(n) if n == "String")
                && call.args.first().is_some_and(|a| a.label.as_ref().is_some_and(|l| l.name == "localized"))
            {
                let mut args = std::mem::take(&mut call.args);
                let mut key = args.remove(0);
                if let ExprKind::Str { parts, .. } = &key.value.kind
                    && let Some(text) = plain(parts)
                {
                    let text = text.to_string();
                    self.check(&text, key.value.span, true);
                }
                key.label = None;
                for arg in &mut args {
                    self.expr(&mut arg.value);
                }
                *e = self.lookup(key.value, args);
                return;
            }
            // `Text("feed.title")`.
            if matches!(&call.callee.kind, ExprKind::Name(n) if n == "Text")
                && let [arg] = call.args.as_mut_slice()
                && arg.label.is_none()
                && let ExprKind::Str { parts, .. } = &arg.value.kind
                && let Some(text) = plain(parts)
            {
                let text = text.to_string();
                if self.check(&text, arg.value.span, false) {
                    let literal = std::mem::replace(
                        &mut arg.value,
                        Expr {
                            id: ExprId(NEXT_ID.fetch_add(1, Ordering::Relaxed)),
                            kind: ExprKind::Unit,
                            span: arg.span,
                        },
                    );
                    arg.value = self.lookup(literal, Vec::new());
                }
            }
        }
        match &mut e.kind {
            ExprKind::Call(c) => {
                self.expr(&mut c.callee);
                for arg in &mut c.args {
                    self.expr(&mut arg.value);
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
            ExprKind::Map(entries) => {
                for (k, v) in entries {
                    self.expr(k);
                    self.expr(v);
                }
            }
            ExprKind::Record(entries) => {
                for entry in entries {
                    match entry {
                        RecordEntry::Field { value, .. } | RecordEntry::Spread(value) => self.expr(value),
                    }
                }
            }
            ExprKind::If(i) => self.if_expr(i),
            ExprKind::Match(m) => {
                self.expr(&mut m.scrutinee);
                for arm in &mut m.arms {
                    if let Some(g) = &mut arm.guard {
                        self.expr(g);
                    }
                    match &mut arm.body {
                        ArmBody::Expr(x) => self.expr(x),
                        ArmBody::Block(b) => self.block(b),
                    }
                }
            }
            ExprKind::Task(b) => self.block(b),
            _ => {}
        }
    }

    fn if_expr(&mut self, i: &mut IfExpr) {
        match &mut i.cond {
            Cond::Expr(x) | Cond::Let(_, x) => self.expr(x),
        }
        self.block(&mut i.then);
        match i.otherwise.as_deref_mut() {
            Some(Else::If(x)) => self.expr(x),
            Some(Else::Block(b)) => self.block(b),
            None => {}
        }
    }

    fn block(&mut self, b: &mut Block) {
        self.stmts(&mut b.stmts);
    }

    fn stmts(&mut self, stmts: &mut [Stmt]) {
        for stmt in stmts {
            match &mut stmt.kind {
                StmtKind::Let(s) => self.expr(&mut s.value),
                StmtKind::Var(s) => self.expr(&mut s.value),
                StmtKind::Assign(s) => self.expr(&mut s.value),
                StmtKind::Return(Some(x)) | StmtKind::Expr(x) | StmtKind::Throw(x) => self.expr(x),
                StmtKind::Return(None) => {}
                StmtKind::Defer(b) => self.block(b),
                StmtKind::While(w) => {
                    self.expr(&mut w.cond);
                    self.block(&mut w.body);
                }
                StmtKind::For(f) => {
                    self.expr(&mut f.iter);
                    self.block(&mut f.body);
                }
                StmtKind::Guard(g) => {
                    match &mut g.cond {
                        Cond::Expr(x) | Cond::Let(_, x) => self.expr(x),
                    }
                    self.block(&mut g.otherwise);
                }
                StmtKind::Do(d) => {
                    self.block(&mut d.body);
                    for catch in &mut d.catches {
                        self.block(&mut catch.body);
                    }
                }
            }
        }
    }

    fn item(&mut self, item: &mut Item) {
        match &mut item.kind {
            ItemKind::Fn(f) => self.block(&mut f.body),
            ItemKind::Const(c) => self.expr(&mut c.value),
            ItemKind::View(v) => {
                self.in_view = true;
                self.view_used = false;
                for member in &mut v.members {
                    match member {
                        Member::State(s) => self.expr(&mut s.value),
                        Member::Let(l) => self.expr(&mut l.value),
                        Member::Fn(f) => self.block(&mut f.body),
                        Member::Effect(e) => self.block(&mut e.body),
                        Member::Equal(e) => self.block(&mut e.body),
                    }
                }
                self.block(&mut v.body);
                self.in_view = false;
                if self.view_used {
                    self.hook_used = true;
                    let span = crate::codable::synthetic(v.span);
                    let id = || ExprId(NEXT_ID.fetch_add(1, Ordering::Relaxed));
                    let hook = Expr { id: id(), kind: ExprKind::Name(LOCALE_HOOK.into()), span };
                    let call = Call {
                        callee: Box::new(hook),
                        args: Vec::new(),
                        parens: true,
                        trailing: None,
                        optional: false,
                    };
                    let member = LetStmt {
                        pattern: Pattern {
                            kind: PatternKind::Bind(Ident { name: LOCALE_MEMBER.into(), span }),
                            span,
                        },
                        ty: None,
                        value: Expr { id: id(), kind: ExprKind::Call(call), span },
                        span,
                        is_async: false,
                    };
                    v.members.insert(0, Member::Let(member));
                }
            }
            _ => {}
        }
    }
}

/// Lowers `file`'s localized strings against the catalogs of the package at `root`.
/// Returns the standard library's names the file now uses (the lookup, the locale hook).
pub fn lower(file: &mut File, root: &Path, diagnostics: &mut Vec<Diagnostic>) -> Vec<&'static str> {
    let catalogs = catalogs(root);
    let mut lowering = Lowering {
        catalogs: &catalogs,
        diagnostics: Vec::new(),
        used: false,
        in_view: false,
        view_used: false,
        hook_used: false,
    };
    for item in &mut file.items {
        lowering.item(item);
    }
    diagnostics.extend(lowering.diagnostics);
    let mut names = Vec::new();
    if lowering.used {
        names.push(LOOKUP);
    }
    if lowering.hook_used {
        names.push(LOCALE_HOOK);
    }
    names
}
