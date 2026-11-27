//! Directory modules (ADR 0002, section 1).
//!
//! A file under a package (a directory with a [`package::MANIFEST`]) belongs to
//! the target whose directory holds it: `Sources/Posts/*.bloom` is module
//! `Posts`. Its names are, besides its own:
//!
//! - every `internal` and `public` item of the other files of its module;
//! - every `public` item of the modules it imports (`import Posts`,
//!   `import Mention.Posts`), each of them a dependency of its target in the
//!   manifest;
//! - the names of a toolchain package it imports (`import BloomData`), which
//!   map to today's runtime packages underneath.
//!
//! [`prepare`] rewrites a file's module imports, before it is checked, into the
//! named `.bloom` and runtime imports the checker and the emitter already know,
//! for the names the file uses; so a module is checked and emitted file by file,
//! as before, and the emitted TS imports exactly what it uses. String-path
//! imports are an error in app modules: only binding modules
//! (`.bindings` targets) cross into TS, unless the compile allows it
//! (`--allow-ts-imports`, the migration mode).
//!
//! Without a manifest above it, a file is a 0.x file and keeps its string imports.

use std::cell::RefCell;
use std::collections::{BTreeMap, BTreeSet, HashMap};
use std::path::{Component, Path, PathBuf};
use std::rc::Rc;

use crate::Options;
use crate::ast::{File, Ident, Import, ImportKind, ImportSpec, Span, Visibility};
use crate::diagnostic::{Diagnostic, closest};
use crate::lexer::{self, P, Tok};
use crate::package::{self, KnownPackage, Manifest, TargetKind, known_package};

const SPEC: &str = "modules";

/// An item's visibility across files and modules.
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord)]
pub enum Access {
    /// `private`: its file only.
    Private,
    /// unwritten (or `internal`): its whole module.
    Internal,
    /// `public`: the modules that import its module.
    Public,
}

impl Access {
    fn of(visibility: Visibility) -> Access {
        match visibility {
            Visibility::Public | Visibility::PubDefault => Access::Public,
            Visibility::Internal => Access::Internal,
            Visibility::Private => Access::Private,
        }
    }
}

/// A package: its root, its manifest and its modules.
#[derive(Debug)]
pub struct PackageGraph {
    pub root: PathBuf,
    pub manifest: Manifest,
    /// The manifest's text (diagnostics in it are rendered against it).
    pub source: String,
}

impl PackageGraph {
    /// The absolute directory of target `index`.
    pub fn dir(&self, index: usize) -> PathBuf {
        self.root.join(self.manifest.targets[index].dir())
    }

    /// The target whose directory holds `file` (the deepest one).
    pub fn target_of(&self, file: &Path) -> Option<usize> {
        let file = absolute(file);
        (0..self.manifest.targets.len())
            .filter(|&i| file.starts_with(absolute(&self.dir(i))))
            .max_by_key(|&i| self.manifest.targets[i].dir().components().count())
    }

    pub fn target(&self, name: &str) -> Option<usize> {
        self.manifest.targets.iter().position(|t| t.name == name)
    }

    /// The `.bloom` files of target `index`, sorted.
    pub fn files(&self, index: usize) -> Vec<PathBuf> {
        let mut out = Vec::new();
        collect_bloom(&self.dir(index), &mut out);
        // A nested target's files are its own.
        let nested: Vec<PathBuf> = (0..self.manifest.targets.len())
            .filter(|&i| i != index && self.dir(i).starts_with(self.dir(index)))
            .map(|i| self.dir(i))
            .collect();
        out.retain(|f| !nested.iter().any(|n| f.starts_with(n)));
        out.sort();
        out
    }
}

fn collect_bloom(dir: &Path, out: &mut Vec<PathBuf>) {
    let Ok(entries) = std::fs::read_dir(dir) else { return };
    for entry in entries.flatten() {
        let path = entry.path();
        let name = entry.file_name();
        let name = name.to_string_lossy();
        if name.starts_with('.') || name == "node_modules" {
            continue;
        }
        if path.is_dir() {
            collect_bloom(&path, out);
        } else if path.extension().is_some_and(|e| e == "bloom") {
            out.push(path);
        }
    }
}

/// `path` made absolute against the working directory, `.` and `..` folded.
pub fn absolute(path: &Path) -> PathBuf {
    let joined = if path.is_absolute() {
        path.to_path_buf()
    } else {
        std::env::current_dir().unwrap_or_default().join(path)
    };
    let mut out = PathBuf::new();
    for component in joined.components() {
        match component {
            Component::CurDir => {}
            Component::ParentDir => {
                out.pop();
            }
            other => out.push(other),
        }
    }
    out
}

/// The package root above `path`: the nearest directory with a `Package.bloom`.
pub fn find_root(path: &Path) -> Option<PathBuf> {
    let path = absolute(path);
    path.ancestors().skip(1).find(|dir| dir.join(package::MANIFEST).is_file()).map(Path::to_path_buf)
}

type Loaded = Rc<Result<PackageGraph, Vec<Diagnostic>>>;

thread_local! {
    static PACKAGES: RefCell<HashMap<PathBuf, (crate::ts::Stamp, Loaded)>> = RefCell::new(HashMap::new());
    static SUMMARIES: RefCell<HashMap<PathBuf, (crate::ts::Stamp, Rc<Summary>)>> = RefCell::new(HashMap::new());
}

/// The package at `root`, read once per change of its manifest.
pub fn load(root: &Path) -> Loaded {
    let root = absolute(root);
    let manifest = root.join(package::MANIFEST);
    let stamp = crate::ts::stamp(&manifest).unwrap_or((None, 0));
    if let Some(loaded) =
        PACKAGES.with(|p| p.borrow().get(&root).filter(|(s, _)| *s == stamp).map(|(_, l)| l.clone()))
    {
        return loaded;
    }
    let source = std::fs::read_to_string(&manifest).unwrap_or_default();
    let loaded = Rc::new(package::parse(&source, &manifest.to_string_lossy()).map(|manifest| PackageGraph {
        root: root.clone(),
        manifest,
        source,
    }));
    PACKAGES.with(|p| p.borrow_mut().insert(root, (stamp, loaded.clone())));
    loaded
}

/// Forgets every package and file summary this thread read.
pub fn clear() {
    PACKAGES.with(|p| p.borrow_mut().clear());
    SUMMARIES.with(|s| s.borrow_mut().clear());
}

/// A file's top-level names, for its module and for importers.
#[derive(Debug, Default)]
pub struct Summary {
    pub items: Vec<(String, Access, Span)>,
}

/// The top-level items of the file at `path` (read once per change).
pub fn summary(path: &Path) -> Rc<Summary> {
    let stamp = crate::ts::stamp(path).unwrap_or((None, 0));
    if let Some(found) =
        SUMMARIES.with(|s| s.borrow().get(path).filter(|(st, _)| *st == stamp).map(|(_, v)| v.clone()))
    {
        return found;
    }
    let source = std::fs::read_to_string(path).unwrap_or_default();
    let (mut file, _, _) = crate::parser::parse(&source);
    crate::externs::lower(&mut file);
    // Its members as the functions other files call (`T$m`).
    crate::extensions::lower(&mut file);
    crate::codable::lower(&mut file, &mut Vec::new());
    let summary = Rc::new(summarize(&file));
    SUMMARIES.with(|s| s.borrow_mut().insert(path.to_path_buf(), (stamp, summary.clone())));
    summary
}

fn summarize(file: &File) -> Summary {
    Summary {
        items: file
            .items
            .iter()
            .map(|item| {
                let name = item.kind.name();
                (name.name.clone(), Access::of(item.visibility), name.span)
            })
            .collect(),
    }
}

/// What resolving a file's modules found: errors, and what explains a name
/// the checker could not find.
#[derive(Debug, Default)]
pub struct Resolution {
    pub diagnostics: Vec<Diagnostic>,
    /// Names the file could not see, with why (`internal` elsewhere, not imported).
    hidden: HashMap<String, Hidden>,
    /// The files the resolution read (the manifest and the module's other files): a cache key.
    pub reads: Vec<PathBuf>,
    /// The file is one of a package's modules: compile it as a directory module.
    pub in_module: bool,
}

#[derive(Debug, Clone)]
enum Hidden {
    /// `internal` in another module.
    Internal { module: String, file: PathBuf },
    /// `private` in another file of this module.
    Private { file: PathBuf },
    /// `public` in a module this file does not import.
    NotImported { module: String, declared: bool, target: String },
}

/// Rewrites `file`'s module imports (see the module docs) and checks its
/// string imports. Without a package above `filename`, does nothing.
pub fn prepare(file: &mut File, source: &str, filename: &str, options: &Options) -> Resolution {
    let mut out = Resolution { diagnostics: crate::externs::lower(file), ..Resolution::default() };
    let mut derived = crate::codable::lower(file, &mut out.diagnostics);
    derived.extend(crate::model::query_names(file));
    derived.extend(crate::extensions::actor_runners(file));
    let path = absolute(Path::new(filename));
    let tests_allowed = in_tests(&path, options);
    out.diagnostics.extend(crate::testing::lower(file, source, tests_allowed));
    if crate::stdlib::contains(&path) {
        // The standard library's files see one another's names, as one module's files do.
        let dir = path.parent().map(Path::to_path_buf).unwrap_or_default();
        let own: BTreeSet<String> = file.items.iter().map(|i| i.kind.name().name.clone()).collect();
        let mut offered: BTreeMap<String, Vec<Offer>> = BTreeMap::new();
        for (name, _) in crate::stdlib::SOURCES.iter().filter(|(n, _)| n.ends_with(".bloom")) {
            let sibling = dir.join(name);
            if sibling == path {
                continue;
            }
            for (item, access, _) in &summary(&sibling).items {
                if *access != Access::Private {
                    offered.entry(item.clone()).or_default().push(Offer::Bloom {
                        file: sibling.clone(),
                        module: crate::stdlib::MODULE.to_string(),
                        own: true,
                    });
                }
            }
        }
        import_uses(file, source, &dir, &own, &offered, &derived, &mut out);
        return out;
    }
    let Some(root) = options.package.clone().or_else(|| find_root(&path)) else {
        return out;
    };
    let loaded = load(&root);
    out.reads.push(absolute(&root).join(package::MANIFEST));
    let graph = match loaded.as_ref() {
        Ok(graph) => graph,
        Err(errors) => {
            // The manifest's own errors are reported by `bloom check` on it; one here says why.
            let first = errors.first().map_or(String::new(), |d| format!(": {}", d.message));
            let span = file.imports.first().map_or(Span::new(0, 0), |i| i.span);
            out.diagnostics.push(
                Diagnostic::error(
                    "B0810",
                    span,
                    format!("the package's Package.bloom does not evaluate{first}"),
                )
                .label("modules resolve through the manifest")
                .help("run `bloom check` for its errors")
                .toolchain(SPEC),
            );
            return out;
        }
    };
    let Some(index) = graph.target_of(&path) else {
        return out;
    };
    out.in_module = true;
    derived.extend(crate::bloomui::lower(file, &mut out.diagnostics));
    if crate::i18n::lower(file, &absolute(&root), &mut out.diagnostics) {
        derived.insert(crate::i18n::LOOKUP.to_string());
    }
    let target = &graph.manifest.targets[index];
    let bindings = matches!(target.kind, TargetKind::Bindings { .. });
    let dir = path.parent().map(Path::to_path_buf).unwrap_or_default();

    // What the file imports, by module.
    let mut imported: Vec<Imported> = Vec::new();
    let mut kept = Vec::new();
    let mut written = Vec::new();
    for import in std::mem::take(&mut file.imports) {
        if let ImportKind::Module(segments) = &import.kind {
            written.push(ModuleImport { segments: segments.clone(), span: import.span });
            continue;
        }
        let bloom_file = import.source.ends_with(".bloom") || import.source == crate::testing::RUNTIME;
        if !bindings
            && !options.allow_ts_imports
            && !bloom_file
            && !crate::codable::is_synthetic(import.source_span)
        {
            out.diagnostics.push(string_import(&import));
        }
        kept.push(import);
    }
    file.imports = kept;
    if !bindings && !options.allow_ts_imports {
        out.diagnostics.extend(foreign_types(source));
    }
    for module_import in written {
        if let Some(found) = resolve_import(graph, index, &module_import, &mut out) {
            if imported.iter().any(|i| i.name == found.name) {
                out.diagnostics.push(
                    Diagnostic::warning(
                        "B0901",
                        module_import.span,
                        format!("`{}` is imported twice", found.name),
                    )
                    .label("remove this import")
                    .toolchain(SPEC),
                );
                continue;
            }
            imported.push(found);
        }
    }

    // Every name the file's module and imports offer: (name → where).
    let own: BTreeSet<String> = file.items.iter().map(|i| i.kind.name().name.clone()).collect();
    let mut offered: BTreeMap<String, Vec<Offer>> = BTreeMap::new();
    let mut hidden = HashMap::new();
    for sibling in graph.files(index) {
        // `X.native.bloom` and `X.web.bloom` are alternatives (one per platform), not siblings.
        if sibling == path || alternatives(&sibling, &path) {
            continue;
        }
        out.reads.push(sibling.clone());
        for (name, access, _) in &summary(&sibling).items {
            if *access == Access::Private {
                hidden.insert(name.clone(), Hidden::Private { file: sibling.clone() });
            } else {
                offer(
                    &mut offered,
                    name,
                    Offer::Bloom { file: sibling.clone(), module: target.name.clone(), own: true },
                );
            }
        }
    }
    for import in &imported {
        match &import.source {
            Source::Target(t) => {
                for file_path in graph.files(*t) {
                    out.reads.push(file_path.clone());
                    for (name, access, _) in &summary(&file_path).items {
                        if *access == Access::Public {
                            offer(
                                &mut offered,
                                name,
                                Offer::Bloom {
                                    file: file_path.clone(),
                                    module: import.name.clone(),
                                    own: false,
                                },
                            );
                        } else {
                            hidden.entry(name.clone()).or_insert(Hidden::Internal {
                                module: import.name.clone(),
                                file: file_path.clone(),
                            });
                        }
                    }
                }
            }
            Source::Known(known) => {
                let Some(specifier) = known.specifier else { continue };
                for name in runtime_exports(&path, known, options) {
                    offered
                        .entry(name)
                        .or_default()
                        .push(Offer::Runtime { specifier, module: import.name.clone() });
                }
            }
        }
    }
    // The modules the file could import, for "add `import X`".
    for (t, other) in graph.manifest.targets.iter().enumerate() {
        if t == index || imported.iter().any(|i| i.name == other.name) {
            continue;
        }
        if matches!(other.kind, TargetKind::App | TargetKind::Tests) {
            continue;
        }
        let declared = target.dependencies.iter().any(|(d, _)| *d == other.name);
        for file_path in graph.files(t) {
            for (name, access, _) in &summary(&file_path).items {
                if *access == Access::Public {
                    hidden.entry(name.clone()).or_insert(Hidden::NotImported {
                        module: other.name.clone(),
                        declared,
                        target: target.name.clone(),
                    });
                }
            }
        }
    }

    // The standard library, implicitly (`crate::stdlib`): every module's names shadow it.
    for std_file in crate::stdlib::ensure(&absolute(&root)) {
        out.reads.push(std_file.clone());
        for (name, access, _) in &summary(&std_file).items {
            if *access == Access::Public {
                offered.entry(name.clone()).or_default().push(Offer::Bloom {
                    file: std_file.clone(),
                    module: crate::stdlib::MODULE.to_string(),
                    own: false,
                });
            }
        }
    }

    // BloomUI's types and recipes that are the embedded language's own (M8): a package file
    // names them without importing `@oxy.so/bloom-language`, as it names `VStack`.
    for name in BLOOM_UI_NAMES {
        offered.entry((*name).to_string()).or_default().push(Offer::Runtime {
            specifier: "@oxy.so/bloom-language",
            module: crate::stdlib::MODULE.to_string(),
        });
    }

    import_uses(file, source, &dir, &own, &offered, &derived, &mut out);
    // Two files of a module declaring one name.
    for item in &file.items {
        let name = &item.kind.name().name;
        if let Some(offers) = offered.get(name)
            && let Some(Offer::Bloom { file: other, .. }) =
                offers.iter().find(|o| matches!(o, Offer::Bloom { own: true, .. }))
        {
            out.diagnostics.push(
                Diagnostic::error(
                    "B0807",
                    item.kind.name().span,
                    format!("`{name}` is also declared in {}", display(other, &graph.root)),
                )
                .label("a second declaration in this module")
                .help("a module's files share one namespace: rename one of them")
                .toolchain(SPEC),
            );
        }
    }
    out.hidden = hidden;
    out
}

/// The embedded language's names a package file uses as BloomUI's, without an import.
pub const BLOOM_UI_NAMES: &[&str] = &["IconComponent", "ViewModifier", "defineModifier", "defineTokens"];
/// Those of [`BLOOM_UI_NAMES`] that are TS types only (imported `type`).
const BLOOM_UI_TYPES: &[&str] = &["IconComponent", "ViewModifier"];

/// Imports, into `file`, each name it uses (`free_names`, and the extension members
/// written after a dot) from the one place `offered` has it.
fn import_uses(
    file: &mut File,
    source: &str,
    dir: &Path,
    own: &BTreeSet<String>,
    offered: &BTreeMap<String, Vec<Offer>>,
    derived: &BTreeSet<String>,
    out: &mut Resolution,
) {
    // The names the file uses, at their first use; an extension's member (`T$m`, `T$$m`)
    // where `.m` is written.
    let mut uses = free_names(source);
    // What derived code (`Codable`) names, as if written at the start.
    uses.extend(derived.iter().map(|n| (n.clone(), crate::codable::synthetic(Span::new(0, 0)))));
    let members = member_names(source);
    let casts = cast_targets(source);
    // `Box(0)` calls the class's `init` (`Box$$init`), declared beside it.
    let called: BTreeMap<String, Span> = uses.iter().map(|(n, s)| (n.clone(), *s)).collect();
    for name in offered.keys() {
        if own.contains(name) {
            continue;
        }
        if let Some((owner, "init", true)) = crate::extensions::demangle(name)
            && let Some(span) = called.get(owner)
        {
            // Its own span: the class may be imported as a type only, its `init` never is.
            uses.push((name.clone(), crate::codable::synthetic(*span)));
            continue;
        }
        // `e as? HTTPError` and `catch let e as HTTPError` call its `cast` (`HTTPError$$cast`).
        if let Some((owner, "cast", true)) = crate::extensions::demangle(name)
            && let Some(span) = casts.get(owner)
        {
            // Its own span: the type is named where a type goes, its `cast` is a value.
            uses.push((name.clone(), crate::codable::synthetic(*span)));
            continue;
        }
        if let Some((_, member, _)) = crate::extensions::demangle(name)
            && let Some(span) = members.get(member)
        {
            uses.push((name.clone(), *span));
        }
    }
    // A generic call's codec witness names a type's codec the source never writes
    // (`Post$$self`, `Page$$codec`, through `<T: Decodable>`): offered with the type.
    let types: BTreeMap<String, Span> = uses.iter().map(|(n, s)| (n.clone(), *s)).collect();
    for name in offered.keys() {
        if let Some((owner, member, true)) = crate::extensions::demangle(name)
            && matches!(member, "self" | "codec" | "init")
            && (types.contains_key(owner) || builtin_codec(owner).is_some())
        {
            // A span of its own: a value, never the type's (type-only) import.
            let at = types.get(owner).copied().unwrap_or_default();
            uses.push((name.clone(), crate::codable::synthetic(at)));
        }
    }
    if let Some(span) = ["Codable", "Decodable", "Encodable"].iter().find_map(|p| types.get(*p)) {
        uses.push(("Codec".to_string(), *span));
    }
    let mut seen = BTreeSet::new();
    uses.retain(|(name, _)| seen.insert(name.clone()));
    let mut synthesized: BTreeMap<String, (String, Vec<ImportSpec>)> = BTreeMap::new();
    // A name the file imports itself (a TS import kept in the migration mode) is that import.
    let written: BTreeSet<String> = file
        .imports
        .iter()
        .flat_map(|i| match &i.kind {
            ImportKind::Named(specs) => specs.iter().map(|s| s.local().name.clone()).collect(),
            ImportKind::Namespace(name) => vec![name.name.clone()],
            ImportKind::Module(_) => Vec::new(),
        })
        .collect();
    for (name, span) in uses {
        if own.contains(&name) || written.contains(&name) {
            continue;
        }
        let Some(offers) = offered.get(&name) else {
            continue;
        };
        // This module's own names shadow imported ones.
        let mine: Vec<&Offer> =
            offers.iter().filter(|o| matches!(o, Offer::Bloom { own: true, .. })).collect();
        let mut chosen: Vec<&Offer> = if mine.is_empty() { offers.iter().collect() } else { mine };
        if chosen.iter().any(|o| !o.is_std()) {
            chosen.retain(|o| !o.is_std());
        }
        if chosen.len() > 1 {
            let modules: Vec<String> = chosen.iter().map(|o| format!("`{}`", o.module())).collect();
            out.diagnostics.push(
                Diagnostic::error("B0807", span, format!("`{name}` is declared in more than one place"))
                    .label(format!("in {}", modules.join(" and ")))
                    .help("rename one of them: a module's names are one namespace, and so are its imports")
                    .toolchain(SPEC),
            );
            continue;
        }
        let (key, specifier) = match chosen[0] {
            // A platform alternative is imported by its base name (`./X`): Metro picks the
            // platform's file, and the checker reads one of them.
            Offer::Bloom { file: target_file, .. } => match platform_base(target_file) {
                Some(base) => (base.to_string_lossy().into_owned(), relative_specifier(dir, &base)),
                None => (target_file.to_string_lossy().into_owned(), relative_specifier(dir, target_file)),
            },
            Offer::Runtime { specifier, .. } => (specifier.to_string(), specifier.to_string()),
        };
        let type_only = BLOOM_UI_TYPES.contains(&name.as_str()) && matches!(chosen[0], Offer::Runtime { .. });
        let spec = ImportSpec { type_only, name: Ident { name: name.clone(), span }, alias: None, span };
        synthesized.entry(key).or_insert_with(|| (specifier, Vec::new())).1.push(spec);
    }
    for (_, (specifier, specs)) in synthesized {
        let span = specs[0].span;
        file.imports.push(Import {
            kind: ImportKind::Named(specs),
            source: specifier,
            source_span: span,
            span,
        });
    }
}

/// Whether tests may be written in the file at `path`: in a `.tests` target, or outside a package.
fn in_tests(path: &Path, options: &Options) -> bool {
    let Some(root) = options.package.clone().or_else(|| find_root(path)) else { return true };
    match load(&root).as_ref() {
        Ok(graph) => {
            graph.target_of(path).is_none_or(|t| matches!(graph.manifest.targets[t].kind, TargetKind::Tests))
        }
        Err(_) => true,
    }
}

/// Turns "cannot find `X`" into why `X` is not visible, when the module knows.
pub fn explain(resolution: &Resolution, diagnostics: &mut [Diagnostic], root: Option<&Path>) {
    if resolution.hidden.is_empty() {
        return;
    }
    for diagnostic in diagnostics.iter_mut() {
        if !matches!(diagnostic.code, "B0202" | "B0204") {
            continue;
        }
        let Some(name) = diagnostic.message.split('`').nth(1) else { continue };
        let Some(why) = resolution.hidden.get(name) else { continue };
        let shown = |p: &Path| root.map_or_else(|| p.display().to_string(), |r| display(p, r));
        match why {
            Hidden::Internal { module, file } => {
                *diagnostic = Diagnostic::error(
                    "B0803",
                    diagnostic.span,
                    format!("`{name}` is internal to module `{module}`"),
                )
                .label("not `public`")
                .help(format!("mark it `public` in {} to use it from another module", shown(file)))
                .toolchain(SPEC);
            }
            Hidden::Private { file } => {
                *diagnostic = Diagnostic::error(
                    "B0804",
                    diagnostic.span,
                    format!("`{name}` is private to {}", shown(file)),
                )
                .label("`private` items are seen only by their file")
                .help("drop `private` to share it with the module's other files")
                .toolchain(SPEC);
            }
            Hidden::NotImported { module, declared, target } => {
                diagnostic.help = Some(if *declared {
                    format!("`{name}` is in module `{module}`: add `import {module}`")
                } else {
                    format!(
                        "`{name}` is in module `{module}`: add `import {module}`, and \"{module}\" to the dependencies of `{target}` in Package.bloom"
                    )
                });
            }
        }
    }
}

#[derive(Debug, Clone)]
enum Offer {
    Bloom { file: PathBuf, module: String, own: bool },
    Runtime { specifier: &'static str, module: String },
}

impl Offer {
    fn is_std(&self) -> bool {
        match self {
            Offer::Bloom { file, .. } => crate::stdlib::contains(file),
            Offer::Runtime { module, .. } => module == crate::stdlib::MODULE,
        }
    }

    fn module(&self) -> &str {
        match self {
            Offer::Bloom { module, .. } | Offer::Runtime { module, .. } => module,
        }
    }
}

#[derive(Debug)]
struct Imported {
    name: String,
    source: Source,
}

#[derive(Debug)]
enum Source {
    Target(usize),
    Known(&'static KnownPackage),
}

/// `import Name` / `import Package.Name`, as written.
#[derive(Debug, Clone)]
pub struct ModuleImport {
    pub segments: Vec<Ident>,
    pub span: Span,
}

fn resolve_import(
    graph: &PackageGraph,
    index: usize,
    import: &ModuleImport,
    out: &mut Resolution,
) -> Option<Imported> {
    let manifest = &graph.manifest;
    let target = &manifest.targets[index];
    let mut segments: Vec<&str> = import.segments.iter().map(|s| s.name.as_str()).collect();
    let span = import
        .segments
        .first()
        .map_or(import.span, |s| s.span)
        .to(import.segments.last().map_or(import.span, |s| s.span));
    if segments.len() > 1 && segments[0] == manifest.name {
        segments.remove(0);
    }
    let path = segments.join(".");
    if segments.len() != 1 {
        out.diagnostics.push(
            Diagnostic::error("B0801", span, format!("no module `{path}`"))
                .label("a module is `Name` or `Package.Name`")
                .help(format!(
                    "modules of this package are imported as `import {}.Name` or `import Name`",
                    manifest.name
                ))
                .toolchain(SPEC),
        );
        return None;
    }
    let name = segments[0];
    if name == target.name {
        out.diagnostics.push(
            Diagnostic::error("B0801", span, format!("`{name}` is this file's own module"))
                .label("its names are already in scope")
                .help("remove the import")
                .toolchain(SPEC),
        );
        return None;
    }
    if let Some(t) = graph.target(name) {
        let other = &manifest.targets[t];
        if matches!(other.kind, TargetKind::App | TargetKind::Tests) {
            out.diagnostics.push(
                Diagnostic::error("B0802", span, format!("`{name}` is an `.{}` target", other.kind.word()))
                    .label("nothing imports an app or a test target")
                    .help(format!("move what is shared into a `.module` that `{}` depends on", target.name))
                    .toolchain(SPEC),
            );
            return None;
        }
        if !target.dependencies.iter().any(|(d, _)| d == name) {
            out.diagnostics.push(
                Diagnostic::error(
                    "B0802",
                    span,
                    format!("`{}` does not depend on module `{name}`", target.name),
                )
                .label("not in its dependencies")
                .help(format!(
                    "add \"{name}\" to `.{}(\"{}\", dependencies: […])` in Package.bloom",
                    target.kind.word(),
                    target.name
                ))
                .toolchain(SPEC),
            );
            return None;
        }
        return Some(Imported { name: name.to_string(), source: Source::Target(t) });
    }
    if let Some(known) = known_package(name) {
        let declared = name == "Bloom"
            || manifest.dependencies.iter().any(|d| d.name == name)
            || target.dependencies.iter().any(|(d, _)| d == name);
        if !declared {
            out.diagnostics.push(
                Diagnostic::error("B0802", span, format!("the package does not depend on `{name}`"))
                    .label("not in Package.bloom's dependencies")
                    .help(format!("run `bloom add {name}`"))
                    .toolchain(SPEC),
            );
            return None;
        }
        return Some(Imported { name: name.to_string(), source: Source::Known(known) });
    }
    let candidates: Vec<&str> = manifest
        .targets
        .iter()
        .map(|t| t.name.as_str())
        .chain(package::KNOWN_PACKAGES.iter().map(|k| k.name))
        .collect();
    let help = closest(name, candidates.iter().copied())
        .map(|n| format!("did you mean `{n}`?"))
        .unwrap_or_else(|| {
            format!("declare it in Package.bloom: `.module(\"{name}\")` with its files in Sources/{name}/")
        });
    out.diagnostics.push(
        Diagnostic::error("B0801", span, format!("no module `{name}`"))
            .label("not a target of this package or a package it depends on")
            .help(help)
            .toolchain(SPEC),
    );
    None
}

/// `Foreign<"…">` written in an app module: TS types cross only in binding modules.
fn foreign_types(source: &str) -> Vec<Diagnostic> {
    let tokens = lexer::lex(source, 0, source.len()).tokens;
    tokens
        .windows(2)
        .filter(|w| matches!(&w[0].tok, Tok::Ident(n) if n == "Foreign") && w[1].tok == Tok::P(P::Lt))
        .map(|w| {
            Diagnostic::error("B0822", w[0].span, "an app module names no TS type")
                .label("`Foreign` is for binding modules")
                .help("give the value a Bloom type, and declare the crossing in a binding module (`bloom bind`)")
                .toolchain(SPEC)
        })
        .collect()
}

fn string_import(import: &Import) -> Diagnostic {
    let source = &import.source;
    if matches!(&import.kind, ImportKind::Namespace(ns) if ns.name.starts_with("__extern")) {
        return Diagnostic::error("B0806", import.source_span, "an `extern module` belongs to a binding module")
            .label("this module is an app module")
            .help(format!(
                "move it to Bindings/<Name>/, declared as `.bindings(\"<Name>\", npm: \"{source}@<version>\")` (`bloom bind {source}` writes both)"
            ))
            .toolchain(SPEC);
    }
    let help = if source.starts_with('.') || source.starts_with('@') && source.contains("/src") {
        "import the module that holds it by name (`import Posts`), or, while migrating, compile with `--allow-ts-imports`".to_string()
    } else {
        let (package, _) = package::split_npm_spec(source);
        format!("generate a binding module with `bloom bind {package}` and `import` it by name")
    };
    Diagnostic::error("B0806", import.source_span, format!("an app module does not import \"{source}\""))
        .label("string-path imports are for binding modules")
        .help(help)
        .toolchain(SPEC)
}

/// Every name the file reads, with the span of its first use: an identifier
/// that is not a member (`.name`), a label (`name:`) or a declaration's name.
/// The member names written after `.` or `?.` (`x.padded(…)`, `T.m`), at their first use.
fn member_names(source: &str) -> BTreeMap<String, Span> {
    fn scan(source: &str, start: usize, end: usize, out: &mut BTreeMap<String, Span>) {
        let tokens = lexer::lex(source, start, end).tokens;
        for (i, token) in tokens.iter().enumerate() {
            match &token.tok {
                Tok::Ident(name)
                    if i > 0 && matches!(tokens[i - 1].tok, Tok::P(P::Dot) | Tok::P(P::QuestionDot)) =>
                {
                    out.entry(name.clone()).or_insert(token.span);
                }
                Tok::Str { parts, .. } => {
                    for part in parts {
                        if let lexer::RawPart::Interp(span) = part {
                            scan(source, span.start as usize, span.end as usize, out);
                        }
                    }
                }
                _ => {}
            }
        }
    }
    let mut out = BTreeMap::new();
    scan(source, 0, source.len(), &mut out);
    out
}

/// The types named after `as` (`e as? HTTPError`, `catch let e as HTTPError`), at their first.
fn cast_targets(source: &str) -> BTreeMap<String, Span> {
    let tokens = lexer::lex(source, 0, source.len()).tokens;
    let mut out = BTreeMap::new();
    for (i, token) in tokens.iter().enumerate() {
        if !matches!(&token.tok, Tok::Kw(kw) if kw.word() == "as") {
            continue;
        }
        let next = match tokens.get(i + 1).map(|t| &t.tok) {
            Some(Tok::P(P::Question)) => tokens.get(i + 2),
            _ => tokens.get(i + 1),
        };
        if let Some(lexer::Token { tok: Tok::Ident(name), span, .. }) = next {
            out.entry(name.clone()).or_insert(*span);
        }
    }
    out
}

pub fn free_names(source: &str) -> Vec<(String, Span)> {
    let mut seen = BTreeSet::new();
    let mut out = Vec::new();
    names_in(source, 0, source.len(), &mut seen, &mut out);
    out.sort_by_key(|(_, span)| span.start);
    out
}

fn names_in(
    source: &str,
    start: usize,
    end: usize,
    seen: &mut BTreeSet<String>,
    out: &mut Vec<(String, Span)>,
) {
    let tokens = lexer::lex(source, start, end).tokens;
    for (i, token) in tokens.iter().enumerate() {
        let name = match &token.tok {
            Tok::Ident(name) => name,
            Tok::Str { parts, .. } => {
                // `"\(name)"`: the names inside an interpolation.
                for part in parts {
                    if let lexer::RawPart::Interp(span) = part {
                        names_in(source, span.start as usize, span.end as usize, seen, out);
                    }
                }
                continue;
            }
            _ => continue,
        };
        let previous = i.checked_sub(1).map(|p| &tokens[p].tok);
        if matches!(previous, Some(Tok::P(P::Dot | P::QuestionDot))) {
            continue;
        }
        if matches!(previous, Some(Tok::Kw(kw)) if kw.word() == "import") {
            continue;
        }
        if seen.insert(name.clone()) {
            out.push((name.clone(), token.span));
        }
    }
}

/// The names a runtime package exports.
fn runtime_exports(from: &Path, known: &KnownPackage, options: &Options) -> Vec<String> {
    let specifier = match known.specifier {
        Some("bloom/data") => "@oxy.so/bloom-data",
        Some("bloom/router") => "@oxy.so/bloom-language/router",
        _ => known.npm,
    };
    exports_of(from, specifier, options)
}

/// The names the TS module `specifier` (resolved from `from`) exports, through `export *`.
pub(crate) fn exports_of(from: &Path, specifier: &str, options: &Options) -> Vec<String> {
    let mut out = BTreeSet::new();
    let mut queue: Vec<(PathBuf, String, usize)> = vec![(from.to_path_buf(), specifier.to_string(), 0)];
    let mut visited = BTreeSet::new();
    while let Some((from, specifier, depth)) = queue.pop() {
        let Some(path) = crate::ts::resolve(&from, &specifier, options) else { continue };
        if depth > 8 || !visited.insert(path.clone()) {
            continue;
        }
        let Some(ts) = crate::ts::read(&path) else { continue };
        out.extend(ts.exports.keys().cloned());
        for star in &ts.stars {
            queue.push((path.clone(), star.clone(), depth + 1));
        }
    }
    out.into_iter().collect()
}

/// The platforms a file may be written for (`X.native.bloom`, Metro's platform extensions).
pub const PLATFORMS: &[&str] = &["native", "ios", "android", "web"];

/// `dir/X` for a platform file `dir/X.<platform>.bloom`.
pub fn platform_base(path: &Path) -> Option<PathBuf> {
    let stem = path.file_name()?.to_str()?.strip_suffix(".bloom")?;
    let (base, platform) = stem.rsplit_once('.')?;
    (PLATFORMS.contains(&platform) && !base.is_empty()).then(|| path.with_file_name(base))
}

/// Whether `a` and `b` are one module's alternatives for different platforms
/// (`X.native.bloom` and `X.web.bloom`, or either beside the default `X.bloom`).
fn alternatives(a: &Path, b: &Path) -> bool {
    let key = |p: &Path| platform_base(p).or_else(|| p.to_str()?.strip_suffix(".bloom").map(PathBuf::from));
    (platform_base(a).is_some() || platform_base(b).is_some()) && key(a).is_some() && key(a) == key(b)
}

/// Adds `offer` for `name`, once for a set of platform alternatives.
fn offer(offered: &mut BTreeMap<String, Vec<Offer>>, name: &str, offer: Offer) {
    let offers = offered.entry(name.to_string()).or_default();
    if let Offer::Bloom { file, .. } = &offer
        && offers.iter().any(|o| matches!(o, Offer::Bloom { file: other, .. } if alternatives(file, other)))
    {
        return;
    }
    offers.push(offer);
}

/// `./Row.bloom` or `../Posts/Row.bloom`: `to` from the directory `from`.
fn relative_specifier(from: &Path, to: &Path) -> String {
    let from: Vec<Component> = from.components().collect();
    let to_parts: Vec<Component> = to.components().collect();
    let common = from.iter().zip(&to_parts).take_while(|(a, b)| a == b).count();
    let mut out = String::new();
    if common == from.len() {
        out.push_str("./");
    }
    for _ in common..from.len() {
        out.push_str("../");
    }
    let rest: Vec<String> =
        to_parts[common..].iter().map(|c| c.as_os_str().to_string_lossy().into_owned()).collect();
    out.push_str(&rest.join("/"));
    out
}

fn display(path: &Path, root: &Path) -> String {
    path.strip_prefix(root).unwrap_or(path).display().to_string()
}

/// A built-in type whose codec a `<T: Codable>` call may pass without naming it.
fn builtin_codec(owner: &str) -> Option<()> {
    matches!(owner, "String" | "Int" | "Double" | "Bool" | "Array" | "Optional" | "Dictionary").then_some(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn relative_specifiers() {
        let s = |a: &str, b: &str| relative_specifier(Path::new(a), Path::new(b));
        assert_eq!(s("/p/Sources/Feed", "/p/Sources/Feed/Row.bloom"), "./Row.bloom");
        assert_eq!(s("/p/Sources/Feed", "/p/Sources/Posts/Post.bloom"), "../Posts/Post.bloom");
        assert_eq!(
            s("/p/Tests/FeedTests", "/p/Bindings/Sentry/Sentry.bloom"),
            "../../Bindings/Sentry/Sentry.bloom"
        );
    }

    #[test]
    fn free_names_skip_members_and_imports() {
        let names: Vec<String> = free_names("import Posts\nview A { Text(post.title).padding(\"md\") }")
            .into_iter()
            .map(|(n, _)| n)
            .collect();
        assert_eq!(names, ["A", "Text", "post"]);
    }
}
