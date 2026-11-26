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
mod chains;
mod check;
pub mod diagnostic;
mod emit;
mod lexer;
mod parser;
mod routes;
mod sourcemap;
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
pub fn parse(source: &str, filename: &str) -> (Ast, Comments, Vec<Diagnostic>) {
    let (file, comments, mut diagnostics) = parser::parse(source);
    for diagnostic in &mut diagnostics {
        diagnostic.render(source, filename);
    }
    (file, comments, diagnostics)
}

/// Parses and checks `source`, without emitting.
pub fn check(source: &str, filename: &str, options: &Options) -> Checked {
    ts::next_epoch();
    let (file, _, syntax) = parser::parse(source);
    let mut result = check::check(&file, source, filename, options);
    rules(&file, source, &mut result);
    let (mut errors, mut warnings) = merge(syntax, std::mem::take(&mut result.diagnostics));
    for diagnostic in errors.iter_mut().chain(warnings.iter_mut()) {
        diagnostic.render(source, filename);
    }
    let dependencies = std::mem::take(&mut result.dependencies).into_iter().collect();
    Checked { types: result.types(source), diagnostics: errors, warnings, dependencies }
}

/// Parses and checks `source` for an editor: its definitions and references,
/// scopes, members and expected types, with the diagnostics of [`check`].
pub fn analyze(source: &str, filename: &str, options: &Options) -> Analysis {
    ts::next_epoch();
    let (file, _, syntax) = parser::parse(source);
    let (mut result, expected, path) = check::check_recording(&file, source, filename, options);
    rules(&file, source, &mut result);
    let (mut errors, mut warnings) = merge(syntax, std::mem::take(&mut result.diagnostics));
    for diagnostic in errors.iter_mut().chain(warnings.iter_mut()) {
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
    check::forget(None);
}

/// Compiles one `.bloom` module to TypeScript.
pub fn compile(source: &str, filename: &str, options: &Options) -> Output {
    ts::next_epoch();
    let (file, _, syntax) = parser::parse(source);
    let mut checked = check::check_for_emit(&file, source, filename, options);
    rules(&file, source, &mut checked);
    let (mut errors, mut warnings) = merge(syntax, std::mem::take(&mut checked.diagnostics));
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
        let emitted = emit::emit(&file, &checked, source, filename, options);
        errors.extend(emitted.diagnostics);
        if errors.is_empty() {
            output.map = Some(emitted.map.to_json(filename, source, &emitted.code));
            output.code = emitted.code;
            output.dts = Some(emitted.dts);
        }
    }
    for diagnostic in errors.iter_mut().chain(warnings.iter_mut()) {
        if diagnostic.rendered.is_empty() {
            diagnostic.render(source, filename);
        }
    }
    output.diagnostics = errors;
    output.warnings = warnings;
    output
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

/// Syntax errors and the checker's findings, as errors and warnings. With a
/// syntax error the checker's errors are left out: they would be about the
/// parser's recovery, and one typo is one error.
fn merge(syntax: Vec<Diagnostic>, checked: Vec<Diagnostic>) -> (Vec<Diagnostic>, Vec<Diagnostic>) {
    let has_syntax = !syntax.is_empty();
    let (errors, warnings): (Vec<_>, Vec<_>) =
        checked.into_iter().partition(|d| d.severity == Severity::Error);
    if has_syntax { (syntax, warnings) } else { (errors, warnings) }
}
