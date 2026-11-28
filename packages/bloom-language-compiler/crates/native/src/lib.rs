//! Native backends for `.bloom` (ADR 0003, accepted: full native, Android and iOS).
//!
//! bloomc's main pipeline emits TypeScript that runs on Hermes and draws React Native views.
//! This crate is a measured prototype of the other road: the same checked program emitted as
//! **Kotlin + Jetpack Compose** (`--target kotlin-compose`) or **SwiftUI** (`--target swiftui`),
//! with no JavaScript in between.
//!
//! It reads a `bloom` package (`Package.bloom` plus `Sources/<Module>/*.bloom`), checks every
//! file with the main checker (`bloom_lang::check`: a file with an error is not emitted), and
//! emits from the tree as the parser wrote it, before the TypeScript lowerings: Bloom's
//! surface is SwiftUI's, so `Toggle`, `List`, `VStack(spacing:)` map to the platforms' own
//! views more directly than the language nodes they lower to for React Native. The checker's
//! types (by span) qualify what the tree leaves implicit (`.ready` is `LoadState.ready`).
//!
//! It covers the subset two screens need (Settings → Notifications and a feed of PostItem
//! rows); anything else is a diagnostic naming the construct, so coverage is measurable. The
//! main compiler stack does not depend on it.

use std::collections::{BTreeMap, BTreeSet, HashMap};
use std::path::{Path, PathBuf};

use bloom_lang::Ast;
use bloom_lang::ast::*;

pub mod android;
pub mod kotlin;
pub mod swift;

/// Where a backend's output goes.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Target {
    KotlinCompose,
    SwiftUI,
}

impl Target {
    pub fn parse(text: &str) -> Option<Target> {
        match text {
            "kotlin-compose" | "kotlin" | "compose" => Some(Target::KotlinCompose),
            "swiftui" | "swift" => Some(Target::SwiftUI),
            _ => None,
        }
    }
}

/// One `.bloom` file, parsed and checked.
pub struct SourceFile {
    pub path: PathBuf,
    pub source: String,
    pub ast: Ast,
    /// The checker's type of each expression and binding, by span, as Bloom writes it.
    pub types: HashMap<Span, String>,
    /// The checked IR: the checker's side tables (each expression's type, what each call,
    /// field and name resolved to, the definitions), keyed by the parser's expression ids,
    /// exactly what the TypeScript emitter reads (`bloom_lang::backend`).
    pub checked: bloom_lang::backend::CheckResult,
}

/// A directory module: `Sources/Feed/*.bloom` is `Feed`.
pub struct Module {
    pub name: String,
    pub files: Vec<SourceFile>,
    /// The standard library's module (`Bloom`): emitted into the runtime's package.
    pub std: bool,
}

/// A checked package, ready for a backend.
pub struct Program {
    /// `Package.bloom`'s `name:`.
    pub name: String,
    pub modules: Vec<Module>,
    pub decls: Decls,
}

/// A construct a backend does not cover yet, or a check error.
#[derive(Debug, Clone)]
pub struct Problem {
    pub file: PathBuf,
    pub span: Span,
    pub message: String,
}

impl Problem {
    pub fn render(&self, source: Option<&str>) -> String {
        let (line, col) = match source {
            Some(text) => line_col(text, self.span.start),
            None => (0, 0),
        };
        format!("{}:{}:{}: {}", self.file.display(), line, col, self.message)
    }
}

fn line_col(text: &str, offset: u32) -> (usize, usize) {
    let upto = &text[..(offset as usize).min(text.len())];
    let line = upto.matches('\n').count() + 1;
    let col = upto.len() - upto.rfind('\n').map(|i| i + 1).unwrap_or(0) + 1;
    (line, col)
}

/// A parameter as a call site sees it.
#[derive(Debug, Clone)]
pub struct ParamInfo {
    /// The argument label (`None` for `_`).
    pub label: Option<String>,
    pub name: String,
    pub has_default: bool,
}

/// An enum's cases and their payloads' field names.
#[derive(Debug, Clone, Default)]
pub struct EnumInfo {
    pub cases: Vec<(String, Vec<String>)>,
}

impl EnumInfo {
    /// Whether any case carries a payload (a sealed hierarchy, not a plain enum).
    pub fn has_payload(&self) -> bool {
        self.cases.iter().any(|(_, p)| !p.is_empty())
    }

    pub fn payload(&self, case: &str) -> Option<&[String]> {
        self.cases.iter().find(|(n, _)| n == case).map(|(_, p)| p.as_slice())
    }
}

/// The program's declarations, for call sites: argument labels, enum shapes, views.
#[derive(Debug, Clone, Default)]
pub struct Decls {
    pub structs: BTreeMap<String, Vec<ParamInfo>>,
    pub enums: BTreeMap<String, EnumInfo>,
    pub funcs: BTreeMap<String, Vec<ParamInfo>>,
    /// `(type, method)`: an extension's or a type's methods.
    pub methods: BTreeMap<(String, String), Vec<ParamInfo>>,
    /// `(type, property)`: computed properties of extensions.
    pub computed: BTreeMap<(String, String), ()>,
    /// Views and their props.
    pub views: BTreeMap<String, Vec<ParamInfo>>,
    /// The structs, enums and classes the program declares: their members (their own and
    /// every extension's in the program) are emitted inside the Kotlin class.
    pub declared: BTreeSet<String>,
    /// `extension T { … }` / `extension T: P { … }` bodies, by `T`.
    pub extensions: BTreeMap<String, Vec<TypeBody>>,
    /// Each type's protocols: its declaration's and its extensions'.
    pub conforms: BTreeMap<String, Vec<String>>,
    /// Each protocol's requirements' names, with its inherited protocols' (an implementation
    /// of one is an `override`).
    pub protocols: BTreeMap<String, Vec<String>>,
    /// Protocols' direct parents, resolved into `protocols` once every file is read.
    pub inherits: BTreeMap<String, Vec<String>>,
    /// The classes (reference types: their fields are written in place).
    pub classes: BTreeSet<String>,
    /// The app's environment keys (`let session = EnvironmentKey(…)`).
    pub env_keys: BTreeSet<String>,
}

/// A written type's name (`Titled` in `extension Post: Titled`).
pub(crate) fn type_name(t: &TypeExpr) -> Option<String> {
    match &t.kind {
        TypeKind::Named { name, .. } => Some(name.name.clone()),
        _ => None,
    }
}

fn param_info(p: &Param, func: bool) -> ParamInfo {
    let label = match &p.label {
        Some(l) if l.name == "_" => None,
        Some(l) => Some(l.name.clone()),
        None if func => Some(p.name.name.clone()),
        None => None,
    };
    ParamInfo { label, name: p.name.name.clone(), has_default: p.default.is_some() }
}

impl Decls {
    fn collect(&mut self, file: &Ast) {
        for item in &file.items {
            match &item.kind {
                ItemKind::Struct(s) => {
                    let fields = s
                        .fields
                        .iter()
                        .map(|f| ParamInfo {
                            label: Some(f.name.name.clone()),
                            name: f.name.name.clone(),
                            has_default: f.default.is_some(),
                        })
                        .collect();
                    self.structs.insert(s.name.name.clone(), fields);
                    self.declared.insert(s.name.name.clone());
                    if let Some(surface) = &s.surface {
                        self.members(&s.name.name, surface);
                        self.conformances(&s.name.name, &surface.conformances);
                    }
                }
                ItemKind::Enum(e) => {
                    let cases = e
                        .variants
                        .iter()
                        .map(|v| {
                            let names = v
                                .payload
                                .iter()
                                .enumerate()
                                .map(|(i, p)| {
                                    p.name.as_ref().map(|n| n.name.clone()).unwrap_or(format!("_{i}"))
                                })
                                .collect();
                            (v.name.name.clone(), names)
                        })
                        .collect();
                    self.enums.insert(e.name.name.clone(), EnumInfo { cases });
                    self.declared.insert(e.name.name.clone());
                    self.conformances(&e.name.name, &e.conformances);
                }
                ItemKind::Class(c) => {
                    self.declared.insert(c.name.name.clone());
                    self.classes.insert(c.name.name.clone());
                    self.members(&c.name.name, &c.body);
                    self.conformances(&c.name.name, &c.body.conformances);
                }
                ItemKind::Protocol(p) => {
                    let names = p.requirements.iter().map(|r| r.name().name.clone()).collect();
                    self.protocols.insert(p.name.name.clone(), names);
                    self.inherits
                        .insert(p.name.name.clone(), p.inherits.iter().filter_map(type_name).collect());
                }
                ItemKind::Fn(f) => {
                    self.funcs.insert(
                        f.name.name.clone(),
                        f.params.iter().map(|p| param_info(p, f.func)).collect(),
                    );
                }
                ItemKind::Const(c)
                    if matches!(&c.value.kind, ExprKind::Call(call)
                        if matches!(&call.callee.kind, ExprKind::Name(n) if n == "EnvironmentKey")) =>
                {
                    self.env_keys.insert(c.name.name.clone());
                }
                ItemKind::View(v) => {
                    let props = v.params.iter().flatten().map(|p| param_info(p, false)).collect();
                    self.views.insert(v.name.name.clone(), props);
                }
                ItemKind::Extension(x) => {
                    self.members(&x.name.name, &x.body);
                    self.conformances(&x.name.name, &x.body.conformances);
                    self.extensions.entry(x.name.name.clone()).or_default().push(x.body.clone());
                }
                _ => {}
            }
        }
    }

    fn conformances(&mut self, ty: &str, written: &[TypeExpr]) {
        let list = self.conforms.entry(ty.to_string()).or_default();
        for name in written.iter().filter_map(type_name) {
            if !list.contains(&name) {
                list.push(name);
            }
        }
    }

    /// Folds each protocol's inherited requirements into it.
    fn resolve(&mut self) {
        let names: Vec<String> = self.protocols.keys().cloned().collect();
        for name in names {
            let mut seen = BTreeSet::new();
            let mut stack = vec![name.clone()];
            let mut all = Vec::new();
            while let Some(p) = stack.pop() {
                if !seen.insert(p.clone()) {
                    continue;
                }
                all.extend(self.protocols.get(&p).cloned().unwrap_or_default());
                stack.extend(self.inherits.get(&p).cloned().unwrap_or_default());
            }
            self.protocols.insert(name, all);
        }
    }

    /// Whether `member` of `ty` implements a requirement of one of its protocols.
    pub fn is_requirement(&self, ty: &str, member: &str) -> bool {
        self.conforms.get(ty).into_iter().flatten().any(|p| {
            self.protocols.get(p).is_some_and(|r| r.iter().any(|n| n == member))
                || (p == "Identifiable" && member == "id")
        })
    }

    fn members(&mut self, ty: &str, body: &TypeBody) {
        for m in &body.members {
            match &m.kind {
                TypeMemberKind::Func(f) => {
                    let params = f.params.iter().map(|p| param_info(p, f.func)).collect();
                    self.methods.insert((ty.to_string(), f.name.name.clone()), params);
                }
                TypeMemberKind::Computed { name, .. } => {
                    self.computed.insert((ty.to_string(), name.name.clone()), ());
                }
                _ => {}
            }
        }
    }
}

/// `name: "Mention"` from `Package.bloom`, without evaluating it.
fn package_name(manifest: &str) -> Option<String> {
    let at = manifest.find("name:")?;
    let rest = &manifest[at + 5..];
    let open = rest.find('"')?;
    let close = rest[open + 1..].find('"')?;
    Some(rest[open + 1..open + 1 + close].to_string())
}

/// Reads, parses and checks the package at `dir`. Check errors are problems: a backend
/// never sees a program the main compiler rejects.
pub fn load(dir: &Path) -> Result<Program, Vec<Problem>> {
    load_with_std(dir, &[])
}

/// [`load`], with the standard library's modules `std` (`"JSON"`, `"Core"`) as the module
/// `Bloom`, which the Kotlin backend emits into `so.oxy.bloom.std`: the written-in-Bloom parts
/// of the standard library compile through the backend, and only their `extern`s are Kotlin.
pub fn load_with_std(dir: &Path, std: &[&str]) -> Result<Program, Vec<Problem>> {
    let manifest_path = dir.join("Package.bloom");
    let manifest = std::fs::read_to_string(&manifest_path).map_err(|e| {
        vec![Problem { file: manifest_path.clone(), span: Span::default(), message: e.to_string() }]
    })?;
    let name = package_name(&manifest).unwrap_or_else(|| "App".into());
    let sources = dir.join("Sources");
    let mut module_dirs: Vec<PathBuf> = std::fs::read_dir(&sources)
        .map_err(|e| vec![Problem { file: sources.clone(), span: Span::default(), message: e.to_string() }])?
        .filter_map(|e| e.ok().map(|e| e.path()))
        .filter(|p| p.is_dir())
        .collect();
    module_dirs.sort();
    let options = bloom_lang::Options { root: Some(dir.to_path_buf()), ..Default::default() };
    let mut problems = Vec::new();
    let mut modules = Vec::new();
    let mut decls = Decls::default();
    let mut sets: Vec<(String, Vec<PathBuf>, bool)> = Vec::new();
    for module_dir in module_dirs {
        let module_name = module_dir.file_name().unwrap_or_default().to_string_lossy().into_owned();
        let mut paths: Vec<PathBuf> = std::fs::read_dir(&module_dir)
            .into_iter()
            .flatten()
            .filter_map(|e| e.ok().map(|e| e.path()))
            .filter(|p| p.extension().is_some_and(|x| x == "bloom"))
            .collect();
        paths.sort();
        sets.push((module_name, paths, false));
    }
    if !std.is_empty() {
        let files = bloom_lang::stdlib::ensure(dir);
        let chosen = files
            .into_iter()
            .filter(|p| std.iter().any(|n| p.file_stem().is_some_and(|s| s == *n)))
            .collect();
        sets.push((bloom_lang::stdlib::MODULE.to_string(), chosen, true));
    }
    for (module_name, paths, is_std) in sets {
        let mut files = Vec::new();
        for path in paths {
            let source = match std::fs::read_to_string(&path) {
                Ok(s) => s,
                Err(e) => {
                    problems.push(Problem { file: path, span: Span::default(), message: e.to_string() });
                    continue;
                }
            };
            let shown = path.to_string_lossy().into_owned();
            let checked = bloom_lang::backend::checked(&source, &shown, &options);
            for d in &checked.diagnostics {
                problems.push(Problem { file: path.clone(), span: d.span, message: d.rendered.clone() });
            }
            let (ast, _, syntax) = bloom_lang::parse(&source, &shown);
            for d in &syntax {
                problems.push(Problem { file: path.clone(), span: d.span, message: d.rendered.clone() });
            }
            decls.collect(&ast);
            let types = checked.result.types(&source).into_iter().collect();
            files.push(SourceFile { path, source, ast, types, checked: checked.result });
        }
        modules.push(Module { name: module_name, files, std: is_std });
    }
    decls.resolve();
    if problems.is_empty() { Ok(Program { name, modules, decls }) } else { Err(problems) }
}

/// One emitted file: its path relative to the output root, and its text.
#[derive(Debug, Clone)]
pub struct Emitted {
    pub path: PathBuf,
    pub text: String,
}

/// Emits `program` for `target`: the generated sources, or the constructs it does not cover.
pub fn emit(program: &Program, target: Target) -> Result<Vec<Emitted>, Vec<Problem>> {
    match target {
        Target::KotlinCompose => kotlin::emit(program),
        Target::SwiftUI => swift::emit(program),
    }
}

/// Kotlin's and Swift's keywords a Bloom name may collide with.
pub(crate) fn escape(name: &str, keywords: &[&str]) -> String {
    if keywords.contains(&name) { format!("`{name}`") } else { name.to_string() }
}

/// `image` → `Image`: a payload case's class name.
pub(crate) fn upper_first(name: &str) -> String {
    let mut chars = name.chars();
    match chars.next() {
        Some(c) => c.to_uppercase().collect::<String>() + chars.as_str(),
        None => String::new(),
    }
}
