//! bloomc's core: the `.bloom` language front end and its emitter.
//!
//! `.bloom` source is lexed and parsed ([`parse`]) into a lossless tree
//! ([`ast`], comments in [`ast::Comments`]), resolved and type-checked
//! ([`check`]), held to the chain rules the embedded language's pass holds
//! too (`bloom_language_compiler::rules`, fed from this tree by [`chains`]),
//! and emitted as typed TypeScript that calls the embedded language
//! (`@oxy.so/bloom-language`), with its static chains already hoisted, so the
//! embedded pass has nothing left to do on it ([`compile`]).

pub mod analysis;
pub mod ast;
pub mod bindgen;
pub mod bloomui;
mod chains;
mod check;
mod codable;
pub mod diagnostic;
mod emit;
mod extensions;
mod externs;
pub mod i18n;
#[path = "icons.generated.rs"]
pub mod icons;
mod lexer;
mod model;
pub mod native;
pub mod modules;
pub mod package;
mod parser;
mod routes;
mod sourcemap;
pub mod stdlib;
#[rustfmt::skip]
#[path = "swift_tokens.generated.rs"]
mod swift_tokens;
mod testing;
mod ts;
mod types;
mod ui;
mod visibility;

use std::collections::BTreeMap;
use std::path::PathBuf;

pub use analysis::{Analysis, Definition, DefinitionKind, DefinitionOrigin, MemberInfo, MemberKind};
pub use ast::{Comments, File as Ast, Span};
pub use diagnostic::{Diagnostic, Label, Severity};

/// The language's keywords (spec section 2), for editors and highlighters.
pub const KEYWORDS: &[&str] = lexer::KEYWORDS;

/// What a compile needs from its host. Small on purpose.
#[derive(Debug, Clone, Default)]
pub struct Options {
    /// The project root: where `paths` targets and `node_modules` are looked up.
    pub root: Option<PathBuf>,
    /// TypeScript `paths`: a pattern (`@/*`) to its targets (`packages/frontend/*`),
    /// relative to `root`.
    pub paths: BTreeMap<String, Vec<String>>,
    /// A development build: lists are frozen in dev (spec 4.1), and names are kept readable.
    pub dev: bool,
    /// The app's Expo Router folder (relative to `root`), whose files are the routes
    /// `navigate` is checked against (spec 9). Without it, `app/` or `src/app/` under
    /// `root`; without either, routes are not checked.
    pub app: Option<PathBuf>,
    /// The file is one of a directory module's (2.0): its `internal` names are exported for
    /// the module's other files. Off, a file is its own module.
    pub modules: bool,
    /// The package root (the directory with `Package.bloom`). Without it, the
    /// nearest one above the file; without one, the file is a 0.x file.
    pub package: Option<PathBuf>,
    /// The migration mode: app modules may import TS by path (`--allow-ts-imports`).
    pub allow_ts_imports: bool,
}

/// A compiled `.bloom` module.
#[derive(Debug, Clone)]
pub struct Output {
    /// The TypeScript module (empty when there are errors).
    pub code: String,
    /// Source map (JSON, v3) from `code` back to the `.bloom` source.
    pub map: Option<String>,
    /// The text of `Name.d.bloom.ts`: what TypeScript importers see.
    pub dts: Option<String>,
    /// Errors: the module does not compile.
    pub diagnostics: Vec<Diagnostic>,
    /// Warnings: reported, and the module compiles.
    pub warnings: Vec<Diagnostic>,
    /// Every file the compile read (imported `.bloom` modules, TS declarations
    /// through re-exports, the `tsconfig.json` that resolved them): a cache key.
    pub dependencies: Vec<PathBuf>,
}

/// The types the checker found, by span (for hover), and its diagnostics.
#[derive(Debug, Clone, Default)]
pub struct Checked {
    /// Each expression's and binding's span with its type, as Bloom writes it.
    pub types: Vec<(Span, String)>,
    pub diagnostics: Vec<Diagnostic>,
    pub warnings: Vec<Diagnostic>,
    /// Every file the check read (see [`Output::dependencies`]).
    pub dependencies: Vec<PathBuf>,
}

/// Parses `source`: the tree, the comments and the syntax errors (rendered).
/// Parsing recovers at item, statement and closing-brace boundaries, so the
/// tree is complete even with errors (unreadable parts are `ExprKind::Error`).
/// The internal and private types of `source` that its `public` declarations name (B0108).
pub fn exposed_types(source: &str) -> Vec<String> {
    let (file, _, _) = parser::parse(source);
    visibility::exposed(&file, source)
}

pub fn parse(source: &str, filename: &str) -> (Ast, Comments, Vec<Diagnostic>) {
    let (file, comments, mut diagnostics) = parser::parse(source);
    // The syntax errors; a 0.x form's deprecation (a warning) is the checker's to report.
    diagnostics.retain(|d| d.severity == Severity::Error);
    for diagnostic in &mut diagnostics {
        codable::anchor(diagnostic);
        diagnostic.render(source, filename);
    }
    (file, comments, diagnostics)
}

/// Parses and checks `source`, without emitting.
pub fn check(source: &str, filename: &str, options: &Options) -> Checked {
    ts::next_epoch();
    codable::reset();
    let (mut file, syntax) = lowered(source);
    let resolution = modules::prepare(&mut file, source, filename, options);
    let module_options = for_module(&resolution, options);
    let options = module_options.as_ref().unwrap_or(options);
    // A module's file is read by its absolute path: its root is the build directory.
    let absolute = resolution.in_module.then(|| modules::absolute(std::path::Path::new(filename)));
    let at = absolute.as_ref().map(|p| p.to_string_lossy().into_owned());
    let at = at.as_deref().unwrap_or(filename);
    let mut result = check::check(&file, source, at, options);
    rules(&file, source, &mut result);
    let (mut errors, mut warnings) = merge(syntax, std::mem::take(&mut result.diagnostics));
    resolved(resolution, &mut errors, &mut warnings, &mut result.dependencies, options);
    for diagnostic in errors.iter_mut().chain(warnings.iter_mut()) {
        codable::anchor(diagnostic);
        diagnostic.render(source, filename);
    }
    let dependencies = std::mem::take(&mut result.dependencies).into_iter().collect();
    Checked { types: result.types(source), diagnostics: errors, warnings, dependencies }
}

/// What other files see of the `.bloom` file `source`, as text (see [`check::interface`]):
/// its visible declarations' types and signatures, one per line, each starting with
/// `public` (other modules see it) or `internal` (only its own module's other files do).
/// A build that keys a file's importers on the lines they see rechecks them only when
/// those change: a body, a comment or a private item changes none.
pub fn interface(source: &str, filename: &str, options: &Options) -> String {
    ts::next_epoch();
    let (mut file, _, _) = parser::parse(source);
    let resolution = modules::prepare(&mut file, source, filename, options);
    let module_options = for_module(&resolution, options);
    let options = module_options.as_ref().unwrap_or(options);
    let path = match resolution.in_module {
        true => modules::absolute(std::path::Path::new(filename)),
        false => PathBuf::from(filename),
    };
    check::interface(&file, source, &path, options)
}

/// Parses and checks `source` for an editor: its definitions and references,
/// scopes, members and expected types, with the diagnostics of [`check`].
pub fn analyze(source: &str, filename: &str, options: &Options) -> Analysis {
    ts::next_epoch();
    codable::reset();
    let (mut file, syntax) = lowered(source);
    let resolution = modules::prepare(&mut file, source, filename, options);
    let module_options = for_module(&resolution, options);
    let options = module_options.as_ref().unwrap_or(options);
    // A module's file is read by its absolute path: its root is the build directory.
    let absolute = resolution.in_module.then(|| modules::absolute(std::path::Path::new(filename)));
    let at = absolute.as_ref().map(|p| p.to_string_lossy().into_owned());
    let at = at.as_deref().unwrap_or(filename);
    let (mut result, expected, path) = check::check_recording(&file, source, at, options);
    rules(&file, source, &mut result);
    let (mut errors, mut warnings) = merge(syntax, std::mem::take(&mut result.diagnostics));
    resolved(resolution, &mut errors, &mut warnings, &mut result.dependencies, options);
    for diagnostic in errors.iter_mut().chain(warnings.iter_mut()) {
        codable::anchor(diagnostic);
        diagnostic.render(source, filename);
    }
    let mut analysis = analysis::build(&file, source, &result, expected, &path, options);
    analysis.diagnostics = errors;
    analysis.warnings = warnings;
    analysis.dependencies = std::mem::take(&mut result.dependencies).into_iter().collect();
    analysis
}

/// The files compiling `source` reads (see [`Output::dependencies`]), without emitting.
pub fn dependencies(source: &str, filename: &str, options: &Options) -> Vec<PathBuf> {
    check(source, filename, options).dependencies
}

/// Forgets what was read from `path` (a TS file or `tsconfig.json` an editor changed).
/// Files are also checked against the disk (modified time and length) once per compile.
pub fn invalidate(path: &std::path::Path) {
    ts::invalidate(path);
    check::forget(Some(path));
}

/// Forgets every TS summary this thread has read.
pub fn clear_caches() {
    ts::clear_caches();
    routes::clear();
    modules::clear();
    check::forget(None);
}

/// Compiles one `.bloom` module to TypeScript.
pub fn compile(source: &str, filename: &str, options: &Options) -> Output {
    ts::next_epoch();
    codable::reset();
    let (mut file, syntax) = lowered(source);
    let resolution = modules::prepare(&mut file, source, filename, options);
    let module_options = for_module(&resolution, options);
    let options = module_options.as_ref().unwrap_or(options);
    // A module's file is read by its absolute path: its root is the build directory.
    let absolute = resolution.in_module.then(|| modules::absolute(std::path::Path::new(filename)));
    let at = absolute.as_ref().map(|p| p.to_string_lossy().into_owned());
    let at = at.as_deref().unwrap_or(filename);
    let mut checked = check::check_for_emit(&file, source, at, options);
    rules(&file, source, &mut checked);
    let (mut errors, mut warnings) = merge(syntax, std::mem::take(&mut checked.diagnostics));
    resolved(resolution, &mut errors, &mut warnings, &mut checked.dependencies, options);
    let dependencies = std::mem::take(&mut checked.dependencies).into_iter().collect();
    let mut output = Output {
        code: String::new(),
        map: None,
        dts: None,
        diagnostics: Vec::new(),
        warnings: Vec::new(),
        dependencies,
    };
    if errors.is_empty() {
        let emitted = emit::emit(&file, &checked, source, at, options);
        errors.extend(emitted.diagnostics);
        if errors.is_empty() {
            output.map = Some(emitted.map.to_json(filename, source, &emitted.code));
            output.code = emitted.code;
            output.dts = Some(emitted.dts);
        }
    }
    for diagnostic in errors.iter_mut().chain(warnings.iter_mut()) {
        if diagnostic.rendered.is_empty() {
            codable::anchor(diagnostic);
            diagnostic.render(source, filename);
        }
    }
    output.diagnostics = errors;
    output.warnings = warnings;
    output
}

/// `source` parsed, with its 2.0 type members lowered for the checker (`extensions`).
fn lowered(source: &str) -> (Ast, Vec<Diagnostic>) {
    let (mut file, _, syntax) = parser::parse(source);
    extensions::lower(&mut file);
    (file, syntax)
}

/// The chain rules (glass, toolbars, labels, choices), once the module checks:
/// on a module with type errors they would be about what failed to resolve.
fn rules(file: &Ast, source: &str, result: &mut check::CheckResult) {
    result.diagnostics.extend(visibility::check(file, source));
    if result.diagnostics.iter().all(|d| d.severity != Severity::Error) {
        let found = chains::check(file, result);
        result.diagnostics.extend(found);
    }
}

/// A directory module's options: `internal` names exported for the module's
/// other files, and TS imports (binding modules, runtime packages) resolved in
/// the package's generated build directory once it is installed.
fn for_module(resolution: &modules::Resolution, options: &Options) -> Option<Options> {
    if !resolution.in_module {
        return None;
    }
    let build = resolution.reads.first().and_then(|m| m.parent()).map(|r| r.join(".bloom/build"));
    let root = build.filter(|b| b.join("node_modules").is_dir()).or_else(|| options.root.clone());
    Some(Options { modules: true, root, ..options.clone() })
}

/// The module resolution's findings beside the checker's: its errors, why a
/// name the checker could not find is not visible, and the files it read.
fn resolved(
    resolution: modules::Resolution,
    errors: &mut Vec<Diagnostic>,
    warnings: &mut Vec<Diagnostic>,
    dependencies: &mut std::collections::BTreeSet<PathBuf>,
    options: &Options,
) {
    let root = options
        .package
        .clone()
        .or_else(|| resolution.reads.first().and_then(|m| m.parent().map(PathBuf::from)));
    modules::explain(&resolution, errors, root.as_deref());
    for diagnostic in resolution.diagnostics.iter().cloned() {
        if diagnostic.severity == Severity::Error {
            errors.push(diagnostic)
        } else {
            warnings.push(diagnostic)
        }
    }
    if !resolution.diagnostics.is_empty() {
        errors.sort_by_key(|d| d.span.start);
    }
    // The test runtime has no declarations to read: its names are `Foreign` on purpose.
    warnings.retain(|w| !(w.code == "B0602" && w.message.contains(testing::RUNTIME)));
    dependencies.extend(resolution.reads.iter().cloned());
}

/// Syntax errors and the checker's findings, as errors and warnings. With a
/// syntax error the checker's errors are left out: they would be about the
/// parser's recovery, and one typo is one error.
fn merge(syntax: Vec<Diagnostic>, checked: Vec<Diagnostic>) -> (Vec<Diagnostic>, Vec<Diagnostic>) {
    let (syntax, deprecations): (Vec<_>, Vec<_>) =
        syntax.into_iter().partition(|d| d.severity == Severity::Error);
    let has_syntax = !syntax.is_empty();
    let (errors, mut warnings): (Vec<_>, Vec<_>) =
        checked.into_iter().partition(|d| d.severity == Severity::Error);
    warnings.splice(0..0, deprecations);
    if has_syntax { (syntax, warnings) } else { (errors, warnings) }
}
