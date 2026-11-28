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
//! | a `String`'s `count` | `utf16.count` (Bloom's string offsets are UTF-16, as on every backend) |
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
mod nodes;
pub mod project;
mod stmt;
mod view;

use std::collections::{BTreeSet, HashSet};
use std::fmt::Write as _;
use std::path::PathBuf;

use bloom_lang::ast::*;

use crate::{Decls, Emitted, Problem, Program, SourceFile, escape};

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

/// An argument label: Swift takes every keyword as one but `inout`, `var` and `let`.
pub(crate) fn label(name: &str) -> String {
    escape(name, &["inout", "var", "let"])
}

/// The standard library's Bloom types that are Swift's own under another name. The Bloom
/// standard library maps onto Swift's types where it can (`Date` is Foundation's, `Duration`
/// and `Task` are Swift's); these are the ones whose Bloom value is a Swift type's member.
const TYPE_RENAMES: &[(&str, &str)] = &[
    // `ContinuousClock.now` is Bloom's instant of the clock: Swift's `ContinuousClock.Instant`.
    ("ContinuousClock", "ContinuousClock.Instant"),
    // A broadcast channel (`make`/`yield`/`finish`/`subscribe`), not Swift's single-consumer
    // `AsyncStream`.
    ("AsyncStream", "BloomAsyncStream"),
    ("Float", "Double"),
    ("Character", "String"),
    ("Unit", "Void"),
];

/// `AsyncStream.make()`: a renamed type named as a value (its statics).
const VALUE_RENAMES: &[(&str, &str)] = &[("AsyncStream", "BloomAsyncStream")];

pub fn emit(program: &Program) -> Result<Vec<Emitted>, Vec<Problem>> {
    let mut out = Vec::new();
    let mut problems = Vec::new();
    let modules: Vec<String> = program.modules.iter().map(|m| m.name.clone()).collect();
    let sendable = sendable_types(program);
    let witnesses = Witnesses::of(program);
    for module in &program.modules {
        for file in &module.files {
            let mut e = Emitter::new(&program.decls, file, &sendable);
            e.program_witnesses = Some(&witnesses);
            let text = e.file(&module.name, &modules);
            problems.extend(e.problems);
            let stem = file.path.file_stem().unwrap_or_default().to_string_lossy().into_owned();
            out.push(Emitted { path: PathBuf::from("Sources").join(&module.name).join(format!("{stem}.swift")), text });
        }
    }
    if problems.is_empty() { Ok(out) } else { Err(problems) }
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
}

pub(crate) fn pad(indent: usize) -> String {
    "  ".repeat(indent)
}

impl<'a> Emitter<'a> {
    pub(crate) fn new(decls: &'a Decls, file: &'a SourceFile, sendable_types: &'a HashSet<String>) -> Self {
        Emitter { decls, file, sendable_types, problems: Vec::new(), uses_observation: false, indent: 0, program_witnesses: None, witness_names: HashSet::new() }
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
        }
        let mut out = String::new();
        let name = self.file.path.file_name().unwrap_or_default().to_string_lossy().into_owned();
        let _ = writeln!(out, "// Generated by bloom-native --target swiftui from {name}. Do not edit.\n");
        out.push_str("import Foundation\nimport Bloom\nimport BloomUI\n");
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

    /// A member's visibility: `public` when it witnesses a public protocol of a public type.
    pub(crate) fn member_visibility(&self, v: Visibility, name: &str) -> &'static str {
        if v == Visibility::Internal && self.witness_names.contains(name) { "public " } else { Self::visibility(v) }
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
                let base = match name.name.as_str() {
                    "View" if self.source_of(t.span).trim_start().starts_with("some") => {
                        return "some View".into();
                    }
                    other => TYPE_RENAMES
                        .iter()
                        .find(|(b, _)| *b == other)
                        .map(|(_, s)| s.to_string())
                        .unwrap_or_else(|| other.to_string()),
                };
                let some = if self.source_of(t.span).trim_start().starts_with("some ") { "some " } else { "" };
                if args.is_empty() {
                    format!("{some}{base}")
                } else {
                    let args: Vec<String> = args.iter().map(|a| self.ty(a)).collect();
                    format!("{some}{base}<{}>", args.join(", "))
                }
            }
            TypeKind::List(inner) => format!("[{}]", self.ty(inner)),
            TypeKind::Map(k, v) => format!("[{}: {}]", self.ty(k), self.ty(v)),
            TypeKind::Optional(inner) => {
                let inner_text = self.ty(inner);
                if matches!(inner.kind, TypeKind::Fn { .. }) || inner_text.starts_with("any ") || inner_text.starts_with("some ") {
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
            TypeKind::Tuple(items) if items.is_empty() => "Void".into(),
            TypeKind::Tuple(items) => {
                let items: Vec<String> = items.iter().map(|i| self.ty(i)).collect();
                format!("({})", items.join(", "))
            }
            // A union of string literals is TypeScript-shaped data: a `String` here.
            TypeKind::Strings(_) => "String".into(),
            TypeKind::Record(_) => self.unsupported(t.span, "a structural record type").replace("fatal(\"unsupported\")", "Never"),
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
                let bounds: Vec<String> = constraints
                    .iter()
                    .filter(|(n, _)| n.name == g.name)
                    .map(|(_, t)| self.ty(t))
                    .collect();
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
            ItemKind::Fn(f) => {
                let attrs = self.attrs(&item.modifiers, &[]);
                format!("{attrs}{}", self.func(vis, f, false, 0, None))
            }
            ItemKind::View(v) => self.view_decl(vis, v),
            ItemKind::Const(c) => {
                let ty = c.ty.as_ref().map(|t| format!(": {}", self.ty(t))).unwrap_or_default();
                let value = self.expr_value(&c.value, 0);
                format!("{vis}let {}{ty} = {value}\n", kw(&c.name.name))
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
                self.unsupported(x.package.span, "an `extern module` (a TypeScript or npm module has no native side)");
                String::new()
            }
            // `test "…" { }` runs on the TypeScript backend (`bloom test`).
            ItemKind::Test(_) => String::new(),
        }
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
        if s.generics.is_empty() && self.sendable(&field_tys, 0) && !conforms.iter().any(|c| c == "Sendable") {
            conforms.push("Sendable".into());
        }
        let head = if conforms.is_empty() { String::new() } else { format!(": {}", conforms.join(", ")) };
        let saved = self.enter_type(&s.name.name, !vis.is_empty() && vis != "private ", &conforms);
        let mut out = format!("{attrs}{vis}struct {}{generics}{head} {{\n", kw(&s.name.name));
        let members: Vec<TypeMember> = s.surface.as_ref().map(|b| b.members.clone()).unwrap_or_default();
        let has_init = members.iter().any(|m| matches!(&m.kind, TypeMemberKind::Func(f) if f.name.name == "init"));
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

    /// `init(id: String, likes: Int = 0)`: Bloom's memberwise construction, every field
    /// labelled by its name, a default where the field has one.
    fn memberwise_init(&mut self, vis: &str, fields: &[Field]) -> String {
        let params: Vec<String> = fields
            .iter()
            .map(|f| {
                let ty = self.param_type(&f.ty);
                let default = f.default.as_ref().map(|d| format!(" = {}", self.expr_value(d, 2))).unwrap_or_default();
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
        let payload_tys: Vec<&TypeExpr> = e.variants.iter().flat_map(|v| v.payload.iter().map(|p| &p.ty)).collect();
        let recursive = payload_tys.iter().any(|t| self.mentions(t, &e.name.name));
        if e.generics.is_empty() && !recursive && self.sendable(&payload_tys, 0) && !conforms.iter().any(|c| c == "Sendable") {
            conforms.push("Sendable".into());
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
        out
    }

    fn mentions(&self, t: &TypeExpr, name: &str) -> bool {
        match &t.kind {
            TypeKind::Named { name: n, args } => n.name == name || args.iter().any(|a| self.mentions(a, name)),
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
                .map(|f| format!("  {} {{ fatalError(\"{name}: no native implementation is registered\") }}\n", self.signature(&f, false)))
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
                let value = value.as_ref().map(|v| format!(" = {}", self.expr_value(v, indent + 1))).unwrap_or_default();
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
            let default = p.default.as_ref().map(|d| format!(" = {}", self.expr_value(d, 0))).unwrap_or_default();
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
        let space = if name == "==" { " " } else { "" };
        format!("{builder}func {name}{space}{generics}({params}){asynchronous}{throws}{ret}")
    }

    pub(crate) fn func(&mut self, vis: &str, f: &FnDecl, is_static: bool, indent: usize, _owner: Option<&str>) -> String {
        let returns_view = f.ret.as_ref().is_some_and(|t| matches!(&t.kind, TypeKind::Named { name, .. } if name.name == "View"));
        let sig = self.signature(f, returns_view && f.body.stmts.len() > 1);
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
        format!("{p}{vis}{st}{sig} {{\n{body}{p}}}\n")
    }
}

/// The program's public types, and its protocols' requirements by name (with whether the
/// protocol is public): a public type's witness of a public protocol is public in Swift.
pub(crate) struct Witnesses {
    public_types: HashSet<String>,
    protocols: std::collections::HashMap<String, (bool, Vec<String>)>,
}

impl Witnesses {
    fn of(program: &Program) -> Witnesses {
        let mut public_types = HashSet::new();
        let mut protocols = std::collections::HashMap::new();
        for item in program.modules.iter().flat_map(|m| m.files.iter()).flat_map(|f| f.ast.items.iter()) {
            let public = matches!(item.visibility, Visibility::Public | Visibility::PubDefault);
            if let ItemKind::Protocol(p) = &item.kind {
                let reqs = p.requirements.iter().map(|r| r.name().name.clone()).collect();
                protocols.insert(p.name.name.clone(), (public, reqs));
            }
            if public && !matches!(item.kind, ItemKind::Fn(_) | ItemKind::Const(_) | ItemKind::Extension(_)) {
                public_types.insert(item.kind.name().name.clone());
            }
        }
        Witnesses { public_types, protocols }
    }
}

/// The requirements of Swift's own protocols a Bloom type conforms to.
fn system_requirements(protocol: &str) -> Option<&'static [&'static str]> {
    Some(match protocol {
        "View" => &["body"],
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
                "Bool" | "Int" | "Float" | "Double" | "String" | "Character" | "Date" | "Duration" | "URL" | "UniqueID" | "JSONValue" | "Set"
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
                ItemKind::Struct(s) if s.generics.is_empty() => {
                    if s.fields.iter().all(|f| sendable_ty(&f.ty, &known, 0)) {
                        known.insert(s.name.name.clone());
                    }
                }
                ItemKind::Enum(e) if e.generics.is_empty() => {
                    if e.variants.iter().flat_map(|v| v.payload.iter()).all(|p| sendable_ty(&p.ty, &known, 0)) {
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

