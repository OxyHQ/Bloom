//! `--target swiftui`: a checked Bloom program as Swift and SwiftUI.
//!
//! Bloom 2.0's surface is Swift's (ADR 0002), so this backend is mostly a printer of the
//! parsed tree: a `struct` is a Swift `struct`, an `enum` an `enum`, a `protocol` a
//! `protocol`, `@Observable final class` and `actor` are themselves, `async`/`throws`/`try`
//! and `switch` are Swift's own, and labels are Swift's labels. What it rewrites:
//!
//! | Bloom | Swift |
//! |---|---|
//! | a function's last expression is its value | `return` it (into an `if`/`switch`'s branches) |
//! | `none` | `nil`; in a view builder `EmptyView()` |
//! | `task { … }` | `Task { … }` |
//! | `Binding(get: v, set: f)` | `Binding(get: { v }, set: f)` |
//! | a struct's memberwise construction | an explicit `init` (Swift's is internal, and leaves out a `let` with a default) |
//! | a function-typed parameter | `@escaping` (a Bloom closure may always be kept) |
//! | `Float` | `Double` (Bloom's `Float` is 64-bit) |
//! | `[String: V]`, `Set<T>` | `OrderedDictionary`, `OrderedSet` (insertion order, as on every backend) |
//! | a universal modifier (`.padding(.horizontal, .lg)`) | `.bloomPadding(.horizontal, .lg)`, out of SwiftUI's overloads; effects (`.task`, `.onChange`) stay SwiftUI's |
//! | `xs.prefix(n)`, `xs.dropFirst(n)` on a list / string | `Array(…)` / `String(…)` (Swift returns a slice) |
//! | `a ?? b == c` | parenthesised by Swift's precedence (`??` binds tighter in Swift) |
//! | an enum whose payload holds itself | `indirect enum` |
//! | a view's own modifiers after universal ones (`Action(…).padding().count(3)`) | hoisted onto the node (`Action(…).count(3).padding()`): a node's modifiers are its methods |
//! | `extern native "M" { func … }` | a Swift protocol the native side implements, and functions that call it |
//!
//! The nodes (`VStack`, `Text`, `Toggle`, `GroupedSection`, `Action`…), their modifiers and
//! the tokens (`.lg`, `.headline`) are BloomUI's (`runtime/ios/Sources/BloomUI`), drawn
//! with SwiftUI; the standard library (`range`, `updating(where:_:)`, `Date.formatted`) is
//! `Bloom` (`runtime/ios/Sources/Bloom`), on Foundation. A generated file imports `Bloom` and
//! `BloomUI`, and never SwiftUI itself: BloomUI's `Text` is the only `Text` in scope.

mod expr;
mod hooks;
mod nodes;
pub mod project;
mod stmt;
mod view;

use std::collections::{BTreeSet, HashSet};
use std::fmt::Write as _;
use std::path::PathBuf;

use bloom_lang::ast::*;

use crate::{Decls, Emitted, Problem, Program, SourceFile, escape};
use hooks::hook_functions;

/// Swift's keywords a Bloom name may collide with (escaped with backticks).
const KEYWORDS: &[&str] = &[
    "associatedtype",
    "class",
    "deinit",
    "enum",
    "extension",
    "fileprivate",
    "func",
    "import",
    "init",
    "inout",
    "internal",
    "let",
    "open",
    "operator",
    "private",
    "precedencegroup",
    "protocol",
    "public",
    "rethrows",
    "static",
    "struct",
    "subscript",
    "typealias",
    "var",
    "break",
    "case",
    "catch",
    "continue",
    "default",
    "defer",
    "do",
    "else",
    "fallthrough",
    "for",
    "guard",
    "if",
    "in",
    "repeat",
    "return",
    "throw",
    "switch",
    "where",
    "while",
    "as",
    "false",
    "is",
    "nil",
    "super",
    "throws",
    "true",
    "try",
    "Any",
    "Protocol",
    "Type",
];

pub(crate) fn kw(name: &str) -> String {
    escape(name, KEYWORDS)
}

fn label_of(name: &str) -> String {
    label(name)
}

/// An argument label: Swift takes every keyword as one but `inout`, `var` and `let`.
pub(crate) fn label(name: &str) -> String {
    escape(name, &["inout", "var", "let"])
}

/// The standard library's rename table (`runtime/ios/Sources/Bloom/Renames.swift`: one
/// `Bloom name -> Swift name` per line): the Bloom types and members whose Swift name differs,
/// because Swift or Foundation has the name with other semantics. Read from the runtime's
/// source, so the two cannot drift.
const RENAMES: &str = include_str!("../../runtime/ios/Sources/Bloom/Renames.swift");

/// The language's own names that are Swift's under another (not the standard library's).
const LANGUAGE_RENAMES: &[(&str, &str)] =
    &[("Float", "Double"), ("Unit", "Void"), ("Dictionary", "OrderedDictionary")];

/// `(Bloom, Swift)` type names, and `(type, member, Swift member)`.
pub(crate) struct Renames {
    pub types: Vec<(String, String)>,
    pub members: Vec<(String, String, String)>,
}

pub(crate) fn renames() -> &'static Renames {
    static TABLE: std::sync::OnceLock<Renames> = std::sync::OnceLock::new();
    TABLE.get_or_init(|| {
        let mut types: Vec<(String, String)> =
            LANGUAGE_RENAMES.iter().map(|(a, b)| (a.to_string(), b.to_string())).collect();
        let mut members = Vec::new();
        for line in RENAMES.lines() {
            let Some(rest) = line.strip_prefix("// ") else { break };
            let Some((from, to)) = rest.split_once(" -> ") else {
                if rest.trim().is_empty() { break } else { continue }
            };
            let (from, to) = (from.trim(), to.trim());
            if from.starts_with('[') {
                continue; // `[String: V]`: the map type, spelt by `TypeKind::Map`.
            }
            match (from.split_once('.'), to.split_once('.')) {
                (Some((ty, member)), Some((_, new))) => {
                    let strip = |s: &str| s.split('(').next().unwrap_or(s).to_string();
                    members.push((ty.to_string(), strip(member), strip(new)));
                }
                _ => types.push((from.split('<').next().unwrap_or(from).to_string(), to.to_string())),
            }
        }
        Renames { types, members }
    })
}

/// A Bloom type's Swift name, its arguments `args` already Swift (`Task<T>` is
/// `Task<T, any Error>`, `Codec<T>` is `T.Type`).
fn renamed_type(name: &str, args: &[String]) -> Option<String> {
    let (_, to) = renames().types.iter().find(|(from, _)| from == name)?;
    Some(match (to.as_str(), args) {
        ("T.Type", [t]) => format!("{t}.Type"),
        (to, [t]) if to.contains("<T") => to.replace("<T", &format!("<{t}")),
        (to, _) => {
            let base = to.split('<').next().unwrap_or(to).to_string();
            if args.is_empty() { base } else { format!("{base}<{}>", args.join(", ")) }
        }
    })
}

/// A member's Swift name on a receiver of Bloom type `ty`.
pub(crate) fn renamed_member(ty: &str, member: &str) -> Option<&'static str> {
    let ty = ty.trim_end_matches('?');
    renames().members.iter().find(|(t, m, _)| t == ty && m == member).map(|(_, _, new)| new.as_str())
}

/// The SwiftUI declarations an emitted file with views imports, one by one.
const SWIFTUI_IMPORTS: &[&str] = &[
    "protocol SwiftUI.View",
    "struct SwiftUI.ViewBuilder",
    "struct SwiftUI.State",
    "struct SwiftUI.Binding",
    "struct SwiftUI.Bindable",
    "struct SwiftUI.Environment",
    "struct SwiftUI.EnvironmentValues",
    "protocol SwiftUI.EnvironmentKey",
    "protocol SwiftUI.ViewModifier",
    "protocol SwiftUI.DynamicProperty",
    "struct SwiftUI.EmptyView",
    "struct SwiftUI.AnyView",
    "struct SwiftUI.ForEach",
    "struct SwiftUI.Group",
    "struct SwiftUI.Spacer",
];

/// `AsyncStream.make()`: a renamed type named as a value (its statics).
/// A renamed type named as a value (`AsyncStream.make()`, `Set.of(xs)`).
pub(crate) fn value_rename(name: &str) -> Option<String> {
    renamed_type(name, &[]).filter(|to| !to.contains('.') && name != "Character")
}

pub fn emit(program: &Program) -> Result<Vec<Emitted>, Vec<Problem>> {
    let (out, problems) = emit_all(program);
    if problems.is_empty() { Ok(out) } else { Err(problems) }
}

/// Every file, with the constructs not covered beside them (an uncovered construct is a
/// `fatal("unsupported")` in its place): what the golden tests record.
pub fn emit_all(program: &Program) -> (Vec<Emitted>, Vec<Problem>) {
    let mut out = Vec::new();
    let mut problems = Vec::new();
    let modules: Vec<String> = program.modules.iter().map(|m| m.name.clone()).collect();
    let sendable = sendable_types(program);
    let witnesses = Witnesses::of(program);
    let hooks = hook_functions(program);
    for module in &program.modules {
        for file in &module.files {
            let mut e = Emitter::new(&program.decls, file, &sendable);
            e.program_witnesses = Some(&witnesses);
            e.hooks = Some(&hooks);
            if program.islands.iter().any(|i| i == &module.name) {
                e.island = Some(&module.name);
            }
            let text = e.file(&module.name, &modules);
            problems.extend(e.problems);
            let stem = file.path.file_stem().unwrap_or_default().to_string_lossy().into_owned();
            out.push(Emitted {
                path: PathBuf::from("Sources").join(&module.name).join(format!("{stem}.swift")),
                text,
            });
        }
    }
    (out, problems)
}

/// What a block of statements is emitted as.
#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub(crate) enum Mode {
    /// A body whose last expression is its value: `return` is written.
    Value,
    /// Statements whose values are dropped.
    Unit,
    /// A view builder: each expression is a view.
    View,
}

pub(crate) struct Emitter<'a> {
    pub(crate) decls: &'a Decls,
    /// The program's value types Swift can send across actors (see [`sendable_types`]).
    sendable_types: &'a HashSet<String>,
    pub(crate) file: &'a SourceFile,
    pub(crate) problems: Vec<Problem>,
    /// What the file uses that needs an import beyond `Bloom` and `BloomUI`.
    pub(crate) uses_observation: bool,
    /// The indentation of the statement being emitted (for closures inside it).
    pub(crate) indent: usize,
    /// The program's public types and protocols (see [`Witnesses`]).
    program_witnesses: Option<&'a Witnesses>,
    /// Inside a public type: the requirements of the public protocols it conforms to, whose
    /// witnesses Swift wants public.
    pub(crate) witness_names: HashSet<String>,
    /// Inside a view's members.
    pub(crate) in_view: bool,
    /// The view being emitted's view-builder props (`let rows: () -> View`): name, type
    /// parameter, function type.
    pub(crate) view_builders: Vec<(String, String, String)>,
    /// The view being emitted's hook members (`let counter = useCounter(start)`): the stored
    /// hook's name and its construction, which the view's `init` assigns.
    pub(crate) view_hooks: Vec<(String, String)>,
    /// The program's hook functions (see [`hook_functions`]): each is a `DynamicProperty`.
    pub(crate) hooks: Option<&'a HashSet<String>>,
    /// Inside a task's body (`.task { }`, `Task { }`): a `catch` once the task is cancelled
    /// runs nothing (the cancellation stops the task, as the TypeScript backend's
    /// `if (signal.aborted) return`).
    pub(crate) in_task: bool,
    /// The file's module when it is hosted as an island (`Program::islands`).
    pub(crate) island: Option<&'a str>,
}

pub(crate) fn pad(indent: usize) -> String {
    "  ".repeat(indent)
}

impl<'a> Emitter<'a> {
    pub(crate) fn new(decls: &'a Decls, file: &'a SourceFile, sendable_types: &'a HashSet<String>) -> Self {
        Emitter {
            decls,
            file,
            sendable_types,
            problems: Vec::new(),
            uses_observation: false,
            indent: 0,
            program_witnesses: None,
            witness_names: HashSet::new(),
            in_view: false,
            view_builders: Vec::new(),
            view_hooks: Vec::new(),
            hooks: None,
            in_task: false,
            island: None,
        }
    }

    pub(crate) fn unsupported(&mut self, span: Span, what: impl Into<String>) -> String {
        self.problems.push(Problem {
            file: self.file.path.clone(),
            span,
            message: format!("swiftui: {} is not supported by this backend yet", what.into()),
        });
        "fatal(\"unsupported\")".into()
    }

    pub(crate) fn type_at(&self, span: Span) -> Option<&str> {
        self.file.types.get(&span).map(|s| s.as_str())
    }

    pub(crate) fn source_of(&self, span: Span) -> &str {
        let (s, e) = (span.start as usize, span.end as usize);
        self.file.source.get(s..e.min(self.file.source.len())).unwrap_or("")
    }

    fn file(&mut self, module: &str, modules: &[String]) -> String {
        let mut body = String::new();
        let items = self.file.ast.items.clone();
        for item in &items {
            let text = self.item(item);
            if !text.is_empty() {
                body.push_str(&self.docs(item.span));
                body.push_str(&text);
                body.push('\n');
            }
            // An island module's view named after it: the island host's entry, beside it.
            if let ItemKind::View(v) = &item.kind
                && self.island == Some(module)
                && v.name.name == module
            {
                body.push_str(&self.island_entry(v));
                body.push('\n');
            }
        }
        let mut out = String::new();
        let name = self.file.path.file_name().unwrap_or_default().to_string_lossy().into_owned();
        let _ = writeln!(out, "// Generated by bloom-native --target swiftui from {name}. Do not edit.\n");
        out.push_str("import Foundation\nimport Bloom\nimport BloomUI\n");
        // SwiftUI's own names the file means as SwiftUI means them, each imported alone: Swift 6
        // takes a type in a public signature only from a module the file imports, and a scoped
        // import leaves `Text`, `Image`, `Toggle`… BloomUI's (docs/native-runtime-api.mdx).
        if self.uses_swiftui() {
            for decl in SWIFTUI_IMPORTS {
                let _ = writeln!(out, "import {decl}");
            }
        }
        if self.uses_observation {
            out.push_str("import Observation\n");
        }
        // The file's `import Feed`: the package's other modules it reads.
        let mut imported = BTreeSet::new();
        for import in &self.file.ast.imports {
            if let ImportKind::Module(path) = &import.kind
                && let Some(first) = path.first()
                && modules.iter().any(|m| m == &first.name && m != module)
            {
                imported.insert(first.name.clone());
            }
        }
        for m in imported {
            let _ = writeln!(out, "import {m}");
        }
        out.push('\n');
        out.push_str(&body);
        out
    }

    /// Whether the file draws or binds: it declares a view or an environment key, or names
    /// `Binding`.
    fn uses_swiftui(&self) -> bool {
        self.file.ast.items.iter().any(|i| matches!(i.kind, ItemKind::View(_)))
            || self.file.source.contains("Binding")
            || self.file.source.contains("EnvironmentKey(")
            || self.file.source.contains("@Environment")
    }

    /// The `///` comments above `span`, kept.
    fn docs(&self, span: Span) -> String {
        let source = &self.file.source;
        let start = span.start as usize;
        let before = &source[..start.min(source.len())];
        let mut lines: Vec<&str> = Vec::new();
        for line in before.lines().rev().skip_while(|l| l.trim().is_empty() && false) {
            let t = line.trim();
            if t.starts_with("///") {
                lines.push(t);
            } else if t.starts_with('@') && lines.is_empty() {
                // An attribute line belongs to the item (`@Observable`).
                continue;
            } else {
                break;
            }
        }
        // `before` ends at the item's start, so its last line is the item's own indentation.
        if before.ends_with('\n') || before.is_empty() {
            lines.reverse();
            lines.iter().map(|l| format!("{l}\n")).collect()
        } else {
            String::new()
        }
    }

    /// Enters a type `name` conforming to `conforms`: its protocol witnesses' names.
    pub(crate) fn enter_type(&mut self, name: &str, public: bool, conforms: &[String]) -> HashSet<String> {
        let mut names = HashSet::new();
        let public = public || self.program_witnesses.is_some_and(|w| w.public_types.contains(name));
        if public {
            for c in conforms {
                let c = c.split('<').next().unwrap_or(c).trim();
                if let Some(reqs) = system_requirements(c) {
                    names.extend(reqs.iter().map(|r| r.to_string()));
                } else if let Some(w) = self.program_witnesses
                    && let Some((true, reqs)) = w.protocols.get(c)
                {
                    names.extend(reqs.iter().cloned());
                }
            }
        }
        std::mem::replace(&mut self.witness_names, names)
    }

    pub(crate) fn takes_view_children(&self, name: &str) -> bool {
        self.program_witnesses.is_some_and(|w| w.child_views.contains(name))
    }

    fn is_thrown(&self, name: &str) -> bool {
        self.program_witnesses.is_some_and(|w| w.thrown.contains(name))
    }

    /// A member's visibility: `public` when it witnesses a public protocol of a public type.
    pub(crate) fn member_visibility(&self, v: Visibility, name: &str) -> &'static str {
        if v == Visibility::Internal && self.witness_names.contains(name) {
            "public "
        } else {
            Self::visibility(v)
        }
    }

    pub(crate) fn visibility(v: Visibility) -> &'static str {
        match v {
            Visibility::Private => "private ",
            Visibility::Internal => "",
            Visibility::Public | Visibility::PubDefault => "public ",
        }
    }

    fn setter(m: &Modifiers) -> &'static str {
        match m.setter {
            Some((Visibility::Private, _)) => "private(set) ",
            Some((Visibility::Internal, _)) => "internal(set) ",
            _ => "",
        }
    }

    // ---- types -------------------------------------------------------------------------

    pub(crate) fn ty(&mut self, t: &TypeExpr) -> String {
        match &t.kind {
            TypeKind::Named { name, args } if name.name == "any" => {
                let inner: Vec<String> = args.iter().map(|a| self.ty(a)).collect();
                format!("any {}", inner.join(" & "))
            }
            TypeKind::Named { name, args } => {
                if name.name == "View" && self.source_of(t.span).trim_start().starts_with("some") {
                    return "some View".into();
                }
                let some =
                    if self.source_of(t.span).trim_start().starts_with("some ") { "some " } else { "" };
                let args: Vec<String> = args.iter().map(|a| self.ty(a)).collect();
                if let Some(swift) = renamed_type(&name.name, &args) {
                    return format!("{some}{swift}");
                }
                if args.is_empty() {
                    format!("{some}{}", name.name)
                } else {
                    format!("{some}{}<{}>", name.name, args.join(", "))
                }
            }
            TypeKind::List(inner) => format!("[{}]", self.ty(inner)),
            // Bloom's dictionaries and sets keep insertion order, as JavaScript's do, and it is
            // observable (iteration, `keys`, `Codable`): the standard library's ordered types.
            TypeKind::Map(k, v) => format!("OrderedDictionary<{}, {}>", self.ty(k), self.ty(v)),
            TypeKind::Optional(inner) => {
                let inner_text = self.ty(inner);
                if matches!(inner.kind, TypeKind::Fn { .. })
                    || inner_text.starts_with("any ")
                    || inner_text.starts_with("some ")
                {
                    format!("({inner_text})?")
                } else {
                    format!("{inner_text}?")
                }
            }
            TypeKind::Fn { is_async, params, ret } => {
                let params: Vec<String> = params.iter().map(|p| self.ty(p)).collect();
                let ret = self.ty(ret);
                let effects = match (*is_async, self.fn_type_throws(t.span)) {
                    (true, true) => " async throws",
                    (true, false) => " async",
                    (false, true) => " throws",
                    (false, false) => "",
                };
                format!("({}){effects} -> {ret}", params.join(", "))
            }
            // `P & Q`: Swift's own composition.
            TypeKind::Composition(items) => {
                let items: Vec<String> = items.iter().map(|i| self.ty(i)).collect();
                items.join(" & ")
            }
            TypeKind::Tuple(items) if items.is_empty() => "Void".into(),
            TypeKind::Tuple(items) => {
                let items: Vec<String> = items.iter().map(|i| self.ty(i)).collect();
                format!("({})", items.join(", "))
            }
            // A union of string literals is TypeScript-shaped data: a `String` here.
            TypeKind::Strings(_) => "String".into(),
            TypeKind::Record(_) => self
                .unsupported(t.span, "a structural record type")
                .replace("fatal(\"unsupported\")", "Never"),
            TypeKind::Error => "Never".into(),
        }
    }

    /// Whether the function type written at `span` throws. The tree drops a function type's
    /// `throws` (`(T) async throws -> U`), so it is read from the source between the
    /// parameters' `)` and the `->`, at the top level.
    fn fn_type_throws(&self, span: Span) -> bool {
        let text = self.source_of(span);
        let bytes = text.as_bytes();
        let mut depth = 0i32;
        let mut close = None;
        let mut i = 0;
        while i < bytes.len() {
            match bytes[i] {
                b'(' | b'[' | b'<' => depth += 1,
                b')' | b']' => {
                    depth -= 1;
                    if depth == 0 && close.is_none() {
                        close = Some(i);
                    }
                }
                b'>' if i > 0 && bytes[i - 1] == b'-' => {
                    if depth == 0 {
                        return close.is_some_and(|c| text[c + 1..i - 1].contains("throws"));
                    }
                }
                b'>' => depth -= 1,
                _ => {}
            }
            i += 1;
        }
        false
    }

    /// The type a parameter is declared with, `@escaping` when it is a function (a Bloom
    /// closure parameter may always be kept: stored, or captured by a `Task`).
    fn param_type(&mut self, t: &TypeExpr) -> String {
        let text = self.ty(t);
        if matches!(t.kind, TypeKind::Fn { .. }) { format!("@escaping {text}") } else { text }
    }

    fn generics(&mut self, generics: &[Ident], constraints: &[(Ident, TypeExpr)]) -> String {
        if generics.is_empty() {
            return String::new();
        }
        let items: Vec<String> = generics
            .iter()
            .map(|g| {
                let bounds: Vec<String> =
                    constraints.iter().filter(|(n, _)| n.name == g.name).map(|(_, t)| self.ty(t)).collect();
                if bounds.is_empty() { g.name.clone() } else { format!("{}: {}", g.name, bounds.join(" & ")) }
            })
            .collect();
        format!("<{}>", items.join(", "))
    }

    fn conformances(&mut self, list: &[TypeExpr]) -> Vec<String> {
        list.iter().map(|c| self.ty(c)).collect()
    }

    fn attrs(&mut self, m: &Modifiers, skip: &[&str]) -> String {
        let mut out = String::new();
        for a in &m.attrs {
            if skip.contains(&a.name.name.as_str()) {
                continue;
            }
            match a.name.name.as_str() {
                // Bloom's own: the TypeScript names of an extern, a model's store.
                "extern" | "Model" | "Attribute" | "main" | "deprecated" => continue,
                "MainActor" | "discardableResult" | "inlinable" | "Sendable" => {
                    let _ = write!(out, "@{} ", a.name.name);
                }
                "Observable" => {
                    self.uses_observation = true;
                    out.push_str("@Observable ");
                }
                _ => continue,
            }
        }
        out
    }

    // ---- items -------------------------------------------------------------------------

    fn item(&mut self, item: &Item) -> String {
        let vis = Self::visibility(item.visibility);
        match &item.kind {
            ItemKind::Struct(s) => self.struct_decl(vis, &item.modifiers, s),
            ItemKind::Enum(e) => self.enum_decl(vis, e),
            ItemKind::Fn(f) if self.is_hook(&f.name.name) => self.hook_struct(vis, f),
            ItemKind::Fn(f) => {
                let attrs = self.attrs(&item.modifiers, &[]);
                format!("{attrs}{}", self.func(vis, f, false, 0, None))
            }
            ItemKind::View(v) => self.view_decl(vis, v),
            ItemKind::Const(c) if self.environment_key(c).is_some() => {
                self.environment_key(c).unwrap_or_default()
            }
            // `public let RowAlias = Row`: another name of a type (a view's), a `typealias`.
            ItemKind::Const(c) if self.names_type(&c.value) => {
                let ExprKind::Name(n) = &c.value.kind else { unreachable!() };
                // Never more visible than the type it names (`public let Card = CardContent` of a
                // private view is private).
                let target =
                    self.file.ast.items.iter().find(|i| i.kind.name().name == *n).map(|i| i.visibility);
                let vis = match target {
                    Some(Visibility::Private) => "private ",
                    Some(Visibility::Internal) if vis == "public " => "",
                    _ => vis,
                };
                format!("{vis}typealias {} = {}\n", kw(&c.name.name), kw(n))
            }
            ItemKind::Const(c) => {
                let ty = c.ty.as_ref().map(|t| format!(": {}", self.ty(t))).unwrap_or_default();
                let value = self.expr_value(&c.value, 0);
                // A module-level value Swift cannot prove `Sendable` (a closure): Bloom code runs
                // on the main actor, as a view's does.
                // `private var x = …` at module level is a `ConstDecl` too: its word is the source's.
                let word = if self.source_of(item.span).split_whitespace().any(|w| w == "var") {
                    "var"
                } else {
                    "let"
                };
                // A module-level `var` is shared mutable state Swift 6 will not let a nonisolated
                // function touch: Bloom code runs on the main actor, so it is unchecked.
                let unsafe_global = match &c.ty {
                    _ if word == "var" => "nonisolated(unsafe) ",
                    Some(t) if !sendable_ty(t, self.sendable_types, 0) => "nonisolated(unsafe) ",
                    _ => "",
                };
                format!("{unsafe_global}{vis}{word} {}{ty} = {value}\n", kw(&c.name.name))
            }
            ItemKind::Extension(x) => self.extension(x),
            ItemKind::Alias(a) => {
                let ty = self.ty(&a.ty);
                let generics = self.generics(&a.generics, &[]);
                format!("{vis}typealias {}{generics} = {ty}\n", a.name.name)
            }
            ItemKind::Protocol(p) => self.protocol(vis, p),
            ItemKind::Class(c) => self.class(vis, &item.modifiers, c),
            ItemKind::Extern(x) if x.native => self.extern_native(vis, x),
            ItemKind::Extern(x) => {
                self.unsupported(
                    x.package.span,
                    "an `extern module` (a TypeScript or npm module has no native side)",
                );
                String::new()
            }
            // `test "…" { }` runs on the TypeScript backend (`bloom test`).
            ItemKind::Test(_) => String::new(),
        }
    }

    /// `public let session = EnvironmentKey("session", default: Session.signedOut)`: a key
    /// of SwiftUI's environment (`@Environment(\.session)` reads it).
    fn environment_key(&mut self, c: &ConstDecl) -> Option<String> {
        let ExprKind::Call(call) = &c.value.kind else { return None };
        let ExprKind::Name(n) = &call.callee.kind else { return None };
        if n != "EnvironmentKey" {
            return None;
        }
        let default = call.args.iter().find(|a| a.label.as_ref().is_some_and(|l| l.name == "default"))?;
        let ty = self.type_at(default.value.span).map(|t| self.swift_type_text(t))?;
        let value = self.expr(&default.value);
        let name = kw(&c.name.name);
        let key = format!("{}EnvironmentKey", crate::upper_first(&c.name.name));
        Some(format!(
            "public struct {key}: EnvironmentKey {{\n  public static let defaultValue: {ty} = {value}\n}}\n\nextension EnvironmentValues {{\n  public var {name}: {ty} {{\n    get {{ self[{key}.self] }}\n    set {{ self[{key}.self] = newValue }}\n  }}\n}}\n"
        ))
    }

    /// Whether every one of `tys` is a value Swift can send across actors, so the type is
    /// declared `Sendable` (a public struct is not inferred so).
    fn sendable(&self, tys: &[&TypeExpr], _depth: usize) -> bool {
        tys.iter().all(|t| sendable_ty(t, self.sendable_types, 0))
    }

    fn struct_decl(&mut self, vis: &str, modifiers: &Modifiers, s: &StructDecl) -> String {
        let attrs = self.attrs(modifiers, &[]);
        let generics = self.generics(&s.generics, &[]);
        let mut conforms = s.surface.as_ref().map(|b| self.conformances(&b.conformances)).unwrap_or_default();
        let field_tys: Vec<&TypeExpr> = s.fields.iter().map(|f| &f.ty).collect();
        if self.is_thrown(&s.name.name) && !conforms.iter().any(|c| c == "Error") {
            conforms.insert(0, "Error".into());
        }
        if s.generics.is_empty() && self.sendable(&field_tys, 0) && !conforms.iter().any(|c| c == "Sendable")
        {
            conforms.push("Sendable".into());
        }
        // `==` on two structs is structural in Bloom: a struct of values is `Equatable`.
        if s.generics.is_empty()
            && self.sendable(&field_tys, 0)
            && !conforms.iter().any(|c| c == "Equatable" || c == "Hashable")
        {
            conforms.push("Equatable".into());
        }
        let head = if conforms.is_empty() { String::new() } else { format!(": {}", conforms.join(", ")) };
        let saved = self.enter_type(&s.name.name, !vis.is_empty() && vis != "private ", &conforms);
        let mut out = format!("{attrs}{vis}struct {}{generics}{head} {{\n", kw(&s.name.name));
        let members: Vec<TypeMember> = s.surface.as_ref().map(|b| b.members.clone()).unwrap_or_default();
        let has_init =
            members.iter().any(|m| matches!(&m.kind, TypeMemberKind::Func(f) if f.name.name == "init"));
        // The stored properties, without their defaults: those are the `init`'s.
        if s.surface.is_some() {
            for m in &members {
                if let TypeMemberKind::Stored { mutable, name, ty, value } = &m.kind
                    && !m.modifiers.is_static
                {
                    let mvis = self.member_visibility(m.visibility, &name.name);
                    let setter = Self::setter(&m.modifiers);
                    let word = if *mutable { "var" } else { "let" };
                    let ty_text = ty.as_ref().map(|t| format!(": {}", self.ty(t))).unwrap_or_default();
                    // A user's `init` assigns the fields itself; a default stays on the field then.
                    let default = match (has_init, value) {
                        (true, Some(v)) => format!(" = {}", self.expr_value(v, 1)),
                        _ => String::new(),
                    };
                    let _ = writeln!(out, "  {mvis}{setter}{word} {}{ty_text}{default}", kw(&name.name));
                }
            }
        } else {
            for f in &s.fields {
                let ty = self.ty(&f.ty);
                let _ = writeln!(out, "  {vis}let {}: {ty}", kw(&f.name.name));
            }
        }
        if !has_init && !s.fields.is_empty() {
            out.push_str(&self.memberwise_init(vis, &s.fields));
        } else if !has_init && s.fields.is_empty() && !vis.is_empty() {
            let _ = writeln!(out, "\n  {vis}init() {{}}");
        }
        let decodes = conforms.iter().any(|c| c == "Codable" || c == "Decodable");
        let encodes = conforms.iter().any(|c| c == "Codable" || c == "Encodable");
        let transparent = self
            .file
            .checked
            .defs
            .iter()
            .enumerate()
            .any(|(id, d)| *d.name == *s.name.name && self.file.checked.transparent.contains(&id));
        if transparent && let [field] = s.fields.as_slice() {
            // `@Transparent`: the value is its one field, on the wire too (`"u1"`, not
            // `{"raw":"u1"}`), as the TypeScript backend's `type UserID = string` is.
            let name = kw(&field.name.name);
            let ty = self.ty(&field.ty);
            if decodes {
                let _ = write!(
                    out,
                    "\n  {vis}init(from decoder: any Decoder) throws {{\n    self.{name} = try decoder.singleValueContainer().decode({ty}.self)\n  }}\n"
                );
            }
            if encodes {
                let _ = write!(
                    out,
                    "\n  {vis}func encode(to encoder: any Encoder) throws {{\n    var c = encoder.singleValueContainer()\n    try c.encode({name})\n  }}\n"
                );
            }
        } else if decodes && !has_init && s.fields.iter().any(|f| f.default.is_some()) {
            out.push_str(&self.decoding_init(vis, &s.fields));
        }
        for m in &members {
            if matches!(&m.kind, TypeMemberKind::Stored { .. }) && !m.modifiers.is_static {
                continue;
            }
            out.push_str(&self.type_member(m, 1, false));
        }
        out.push_str("}\n");
        self.witness_names = saved;
        out
    }

    /// `init(from:)` for a `Codable` struct whose fields have defaults: a missing key takes the
    /// default, as Bloom's derived decoder does (Swift's synthesized one requires every key).
    /// Encoding stays Swift's synthesized one (an absent optional is left out).
    fn decoding_init(&mut self, vis: &str, fields: &[Field]) -> String {
        let mut out = format!(
            "\n  {vis}init(from decoder: any Decoder) throws {{\n    let c = try decoder.container(keyedBy: CodingKeys.self)\n"
        );
        for f in fields {
            let name = kw(&f.name.name);
            let (inner, optional) = match &f.ty.kind {
                TypeKind::Optional(t) => (self.ty(t), true),
                _ => (self.ty(&f.ty), false),
            };
            let line = match (&f.default, optional) {
                (Some(d), _) => format!(
                    "try c.decodeIfPresent({inner}.self, forKey: .{name}) ?? {}",
                    self.expr_value(d, 2)
                ),
                (None, true) => format!("try c.decodeIfPresent({inner}.self, forKey: .{name})"),
                (None, false) => format!("try c.decode({inner}.self, forKey: .{name})"),
            };
            let _ = writeln!(out, "    self.{name} = {line}");
        }
        out.push_str("  }\n");
        out
    }

    /// `init(id: String, likes: Int = 0)`: Bloom's memberwise construction, every field
    /// labelled by its name, a default where the field has one.
    fn memberwise_init(&mut self, vis: &str, fields: &[Field]) -> String {
        let vis =
            if vis == "public " && fields.iter().any(|f| self.names_internal(&f.ty)) { "" } else { vis };
        let params: Vec<String> = fields
            .iter()
            .map(|f| {
                let ty = self.param_type(&f.ty);
                // An optional field with no default is `none` when left out (as on every backend).
                let default = match (&f.default, &f.ty.kind) {
                    (Some(d), _) => format!(" = {}", self.expr_value(d, 2)),
                    (None, TypeKind::Optional(_)) => " = nil".to_string(),
                    (None, _) => String::new(),
                };
                format!("{}: {ty}{default}", kw(&f.name.name))
            })
            .collect();
        let mut out = format!("\n  {vis}init({}) {{\n", params.join(", "));
        for f in fields {
            let _ = writeln!(out, "    self.{} = {}", kw(&f.name.name), kw(&f.name.name));
        }
        out.push_str("  }\n");
        out
    }

    fn enum_decl(&mut self, vis: &str, e: &EnumDecl) -> String {
        let generics = self.generics(&e.generics, &[]);
        let mut conforms = self.conformances(&e.conformances);
        // A case-only `Codable` enum is its case's name on the wire (Bloom's derived codec).
        if e.variants.iter().all(|v| v.payload.is_empty())
            && conforms.iter().any(|c| matches!(c.as_str(), "Codable" | "Encodable" | "Decodable"))
        {
            conforms
                .retain(|c| !matches!(c.as_str(), "Codable" | "Encodable" | "Decodable" | "CaseIterable"));
            conforms.insert(0, "BloomCaseCodable".into());
        }
        let payload_tys: Vec<&TypeExpr> =
            e.variants.iter().flat_map(|v| v.payload.iter().map(|p| &p.ty)).collect();
        let recursive = payload_tys.iter().any(|t| self.mentions(t, &e.name.name));
        // An `indirect` enum's payloads name itself: values all the same, so it is `Sendable` and
        // `Equatable` when the rest of its payloads are.
        let mut known = self.sendable_types.clone();
        known.insert(e.name.name.clone());
        let values = payload_tys.iter().all(|t| sendable_ty(t, &known, 0));
        if e.generics.is_empty() && values && !conforms.iter().any(|c| c == "Sendable") {
            conforms.push("Sendable".into());
        }
        if e.generics.is_empty()
            && values
            && !conforms.iter().any(|c| c == "Equatable" || c == "Hashable" || c == "BloomCaseCodable")
        {
            conforms.push("Equatable".into());
        }
        if self.is_thrown(&e.name.name) && !conforms.iter().any(|c| c == "Error") {
            conforms.insert(0, "Error".into());
        }
        let head = if conforms.is_empty() { String::new() } else { format!(": {}", conforms.join(", ")) };
        let indirect = if recursive { "indirect " } else { "" };
        let saved = self.enter_type(&e.name.name, vis == "public ", &conforms);
        let mut out = format!("{vis}{indirect}enum {}{generics}{head} {{\n", kw(&e.name.name));
        for v in &e.variants {
            if v.payload.is_empty() {
                let _ = writeln!(out, "  case {}", kw(&v.name.name));
            } else {
                let items: Vec<String> = v
                    .payload
                    .iter()
                    .map(|p| match &p.name {
                        Some(n) => format!("{}: {}", label(&n.name), self.ty(&p.ty)),
                        None => self.ty(&p.ty),
                    })
                    .collect();
                let _ = writeln!(out, "  case {}({})", kw(&v.name.name), items.join(", "));
            }
        }
        for m in &e.members {
            out.push_str(&self.type_member(m, 1, false));
        }
        out.push_str("}\n");
        self.witness_names = saved;
        if conforms.iter().any(|c| c == "Routable") {
            out.push_str(&self.route_table(vis, e));
        }
        out
    }

    /// `enum Route: Routable`: what the router reads of it (the standard library's
    /// `Routable`), derived at compile time as `bloom build` derives the TS route table: the
    /// first case is the root, each case a route, its associated values its parameters.
    fn route_table(&mut self, vis: &str, e: &EnumDecl) -> String {
        let name = kw(&e.name.name);
        let label = |i: usize, p: &Payload| p.name.as_ref().map(|n| n.name.clone()).unwrap_or(format!("{i}"));
        let root = e.variants.first().map(|v| v.name.name.clone()).unwrap_or_default();
        let routes: Vec<String> = e
            .variants
            .iter()
            .map(|v| {
                let labels: Vec<String> =
                    v.payload.iter().enumerate().map(|(i, p)| format!("{:?}", label(i, p))).collect();
                format!("{:?}: [{}]", v.name.name, labels.join(", "))
            })
            .collect();
        let mut tags = String::new();
        let mut values = String::new();
        let mut readers = String::new();
        for v in &e.variants {
            let case = kw(&v.name.name);
            let _ = writeln!(tags, "    case .{case}: {:?}", v.name.name);
            if v.payload.is_empty() {
                let _ = writeln!(values, "    case .{case}: []");
                let _ = writeln!(readers, "    case {:?}: return .{case}", v.name.name);
                continue;
            }
            let binds: Vec<String> = (0..v.payload.len()).map(|i| format!("let v{i}")).collect();
            let texts: Vec<String> =
                (0..v.payload.len()).map(|i| format!("String(describing: v{i})")).collect();
            let _ = writeln!(values, "    case .{case}({}): [{}]", binds.join(", "), texts.join(", "));
            // Each parameter read back by its type; a route whose parameter does not read is none.
            let mut guards = Vec::new();
            let mut args = Vec::new();
            for (i, p) in v.payload.iter().enumerate() {
                let key = format!("{:?}", label(i, p));
                let read = match crate::type_name(&p.ty).as_deref() {
                    Some("String") => format!("params[{key}]"),
                    Some("Int") => format!("params[{key}].flatMap {{ Int($0) }}"),
                    Some("Float" | "Double") => format!("params[{key}].flatMap {{ Double($0) }}"),
                    Some("Bool") => format!("params[{key}].flatMap {{ Bool($0) }}"),
                    _ => {
                        self.unsupported(
                            p.span,
                            "a route parameter that is not a String, Int, Double or Bool",
                        );
                        "nil as String?".into()
                    }
                };
                guards.push(format!("let v{i} = {read}"));
                match &p.name {
                    Some(n) => args.push(format!("{}: v{i}", label_of(&n.name))),
                    None => args.push(format!("v{i}")),
                }
            }
            let _ = writeln!(
                readers,
                "    case {:?}:\n      guard {} else {{ return nil }}\n      return .{case}({})",
                v.name.name,
                guards.join(", "),
                args.join(", ")
            );
        }
        format!(
            "\nextension {name} {{\n  {vis}static let routeTable = RouteTable(root: {root:?}, routes: [{}])\n\n  {vis}var routeTag: String {{\n    switch self {{\n{tags}    }}\n  }}\n\n  {vis}var routeValues: [String] {{\n    switch self {{\n{values}    }}\n  }}\n\n  {vis}static func route(tag: String, params: OrderedDictionary<String, String>) -> {name}? {{\n    switch tag {{\n{readers}    default: return nil\n    }}\n  }}\n}}\n",
            routes.join(", ")
        )
    }

    fn mentions(&self, t: &TypeExpr, name: &str) -> bool {
        match &t.kind {
            TypeKind::Named { name: n, args } => {
                n.name == name || args.iter().any(|a| self.mentions(a, name))
            }
            // An array or a dictionary is already a reference: no `indirect` needed for it.
            TypeKind::List(_) | TypeKind::Map(..) => false,
            TypeKind::Optional(i) => self.mentions(i, name),
            TypeKind::Tuple(items) => items.iter().any(|i| self.mentions(i, name)),
            _ => false,
        }
    }

    fn extension(&mut self, x: &ExtensionDecl) -> String {
        let conforms = self.conformances(&x.body.conformances);
        let head = if conforms.is_empty() { String::new() } else { format!(": {}", conforms.join(", ")) };
        let mut out = format!("extension {}{head} {{\n", x.name.name);
        let saved = self.enter_type(&x.name.name, false, &conforms);
        for m in &x.body.members {
            out.push_str(&self.type_member(m, 1, false));
        }
        out.push_str("}\n");
        self.witness_names = saved;
        out
    }

    fn protocol(&mut self, vis: &str, p: &ProtocolDecl) -> String {
        let inherits = self.conformances(&p.inherits);
        let head = if inherits.is_empty() { String::new() } else { format!(": {}", inherits.join(", ")) };
        let mut out = format!("{vis}protocol {}{head} {{\n", kw(&p.name.name));
        for r in &p.requirements {
            match r {
                Requirement::Property { name, ty, settable, is_static, .. } => {
                    let st = if *is_static { "static " } else { "" };
                    let access = if *settable { "{ get set }" } else { "{ get }" };
                    let ty = self.ty(ty);
                    let _ = writeln!(out, "  {st}var {}: {ty} {access}", kw(&name.name));
                }
                Requirement::Func { decl, is_static } => {
                    let st = if *is_static { "static " } else { "" };
                    let sig = self.signature(decl, false);
                    let _ = writeln!(out, "  {st}{sig}");
                }
            }
        }
        out.push_str("}\n");
        out
    }

    fn class(&mut self, vis: &str, modifiers: &Modifiers, c: &ClassDecl) -> String {
        let attrs = self.attrs(modifiers, &["Observable"]);
        let observable = if c.observable {
            self.uses_observation = true;
            "@Observable\n"
        } else {
            ""
        };
        let generics = self.generics(&c.generics, &[]);
        let conforms = self.conformances(&c.body.conformances);
        let head = if conforms.is_empty() { String::new() } else { format!(": {}", conforms.join(", ")) };
        let word = if c.actor {
            "actor"
        } else if modifiers.is_final {
            "final class"
        } else {
            "class"
        };
        let mut out = format!("{observable}{attrs}{vis}{word} {}{generics}{head} {{\n", kw(&c.name.name));
        let saved = self.enter_type(&c.name.name, vis == "public ", &conforms);
        for m in &c.body.members {
            out.push_str(&self.type_member(m, 1, true));
        }
        out.push_str("}\n");
        self.witness_names = saved;
        out
    }

    /// `extern native "BloomStorage" { func get(…) -> String? }`: on a native build the
    /// module is Swift. Its interface becomes a protocol the native side implements and
    /// registers (`BloomStorageNative.shared = …`), and each function calls it.
    fn extern_native(&mut self, vis: &str, x: &ExternModule) -> String {
        let name = &x.package.name;
        let mut proto = format!("{vis}protocol {name}Native: Sendable {{\n");
        let mut calls = String::new();
        for item in &x.items {
            let ItemKind::Fn(f) = &item.kind else { continue };
            let sig = self.signature(f, false);
            let _ = writeln!(proto, "  {sig}");
            let fvis = Self::visibility(item.visibility);
            let args: Vec<String> = f
                .params
                .iter()
                .map(|p| {
                    let info = crate::param_info(p, f.func);
                    match info.label {
                        Some(l) => format!("{l}: {}", kw(&p.name.name)),
                        None => kw(&p.name.name),
                    }
                })
                .collect();
            let prefix = match (f.is_async, f.throws.is_some()) {
                (true, true) => "try await ",
                (true, false) => "await ",
                (false, true) => "try ",
                (false, false) => "",
            };
            let _ = writeln!(
                calls,
                "{fvis}{sig} {{\n  {prefix}{name}NativeModule.shared.{}({})\n}}",
                kw(&f.name.name),
                args.join(", ")
            );
        }
        proto.push_str("}\n");
        let registry = format!(
            "/// Where the native side of `{name}` registers its implementation, at launch.\n{vis}enum {name}NativeModule {{\n  nonisolated(unsafe) {vis}static var shared: any {name}Native = Unregistered{name}()\n}}\n\nprivate struct Unregistered{name}: {name}Native {{\n{}}}\n",
            x.items
                .iter()
                .filter_map(|i| match &i.kind {
                    ItemKind::Fn(f) => Some(f.clone()),
                    _ => None,
                })
                .map(|f| format!(
                    "  {} {{ fatalError(\"{name}: no native implementation is registered\") }}\n",
                    self.signature(&f, false)
                ))
                .collect::<String>()
        );
        format!("{proto}\n{registry}\n{calls}")
    }

    /// A member of a struct, enum, extension or class.
    pub(crate) fn type_member(&mut self, m: &TypeMember, indent: usize, class: bool) -> String {
        let name = match &m.kind {
            TypeMemberKind::Func(f) => f.name.name.clone(),
            TypeMemberKind::Computed { name, .. } | TypeMemberKind::Stored { name, .. } => name.name.clone(),
            TypeMemberKind::Let(_) => String::new(),
        };
        let vis = self.member_visibility(m.visibility, &name);
        if name == "self" {
            self.unsupported(m.span, "a member named `self` (a TypeScript codec)");
            return String::new();
        }
        let p = pad(indent);
        let st = if m.modifiers.is_static { "static " } else { "" };
        match &m.kind {
            TypeMemberKind::Func(f) if f.name.name == "init" => {
                let params = self.params(&f.params, true);
                let throws = self.throws(f);
                let body = self.block(&f.body.stmts, indent + 1, Mode::Unit);
                format!("\n{p}{vis}init({params}){throws} {{\n{body}{p}}}\n")
            }
            TypeMemberKind::Func(f) => {
                let attrs = self.attrs(&m.modifiers, &[]);
                format!("\n{p}{attrs}{}", self.func(vis, f, m.modifiers.is_static, indent, None).trim_start())
            }
            TypeMemberKind::Computed { name, ty, body } => {
                let rt = self.ty(ty);
                let is_view = rt == "some View";
                let mode = if is_view { Mode::View } else { Mode::Value };
                let text = self.block(&body.stmts, indent + 1, mode);
                let builder = if is_view && body.stmts.len() > 1 { "@ViewBuilder " } else { "" };
                format!("\n{p}{builder}{vis}{st}var {}: {rt} {{\n{text}{p}}}\n", kw(&name.name))
            }
            TypeMemberKind::Stored { mutable, name, ty, value } => {
                let setter = Self::setter(&m.modifiers);
                let word = if *mutable { "var" } else { "let" };
                let ty_text = ty.as_ref().map(|t| format!(": {}", self.ty(t))).unwrap_or_default();
                let value = value
                    .as_ref()
                    .map(|v| format!(" = {}", self.expr_value(v, indent + 1)))
                    .unwrap_or_default();
                let _ = class;
                format!("{p}{vis}{setter}{st}{word} {}{ty_text}{value}\n", kw(&name.name))
            }
            TypeMemberKind::Let(l) => format!("{p}{}", self.let_stmt(l, indent).trim_start()),
        }
    }

    fn throws(&mut self, f: &FnDecl) -> String {
        match &f.throws {
            Some(Throws { ty: Some(t), .. }) => format!(" throws({})", self.ty(t)),
            Some(_) => " throws".into(),
            None => String::new(),
        }
    }

    pub(crate) fn params(&mut self, params: &[Param], func: bool) -> String {
        let mut out = Vec::new();
        for p in params {
            let info = crate::param_info(p, func);
            let name = kw(&p.name.name);
            let head = match &info.label {
                Some(l) if l == &p.name.name => name.clone(),
                Some(l) => format!("{} {name}", label(l)),
                None => format!("_ {name}"),
            };
            if p.spread || p.whole.is_some() {
                self.unsupported(p.span, "a spread parameter (TypeScript props)");
            }
            let ty = self.param_type(&p.ty);
            let rest = if p.rest { "..." } else { "" };
            let default =
                p.default.as_ref().map(|d| format!(" = {}", self.expr_value(d, 0))).unwrap_or_default();
            out.push(format!("{head}: {ty}{rest}{default}"));
        }
        out.join(", ")
    }

    /// `func name<T: P>(_ x: T) async throws -> R`, without the body.
    pub(crate) fn signature(&mut self, f: &FnDecl, view_builder: bool) -> String {
        let generics = self.generics(&f.generics, &f.constraints);
        let params = self.params(&f.params, f.func);
        let asynchronous = if f.is_async { " async" } else { "" };
        let throws = self.throws(f);
        let ret = match &f.ret {
            Some(t) => {
                let text = self.ty(t);
                let text = if text == "View" { "some View".to_string() } else { text };
                if text == "Void" { String::new() } else { format!(" -> {text}") }
            }
            None => String::new(),
        };
        let builder = if view_builder { "@ViewBuilder " } else { "" };
        let name = if f.name.name == "==" { "==".to_string() } else { kw(&f.name.name) };
        // A view is main-actor isolated; `Equatable`'s `==` is not, and reads only its props.
        let builder = if f.name.name == "==" && self.in_view {
            format!("{builder}nonisolated ")
        } else {
            builder.to_string()
        };
        let space = if name == "==" { " " } else { "" };
        format!("{builder}func {name}{space}{generics}({params}){asynchronous}{throws}{ret}")
    }

    /// Whether `e` names one of the program's types (`Row` in `let RowAlias = Row`).
    fn names_type(&self, e: &Expr) -> bool {
        let ExprKind::Name(n) = &e.kind else { return false };
        self.decls.views.contains_key(n)
            || self.decls.structs.contains_key(n)
            || self.decls.enums.contains_key(n)
            || self.decls.classes.contains(n)
    }

    /// Whether `t` names a type of the program that is not public (Swift will not let a public
    /// declaration name it; Bloom's module boundary does).
    pub(crate) fn names_internal(&self, t: &TypeExpr) -> bool {
        match &t.kind {
            TypeKind::Named { name, args } => {
                let declared = self.decls.structs.contains_key(&name.name)
                    || self.decls.enums.contains_key(&name.name)
                    || self.decls.classes.contains(&name.name)
                    || self.decls.views.contains_key(&name.name)
                    || self.decls.protocols.contains_key(&name.name);
                let public = self.program_witnesses.is_some_and(|w| w.public_types.contains(&name.name));
                (declared && !public) || args.iter().any(|a| self.names_internal(a))
            }
            TypeKind::List(i) | TypeKind::Optional(i) => self.names_internal(i),
            TypeKind::Map(k, v) => self.names_internal(k) || self.names_internal(v),
            TypeKind::Tuple(items) | TypeKind::Composition(items) => {
                items.iter().any(|i| self.names_internal(i))
            }
            TypeKind::Fn { params, ret, .. } => {
                params.iter().any(|p| self.names_internal(p)) || self.names_internal(ret)
            }
            _ => false,
        }
    }

    pub(crate) fn func(
        &mut self,
        vis: &str,
        f: &FnDecl,
        is_static: bool,
        indent: usize,
        _owner: Option<&str>,
    ) -> String {
        let internal = f.params.iter().any(|p| self.names_internal(&p.ty))
            || f.ret.as_ref().is_some_and(|t| self.names_internal(t));
        let vis = if vis == "public " && internal { "" } else { vis };
        let returns_view = f
            .ret
            .as_ref()
            .is_some_and(|t| matches!(&t.kind, TypeKind::Named { name, .. } if name.name == "View"));
        let branches = matches!(
            f.body.stmts.as_slice(),
            [Stmt { kind: StmtKind::Expr(Expr { kind: ExprKind::If(_) | ExprKind::Match(_), .. }), .. }]
        );
        let sig = self.signature(f, returns_view && (f.body.stmts.len() > 1 || branches));
        let returns = f.ret.as_ref().is_some_and(|t| !matches!(&t.kind, TypeKind::Tuple(items) if items.is_empty()))
            && !f.ret.as_ref().is_some_and(|t| matches!(&t.kind, TypeKind::Named { name, .. } if name.name == "Void" || name.name == "Unit"));
        let mode = if returns_view {
            Mode::View
        } else if returns {
            Mode::Value
        } else {
            Mode::Unit
        };
        let body = self.block(&f.body.stmts, indent + 1, mode);
        let p = pad(indent);
        let st = if is_static { "static " } else { "" };
        // An attribute comes before the declaration's modifiers (`@ViewBuilder public func`).
        let (attr, sig) = match sig.strip_prefix("@ViewBuilder ") {
            Some(rest) => ("@ViewBuilder ", rest.to_string()),
            None => ("", sig),
        };
        format!("{p}{attr}{vis}{st}{sig} {{\n{body}{p}}}\n")
    }
}

impl Emitter<'_> {
    /// `<Island>__island(props:emit:)` and `<Island>__register()`: what the iOS island host
    /// (`BloomIslands`, the `BloomIsland` Fabric view) draws, as Android's `<Island>__island`.
    /// `props` is the React Native side's JSON object of the view's props, each decoded by its
    /// type's `Codable` (a prop with a default takes it when absent); each event prop
    /// (`(T) -> Void`) emits its name and its value's JSON. A required prop that does not decode
    /// draws nothing (`nil`).
    fn island_entry(&mut self, v: &ViewDecl) -> String {
        let name = v.name.name.clone();
        let props: Vec<(Ident, TypeExpr, Option<Expr>)> = match v.surface.as_deref() {
            Some(surface) => surface
                .members
                .iter()
                .filter(|m| m.modifiers.attrs.is_empty())
                .filter_map(|m| match &m.kind {
                    TypeMemberKind::Stored { name, ty: Some(ty), value, .. } => {
                        Some((name.clone(), ty.clone(), value.clone()))
                    }
                    _ => None,
                })
                .collect(),
            None => {
                v.params.iter().flatten().map(|p| (p.name.clone(), p.ty.clone(), p.default.clone())).collect()
            }
        };
        let mut body = String::from(
            "  let json = (try? JSON.parse(props.isEmpty ? \"{}\" : props)) ?? jsonObject([:])\n",
        );
        let mut args = Vec::new();
        for (prop, ty, default) in &props {
            let n = kw(&prop.name);
            match &ty.kind {
                TypeKind::Fn { params, .. } => {
                    let emit = match params.as_slice() {
                        [] => format!("{{ emit(\"{}\", \"null\") }}", prop.name),
                        [_] => format!(
                            "{{ value in emit(\"{}\", JSON.stringify(encodeValue(value))) }}",
                            prop.name
                        ),
                        _ => self.unsupported(ty.span, "an island event with more than one value"),
                    };
                    args.push(format!("{n}: {emit}"));
                }
                _ => {
                    let swift = self.ty(ty);
                    let (inner, optional) = match &ty.kind {
                        TypeKind::Optional(i) => (self.ty(i), true),
                        _ => (swift.clone(), false),
                    };
                    let read = format!(
                        "json.read(\"{p}\").flatMap({{ try? decodeValue({inner}.self, from: $0, at: \"{name}.{p}\") }})",
                        p = prop.name
                    );
                    match (default, optional) {
                        (Some(d), _) => {
                            let d = self.expr_value(d, 1);
                            let _ = writeln!(body, "  let p_{} = {read} ?? {d}", prop.name);
                        }
                        (None, true) => {
                            let _ = writeln!(body, "  let p_{} = {read}", prop.name);
                        }
                        (None, false) => {
                            let _ =
                                writeln!(body, "  guard let p_{} = {read} else {{ return nil }}", prop.name);
                        }
                    }
                    args.push(format!("{n}: p_{}", prop.name));
                }
            }
        }
        format!(
            "/// The island host's entry for `{name}` (`BloomIslands`): its props decoded from `props`, its events to `emit`.\n@MainActor public func {name}__island(props: String, emit: @escaping (String, String) -> Void) -> AnyView? {{\n{body}  return AnyView({name}({}))\n}}\n\n/// Registers `{name}` with the island host (at launch, before React Native mounts it).\n@MainActor public func {name}__register() {{\n  BloomIslands.register(\"{name}\", {name}__island)\n}}\n",
            args.join(", ")
        )
    }
}

/// The program's public types, and its protocols' requirements by name (with whether the
/// protocol is public): a public type's witness of a public protocol is public in Swift.
pub(crate) struct Witnesses {
    public_types: HashSet<String>,
    /// The types a function throws (`throws(APIError)`): Swift throws only an `Error`.
    pub(crate) thrown: HashSet<String>,
    /// The views with a view-typed prop (`let content: View`): their trailing closure draws.
    pub(crate) child_views: HashSet<String>,
    protocols: std::collections::HashMap<String, (bool, Vec<String>)>,
}

impl Witnesses {
    fn of(program: &Program) -> Witnesses {
        let mut public_types = HashSet::new();
        let mut protocols = std::collections::HashMap::new();
        let mut thrown = HashSet::new();
        let mut child_views = HashSet::new();
        fn note(thrown: &mut HashSet<String>, f: &FnDecl) {
            if let Some(Throws { ty: Some(t), .. }) = &f.throws
                && let Some(n) = crate::type_name(t)
            {
                thrown.insert(n);
            }
        }
        for item in program.modules.iter().flat_map(|m| m.files.iter()).flat_map(|f| f.ast.items.iter()) {
            let public = matches!(item.visibility, Visibility::Public | Visibility::PubDefault);
            match &item.kind {
                ItemKind::View(v) => {
                    let viewish = |t: &TypeExpr| match &t.kind {
                        TypeKind::Named { name, .. } => name.name == "View",
                        TypeKind::Optional(i) => {
                            matches!(&i.kind, TypeKind::Named { name, .. } if name.name == "View")
                        }
                        _ => false,
                    };
                    if v.params.iter().flatten().any(|p| viewish(&p.ty)) {
                        child_views.insert(v.name.name.clone());
                    }
                }
                ItemKind::Fn(f) => note(&mut thrown, f),
                ItemKind::Struct(StructDecl { surface: Some(b), .. }) => {
                    for m in &b.members {
                        if let TypeMemberKind::Func(f) = &m.kind {
                            note(&mut thrown, f);
                        }
                    }
                }
                ItemKind::Extension(ExtensionDecl { body: b, .. }) => {
                    for m in &b.members {
                        if let TypeMemberKind::Func(f) = &m.kind {
                            note(&mut thrown, f);
                        }
                    }
                }
                ItemKind::Class(c) => {
                    for m in &c.body.members {
                        if let TypeMemberKind::Func(f) = &m.kind {
                            note(&mut thrown, f);
                        }
                    }
                }
                _ => {}
            }
            if let ItemKind::Protocol(p) = &item.kind {
                let reqs = p.requirements.iter().map(|r| r.name().name.clone()).collect();
                protocols.insert(p.name.name.clone(), (public, reqs));
            }
            if public && !matches!(item.kind, ItemKind::Fn(_) | ItemKind::Const(_) | ItemKind::Extension(_)) {
                public_types.insert(item.kind.name().name.clone());
            }
        }
        for file in program.modules.iter().flat_map(|m| m.files.iter()) {
            let mut spans = Vec::new();
            for item in &file.ast.items {
                throw_sites_item(item, &mut spans);
            }
            for span in spans {
                if let Some(t) = file.types.get(&span) {
                    thrown.insert(t.trim_end_matches('?').to_string());
                }
            }
        }
        Witnesses { public_types, thrown, child_views, protocols }
    }
}

/// The spans of every `throw`'s value in `item` (their types must be `Error`s in Swift).
fn throw_sites_item(item: &Item, out: &mut Vec<Span>) {
    let fns: Vec<&FnDecl> = match &item.kind {
        ItemKind::Fn(f) => vec![f],
        ItemKind::Struct(StructDecl { surface: Some(b), .. }) => funcs_of(&b.members),
        ItemKind::Extension(x) => funcs_of(&x.body.members),
        ItemKind::Class(c) => funcs_of(&c.body.members),
        ItemKind::Enum(e) => funcs_of(&e.members),
        ItemKind::View(v) => v
            .members
            .iter()
            .filter_map(|m| match m {
                Member::Fn(f) => Some(f),
                _ => None,
            })
            .collect(),
        _ => Vec::new(),
    };
    for f in fns {
        throw_sites(&f.body.stmts, out);
    }
}

fn funcs_of(members: &[TypeMember]) -> Vec<&FnDecl> {
    members
        .iter()
        .filter_map(|m| match &m.kind {
            TypeMemberKind::Func(f) => Some(f),
            _ => None,
        })
        .collect()
}

fn throw_sites(stmts: &[Stmt], out: &mut Vec<Span>) {
    for s in stmts {
        match &s.kind {
            StmtKind::Throw(e) => out.push(e.span),
            StmtKind::Defer(b) => throw_sites(&b.stmts, out),
            StmtKind::While(w) => throw_sites(&w.body.stmts, out),
            StmtKind::For(f) => throw_sites(&f.body.stmts, out),
            StmtKind::Guard(g) => throw_sites(&g.otherwise.stmts, out),
            StmtKind::Do(d) => {
                throw_sites(&d.body.stmts, out);
                for c in &d.catches {
                    throw_sites(&c.body.stmts, out);
                }
            }
            StmtKind::Expr(e) => throw_sites_expr(e, out),
            _ => {}
        }
    }
}

fn throw_sites_expr(e: &Expr, out: &mut Vec<Span>) {
    match &e.kind {
        ExprKind::If(i) => {
            throw_sites(&i.then.stmts, out);
            match i.otherwise.as_deref() {
                Some(Else::Block(b)) => throw_sites(&b.stmts, out),
                Some(Else::If(x)) => throw_sites_expr(x, out),
                None => {}
            }
        }
        ExprKind::Match(m) => {
            for arm in &m.arms {
                match &arm.body {
                    ArmBody::Block(b) => throw_sites(&b.stmts, out),
                    ArmBody::Expr(x) => throw_sites_expr(x, out),
                }
            }
        }
        ExprKind::Closure(c) => throw_sites(&c.body, out),
        ExprKind::Task(b) => throw_sites(&b.stmts, out),
        _ => {}
    }
}

/// The requirements of Swift's own protocols a Bloom type conforms to.
fn system_requirements(protocol: &str) -> Option<&'static [&'static str]> {
    Some(match protocol {
        "View" | "ViewModifier" | "Screen" => &["body"],
        "Equatable" => &["=="],
        "Hashable" => &["==", "hash", "hashValue"],
        "Comparable" => &["<", "=="],
        "Identifiable" => &["id"],
        "Codable" | "Encodable" | "Decodable" => &["init", "encode"],
        "CustomStringConvertible" => &["description"],
        "Error" | "Sendable" | "CaseIterable" => &["allCases"],
        "Routable" => &["path", "init"],
        _ => return None,
    })
}

fn sendable_ty(t: &TypeExpr, known: &HashSet<String>, depth: usize) -> bool {
    if depth > 8 {
        return false;
    }
    match &t.kind {
        TypeKind::Named { name, args } => {
            let base = matches!(
                name.name.as_str(),
                "Bool"
                    | "Int"
                    | "Float"
                    | "Double"
                    | "String"
                    | "Character"
                    | "Date"
                    | "Duration"
                    | "URL"
                    | "UniqueID"
                    | "JSONValue"
                    | "Set"
            ) || known.contains(&name.name);
            base && args.iter().all(|a| sendable_ty(a, known, depth + 1))
        }
        TypeKind::List(i) | TypeKind::Optional(i) => sendable_ty(i, known, depth + 1),
        TypeKind::Map(k, v) => sendable_ty(k, known, depth + 1) && sendable_ty(v, known, depth + 1),
        TypeKind::Tuple(items) => items.iter().all(|i| sendable_ty(i, known, depth + 1)),
        TypeKind::Strings(_) => true,
        _ => false,
    }
}

/// The program's non-generic structs and enums whose every field (payload) is `Sendable`,
/// to a fixed point (a `Post` of `Author`s is, once `Author` is).
fn sendable_types(program: &Program) -> HashSet<String> {
    let mut known = HashSet::new();
    loop {
        let before = known.len();
        for item in program.modules.iter().flat_map(|m| m.files.iter()).flat_map(|f| f.ast.items.iter()) {
            match &item.kind {
                // A type whose fields name itself (`children: [Tree]`) is a value all the same.
                ItemKind::Struct(s) if s.generics.is_empty() => {
                    let mut with = known.clone();
                    with.insert(s.name.name.clone());
                    if s.fields.iter().all(|f| sendable_ty(&f.ty, &with, 0)) {
                        known.insert(s.name.name.clone());
                    }
                }
                ItemKind::Enum(e) if e.generics.is_empty() => {
                    let mut with = known.clone();
                    with.insert(e.name.name.clone());
                    if e.variants.iter().flat_map(|v| v.payload.iter()).all(|p| sendable_ty(&p.ty, &with, 0))
                    {
                        known.insert(e.name.name.clone());
                    }
                }
                _ => {}
            }
        }
        if known.len() == before {
            return known;
        }
    }
}
